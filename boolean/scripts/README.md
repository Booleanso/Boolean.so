# WebRend Blog Automation

This directory contains scripts for automating article generation for the WebRend blog. The scripts fetch tech news from public APIs, generate complete articles using OpenAI's GPT models, and save them to Firebase for server-side rendering on the WebRend blog.

## Features

- Automatic fetching of tech news articles from NewsAPI (with GNews as a fallback)
- AI-powered article generation using OpenAI GPT models
- Firebase integration for server-side rendering
- Configurable scheduling to run on startup and daily at a fixed time
- Robust error handling and logging
- Lock file mechanism to prevent concurrent runs

## Prerequisites

Make sure you have the following environment variables set in your `.env.local` file:

```bash
# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key

# NewsAPI Key
NEWS_API_KEY=your-newsapi-key

# Optional: GNews API Key (used as fallback)
GNEWS_API_KEY=your-gnews-api-key

# Firebase Admin SDK configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
```

## Installation

The scripts are included in the WebRend project repository. You don't need to install them separately.

## Usage

### One-time Article Generation

To generate articles once, run:

```bash
npm run generate-articles
```

This will:
1. Fetch the latest tech news
2. Generate articles using AI
3. Save them to Firebase
4. Exit when complete

### Continuous Mode (Run on Startup and Daily)

To start the daemon that runs on startup and schedules daily execution:

```bash
npm run start-article-generation
```

This will:
1. Run the article generation immediately
2. Schedule the next execution for 8:00 AM
3. Continue running in the background
4. Generate articles daily at 8:00 AM

### Integrating with Process Manager (PM2)

For production deployments, you can use PM2 to ensure the scheduler runs on server startup:

```bash
# Install PM2 if not already installed
npm install -g pm2

# Start the article generation daemon with PM2
pm2 start npm --name "webrend-article-generation" -- run start-article-generation

# Make sure it starts when the server reboots
pm2 save
pm2 startup
```

## Script Details

### `news-scraper.ts`

This script is responsible for:
- Fetching news from NewsAPI with a fallback to GNews
- Categorizing articles using AI
- Generating full article content using OpenAI
- Saving articles to Firebase

### `scheduler.ts`

The scheduler manages:
- The execution timing of the news scraper
- Preventing concurrent executions with a lock file
- Scheduling daily runs at 8:00 AM
- Error handling and recovery

## Customization

You can customize the scripts by:

1. **Changing the scheduled time:** Edit the `targetHour` and `targetMinute` variables in `scheduler.ts`
2. **Modifying article categories:** Edit the category list in the prompt in `news-scraper.ts`
3. **Adjusting the number of articles:** Change the `articlesToProcess` slice limit in `news-scraper.ts`
4. **Using different AI models:** Update the `model` parameter in the OpenAI calls

## Logs

Logs are stored in the `logs` directory in the project root. Each daily run creates a log file named `article-generation-YYYY-MM-DD.log`.

## Troubleshooting

If you encounter issues:

1. **Check the logs** in the `logs` directory
2. **Verify environment variables** are set correctly
3. **Check API quotas** for NewsAPI, GNews, and OpenAI
4. **Remove the lock file** if a process was terminated abnormally: `rm article-generation.lock`

## License

This code is part of the WebRend project and is subject to the same license terms. 