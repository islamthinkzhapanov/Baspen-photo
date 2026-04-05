#!/bin/bash
# Baspen Photo — Backup Script
# Run via cron: 0 3 * * * /path/to/backup.sh
#
# Backs up:
# 1. PostgreSQL database (pg_dump)
# 2. MinIO photos (mc mirror)
#
# Retention: 30 days

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "[backup] Starting backup at $(date)"

# --- Database ---
echo "[backup] Dumping PostgreSQL..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST:-postgres}" \
  -U "${DB_USER:-baspen}" \
  -d "${DB_NAME:-baspen}" \
  --format=custom \
  --compress=9 \
  > "${BACKUP_DIR}/db_${DATE}.dump"

echo "[backup] DB dump: $(du -h "${BACKUP_DIR}/db_${DATE}.dump" | cut -f1)"

# --- MinIO (optional, requires mc CLI) ---
if command -v mc &> /dev/null; then
  echo "[backup] Syncing MinIO photos..."
  mc alias set baspen "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" --api S3v4
  mc mirror baspen/baspen-photos "${BACKUP_DIR}/photos_${DATE}/" --overwrite
  echo "[backup] MinIO sync complete"
else
  echo "[backup] mc CLI not found, skipping MinIO backup"
fi

# --- Cleanup old backups (30 days) ---
echo "[backup] Cleaning backups older than 30 days..."
find "${BACKUP_DIR}" -name "db_*.dump" -mtime +30 -delete
find "${BACKUP_DIR}" -name "photos_*" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

echo "[backup] Done at $(date)"
