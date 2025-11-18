// PM2 Ecosystem Configuration
// Use this for advanced PM2 deployment

module.exports = {
  apps: [
    {
      name: 'guidemitra-backend',
      cwd: './backend',
      script: './src/server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-ec2-public-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/guidemitra.git',
      path: '/home/ubuntu/guidemitra',
      'post-deploy': 'cd backend && npm ci --production && npx prisma generate && npx prisma migrate deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /home/ubuntu/guidemitra'
    }
  }
};
