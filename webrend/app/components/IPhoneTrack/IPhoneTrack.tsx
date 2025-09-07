'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './IPhoneTrack.module.css';

export default function IPhoneTrack() {
  const phoneTrackRef = useRef<HTMLDivElement>(null);
  const phonePngRef = useRef<HTMLDivElement>(null);

  // Single state for scroll progress; all visuals derive from this
  const [phoneTrackProgress, setPhoneTrackProgress] = useState<number>(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef<boolean>(false);
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
    const update = () => {
      rafRef.current = null;
      if (!activeRef.current || !phoneTrackRef.current) return;
      const rect = phoneTrackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = Math.max(1, rect.height - vh);
      const raw = Math.max(0, Math.min(1, -rect.top / total));

      const START_GUARD = 0.1;
      const END_FADE_START = 0.98;
      const adjusted = raw <= START_GUARD
        ? 0
        : raw >= END_FADE_START
          ? 1
          : (raw - START_GUARD) / (END_FADE_START - START_GUARD);

      // Avoid needless React renders
      if (Math.abs(adjusted - progressRef.current) > 0.001) {
        progressRef.current = adjusted;
        setPhoneTrackProgress(adjusted);
      }
    };

    const onScroll = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(update);
    };

    const onResize = () => {
      const vw = window.innerWidth || 1200;
      const desired = Math.round(Math.max(180, Math.min(340, vw * 0.16)));
      setPhoneWidth(desired);
      onScroll();
    };

    // Run updates only while the section is near the viewport
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      activeRef.current = !!entry && entry.isIntersecting;
      if (activeRef.current) onScroll();
    }, { root: null, rootMargin: '25% 0px 25% 0px', threshold: 0 });
    if (phoneTrackRef.current) io.observe(phoneTrackRef.current);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, []);

  // Derived visual values from progress (no extra state)
  const START_GUARD = 0.1;
  const END_FADE_START = 0.98;
  const TIMELINE_FADE_LEN = 0.08;
  const rawForDerived = phoneTrackProgress * (END_FADE_START - START_GUARD) + START_GUARD; // inverse mapping
  const phoneEaseY = 0; // no upward motion; fade only
  const phoneOpacity = rawForDerived <= START_GUARD
    ? rawForDerived / START_GUARD
    : rawForDerived >= END_FADE_START
      ? 1 - (rawForDerived - END_FADE_START) / (1 - END_FADE_START)
      : 1;
  const timelineOpacity = rawForDerived > START_GUARD ? Math.min(1, (rawForDerived - START_GUARD) / TIMELINE_FADE_LEN) : 0;

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

        <div className={styles.phoneCopyWrapper} style={{ opacity: timelineOpacity }}>
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
            <a href="/portfolio" className={styles.portfolioBtn} style={{ opacity: timelineOpacity, pointerEvents: timelineOpacity > 0.01 ? 'auto' : 'none' }}>See Portfolio</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function screenTitleIndex(progress: number, steps: number) {
  return Math.min(steps - 1, Math.floor(progress * steps));
}

function PhoneSlideOne() { return <img className={styles.slideImage} src="/process/mvp.png" alt="Two-week MVP preview" />; }
function PhoneSlideTwo() { return <img className={styles.slideImage} src="/process/cheap.png" alt="AI-driven contracts cost preview" />; }
function PhoneSlideThree() { return <img className={styles.slideImage} src="/process/notion.png" alt="Notion checklists preview" />; }
function PhoneSlideFour() { return <img className={styles.slideImage} src="/process/githubmail.png" alt="GitHub email updates preview" />; }
function PhoneSlideFive() { return <img className={styles.slideImage} src="/process/insta.png" alt="Built in public Instagram style preview" />; }
function PhoneSlideSix() { return <img className={styles.slideImage} src="/process/milestone.png" alt="Milestone meetings preview" />; }


