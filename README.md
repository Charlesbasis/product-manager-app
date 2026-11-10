# Nexus Inventory

[![Laravel](https://img.shields.io/badge/Laravel-12.x-orange.svg)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4.svg)](https://www.php.net)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4.svg)](https://tailwindcss.com)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Nexus Inventory is a full-stack Laravel + React inventory management application with product CRUD, stock quantities, status tracking, dashboard analytics, and import/export functionality.

## Live Demo

**Production URL**: [https://app3.cvhowlader.com/](https://app3.cvhowlader.com/)

## 🎯 What Problem This Solves

Small businesses and e-commerce stores struggle with:
- ❌ Scattered product data across spreadsheets
- ❌ No real-time inventory visibility
- ❌ Manual product updates taking hours
- ❌ No analytics on product performance

**Nexus Inventory solves this** with a centralized, real-time catalog that tracks stock quantities, inventory value, import/export, analytics, and multi-user access with role-based permissions.

## 📈 Results & Metrics

- ✅ Handles **1,000+ products** with sub-second load times
- ✅ **Bulk import** reduces product onboarding time by **90%** (from 2 hours to 10 minutes)
- ✅ **Real-time dashboard** gives instant visibility into inventory value and activity
- ✅ **2FA + secure auth** ensures business data protection

## Features

- **Inventory Management** — Full CRUD operations with image upload, stock quantity, and active/draft/archived status
- **Dashboard Analytics** — Real-time statistics with interactive charts (inventory value, price distribution, recent products, activity feed)
- **Import/Export** — Bulk import products from Excel (.xlsx, .xls, .csv) and export filtered data
- **Tag System** — Categorize products with multi-tag support
- **User Authentication** — Secure login/registration via Laravel Fortify
- **Two-Factor Authentication** — Additional security layer for user accounts
- **Blog System** — Public blog with SEO-friendly slugs
- **Dark/Light Theme** — System preference detection with manual toggle
- **Settings** — Profile, password, and appearance management

## Tech Stack

### Backend

- Laravel 12
- PHP 8.2+
- Laravel Fortify (authentication)
- Laravel Wayfinder (routing)
- Maatwebsite Excel (import/export)
- Spatie Sitemap (SEO)

### Frontend

- React 19
- TypeScript
- Vite 7
- Inertia.js (SPA routing)
- Tailwind CSS 4
- Radix UI (accessible components)
- Lucide React (icons)
- Recharts (data visualization)

## Prerequisites

- PHP 8.2 or higher
- Composer 2
- Node.js 22 LTS or higher
- pnpm 12.18.0 (`corepack enable` will pick it up from `packageManager`)
- SQLite (default), MySQL or PostgreSQL (for development)
- Git

## Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/your-username/nexus-inventory.git
    cd nexus-inventory
    ```

2. **Install PHP dependencies**

    ```bash
    composer install
    ```

3. **Install Node dependencies**

    ```bash
    pnpm install
    ```

4. **Copy environment file**

    ```bash
    cp .env.example .env
    ```

5. **Generate application key**

    ```bash
    php artisan key:generate
    ```

6. **Configure database**
    - Edit `.env` file with your database credentials
    - Run migrations:

    ```bash
    php artisan migrate
    ```

7. **Build assets**

    ```bash
    pnpm run build
    ```

8. **Start development server**

    ```bash
    php artisan serve
    ```

    Visit `http://localhost:8000` in your browser.

## Environment Variables

Key configuration options in `.env`:

| Variable              | Description                 | Default                  |
| --------------------- | --------------------------- | ------------------------ |
| `APP_NAME`            | Application name            | Nexus Inventory          |
| `APP_URL`             | Application URL             | http://localhost:8000    |
| `DB_CONNECTION`       | Database driver             | sqlite                   |
| `DB_DATABASE`         | Database file or name       | database/database.sqlite |
| `DB_JOURNAL_MODE`     | SQLite journal mode         | WAL                      |
| `MAIL_MAILER`         | Mail driver                 | log                      |
| `SESSION_DRIVER`      | Session driver              | database                 |
| `INERTIA_SSR_ENABLED` | Enable Inertia SSR          | true                     |
| `SITEMAP_PATH`        | Absolute sitemap output     | public/sitemap.xml       |

## Available Commands

### Development

```bash
# Start development server (Laravel + Vite)
composer run dev

# Start with SSR
composer run dev:ssr

# Run Vite only
pnpm run dev
```

### Building

```bash
# Build frontend assets
pnpm run build

# Build with SSR
pnpm run build:ssr
```

### Testing

```bash
# Run Laravel tests
composer test

# Run PHPUnit
./vendor/bin/phpunit
```

### Code Quality

```bash
# Format PHP code (Pint)
vendor/bin/pint

# Format frontend code (Prettier)
pnpm run format

# Check frontend formatting
pnpm run format:check

# Lint frontend code
pnpm run lint

# TypeScript type checking
pnpm run types
```

## Deployment

Production uses immutable releases behind an atomic `current` symlink. CI
builds and tests the application, ships one tarball, and the server only
extracts and activates it. Composer, pnpm and Vite never run on the VPS.

### Server layout

```
/home/cvhowlad/app3.cvhowlader.com/
├── current -> releases/<sha>     atomic symlink
├── previous -> releases/<sha>    rollback target
├── releases/<sha>/               app, vendor/, public/build, bootstrap/ssr
├── shared/
│   ├── .env                      mode 600, never in CI
│   ├── deploy.env                PHP/PM2 paths + health URL
│   ├── database/database.sqlite  absolute DB_DATABASE, WAL files live here
│   ├── storage/                  uploads, logs, cache, sessions, views
│   └── backups/db-*.sqlite.gz
├── public/                       REAL CWP docroot, never a symlink
├── deploy/                       activate, rollback, backup, health, setup
└── tmp/
```

`public/index.php` is a stable shim that requires
`../current/public/index.php`; the rest of the release's `public/` is copied
into the real docroot (hashed assets are additive, `manifest.json` is replaced
atomically). This keeps CWP's auto-SSL, `open_basedir` and
`disable_symlinks if_not_owner` behaviour intact.

### One-time setup

Run as the deploy user (no sudo), from a checkout or a copy of the `deploy/`
directory on the server:

```bash
bash deploy/server-setup.sh --adopt-sqlite --with-cron
```

`server-setup.sh` seeds `shared/.env` from the existing `$BASE/.env` (keeping
`APP_KEY` intact), copies the live database with `sqlite3 .backup`, and points
the legacy `.env` at the same shared file, so there is no split-brain between
the old in-place app and the first atomic release. Use
`.env.production.example` only as a reference for keys to add or change, for
example:

```dotenv
APP_DEBUG=false
LOG_STACK=daily
QUEUE_CONNECTION=sync
SITEMAP_PATH=/home/cvhowlad/app3.cvhowlader.com/public/sitemap.xml
```

Never copy the template over `shared/.env`; doing so would discard the
production `APP_KEY`. The CWP document root is never changed.

After the first successful deploy, ask the host admin for reboot persistence:

```bash
pm2 startup systemd -u "$USER" --hp "$HOME"
pm2 save
```

### GitHub configuration

Repository variables:

| Variable          | Purpose                                  |
| ----------------- | ---------------------------------------- |
| `DEPLOY_HOST`     | SSH host (falls back to `REMOTE_HOST`)   |
| `DEPLOY_USER`     | SSH user (falls back to `REMOTE_USER`)   |
| `DEPLOY_PATH`     | Absolute base directory on the server    |
| `DEPLOY_PORT`     | SSH port (defaults to 22)                |

Secrets:

| Secret                  | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `SSH_PRIVATE_KEY`       | Deploy key                                   |
| `SSH_HOST_FINGERPRINT`  | Pinned host key (`ssh-keyscan` SHA256 value) |
| `REMOTE_HOST`/`REMOTE_USER` | Optional legacy fallbacks                |

The workflow fails if any required value is missing and refuses to connect
without a pinned fingerprint. Mark the `tests` and `linter` workflows as
required status checks on `master` so branch protection enforces the same gates
as the deploy workflow.

### Deploy and rollback

- Push to `master`: required gates → build tarball → upload → extract into
  `releases/<sha>.tmp` → activate.
- Activation backs up SQLite, migrates, warms caches, publishes assets, swaps
  `current`, restarts PM2, regenerates the sitemap, and runs health checks. Any
  failure restores the previous release automatically.
- Manual rollback: run the `deploy` workflow with `rollback_to=<release-id>`.
  The workflow skips the gates and build so a rollback stays fast.
- Database migrations are **not** reversed by a rollback. Restore
  `shared/backups/db-*.sqlite.gz` if the older code needs the old schema.

SQLite backups use `sqlite3 .backup` (safe with WAL) and are verified with
`PRAGMA integrity_check` before gzip. A deploy warns, but does not fail, if the
`jobs` table has pending rows and no worker exists.

### SSR process

PM2 stays in `fork` mode with `instances: 1`. The host has `nproc=40` and no
swap; cluster mode previously caused an SSR crash loop. Do not switch to
cluster until the sysadmin raises the limits and a load test passes. Logs are
rotated by `pm2-logrotate` (10M, 14 files, compressed) and there is no nightly
`cron_restart`; use the five-minute health cron and external monitoring instead.

## Project Structure

```
├── app/                    # Laravel application code
│   ├── Actions/           # Fortify user actions
│   ├── Console/          # Artisan commands
│   ├── Exports/          # Excel exports
│   ├── Http/            # Controllers, middleware, requests
│   ├── Imports/         # Excel imports
│   ├── Models/          # Eloquent models
│   └── Providers/       # Service providers
├── database/
│   ├── migrations/      # Database migrations
│   ├── factories/       # Model factories
│   └── seeders/         # Database seeders
├── resources/
│   └── js/              # React frontend
│       ├── components/  # UI components
│       ├── layouts/    # Page layouts
│       ├── pages/      # Inertia pages
│       └── hooks/      # Custom React hooks
├── routes/               # Route definitions
├── tests/                # PHPUnit tests
└── vite.config.ts        # Vite configuration
```

## API Endpoints

### Dashboard

- `GET /api/dashboard/stats` — Dashboard statistics
- `GET /api/dashboard/activity` — Activity log

### Products

- `GET /products` — List products (paginated, filterable)
- `POST /products` — Create product
- `GET /products/{id}` — View product
- `PUT /products/{id}` — Update product
- `DELETE /products/{id}` — Delete product
- `GET /products/export` — Export products to Excel
- `POST /products/import` — Import products from Excel

### Authentication

- `GET /login` — Login page
- `POST /login` — Authenticate
- `POST /logout` — Logout
- `GET /register` — Registration page
- `POST /register` — Register new user

### Settings (authenticated)

- `GET /settings/profile` — Profile settings
- `GET /settings/password` — Password settings
- `GET /settings/two-factor` — 2FA settings
- `GET /settings/appearance` — Appearance settings

### Public Routes

- `/` — Landing page
- `/blog` — Blog index
- `/blog/{slug}` — Blog post
- `/privacy-policy` — Privacy policy
- `/terms-of-service` — Terms of service
- `/cookie-policy` — Cookie policy

## Screenshots

### Dashboard

![Dashboard](docs/screenshots/dashboard.png)

### Products List

![Products](docs/screenshots/products.png)

### Product Form

![Product Form](docs/screenshots/product-form.png)

### Settings - Profile

![Settings Profile](docs/screenshots/settings-profile.png)

### Settings - Two-Factor Authentication

![Settings 2FA](docs/screenshots/settings-two-factor.png)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE).

---

Built with ❤️ using Laravel & React

## 📬 Need This For Your Business?

I can customize this for your specific needs:
- Custom fields and workflows
- Multi-warehouse support
- Advanced reporting
- Third-party integrations (Shopify, WooCommerce, etc.)

<a href="mailto:info@cvhowlader.com">📧 Contact me for custom development</a>
