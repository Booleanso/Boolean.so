import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db, auth } from '@/app/lib/firebase-admin';

interface Review {
  id?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
}

function sanitizeRating(input: unknown): number {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    const reviewsSnapshot = await db
      .collection('listings')
      .doc(listingId)
      .collection('reviews')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const reviews: Review[] = reviewsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Review, 'id'>),
    }));

    // Calculate summary
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1|2|3|4|5, number>;
    let total = 0;
    let sum = 0;
    for (const r of reviews) {
      const rating = sanitizeRating(r.rating) as 1|2|3|4|5;
      counts[rating]++;
      total++;
      sum += rating;
    }
    const average = total > 0 ? Number((sum / total).toFixed(2)) : 0;

    return NextResponse.json({
      success: true,
      reviews,
      summary: {
        total,
        average,
        counts,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify session and get user
    let decoded;
    try {
      decoded = await auth.verifySessionCookie(sessionCookie);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const uid = decoded.uid as string;
    const { listingId } = await params;
    if (!listingId) {
      return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
    }

    const body = await request.json();
    const rating = sanitizeRating(body.rating);
    const commentRaw = String(body.comment || '').trim();
    const comment = commentRaw.slice(0, 5000); // limit size

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    // Load display name/avatar from Auth and optional users collection
    const userRecord = await auth.getUser(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    const firestoreUser = userDoc.exists ? userDoc.data() : undefined;
    const username = (firestoreUser?.username as string) || userRecord.displayName || (userRecord.email?.split('@')[0] ?? 'user');
    const avatarUrl = (firestoreUser?.avatarUrl as string) || userRecord.photoURL || undefined;

    const reviewsCol = db.collection('listings').doc(listingId).collection('reviews');

    // Enforce one review per user: upsert on existing
    const existingSnap = await reviewsCol.where('userId', '==', uid).limit(1).get();
    const now = new Date().toISOString();

    if (!existingSnap.empty) {
      const docRef = existingSnap.docs[0].ref;
      await docRef.update({
        rating,
        comment,
        username,
        avatarUrl,
        updatedAt: now,
      });
    } else {
      await reviewsCol.add({
        userId: uid,
        username,
        avatarUrl,
        rating,
        comment,
        createdAt: now,
      } as Review);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error posting review:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


