#!/usr/bin/env node

/**
 * This script tests if your NewsData.io API key works
 */

import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.NEWS_API_KEY;
console.log(`Testing NewsData.io with API key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'Not found'}`);

// Test with NewsData.io
async function testNewsDataAPI() {
  try {
    console.log('\n==== Testing with NewsData.io ====');
    const url = `https://newsdata.io/api/1/news?apikey=${API_KEY}&country=us&category=technology&size=1`;
    console.log(`Sending request to: ${url.replace(API_KEY, 'API_KEY')}`);
    
    const response = await fetch(url);
    const status = response.status;
    console.log(`Response status: ${status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (status === 200 && data.results && data.results.length > 0) {
      console.log('\n✅ NewsData.io connection successful!');
      console.log('\nHere\'s a sample article:');
      console.log('Title:', data.results[0].title);
      console.log('Description:', data.results[0].description);
      console.log('Source:', data.results[0].source_id);
      console.log('Link:', data.results[0].link);
      
      return true;
    } else {
      console.log('\n❌ NewsData.io request failed or returned no results.');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error testing NewsData.io:', error);
    return false;
  }
}

// Run the test
async function run() {
  const success = await testNewsDataAPI();
  
  if (success) {
    console.log('\n==== Next Steps ====');
    console.log('1. Run the news-scraper to generate articles:');
    console.log('   node --loader ts-node/esm scripts/news-scraper.ts');
    console.log('2. Check your blog page for the new articles');
  } else {
    console.log('\n==== Troubleshooting ====');
    console.log('1. Verify your NewsData.io API key is correct');
    console.log('2. Check if your NewsData.io account is active');
    console.log('3. Try with a different API key if available');
  }
}

run().catch(console.error); 