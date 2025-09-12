import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { verifyUser } from '../../../utils/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser();
    const isAdmin = !!user?.email && user.email === 'ceo@webrend.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body.id || '');
    const action = String(body.action || ''); // 'approve' | 'reject'
    if (!id || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    await db.collection('testimonials').doc(id).update({ status });
    return NextResponse.json({ ok: true, status }, { status: 200 });
  } catch (err) {
    console.error('Moderate testimonial error:', err);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await verifyUser();
    const isAdmin = !!user?.email && user.email === 'ceo@webrend.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const snap = await db.collection('testimonials').orderBy('createdAt', 'desc').get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ testimonials: docs }, { status: 200 });
  } catch (err) {
    console.error('List testimonials for moderation error:', err);
    return NextResponse.json({ error: 'Failed to list testimonials' }, { status: 500 });
  }
}


