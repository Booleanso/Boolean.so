'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './portfolio.module.css';

// Dynamically import the Game component
const GameComponent = dynamic(() => import('../game/page'), {
  ssr: false,
  loading: () => <div className={styles.gameLoading}>Loading Gallery...</div>
});

export default function GameWrapper() {
  const [isActive, setIsActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Handle pointer lock changes to fix whitespace issue
  useEffect(() => {
    const handlePointerLockChange = () => {
      // When pointer lock is released
      if (document.pointerLockElement === null && isActive) {
        console.log('Pointer lock released');
        // Don't immediately deactivate to prevent white flash
        setTimeout(() => {
          setIsActive(false);
        }, 100);
      }
    };
    
    // When user presses escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };
    
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
  
  const handleContainerClick = () => {
    setIsActive(true);
    setHasInteracted(true);
  };
  
  return (
    <div 
      className={styles.gameWrapper}
      onClick={handleContainerClick}
      ref={wrapperRef}
    >
      <div className={styles.gameBackground}>
        {hasInteracted && <GameComponent />}
        {!hasInteracted && (
          <div className={styles.gameControls}>
            <div className={styles.gamePrompt}>
              <h3>Click to Enter Gallery</h3>
              <p>WASD - Move | Mouse - Look | Space - Jump | ESC - Exit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 