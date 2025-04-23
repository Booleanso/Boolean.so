#!/usr/bin/env node

import { runNewsScraperAndGenerator } from './news-scraper';

/**
 * This script is designed to be run by a CRON job or similar scheduler
 * Example CRON job to run daily at 8:00 AM:
 * 0 8 * * * cd /path/to/webrend && npm run generate-articles
 */

async function main() {
  try {
    console.log('Starting scheduled article generation job');
    console.log('Date:', new Date().toISOString());
    
    // Run the news scraper and article generator
    await runNewsScraperAndGenerator();
    
    console.log('Scheduled article generation job completed successfully');
  } catch (error) {
    console.error('Scheduled job failed:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in scheduler:', error);
  process.exit(1);
}); 