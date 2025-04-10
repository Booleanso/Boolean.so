import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';

export interface PurchasedRepo {
  id: string;
  repoId: string;
  title: string;
  description: string;
  image: string;
  seller: {
    id: string;
    username: string;
  };
  purchaseDate: string;
  type: 'purchase' | 'subscription';
  accessUntil?: string;
  githubUrl: string;
  status: string;
  transferStatus?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching purchased repositories - starting');
    // Get the session cookie for authentication
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('No session cookie found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
      console.log('Session verified for user:', decodedClaims.uid);
    } catch (sessionError) {
      console.error('Failed to verify session:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    
    if (!userId) {
      console.log('No userId in decoded claims');
      return NextResponse.json(
        { error: 'Invalid session (no userId)' },
        { status: 401 }
      );
    }

    // First, check if the user document has purchased repos information
    console.log('Fetching user document for:', userId);
    try {
      const userDoc = await db.collection('customers').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log('User document not found in customers collection');
        return NextResponse.json({ purchasedRepos: [] });
      }
      
      const userData = userDoc.data() || {};
      const userPurchases = userData.purchasedRepos || [];
      console.log(`Found ${userPurchases.length} purchases in user document`);
      
      // If the user has no purchases recorded, perform the transaction query
      if (userPurchases.length === 0) {
        // Get transactions where the user is the buyer
        console.log('No purchases in user document, querying transactions collection');
        const transactionsSnapshot = await db.collection('transactions')
          .where('buyerId', '==', userId)
          .where('status', '==', 'completed')
          .orderBy('createdAt', 'desc')
          .get();
        
        if (transactionsSnapshot.empty) {
          console.log('No transactions found for user');
          return NextResponse.json({ purchasedRepos: [] });
        }
        
        console.log(`Found ${transactionsSnapshot.docs.length} transactions for user`);
      }

      const purchasedRepos: PurchasedRepo[] = [];
      
      // Process each transaction (either from user document or transaction query)
      const transactionIds = userPurchases.map((p: { transactionId: string }) => p.transactionId);
      let transactions;
      
      try {
        if (transactionIds.length > 0) {
          console.log(`Fetching ${transactionIds.length} transactions by IDs`);
          transactions = await Promise.all(transactionIds.map((id: string) => 
            db.collection('transactions').doc(id).get()));
        } else {
          console.log('Fetching transactions by query');
          transactions = (await db.collection('transactions')
            .where('buyerId', '==', userId)
            .where('status', '==', 'completed')
            .orderBy('createdAt', 'desc')
            .get()).docs;
          console.log(`Query returned ${transactions.length} transactions`);
        }
      } catch (txError) {
        console.error('Error fetching transactions:', txError);
        return NextResponse.json(
          { error: 'Failed to retrieve transaction data' },
          { status: 500 }
        );
      }
      
      // Process each transaction
      let processedCount = 0;
      let errorCount = 0;
      
      for (const transactionDoc of transactions) {
        if (!transactionDoc.exists) {
          console.log(`Transaction ${transactionDoc.id} does not exist`);
          continue;
        }
        
        const transaction = transactionDoc.data();
        console.log(`Processing transaction ${transactionDoc.id}, type: ${transaction.pricingType}`);
        
        try {
          // Get repository details - skip if not found
          const repoDoc = await db.collection('repositories').doc(transaction.repoId).get();
          if (!repoDoc.exists) {
            console.log(`Repository ${transaction.repoId} not found, skipping this transaction`);
            continue;
          }
          
          const repoData = repoDoc.data() || {};
          
          // Get listing details - don't error if not found
          let listingData: any = {};
          if (transaction.listingId) {
            const listingDoc = await db.collection('listings').doc(transaction.listingId).get();
            if (listingDoc.exists) {
              listingData = listingDoc.data() || {};
            } else {
              console.log(`Listing ${transaction.listingId} not found for transaction ${transactionDoc.id}`);
            }
          } else {
            console.log(`No listingId provided for transaction ${transactionDoc.id}`);
          }
          
          // Get seller details
          let sellerData: any = {};
          if (transaction.sellerId) {
            const sellerDoc = await db.collection('customers').doc(transaction.sellerId).get();
            if (sellerDoc.exists) {
              sellerData = sellerDoc.data() || {};
            } else {
              console.log(`Seller ${transaction.sellerId} not found for transaction ${transactionDoc.id}`);
            }
          }

          // Determine GitHub URL based on purchase type
          let githubUrl = '';
          const isOnetime = transaction.pricingType === 'onetime';
          
          if (isOnetime) {
            // For one-time purchases, the repo should be transferred to the buyer
            githubUrl = `https://github.com/${transaction.buyerGithubUsername || 'username'}/${repoData.name || 'repo'}`;
          } else {
            // For subscriptions, the repo remains with the seller but buyer has access
            githubUrl = `https://github.com/${transaction.sellerGithubUsername || sellerData.githubUsername || 'username'}/${repoData.name || 'repo'}`;
          }

          // Get subscription info if applicable
          let accessUntil;
          if (!isOnetime && transaction.stripeSubscriptionId) {
            try {
              const subscriptionsQuery = await db.collection('subscriptions')
                .where('stripeSubscriptionId', '==', transaction.stripeSubscriptionId)
                .limit(1)
                .get();
              
              if (!subscriptionsQuery.empty) {
                const subscription = subscriptionsQuery.docs[0].data();
                // Calculate access until date (30 days from last billing or start date)
                const lastBillingDate = subscription.lastBillingDate || subscription.startDate;
                if (lastBillingDate) {
                  const billingDate = new Date(lastBillingDate);
                  const expiryDate = new Date(billingDate);
                  expiryDate.setDate(billingDate.getDate() + 30); // Add 30 days
                  accessUntil = expiryDate.toISOString();
                }
              }
            } catch (subError) {
              console.error('Error getting subscription info:', subError);
            }
          }

          purchasedRepos.push({
            id: transactionDoc.id,
            repoId: transaction.repoId,
            title: listingData.name || repoData.name || 'Unknown Repository',
            description: listingData.description || repoData.description || '',
            image: listingData.imageUrl || 'https://placehold.co/400x250/4299e1/ffffff?text=Repository',
            seller: {
              id: transaction.sellerId || '',
              username: transaction.sellerGithubUsername || sellerData.githubUsername || 'Unknown Seller'
            },
            purchaseDate: transaction.createdAt,
            type: isOnetime ? 'purchase' : 'subscription',
            accessUntil,
            githubUrl,
            status: transaction.status,
            transferStatus: isOnetime ? transaction.transferStatus : undefined
          });
        } catch (itemError) {
          errorCount++;
          console.error(`Error processing transaction ${transactionDoc.id}:`, itemError);
          // Continue with the next transaction instead of failing the entire request
          continue;
        }
        
        processedCount++;
      }
      
      console.log(`Successfully processed ${processedCount} out of ${transactions.length} transactions with ${errorCount} errors`);
      return NextResponse.json({ purchasedRepos });
    } catch (userError) {
      console.error('Error accessing user data:', userError);
      return NextResponse.json(
        { error: 'Failed to access user data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching purchased repositories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 