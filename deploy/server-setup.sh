#!/usr/bin/env bash
#
# One-time (idempotent) server scaffold for atomic releases.
#
# Run as the deploy user; no sudo is required. It never changes the CWP
# document root and never overwrites shared/.env.
#
# Usage:
#   server-setup.sh                      # create dirs, deploy.env, copy storage
#   server-setup.sh --adopt-sqlite       # + point the live app at shared SQLite
#   server-setup.sh --with-cron          # + scheduler/backup/health cron entries
#   server-setup.sh --staging            # isolated rehearsal; never touches PM2/cron
#
# Typical first run (low-traffic window):
#   bash deploy/server-setup.sh --adopt-sqlite --with-cron
# Staging rehearsal:
#   BASE=/home/cvhowlad/staging/app3 bash deploy/server-setup.sh --staging --adopt-sqlite

set -Eeuo pipefail

# Paths are defined in common.sh, which ShellCheck cannot follow.
# shellcheck disable=SC2153

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

ADOPT_SQLITE=0
WITH_CRON=0
INSTALL_SHIM=1
# STAGING is sourced from deploy.env when present; --staging overrides it.

for arg in "$@"; do
    case "$arg" in
        --adopt-sqlite) ADOPT_SQLITE=1 ;;
        --with-cron) WITH_CRON=1 ;;
        --no-shim) INSTALL_SHIM=0 ;;
        --staging) STAGING=1 ;;
        -h | --help)
            sed -n '2,20p' "$0"
            exit 0
            ;;
        *) die "unknown option: $arg" ;;
    esac
done

if [ "$STAGING" = "1" ] && [ "$WITH_CRON" = "1" ]; then
    die "--with-cron is production-only; staging shares the user crontab"
fi

if [ "$STAGING" = "1" ]; then
    DEFAULT_SSR_APP_NAME="laravel-ssr-staging"
else
    DEFAULT_SSR_APP_NAME="laravel-ssr"
fi

