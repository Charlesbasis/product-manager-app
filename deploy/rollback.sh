#!/usr/bin/env bash
#
# Re-point `current` at a previous release and verify it serves.
#
# This is a code rollback only. Database migrations are NOT reversed: SQLite
# must be restored from shared/backups if the older code cannot run against the
# current schema.
#
# Usage: rollback.sh [release-id]
#        (defaults to the release in the `previous` symlink)

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

TARGET_ID="${1:-}"

ensure_dirs
acquire_lock

if [ -z "$TARGET_ID" ]; then
    TARGET_ID="$(previous_release_id)"
fi

[ -n "$TARGET_ID" ] || die "no previous release recorded; pass a release id"
TARGET_DIR="$(release_path "$TARGET_ID")"
[ -d "$TARGET_DIR" ] || die "release not found: $TARGET_DIR"

for required in artisan vendor/autoload.php public/index.php public/build/manifest.json bootstrap/ssr/ssr.js ecosystem.config.cjs; do
    [ -f "$TARGET_DIR/$required" ] || die "rollback target is missing $required"
done

CURRENT_ID="$(current_release_id)"

if [ "$CURRENT_ID" = "$TARGET_ID" ]; then
    log "release $TARGET_ID is already current"
    release_lock
    exit 0
fi

log "rolling back from ${CURRENT_ID:-none} to $TARGET_ID"

ln -sfn "$SHARED_ENV" "$TARGET_DIR/.env"
ln -sfn "$SHARED_DIR/storage" "$TARGET_DIR/storage"
ln -sfn ../storage/app/public "$TARGET_DIR/public/storage"

publish_public "$TARGET_DIR" 1

if [ -n "$CURRENT_ID" ] && [ -d "$(release_path "$CURRENT_ID")" ]; then
    atomic_symlink "$(release_path "$CURRENT_ID")" "$BASE/previous"
fi

atomic_symlink "$TARGET_DIR" "$BASE/current"
log "current -> $TARGET_DIR"

pm2_start "$TARGET_DIR"

"$SCRIPT_DIR/health-check.sh" || die "rollback health check failed; inspect $TARGET_DIR"

release_lock

warn "code rolled back to $TARGET_ID"
warn "database changes are not reverted; restore shared/backups/db-*.sqlite.gz if the older code needs the old schema"
