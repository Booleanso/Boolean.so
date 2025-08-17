'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReviewCrowd.module.css';
import Image from 'next/image';

type Testimonial = {
  id: string;
  person: string;
  profileImageUrl?: string;
  comment: string;
  referenceLink?: string;
  projectLink?: string;
  createdAt?: unknown;
  status?: 'pending' | 'approved' | 'rejected';
};

export default function ReviewCrowd() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        // Lazy import Firebase only on the client to avoid SSR issues
        const [{ db }, firestore] = await Promise.all([
          import('../../lib/firebase-client'),
          import('firebase/firestore')
        ]);

        const { collection, getDocs, query, orderBy, limit, where } = firestore;
        const q = query(
          collection(db, 'testimonials'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc'),
          limit(12)
        );

        const snap = await getDocs(q);
        if (isCancelled) return;
        const docs: Testimonial[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Testimonial, 'id'>) }));
        setTestimonials(docs);
      } catch (e: any) {
        if (isCancelled) return;
        console.error('Failed to load testimonials:', e);
        setError('Testimonials unavailable');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      person: String(formData.get('person') || '').trim(),
      profileImageUrl: String(formData.get('profileImageUrl') || '').trim() || undefined,
      comment: String(formData.get('comment') || '').trim(),
      referenceLink: String(formData.get('referenceLink') || '').trim() || undefined,
      projectLink: String(formData.get('projectLink') || '').trim() || undefined,
    };

    if (!payload.person || !payload.comment) {
      setSubmitError('Please fill in your name and comment.');
      return;
    }

    try {
      setSubmitError(null);
      setSubmitting(true);
      const res = await fetch('/api/testimonials/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to submit (status ${res.status})`);
      }
      setSubmitSuccess(true);
      form.reset();
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.container}>
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>Testimonials</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>What our clients say.</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>Valued client stories.</span>
            </span>
          </h2>
          <p className={styles.description}>
            Real feedback from partners who shipped with WebRend.
          </p>
          <div className={styles.ctaRow}>
            <button className={styles.submitButton} onClick={() => setModalOpen(true)}>
              Share your experience
            </button>
          </div>
        </div>

        <div className={`${styles.cards} ${isVisible ? styles.visible : ''}`}>
          {loading && (
            <div className={styles.skeletonRow}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className={styles.error}>Unable to load testimonials right now.</div>
          )}

          {!loading && !error && testimonials.length === 0 && (
            <div className={styles.empty}>Be the first to leave a review.</div>
          )}

          {!loading && !error && testimonials.length > 0 && (
            <div className={styles.grid}>
              {testimonials.map((t) => (
                <article key={t.id} className={styles.card}>
                  <header className={styles.cardHeader}>
                    <div className={styles.identity}>
                      <div className={styles.avatarWrap}>
                        {t.profileImageUrl ? (
                          <Image
                            src={t.profileImageUrl}
                            alt={t.person}
                            width={44}
                            height={44}
                            className={styles.avatar}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.avatarFallback} aria-hidden>
                            {t.person?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                      </div>
                      <div className={styles.nameBlock}>
                        <div className={styles.nameRow}>
                          <span className={styles.name}>{t.person}</span>
                          <span className={styles.verified} title="Valued Client">
                            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                              <defs>
                                <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#0A84FF" />
                                  <stop offset="100%" stopColor="#64D2FF" />
                                </linearGradient>
                              </defs>
                              <path fill="url(#badge)" d="M12 2l2.39 2.39 3.39-.39-.39 3.39L20 10l-2.61 2.61.39 3.39-3.39-.39L12 18l-2.39-2.39-3.39.39.39-3.39L4 10l2.61-2.61-.39-3.39 3.39.39z"/>
                              <path fill="#fff" d="M10.2 12.4l-1.4-1.4-.8.8 2.2 2.2 4.6-4.6-.8-.8z"/>
                            </svg>
                            <span className={styles.verifiedText}>Valued Client</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </header>
                  <div className={styles.comment}>
                    <span className={styles.quoteMark} aria-hidden>“</span>
                    {t.comment}
                    <span className={styles.quoteMark} aria-hidden>”</span>
                  </div>
                  {(t.referenceLink || t.projectLink) && (
                    <footer className={styles.links}>
                      {t.referenceLink && (
                        <a className={styles.linkButton} href={t.referenceLink} target="_blank" rel="noopener noreferrer">
                          Reference
                        </a>
                      )}
                      {t.projectLink && (
                        <a className={styles.linkButton} href={t.projectLink} target="_blank" rel="noopener noreferrer">
                          Project
                        </a>
                      )}
                    </footer>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Share your review</h3>
              <button className={styles.iconButton} onClick={() => setModalOpen(false)} aria-label="Close">×</button>
            </div>
            {submitSuccess ? (
              <div className={styles.successPane}>
                <p>Thanks! Your review was submitted and is pending approval.</p>
                <button className={styles.primarySmall} onClick={() => setModalOpen(false)}>Close</button>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.fieldRow}>
                  <label className={styles.label} htmlFor="person">Your name</label>
                  <input id="person" name="person" className={styles.input} required maxLength={80} />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.label} htmlFor="profileImageUrl">Profile image URL (optional)</label>
                  <input id="profileImageUrl" name="profileImageUrl" className={styles.input} placeholder="https://..." />
                </div>
                <div className={styles.fieldRow}>
                  <label className={styles.label} htmlFor="comment">Comment</label>
                  <textarea id="comment" name="comment" className={styles.textarea} required maxLength={600} rows={5} />
                </div>
                <div className={styles.fieldRowGrid}>
                  <div>
                    <label className={styles.label} htmlFor="referenceLink">Reference link (optional)</label>
                    <input id="referenceLink" name="referenceLink" className={styles.input} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={styles.label} htmlFor="projectLink">Project link (optional)</label>
                    <input id="projectLink" name="projectLink" className={styles.input} placeholder="https://..." />
                  </div>
                </div>
                {submitError && <div className={styles.formError}>{submitError}</div>}
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondary} onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className={styles.primary} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}