import Link from 'next/link';
import styles from './page.module.css';

export default function ArticleNotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.errorContainer}>
        <h1>Article Not Found</h1>
        <p>We couldn&apos;t find the article you&apos;re looking for.</p>
        <p>It may have been moved, deleted, or never existed.</p>
        
        <div className={styles.relatedSection}>
          <div className={styles.relatedLink}>
            <Link href="/blog">
              Return to Blog
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 