#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/bucabull"
BACKUP_DIR="/var/backups/bucabull"
RETENTION_DAYS=14
STAMP=$(date +%F)

# Off-box destination is deliberately not hardcoded to a provider: set
# BACKUP_RCLONE_REMOTE in /etc/bucabull-backup.env to a remote configured
# via `rclone config` (S3-compatible, SFTP, B2, etc. all work the same
# way) and this script ships the dump there too. Leave it unset to keep
# backups local-only.
[ -f /etc/bucabull-backup.env ] && source /etc/bucabull-backup.env

mkdir -p "$BACKUP_DIR"

docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U bucabull bucabull | gzip > "$BACKUP_DIR/$STAMP.sql.gz"

find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
  rclone copy "$BACKUP_DIR/$STAMP.sql.gz" "$BACKUP_RCLONE_REMOTE"
  rclone delete --min-age "${RETENTION_DAYS}d" "$BACKUP_RCLONE_REMOTE"
fi
