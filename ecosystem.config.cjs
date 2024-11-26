module.exports = {
  apps: [
    {
      name: 'Veterinar',
      script: './dist/index.js',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/veterinar-out.log',
      error_file: './logs/veterinar-error.log',
      merge_logs: true,
      instances: 1,
      autorestart: true,
      min_uptime: 60000,
      max_restarts: 10,
      restart_delay: 30000,
      exec_mode: "cluster",
    },
  ],
};
