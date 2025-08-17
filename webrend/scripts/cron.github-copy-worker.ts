/**
 * Cron worker to finalize GitHub repo copy → buyer transfer.
 * - Polls repoCopyJobs for importing jobs
 * - When import completes, transfers the org repo to the buyer account
 * - Marks job and transaction statuses
 *
 * Run: npx ts-node scripts/cron.github-copy-worker.ts
 */

import 'dotenv/config';
import fetch from 'node-fetch';
import { db } from '@/app/lib/firebase-admin';

const WEBREND_ORG = process.env.GITHUB_WEBREND_ORG as string;
const WEBREND_TOKEN = process.env.GITHUB_WEBREND_TOKEN as string;

async function github(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `token ${WEBREND_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`${path} ${res.status}: ${text}`);
  }
  return data;
}

async function runOnce() {
  const snapshot = await db.collection('repoCopyJobs')
    .where('status', 'in', ['ready_to_transfer'])
    .limit(10)
    .get();

  for (const doc of snapshot.docs) {
    const job = doc.data() as any;
    const jobId = doc.id;
    const { targetRepo, buyerGithub, transactionId } = job;

    try {
      if (job.status === 'ready_to_transfer') {
        // Transfer the org repo copy to the buyer
        await github(`/repos/${WEBREND_ORG}/${targetRepo}/transfer`, {
          method: 'POST',
          body: JSON.stringify({ new_owner: buyerGithub })
        });
        await doc.ref.update({ status: 'transferred', transferredAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        if (transactionId) await db.collection('transactions').doc(transactionId).update({ transferStatus: 'completed', transferCompletedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error(`Job ${jobId} error:`, err);
      await doc.ref.update({ status: 'failed', error: String(err), updatedAt: new Date().toISOString() });
      if (transactionId) await db.collection('transactions').doc(transactionId).update({ transferStatus: 'failed', transferError: String(err), updatedAt: new Date().toISOString() });
    }
  }
}

runOnce().then(() => {
  console.log('Copy worker run complete');
  process.exit(0);
}).catch((e) => {
  console.error('Worker failed', e);
  process.exit(1);
});


