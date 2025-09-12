#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outDir = path.resolve(process.cwd(), 'public', 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'webrend-blog-cron-overview.pdf');

const doc = new PDFDocument({ size: 'LETTER', margins: { top: 64, bottom: 64, left: 64, right: 64 } });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const BODY = { align: 'left', lineGap: 4 };
function h1(t){ doc.moveDown(0.2); doc.fontSize(26).font('Helvetica-Bold').text(t, { align: 'left' }); doc.moveDown(0.6); }
function h2(t){ doc.moveDown(0.2); doc.fontSize(18).font('Helvetica-Bold').text(t, { align: 'left' }); doc.moveDown(0.2); }
function p(t){ doc.fontSize(12).font('Helvetica').text(t, BODY); doc.moveDown(0.2); }
function code(t){ doc.moveDown(0.1); doc.fontSize(10).font('Courier').text(t, { lineGap: 2 }); doc.moveDown(0.2); }
function bullet(items){ doc.fontSize(12).font('Helvetica').list(items, { bulletRadius: 2, textIndent: 10, bulletIndent: 8, lineGap: 2 }); doc.moveDown(0.4); }
function hr(){ const y = doc.y + 6; doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).strokeColor('#DDDDDD').lineWidth(1).stroke(); doc.strokeColor('black'); doc.moveDown(0.8); }

h1('WebRend AI Blog: Cron + Generation Overview');
p('This document summarizes how the automated AI blog pipeline works in WebRend, including the daily cron, scheduler, news scraping, OpenAI generation, and how articles appear on the site.');

h2('System Components');
bullet([
  'scripts/cron.js — boots a daily job at 8:00 AM PT and triggers the scheduler',
  'scripts/scheduler.ts — orchestrates guarded runs (lock file, last-run check), supports once/daemon',
  'scripts/news-scraper.ts — fetches news (NewsData, NewsAPI, GNews), calls OpenAI, saves to Firestore',
  'app/blog/page.tsx — lists recent posts from Firestore',
  'app/blog/[slug]/BlogSlugPage.tsx — renders a full article'
]);

hr();
h2('How It Runs Daily');
p('scripts/cron.js creates a log directory, writes a startup flag, and decides whether to run immediately if this is the first boot or if no run has happened today. It then schedules a CronJob at 08:00 AM America/Los_Angeles. The cron executes the scheduler with ts-node ESM.');
code('npm run cron');

hr();
h2('Scheduling Modes');
p('scripts/scheduler.ts loads env (.env.local), enforces a lock file (article-generation.lock) to prevent overlapping runs, and tracks last run in article-generation-last-run.json. It supports:');
bullet([
  'once (default) — run a single generation cycle and exit',
  'daemon — run immediately then schedule the next daily 8:00 AM run via timers'
]);
code('npm run generate-articles\n# or\nnpm run start-article-generation');

hr();
h2('Generation Pipeline');
p('scripts/news-scraper.ts tries NewsData.io → NewsAPI → GNews. For each fetched item (limited to 2 per run), it:');
bullet([
  'Checks Firestore for duplicates (sourceUrl and title similarity)',
  'Classifies a category via OpenAI (gpt-4o-mini)',
  'Generates 1000–1500 word Markdown content via OpenAI',
  'Computes read time, builds a slug, selects a safe Unsplash image URL',
  'Saves the article into Firestore (collection: articles)'
]);
code('env required: OPENAI_API_KEY, FIREBASE_* (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY), NEWSDATA_API_KEY or NEWS_API_KEY or GNEWS_API_KEY');

// Improve breathing room with a page break before site rendering details
doc.addPage();

h2('Displaying Articles');
p('app/blog/page.tsx queries Firestore (ordered by publishedAt desc) and passes articles to BlogPageClient. Each article needs title, description, publishedAt, imageUrl, category, readTime, slug.');
p('The slug page component app/blog/[slug]/BlogSlugPage.tsx renders Markdown, header meta, image, source link, and share buttons.');

hr();
h2('Operations');
bullet([
  'Logs are written under logs/ (cron-YYYY-MM-DD.log, article-generation-YYYY-MM-DD.log)',
  'Initial run guard: .cron-initial-run-completed file prevents duplicate startup executions',
  'Locking: article-generation.lock avoids concurrent runs; stale (>2h) locks are overwritten',
  'Last-run file: article-generation-last-run.json blocks same-day repeats unless forced',
  'You can create a manual test post with scripts/create-test-article.js'
]);
code('node --loader ts-node/esm scripts/create-test-article.js');

hr();
h2('Commands Quick Ref');
code('npm run cron\nnpm run generate-articles\nnpm run start-article-generation\nnode --loader ts-node/esm scripts/news-scraper.ts');

hr();
h2('Troubleshooting');
bullet([
  'Missing env keys → generation will fail early; check .env.local',
  'Firestore index warnings are printed with a console URL to create the index',
  'Image URL sanitization may reject non-direct or untrusted image hosts',
  'If no news provider returns results, the run aborts with an error log'
]);

p('For details, review the source files mentioned above.');

doc.end();

stream.on('finish', () => {
  console.log('PDF written to', outPath);
});
