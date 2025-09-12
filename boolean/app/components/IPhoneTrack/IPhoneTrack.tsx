'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './IPhoneTrack.module.css';

export default function IPhoneTrack() {
  const phoneTrackRef = useRef<HTMLDivElement>(null);
  const phonePngRef = useRef<HTMLDivElement>(null);

  // Single state for scroll progress; all visuals derive from this
  const [phoneTrackProgress, setPhoneTrackProgress] = useState<number>(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const rafLoopRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(0);
  const activeRef = useRef<boolean>(false);
  const forceComputeRef = useRef<boolean>(false);
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
      if (!phoneTrackRef.current) return;
      const rect = phoneTrackRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // Consider the section "active" if it's close to viewport
      const isNearViewport = rect.top < vh * 1.2 && rect.bottom > -vh * 0.2;
      if (!isNearViewport && !forceComputeRef.current) return;
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
      // Clear one-shot forced compute
      forceComputeRef.current = false;
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

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    onResize();

    // rAF loop to detect scrollY changes in environments with custom scrolling
    const tick = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y !== lastScrollYRef.current) {
        lastScrollYRef.current = y;
        onScroll();
      }
      rafLoopRef.current = requestAnimationFrame(tick);
    };
    rafLoopRef.current = requestAnimationFrame(tick);

    // Reinitialize after route transitions complete (fixes broken state when navigating back)
    const handlePageTransitionComplete = () => {
      // Force a compute regardless of IntersectionObserver state
      forceComputeRef.current = true;
      // Trigger recompute now and on next frame in case layout changes
      onResize();
      onScroll();
      requestAnimationFrame(() => {
        forceComputeRef.current = true;
        onScroll();
      });
    };
    document.addEventListener('page-transition-complete', handlePageTransitionComplete);

    // Force an immediate compute on mount and when tab becomes visible
    forceComputeRef.current = true;
    onScroll();
    const onVisible = () => { forceComputeRef.current = true; onScroll(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (rafLoopRef.current) cancelAnimationFrame(rafLoopRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('page-transition-complete', handlePageTransitionComplete);
      document.removeEventListener('visibilitychange', onVisible);
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

  // Helper to compute motion for side images: enter from bottom on own screen, then continue up and fade during the end of the same screen
  const computeMotion = (ownIndex: number, currentIndex: number, seg: number, parallaxX: number = 0) => {
    const ENTER_END = 0.15; // enter window at start of own screen
    const EXIT_START = 0.92; // begin exit before next screen activates
    const EXIT_DISTANCE = 140; // px upward during exit
    const baseOpacity = (ownIndex === 0 ? timelineOpacity : 1) * phoneOpacity;
    if (currentIndex < ownIndex) {
      // Not reached yet: start at bottom, invisible
      return { x: 0, y: 200, opacity: 0 };
    }
    if (currentIndex === ownIndex) {
      // Enter from bottom
      if (seg <= ENTER_END) {
        const t = seg / ENTER_END; // 0->1
        const x = (t - 0.5) * 2 * parallaxX; // subtle drift across entry
        return { x, y: 60 - 60 * t, opacity: Math.max(0, Math.min(1, t)) * baseOpacity };
      }
      // Exit upward near the end of this screen
      if (seg >= EXIT_START) {
        const t = (seg - EXIT_START) / (1 - EXIT_START); // 0->1 over exit band
        const x = (0.5 + t * 0.5) * parallaxX; // continue drifting
        return { x, y: -EXIT_DISTANCE * t, opacity: Math.max(0, 1 - t) * baseOpacity };
      }
      // Hold beside the phone
      const x = (seg - 0.5) * 2 * parallaxX; // slow drift while holding
      return { x, y: 0, opacity: baseOpacity };
    }
    // After own screen: ensure hidden immediately when next screen shows
    return { x: parallaxX, y: -200, opacity: 0 };
  };

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
            <div className={styles.phoneCopyLabel}>Two-Week MVPs</div>
            <div className={`${styles.phoneCopyTitle} title`}>Your MVP, built in 2 weeks.</div>
            <div className={styles.phoneCopyDesc}>We don’t drag projects for months. In just 14 days, you’ll be testing a working version of your idea.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 1 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>AI-Driven Contracts</div>
            <div className={`${styles.phoneCopyTitle} title`}>Cheaper than hiring devs.</div>
            <div className={styles.phoneCopyDesc}>Our AI-token estimation contracts are transparent and efficient — no inflated hourly rates, just clear math that works in your favor.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 2 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Notion Checklists</div>
            <div className={`${styles.phoneCopyTitle} title`}>Track progress in real-time.</div>
            <div className={styles.phoneCopyDesc}>Every step is shared in Notion, so you always know exactly what’s happening behind the scenes.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 3 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>GitHub Updates</div>
            <div className={`${styles.phoneCopyTitle} title`}>Every commit in your inbox.</div>
            <div className={styles.phoneCopyDesc}>We email you every GitHub push — no surprises, just full visibility as features come to life.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 4 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Built in Public</div>
            <div className={`${styles.phoneCopyTitle} title`}>Transparency is trust.</div>
            <div className={styles.phoneCopyDesc}>We develop in public, letting you and the community watch progress unfold. Trust isn’t promised — it’s proven.</div>
          </div>
          <div className={`${styles.phoneCopyCard} ${screenTitleIndex(phoneTrackProgress, 6) === 5 ? styles.active : ''}`}>
            <div className={styles.phoneCopyLabel}>Milestone Meetings</div>
            <div className={`${styles.phoneCopyTitle} title`}>You test as we build.</div>
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
                {/* Screen 1 right-side (framer-motion) */}
                <motion.div
                  className={styles.sideWrapRight}
                  animate={computeMotion(0, rawIndex, segmentProgress, 10)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side preview" className={styles.sideSquare} />
                </motion.div>
                {/* Screen 1 left-side side image */}
                <motion.div
                  className={styles.sideWrapLeft}
                  animate={computeMotion(0, rawIndex, segmentProgress, -12)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side preview left" className={styles.sideSquare} />
                </motion.div>

                {/* Screen 2 squares (different sizes/placements) */}
                <motion.div
                  className={styles.sideWrap2A}
                  animate={computeMotion(1, rawIndex, segmentProgress, 14)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 2A" className={styles.sideSquare} />
                </motion.div>

                <motion.div
                  className={styles.sideWrap2B}
                  animate={computeMotion(1, rawIndex, segmentProgress, -10)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 2B" className={styles.sideSquare} />
                </motion.div>

                {/* Screen 3 side images */}
                <motion.div
                  className={styles.sideWrap3A}
                  animate={computeMotion(2, rawIndex, segmentProgress, 12)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 3A" className={styles.sideSquare} />
                </motion.div>
                <motion.div
                  className={styles.sideWrap3B}
                  animate={computeMotion(2, rawIndex, segmentProgress, -8)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 3B" className={styles.sideSquare} />
                </motion.div>

                {/* Screen 4 side images */}
                <motion.div
                  className={styles.sideWrap4A}
                  animate={computeMotion(3, rawIndex, segmentProgress, -11)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 4A" className={styles.sideSquare} />
                </motion.div>
                <motion.div
                  className={styles.sideWrap4B}
                  animate={computeMotion(3, rawIndex, segmentProgress, 9)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 4B" className={styles.sideSquare} />
                </motion.div>

                {/* Screen 5 side images */}
                <motion.div
                  className={styles.sideWrap5A}
                  animate={computeMotion(4, rawIndex, segmentProgress, 10)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 5A" className={styles.sideSquare} />
                </motion.div>
                <motion.div
                  className={styles.sideWrap5B}
                  animate={computeMotion(4, rawIndex, segmentProgress, -9)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 5B" className={styles.sideSquare} />
                </motion.div>

                {/* Screen 6 side images */}
                <motion.div
                  className={styles.sideWrap6A}
                  animate={computeMotion(5, rawIndex, segmentProgress, -10)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 6A" className={styles.sideSquare} />
                </motion.div>
                <motion.div
                  className={styles.sideWrap6B}
                  animate={computeMotion(5, rawIndex, segmentProgress, 8)}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
                >
                  <img src="/iphone/code.png" alt="Side image 6B" className={styles.sideSquare} />
                </motion.div>
              </>
            );
          })()}

          <div ref={phonePngRef} className={styles.phonePng} style={{ width: phoneWidth, height: 'auto' }}>
            <div className={styles.phoneScreenOverlay}>
              <div
                className={`${styles.phoneSlide} ${screenTitleIndex(phoneTrackProgress, 6) === 0 ? styles.active : ''}`}
                style={screenTitleIndex(phoneTrackProgress, 6) === 0 ? { opacity: timelineOpacity } : undefined}
              >
                <PhoneSlideOne />
              </div>
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

function PhoneSlideOne() { return <img className={styles.slideImage} src="/process/screen1/mvp.png" alt="Two-week MVP preview" />; }
function PhoneSlideTwo() { return <img className={styles.slideImage} src="/process/screen2/cheap.png" alt="AI-driven contracts cost preview" />; }
function PhoneSlideThree() { return <img className={styles.slideImage} src="/process/screen3/notion.png" alt="Notion checklists preview" />; }
function PhoneSlideFour() { return <img className={styles.slideImage} src="/process/screen4/githubmail.png" alt="GitHub email updates preview" />; }
function PhoneSlideFive() { return <img className={styles.slideImage} src="/process/screen5/insta.png" alt="Built in public Instagram style preview" />; }
function PhoneSlideSix() { return <img className={styles.slideImage} src="/process/screen6/milestone.png" alt="Milestone meetings preview" />; }


