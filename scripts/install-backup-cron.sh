#!/usr/bin/env bash
# Idempotently install the daily time-box DB backup cron job.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/time-box}"
BACKUP_SCRIPT="$APP_DIR/scripts/backup-db.sh"
CRON_SCHEDULE="${CRON_SCHEDULE:-0 3 * * *}"
CRON_MARKER="# time-box-db-backup"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

[[ -f "$BACKUP_SCRIPT" ]] || die "backup script not found: $BACKUP_SCRIPT"
chmod +x "$BACKUP_SCRIPT" "$APP_DIR/scripts/restore-db.sh" "$APP_DIR/scripts/install-backup-cron.sh"

BACKUP_DIR="/var/backups/time-box"
if mkdir -p "$BACKUP_DIR" 2>/dev/null; then
  chmod 700 "$BACKUP_DIR"
elif command -v sudo >/dev/null 2>&1 && sudo mkdir -p "$BACKUP_DIR"; then
  # Deploy user often isn't root; grant ownership so cron (same user) can write.
  sudo chown "$(id -u):$(id -g)" "$BACKUP_DIR"
  sudo chmod 700 "$BACKUP_DIR"
else
  die "cannot create $BACKUP_DIR (try: sudo mkdir -p $BACKUP_DIR && sudo chown $(whoami) $BACKUP_DIR)"
fi

# Single cron line; marker comment lets us replace on every deploy without duplicates.
CRON_LINE="${CRON_SCHEDULE} ${BACKUP_SCRIPT} ${CRON_MARKER}"

existing="$(crontab -l 2>/dev/null || true)"
filtered="$(printf '%s\n' "$existing" | grep -vF "$CRON_MARKER" || true)"

{
  printf '%s\n' "$filtered"
  printf '%s\n' "$CRON_LINE"
} | sed '/^$/d' | crontab -

echo "Installed cron: $CRON_LINE"
crontab -l | grep -F "$CRON_MARKER" || die "cron install verification failed"
