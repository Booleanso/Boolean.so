module.exports = {
  apps: [
    {
      name: 'webrend-nextjs',
      script: 'npm',
      args: 'run dev',
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'webrend-cron',
      script: './scripts/cron.js',  // Use direct path with './' prefix
      watch: false,
      restart_delay: 10000, // 10 second delay between restarts
      exp_backoff_restart_delay: 3000, // Exponential backoff for restarts
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 