import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { verifyUser } from '../../../../../utils/auth-utils';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = params;
    const payload = await req.json();
    // Prevent overriding immutable fields
    delete payload.id;
    if (payload.createdAt) delete payload.createdAt;

    await db.collection('portfolioProjects').doc(id).update(payload);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


