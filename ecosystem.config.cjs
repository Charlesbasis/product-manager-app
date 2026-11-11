/* global module, process */
const path = require('node:path');

// The deploy scripts export SSR_RELEASE so PM2 always runs the SSR bundle from
// the release that `current` points at, rather than from a stale realpath.
const release = process.env.SSR_RELEASE || __dirname;
const logDir = process.env.SSR_LOG_DIR || path.join(release, 'storage', 'logs');
const appName = process.env.SSR_APP_NAME || 'laravel-ssr';

module.exports = {
    apps: [
        {
            name: appName,
            script: 'bootstrap/ssr/ssr.js',
            interpreter: 'node',
            cwd: release,
            // Stay in fork mode with a single instance until the host's
            // nproc/ulimit limits are raised and a load test passes. Cluster
            // mode previously caused an SSR crash loop on this host.
            exec_mode: 'fork',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '300M',
            kill_timeout: 5000,
            min_uptime: '10s',
            max_restarts: 10,
            restart_delay: 2000,
            merge_logs: true,
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            env: {
                // Keep the SSR process inside the host's 40-process cap.
                UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE || '2',
            },
            out_file: path.join(logDir, 'ssr-out.log'),
            error_file: path.join(logDir, 'ssr-error.log'),
        },
    ],
};
