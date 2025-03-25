import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { auth } from '../../../lib/firebase-admin'; // Import server-side Firebase admin

// In a real application, you would use a database
// For this demo, we'll use a simple JSON file

type Purchase = {
  id: string;
  userId: string;
  listingId: number;
  purchaseType: 'purchase' | 'subscription';
  purchaseDate: string;
  status: 'completed' | 'pending' | 'failed';
  transferStatus?: 'pending' | 'completed' | 'failed';
  accessUntil?: string; // For subscriptions
};

const getPurchasesDataPath = () => {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create the data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  return path.join(dataDir, 'user-purchases.json');
};

const getUserPurchases = (): Purchase[] => {
  const filePath = getPurchasesDataPath();
  
  if (!fs.existsSync(filePath)) {
    // Return empty array if file doesn't exist yet
    return [];
  }
  
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading purchases data:', error);
    return [];
  }
};

const savePurchases = (purchases: Purchase[]) => {
  const filePath = getPurchasesDataPath();
  fs.writeFileSync(filePath, JSON.stringify(purchases, null, 2), 'utf8');
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
    const { listingId, purchaseType } = await request.json();
    
    if (!listingId || !purchaseType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Get current purchases
    const purchases = getUserPurchases();
    
    // Create new purchase record
    const newPurchase: Purchase = {
      id: `purchase_${Date.now()}_${Math.round(Math.random() * 10000)}`,
      userId: userId,
      listingId,
      purchaseType,
      purchaseDate: new Date().toISOString(),
      status: 'completed',
      transferStatus: purchaseType === 'purchase' ? 'pending' : undefined,
      accessUntil: purchaseType === 'subscription' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        : undefined
    };
    
    // Add to purchases
    purchases.push(newPurchase);
    
    // Save updated purchases
    savePurchases(purchases);
    
    // For one-time purchases, initiate GitHub repository transfer
    if (purchaseType === 'purchase') {
      // In a real app, this would call GitHub's API to initiate the transfer
      // For demo purposes, we're just recording the purchase
      
      // Simulate initiating the transfer
      // await initiateGitHubTransfer(listingId, userId);
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