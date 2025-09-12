import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clear the session cookie by setting it with an expired date
    const cookieStore = await cookies();
    cookieStore.set('session', '', { 
      expires: new Date(0),
      path: '/'
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 