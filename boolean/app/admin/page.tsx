import Link from 'next/link';
import styles from './page.module.css';

export default function AdminDashboard() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.subtitle}>Quick actions and management tools</p>
      </header>

      <section className={styles.grid}>
        <Link href="/admin/portfolio" className={styles.card}>
          <h2>Portfolio</h2>
          <p>View all projects and add/remove portfolio entries.</p>
        </Link>

        <Link href="/admin/reviews" className={styles.card}>
          <h2>Manage Reviews</h2>
          <p>Approve or reject public review submissions.</p>
        </Link>
      </section>
    </main>
  );
}


