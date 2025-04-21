'use client';

import Link from 'next/link';
import styles from './game.module.scss';

export default function GamePage() {
  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <Link href="/portfolio" className={styles.backButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Portfolio
        </Link>
        <h1>3D Game Experience</h1>
      </div>
      
      <div className={styles.gameContent}>
        <div className={styles.gameCanvas}>
          <div className={styles.placeholder}>
            <h2>Game Coming Soon</h2>
            <p>The 3D game experience is under development. Check back soon!</p>
            <div className={styles.loader}></div>
          </div>
        </div>
      </div>
    </div>
  );
} 