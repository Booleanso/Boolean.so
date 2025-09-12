import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { verifyUser } from '../../../../../utils/auth-utils';

interface Params {
  params: { id: string };
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await db.collection('portfolioProjects').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


