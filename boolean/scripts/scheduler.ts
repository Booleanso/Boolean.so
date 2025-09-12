#!/usr/bin/env node

import { runNewsScraperAndGenerator } from './news-scraper.js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

/**
 * This script can be run:
 * 1. Manually with `npm run generate-articles`
 * 2. On server startup with `npm run start-article-generation`
 * 3. As a scheduled task with a CRON job
 */

// Create a lock file to prevent overlapping executions
const LOCK_FILE = path.join(process.cwd(), 'article-generation.lock');
const LAST_RUN_FILE = path.join(process.cwd(), 'article-generation-last-run.json');

function createLockFile(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = fs.readFileSync(LOCK_FILE, 'utf8');
      const lockTime = new Date(lockData);
      const currentTime = new Date();
      
      // If lock is older than 2 hours, it's stale and can be overwritten
      if (currentTime.getTime() - lockTime.getTime() < 2 * 60 * 60 * 1000) {
        console.log(`Lock file exists and is recent (created ${lockData}). Another instance may be running.`);
        return false;
      }
      console.log('Found stale lock file. Overwriting...');
    }
    
    fs.writeFileSync(LOCK_FILE, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error managing lock file:', error);
    return false;
  }
}

function removeLockFile() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (error) {
    console.error('Error removing lock file:', error);
  }
}

/**
 * Check if we've already run article generation today
 * This adds extra protection against duplicate articles
 */
function hasRunToday(): boolean {
  try {
    if (!fs.existsSync(LAST_RUN_FILE)) {
      return false;
    }

    const lastRunData = JSON.parse(fs.readFileSync(LAST_RUN_FILE, 'utf8'));
    const lastRunDate = new Date(lastRunData.lastRun);
    const today = new Date();
    
    // Check if last run was today
    return lastRunDate.getDate() === today.getDate() &&
           lastRunDate.getMonth() === today.getMonth() &&
           lastRunDate.getFullYear() === today.getFullYear();
    
  } catch (error) {
    console.error('Error checking last run date:', error);
    return false; // If error, assume not run today
  }
}

/**
 * Update the last run timestamp
 */
function updateLastRunTimestamp() {
  try {
    const data = {
      lastRun: new Date().toISOString(),
      articlesGenerated: true
    };
    fs.writeFileSync(LAST_RUN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error updating last run timestamp:', error);
  }
}

/**
 * Function to set up daily scheduling using Node.js timers
 */
function scheduleDaily() {
  const now = new Date();
  const targetHour = 8; // 8:00 AM
  const targetMinute = 0;
  
  // Calculate time until next execution
  let targetTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    targetHour,
    targetMinute
  );
  
  // If the time has already passed today, schedule for tomorrow
  if (now > targetTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  const timeUntilExecution = targetTime.getTime() - now.getTime();
  console.log(`Scheduling next execution for ${targetTime.toLocaleString()}`);
  
  // Schedule the execution
  setTimeout(() => {
    console.log('Running scheduled article generation...');
    runArticleGeneration()
      .then(() => scheduleDaily()) // Schedule the next execution after this one completes
      .catch(error => {
        console.error('Error in scheduled execution:', error);
        scheduleDaily(); // Reschedule even if there was an error
      });
  }, timeUntilExecution);
}

/**
 * Entry point for the script
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'once';
  const forceRun = args.includes('--force');
  
  try {
    if (mode === 'daemon') {
      // Run once immediately then schedule daily
      console.log('Starting in daemon mode. Will run immediately and then daily at 8:00 AM.');
      await runArticleGeneration(forceRun);
      scheduleDaily();
    } else {
      // Run once and exit
      console.log('Running article generation once...');
      await runArticleGeneration(forceRun);
      console.log('Article generation job completed. Exiting.');
      process.exit(0);
    }
  } catch (error) {
    console.error('Critical error in scheduler:', error);
    process.exit(1);
  }
}

/**
 * Main function to run the article generation with lock file protection
 */
async function runArticleGeneration(forceRun = false) {
  // Check if already run today to prevent duplicates (unless forced)
  if (!forceRun && hasRunToday()) {
    console.log('Article generation already ran today. Skipping to prevent duplicates.');
    return;
  }
  
  // Create lock file to prevent concurrent runs
  if (!createLockFile()) {
    console.log('Another instance is already running. Exiting.');
    return;
  }
  
  try {
    console.log('Starting article generation job...');
    console.log(`Date: ${new Date().toLocaleString()}`);
    
    // Run the news scraper and article generator
    const result = await runNewsScraperAndGenerator();
    
    if (result.success) {
      console.log(`Article generation completed successfully. Generated ${result.articlesGenerated} articles.`);
      // Update last run timestamp
      updateLastRunTimestamp();
    } else {
      console.error('Article generation failed:', result.error);
    }
  } catch (error) {
    console.error('Unhandled error in article generation:', error);
  } finally {
    // Always remove the lock file when done
    removeLockFile();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Cleaning up...');
  removeLockFile();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Cleaning up...');
  removeLockFile();
  process.exit(0);
});

// Start the script
main().catch(error => {
  console.error('Unhandled error in main process:', error);
  removeLockFile();
  process.exit(1);
}); 