detect_bin() {
    local candidate
    for candidate in "$@"; do
        if [ -x "$candidate" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done
    command -v "$(basename "$1")" 2>/dev/null || true
}

set_env_value() {
    local file="$1" key="$2" value="$3" stamp current eol=''
    current="$(sed -n -E "s|^[[:space:]]*${key}[[:space:]]*=[[:space:]]*||p" "$file" | tail -n 1 | sed -e 's/\r$//')"
    if [ "$current" = "$value" ]; then
        return 0
    fi

    # The production .env is CRLF. Preserve its line endings instead of
    # leaving a mixed file behind after adding or replacing a key.
    if grep -q $'\r$' "$file"; then
        eol=$'\r'
    fi

    stamp="$(date -u +%Y%m%d-%H%M%S)-$RANDOM"
    cp -p "$file" "$file.bak.$stamp"
    if grep -qE "^[[:space:]]*${key}=" "$file"; then
        sed -i -E "s|^[[:space:]]*${key}=.*|${key}=${value}${eol}|" "$file"
    else
        printf '%s=%s%s\n' "$key" "$value" "$eol" >>"$file"
    fi
}

ensure_dirs
acquire_lock

log "base directory: $BASE"

# 1. Shared environment ------------------------------------------------------
if [ ! -f "$SHARED_ENV" ]; then
    if [ -f "$BASE/.env" ]; then
        install -m 600 "$BASE/.env" "$SHARED_ENV"
        log "seeded $SHARED_ENV from $BASE/.env"
    else
        die "no $SHARED_ENV and no $BASE/.env; create shared/.env from .env.production.example first"
    fi
else
    chmod 600 "$SHARED_ENV" 2>/dev/null || true
fi

# 2. Operator-managed paths --------------------------------------------------
# The web runtime is PHP 8.5 FPM; use the matching CLI build for artisan and
# Composer. Never let a stale deploy.env silently fall back to /usr/bin/php.
DETECTED_PHP="$(detect_bin \
    /opt/alt/php-fpm85/usr/bin/php \
    /usr/local/bin/php \
    /usr/bin/php)"
[ -n "$DETECTED_PHP" ] || die "could not find a PHP binary"

DETECTED_PHP_VERSION="$("$DETECTED_PHP" -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
[ "$DETECTED_PHP_VERSION" = "8.5" ] || \
    die "PHP 8.5 required; found ${DETECTED_PHP_VERSION:-unknown} at $DETECTED_PHP"

DETECTED_PM2="$(detect_bin \
    "$HOME/.npm-global/bin/pm2" \
    /usr/local/bin/pm2 \
    /usr/bin/pm2)"
DETECTED_COMPOSER="$(detect_bin \
    "$HOME/.local/bin/composer" \
    /usr/local/bin/composer \
    /usr/bin/composer)"

if [ ! -f "$DEPLOY_ENV" ]; then
    {
        printf '# Managed by deploy/server-setup.sh. Mode 600. Do not commit.\n'
        printf 'PHP_BIN=%q\n' "$DETECTED_PHP"
        printf 'PM2_BIN=%q\n' "${DETECTED_PM2:-pm2}"
        printf 'COMPOSER_BIN=%q\n' "${DETECTED_COMPOSER:-composer}"
        printf 'HEALTHCHECK_URL=%q\n' "${HEALTHCHECK_URL:-https://app3.cvhowlader.com}"
        printf 'BACKUP_RETENTION_DAYS=14\n'
        printf 'RELEASE_RETENTION=5\n'
        printf 'ASSET_RETENTION_DAYS=14\n'
        printf 'SSR_APP_NAME=%q\n' "$DEFAULT_SSR_APP_NAME"
        printf 'STAGING=%q\n' "$STAGING"
    } >"$DEPLOY_ENV"
    chmod 600 "$DEPLOY_ENV"
    log "wrote $DEPLOY_ENV"
else
    # Existing installations created before the PHP 8.5 cutover still point at
    # /usr/bin/php. Rewrite the values that must match the web runtime.
    set_env_value "$DEPLOY_ENV" PHP_BIN "$DETECTED_PHP"
    set_env_value "$DEPLOY_ENV" STAGING "$STAGING"
    set_env_value "$DEPLOY_ENV" SSR_APP_NAME "$DEFAULT_SSR_APP_NAME"
    chmod 600 "$DEPLOY_ENV"
fi

PHP_BIN="$DETECTED_PHP"
SSR_APP_NAME="$DEFAULT_SSR_APP_NAME"
PM2_BIN="${DETECTED_PM2:-${PM2_BIN:-pm2}}"
COMPOSER_BIN="${DETECTED_COMPOSER:-${COMPOSER_BIN:-}}"
export PHP_BIN PM2_BIN COMPOSER_BIN SSR_APP_NAME
require_php85

# SITEMAP_PATH must target the real CWP docroot, not the immutable release.
set_env_value "$SHARED_ENV" SITEMAP_PATH "$PUBLIC_DIR/sitemap.xml"

log "php: ${PHP_BIN} (${DETECTED_PHP_VERSION})"
log "pm2: ${PM2_BIN}"
log "ssr process: ${SSR_APP_NAME}"

# 3. SQLite ------------------------------------------------------------------
LEGACY_DB="$BASE/database/database.sqlite"
# shellcheck disable=SC2153
SHARED_DB="$SHARED_DIR/database/database.sqlite"

if [ ! -f "$SHARED_DB" ] && [ -f "$LEGACY_DB" ]; then
    command -v sqlite3 >/dev/null 2>&1 || die "sqlite3 is required to copy the database"
    log "copying $LEGACY_DB to $SHARED_DB with sqlite3 .backup"
    sqlite3 "$LEGACY_DB" ".backup '$SHARED_DB'"
    chmod 600 "$SHARED_DB"
fi

if [ "$ADOPT_SQLITE" = "1" ]; then
    [ -f "$SHARED_DB" ] || die "shared database missing; cannot adopt SQLite"

    set_env_value "$SHARED_ENV" DB_CONNECTION sqlite
    set_env_value "$SHARED_ENV" DB_DATABASE "$SHARED_DB"
    log "shared/.env now points at $SHARED_DB"

    if [ -f "$BASE/.env" ]; then
        set_env_value "$BASE/.env" DB_CONNECTION sqlite
        set_env_value "$BASE/.env" DB_DATABASE "$SHARED_DB"
        set_env_value "$BASE/.env" SITEMAP_PATH "$PUBLIC_DIR/sitemap.xml"
        log "legacy .env now points at the same database (no split-brain during cutover)"

        if [ -f "$BASE/vendor/autoload.php" ]; then
            log "rebuilding the legacy config cache so it picks up DB_DATABASE"
            (
                cd "$BASE"
                "$PHP_BIN" artisan config:cache
            ) || warn "could not rebuild the legacy config cache; run it manually"
        fi
    fi
fi

# 4. Shared storage ----------------------------------------------------------
# shellcheck disable=SC2153
if [ -d "$BASE/storage" ] && [ "$(readlink -f "$BASE/storage")" != "$(readlink -f "$SHARED_DIR/storage")" ]; then
    log "syncing existing storage into shared/storage (additive)"
    rsync -a --ignore-existing "$BASE/storage/" "$SHARED_DIR/storage/"
fi

# 5. Deploy tooling ----------------------------------------------------------
mkdir -p "$DEPLOY_DIR/public"
for file in "$SCRIPT_DIR"/*.sh; do
    install -m 755 "$file" "$DEPLOY_DIR/$(basename "$file")"
done
install -m 644 "$SCRIPT_DIR/public/index.php" "$DEPLOY_DIR/public/index.php"
log "installed deploy scripts into $DEPLOY_DIR"

# 6. Document root -----------------------------------------------------------
if [ "$INSTALL_SHIM" = "1" ]; then
    if [ -d "$BASE/current" ]; then
        install_shim_file
        log "installed the stable public/index.php shim"
    else
        warn "no current release yet; the shim will be installed by the first activation"
    fi
fi

# 7. PM2 modules -------------------------------------------------------------
# Never run `pm2 install` here. The installer spawns a second Node process that
# competes for the account's 40-thread nproc cap and 1 GiB memory cgroup. One
# hung installer blocked every SSH session with "exec request failed on channel
# 0", and the OOM killer took PHP-FPM and the SSR process down with it. Logs
# are rotated by deploy/rotate-logs.sh from the weekly cron entry instead.
if [ "$STAGING" != "1" ] && command -v "$PM2_BIN" >/dev/null 2>&1; then
    if "$PM2_BIN" describe pm2-logrotate >/dev/null 2>&1; then
        warn "pm2-logrotate is installed; remove it with '$PM2_BIN uninstall pm2-logrotate' so rotate-logs.sh is the only rotation mechanism"
    fi
fi

# 8. Cron --------------------------------------------------------------------
if [ "$WITH_CRON" = "1" ]; then
    CURRENT_CRON="$(mktemp)"
    NEW_CRON="$(mktemp)"
    crontab -l 2>/dev/null >"$CURRENT_CRON" || true

    awk '
        /^# BEGIN nexus-deploy$/ { skip = 1; next }
        /^# END nexus-deploy$/   { skip = 0; next }
        !skip
    ' "$CURRENT_CRON" >"$NEW_CRON"

    {
        printf '# BEGIN nexus-deploy\n'
        printf '* * * * * cd %s/current && %s artisan schedule:run >> %s/storage/logs/scheduler.log 2>&1\n' \
            "$BASE" "$PHP_BIN" "$SHARED_DIR"
        printf '*/5 * * * * %s/health-check.sh --quiet >> %s/storage/logs/health.log 2>&1\n' \
            "$DEPLOY_DIR" "$SHARED_DIR"
        printf '30 2 * * * %s/backup-sqlite.sh >> %s/storage/logs/backup.log 2>&1\n' \
            "$DEPLOY_DIR" "$SHARED_DIR"
        printf '15 3 * * 0 %s/rotate-logs.sh >> %s/storage/logs/rotate.log 2>&1\n' \
            "$DEPLOY_DIR" "$SHARED_DIR"
        printf '# END nexus-deploy\n'
    } >>"$NEW_CRON"

    crontab "$NEW_CRON"
    rm -f "$CURRENT_CRON" "$NEW_CRON"
    log "installed scheduler, health, backup and log-rotation cron entries"
fi

release_lock

cat <<EOF

Server scaffold complete.

Next steps (one-time, outside this script):
  1. If QUEUE_CONNECTION is still "database" and no worker exists, set it to
     "sync" in $SHARED_ENV, or provision a supervised worker.
  2. Ask the host admin to run:
       $PM2_BIN startup systemd -u $USER --hp $HOME
     then run: $PM2_BIN save
  3. Deploy a release from CI. The first activation installs the shim and
     switches /current.
  4. Verify: $HEALTHCHECK_URL/up, /, and one uploaded image.

Cron entries are optional; re-run with --with-cron to install them.
EOF
