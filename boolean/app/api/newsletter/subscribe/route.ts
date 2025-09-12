import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase-admin';

// Optional Resend integration
// Set RESEND_API_KEY and RESEND_AUDIENCE_ID to enable audience subscription
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

async function addToResendAudience(email: string) {
  if (!RESEND_API_KEY || !RESEND_AUDIENCE_ID) return;
  try {
    await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
  } catch (err) {
    console.error('Resend audience add failed:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();

    // Store or upsert in Firestore collection `newsletter_subscribers`
    const docRef = db.collection('newsletter_subscribers').doc(normalized);
    await docRef.set({
      email: normalized,
      subscribedAt: new Date().toISOString(),
      source: 'coming-soon',
    }, { merge: true });

    // Optionally add to Resend audience
    await addToResendAudience(normalized);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Subscribe failed:', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


