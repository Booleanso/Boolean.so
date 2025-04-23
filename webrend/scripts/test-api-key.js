#!/usr/bin/env node

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
console.log(`Testing API key: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'Not found'}`);

// Test with NewsAPI
async function testNewsAPI() {
  try {
    console.log('\n==== Testing with NewsAPI ====');
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=technology&pageSize=1&apiKey=${API_KEY}`;
    console.log(`Sending request to: ${url.replace(API_KEY, 'API_KEY')}`);
    
    const response = await fetch(url);
    const status = response.status;
    console.log(`Response status: ${status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    if (status === 200) {
      console.log('✅ NewsAPI connection successful!');
      return true;
    } else {
      console.log('❌ NewsAPI request failed.');
      return false;
    }
  } catch (error) {
    console.error('Error testing NewsAPI:', error);
    return false;
  }
}

// Test with GNews
async function testGNews() {
  try {
    console.log('\n==== Testing with GNews ====');
    // Try to use the same key but with GNews endpoint
    const url = `https://gnews.io/api/v4/top-headlines?topic=technology&country=us&max=1&apikey=${API_KEY}`;
    console.log(`Sending request to: ${url.replace(API_KEY, 'API_KEY')}`);
    
    const response = await fetch(url);
    const status = response.status;
    console.log(`Response status: ${status}`);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
    
    if (status === 200) {
      console.log('✅ GNews connection successful!');
      return true;
    } else {
      console.log('❌ GNews request failed.');
      return false;
    }
  } catch (error) {
    console.error('Error testing GNews:', error);
    return false;
  }
}

// Run both tests
async function testBothAPIs() {
  const newsAPISuccess = await testNewsAPI();
  const gNewsSuccess = await testGNews();
  
  console.log('\n==== Results ====');
  if (newsAPISuccess) {
    console.log('✅ The API key works with NewsAPI.');
    console.log('Use it in your .env.local as: NEWS_API_KEY=' + API_KEY);
  } else if (gNewsSuccess) {
    console.log('✅ The API key works with GNews.');
    console.log('You should move this key to GNEWS_API_KEY in your .env.local:');
    console.log('GNEWS_API_KEY=' + API_KEY);
    console.log('And remove or get a different key for NEWS_API_KEY');
  } else {
    console.log('❌ The API key does not work with either NewsAPI or GNews.');
    console.log('Please check that the key is valid and has not expired.');
    console.log('Sign up for new keys at:');
    console.log('- NewsAPI: https://newsapi.org/');
    console.log('- GNews: https://gnews.io/');
  }
}

testBothAPIs().catch(console.error); 