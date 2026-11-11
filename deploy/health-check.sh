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

# PM2 can report "online" after a spawn that failed with EAGAIN (the account's
# nproc cap), leaving an online record with no process at all. Require a live
# PID in addition to the status line.
ssr_pid() {
    "$PM2_BIN" pid "$SSR_APP_NAME" 2>/dev/null | tail -n 1 | tr -d '\r' || true
}

SSR_PID="$(ssr_pid)"
if [ -n "$SSR_PID" ] && [ "$SSR_PID" != "0" ] && kill -0 "$SSR_PID" 2>/dev/null; then
    say "pm2 process $SSR_APP_NAME is online (pid $SSR_PID)"
else
    warn "pm2 process $SSR_APP_NAME has no live pid (pm2 status alone can be stale after a failed fork)"
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

# Capacity is a warning, not a failure: the site can be healthy while the
# account is one Node process away from the deadlock described in the README.
NPROC_LIMIT="$(nproc_limit)"
NPROC_THREADS="$(thread_count)"
if [ "${NPROC_LIMIT:-0}" -gt 0 ] 2>/dev/null && [ "$NPROC_THREADS" -gt "$((NPROC_LIMIT * 80 / 100))" ]; then
    warn "nproc is nearly exhausted: $NPROC_THREADS/$NPROC_LIMIT threads in use; new SSH sessions and spawns will fail"
fi

MEM_PERCENT="$(memcg_usage_percent)"
if [ -n "$MEM_PERCENT" ] && [ "$MEM_PERCENT" -ge 85 ]; then
    warn "memory cgroup is ${MEM_PERCENT}% full; the OOM killer may terminate PHP or SSR"
fi

if [ "$FAILED" -ne 0 ]; then
    warn "health check failed"
    exit 1
fi

say "health check passed"
