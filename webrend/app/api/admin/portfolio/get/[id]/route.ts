import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { verifyUser } from '../../../../../utils/auth-utils';

type Params = { params: Promise<{ id: string }> };

function buildDefaultProject() {
  return {
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: null as string | null,
    tags: [] as string[],
    dateCompleted: null,
    featured: false,
    clientName: '',
    clientLinkedIn: '',
    clientInstagram: '',
    clientX: '',
    projectGoal: '',
    solution: '',
    keyFeatures: [] as string[],
    challenges: '',
    results: '',
    testimonialText: '',
    testimonialAuthor: '',
    testimonialTitle: '',
    galleryImages: [] as string[],
    videoUrl: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: [] as string[],
    // Extended fields
    industry: '',
    companyStage: '',
    fundingRaised: '',
    location: '',
    partners: [] as string[],
    integrations: [] as string[],
    targetAudience: '',
    whyNow: '',
    marketSize: '',
    industryTrends: '',
    competitiveLandscape: '',
    timeConstraints: '',
    fundingAndPartnerImpact: '',
    strategicPartnerships: [] as string[],
    accelerators: [] as string[],
    valuationChange: '',
    investorLogos: [] as string[],
    mediaCoverage: [] as { title: string; url: string }[],
    awards: [] as string[],
    founderStory: '',
    scalability: '',
    defensibility: '',
    barriersToEntry: '',
    techAdvantages: '',
    ctaText: '',
    ctaLink: '',
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await verifyUser();
    if (user?.email !== 'ceo@webrend.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { id } = await params;
    const doc = await db.collection('portfolioProjects').doc(id).get();
    if (!doc.exists) {
      // Return an empty/default-shaped project so the admin UI can render inputs
      return NextResponse.json({ id, ...buildDefaultProject() });
    }
    const data = doc.data() || {};
    // Merge with defaults to ensure all fields exist
    return NextResponse.json({ id: doc.id, ...{ ...buildDefaultProject(), ...data } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


