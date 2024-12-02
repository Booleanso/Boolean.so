// app/api/github-site/create/route.ts
import { NextResponse } from 'next/server';
import { octokit, GITHUB_USERNAME } from '../../lib/github';
import { db } from '../../lib/firebase-admin';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Static Site</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Static Site</h1>
        <p>This site was automatically generated!</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`;

const CSS_TEMPLATE = `body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
}
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
}
h1 { color: #333; }`;

const JS_TEMPLATE = `document.addEventListener('DOMContentLoaded', () => {
    console.log('Site loaded successfully!');
});`;

export async function POST(request: Request) {
    try {
        const { userId, repoName } = await request.json();

        if (!userId || !repoName) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Check purchase verification
        const purchaseDoc = await db.collection('purchases').doc(userId).get();
        const purchaseData = purchaseDoc.data();

        if (!purchaseData?.purchaseVerified) {
            return NextResponse.json(
                { error: 'No verified purchase found' },
                { status: 403 }
            );
        }

        // Create repository
        await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            auto_init: true,
            private: false,
        });

        // Helper function to create/update files
        const createFile = async (path: string, content: string) => {
            await octokit.repos.createOrUpdateFileContents({
                owner: GITHUB_USERNAME,
                repo: repoName,
                path,
                message: `Add ${path}`,
                content: Buffer.from(content).toString('base64'),
                branch: 'main'
            });
        };

        // Create site files
        await createFile('index.html', HTML_TEMPLATE);
        await createFile('styles.css', CSS_TEMPLATE);
        await createFile('script.js', JS_TEMPLATE);

        // Enable GitHub Pages
        await octokit.repos.createPagesSite({
            owner: GITHUB_USERNAME,
            repo: repoName,
            source: {
                branch: 'main',
                path: '/'
            }
        });

        // Get pages URL
        const { data: pagesData } = await octokit.repos.getPages({
            owner: GITHUB_USERNAME,
            repo: repoName
        });

        // Store site info in Firestore
        await db.collection('sites').add({
            userId,
            repoName,
            pagesUrl: pagesData.html_url,
            createdAt: new Date().toISOString(),
            priceId: purchaseData.priceId
        });

        return NextResponse.json({
            success: true,
            pagesUrl: pagesData.html_url
        });

    } catch (error) {
        console.error('GitHub site creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}