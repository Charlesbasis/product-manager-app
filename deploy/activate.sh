#!/usr/bin/env bash
#
# Activate a release that has already been extracted into releases/<id>.
#
# Order matters:
#   1. validate the release and wire shared state
#   2. back up SQLite, migrate, warm caches
#   3. publish hashed assets and the manifest (additive / atomic)
#   4. swap `current` atomically, then install the document-root shim
#   5. restart SSR, regenerate the sitemap, health check
#   6. prune old releases, or roll back automatically on failure
#
# Usage: activate.sh <release-id>

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

RELEASE_ID="${1:-}"
[ -n "$RELEASE_ID" ] || die "usage: activate.sh <release-id>"

require_php85

RELEASE_DIR="$(release_path "$RELEASE_ID")"
[ -d "$RELEASE_DIR" ] || die "release not found: $RELEASE_DIR"

ensure_dirs
acquire_lock

PREVIOUS_ID="$(current_release_id)"
PREVIOUS_DIR=""
if [ -n "$PREVIOUS_ID" ] && [ -d "$(release_path "$PREVIOUS_ID")" ]; then
    PREVIOUS_DIR="$(release_path "$PREVIOUS_ID")"
fi

CURRENT_SWAPPED=0

install_deploy_tooling() {
    local source_dir="$SCRIPT_DIR"
    if [ "$(readlink -f "$source_dir")" = "$(readlink -f "$DEPLOY_DIR")" ]; then
        return 0
    fi
    mkdir -p "$DEPLOY_DIR/public"
    local file
    for file in "$source_dir"/*.sh; do
        install -m 755 "$file" "$DEPLOY_DIR/$(basename "$file")"
    done
    install -m 644 "$source_dir/public/index.php" "$DEPLOY_DIR/public/index.php"
}

cleanup_on_error() {
    local status=$?
    trap - EXIT
    if [ "$status" -ne 0 ]; then
        warn "activation of $RELEASE_ID failed with status $status"
        release_lock
        if [ "$CURRENT_SWAPPED" = "1" ] && [ -n "$PREVIOUS_ID" ]; then
            warn "restoring previous release $PREVIOUS_ID"
            "$SCRIPT_DIR/rollback.sh" "$PREVIOUS_ID" ||
                warn "automatic rollback failed; run $DEPLOY_DIR/rollback.sh manually"
        elif [ "$CURRENT_SWAPPED" = "0" ]; then
            warn "the current symlink was not changed; the previous release is still serving"
        fi
    fi
    exit "$status"
}
trap cleanup_on_error EXIT

log "activating release $RELEASE_ID"

# 1. Release integrity -------------------------------------------------------
REQUIRED_FILES=(
    artisan
    vendor/autoload.php
    public/index.php
    public/.htaccess
    public/build/manifest.json
    bootstrap/ssr/ssr.js
    ecosystem.config.cjs
)

for required in "${REQUIRED_FILES[@]}"; do
    [ -f "$RELEASE_DIR/$required" ] || die "release is missing $required"
done

# A retried activation may have linked the shared env before failing later.
# A real .env inside the release is still a hard error.
if [ -L "$RELEASE_DIR/.env" ]; then
    rm -f "$RELEASE_DIR/.env"
elif [ -e "$RELEASE_DIR/.env" ]; then
    die "release must not contain an .env file"
fi

install_deploy_tooling

# 2. Shared state ------------------------------------------------------------
[ -f "$SHARED_ENV" ] || die "shared environment file not found: $SHARED_ENV"
chmod 600 "$SHARED_ENV" 2>/dev/null || warn "could not set mode 600 on $SHARED_ENV"

ln -sfn "$SHARED_ENV" "$RELEASE_DIR/.env"
ln -sfn "$SHARED_DIR/storage" "$RELEASE_DIR/storage"
ln -sfn ../storage/app/public "$RELEASE_DIR/public/storage"

# 3. Platform and package discovery -----------------------------------------
log "checking PHP platform requirements"
(
    cd "$RELEASE_DIR"
    "$PHP_BIN" -r 'require "vendor/autoload.php";'
)

if [ -n "${COMPOSER_BIN:-}" ] && [ -f "$COMPOSER_BIN" ]; then
    log "running composer check-platform-reqs with $PHP_BIN"
    platform_output="$(
        cd "$RELEASE_DIR"
        # Composer's shebang resolves /usr/bin/env php (8.3); invoke it through
        # the same 8.5 CLI that serves the application.
        "$PHP_BIN" "$COMPOSER_BIN" check-platform-reqs --no-dev 2>&1
    )" || {
        # config.platform.php is pinned to 8.2 so the lock file still resolves
        # for the legacy stack. One dependency (phpspreadsheet 1.x) also caps
        # PHP at <8.5, which the real CWP runtime exceeds. Ignore only that
        # upper-bound row; extension and minimum-version failures must still
        # abort the deploy.
        other_failures="$(printf '%s\n' "$platform_output" | grep 'failed' | grep -vE '^php[[:space:]]' || true)"
        if [ -n "$other_failures" ]; then
            printf '%s\n' "$platform_output" >&2
            die "composer platform requirements failed"
        fi
        warn "ignoring PHP upper-bound constraint reported by Composer (runtime is PHP 8.5)"
    }
fi

log "running package discovery"
(
    cd "$RELEASE_DIR"
    "$PHP_BIN" artisan package:discover --ansi --no-interaction
)

# 4. Database ----------------------------------------------------------------
BACKUP_NO_LOCK=1 "$SCRIPT_DIR/backup-sqlite.sh"

log "running migrations"
(
    cd "$RELEASE_DIR"
    "$PHP_BIN" artisan migrate --force --no-interaction
)

warn_pending_jobs

# 5. Caches ------------------------------------------------------------------
# Run each command separately: `php artisan optimize` can exit 0 even when a
# subtask fails, which would hide a broken route/view cache.
(
    cd "$RELEASE_DIR"
    "$PHP_BIN" artisan optimize:clear
)

for cache_command in config:cache event:cache route:cache view:cache; do
    log "warming $cache_command"
    (
        cd "$RELEASE_DIR"
        "$PHP_BIN" artisan "$cache_command"
    )
done

# 6. Publish static output, swap, then install the shim ----------------------
log "publishing public assets"
publish_public "$RELEASE_DIR" 0

if [ -n "$PREVIOUS_DIR" ]; then
    atomic_symlink "$PREVIOUS_DIR" "$BASE/previous"
fi

atomic_symlink "$RELEASE_DIR" "$BASE/current"
CURRENT_SWAPPED=1
install_shim_file
log "current -> $RELEASE_DIR"

# 7. SSR ---------------------------------------------------------------------
log "restarting PM2 (fork mode, single instance)"
pm2_start "$RELEASE_DIR"

# 8. Sitemap (the command writes to the served docroot, not the release) -----
if ! grep -qE '^[[:space:]]*SITEMAP_PATH=' "$SHARED_ENV"; then
    die "SITEMAP_PATH is not set in $SHARED_ENV; run deploy/server-setup.sh first"
fi

log "regenerating sitemap"
(
    cd "$RELEASE_DIR"
    "$PHP_BIN" artisan sitemap:generate
) || warn "sitemap regeneration failed; deploy continues"

# 9. Health ------------------------------------------------------------------
log "running health checks"
"$SCRIPT_DIR/health-check.sh" || die "post-activation health check failed"

# 10. Housekeeping -----------------------------------------------------------
prune_releases
prune_assets

trap - EXIT
release_lock
log "release $RELEASE_ID activated successfully"
