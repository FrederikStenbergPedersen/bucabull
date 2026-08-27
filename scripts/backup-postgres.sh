#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/bucabull"
BACKUP_DIR="/var/backups/bucabull"
RETENTION_DAYS=14
STAMP=$(date +%F)

mkdir -p "$BACKUP_DIR"

docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T postgres \
  pg_dump -U bucabull bucabull | gzip > "$BACKUP_DIR/$STAMP.sql.gz"

find "$BACKUP_DIR" -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
