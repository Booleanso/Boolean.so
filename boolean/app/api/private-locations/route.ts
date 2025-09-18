import { NextResponse } from 'next/server';
import { db } from '../../lib/firebase-admin';

// GET private repo locations from Firestore
export async function GET() {
  try {
    // Query projects that opted into globe display and have coordinates
    const snap = await db
      .collection('portfolioProjects')
      .where('privateGlobeEnabled', '==', true)
      .get();

    const locations = snap.docs
      .map(doc => ({ id: doc.id, ...(doc.data() || {}) }))
      .filter((data: any) =>
        typeof data.privateLatitude === 'number' &&
        typeof data.privateLongitude === 'number' &&
        (data.privateName || data.title)
      )
      .map((data: any) => ({
        name: data.privateName || data.title || 'Unnamed Project',
        projectSlug: data.privateProjectSlug || data.slug || data.id,
        location: data.privateLocationText || data.location || '',
        latitude: data.privateLatitude,
        longitude: data.privateLongitude,
        iconUrl: data.privateIconUrl || null,
      }));

    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error('Error fetching private locations from Firestore:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}