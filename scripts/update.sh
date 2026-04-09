#!/bin/bash
set -euo pipefail

# ===========================================
# Baspen Photo — Update Script
# Pull latest code, rebuild, restart
# ===========================================

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=== Baspen Photo Update ==="

# --- 1. Pull latest code ---
echo ">>> Pulling latest code..."
git pull

# --- 2. Rebuild images ---
if git diff HEAD~1 --name-only | grep -q '^bib-detector/'; then
    echo ">>> bib-detector changed, rebuilding all services..."
    docker compose -f docker-compose.prod.yml build
else
    echo ">>> Rebuilding app services only (bib-detector unchanged)..."
    docker compose -f docker-compose.prod.yml build app worker
fi

# --- 3. Restart services (zero-downtime for app) ---
echo ">>> Restarting services..."
docker compose -f docker-compose.prod.yml up -d

# Reload nginx to pick up new app container IP
echo ">>> Reloading nginx..."
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null || true

# --- 4. Apply any new migrations ---
echo ">>> Applying database migrations..."
for migration in "$PROJECT_DIR"/drizzle/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        docker compose -f docker-compose.prod.yml exec -T postgres \
            psql -U baspen -d baspen < "$migration" 2>/dev/null || true
    fi
done
for migration in "$PROJECT_DIR"/drizzle/*.sql; do
    if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        docker compose -f docker-compose.prod.yml exec -T postgres \
            psql -U baspen -d baspen < "$migration" 2>/dev/null || true
    fi
done

# --- 5. Clean up old images ---
echo ">>> Cleaning up old Docker images..."
docker image prune -f

# --- 6. Status ---
echo ""
echo "=== Services status ==="
docker compose -f docker-compose.prod.yml ps

# --- 7. Health check (wait up to 60s via nginx) ---
echo ">>> Checking app health..."
for i in $(seq 1 6); do
    sleep 10
    if curl -sfk https://localhost > /dev/null 2>&1 || curl -sf http://localhost > /dev/null 2>&1; then
        echo "App is healthy!"
        break
    fi
    if [ "$i" -eq 6 ]; then
        echo "WARNING: App health check failed after 60s"
        docker compose -f docker-compose.prod.yml logs --tail=20 app
        exit 1
    fi
    echo "  Waiting... (attempt $i/6)"
done

echo ""
echo "=== Update complete! ==="
