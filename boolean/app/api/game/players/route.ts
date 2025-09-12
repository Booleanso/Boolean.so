import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

// GET: Fetch all player data
export async function GET() {
  try {
    // Get all players from the players collection
    // No authentication needed as player positions are public
    const playersRef = db.collection('players');
    const snapshot = await playersRef.get();
    
    // Convert to array of players
    const players = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST: Update player position
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    let userId: string | null = null;
    
    // If user is authenticated, verify their identity
    if (sessionCookie) {
      try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch (sessionError) {
        console.error('Failed to verify session:', sessionError);
        // Continue as guest if session is invalid
      }
    }
    
    // Get player data from request body
    const playerData = await request.json();
    
    // Validate the player data
    if (!playerData || !playerData.id) {
      return NextResponse.json(
        { error: 'Invalid player data' },
        { status: 400 }
      );
    }
    
    // Make sure authenticated users can only update their own data
    if (userId && userId !== playerData.id && !playerData.id.startsWith('guest-')) {
      return NextResponse.json(
        { error: 'Unauthorized to update this player' },
        { status: 403 }
      );
    }
    
    // Add timestamp
    playerData.lastUpdated = Date.now();
    
    // Update or create player document
    const playerRef = db.collection('players').doc(playerData.id);
    await playerRef.set(playerData, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

// Delete player data (mark as inactive)
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const playerId = url.searchParams.get('id');
    
    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }
    
    // Get session cookie to verify user
    const sessionCookie = request.cookies.get('session')?.value;
    let userId: string | null = null;
    
    // If user is authenticated, verify their identity
    if (sessionCookie) {
      try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch (sessionError) {
        console.error('Failed to verify session:', sessionError);
        // Continue if session is invalid
      }
    }
    
    // Make sure authenticated users can only delete their own data
    if (userId && userId !== playerId && !playerId.startsWith('guest-')) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this player' },
        { status: 403 }
      );
    }
    
    // Mark player as inactive instead of actually deleting
    const playerRef = db.collection('players').doc(playerId);
    await playerRef.update({
      isActive: false,
      lastUpdated: Date.now()
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking player as inactive:', error);
    return NextResponse.json(
      { error: 'Failed to mark player as inactive' },
      { status: 500 }
    );
  }
} 