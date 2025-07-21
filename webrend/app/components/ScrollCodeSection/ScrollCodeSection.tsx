'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ScrollCodeSection.module.css';

const packages = [
  'react@18.2.0',
  'next@14.1.0',
  'typescript@5.3.3',
  '@types/react@18.2.45',
  '@types/node@20.10.6',
  'tailwindcss@3.4.0',
  'eslint@8.56.0',
  'prisma@5.7.1',
  'stripe@14.12.0',
  'firebase@10.7.1',
  'axios@1.6.2',
  'framer-motion@10.16.16',
  'three@0.159.0',
  '@react-three/fiber@8.15.12',
  '@react-three/drei@9.92.7',
  'gsap@3.12.2',
  'lucide-react@0.300.0',
  'date-fns@3.0.6',
  'zod@3.22.4',
  'react-hook-form@7.48.2',
  '@hookform/resolvers@3.3.2',
  'react-query@3.39.3',
  'zustand@4.4.7',
  '@auth0/nextjs-auth0@3.2.0',
  'socket.io-client@4.7.4',
  'sharp@0.33.1',
  'bcryptjs@2.4.3',
  'jsonwebtoken@9.0.2',
  'nodemailer@6.9.8',
  'express@4.18.2',
  'cors@2.8.5',
  'dotenv@16.3.1',
  'mongoose@8.0.3',
  'redis@4.6.12',
  'winston@3.11.0',
  'joi@17.11.0',
  'helmet@7.1.0',
  'rate-limiter-flexible@3.0.8',
  'compression@1.7.4'
];

