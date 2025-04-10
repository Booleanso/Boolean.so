import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, db } from '../../../lib/firebase-admin';
import { Query, CollectionReference } from 'firebase-admin/firestore';

// This route allows authenticated access to Firestore for the marketplace
// It uses Firebase Admin SDK which has full access to Firestore

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const sessionCookie = request.cookies.get('session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the session cookie to get the user
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie);
    } catch (sessionError) {
      console.error('Failed to verify session:', sessionError);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const userId = decodedClaims.uid;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid session (no userId)' },
        { status: 401 }
      );
    }

    // Get the operation to perform from the request body
    const { operation, collection, data, documentId } = await request.json();

    switch (operation) {
      case 'create': {
        // Create a new document in Firestore
        try {
          let docRef;
          
          // Special handling for listings collection
          if (collection === 'listings') {
            // Make sure data.seller exists
            if (!data.seller) {
              data.seller = {};
            }
            
            // Always add userId to seller object
            data.seller.id = userId;
          }
          
          if (documentId) {
            docRef = db.collection(collection).doc(documentId);
            await docRef.set({
              ...data,
              userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } else {
            docRef = await db.collection(collection).add({
              ...data,
              userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          
          return NextResponse.json({
            success: true,
            documentId: documentId || docRef.id
          });
        } catch (firestoreError) {
          console.error('Firestore create error:', firestoreError);
          return NextResponse.json(
            { error: 'Failed to create document in Firestore' },
            { status: 500 }
          );
        }
      }
      
      case 'get': {
        // Get a document from Firestore
        try {
          const docRef = db.collection(collection).doc(documentId);
          const doc = await docRef.get();
          
          if (!doc.exists) {
            return NextResponse.json(
              { error: 'Document not found' },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            success: true,
            document: {
              id: doc.id,
              ...doc.data()
            }
          });
        } catch (firestoreError) {
          console.error('Firestore get error:', firestoreError);
          return NextResponse.json(
            { error: 'Failed to get document from Firestore' },
            { status: 500 }
          );
        }
      }
      
      case 'update': {
        // Update a document in Firestore
        try {
          await db.collection(collection).doc(documentId).update({
            ...data,
            updatedAt: new Date().toISOString()
          });
          
          return NextResponse.json({
            success: true,
            documentId
          });
        } catch (firestoreError) {
          console.error('Firestore update error:', firestoreError);
          return NextResponse.json(
            { error: 'Failed to update document in Firestore' },
            { status: 500 }
          );
        }
      }
      
      case 'delete': {
        // Delete a document from Firestore
        try {
          await db.collection(collection).doc(documentId).delete();
          
          return NextResponse.json({
            success: true,
            documentId
          });
        } catch (firestoreError) {
          console.error('Firestore delete error:', firestoreError);
          return NextResponse.json(
            { error: 'Failed to delete document from Firestore' },
            { status: 500 }
          );
        }
      }
      
      case 'query': {
        // Query documents from Firestore
        try {
          const { field, operator, value, orderByField, orderDirection, limit } = data;
          
          // Start with a collection reference
          let collectionRef: CollectionReference = db.collection(collection);
          
          // Convert to query type as we add constraints
          let query: Query = collectionRef;
          
          if (field && operator && value !== undefined) {
            query = query.where(field, operator, value);
          }
          
          if (orderByField) {
            query = query.orderBy(orderByField, orderDirection || 'asc');
          }
          
          if (limit) {
            query = query.limit(limit);
          }
          
          const snapshot = await query.get();
          
          const documents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          return NextResponse.json({
            success: true,
            documents
          });
        } catch (firestoreError) {
          console.error('Firestore query error:', firestoreError);
          return NextResponse.json(
            { error: 'Failed to query documents from Firestore' },
            { status: 500 }
          );
        }
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error in firestore-access route:', error);
    return NextResponse.json(
      { error: 'Failed to process Firestore request' },
      { status: 500 }
    );
  }
} 