#!/usr/bin/env bash
# Restore time-box SQLite from a local backup. Stops pm2 during the swap.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/time-box}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/time-box}"
PM2_APP="${PM2_APP:-time-box}"

usage() {
  cat <<EOF
Usage: $(basename "$0") <backup-file>

Restore a backup into the live database.

  <backup-file>  Absolute path, or a filename under $BACKUP_DIR
                 (e.g. time-box-2026-07-17.sqlite)

Environment overrides:
  APP_DIR      (default: $APP_DIR)
  BACKUP_DIR   (default: $BACKUP_DIR)
  PM2_APP      (default: $PM2_APP)
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

resolve_db_path() {
  local env_file="$APP_DIR/.env"
  [[ -f "$env_file" ]] || die ".env not found at $env_file"

  local raw
  raw="$(grep -E '^DATABASE_URL=' "$env_file" | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  [[ -n "$raw" ]] || die "DATABASE_URL missing from $env_file"

  local path="${raw#file:}"

  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
  else
    printf '%s\n' "$APP_DIR/${path#./}"
  fi
}

resolve_backup_path() {
  local arg="$1"
  if [[ "$arg" = /* ]]; then
    printf '%s\n' "$arg"
  elif [[ -f "$arg" ]]; then
    printf '%s\n' "$(cd "$(dirname "$arg")" && pwd)/$(basename "$arg")"
  else
    printf '%s\n' "$BACKUP_DIR/$arg"
  fi
}

main() {
  [[ $# -eq 1 ]] || { usage; exit 1; }
  [[ "$1" != "-h" && "$1" != "--help" ]] || { usage; exit 0; }

  command -v pm2 >/dev/null 2>&1 || die "pm2 not found in PATH"
  command -v sqlite3 >/dev/null 2>&1 || die "sqlite3 not found in PATH"

  local backup
  backup="$(resolve_backup_path "$1")"
  [[ -f "$backup" ]] || die "backup not found: $backup"

  # Sanity-check the backup is a readable SQLite database before touching prod.
  sqlite3 "$backup" "SELECT 1;" >/dev/null || die "backup failed sqlite integrity probe: $backup"

  local db_path
  db_path="$(resolve_db_path)"

  local stamp
  stamp="$(date -u +'%Y-%m-%dT%H%M%SZ')"
  local safety_copy="${db_path}.pre-restore-${stamp}"

  echo "App:       $PM2_APP"
  echo "Live DB:   $db_path"
  echo "Backup:    $backup"
  echo "Safety:    $safety_copy"
  echo
  read -r -p "Stop pm2 and restore? [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { echo "Aborted."; exit 1; }

  echo "Stopping $PM2_APP..."
  pm2 stop "$PM2_APP"

  if [[ -f "$db_path" ]]; then
    cp -p "$db_path" "$safety_copy"
    chmod 600 "$safety_copy"
    echo "Saved current DB to $safety_copy"
  fi

  cp -p "$backup" "$db_path"
  chmod 600 "$db_path"
  echo "Restored $backup -> $db_path"

  echo "Starting $PM2_APP..."
  pm2 start "$PM2_APP"

  echo "Restore complete."
}

main "$@"
