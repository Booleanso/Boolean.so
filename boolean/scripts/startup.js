#!/usr/bin/env node

/**
 * Startup script to run both the Next.js application and the cron job
 * Can be used with process managers like PM2
 * 
 * Usage: node startup.js
 */

import { spawn } from 'child_process';
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
  const logFile = path.join(logDir, `startup-${new Date().toLocaleDateString().replace(/\//g, '-')}.log`);
  fs.appendFileSync(logFile, logMessage);
}

// Start the Next.js application
function startNextApp() {
  log('Starting Next.js application...');
  const nextApp = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });
  
  nextApp.stdout.on('data', (data) => {
    process.stdout.write(`[NEXT] ${data}`);
  });
  
  nextApp.stderr.on('data', (data) => {
    process.stderr.write(`[NEXT] ${data}`);
  });
  
  nextApp.on('close', (code) => {
    log(`Next.js process exited with code ${code}`);
  });
  
  return nextApp;
}

// Start the cron job
function startCronJob() {
  log('Starting article generation cron job...');
  const cronJob = spawn('node', ['scripts/cron.js'], {
    stdio: 'pipe',
    shell: true
  });
  
  cronJob.stdout.on('data', (data) => {
    process.stdout.write(`[CRON] ${data}`);
  });
  
  cronJob.stderr.on('data', (data) => {
    process.stderr.write(`[CRON] ${data}`);
  });
  
  cronJob.on('close', (code) => {
    log(`Cron job process exited with code ${code}`);
  });
  
  return cronJob;
}

// Start both processes
const nextApp = startNextApp();
const cronJob = startCronJob();

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Received SIGINT signal. Shutting down all processes...');
  nextApp.kill('SIGINT');
  cronJob.kill('SIGINT');
  
  // Give processes time to clean up before exiting
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM signal. Shutting down all processes...');
  nextApp.kill('SIGTERM');
  cronJob.kill('SIGTERM');
  
  // Give processes time to clean up before exiting
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

log('All services started successfully. Press Ctrl+C to stop all services.'); 