import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, auth } from '@/app/lib/firebase-admin';

// Env for WebRend org
const WEBREND_ORG = process.env.GITHUB_WEBREND_ORG;
const WEBREND_TOKEN = process.env.GITHUB_WEBREND_TOKEN;

async function githubRequest(path: string, init: RequestInit, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    }
  });
  if (!res.ok) {
    let details: unknown;
    try { details = await res.json(); } catch { details = await res.text(); }
    throw new Error(`GitHub ${path} ${res.status}: ${JSON.stringify(details)}`);
  }
  return res.json().catch(() => ({}));
}

export async function POST(request: NextRequest) {
  try {
    if (!WEBREND_ORG || !WEBREND_TOKEN) {
      return NextResponse.json({ error: 'Server missing GitHub org credentials' }, { status: 500 });
    }

    // Auth: buyer session
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const decoded = await auth.verifySessionCookie(sessionCookie);
    const buyerId = decoded.uid;

    const { repoId, sellerId, transactionId, documentId } = await request.json();
    if (!repoId || !sellerId) return NextResponse.json({ error: 'Missing repoId or sellerId' }, { status: 400 });

    // Load user records
    const [buyerDoc, sellerDoc, repoDoc] = await Promise.all([
      db.collection('customers').doc(buyerId).get(),
      db.collection('customers').doc(sellerId).get(),
      db.collection('repositories').doc(String(repoId)).get(),
    ]);

    if (!buyerDoc.exists) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    if (!sellerDoc.exists) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    if (!repoDoc.exists) return NextResponse.json({ error: 'Repository not found' }, { status: 404 });

    const buyer = buyerDoc.data() || {};
    const seller = sellerDoc.data() || {};
    const repo = repoDoc.data() || {} as { name?: string; description?: string };
    const repoName: string | undefined = repo.name;

    if (!repoName) return NextResponse.json({ error: 'Repository name missing' }, { status: 400 });
    if (!seller.githubUsername || !seller.githubAccessToken) {
      return NextResponse.json({ error: 'Seller GitHub not connected' }, { status: 400 });
    }
    if (!buyer.githubUsername) {
      return NextResponse.json({ error: 'Buyer GitHub not connected' }, { status: 400 });
    }

    // 0) Check if a cached template copy exists for this listing/repo
    //    If not, create a single org template once; subsequent buyers fork from it
    const listingKey = String(documentId || repoId);
    const templateDocRef = db.collection('repoTemplates').doc(listingKey);
    const templateDoc = await templateDocRef.get();
    let templateRepoName: string | null = null;
    if (templateDoc.exists) {
      templateRepoName = (templateDoc.data() as any)?.templateRepo as string;
    }
    if (!templateRepoName) {
      // Create a stable template name on first purchase
      const baseName = `${repoName}-template`.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 80);
      const uniqueName = `${baseName}-${Math.floor(Date.now() / 1000)}`;

      // Create org repo as template container
      await githubRequest(`/orgs/${WEBREND_ORG}/repos`, {
        method: 'POST',
        body: JSON.stringify({ name: uniqueName, private: true, description: `Template for ${seller.githubUsername}/${repoName}` })
      }, WEBREND_TOKEN);

      // Import once from seller into this template
      await fetch(`https://api.github.com/repos/${WEBREND_ORG}/${uniqueName}/import`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${WEBREND_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vcs: 'git',
          vcs_url: `https://github.com/${seller.githubUsername}/${repoName}.git`,
          vcs_username: seller.githubUsername,
          vcs_password: seller.githubAccessToken,
        }),
      });

      // Save template pointer
      await templateDocRef.set({ templateRepo: uniqueName, createdAt: new Date().toISOString() });
      templateRepoName = uniqueName;
    }

    // Create a unique buyer copy name
    const timestamp = Math.floor(Date.now() / 1000);
    const copyName = `${repoName}-copy-${buyer.githubUsername}-${timestamp}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-').slice(0, 90);
    
    // 1) Ensure the template repo is flagged as a template (best-effort)
    try {
      await githubRequest(`/repos/${WEBREND_ORG}/${templateRepoName}`, { method: 'PATCH', body: JSON.stringify({ is_template: true }) }, WEBREND_TOKEN);
    } catch { /* ignore if not permitted */ }

    // 2) Generate a new repository from the template (fast, no import polling)
    await githubRequest(`/repos/${WEBREND_ORG}/${templateRepoName}/generate`, {
      method: 'POST',
      body: JSON.stringify({ owner: WEBREND_ORG, name: copyName, private: true, include_all_branches: false, description: `Copy for buyer @${buyer.githubUsername} (txn: ${transactionId || 'n/a'})` })
    }, WEBREND_TOKEN);

    // 3) Record a job to monitor import and transfer when complete
    const jobRef = await db.collection('repoCopyJobs').add({
      status: 'ready_to_transfer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      transactionId: transactionId || null,
      source: `${WEBREND_ORG}/${templateRepoName}`,
      targetOrg: WEBREND_ORG,
      targetRepo: copyName,
      buyerId,
      buyerGithub: buyer.githubUsername,
      sellerId,
    });

    return NextResponse.json({
      success: true,
      jobId: jobRef.id,
      target: `${WEBREND_ORG}/${copyName}`,
      message: 'Copy initiated. Transfer will complete after import finishes.'
    });
  } catch (error) {
    console.error('Copy/transfer error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}


