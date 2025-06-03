import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import admin from 'firebase-admin';

/**
 * Validates and sanitizes image URLs to ensure they are direct image URLs, not Google search results
 */
function validateAndSanitizeImageUrl(url: string): string | null {
  if (!url) return null;
  
  // Reject Google search result URLs
  if (url.includes('google.com/url') || url.includes('google.com/search') || url.includes('googleapis.com/proxy')) {
    console.warn(`Rejecting Google search URL: ${url}`);
    return null;
  }
  
  // Reject other redirect URLs
  if (url.includes('redirect') || url.includes('proxy') || url.includes('t.co/')) {
    console.warn(`Rejecting redirect URL: ${url}`);
    return null;
  }
  
  // Only allow direct image URLs from trusted domains
  const trustedDomains = [
    'images.unsplash.com',
    'source.unsplash.com',
    'cdn.pixabay.com',
    'images.pexels.com',
    'upload.wikimedia.org',
    'raw.githubusercontent.com'
  ];
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Check if it's from a trusted domain
    const isTrusted = trustedDomains.some(trustedDomain => domain.includes(trustedDomain));
    
    if (!isTrusted) {
      console.warn(`Rejecting untrusted domain: ${domain}`);
      return null;
    }
    
    // Check if it looks like an image URL
    const path = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => path.includes(ext));
    
    // For Unsplash, allow their special URLs even without extensions
    const isUnsplash = domain.includes('unsplash.com');
    
    if (!hasImageExtension && !isUnsplash) {
      console.warn(`URL doesn't appear to be an image: ${url}`);
      return null;
    }
    
    console.log(`Validated image URL: ${url}`);
    return url;
    
  } catch {
    console.warn(`Invalid URL format: ${url}`);
    return null;
  }
}

/**
 * Gets a fallback image based on category
 */
function getFallbackImage(category: string): string {
  const reliableImages = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1562408590-e32931084e23?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=1200&h=630&fit=crop',
    'https://images.unsplash.com/photo-1624953587687-daf255b6b80a?w=1200&h=630&fit=crop'
  ];
  
  // Pick image based on category hash for consistency
  const hash = category.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return reliableImages[hash % reliableImages.length];
}

// This API route can either remove all articles OR fix image URLs in both articles and portfolio projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'remove'; // 'remove' or 'fix-images'
    
    if (action === 'fix-images') {
      let totalFixed = 0;
      const batchSize = 500; // Firestore batch limit
      
      // Fix blog articles
      console.log('Fixing blog articles...');
      const articlesSnapshot = await db.collection('articles').get();
      
      if (!articlesSnapshot.empty) {
        let batch = db.batch();
        let operationCount = 0;
        let articlesFixed = 0;
        
        for (const doc of articlesSnapshot.docs) {
          const data = doc.data() as { 
            title?: string; 
            imageUrl?: string; 
            category?: string; 
          };
          const currentImageUrl = data.imageUrl || '';
          
          // Check if the current image URL is problematic - look for Google URLs more broadly
          const hasGoogleUrl = currentImageUrl.includes('google.com') || 
                              currentImageUrl.includes('googleapis.com') ||
                              currentImageUrl.includes('google.co');
          const validatedUrl = validateAndSanitizeImageUrl(currentImageUrl);
          
          if (!validatedUrl || hasGoogleUrl) {
            // Replace with a fallback image
            const fallbackImage = getFallbackImage(data.category || 'technology');
            
            batch.update(doc.ref, { imageUrl: fallbackImage });
            operationCount++;
            articlesFixed++;
            
            console.log(`Fixed article image URL: ${data.title}`);
            console.log(`  Old URL: ${currentImageUrl}`);
            console.log(`  New URL: ${fallbackImage}`);
            
            // Commit batch if we reach the limit
            if (operationCount >= batchSize) {
              await batch.commit();
              batch = db.batch();
              operationCount = 0;
            }
          }
        }
        
        // Commit any remaining operations
        if (operationCount > 0) {
          await batch.commit();
        }
        
        totalFixed += articlesFixed;
        console.log(`Fixed ${articlesFixed} blog articles`);
      }
      
      // Fix portfolio projects
      console.log('Fixing portfolio projects...');
      const projectsSnapshot = await db.collection('portfolioProjects').get();
      
      if (!projectsSnapshot.empty) {
        let batch = db.batch();
        let operationCount = 0;
        let projectsFixed = 0;
        
        for (const doc of projectsSnapshot.docs) {
          const data = doc.data() as { 
            title?: string; 
            imageUrl?: string; 
            galleryImages?: string[];
          };
          const currentImageUrl = data.imageUrl || '';
          
          // Check if the current image URL is problematic
          const hasGoogleUrl = currentImageUrl.includes('google.com') || 
                              currentImageUrl.includes('googleapis.com') ||
                              currentImageUrl.includes('google.co');
          const validatedUrl = validateAndSanitizeImageUrl(currentImageUrl);
          
          if (!validatedUrl || hasGoogleUrl) {
            // Replace with a fallback image - use a general portfolio fallback
            const fallbackImage = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=630&fit=crop';
            
            const updateData: { imageUrl: string; galleryImages?: string[] } = { imageUrl: fallbackImage };
            
            // Also fix any gallery images that might have Google URLs
            if (data.galleryImages && Array.isArray(data.galleryImages)) {
              const fixedGalleryImages = data.galleryImages.map(galleryUrl => {
                const hasGoogleGalleryUrl = galleryUrl.includes('google.com') || 
                                          galleryUrl.includes('googleapis.com') ||
                                          galleryUrl.includes('google.co');
                const validatedGalleryUrl = validateAndSanitizeImageUrl(galleryUrl);
                
                if (!validatedGalleryUrl || hasGoogleGalleryUrl) {
                  return fallbackImage;
                }
                return galleryUrl;
              });
              updateData.galleryImages = fixedGalleryImages;
            }
            
            batch.update(doc.ref, updateData);
            operationCount++;
            projectsFixed++;
            
            console.log(`Fixed portfolio project image URL: ${data.title}`);
            console.log(`  Old URL: ${currentImageUrl}`);
            console.log(`  New URL: ${fallbackImage}`);
            
            // Commit batch if we reach the limit
            if (operationCount >= batchSize) {
              await batch.commit();
              batch = db.batch();
              operationCount = 0;
            }
          }
        }
        
        // Commit any remaining operations
        if (operationCount > 0) {
          await batch.commit();
        }
        
        totalFixed += projectsFixed;
        console.log(`Fixed ${projectsFixed} portfolio projects`);
      }
      
      return NextResponse.json({ 
        message: `Successfully fixed image URLs for ${totalFixed} items total (${articlesSnapshot.size} articles checked, ${projectsSnapshot.size} portfolio projects checked)`
      });
      
    } else {
      // Original functionality - remove all articles
      const articlesSnapshot = await db.collection('articles').get();
        
      if (articlesSnapshot.empty) {
        return NextResponse.json({ 
          message: 'No articles found in the database' 
        });
      }
      
      // Delete all articles
      const deletePromises = articlesSnapshot.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => doc.ref.delete());
      await Promise.all(deletePromises);
      
      return NextResponse.json({ 
        message: `Successfully removed all ${articlesSnapshot.size} articles from the database` 
      });
    }
  } catch (error) {
    console.error('Error in cleanup operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform cleanup operation: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 