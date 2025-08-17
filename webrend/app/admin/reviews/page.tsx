'use client';

import { useEffect, useState } from 'react';
import styles from './reviews.module.css';

type Testimonial = {
  id: string;
  person: string;
  comment: string;
  profileImageUrl?: string | null;
  referenceLink?: string | null;
  projectLink?: string | null;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
};

export default function ReviewsAdminPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/testimonials/moderate');
        if (!res.ok) throw new Error('Unauthorized or failed to load');
        const data = await res.json();
        setItems(data.testimonials || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const act = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/testimonials/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: action === 'approve' ? 'approved' : 'rejected' } : i));
    }
  };

  if (loading) return <div className={styles.page}>Loading…</div>;
  if (error) return <div className={styles.page}>Error: {error}</div>;

  return (
    <div className={styles.page}>
      <h1>Testimonials Moderation</h1>
      <div className={styles.list}>
        {items.map(t => (
          <div key={t.id} className={styles.row}>
            <div className={styles.meta}>
              <strong>{t.person}</strong>
              <span className={styles.status}>[{t.status || 'pending'}]</span>
            </div>
            <div className={styles.comment}>{t.comment}</div>
            <div className={styles.actions}>
              <button onClick={() => act(t.id, 'approve')} className={styles.approve}>Approve</button>
              <button onClick={() => act(t.id, 'reject')} className={styles.reject}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