export default function ScrollCodeSection() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showFirstMessage, setShowFirstMessage] = useState(false);
  const [showSecondMessage, setShowSecondMessage] = useState(false);
  const [terminalFadingOut, setTerminalFadingOut] = useState(false);
  const [firstMessageFadingOut, setFirstMessageFadingOut] = useState(false);
  const [secondMessageFadingOut, setSecondMessageFadingOut] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const sectionTop = sectionRef.current.offsetTop;
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // More precise detection: only show when section is actually in viewport
      const sectionStart = sectionTop;
      const sectionEnd = sectionTop + sectionHeight;
      const viewportTop = scrollY;
      const viewportBottom = scrollY + viewportHeight;
      
      // Check if section is actually visible in viewport
      const isInViewport = sectionStart < viewportBottom && sectionEnd > viewportTop;
      
      // We'll handle fade-out based on progress within the section instead
      
      if (isInViewport) {
        // Calculate progress through the section (0 to 1)
        const progress = Math.max(0, Math.min(1, (scrollY - sectionStart) / sectionHeight));
        
        // Handle different phases based on progress with smoother transitions
        if (progress < 0.35) {
          // First phase: Show terminal with code
          setShowTerminal(true);
          setTerminalFadingOut(false);
          setShowFirstMessage(false);
          setFirstMessageFadingOut(false);
          setShowSecondMessage(false);
          setSecondMessageFadingOut(false);
          
          // Calculate how many lines should be visible based on scroll progress
          const totalLines = packages.length + 5; // +5 for header and footer lines
          const adjustedProgress = progress / 0.35; // Scale progress to 0.35 range
          const newVisibleLines = Math.floor(adjustedProgress * totalLines);
          
          if (newVisibleLines > visibleLines) {
            setVisibleLines(newVisibleLines);
            setIsInstalling(newVisibleLines > 0);
          } else if (newVisibleLines < visibleLines) {
            setVisibleLines(newVisibleLines);
            if (newVisibleLines === 0) {
              setIsInstalling(false);
            }
          }
        } else if (progress >= 0.35 && progress < 0.4) {
          // Transition phase: Fade out terminal
          if (showTerminal && !terminalFadingOut) {
            setTerminalFadingOut(true);
            setTimeout(() => {
              setShowTerminal(false);
              setTerminalFadingOut(false);
              setShowFirstMessage(true);
            }, 400);
          }
          setShowSecondMessage(false);
          setSecondMessageFadingOut(false);
          setIsInstalling(false);
        } else if (progress >= 0.4 && progress < 0.55) {
          // Second phase: Show first message
          if (!showFirstMessage && !showTerminal) {
            setShowFirstMessage(true);
          }
          setFirstMessageFadingOut(false);
          setShowSecondMessage(false);
          setSecondMessageFadingOut(false);
          setIsInstalling(false);
        } else if (progress >= 0.55 && progress < 0.6) {
          // Transition phase: Fade out first message
          if (showFirstMessage && !firstMessageFadingOut) {
            setFirstMessageFadingOut(true);
            setTimeout(() => {
              setShowFirstMessage(false);
              setFirstMessageFadingOut(false);
              setShowSecondMessage(true);
            }, 400);
          }
          setShowTerminal(false);
          setTerminalFadingOut(false);
          setIsInstalling(false);
        } else if (progress >= 0.6 && progress < 0.9) {
          // Third phase: Show second message
          if (!showSecondMessage && !showFirstMessage) {
            setShowSecondMessage(true);
          }
          setSecondMessageFadingOut(false);
          setShowTerminal(false);
          setTerminalFadingOut(false);
          setShowFirstMessage(false);
          setFirstMessageFadingOut(false);
          setIsInstalling(false);
        } else if (progress >= 0.9) {
          // Final phase: Fade out second message in last 10% of section
          if (showSecondMessage && !secondMessageFadingOut) {
            setSecondMessageFadingOut(true);
            setTimeout(() => {
              setShowSecondMessage(false);
              setSecondMessageFadingOut(false);
            }, 400);
          }
          setShowTerminal(false);
          setTerminalFadingOut(false);
          setShowFirstMessage(false);
          setFirstMessageFadingOut(false);
          setIsInstalling(false);
        }
      } else {
        // Section not in viewport - reset everything
        setShowTerminal(false);
        setTerminalFadingOut(false);
        setShowFirstMessage(false);
        setFirstMessageFadingOut(false);
        setShowSecondMessage(false);
        setSecondMessageFadingOut(false);
        setVisibleLines(0);
        setIsInstalling(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [visibleLines]);

  const renderCodeLines = () => {
    const lines = [];
    
    if (visibleLines > 0) {
      lines.push(
        <div key="start" className={styles.codeLine}>
          <span className={styles.prompt}>$</span> npm install
        </div>
      );
    }

    if (visibleLines > 1) {
      lines.push(
        <div key="installing" className={styles.codeLine}>
          <span className={styles.installing}>Installing packages...</span>
        </div>
      );
    }

    // Add package lines
    for (let i = 0; i < Math.max(0, visibleLines - 2); i++) {
      if (i < packages.length) {
        lines.push(
          <div key={`package-${i}`} className={styles.codeLine}>
            <span className={styles.added}>+</span> {packages[i]}
          </div>
        );
      }
    }

    if (visibleLines > packages.length + 2) {
      lines.push(
        <div key="complete" className={styles.codeLine}>
          <span className={styles.success}>✓</span> Installation complete!
        </div>
      );
    }

    if (visibleLines > packages.length + 3) {
      lines.push(
        <div key="audit" className={styles.codeLine}>
          <span className={styles.info}>found 0 vulnerabilities</span>
        </div>
      );
    }

    return lines;
  };

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.track}>
        <div className={styles.container}>
          <div className={styles.terminalWrapper}>
            {showTerminal && (
              <div ref={codeRef} className={`${styles.terminal} ${terminalFadingOut ? styles.fadeOut : ''}`}>
                <div className={styles.terminalHeader}>
                  <div className={styles.terminalButtons}>
                    <span className={styles.close}></span>
                    <span className={styles.minimize}></span>
                    <span className={styles.maximize}></span>
                  </div>
                  <div className={styles.terminalTitle}>Terminal</div>
                </div>
                <div className={styles.terminalBody}>
                  <div className={styles.codeContainer}>
                    {renderCodeLines()}
                    {isInstalling && visibleLines > 0 && visibleLines < packages.length + 4 && (
                      <div className={styles.cursor}>|</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {showFirstMessage && (
              <div className={`${styles.messageCard} ${firstMessageFadingOut ? styles.fadeOut : ''}`}>
                <h2 className={styles.messageTitle}>
                  You didn't know what any of that was, did you?
                </h2>
              </div>
            )}
            
            {showSecondMessage && (
              <div className={`${styles.messageCard} ${secondMessageFadingOut ? styles.fadeOut : ''}`}>
                <h2 className={styles.messageTitle}>
                  It's okay! That is what we are here to handle.
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 