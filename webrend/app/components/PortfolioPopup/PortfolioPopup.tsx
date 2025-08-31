'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import styles from './PortfolioPopup.module.css';

type PortfolioProject = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  projectUrl?: string | null;
  dateCompleted?: string | Date;
  featured?: boolean;
};

interface PortfolioPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}

export default function PortfolioPopup({ isOpen, onClose }: PortfolioPopupProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [animateOpen, setAnimateOpen] = useState(false);
  const [gridReady, setGridReady] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useLockBodyScroll(isOpen);

  useEffect(() => { setMounted(true); }, []);

  // Keep component mounted briefly on close to allow fade-out
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }
    // Delay unmount to allow CSS transitions to finish
    const timeout = setTimeout(() => setShouldRender(false), 300);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  // Animate overlay on initial mount
  useEffect(() => {
    if (!isOpen) { setAnimateOpen(false); return; }
    setAnimateOpen(false);
    const id = requestAnimationFrame(() => setAnimateOpen(true));
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const controller = new AbortController();
    fetch('/api/portfolio/projects', { cache: 'no-store', signal: controller.signal })
      .then((r) => r.ok ? r.json() : [])
      .then((data: PortfolioProject[]) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [isOpen]);

  // Animate grid when content is ready
  useEffect(() => {
    if (loading) { setGridReady(false); return; }
    const id = requestAnimationFrame(() => setGridReady(true));
    return () => cancelAnimationFrame(id);
  }, [loading]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;
  if (!isOpen && !shouldRender) return null;

  return createPortal(
    <div className={`${styles.overlay} ${animateOpen && isOpen ? styles.open : ''}`} aria-hidden={!isOpen}>
      <div ref={overlayRef} className={styles.backdrop} onClick={onClose} />
      <button className={styles.floatingClose} onClick={onClose} aria-label="Close">✕</button>
      <div className={styles.fullGridWrapper} role="dialog" aria-modal="true" aria-label="Portfolio projects">
        {loading ? (
          <div className={styles.grid} aria-busy>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${styles.skeleton}`} />
            ))}
          </div>
        ) : (
          <div className={`${styles.grid} ${gridReady ? styles.gridLoaded : ''}`}>
            {projects.map((p) => (
              <div key={p.id} className={styles.card}>
                <a
                  className={styles.imageLink}
                  href={p.projectUrl || `/portfolio/projects/${p.slug}`}
                  target={p.projectUrl ? '_blank' : undefined}
                  rel={p.projectUrl ? 'noopener noreferrer' : undefined}
                >
                  <div className={styles.imageFrame}>
                    <div className={styles.thumbWrap}>
                      {p.imageUrl?.startsWith('/') ? (
                        <Image src={p.imageUrl} alt={p.title} fill className={styles.thumb} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                      ) : (
                        <img src={p.imageUrl} alt={p.title} className={styles.thumbImg} />
                      )}
                    </div>
                  </div>
                </a>
                <div className={styles.caption}>
                  <div className={styles.projectTitle}>{p.title}</div>
                  {p.tags && p.tags.length > 0 ? (
                    <div className={styles.meta}>{p.tags.slice(0, 2).join(' • ')}</div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


