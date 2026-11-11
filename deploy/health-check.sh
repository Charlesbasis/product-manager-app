#!/usr/bin/env bash
#
# End-to-end health probe: public endpoints, PM2 process state and the SSR
# socket. Used after activation/rollback and by the five-minute monitoring cron.
# Exit code 0 means healthy.

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
# shellcheck disable=SC1091
. "$SCRIPT_DIR/common.sh"

QUIET=0
if [ "${1:-}" = "--quiet" ]; then
    QUIET=1
fi

say() {
    if [ "$QUIET" = "0" ]; then
        log "$*"
    fi
}

[ "$STAGING" = "1" ] || [ -n "$HEALTHCHECK_URL" ] || die "HEALTHCHECK_URL is not set in $DEPLOY_ENV"

FAILED=0

php_version="$("$PHP_BIN" -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || true)"
if [ "$php_version" != "8.5" ]; then
    warn "PHP runtime mismatch: expected 8.5, got ${php_version:-unknown} ($PHP_BIN)"
    FAILED=1
else
    say "php $php_version ($PHP_BIN)"
fi

if [ "$STAGING" = "1" ]; then
    say "staging mode: skipping HTTP, PM2 and SSR checks"
    [ "$FAILED" -eq 0 ] || exit 1
    exit 0
fi

http_ok() {
    local url="$1" code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo 000)"
    if [ "$code" != "200" ]; then
        warn "GET $url returned $code"
        return 1
    fi
    return 0
}

retry() {
    local attempt=1
    while [ "$attempt" -le 5 ]; do
        "$@" && return 0
        attempt=$((attempt + 1))
        sleep 3
    done
    return 1
}

say "checking $HEALTHCHECK_URL/up"
retry http_ok "$HEALTHCHECK_URL/up" || FAILED=1

say "checking $HEALTHCHECK_URL/"
retry http_ok "$HEALTHCHECK_URL/" || FAILED=1

if "$PM2_BIN" describe "$SSR_APP_NAME" 2>/dev/null | grep -Eq 'status.*online'; then
    say "pm2 process $SSR_APP_NAME is online"
else
    warn "pm2 process $SSR_APP_NAME is not online"
    FAILED=1
fi

SSR_URL="$(sed -n 's/^[[:space:]]*INERTIA_SSR_URL[[:space:]]*=[[:space:]]*//p' "$SHARED_ENV" | tail -n 1 | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" -e 's/\r$//')"
SSR_PORT="${INERTIA_SSR_PORT:-}"
if [ -z "$SSR_PORT" ] && [ -n "$SSR_URL" ]; then
    SSR_PORT="${SSR_URL##*:}"
    SSR_PORT="${SSR_PORT%%/*}"
fi
SSR_PORT="${SSR_PORT:-13714}"
if (exec 3<>"/dev/tcp/127.0.0.1/$SSR_PORT") 2>/dev/null; then
    say "SSR port $SSR_PORT is accepting connections"
else
    warn "SSR port $SSR_PORT is not accepting connections"
    FAILED=1
fi

if [ "$FAILED" -ne 0 ]; then
    warn "health check failed"
    exit 1
fi

say "health check passed"
