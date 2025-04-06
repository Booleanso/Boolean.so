import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET private repo locations
export async function GET(request: NextRequest) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'privatelocation.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Private locations file not found' },
        { status: 404 }
      );
    }
    
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const privateLocations = JSON.parse(fileContents);
      
      return NextResponse.json({
        success: true,
        locations: privateLocations
      });
    } catch (error) {
      console.error('Error reading private locations data:', error);
      return NextResponse.json(
        { error: 'Error parsing private locations data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching private locations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 