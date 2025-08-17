import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../lib/firebase-admin';
import { verifyUser } from '../../../../utils/auth-utils';
import { Timestamp } from 'firebase-admin/firestore';

// --- Slugify Function ---
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '') // Remove special chars
    .replace(/--+/g, '-');          // Replace multiple - with single -
}

// Expanded request body interface (slug is generated, not sent)
interface AddProjectRequestBody {
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  tags: string[];
  dateCompleted: string; 
  featured: boolean;
  // New fields
  clientName?: string;
  clientLinkedIn?: string; // Client's LinkedIn URL
  clientInstagram?: string; // Client's Instagram URL
  clientX?: string; // Client's X/Twitter URL
  projectGoal: string; // Required
  solution: string;    // Required
  keyFeatures?: string[];
  challenges?: string;
  results?: string;
  testimonialText?: string;
  testimonialAuthor?: string;
  testimonialTitle?: string;
  galleryImages?: string[];
  videoUrl?: string;   // Video URL for solution section
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  // Extended case study fields
  industry?: string;
  companyStage?: string;
  fundingRaised?: string;
  location?: string;
  partners?: string[];
  integrations?: string[];
  targetAudience?: string;
  whyNow?: string;
  marketSize?: string;
  industryTrends?: string;
  competitiveLandscape?: string;
  timeConstraints?: string;
  fundingAndPartnerImpact?: string;
  strategicPartnerships?: string[];
  accelerators?: string[];
  valuationChange?: string;
  investorLogos?: string[];
  mediaCoverage?: { title: string; url: string }[];
  awards?: string[];
  founderStory?: string;
  scalability?: string;
  defensibility?: string;
  barriersToEntry?: string;
  techAdvantages?: string;
  ctaText?: string;
  ctaLink?: string;
  // Extra from spec
  clientLogoUrl?: string;
  heroHeadline?: string;
  role?: string;
  deliverables?: string[];
  technologyStack?: string[];
  innovations?: string;
  processOutline?: string;
  businessResults?: string;
  technicalResults?: string;
  investors?: string[];
  growthPotential?: string;
  whyCritical?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Admin User Authentication
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json(
        { error: 'Unauthorized: Only admin can add projects.' },
        { status: 403 }
      );
    }

    // 2. Parse and Validate Request Body
    const body: AddProjectRequestBody = await request.json();

    // Updated validation
    if (!body.title || !body.description || !body.imageUrl || !body.tags || !body.dateCompleted || !body.projectGoal || !body.solution) {
      return NextResponse.json(
        { error: 'Missing required fields (title, description, imageUrl, tags, dateCompleted, projectGoal, solution).' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.tags) || body.tags.length === 0) {
      return NextResponse.json({ error: 'Tags must be a non-empty array.' }, { status: 400 });
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.dateCompleted)) {
      return NextResponse.json({ error: 'Invalid dateCompleted format. Use YYYY-MM-DD.' }, { status: 400 });
    }
    
    // Validate optional arrays if they exist
    if (body.keyFeatures && !Array.isArray(body.keyFeatures)) {
       return NextResponse.json({ error: 'keyFeatures must be an array.' }, { status: 400 });
    }
    if (body.galleryImages && !Array.isArray(body.galleryImages)) {
       return NextResponse.json({ error: 'galleryImages must be an array.' }, { status: 400 });
    }
    if (body.seoKeywords && !Array.isArray(body.seoKeywords)) {
       return NextResponse.json({ error: 'seoKeywords must be an array.' }, { status: 400 });
    }

    // 3. Prepare Data for Firestore (including new fields + slug)
    const generatedSlug = slugify(body.title);
    
    const projectData = {
      title: body.title,
      description: body.description,
      imageUrl: body.imageUrl,
      projectUrl: body.projectUrl || null, 
      tags: body.tags,
      dateCompleted: Timestamp.fromDate(new Date(body.dateCompleted)), 
      featured: body.featured || false,
      createdAt: Timestamp.now(),
      // Add new fields, providing defaults or null for optional ones
      clientName: body.clientName || null,
      clientLinkedIn: body.clientLinkedIn || null,
      clientInstagram: body.clientInstagram || null,
      clientX: body.clientX || null,
      projectGoal: body.projectGoal, // Required
      solution: body.solution,       // Required
      keyFeatures: body.keyFeatures || [],
      challenges: body.challenges || null,
      results: body.results || null,
      testimonialText: body.testimonialText || null,
      testimonialAuthor: body.testimonialAuthor || null,
      testimonialTitle: body.testimonialTitle || null,
      galleryImages: body.galleryImages || [],
      videoUrl: body.videoUrl || null, // Add the video URL field
      seoTitle: body.seoTitle || body.title, // Default SEO title to project title
      seoDescription: body.seoDescription || body.description, // Default SEO desc to project desc
      seoKeywords: body.seoKeywords || body.tags, // Default SEO keywords to tags
      // Add the generated slug
      slug: generatedSlug, 
      // Extended fields (optional)
      clientLogoUrl: body.clientLogoUrl || null,
      heroHeadline: body.heroHeadline || null,
      industry: body.industry || null,
      companyStage: body.companyStage || null,
      fundingRaised: body.fundingRaised || null,
      location: body.location || null,
      partners: body.partners || [],
      integrations: body.integrations || [],
      targetAudience: body.targetAudience || null,
      whyNow: body.whyNow || null,
      growthPotential: body.growthPotential || null,
      marketSize: body.marketSize || null,
      industryTrends: body.industryTrends || null,
      competitiveLandscape: body.competitiveLandscape || null,
      timeConstraints: body.timeConstraints || null,
      whyCritical: body.whyCritical || null,
      fundingAndPartnerImpact: body.fundingAndPartnerImpact || null,
      investors: body.investors || [],
      strategicPartnerships: body.strategicPartnerships || [],
      accelerators: body.accelerators || [],
      valuationChange: body.valuationChange || null,
      investorLogos: body.investorLogos || [],
      mediaCoverage: body.mediaCoverage || [],
      awards: body.awards || [],
      role: body.role || null,
      deliverables: body.deliverables || [],
      technologyStack: body.technologyStack || [],
      innovations: body.innovations || null,
      processOutline: body.processOutline || null,
      businessResults: body.businessResults || null,
      technicalResults: body.technicalResults || null,
      founderStory: body.founderStory || null,
      scalability: body.scalability || null,
      defensibility: body.defensibility || null,
      barriersToEntry: body.barriersToEntry || null,
      techAdvantages: body.techAdvantages || null,
      ctaText: body.ctaText || null,
      ctaLink: body.ctaLink || null,
    };

    // --- Optional: Check for slug uniqueness (important for production) ---
    // const existingSlugQuery = await db.collection('portfolioProjects').where('slug', '==', generatedSlug).limit(1).get();
    // if (!existingSlugQuery.empty) {
    //   // Handle duplicate slug, e.g., append a number or return an error
    //   return NextResponse.json({ error: `Slug "${generatedSlug}" already exists. Please modify the title slightly.` }, { status: 409 }); // Conflict
    // }
    // --- End Optional Uniqueness Check ---

    // 4. Add Document to Firestore
    const docRef = await db.collection('portfolioProjects').add(projectData);

    console.log(`Admin ${user.email} added project ${docRef.id} with slug ${generatedSlug}`);

    // 5. Return Success Response (include slug)
    return NextResponse.json(
      { 
        message: 'Project added successfully', 
        id: docRef.id,
        title: projectData.title,
        slug: projectData.slug // Return slug
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Error adding portfolio project:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to add project.', details: errorMessage },
      { status: 500 }
    );
  }
} 