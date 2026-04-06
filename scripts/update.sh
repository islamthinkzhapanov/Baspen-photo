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
echo ">>> Rebuilding Docker images..."
docker compose -f docker-compose.prod.yml build

# --- 3. Restart services (zero-downtime for app) ---
echo ">>> Restarting services..."
docker compose -f docker-compose.prod.yml up -d

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

echo ""
echo "=== Update complete! ==="
