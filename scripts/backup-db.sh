#!/usr/bin/env bash
# Daily SQLite backup for time-box. Safe to run against a live DB via sqlite3 .backup.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/time-box}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/time-box}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
LOG_FILE="${BACKUP_DIR}/backup.log"

log() {
  local msg="[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] $*"
  mkdir -p "$BACKUP_DIR"
  echo "$msg" | tee -a "$LOG_FILE"
}

die() {
  log "ERROR: $*"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "required command not found: $1"
}

resolve_db_path() {
  local env_file="$APP_DIR/.env"
  [[ -f "$env_file" ]] || die ".env not found at $env_file"

  local raw
  raw="$(grep -E '^DATABASE_URL=' "$env_file" | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  [[ -n "$raw" ]] || die "DATABASE_URL missing from $env_file"

  # Strip Prisma/SQLite file: prefix if present.
  local path="${raw#file:}"

  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
  else
    # Relative paths (e.g. ./prod.db) are relative to APP_DIR.
    printf '%s\n' "$APP_DIR/${path#./}"
  fi
}

prune_old_backups() {
  find "$BACKUP_DIR" -maxdepth 1 -type f -name 'time-box-*.sqlite' -mtime +$((RETENTION_DAYS - 1)) -print -delete \
    | while read -r removed; do
        log "pruned: $removed"
      done
}

main() {
  require_cmd sqlite3
  require_cmd tee
  require_cmd find

  mkdir -p "$BACKUP_DIR"
  chmod 700 "$BACKUP_DIR"

  local db_path
  db_path="$(resolve_db_path)"
  [[ -f "$db_path" ]] || die "database file not found: $db_path"

  local stamp
  stamp="$(date -u +'%Y-%m-%d')"
  local dest="$BACKUP_DIR/time-box-${stamp}.sqlite"

  log "starting backup: $db_path -> $dest"
  sqlite3 "$db_path" ".backup '$dest'"
  chmod 600 "$dest"

  prune_old_backups
  log "backup complete: $dest ($(du -h "$dest" | cut -f1))"
}

main "$@"
