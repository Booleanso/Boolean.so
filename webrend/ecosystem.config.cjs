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
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}; 