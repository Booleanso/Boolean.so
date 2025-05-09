'use client';

import { useState, FormEvent } from 'react';
import styles from './AddProjectForm.module.css'; // We'll create this CSS module later

interface FormData {
  title: string;
  description: string; // Short description for card view
  imageUrl: string; // Hero image
  projectUrl: string; // Optional on server, but make required in form for simplicity?
  tags: string; // Input as comma-separated string
  dateCompleted: string; // Input as YYYY-MM-DD string
  featured: boolean;
  // New fields for case study
  clientName: string;
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
}

export default function AddProjectForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    tags: '',
    dateCompleted: '',
    featured: false,
    clientName: '',
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
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
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
          keyFeatures: formData.keyFeatures.split(',').map(f => f.trim()).filter(Boolean),
          galleryImages: formData.galleryImages.split(',').map(url => url.trim()).filter(Boolean),
          seoKeywords: formData.seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
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
        dateCompleted: '',
        featured: false,
        clientName: '',
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
      <h2>Core Project Info</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

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
        />
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
        <label htmlFor="keyFeatures">Key Features (comma-separated)</label>
        <textarea
          id="keyFeatures"
          name="keyFeatures"
          value={formData.keyFeatures}
          onChange={handleChange}
          rows={3}
          className={styles.textarea}
          placeholder="e.g., Real-time updates, Secure payments, User profiles"
        />
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
      </div>

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