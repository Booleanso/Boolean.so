'use client';

import Link from 'next/link';
import styles from './SmallFooter.module.css';

export default function SmallFooter() {
  return (
    <div className={styles.smallFooter} role="contentinfo">
      <nav className={styles.nav} aria-label="Footer">
        <Link href="/contact" className={styles.link}>Contact</Link>
        <Link href="/terms" className={styles.link}>Terms & Conditions</Link>
        <Link href="/privacy" className={styles.link}>Privacy Policy</Link>
        <Link href="/partners" className={styles.link}>Partners</Link>
        <Link href="/sponsors" className={styles.link}>Sponsors</Link>
        <Link href="/investors" className={styles.link}>Investors</Link>
        <Link href="/friends" className={styles.link}>Friends</Link>
      </nav>
    </div>
  );
}


