'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './portfolio.module.css';

// Dynamically import Spline to avoid SSR issues
const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className={styles.splineLoading}>Loading 3D model...</div>,
});

export default function SplineViewer() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Handle when Spline has loaded
  const handleSplineLoad = () => {
    console.log('Spline model loaded');
    setIsLoaded(true);
  };
  
  return (
    <div className={styles.splineWrapper}>
      <div className={styles.splineBackground}>
        <Spline 
          scene="https://prod.spline.design/EV-L6WsvrL3sxG8v/scene.splinecode" 
          onLoad={handleSplineLoad}
        />
        {!isLoaded && (
          <div className={styles.splinePrompt}>
            <div className={styles.loadingIndicator}></div>
            <p>Loading 3D Model...</p>
          </div>
        )}
      </div>
    </div>
  );
} 