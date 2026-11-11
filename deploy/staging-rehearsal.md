# Phase 1.0 staging rehearsal

Run this on the production host before `server-setup.sh --adopt-sqlite` touches
the live deployment. It exercises the real scripts against a disposable base and
does **not** restart production PM2, change the production docroot, install
cron entries, or serve public traffic.

Production remains on the old in-place layout until the rehearsal passes.

## Prerequisites

- The Phase 1 checkout is available on the server (for example
  `/home/cvhowlad/src/product-manager-app`).
- `/opt/alt/php-fpm85/usr/bin/php` is the PHP 8.5 CLI matching the CWP FPM
  runtime.
- `sqlite3`, `rsync`, and `flock` are installed.
- The release artifact contains `vendor/`, `public/build/manifest.json`, and
  `bootstrap/ssr/ssr.js`.

## 1. Set variables

```bash
export PROD=/home/cvhowlad/app3.cvhowlader.com
export STAGE=/home/cvhowlad/staging/app3
export SRC=/home/cvhowlad/src/product-manager-app
export PHP85=/opt/alt/php-fpm85/usr/bin/php
```

## 2. Create the staging base and database snapshot

```bash
mkdir -p "$STAGE/database" "$STAGE/releases"
cp -p "$PROD/.env" "$STAGE/.env"
chmod 600 "$STAGE/.env"

# Staging is disposable: replace the production APP_KEY and mark the env.
STAGE_KEY="base64:$("$PHP85" -r 'echo base64_encode(random_bytes(32));')"
sed -i -E "s|^APP_KEY=.*|APP_KEY=${STAGE_KEY}|" "$STAGE/.env"
sed -i -E 's/^APP_ENV=.*/APP_ENV=staging/' "$STAGE/.env"
sed -i -E 's/^APP_DEBUG=.*/APP_DEBUG=true/' "$STAGE/.env"

sqlite3 "$PROD/database/database.sqlite" \
  ".backup '$STAGE/database/database.sqlite'"
chmod 600 "$STAGE/database/database.sqlite"
```

## 3. Seed a rehearsal release

Use the same artifact shape as CI. Do **not** copy the live production tree:
that tree predates `config/sitemap.php`, so the sitemap would silently be
written inside the release instead of the served docroot.

Build the tarball from the Phase 1 checkout on your workstation (the CI job
does the same thing with production dependencies):

```bash
tar -czf /tmp/release-phase1.tar.gz \
  --exclude='bootstrap/cache/*.php' \
  --exclude='database/*.sqlite*' \
  --exclude='public/hot' \
  --exclude='public/sitemap.xml' \
  --exclude='public/storage' \
  --exclude='public/build/hot' \
  app bootstrap config database deploy public resources routes vendor \
  artisan composer.json composer.lock ecosystem.config.cjs

rsync -a /tmp/release-phase1.tar.gz \
  cvhowlad@app3.cvhowlader.com:/home/cvhowlad/staging/release-phase1.tar.gz
```

Then extract it on the server:

```bash
mkdir -p "$STAGE/releases/rehearsal-1"
tar -xzf /home/cvhowlad/staging/release-phase1.tar.gz \
  -C "$STAGE/releases/rehearsal-1" --no-same-owner
```

Confirm activation prerequisites and that the release has no `.env`:

```bash
for f in artisan vendor/autoload.php public/.htaccess \
         public/build/manifest.json bootstrap/ssr/ssr.js ecosystem.config.cjs \
         config/sitemap.php deploy/activate.sh; do
  test -f "$STAGE/releases/rehearsal-1/$f" || echo "MISSING: $f"
done
test ! -e "$STAGE/releases/rehearsal-1/.env"
```

## 4. Scaffold the staging base

```bash
BASE="$STAGE" bash "$SRC/deploy/server-setup.sh" --staging --adopt-sqlite
```

Verify the generated configuration:

```bash
grep -E '^(PHP_BIN|STAGING|SSR_APP_NAME|DB_DATABASE|SITEMAP_PATH)=' \
  "$STAGE/shared/deploy.env" "$STAGE/shared/.env"
```

Expected:

```text
PHP_BIN=/opt/alt/php-fpm85/usr/bin/php
STAGING=1
SSR_APP_NAME=laravel-ssr-staging
DB_DATABASE=/home/cvhowlad/staging/app3/shared/database/database.sqlite
SITEMAP_PATH=/home/cvhowlad/staging/app3/public/sitemap.xml
```

Re-run the setup once to prove idempotence; `STAGING=1` must survive:

```bash
BASE="$STAGE" bash "$SRC/deploy/server-setup.sh"
grep -E '^(PHP_BIN|STAGING|SSR_APP_NAME)=' "$STAGE/shared/deploy.env"
```

## 5. First activation

Invoke the copy inside the release, exactly as the CI deploy job does:

```bash
BASE="$STAGE" "$STAGE/releases/rehearsal-1/deploy/activate.sh" rehearsal-1
```

