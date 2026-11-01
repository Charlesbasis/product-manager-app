module.exports = {
  apps: [
    {
      name: 'laravel-ssr',
      script: 'bootstrap/ssr/ssr.js',   // Direct to Node (drops the PHP wrapper)
      interpreter: 'node',
      cwd: '/home/cvhowlad/app3.cvhowlader.com',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',       // Now effective since PM2 watches Node directly
      kill_timeout: 5000,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 2000,
      cron_restart: '0 4 * * *',       // Daily recycle to clear memory (cPanel limit removed via admin exception)
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
