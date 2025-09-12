import { NextResponse } from 'next/server';
import { verifyUser } from '../../../utils/auth-utils';

export async function GET() {
  try {
    // Verify user authentication
    const user = await verifyUser();
    
    // Check if user is admin (based on email)
    const isAdmin = user?.email === 'ceo@webrend.com';
    
    // Return admin status without exposing sensitive info
    return NextResponse.json(
      { isAdmin },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Authentication error' },
      { status: 500 }
    );
  }
} 