`composer check-platform-reqs` reports `phpoffice/phpspreadsheet 1.x` as
failing because it declares PHP `<8.5`. Activation ignores only that PHP
upper-bound row and still aborts on extension or minimum-version failures.
`config.platform.php` is pinned to 8.2, so `composer install` in CI continues
to resolve the legacy lock file.

Check the filesystem contract:

```bash
readlink -f "$STAGE/current"
readlink -f "$STAGE/current/.env"
readlink -f "$STAGE/current/storage"
grep -n 'current/public/index.php' "$STAGE/public/index.php"
test -f "$STAGE/public/sitemap.xml"
test ! -e "$STAGE/releases/rehearsal-1/public/sitemap.xml"
```

Expected `current` to point at `rehearsal-1`, `.env` to
`$STAGE/shared/.env`, storage to `$STAGE/shared/storage`, and the docroot
`index.php` to be the shim. The sitemap belongs in `"$STAGE/public"`, not in
the release.

Smoke-test the shim and the spreadsheet stack under PHP 8.5:

```bash
cd "$STAGE/current"
"$PHP85" -S 127.0.0.1:18085 -t "$STAGE/public" "$STAGE/public/index.php" &
pid=$!
sleep 2
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:18085/up
kill "$pid"

"$PHP85" artisan tinker --execute='\Maatwebsite\Excel\Facades\Excel::store(new \App\Exports\ProductsExport(), "rehearsal-export.xlsx", "local");'
test -s "$STAGE/current/storage/app/private/rehearsal-export.xlsx"
```

The export succeeds, but `phpspreadsheet` 1.x prints `Increment on non-numeric
string is deprecated` warnings on PHP 8.5. This is a known follow-up: move to
`maatwebsite/excel` 4.x + `phpspreadsheet` 5.x when the import/export surfaces
can be regression-tested.

## 6. Second activation and rollback

Copy the release without runtime links, then activate it twice. The second
activation proves the retry path: a release that already has a `.env` symlink
is re-linked instead of rejected.

```bash
rsync -a --exclude='.env' --exclude='storage' --exclude='public/storage' \
  "$STAGE/releases/rehearsal-1/" "$STAGE/releases/rehearsal-2/"

BASE="$STAGE" "$STAGE/releases/rehearsal-2/deploy/activate.sh" rehearsal-2
BASE="$STAGE" "$STAGE/releases/rehearsal-2/deploy/activate.sh" rehearsal-2

readlink -f "$STAGE/current"
readlink -f "$STAGE/previous"

BASE="$STAGE" "$STAGE/deploy/rollback.sh" rehearsal-1
readlink -f "$STAGE/current"
```

Expected after the second activation: `current` → `rehearsal-2`,
`previous` → `rehearsal-1`. After rollback: `current` → `rehearsal-1`.

## 7. Restore drill

`activation` creates a compressed SQLite backup before migrations.

```bash
ls -lh "$STAGE/shared/backups"
DB_BACKUP="$(ls -1t "$STAGE/shared/backups"/db-*.sqlite.gz | head -n 1)"
gunzip -c "$DB_BACKUP" > /tmp/rehearsal-restore.sqlite
sqlite3 /tmp/rehearsal-restore.sqlite 'PRAGMA integrity_check;'
```

Expected: `ok`.

## 8. Cleanup

```bash
rm -rf "$STAGE" /tmp/rehearsal-restore.sqlite
```

No staging PM2 process was created, so there is nothing to stop.

## 9. Production cutover

Only after the rehearsal passes:

```bash
# Take a fresh production SQLite backup first.
sqlite3 "$PROD/database/database.sqlite" \
  ".backup '/home/cvhowlad/db-backups/pre-phase1-$(date -u +%Y%m%d-%H%M%S).sqlite'"

BASE="$PROD" bash "$SRC/deploy/server-setup.sh" --adopt-sqlite --with-cron
```

Then deploy a release from CI and verify:

- `.env` and `APP_KEY` hashes are unchanged, mode `600`.
- `/up`, `/`, and `/login` return `200`.
- `sitemap.xml` is written to `$PROD/public/sitemap.xml`; it is no longer
  tracked in git or shipped inside releases.
- `laravel-ssr` is online on the expected port.
- A second deploy works and `rollback.sh` returns to the previous release.

Before the cutover, check the production migration state. If the database
predates `2026_11_09_000000_add_quantity_and_status_to_products_table`, the
first release runs it (defaults: `quantity=1`, `status=active`). Confirm the
backup made by `activate.sh` exists even if the migration is a no-op:

```bash
sqlite3 "$PROD/database/database.sqlite" \
  "select migration from migrations where migration like '%add_quantity_and_status%';"
ls -lh "$PROD/shared/backups"
```

If a staging vhost is available, repeat the activation/rollback against it with
`STAGING=0`, `SSR_APP_NAME=laravel-ssr-staging`, and a staging
`HEALTHCHECK_URL` to cover HTTP and PM2 as well.
