'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './IPhoneTrack.module.css';

export default function IPhoneTrack() {
  const phoneTrackRef = useRef<HTMLDivElement>(null);
  const phonePngRef = useRef<HTMLDivElement>(null);

  const [phoneEaseY, setPhoneEaseY] = useState<number>(60);
  const [phoneOpacity, setPhoneOpacity] = useState<number>(0);
  const [timelineOpacity, setTimelineOpacity] = useState<number>(0);
  const [phoneTrackProgress, setPhoneTrackProgress] = useState<number>(0);
  const [phoneWidth, setPhoneWidth] = useState<number>(320);

  // Glow colors (mirrors ServicesAndClients behavior)
  const pageGlowColors = [
    '#4DA6FF',
    '#6C63FF',
    '#1E2A38',
    '#FF9800',
    '#00BFA6',
    '#3ED598',
  ];
  const getGlowColor = (idx: number) => {
    if (idx <= 0) return '#8EC6FF';
    return pageGlowColors[Math.min(pageGlowColors.length - 1, Math.max(0, idx))];
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!phoneTrackRef.current) return;
      const rect = phoneTrackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const progress = Math.max(0, Math.min(1, -rect.top / total));

      const START_GUARD = 0.1;
      const END_FADE_START = 0.98;

      let translate = 0;
      if (progress <= START_GUARD) {
        translate = (1 - progress / START_GUARD) * 60;
      } else {
        translate = 0;
      }
      setPhoneEaseY(translate);

      let op = 1;
      if (progress <= START_GUARD) {
        op = progress / START_GUARD;
      } else if (progress >= END_FADE_START) {
        op = 1 - (progress - END_FADE_START) / (1 - END_FADE_START);
      } else {
        op = 1;
      }
      setPhoneOpacity(Math.max(0, Math.min(1, op)));

      const TIMELINE_FADE_LEN = 0.08;
      let tl = 0;
      if (progress > START_GUARD) {
        tl = Math.min(1, (progress - START_GUARD) / TIMELINE_FADE_LEN);
      } else {
        tl = 0;
      }
      setTimelineOpacity(tl);

      const adjusted = progress <= START_GUARD
        ? 0
        : progress >= END_FADE_START
          ? 1
          : (progress - START_GUARD) / (END_FADE_START - START_GUARD);
      setPhoneTrackProgress(adjusted);
    };

    const handleResize = () => {
      const vw = window.innerWidth || 1200;
      const desired = Math.round(Math.max(180, Math.min(340, vw * 0.16)));
      setPhoneWidth(desired);
      handleScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section ref={phoneTrackRef} className={styles.phoneTrack}>
      <div className={styles.phoneStickyParent} style={{ transform: `translateY(${Math.round(phoneEaseY)}px)`, opacity: phoneOpacity }}>
        <div className={styles.timelineWrapper} aria-hidden style={{ opacity: timelineOpacity }}>
          <div className={styles.timeline}>
            {Array.from({ length: 6 }).map((_, i) => {
              const rawIndex = Math.min(5, Math.floor(phoneTrackProgress * 6));
              const segmentProgress = (phoneTrackProgress * 6) - rawIndex;
              const isActive = i <= rawIndex;
              const fillBetween = i < rawIndex ? 100 : i === rawIndex ? segmentProgress * 100 : 0;
              const tailFill = Math.max(0, Math.min(100, (phoneTrackProgress * 6 - 5) * 100));
              return (
                <div key={i} className={styles.timelineStep}>
                  <div className={`${styles.timelineDot} ${isActive ? styles.active : ''}`} />
                  {i < 5 ? (
                    <div className={styles.timelineLine}>
                      <div className={styles.timelineLineFill} style={{ width: `${fillBetween}%` }} />
                    </div>
                  ) : (
                    <div className={styles.timelineLine}>
                      <div className={styles.timelineLineFill} style={{ width: `${tailFill}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.phoneCopyWrapper}>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 0 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 1 – Two-Week MVPs</div>
            <div className={styles.phoneCopyTitle}>Your MVP, built in 2 weeks.</div>
            <div className={styles.phoneCopyDesc}>We don’t drag projects for months. In just 14 days, you’ll be testing a working version of your idea.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 1 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 2 – AI-Driven Contracts</div>
            <div className={styles.phoneCopyTitle}>Cheaper than hiring devs.</div>
            <div className={styles.phoneCopyDesc}>Our AI-token estimation contracts are transparent and efficient — no inflated hourly rates, just clear math that works in your favor.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 2 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 3 – Notion Checklists</div>
            <div className={styles.phoneCopyTitle}>Track progress in real-time.</div>
            <div className={styles.phoneCopyDesc}>Every step is shared in Notion, so you always know exactly what’s happening behind the scenes.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 3 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 4 – GitHub Updates</div>
            <div className={styles.phoneCopyTitle}>Every commit in your inbox.</div>
            <div className={styles.phoneCopyDesc}>We email you every GitHub push — no surprises, just full visibility as features come to life.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 4 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 5 – Built in Public</div>
            <div className={styles.phoneCopyTitle}>Transparency is trust.</div>
            <div className={styles.phoneCopyDesc}>We develop in public, letting you and the community watch progress unfold. Trust isn’t promised — it’s proven.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 5 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Screen 6 – Milestone Meetings</div>
            <div className={styles.phoneCopyTitle}>You test as we build.</div>
            <div className={styles.phoneCopyDesc}>At each milestone, we meet with you live. You click, test, and approve the work before we move forward.</div>
          </div>
        </div>

        <div className={styles.iphoneWrapper}>
          {(() => {
            const stepsCount = 6;
            const rawIndex = Math.min(stepsCount - 1, Math.floor(phoneTrackProgress * stepsCount));
            const segmentProgress = Math.max(0, Math.min(1, phoneTrackProgress * stepsCount - rawIndex));
            const nextIndex = Math.min(stepsCount - 1, rawIndex + 1);
            const currentColor = getGlowColor(rawIndex);
            const nextColor = getGlowColor(nextIndex);
            const baseStyle = {} as React.CSSProperties;
            return (
              <>
                <div
                  className={styles.iphoneGlow}
                  style={{
                    ...baseStyle,
                    opacity: timelineOpacity * phoneOpacity * (1 - segmentProgress),
                    background: `radial-gradient(55% 55% at 50% 50%, ${currentColor} 0%, rgba(0,0,0,0) 75%)`
                  }}
                />
                <div
                  className={styles.iphoneGlow}
                  style={{
                    ...baseStyle,
                    opacity: timelineOpacity * phoneOpacity * segmentProgress,
                    background: `radial-gradient(55% 55% at 50% 50%, ${nextColor} 0%, rgba(0,0,0,0) 75%)`
                  }}
                />
              </>
            );
          })()}

          <div ref={phonePngRef} className={styles.phonePng} style={{ width: phoneWidth, height: 'auto' }}>
            <div className={styles.phoneScreenOverlay}>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 0 ? styles.active : ''}`}><PhoneSlideOne /></div>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 1 ? styles.active : ''}`}><PhoneSlideTwo /></div>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 2 ? styles.active : ''}`}><PhoneSlideThree /></div>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 3 ? styles.active : ''}`}><PhoneSlideFour /></div>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 4 ? styles.active : ''}`}><PhoneSlideFive /></div>
              <div className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 5 ? styles.active : ''}`}><PhoneSlideSix /></div>
            </div>
            <img src="/images/iphone.png" alt="iPhone" className={styles.phoneImg} />
            <a href="/portfolio" className={styles.portfolioBtn}>See Portfolio</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function screenTitleIndex(progress: number, steps: number) {
  return Math.min(steps - 1, Math.floor(progress * steps));
}

function PhoneSlideOne() { return <div style={{ width: '100%', height: '100%' }} />; }
function PhoneSlideTwo() { return <div style={{ width: '100%', height: '100%' }} />; }
function PhoneSlideThree() { return <div style={{ width: '100%', height: '100%' }} />; }
function PhoneSlideFour() { return <div style={{ width: '100%', height: '100%' }} />; }
function PhoneSlideFive() { return <div style={{ width: '100%', height: '100%' }} />; }
function PhoneSlideSix() { return <div style={{ width: '100%', height: '100%' }} />; }


