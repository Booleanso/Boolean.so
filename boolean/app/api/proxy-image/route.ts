import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    // Basic validation
    if (!/^https?:\/\//i.test(url)) {
      return new Response('Invalid protocol', { status: 400 });
    }

    // Fetch the remote image
    const upstream = await fetch(url, {
      // Do not forward cookies/credentials
      cache: 'force-cache',
      headers: {
        'User-Agent': 'WebRendImageProxy/1.0 (+webrend.com)'
      }
    });

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: 502 });
    }

    // Clone headers we care about
    const contentType = upstream.headers.get('content-type') || 'image/png';
    const cacheControl = upstream.headers.get('cache-control') || 'public, max-age=86400, immutable';

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
        // Allow three.js to fetch as texture
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response('Proxy error', { status: 500 });
  }
}


