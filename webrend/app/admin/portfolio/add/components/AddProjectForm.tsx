'use client';

import { useState, FormEvent } from 'react';
import styles from './AddProjectForm.module.css'; // We'll create this CSS module later
import { storage } from '../../../../lib/firebase-client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface FormData {
  title: string;
  description: string; // Short description for card view
  imageUrl: string; // Hero image
  projectUrl: string; // Optional on server, but make required in form for simplicity?
  tags: string; // Input as comma-separated string
  projectTypes: string[]; // Hidden project types used for filtering
  dateCompleted: string; // Input as YYYY-MM-DD string
  featured: boolean;
  // New fields for case study
  clientName: string;
  clientLinkedIn: string; // New field for client's LinkedIn URL
  clientInstagram: string; // New field for client's Instagram URL
  clientX: string; // New field for client's X/Twitter URL
  projectGoal: string;
  solution: string;
  keyFeatures: string; // Comma-separated
  challenges: string;
  results: string;
  testimonialText: string;
  testimonialAuthor: string;
  testimonialTitle: string;
  galleryImages: string; // Comma-separated URLs
  videoUrl: string; // Video URL field for solution section
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string; // Comma-separated
  // Extended case study fields
  industry: string;
  companyStage: string;
  fundingRaised: string;
  location: string;
  partners: string; // comma-separated
  integrations: string; // comma-separated
  targetAudience: string;
  whyNow: string;
  marketSize: string;
  industryTrends: string;
  competitiveLandscape: string;
  timeConstraints: string;
  fundingAndPartnerImpact: string;
  strategicPartnerships: string; // comma-separated
  accelerators: string; // comma-separated
  valuationChange: string;
  investorLogos: string; // comma-separated URLs
  mediaCoverage: string; // newline-separated Title|URL
  awards: string; // comma-separated
  founderStory: string;
  scalability: string;
  defensibility: string;
  barriersToEntry: string;
  techAdvantages: string;
  ctaText: string;
  ctaLink: string;
  // Extra fields from case study spec
  clientLogoUrl: string;
  heroHeadline: string;
  role: string;
  deliverables: string; // comma-separated
  technologyStack: string; // comma-separated
  innovations: string;
  processOutline: string;
  businessResults: string;
  technicalResults: string;
  investors: string; // comma-separated
  growthPotential: string;
  whyCritical: string;
}

