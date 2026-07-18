# Database backups

Automatic daily SQLite backups for the Vultr deployment. Protects against local data corruption; backups live on the same server only (no off-site copy yet).

## Design

| Piece | Detail |
|---|---|
| Method | `sqlite3 .backup` (safe against a live DB) |
| Source | `DATABASE_URL` from `/var/www/time-box/.env` (currently `file:./prod.db`) |
| Destination | `/var/backups/time-box/time-box-YYYY-MM-DD.sqlite` |
| Schedule | Daily at 03:00 server time via cron |
| Retention | Last 7 days (older files pruned automatically) |
| Log | `/var/backups/time-box/backup.log` |
| Permissions | Backup dir `700`, backup files `600` |

## Scripts

- `scripts/backup-db.sh` — take a backup and prune old ones
- `scripts/restore-db.sh` — stop pm2, swap in a backup, restart (keeps a safety copy of the pre-restore DB)
- `scripts/install-backup-cron.sh` — idempotently install/update the cron entry

## One-time server setup

1. Ensure `sqlite3` is installed on the Vultr box:

   ```bash
   sudo apt-get update && sudo apt-get install -y sqlite3
   ```

2. After this change is deployed (so the scripts exist under `/var/www/time-box/scripts/`), add this line near the end of `/var/www/time-box/deploy.sh` (before the final `echo`):

   ```bash
   bash scripts/install-backup-cron.sh
   ```

   Full deploy script after the change:

   ```bash
   #!/bin/bash
   set -e

   # Load shell profile for pnpm/node PATH
   source ~/.bashrc 2>/dev/null || source ~/.profile 2>/dev/null || true

   # If using nvm, load it explicitly
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

   cd /var/www/time-box
   git pull origin main
   pnpm install --frozen-lockfile
   pnpm exec prisma generate --config ./prisma.config.ts
   pnpm exec prisma migrate deploy --config ./prisma.config.ts
   pnpm build
   pm2 restart time-box
   bash scripts/install-backup-cron.sh
   echo "Deploy complete!"
   ```

3. Run the installer once immediately (or wait for the next deploy):

   ```bash
   cd /var/www/time-box
   bash scripts/install-backup-cron.sh
   ```

4. Smoke-test a backup:

   ```bash
   bash /var/www/time-box/scripts/backup-db.sh
   ls -la /var/backups/time-box/
   tail /var/backups/time-box/backup.log
   ```

5. Dry-run restore against a *copy* (recommended once after setup). Preferred: restore into a temp path without touching prod — or restore for real only if you accept brief downtime:

   ```bash
   # List available backups
   ls /var/backups/time-box/time-box-*.sqlite

   # Interactive restore (stops pm2, asks for confirmation)
   bash /var/www/time-box/scripts/restore-db.sh time-box-YYYY-MM-DD.sqlite
   ```

## Restoring after corruption

```bash
# 1. Confirm the app is misbehaving / DB looks wrong
# 2. Pick a backup from before the corruption
ls -lt /var/backups/time-box/time-box-*.sqlite

# 3. Restore (prompts for confirmation; saves current DB aside as *.pre-restore-*)
bash /var/www/time-box/scripts/restore-db.sh time-box-YYYY-MM-DD.sqlite
```

The pre-restore safety copy is left next to `prod.db` so you can undo a bad restore if needed.

## Checking that cron is healthy

```bash
crontab -l | grep time-box-db-backup
tail -n 50 /var/backups/time-box/backup.log
```

If the log has no recent `backup complete` line, the job may have failed — check that `sqlite3` is still installed and that `prod.db` / `.env` still exist.
