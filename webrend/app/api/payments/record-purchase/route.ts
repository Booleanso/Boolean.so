import { NextResponse } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin'; // Import server-side Firebase admin

// Define the purchase type for Firestore
type Purchase = {
  id: string;
  userId: string;
  listingId: number;
  documentId?: string; // Firestore document ID
  purchaseType: 'purchase' | 'subscription';
  purchaseDate: string;
  status: 'completed' | 'pending' | 'failed';
  transferStatus?: 'pending' | 'completed' | 'failed';
  accessUntil?: string; // For subscriptions
};

export async function POST(request: Request) {
  try {
    // Get user authentication from cookies instead of client-side auth
    // Extract the session cookie from the request
    const cookies = request.headers.get('cookie');
    if (!cookies) {
      return NextResponse.json(
        { error: 'Authentication cookies not found' },
        { status: 401 }
      );
    }
    
    // Parse cookies to get the session token
    const cookiePairs = cookies.split(';').map(cookie => cookie.trim());
    const sessionCookie = cookiePairs
      .find(cookie => cookie.startsWith('session='))
      ?.split('=')[1];
      
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Session cookie not found' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie with Firebase Admin
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
    } catch (error) {
      console.error('Error verifying session cookie:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 401 }
      );
    }
    
    // Get request body
    const { listingId, purchaseType, documentId } = await request.json();
    
    if (!listingId || !purchaseType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Create new purchase record
    const newPurchase: Purchase = {
      id: `purchase_${Date.now()}_${Math.round(Math.random() * 10000)}`,
      userId: userId,
      listingId,
      documentId: documentId || String(listingId), // Use documentId for Firestore
      purchaseType,
      purchaseDate: new Date().toISOString(),
      status: 'completed',
      transferStatus: purchaseType === 'purchase' ? 'pending' : undefined,
      accessUntil: purchaseType === 'subscription' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        : undefined
    };
    
    // Add purchase to Firestore
    await db.collection('purchases').add(newPurchase);
    
    // For one-time purchases, initiate GitHub repository transfer
    if (purchaseType === 'purchase') {
      // In a real app, this would call GitHub's API to initiate the transfer
      // For demo purposes, we're just recording the purchase
      
      // Mark the listing as sold in Firestore
      if (documentId) {
        await db.collection('listings').doc(documentId).update({
          sold: true,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      purchase: newPurchase
    });
    
  } catch (error: unknown) {
    console.error('Error recording purchase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to record purchase';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 