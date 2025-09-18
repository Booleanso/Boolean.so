import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { generateSlug } from '../../../../../lib/utils';
import { verifyUser } from '../../../../../utils/auth-utils';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = await context.params;
    const payload = await req.json();
    // Prevent overriding immutable fields
    delete payload.id;
    if (payload.createdAt) delete payload.createdAt;

    // Normalize hidden projectTypes if provided
    if (payload && 'projectTypes' in payload) {
      const allowedProjectTypes = ['Websites', 'Apps', 'Software', 'Firmware'];
      const lowerAllowed = allowedProjectTypes.map((a: string) => a.toLowerCase());
      const result: string[] = [];
      if (Array.isArray(payload.projectTypes)) {
        for (const item of payload.projectTypes) {
          const s = String(item || '').trim().toLowerCase();
          if (!s) continue;
          const idx = lowerAllowed.indexOf(s);
          if (idx >= 0 && !result.includes(allowedProjectTypes[idx])) {
            result.push(allowedProjectTypes[idx]);
          }
        }
      }
      payload.projectTypes = result;
    }

    // Normalize dateCompleted to a Firestore Timestamp by passing a JS Date
    if (typeof payload.dateCompleted === 'string' && payload.dateCompleted) {
      const d = new Date(payload.dateCompleted);
      if (!Number.isNaN(d.getTime())) payload.dateCompleted = d;
      else delete payload.dateCompleted; // invalid
    }

    // Ensure inProgress is boolean if provided
    if (payload && 'inProgress' in payload) {
      payload.inProgress = !!payload.inProgress;
    }

    // Normalize private globe fields if provided
    if (payload && 'privateGlobeEnabled' in payload) {
      payload.privateGlobeEnabled = !!payload.privateGlobeEnabled;
    }
    if (payload && 'privateLatitude' in payload) {
      const lat = Number(payload.privateLatitude);
      if (Number.isFinite(lat)) payload.privateLatitude = lat; else delete payload.privateLatitude;
    }
    if (payload && 'privateLongitude' in payload) {
      const lng = Number(payload.privateLongitude);
      if (Number.isFinite(lng)) payload.privateLongitude = lng; else delete payload.privateLongitude;
    }

    // Auto-generate slug from title
    if (payload.title) {
      let newSlug = generateSlug(String(payload.title));
      if (!newSlug) newSlug = id; // fallback
      // Ensure uniqueness across other docs
      const dupSnap = await db
        .collection('portfolioProjects')
        .where('slug', '==', newSlug)
        .limit(1)
        .get();
      if (!dupSnap.empty && dupSnap.docs[0].id !== id) {
        newSlug = `${newSlug}-${id.slice(0, 6)}`;
      }
      payload.slug = newSlug;
    }

    await db.collection('portfolioProjects').doc(id).update(payload);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


