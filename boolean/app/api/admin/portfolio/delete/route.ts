import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../lib/firebase-admin';
import { verifyUser } from '../../../../utils/auth-utils';

interface DeleteProjectRequestBody {
  projectId: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Admin User Authentication
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can delete projects.' },
        { status: 403 }
      );
    }

    // 2. Parse and Validate Request Body
    const body: DeleteProjectRequestBody = await request.json();
    
    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId.' },
        { status: 400 }
      );
    }

    // 3. Delete the document from Firestore
    await db.collection('portfolioProjects').doc(body.projectId).delete();

    console.log(`Admin ${user.email} deleted project ${body.projectId}`);

    // 4. Return Success Response
    return NextResponse.json(
      { 
        message: 'Project deleted successfully', 
        id: body.projectId 
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    console.error('Error deleting portfolio project:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete project.', details: errorMessage },
      { status: 500 }
    );
  }
} 