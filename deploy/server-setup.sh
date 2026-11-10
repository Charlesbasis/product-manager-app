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
#   server-setup.sh --with-cron           # + scheduler/backup/health cron entries
#
# Typical first run (low-traffic window):
#   bash deploy/server-setup.sh --adopt-sqlite --with-cron

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

for arg in "$@"; do
    case "$arg" in
        --adopt-sqlite) ADOPT_SQLITE=1 ;;
        --with-cron) WITH_CRON=1 ;;
        --no-shim) INSTALL_SHIM=0 ;;
        -h | --help)
            sed -n '2,20p' "$0"
            exit 0
            ;;
        *) die "unknown option: $arg" ;;
    esac
done

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
if [ ! -f "$DEPLOY_ENV" ]; then
    DETECTED_PHP="$(detect_bin \
        /opt/alt/php82/usr/bin/php \
        /opt/alt/php83/usr/bin/php \
        /opt/alt/php84/usr/bin/php \
        /usr/local/bin/php \
        /usr/bin/php)"
    DETECTED_PM2="$(detect_bin \
        "$HOME/.npm-global/bin/pm2" \
        /usr/local/bin/pm2 \
        /usr/bin/pm2)"
    DETECTED_COMPOSER="$(detect_bin \
        "$HOME/.local/bin/composer" \
        /usr/local/bin/composer \
        /usr/bin/composer)"

    {
        printf '# Managed by deploy/server-setup.sh. Mode 600. Do not commit.\n'
        printf 'PHP_BIN=%q\n' "${DETECTED_PHP:-php}"
        printf 'PM2_BIN=%q\n' "${DETECTED_PM2:-pm2}"
        printf 'COMPOSER_BIN=%q\n' "${DETECTED_COMPOSER:-composer}"
        printf 'HEALTHCHECK_URL=%q\n' "${HEALTHCHECK_URL:-https://app3.cvhowlader.com}"
        printf 'BACKUP_RETENTION_DAYS=14\n'
        printf 'RELEASE_RETENTION=5\n'
        printf 'ASSET_RETENTION_DAYS=14\n'
    } >"$DEPLOY_ENV"
    chmod 600 "$DEPLOY_ENV"
    log "wrote $DEPLOY_ENV"

    set -a
    # shellcheck disable=SC1090
    . "$DEPLOY_ENV"
    set +a
fi

log "php: ${PHP_BIN}"
log "pm2: ${PM2_BIN}"

# 3. SQLite ------------------------------------------------------------------
LEGACY_DB="$BASE/database/database.sqlite"
# shellcheck disable=SC2153
SHARED_DB="/database/database.sqlite"

if [ ! -f "$SHARED_DB" ] && [ -f "$LEGACY_DB" ]; then
    command -v sqlite3 >/dev/null 2>&1 || die "sqlite3 is required to copy the database"
    log "copying $LEGACY_DB to $SHARED_DB with sqlite3 .backup"
    sqlite3 "$LEGACY_DB" ".backup '$SHARED_DB'"
    chmod 600 "$SHARED_DB"
fi

set_env_value() {
    local file="$1" key="$2" value="$3" stamp
    stamp="$(date -u +%Y%m%d-%H%M%S)"
    cp -p "$file" "$file.bak.$stamp"
    if grep -qE "^[[:space:]]*${key}=" "$file"; then
        sed -i -E "s|^[[:space:]]*${key}=.*|${key}=${value}|" "$file"
    else
        printf '\n%s=%s\n' "$key" "$value" >>"$file"
    fi
}

if [ "$ADOPT_SQLITE" = "1" ]; then
    [ -f "$SHARED_DB" ] || die "shared database missing; cannot adopt SQLite"

    set_env_value "$SHARED_ENV" DB_CONNECTION sqlite
    set_env_value "$SHARED_ENV" DB_DATABASE "$SHARED_DB"
    log "shared/.env now points at $SHARED_DB"

    if [ -f "$BASE/.env" ]; then
        set_env_value "$BASE/.env" DB_CONNECTION sqlite
        set_env_value "$BASE/.env" DB_DATABASE "$SHARED_DB"
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

# 7. PM2 log rotation --------------------------------------------------------
if command -v "$PM2_BIN" >/dev/null 2>&1; then
    if ! "$PM2_BIN" describe pm2-logrotate >/dev/null 2>&1; then
        log "installing pm2-logrotate"
        "$PM2_BIN" install pm2-logrotate@3.0.1 || warn "pm2-logrotate install failed; install it manually"
    fi
    "$PM2_BIN" set pm2-logrotate:max_size 10M >/dev/null 2>&1 || true
    "$PM2_BIN" set pm2-logrotate:retain 14 >/dev/null 2>&1 || true
    "$PM2_BIN" set pm2-logrotate:compress true >/dev/null 2>&1 || true
    "$PM2_BIN" set pm2-logrotate:rotateInterval '0 0 * * *' >/dev/null 2>&1 || true
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
        printf '# END nexus-deploy\n'
    } >>"$NEW_CRON"

    crontab "$NEW_CRON"
    rm -f "$CURRENT_CRON" "$NEW_CRON"
    log "installed scheduler, health and backup cron entries"
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
