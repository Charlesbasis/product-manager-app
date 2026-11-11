#!/usr/bin/env bash
#
# Online SQLite backup using the sqlite3 backup API. Unlike copying the file,
# this produces a consistent snapshot even while the app is writing (including
# when WAL mode is enabled).

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

DB="$(shared_db_path)"

[ -f "$DB" ] || die "database not found: $DB"
command -v sqlite3 >/dev/null 2>&1 || die "sqlite3 is required for backups"

ensure_dirs

if [ "${BACKUP_NO_LOCK:-0}" != "1" ]; then
    acquire_lock
fi

STAMP="$(date -u +%Y%m%d-%H%M%S)"
WORK="$BACKUP_DIR/.db-$STAMP.sqlite.tmp"
OUT="$BACKUP_DIR/db-$STAMP.sqlite.gz"

cleanup() { rm -f -- "$WORK"; }
trap cleanup EXIT

log "backing up $DB with sqlite3 .backup"
sqlite3 "$DB" ".backup '$WORK'"

INTEGRITY="$(sqlite3 "$WORK" 'PRAGMA integrity_check;')"
[ "$INTEGRITY" = "ok" ] || die "backup failed integrity_check: $INTEGRITY"

gzip -9 -c "$WORK" >"$OUT"
chmod 600 "$OUT"

log "wrote $OUT ($(du -h "$OUT" | cut -f1))"

# Keep only the most recent backups (count-based retention).
# This avoids accumulating dozens of backups on days with multiple deploys.
if [ -n "${BACKUP_RETENTION_COUNT:-}" ] && [ "${BACKUP_RETENTION_COUNT}" -gt 0 ]; then
    ls -1t "$BACKUP_DIR"/db-*.sqlite.gz 2>/dev/null | tail -n +"$((BACKUP_RETENTION_COUNT + 1))" | xargs -r rm -f --
fi
