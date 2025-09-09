'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../page.module.css';

type MediaCoverage = { title: string; url: string };

interface ProjectForm {
  title: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  tagsCSV: string;
  projectType: string;
  projectTypes: string[];
  dateCompleted: string; // YYYY-MM-DD
  featured: boolean;

  clientName: string;
  clientLinkedIn: string;
  clientInstagram: string;
  clientX: string;

  projectGoal: string;
  solution: string;
  keyFeaturesCSV: string;
  challenges: string;
  results: string;

  testimonialText: string;
  testimonialAuthor: string;
  testimonialTitle: string;
  galleryImagesCSV: string;
  videoUrl: string;

  seoTitle: string;
  seoDescription: string;
  seoKeywordsCSV: string;

  industry: string;
  companyStage: string;
  fundingRaised: string;
  location: string;
  partnersCSV: string;
  integrationsCSV: string;
  targetAudience: string;
  whyNow: string;
  marketSize: string;
  industryTrends: string;
  competitiveLandscape: string;
  timeConstraints: string;
  fundingAndPartnerImpact: string;
  strategicPartnershipsCSV: string;
  acceleratorsCSV: string;
  valuationChange: string;
  investorLogosCSV: string;
  mediaCoverageLines: string; // Title|URL per line
  awardsCSV: string;
  founderStory: string;
  scalability: string;
  defensibility: string;
  barriersToEntry: string;
  techAdvantages: string;
  ctaText: string;
  ctaLink: string;
  // Extras
  clientLogoUrl: string;
  heroHeadline: string;
  role: string;
  deliverablesCSV: string;
  technologyStackCSV: string;
  innovations: string;
  processOutline: string;
  businessResults: string;
  technicalResults: string;
  investorsCSV: string;
  growthPotential: string;
  whyCritical: string;
}

function toCSV(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : '';
}
function fromCSV(csv: string): string[] {
  return csv.split(',').map(v => v.trim()).filter(Boolean);
}
function toDateInput(value: any): string {
  try {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : new Date(value.seconds ? value.seconds * 1000 : value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
}
function toLines(arr: MediaCoverage[] | unknown): string {
  return Array.isArray(arr) ? (arr as MediaCoverage[]).map(m => `${m.title || m.url}|${m.url}`).join('\n') : '';
}
function fromLines(lines: string): MediaCoverage[] {
  return lines.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const [title, url] = l.split('|').map(s => s?.trim());
    return url ? { title: title || url, url } : null;
  }).filter(Boolean) as MediaCoverage[];
}

