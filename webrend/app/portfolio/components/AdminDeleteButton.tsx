'use client';

import { useState, useEffect } from 'react';
import styles from './AdminDeleteButton.module.css';

interface AdminDeleteButtonProps {
  projectId: string;
}

export default function AdminDeleteButton({ projectId }: AdminDeleteButtonProps) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const response = await fetch('/api/auth/check-admin');
        const data = await response.json();
        setIsAdmin(data.isAdmin === true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, []);

  // If not admin, don't render anything
  if (!isAdmin) return null;

  const handleDelete = async () => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/portfolio/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      // Reload the page after successful deletion
      window.location.reload();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={styles.deleteButton}
      title="Delete project (Admin only)"
      aria-label="Delete project"
    >
      {isDeleting ? '...' : '×'}
    </button>
  );
} 