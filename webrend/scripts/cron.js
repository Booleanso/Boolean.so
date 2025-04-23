#!/usr/bin/env node

/**
 * This script sets up a cron job to run the article generator daily
 * Run with: node cron.js
 */

import { CronJob } from 'cron';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log directory setup
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  const logFile = path.join(logDir, `cron-${new Date().toLocaleDateString().replace(/\//g, '-')}.log`);
  fs.appendFileSync(logFile, logMessage);
}

// Function to run the scheduler
function runArticleGenerator() {
  try {
    log('Starting scheduled article generation...');
    
    // Get the absolute path to the scheduler script
    const schedulerPath = path.resolve(__dirname, 'scheduler.ts');
    
    // Run the scheduler script with ts-node using ESM loader
    execSync(`node --loader ts-node/esm ${schedulerPath} once`, { 
      stdio: 'inherit',
      cwd: path.resolve(process.cwd())
    });
    
    log('Article generation completed successfully');
  } catch (error) {
    log(`Error running article generator: ${error.message}`);
  }
}

// Run the article generator immediately when the script starts
log('Initial run: Starting article generation on startup...');
// Use setTimeout to allow logs to initialize first
setTimeout(() => {
  runArticleGenerator();
  log('Initial article generation completed, setting up scheduled job...');
}, 1000);

// Create a cron job that runs daily at 8:00 AM
// Cron format: Seconds Minutes Hours DayOfMonth Month DayOfWeek
const job = new CronJob('0 0 8 * * *', runArticleGenerator, null, false, 'America/Los_Angeles');

// Start the cron job
job.start();
log(`Cron job started. Will run daily at 8:00 AM Pacific Time.`);
log(`Keep this process running to maintain the schedule.`);
log(`Press Ctrl+C to stop.`);

// Handle process shutdown gracefully
process.on('SIGINT', () => {
  log('Received SIGINT signal. Shutting down cron job...');
  job.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM signal. Shutting down cron job...');
  job.stop();
  process.exit(0);
}); 