'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  projectUrl?: string | null;
  dateCompleted: string | Date;
  featured: boolean;
}

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/portfolio/projects');
      const data = await res.json();
      if (!res.ok) throw new Error('Failed to load projects');
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = window.confirm('Remove this project from portfolio? This action cannot be undone.');
    if (!confirm) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/portfolio/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as any));
        throw new Error(body?.error || 'Failed to delete project');
      }
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Portfolio Projects</h1>
        <div className={styles.actions}>
          <Link href="/admin" className={styles.secondaryBtn}>Back to Admin</Link>
          <Link href="/admin/portfolio/add" className={styles.primaryBtn}>Add Project</Link>
        </div>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {loading ? (
        <div className={styles.loading}>Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className={styles.empty}>No portfolio projects yet.</div>
      ) : (
        <ul className={styles.list}> 
          {projects.map((p) => (
            <li key={p.id} className={styles.item}>
              <div className={styles.meta}>
                <div className={styles.titleRow}>
                  <strong>{p.title}</strong>
                  {p.featured && <span className={styles.badge}>Featured</span>}
                </div>
                <div className={styles.subtle}>Slug: {p.slug}</div>
                <div className={styles.subtle}>{Array.isArray(p.tags) ? p.tags.join(', ') : ''}</div>
              </div>
              <div className={styles.itemActions}>
                <Link href={`/portfolio/projects/${p.slug}`} className={styles.linkBtn} target="_blank">View</Link>
                <Link href={`/admin/portfolio/${p.id}`} className={styles.secondaryBtn}>Edit</Link>
                <button
                  className={styles.dangerBtn}
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}


