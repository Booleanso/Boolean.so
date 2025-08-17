import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const person = String(body.person || '').trim();
    const comment = String(body.comment || '').trim();
    const profileImageUrl = body.profileImageUrl ? String(body.profileImageUrl).trim() : undefined;
    const referenceLink = body.referenceLink ? String(body.referenceLink).trim() : undefined;
    const projectLink = body.projectLink ? String(body.projectLink).trim() : undefined;

    if (!person || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doc = {
      person,
      comment,
      profileImageUrl: profileImageUrl || null,
      referenceLink: referenceLink || null,
      projectLink: projectLink || null,
      status: 'pending',
      createdAt: new Date(),
    };

    await db.collection('testimonials').add(doc);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('Submit testimonial error:', err);
    return NextResponse.json({ error: 'Failed to submit testimonial' }, { status: 500 });
  }
}


