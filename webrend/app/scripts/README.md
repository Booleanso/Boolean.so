# WebRend Blog Automation Scripts

This directory contains scripts for automating content for the WebRend blog.

## Scripts Overview

1. **news-scraper.ts** - Fetches recent tech news, generates full articles using AI, and stores them in Firebase
2. **scheduler.ts** - A wrapper script designed to be run by a CRON job for daily article generation

## Required Environment Variables

Make sure to set up the following environment variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# News API Key
NEWS_API_KEY=your-news-api-key

# Firebase Admin SDK variables are also required
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
```

## Running the Scripts

### Manual Execution

To run the scripts manually:

```bash
# Generate articles:
npm run generate-articles

# Or run the news scraper directly:
npm run scrape-news
```

### Setting Up Automated Daily Article Generation

To set up a CRON job for daily article generation (on a Linux/Unix system):

1. Open your crontab file:
   ```bash
   crontab -e
   ```

2. Add a line to run the script daily at 8:00 AM:
   ```bash
   0 8 * * * cd /path/to/webrend && npm run generate-articles >> /path/to/logs/article-generation.log 2>&1
   ```

3. Save and exit.

## How It Works

1. The news scraper fetches recent technology news articles from the News API
2. For each news article, it uses OpenAI to:
   - Determine a relevant category for the content
   - Generate a comprehensive article based on the news piece
3. Articles are stored in Firebase with:
   - Original title and description preserved
   - AI-generated content in Markdown format
   - A slug generated from the title
   - Relevant metadata like category, read time, and source information
4. The web app can then render these articles in the blog section

## Customization

You can customize the article generation process by modifying:

- The news categories/country in the `fetchNews()` function
- The AI prompt in the `generateArticleWithAI()` function
- The article structure in the Firestore document

## Troubleshooting

If articles aren't being generated:

1. Check that your API keys are valid
2. Ensure Firebase permissions are configured correctly
3. Look at the console output for any error messages
4. Make sure you have sufficient quota on your OpenAI account 