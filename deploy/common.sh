#!/usr/bin/env bash
#
# Shared helpers for the atomic-release deploy scripts.
#
# This file is sourced, never executed directly. Every script that sources it
# runs in strict mode. All paths default to the production base directory but
# can be overridden with BASE, which keeps the scripts usable in staging and in
# local dry runs.

set -Eeuo pipefail

# Cron runs with a minimal PATH; node and pm2 usually live in /usr/local/bin or
# a per-user npm prefix.
PATH="${PATH:-/usr/local/bin:/usr/bin:/bin}"
case ":$PATH:" in
    *":/usr/local/bin:"*) ;;
    *) PATH="/usr/local/bin:/usr/bin:/bin:$PATH" ;;
esac
export PATH

BASE="${BASE:-/home/cvhowlad/app3.cvhowlader.com}"
RELEASES_DIR="$BASE/releases"
SHARED_DIR="$BASE/shared"
PUBLIC_DIR="$BASE/public"
DEPLOY_DIR="$BASE/deploy"
TMP_DIR="$BASE/tmp"
BACKUP_DIR="$SHARED_DIR/backups"
SHARED_ENV="$SHARED_DIR/.env"
DEPLOY_ENV="$SHARED_DIR/deploy.env"
LOCK_FILE="$TMP_DIR/deploy.lock"

log() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"; }
warn() { printf '[%s] WARNING: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2; }
die() {
    printf '[%s] ERROR: %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*" >&2
    exit 1
}

[ -d "$BASE" ] || die "BASE does not exist: $BASE"

# Operator-managed absolute paths and probe URL. Optional; created by
# server-setup.sh and never committed.
if [ -f "$DEPLOY_ENV" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$DEPLOY_ENV"
    set +a
fi

# CWP serves this domain through the PHP 8.5 FPM build. The system `php` is
# 8.3, so every artisan/composer command must use the matching CLI binary.
DEFAULT_PHP_BIN="/opt/alt/php-fpm85/usr/bin/php"
PHP_BIN="${PHP_BIN:-$DEFAULT_PHP_BIN}"
PM2_BIN="${PM2_BIN:-pm2}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
RELEASE_RETENTION="${RELEASE_RETENTION:-5}"
ASSET_RETENTION_DAYS="${ASSET_RETENTION_DAYS:-14}"
SSR_APP_NAME="${SSR_APP_NAME:-laravel-ssr}"
STAGING="${STAGING:-0}"

# This host caps cvhowlad at 40 processes/threads. PM2, its CLI and the SSR
# app are all Node processes; a smaller libuv pool keeps a deploy and PM2
# restart under the cap. Raise the limit and remove this when the host allows.
UV_THREADPOOL_SIZE="${UV_THREADPOOL_SIZE:-2}"
export UV_THREADPOOL_SIZE

# Fail fast when the deploy shell and the web runtime disagree. `server-setup`
# rewrites deploy.env on existing installations so a stale PHP_BIN cannot win.
require_php85() {
    [ -x "$PHP_BIN" ] || die "PHP_BIN is not executable: $PHP_BIN"

    local version
    version="$("$PHP_BIN" -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
    [ "$version" = "8.5" ] || die "PHP_BIN must be PHP 8.5, got $version ($PHP_BIN)"
}

ensure_dirs() {
    mkdir -p \
        "$RELEASES_DIR" \
        "$SHARED_DIR" \
        "$SHARED_DIR/database" \
        "$SHARED_DIR/storage/app/public" \
        "$SHARED_DIR/storage/framework/cache/data" \
        "$SHARED_DIR/storage/framework/sessions" \
        "$SHARED_DIR/storage/framework/views" \
        "$SHARED_DIR/storage/logs" \
        "$BACKUP_DIR" \
        "$DEPLOY_DIR" \
        "$TMP_DIR"
}

# A single deploy lock keeps activation, rollback and backups from overlapping.
# flock is released automatically when the process exits.
acquire_lock() {
    ensure_dirs
    exec 9>"$LOCK_FILE"
    if ! flock -w 900 9; then
        die "another deploy or backup is already running (lock: $LOCK_FILE)"
    fi
}

release_lock() {
    flock -u 9 2>/dev/null || true
}

release_path() {
    printf '%s/%s\n' "$RELEASES_DIR" "$1"
}

current_release_id() {
    local target
    target="$(readlink "$BASE/current" 2>/dev/null || true)"
    if [ -z "$target" ]; then
        return 0
    fi
    basename "$target"
}

previous_release_id() {
    local target
    target="$(readlink "$BASE/previous" 2>/dev/null || true)"
    if [ -z "$target" ]; then
        return 0
    fi
    basename "$target"
}

# Atomic symlink swap: create the new link next to the target, then rename over
# it. mv -T makes the replacement a single syscall instead of unlink+symlink.
atomic_symlink() {
    local target="$1" link="$2" tmp
    tmp="$(dirname "$link")/.$(basename "$link").tmp.$$"
    ln -sfn "$target" "$tmp"
    mv -Tf "$tmp" "$link"
}

# Read DB_DATABASE from the shared environment file without loading it into the
# shell (it contains secrets we do not need).
shared_db_path() {
    local path=""
    if [ -f "$SHARED_ENV" ]; then
        # The production env is CRLF; strip the carriage return before the
        # path is tested with -f, or every SQLite command silently targets
        # "database.sqlite\r".
        path="$(sed -n 's/^[[:space:]]*DB_DATABASE[[:space:]]*=[[:space:]]*//p' "$SHARED_ENV" | tail -n 1)"
        path="$(printf '%s' "$path" | sed -e 's/\r$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    fi
    if [ -z "$path" ]; then
        path="$SHARED_DIR/database/database.sqlite"
    fi
    printf '%s\n' "$path"
}

# Install the stable document-root bootstrap. The real CWP docroot is
# $BASE/public, so this is the only file that must stay in place while the
# release behind `current` changes.
install_shim_file() {
    local source_shim
    source_shim="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/public/index.php"
    [ -f "$source_shim" ] || die "shim source not found: $source_shim"

    if [ -f "$PUBLIC_DIR/index.php" ] && ! grep -q 'current/public/index.php' "$PUBLIC_DIR/index.php"; then
        mkdir -p "$BASE/backups"
        cp -p "$PUBLIC_DIR/index.php" "$BASE/backups/public-index.php.$(date -u +%Y%m%d-%H%M%S)"
        log "backed up the previous public/index.php to $BASE/backups"
    fi

    install -m 644 "$source_shim" "$PUBLIC_DIR/.index.php.tmp.$$"
    mv -Tf "$PUBLIC_DIR/.index.php.tmp.$$" "$PUBLIC_DIR/index.php"
}

# Copy build output and static files into the real docroot. Build assets are
# additive so HTML that is already in flight never 404s; the manifest is
# replaced atomically so asset URLs switch in one step.
publish_public() {
    local release_dir="$1"
    local with_shim="${2:-1}"
    local release_public="$release_dir/public"

    [ -f "$release_public/build/manifest.json" ] || die "missing public/build/manifest.json in $release_dir"

    mkdir -p "$PUBLIC_DIR/build/assets"
    rsync -a "$release_public/build/assets/" "$PUBLIC_DIR/build/assets/"

    install -m 644 "$release_public/build/manifest.json" "$PUBLIC_DIR/build/.manifest.json.tmp.$$"
    mv -Tf "$PUBLIC_DIR/build/.manifest.json.tmp.$$" "$PUBLIC_DIR/build/manifest.json"

    rsync -a \
        --exclude=/index.php \
        --exclude=/storage \
        --exclude=/build/assets/ \
        --exclude=/build/manifest.json \
        "$release_public/" "$PUBLIC_DIR/"

    if [ -L "$PUBLIC_DIR/storage" ] || [ ! -e "$PUBLIC_DIR/storage" ]; then
        ln -sfn "$SHARED_DIR/storage/app/public" "$PUBLIC_DIR/storage"
    elif [ -d "$PUBLIC_DIR/storage" ] && [ -z "$(ls -A "$PUBLIC_DIR/storage" 2>/dev/null)" ]; then
        rmdir "$PUBLIC_DIR/storage"
        ln -sfn "$SHARED_DIR/storage/app/public" "$PUBLIC_DIR/storage"
    else
        die "$PUBLIC_DIR/storage is a non-empty directory; move its contents to $SHARED_DIR/storage/app/public and retry"
    fi

    if [ "$with_shim" = "1" ]; then
        install_shim_file
    fi
}

# Restart the SSR server from a specific release. PM2 has to forget the process
# so a changed cwd/script (new release) is picked up; in fork mode a restart
# already implies a short gap, and the health check retries through it.
pm2_start() {
    local release_dir="$1" app_name="$SSR_APP_NAME"

    # A staging rehearsal must never delete or restart the production process.
    if [ "$STAGING" = "1" ]; then
        log "staging mode: skipping PM2 restart"
        return 0
    fi

    SSR_APP_NAME="$app_name" SSR_RELEASE="$release_dir" SSR_LOG_DIR="$SHARED_DIR/storage/logs" \
        "$PM2_BIN" delete "$app_name" >/dev/null 2>&1 || true

    SSR_APP_NAME="$app_name" SSR_RELEASE="$release_dir" SSR_LOG_DIR="$SHARED_DIR/storage/logs" \
        "$PM2_BIN" start "$release_dir/ecosystem.config.cjs" --update-env 9>&-

    "$PM2_BIN" save 9>&-
}

# Pending queue rows are a warning, not a deployment failure: the queue is not
# operational today and a non-zero count must not block a security fix.
warn_pending_jobs() {
    local db pending failed
    db="$(shared_db_path)"

    [ -f "$db" ] || return 0

    if ! command -v sqlite3 >/dev/null 2>&1; then
        warn "sqlite3 is not installed; skipping queue preflight"
        return 0
    fi

    if [ "$(sqlite3 "$db" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='jobs';")" = "1" ]; then
        pending="$(sqlite3 "$db" 'SELECT count(*) FROM jobs;')"
        if [ "$pending" != "0" ]; then
            warn "jobs table has $pending pending row(s) and no worker is configured; deploy continues"
        fi
    fi

    if [ "$(sqlite3 "$db" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='failed_jobs';")" = "1" ]; then
        failed="$(sqlite3 "$db" 'SELECT count(*) FROM failed_jobs;')"
        if [ "$failed" != "0" ]; then
            warn "failed_jobs table has $failed row(s); inspect them with php artisan queue:failed"
        fi
    fi
}

# Keep the current and previous release plus a small history. Anything older is
# removed only after a successful activation.
prune_releases() {
    local current previous candidate
    current="$(readlink -f "$BASE/current" 2>/dev/null || true)"
    previous="$(readlink -f "$BASE/previous" 2>/dev/null || true)"

    find "$RELEASES_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%T@ %p\n' 2>/dev/null |
        sort -rn |
        awk -v keep="$RELEASE_RETENTION" 'NR > keep { $1=""; sub(/^ /, ""); print }' |
        while IFS= read -r candidate; do
            [ -n "$candidate" ] || continue
            if [ "$(readlink -f "$candidate")" = "$current" ] || [ "$(readlink -f "$candidate")" = "$previous" ]; then
                continue
            fi
            log "pruning old release $candidate"
            rm -rf -- "$candidate"
        done

    find "$TMP_DIR" -maxdepth 1 -type f -mtime +2 -delete 2>/dev/null || true
}

# Hashed assets are immutable, so only very old ones can be removed safely.
prune_assets() {
    [ -d "$PUBLIC_DIR/build/assets" ] || return 0
    find "$PUBLIC_DIR/build/assets" -type f -mtime +"$ASSET_RETENTION_DAYS" -delete 2>/dev/null || true
    find "$PUBLIC_DIR/build/assets" -mindepth 1 -type d -empty -delete 2>/dev/null || true
}
