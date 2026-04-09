#!/bin/bash
set -euo pipefail

# ===========================================
# Baspen Photo — First-time Deploy Script
# Run on a fresh Ubuntu 24.04 server
# ===========================================

DOMAIN="mytime.kz"
EMAIL="${CERTBOT_EMAIL:-admin@$DOMAIN}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Baspen Photo Deploy ==="
echo "Domain: $DOMAIN"
echo "Project: $PROJECT_DIR"
echo ""

# --- 1. Install Docker ---
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "Docker installed."
else
    echo ">>> Docker already installed."
fi

# --- 2. Check .env file ---
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo ""
    echo "ERROR: .env file not found!"
    echo "Copy the template and fill in your values:"
    echo ""
    echo "  cp .env.production.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi

echo ">>> .env file found."

# --- 3. Create required directories ---
mkdir -p "$PROJECT_DIR/nginx/ssl"

# --- 4. Get SSL certificate (first time) ---
if [ ! -d "$PROJECT_DIR/nginx/ssl/live/$DOMAIN" ]; then
    echo ">>> Getting SSL certificate for $DOMAIN..."
    echo ">>> Starting temporary nginx for ACME challenge..."

    # Create temporary nginx config for certbot
    cat > /tmp/nginx-certbot.conf << 'NGINX'
events { worker_connections 1024; }
http {
    server {
        listen 80;
        server_name _;
        location /.well-known/acme-challenge/ { root /var/www/certbot; }
        location / { return 200 'ok'; }
    }
}
NGINX

    # Start temporary nginx
    docker run -d --name certbot-nginx \
        -p 80:80 \
        -v "$PROJECT_DIR/nginx/ssl:/etc/nginx/ssl" \
        -v /tmp/nginx-certbot.conf:/etc/nginx/nginx.conf:ro \
        -v certbot-webroot:/var/www/certbot \
        nginx:1.27-alpine

    # Get certificate
    docker run --rm \
        -v "$PROJECT_DIR/nginx/ssl:/etc/letsencrypt" \
        -v certbot-webroot:/var/www/certbot \
        certbot/certbot certonly \
        --webroot -w /var/www/certbot \
        -d "$DOMAIN" -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos --no-eff-email

    # Stop temporary nginx
    docker stop certbot-nginx && docker rm certbot-nginx
    docker volume rm certbot-webroot 2>/dev/null || true

    echo "SSL certificate obtained."
else
    echo ">>> SSL certificate already exists."
fi

# --- 5. Build and start services ---
echo ">>> Building Docker images..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml build

echo ">>> Starting services..."
docker compose -f docker-compose.prod.yml up -d

# --- 6. Wait for PostgreSQL to be ready ---
echo ">>> Waiting for PostgreSQL..."
sleep 5
for i in $(seq 1 30); do
    if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U baspen &>/dev/null; then
        echo "PostgreSQL is ready."
        break
    fi
    echo "  waiting... ($i/30)"
    sleep 2
done

# --- 7. Run database migrations ---
echo ">>> Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T app node -e "
const { execSync } = require('child_process');
try {
    execSync('npx drizzle-kit migrate', { stdio: 'inherit', cwd: '/app' });
} catch(e) {
    console.log('Migration via drizzle-kit not available in standalone, trying direct SQL...');
}
"

# If drizzle-kit is not available in standalone, run migrations from host
if [ -d "$PROJECT_DIR/drizzle" ]; then
    echo ">>> Applying SQL migrations directly..."
    source "$PROJECT_DIR/.env"
    for migration in "$PROJECT_DIR"/drizzle/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "  Applying: $(basename "$migration")"
            docker compose -f docker-compose.prod.yml exec -T postgres \
                psql -U baspen -d baspen < "$migration" 2>/dev/null || true
        fi
    done
    # Also apply root-level migrations
    for migration in "$PROJECT_DIR"/drizzle/*.sql; do
        if [ -f "$migration" ]; then
            echo "  Applying: $(basename "$migration")"
            docker compose -f docker-compose.prod.yml exec -T postgres \
                psql -U baspen -d baspen < "$migration" 2>/dev/null || true
        fi
    done
fi

# --- 8. Create MinIO bucket ---
echo ">>> Creating MinIO bucket..."
sleep 3
docker compose -f docker-compose.prod.yml exec -T minio \
    mc alias set local http://localhost:9000 \
    "$(grep MINIO_ACCESS_KEY "$PROJECT_DIR/.env" | cut -d= -f2)" \
    "$(grep MINIO_SECRET_KEY "$PROJECT_DIR/.env" | cut -d= -f2)" 2>/dev/null || true

docker compose -f docker-compose.prod.yml exec -T minio \
    mc mb local/baspen-photos --ignore-existing 2>/dev/null || true

docker compose -f docker-compose.prod.yml exec -T minio \
    mc anonymous set download local/baspen-photos 2>/dev/null || true

# --- 9. Health check ---
echo ""
echo "=== Checking services ==="
services=("postgres" "redis" "minio" "app" "worker" "nginx" "bib-detector")
for svc in "${services[@]}"; do
    status=$(docker compose -f docker-compose.prod.yml ps --format '{{.Status}}' "$svc" 2>/dev/null || echo "not found")
    echo "  $svc: $status"
done

echo ""
echo "=== Deploy complete! ==="
echo ""
echo "Your site should be live at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Check: curl -I https://$DOMAIN"
echo "  2. Create admin user via the app"
echo "  3. Enable daily backups: docker compose -f docker-compose.prod.yml --profile backup run backup"
echo ""