export default function EditPortfolioProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProjectForm | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/admin/portfolio/get/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load project');
        const f: ProjectForm = {
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          projectUrl: data.projectUrl || '',
          tagsCSV: toCSV(data.tags),
          projectType: data.projectType || '',
          projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
          dateCompleted: toDateInput(data.dateCompleted),
          featured: !!data.featured,

          clientName: data.clientName || '',
          clientLinkedIn: data.clientLinkedIn || '',
          clientInstagram: data.clientInstagram || '',
          clientX: data.clientX || '',

          projectGoal: data.projectGoal || '',
          solution: data.solution || '',
          keyFeaturesCSV: toCSV(data.keyFeatures),
          challenges: data.challenges || '',
          results: data.results || '',

          testimonialText: data.testimonialText || '',
          testimonialAuthor: data.testimonialAuthor || '',
          testimonialTitle: data.testimonialTitle || '',
          galleryImagesCSV: toCSV(data.galleryImages),
          videoUrl: data.videoUrl || '',

          seoTitle: data.seoTitle || '',
          seoDescription: data.seoDescription || '',
          seoKeywordsCSV: toCSV(data.seoKeywords),
          clientLogoUrl: data.clientLogoUrl || '',
          heroHeadline: data.heroHeadline || '',

          industry: data.industry || '',
          companyStage: data.companyStage || '',
          fundingRaised: data.fundingRaised || '',
          location: data.location || '',
          partnersCSV: toCSV(data.partners),
          integrationsCSV: toCSV(data.integrations),
          targetAudience: data.targetAudience || '',
          whyNow: data.whyNow || '',
          marketSize: data.marketSize || '',
          industryTrends: data.industryTrends || '',
          competitiveLandscape: data.competitiveLandscape || '',
          timeConstraints: data.timeConstraints || '',
          growthPotential: data.growthPotential || '',
          fundingAndPartnerImpact: data.fundingAndPartnerImpact || '',
          strategicPartnershipsCSV: toCSV(data.strategicPartnerships),
          acceleratorsCSV: toCSV(data.accelerators),
          valuationChange: data.valuationChange || '',
          investorLogosCSV: toCSV(data.investorLogos),
          investorsCSV: toCSV(data.investors),
          mediaCoverageLines: toLines(data.mediaCoverage),
          awardsCSV: toCSV(data.awards),
          role: data.role || '',
          deliverablesCSV: toCSV(data.deliverables),
          technologyStackCSV: toCSV(data.technologyStack),
          innovations: data.innovations || '',
          processOutline: data.processOutline || '',
          businessResults: data.businessResults || '',
          technicalResults: data.technicalResults || '',
          whyCritical: data.whyCritical || '',
          founderStory: data.founderStory || '',
          scalability: data.scalability || '',
          defensibility: data.defensibility || '',
          barriersToEntry: data.barriersToEntry || '',
          techAdvantages: data.techAdvantages || '',
          ctaText: data.ctaText || '',
          ctaLink: data.ctaLink || '',
        };
        setForm(f);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if (id) run();
  }, [id]);

  const set = (k: keyof ProjectForm, v: any) => setForm(prev => ({ ...(prev as ProjectForm), [k]: v }));

  const payload = useMemo(() => {
    if (!form) return null;
    return {
      title: form.title,
      description: form.description,
      imageUrl: form.imageUrl,
      projectUrl: form.projectUrl || null,
      tags: fromCSV(form.tagsCSV),
      projectType: form.projectType || null,
      projectTypes: Array.isArray(form.projectTypes) ? form.projectTypes : [],
      dateCompleted: form.dateCompleted,
      featured: !!form.featured,

      clientName: form.clientName || null,
      clientLinkedIn: form.clientLinkedIn || null,
      clientInstagram: form.clientInstagram || null,
      clientX: form.clientX || null,

      projectGoal: form.projectGoal,
      solution: form.solution,
      keyFeatures: fromCSV(form.keyFeaturesCSV),
      challenges: form.challenges || null,
      results: form.results || null,

      testimonialText: form.testimonialText || null,
      testimonialAuthor: form.testimonialAuthor || null,
      testimonialTitle: form.testimonialTitle || null,
      galleryImages: fromCSV(form.galleryImagesCSV),
      videoUrl: form.videoUrl || null,

      seoTitle: form.seoTitle || form.title,
      seoDescription: form.seoDescription || form.description,
      seoKeywords: fromCSV(form.seoKeywordsCSV),
      clientLogoUrl: form.clientLogoUrl || null,
      heroHeadline: form.heroHeadline || null,

      industry: form.industry || null,
      companyStage: form.companyStage || null,
      fundingRaised: form.fundingRaised || null,
      location: form.location || null,
      partners: fromCSV(form.partnersCSV),
      integrations: fromCSV(form.integrationsCSV),
      targetAudience: form.targetAudience || null,
      whyNow: form.whyNow || null,
      marketSize: form.marketSize || null,
      industryTrends: form.industryTrends || null,
      competitiveLandscape: form.competitiveLandscape || null,
      timeConstraints: form.timeConstraints || null,
      growthPotential: form.growthPotential || null,
      fundingAndPartnerImpact: form.fundingAndPartnerImpact || null,
      investors: fromCSV(form.investorsCSV),
      strategicPartnerships: fromCSV(form.strategicPartnershipsCSV),
      accelerators: fromCSV(form.acceleratorsCSV),
      valuationChange: form.valuationChange || null,
      investorLogos: fromCSV(form.investorLogosCSV),
      mediaCoverage: fromLines(form.mediaCoverageLines),
      awards: fromCSV(form.awardsCSV),
      role: form.role || null,
      deliverables: fromCSV(form.deliverablesCSV),
      technologyStack: fromCSV(form.technologyStackCSV),
      innovations: form.innovations || null,
      processOutline: form.processOutline || null,
      businessResults: form.businessResults || null,
      technicalResults: form.technicalResults || null,
      whyCritical: form.whyCritical || null,
      founderStory: form.founderStory || null,
      scalability: form.scalability || null,
      defensibility: form.defensibility || null,
      barriersToEntry: form.barriersToEntry || null,
      techAdvantages: form.techAdvantages || null,
      ctaText: form.ctaText || null,
      ctaLink: form.ctaLink || null,
    };
  }, [form]);

  const handleSave = async () => {
    if (!payload) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/portfolio/update/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to save');
      router.push('/admin/portfolio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <main className={styles.container}><div className={styles.loading}>Loading…</div></main>;
  if (error) return <main className={styles.container}><div className={styles.error}>{error}</div></main>;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Edit Project</h1>
        <div className={styles.actions}>
          <button className={styles.primaryBtn} disabled={saving} onClick={handleSave}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div className={styles.list}>
        {/* Core */}
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <Field label="Title"><input className={styles.input} value={form.title} onChange={e => set('title', e.target.value)} /></Field>
            <Field label="Hero Image URL"><input className={styles.input} value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} /></Field>
            <Field label="Project URL"><input className={styles.input} value={form.projectUrl} onChange={e => set('projectUrl', e.target.value)} /></Field>
            <Field label="Tags (comma-separated)"><input className={styles.input} value={form.tagsCSV} onChange={e => set('tagsCSV', e.target.value)} /></Field>
            <Field label="Project Type (hidden)">
              <select className={styles.input} value={form.projectType} onChange={e => set('projectType', e.target.value)}>
                <option value="">None</option>
                <option value="Websites">Websites</option>
                <option value="Apps">Apps</option>
                <option value="Software">Software</option>
                <option value="Firmware">Firmware</option>
              </select>
            </Field>
            <Field label="Project Types (hidden)">
              <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
                {['Websites', 'Apps', 'Software', 'Firmware'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <input
                      type="checkbox"
                      checked={form.projectTypes.includes(opt)}
                      onChange={e => {
                        const checked = e.target.checked;
                        set('projectTypes', checked ? [...form.projectTypes, opt] : form.projectTypes.filter(v => v !== opt));
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Date Completed"><input type="date" className={styles.input} value={form.dateCompleted} onChange={e => set('dateCompleted', e.target.value)} /></Field>
            <Field label="Featured"><input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} /></Field>
            <Field label="Description"><textarea className={styles.textarea} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          </div>
        </div>

        {/* Case Study */}
        <Section title="Case Study">
          <div className={styles.fieldsGrid}>
            <Field label="Client Name"><input className={styles.input} value={form.clientName} onChange={e => set('clientName', e.target.value)} /></Field>
            <Field label="Client LinkedIn"><input className={styles.input} value={form.clientLinkedIn} onChange={e => set('clientLinkedIn', e.target.value)} /></Field>
            <Field label="Client Instagram"><input className={styles.input} value={form.clientInstagram} onChange={e => set('clientInstagram', e.target.value)} /></Field>
            <Field label="Client X (Twitter)"><input className={styles.input} value={form.clientX} onChange={e => set('clientX', e.target.value)} /></Field>
            <Field label="Key Features (comma-separated)"><input className={styles.input} value={form.keyFeaturesCSV} onChange={e => set('keyFeaturesCSV', e.target.value)} /></Field>
            <Field label="Project Goal"><textarea className={styles.textarea} value={form.projectGoal} onChange={e => set('projectGoal', e.target.value)} /></Field>
            <Field label="Solution"><textarea className={styles.textarea} value={form.solution} onChange={e => set('solution', e.target.value)} /></Field>
            <Field label="Challenges"><textarea className={styles.textarea} value={form.challenges} onChange={e => set('challenges', e.target.value)} /></Field>
            <Field label="Results"><textarea className={styles.textarea} value={form.results} onChange={e => set('results', e.target.value)} /></Field>
          </div>
        </Section>

        {/* Market & Opportunity */}
        <Section title="Market & Opportunity">
          <div className={styles.fieldsGrid}>
            <Field label="Industry"><input className={styles.input} value={form.industry} onChange={e => set('industry', e.target.value)} /></Field>
            <Field label="Company Stage"><input className={styles.input} value={form.companyStage} onChange={e => set('companyStage', e.target.value)} /></Field>
            <Field label="Funding Raised"><input className={styles.input} value={form.fundingRaised} onChange={e => set('fundingRaised', e.target.value)} /></Field>
            <Field label="Location"><input className={styles.input} value={form.location} onChange={e => set('location', e.target.value)} /></Field>
            <Field label="Target Audience"><input className={styles.input} value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} /></Field>
            <Field label="Why Now"><input className={styles.input} value={form.whyNow} onChange={e => set('whyNow', e.target.value)} /></Field>
            <Field label="Market Size"><input className={styles.input} value={form.marketSize} onChange={e => set('marketSize', e.target.value)} /></Field>
            <Field label="Industry Trends"><input className={styles.input} value={form.industryTrends} onChange={e => set('industryTrends', e.target.value)} /></Field>
            <Field label="Competitive Landscape"><input className={styles.input} value={form.competitiveLandscape} onChange={e => set('competitiveLandscape', e.target.value)} /></Field>
            <Field label="Time Constraints"><input className={styles.input} value={form.timeConstraints} onChange={e => set('timeConstraints', e.target.value)} /></Field>
            <Field label="Partners (comma-separated)"><input className={styles.input} value={form.partnersCSV} onChange={e => set('partnersCSV', e.target.value)} /></Field>
            <Field label="Integrations (comma-separated)"><input className={styles.input} value={form.integrationsCSV} onChange={e => set('integrationsCSV', e.target.value)} /></Field>
          </div>
        </Section>

        {/* Funding & Credibility */}
        <Section title="Funding & Credibility">
          <div className={styles.fieldsGrid}>
            <Field label="Funding & Partner Impact"><textarea className={styles.textarea} value={form.fundingAndPartnerImpact} onChange={e => set('fundingAndPartnerImpact', e.target.value)} /></Field>
            <Field label="Strategic Partnerships (comma-separated)"><input className={styles.input} value={form.strategicPartnershipsCSV} onChange={e => set('strategicPartnershipsCSV', e.target.value)} /></Field>
            <Field label="Accelerators (comma-separated)"><input className={styles.input} value={form.acceleratorsCSV} onChange={e => set('acceleratorsCSV', e.target.value)} /></Field>
            <Field label="Valuation Change"><input className={styles.input} value={form.valuationChange} onChange={e => set('valuationChange', e.target.value)} /></Field>
            <Field label="Investor Logos (comma-separated URLs)"><input className={styles.input} value={form.investorLogosCSV} onChange={e => set('investorLogosCSV', e.target.value)} /></Field>
            <Field label="Media Coverage (Title|URL per line)"><textarea className={styles.textarea} value={form.mediaCoverageLines} onChange={e => set('mediaCoverageLines', e.target.value)} /></Field>
            <Field label="Awards (comma-separated)"><input className={styles.input} value={form.awardsCSV} onChange={e => set('awardsCSV', e.target.value)} /></Field>
          </div>
        </Section>

        {/* Testimonial & Media */}
        <Section title="Testimonial & Media">
          <div className={styles.fieldsGrid}>
            <Field label="Testimonial Text"><textarea className={styles.textarea} value={form.testimonialText} onChange={e => set('testimonialText', e.target.value)} /></Field>
            <Field label="Testimonial Author"><input className={styles.input} value={form.testimonialAuthor} onChange={e => set('testimonialAuthor', e.target.value)} /></Field>
            <Field label="Testimonial Title"><input className={styles.input} value={form.testimonialTitle} onChange={e => set('testimonialTitle', e.target.value)} /></Field>
            <Field label="Gallery Images (comma-separated)"><input className={styles.input} value={form.galleryImagesCSV} onChange={e => set('galleryImagesCSV', e.target.value)} /></Field>
            <Field label="Solution Video URL"><input className={styles.input} value={form.videoUrl} onChange={e => set('videoUrl', e.target.value)} /></Field>
          </div>
        </Section>

        {/* SEO */}
        <Section title="SEO">
          <div className={styles.fieldsGrid}>
            <Field label="SEO Title"><input className={styles.input} value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} /></Field>
            <Field label="SEO Description"><textarea className={styles.textarea} value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} /></Field>
            <Field label="SEO Keywords (comma-separated)"><input className={styles.input} value={form.seoKeywordsCSV} onChange={e => set('seoKeywordsCSV', e.target.value)} /></Field>
          </div>
        </Section>

        {/* Finale */}
        <Section title="Final">
          <div className={styles.fieldsGrid}>
            <Field label="Founder Story"><textarea className={styles.textarea} value={form.founderStory} onChange={e => set('founderStory', e.target.value)} /></Field>
            <Field label="Scalability"><textarea className={styles.textarea} value={form.scalability} onChange={e => set('scalability', e.target.value)} /></Field>
            <Field label="Defensibility"><textarea className={styles.textarea} value={form.defensibility} onChange={e => set('defensibility', e.target.value)} /></Field>
            <Field label="Barriers To Entry"><textarea className={styles.textarea} value={form.barriersToEntry} onChange={e => set('barriersToEntry', e.target.value)} /></Field>
            <Field label="Tech Advantages"><textarea className={styles.textarea} value={form.techAdvantages} onChange={e => set('techAdvantages', e.target.value)} /></Field>
            <Field label="CTA Text"><input className={styles.input} value={form.ctaText} onChange={e => set('ctaText', e.target.value)} /></Field>
            <Field label="CTA Link"><input className={styles.input} value={form.ctaLink} onChange={e => set('ctaLink', e.target.value)} /></Field>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.item} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className={styles.titleRow} style={{ marginBottom: '.5rem' }}><strong>{title}</strong></div>
      <div style={{ display: 'grid', gap: '.75rem' }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: '.35rem' }}>
      <span className={styles.subtle}>{label}</span>
      {children}
    </label>
  );
}


