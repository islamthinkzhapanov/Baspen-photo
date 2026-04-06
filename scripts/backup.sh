#!/bin/bash
# Baspen Photo — Backup Script
# Run via cron: 0 3 * * * /path/to/backup.sh
#
# Backs up:
# 1. PostgreSQL database (pg_dump)
# 2. MinIO photos (mc mirror)
# 3. Optional: encrypt with GPG
# 4. Optional: upload to offsite S3 bucket
#
# Retention: 30 days
#
# Environment variables:
#   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME — Postgres connection
#   S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY — MinIO (source photos)
#   BACKUP_DIR — local backup directory (default: /backups)
#   BACKUP_ENCRYPT_KEY — GPG recipient/key ID for encryption (optional)
#   BACKUP_S3_BUCKET — offsite S3 bucket for uploading backups (optional)
#   BACKUP_S3_ENDPOINT — offsite S3 endpoint (optional, for non-AWS)
#   BACKUP_S3_ACCESS_KEY, BACKUP_S3_SECRET_KEY — offsite S3 credentials (optional)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/db_${DATE}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[backup] Starting backup at $(date)"

# --- Database ---
echo "[backup] Dumping PostgreSQL..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST:-postgres}" \
  -U "${DB_USER:-baspen}" \
  -d "${DB_NAME:-baspen}" \
  --format=custom \
  --compress=9 \
  > "${DUMP_FILE}"

echo "[backup] DB dump: $(du -h "${DUMP_FILE}" | cut -f1)"

# --- Encrypt backup (optional, requires GPG) ---
if [ -n "${BACKUP_ENCRYPT_KEY:-}" ] && command -v gpg &> /dev/null; then
  echo "[backup] Encrypting backup with GPG..."
  gpg --batch --yes --recipient "${BACKUP_ENCRYPT_KEY}" \
    --output "${DUMP_FILE}.gpg" --encrypt "${DUMP_FILE}"
  rm -f "${DUMP_FILE}"
  DUMP_FILE="${DUMP_FILE}.gpg"
  echo "[backup] Encrypted: $(du -h "${DUMP_FILE}" | cut -f1)"
fi

# --- MinIO (optional, requires mc CLI) ---
if command -v mc &> /dev/null; then
  echo "[backup] Syncing MinIO photos..."
  mc alias set baspen "${S3_ENDPOINT}" "${S3_ACCESS_KEY}" "${S3_SECRET_KEY}" --api S3v4
  mc mirror baspen/baspen-photos "${BACKUP_DIR}/photos_${DATE}/" --overwrite
  echo "[backup] MinIO sync complete"
else
  echo "[backup] mc CLI not found, skipping MinIO backup"
fi

# --- Upload to offsite S3 (optional, requires aws CLI) ---
if [ -n "${BACKUP_S3_BUCKET:-}" ] && command -v aws &> /dev/null; then
  echo "[backup] Uploading to offsite S3: ${BACKUP_S3_BUCKET}..."

  S3_ARGS=()
  if [ -n "${BACKUP_S3_ENDPOINT:-}" ]; then
    S3_ARGS+=(--endpoint-url "${BACKUP_S3_ENDPOINT}")
  fi

  AWS_ACCESS_KEY_ID="${BACKUP_S3_ACCESS_KEY:-${AWS_ACCESS_KEY_ID:-}}" \
  AWS_SECRET_ACCESS_KEY="${BACKUP_S3_SECRET_KEY:-${AWS_SECRET_ACCESS_KEY:-}}" \
  aws s3 cp "${DUMP_FILE}" "s3://${BACKUP_S3_BUCKET}/db/$(basename "${DUMP_FILE}")" \
    "${S3_ARGS[@]}"

  echo "[backup] Offsite upload complete"
else
  echo "[backup] Offsite S3 not configured or aws CLI missing, skipping"
fi

# --- Cleanup old backups (30 days) ---
echo "[backup] Cleaning backups older than 30 days..."
find "${BACKUP_DIR}" -name "db_*.dump" -mtime +30 -delete
find "${BACKUP_DIR}" -name "db_*.dump.gpg" -mtime +30 -delete
find "${BACKUP_DIR}" -name "photos_*" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

echo "[backup] Done at $(date)"