export default function AddProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    tags: '',
    projectTypes: [],
    dateCompleted: '',
    featured: false,
    clientName: '',
    clientLinkedIn: '',
    clientInstagram: '',
    clientX: '',
    projectGoal: '',
    solution: '',
    keyFeatures: '',
    challenges: '',
    results: '',
    testimonialText: '',
    testimonialAuthor: '',
    testimonialTitle: '',
    galleryImages: '',
    videoUrl: '', // Initialize the video URL field
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    industry: '',
    companyStage: '',
    fundingRaised: '',
    location: '',
    partners: '',
    integrations: '',
    targetAudience: '',
    whyNow: '',
    marketSize: '',
    industryTrends: '',
    competitiveLandscape: '',
    timeConstraints: '',
    fundingAndPartnerImpact: '',
    strategicPartnerships: '',
    accelerators: '',
    valuationChange: '',
    investorLogos: '',
    mediaCoverage: '',
    awards: '',
    founderStory: '',
    scalability: '',
    defensibility: '',
    barriersToEntry: '',
    techAdvantages: '',
    ctaText: '',
    ctaLink: '',
    clientLogoUrl: '',
    heroHeadline: '',
    role: '',
    deliverables: '',
    technologyStack: '',
    innovations: '',
    processOutline: '',
    businessResults: '',
    technicalResults: '',
    investors: '',
    growthPotential: '',
    whyCritical: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const input = e.target as HTMLInputElement;
      if (name === 'featured') {
        setFormData(prev => ({ ...prev, featured: input.checked }));
      } else if (name.startsWith('projectTypes.')) {
        const typeValue = name.split('.')[1];
        setFormData(prev => {
          const has = prev.projectTypes.includes(typeValue);
          const next = input.checked ? [...prev.projectTypes, typeValue] : prev.projectTypes.filter(v => v !== typeValue);
          return { ...prev, projectTypes: next };
        });
      } else {
        setFormData(prev => ({ ...prev, [name]: input.checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  function slugifyForPath(text: string) {
    return String(text || 'project')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .slice(0, 60);
  }

  async function uploadAndGetUrl(file: File, pathPrefix: string): Promise<string> {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const storageRef = ref(storage, `${pathPrefix}/${fileName}`);
    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', undefined, reject, () => resolve());
    });
    return await getDownloadURL(storageRef);
  }

  const handleHeroFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('hero');
      const slug = slugifyForPath(formData.title || 'project');
      const url = await uploadAndGetUrl(file, `portfolio/${slug}/hero`);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error('Hero upload failed', err);
      setError('Hero image upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleGalleryFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading('gallery');
      const slug = slugifyForPath(formData.title || 'project');
      const urls: string[] = [];
      for (const f of files) {
        const u = await uploadAndGetUrl(f, `portfolio/${slug}/gallery`);
        urls.push(u);
      }
      const existing = formData.galleryImages ? formData.galleryImages.split(',').map(s => s.trim()).filter(Boolean) : [];
      const next = [...existing, ...urls];
      setFormData(prev => ({ ...prev, galleryImages: next.join(', ') }));
    } catch (err) {
      console.error('Gallery upload failed', err);
      setError('Gallery upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleClientLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading('clientLogo');
      const slug = slugifyForPath(formData.title || 'project');
      const url = await uploadAndGetUrl(file, `portfolio/${slug}/client-logo`);
      setFormData(prev => ({ ...prev, clientLogoUrl: url }));
    } catch (err) {
      console.error('Client logo upload failed', err);
      setError('Client logo upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleInvestorLogosFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading('investorLogos');
      const slug = slugifyForPath(formData.title || 'project');
      const urls: string[] = [];
      for (const f of files) {
        const u = await uploadAndGetUrl(f, `portfolio/${slug}/investor-logos`);
        urls.push(u);
      }
      const existing = formData.investorLogos ? formData.investorLogos.split(',').map(s => s.trim()).filter(Boolean) : [];
      const next = [...existing, ...urls];
      setFormData(prev => ({ ...prev, investorLogos: next.join(', ') }));
    } catch (err) {
      console.error('Investor logos upload failed', err);
      setError('Investor logos upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/admin/portfolio/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Convert comma-separated strings to arrays
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          projectTypes: formData.projectTypes,
          keyFeatures: formData.keyFeatures.split(',').map(f => f.trim()).filter(Boolean),
          galleryImages: formData.galleryImages.split(',').map(url => url.trim()).filter(Boolean),
          seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
          partners: formData.partners.split(',').map(v => v.trim()).filter(Boolean),
          integrations: formData.integrations.split(',').map(v => v.trim()).filter(Boolean),
          strategicPartnerships: formData.strategicPartnerships.split(',').map(v => v.trim()).filter(Boolean),
          accelerators: formData.accelerators.split(',').map(v => v.trim()).filter(Boolean),
          investorLogos: formData.investorLogos.split(',').map(v => v.trim()).filter(Boolean),
          mediaCoverage: formData.mediaCoverage.split('\n').map(line => {
            const [title, url] = line.split('|').map(s => s?.trim());
            return url ? { title: title || url, url } : null;
          }).filter(Boolean),
          awards: formData.awards.split(',').map(v => v.trim()).filter(Boolean),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      setSuccessMessage(`Project "${result.title}" added successfully with ID: ${result.id}`);
      // Reset form (including new fields)
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        projectUrl: '',
        tags: '',
        projectTypes: [],
        dateCompleted: '',
        featured: false,
        clientName: '',
        clientLinkedIn: '',
        clientInstagram: '',
        clientX: '',
        projectGoal: '',
        solution: '',
        keyFeatures: '',
        challenges: '',
        results: '',
        testimonialText: '',
        testimonialAuthor: '',
        testimonialTitle: '',
        galleryImages: '',
        videoUrl: '', // Reset the video URL field 
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        industry: '',
        companyStage: '',
        fundingRaised: '',
        location: '',
        partners: '',
        integrations: '',
        targetAudience: '',
        whyNow: '',
        marketSize: '',
        industryTrends: '',
        competitiveLandscape: '',
        timeConstraints: '',
        fundingAndPartnerImpact: '',
        strategicPartnerships: '',
        accelerators: '',
        valuationChange: '',
        investorLogos: '',
        mediaCoverage: '',
        awards: '',
        founderStory: '',
        scalability: '',
        defensibility: '',
        barriersToEntry: '',
        techAdvantages: '',
        ctaText: '',
        ctaLink: '',
        clientLogoUrl: '',
        heroHeadline: '',
        role: '',
        deliverables: '',
        technologyStack: '',
        innovations: '',
        processOutline: '',
        businessResults: '',
        technicalResults: '',
        investors: '',
        growthPotential: '',
        whyCritical: '',
      });

    } catch (err: unknown) {
      console.error("Failed to add project:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formContainer}>
      <div className={styles.sectionCard}>
        <h2 className={styles.sectionTitle}>Core Project Info</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      {uploading && <div className={styles.infoMessage}>Uploading {uploading}…</div>}

      <div className={styles.formGroup}>
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Short Description (for card) *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={2}
          className={styles.textarea}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="imageUrl">Hero Image URL *</label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          required
          className={styles.input}
          placeholder="https://..."
        />
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
          <input type="file" accept="image/*" onChange={handleHeroFile} />
          {formData.imageUrl && (<a href={formData.imageUrl} target="_blank" rel="noopener noreferrer">Preview</a>)}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="projectUrl">Project URL</label>
        <input
          type="url"
          id="projectUrl"
          name="projectUrl"
          value={formData.projectUrl}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="tags">Tags (comma-separated) *</label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          required
          className={styles.input}
          placeholder="e.g., React, Next.js, Firebase"
        />
      </div>

      <div className={styles.formGroup}>
        <label>Project Types (hidden, for filtering)</label>
        <div className={styles.formRow}>
          {['Websites', 'Apps', 'Software', 'Firmware'].map(opt => (
            <label key={opt} className={styles.checkboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <input
                type="checkbox"
                name={`projectTypes.${opt}`}
                checked={formData.projectTypes.includes(opt)}
                onChange={handleChange}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="dateCompleted">Date Completed *</label>
        <input
          type="date"
          id="dateCompleted"
          name="dateCompleted"
          value={formData.dateCompleted}
          onChange={handleChange}
          required
          className={styles.input}
        />
      </div>

      <div className={styles.formGroupCheckbox}>
        <input
          type="checkbox"
          id="featured"
          name="featured"
          checked={formData.featured}
          onChange={handleChange}
          className={styles.checkbox}
        />
        <label htmlFor="featured">Featured Project?</label>
      </div>

      <hr className={styles.divider} />
      <h2>Case Study Details</h2>

      <div className={styles.formGroup}>
        <label htmlFor="clientName">Client Name</label>
        <input
          type="text"
          id="clientName"
          name="clientName"
          value={formData.clientName}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="clientLogoUrl">Client Logo URL</label>
        <input
          type="url"
          id="clientLogoUrl"
          name="clientLogoUrl"
          value={formData.clientLogoUrl}
          onChange={handleChange}
          className={styles.input}
          placeholder="https://..."
        />
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
          <input type="file" accept="image/*" onChange={handleClientLogoFile} />
          {formData.clientLogoUrl && (<a href={formData.clientLogoUrl} target="_blank" rel="noopener noreferrer">Preview</a>)}
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="clientLinkedIn">Client LinkedIn</label>
        <input
          type="url"
          id="clientLinkedIn"
          name="clientLinkedIn"
          value={formData.clientLinkedIn}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="clientInstagram">Client Instagram</label>
        <input
          type="url"
          id="clientInstagram"
          name="clientInstagram"
          value={formData.clientInstagram}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="clientX">Client X (Twitter)</label>
        <input
          type="url"
          id="clientX"
          name="clientX"
          value={formData.clientX}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="projectGoal">Project Goal *</label>
        <textarea
          id="projectGoal"
          name="projectGoal"
          value={formData.projectGoal}
          onChange={handleChange}
          required
          rows={4}
          className={styles.textarea}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="solution">Solution Provided *</label>
        <textarea
          id="solution"
          name="solution"
          value={formData.solution}
          onChange={handleChange}
          required
          rows={6}
          className={styles.textarea}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="galleryImages">Gallery Image URLs (comma-separated)</label>
        <textarea
          id="galleryImages"
          name="galleryImages"
          value={formData.galleryImages}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
          placeholder="https://.../image1.jpg, https://.../image2.png"
        />
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
          <input type="file" accept="image/*" multiple onChange={handleGalleryFiles} />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="videoUrl">Solution Video URL</label>
        <input
          type="url"
          id="videoUrl"
          name="videoUrl"
          value={formData.videoUrl}
          onChange={handleChange}
          className={styles.input}
          placeholder="e.g., https://player.vimeo.com/video/123456789"
        />
        <small className={styles.helpText}>Video to display in the solution section (Vimeo or YouTube embed URL)</small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="challenges">Challenges Faced</label>
        <textarea
          id="challenges"
          name="challenges"
          value={formData.challenges}
          onChange={handleChange}
          rows={4}
          className={styles.textarea}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="results">Results/Outcomes</label>
        <textarea
          id="results"
          name="results"
          value={formData.results}
          onChange={handleChange}
          rows={4}
          className={styles.textarea}
        />
      </div>

      <hr className={styles.divider} />
      <h2>Testimonial (Optional)</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="testimonialText">Testimonial Text</label>
        <textarea
          id="testimonialText"
          name="testimonialText"
          value={formData.testimonialText}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
        />
      </div>
      <div className={styles.formRow}> {/* Use row for related fields */} 
        <div className={styles.formGroup}>
          <label htmlFor="testimonialAuthor">Author Name</label>
          <input
            type="text"
            id="testimonialAuthor"
            name="testimonialAuthor"
            value={formData.testimonialAuthor}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="testimonialTitle">Author Title</label>
          <input
            type="text"
            id="testimonialTitle"
            name="testimonialTitle"
            value={formData.testimonialTitle}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <hr className={styles.divider} />
      <h2>Media & SEO</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="seoTitle">SEO Title</label>
        <input
          type="text"
          id="seoTitle"
          name="seoTitle"
          value={formData.seoTitle}
          onChange={handleChange}
          className={styles.input}
          placeholder="Custom title for search engines & browser tab"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="seoDescription">SEO Description</label>
        <textarea
          id="seoDescription"
          name="seoDescription"
          value={formData.seoDescription}
          onChange={handleChange}
          rows={2}
          className={styles.textarea}
          placeholder="Short description for search engine results"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="seoKeywords">SEO Keywords (comma-separated)</label>
        <input
          type="text"
          id="seoKeywords"
          name="seoKeywords"
          value={formData.seoKeywords}
          onChange={handleChange}
          className={styles.input}
          placeholder="e.g., web development, case study, react app"
        />
      </div>

      <div className={styles.sectionCard}>
      <h2 className={styles.sectionTitle}>Market & Opportunity</h2>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="industry">Industry</label>
          <input
            type="text"
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="companyStage">Company Stage</label>
          <input
            type="text"
            id="companyStage"
            name="companyStage"
            value={formData.companyStage}
            onChange={handleChange}
            className={styles.input}
            placeholder="Pre-seed, Seed, Series A, etc."
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="fundingRaised">Funding Raised</label>
          <input
            type="text"
            id="fundingRaised"
            name="fundingRaised"
            value={formData.fundingRaised}
            onChange={handleChange}
            className={styles.input}
            placeholder="$1.2M Seed"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="targetAudience">Target Audience</label>
        <input
          type="text"
          id="targetAudience"
          name="targetAudience"
          value={formData.targetAudience}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="whyNow">Why Now</label>
          <input
            type="text"
            id="whyNow"
            name="whyNow"
            value={formData.whyNow}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="marketSize">Market Size</label>
          <input
            type="text"
            id="marketSize"
            name="marketSize"
            value={formData.marketSize}
            onChange={handleChange}
            className={styles.input}
            placeholder="TAM/SAM/SOM summary"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="industryTrends">Industry Trends</label>
          <input
            type="text"
            id="industryTrends"
            name="industryTrends"
            value={formData.industryTrends}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="competitiveLandscape">Competitive Landscape</label>
          <input
            type="text"
            id="competitiveLandscape"
            name="competitiveLandscape"
            value={formData.competitiveLandscape}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="timeConstraints">Time Constraints</label>
        <input
          type="text"
          id="timeConstraints"
          name="timeConstraints"
          value={formData.timeConstraints}
          onChange={handleChange}
          className={styles.input}
          placeholder="Deadlines, launch windows, etc."
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="partners">Partners (comma-separated)</label>
          <input
            type="text"
            id="partners"
            name="partners"
            value={formData.partners}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="integrations">Integrations (comma-separated)</label>
          <input
            type="text"
            id="integrations"
            name="integrations"
            value={formData.integrations}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      </div>

      <div className={styles.sectionCard}>
      <h2 className={styles.sectionTitle}>Funding & Credibility</h2>

      <div className={styles.formGroup}>
        <label htmlFor="fundingAndPartnerImpact">Funding & Partner Impact</label>
        <textarea
          id="fundingAndPartnerImpact"
          name="fundingAndPartnerImpact"
          value={formData.fundingAndPartnerImpact}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="strategicPartnerships">Strategic Partnerships (comma-separated)</label>
          <input
            type="text"
            id="strategicPartnerships"
            name="strategicPartnerships"
            value={formData.strategicPartnerships}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="accelerators">Accelerators (comma-separated)</label>
          <input
            type="text"
            id="accelerators"
            name="accelerators"
            value={formData.accelerators}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="valuationChange">Valuation Change</label>
          <input
            type="text"
            id="valuationChange"
            name="valuationChange"
            value={formData.valuationChange}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="investorLogos">Investor Logos (comma-separated URLs)</label>
          <input
            type="text"
            id="investorLogos"
            name="investorLogos"
            value={formData.investorLogos}
            onChange={handleChange}
            className={styles.input}
          />
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginTop: '.5rem' }}>
            <input type="file" accept="image/*" multiple onChange={handleInvestorLogosFiles} />
          </div>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="mediaCoverage">Media Coverage (Title|URL per line)</label>
        <textarea
          id="mediaCoverage"
          name="mediaCoverage"
          value={formData.mediaCoverage}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
          placeholder="TechCrunch|https://...\nForbes|https://..."
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="awards">Awards (comma-separated)</label>
        <input
          type="text"
          id="awards"
          name="awards"
          value={formData.awards}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      </div>

      <div className={styles.sectionCard}>
      <h2 className={styles.sectionTitle}>Final</h2>

      <div className={styles.formGroup}>
        <label htmlFor="founderStory">Founder Story</label>
        <textarea
          id="founderStory"
          name="founderStory"
          value={formData.founderStory}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="scalability">Scalability</label>
          <textarea
            id="scalability"
            name="scalability"
            value={formData.scalability}
            onChange={handleChange}
            rows={2}
            className={styles.textarea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="defensibility">Defensibility</label>
          <textarea
            id="defensibility"
            name="defensibility"
            value={formData.defensibility}
            onChange={handleChange}
            rows={2}
            className={styles.textarea}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="barriersToEntry">Barriers To Entry</label>
          <textarea
            id="barriersToEntry"
            name="barriersToEntry"
            value={formData.barriersToEntry}
            onChange={handleChange}
            rows={2}
            className={styles.textarea}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="techAdvantages">Tech Advantages</label>
          <textarea
            id="techAdvantages"
            name="techAdvantages"
            value={formData.techAdvantages}
            onChange={handleChange}
            rows={2}
            className={styles.textarea}
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="ctaText">CTA Text</label>
          <input
            type="text"
            id="ctaText"
            name="ctaText"
            value={formData.ctaText}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="ctaLink">CTA Link</label>
          <input
            type="url"
            id="ctaLink"
            name="ctaLink"
            value={formData.ctaLink}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
      </div>

      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className={styles.submitButton}
      >
        {isLoading ? 'Adding Project...' : 'Add Project'}
      </button>
    </form>
  );
} 