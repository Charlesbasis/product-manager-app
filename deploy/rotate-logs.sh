#!/usr/bin/env bash
#
# Copy-truncate PM2 logs that exceed PM2_LOG_MAX_BYTES and gzip the rotated
# copy. This replaces the pm2-logrotate module: installing a module spawns a
# second Node process, and on this host that competes for the account's
# 40-thread nproc cap and 1 GiB memory cgroup (see the README).
#
# PM2 keeps its log file descriptors open, so the active file is truncated in
# place (copytruncate) instead of being renamed; PM2 then keeps appending to the
# same inode and nothing is lost.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

LOG_DIR="${PM2_LOG_DIR:-$HOME/.pm2/logs}"
MAX_BYTES="${PM2_LOG_MAX_BYTES:-10485760}"
KEEP_DAYS="${PM2_LOG_KEEP_DAYS:-14}"

[ -d "$LOG_DIR" ] || {
    log "no PM2 log directory at $LOG_DIR"
    exit 0
}

shopt -s nullglob
rotated=0

for file in "$LOG_DIR"/*.log; do
    size="$(stat -c %s "$file" 2>/dev/null || printf '0')"
    [ "${size:-0}" -gt "$MAX_BYTES" ] || continue

    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    cp -p "$file" "$file.$stamp"
    : >"$file"
    gzip -f "$file.$stamp"
    log "rotated $file ($size bytes)"
    rotated=1
done

find "$LOG_DIR" -maxdepth 1 -name '*.log.*.gz' -mtime +"$KEEP_DAYS" -delete 2>/dev/null || true

if [ "$rotated" = "0" ]; then
    log "pm2 logs are below $MAX_BYTES bytes; nothing to rotate"
fi
