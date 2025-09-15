'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './success.module.css';

interface BookingDetails {
  bookingId: string;
  name: string;
  email: string;
  date: string;
  time: string;
  meetingLink?: string;
}

function DiscoverySuccessContent() {
  const searchParams = useSearchParams();
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bookingId = searchParams.get('bookingId');
    
    async function load() {
      if (!bookingId) {
        setError('Booking ID not found');
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/discovery/lookup?bookingId=${encodeURIComponent(bookingId)}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setBookingDetails(data as BookingDetails);
        } else {
          // fallback minimal state
          setBookingDetails({ bookingId, name: 'Guest', email: '', date: '', time: '', meetingLink: '' });
        }
      } catch {
        setBookingDetails({ bookingId, name: 'Guest', email: '', date: '', time: '', meetingLink: '' });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingDetails) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h1>Booking Not Found</h1>
          <p>We couldn&apos;t find your booking details. Please check your email for confirmation or contact us directly.</p>
          <Link href="/discovery" className={styles.button}>
            Book Another Call
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.checkmark}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </div>
        
        <h1>Discovery Call Booked Successfully!</h1>
        <p className={styles.subtitle}>
          We&apos;re excited to discuss your project and explore how we can help bring your vision to life.
        </p>

        <div className={styles.bookingDetails}>
          <h2>Meeting Details</h2>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Booking ID:</span>
            <span className={styles.value}>{bookingDetails.bookingId}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Date:</span>
            <span className={styles.value}>{bookingDetails.date}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Time:</span>
            <span className={styles.value}>{bookingDetails.time}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.label}>Duration:</span>
            <span className={styles.value}>30 minutes</span>
          </div>

          {bookingDetails.meetingLink && (
            <div className={styles.meetingLink}>
              <a href={bookingDetails.meetingLink} className={styles.linkButton} target="_blank" rel="noopener noreferrer">
                Join Google Meet
              </a>
            </div>
          )}
        </div>

        <div className={styles.nextSteps}>
          <h2>What Happens Next?</h2>
          
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Calendar Invitation</h3>
                <p>You&apos;ll receive a calendar invitation with the meeting link and details via email.</p>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Pre-Meeting Questions</h3>
                <p>We&apos;ll send you a brief questionnaire to help us understand your project better before the call.</p>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Discovery Call</h3>
                <p>We&apos;ll discuss your project requirements, goals, timeline, and provide initial recommendations.</p>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepContent}>
                <h3>Follow-up</h3>
                <p>After the call, we&apos;ll send you a detailed proposal with project scope, timeline, and pricing.</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.preparationTips}>
          <h2>How to Prepare</h2>
          <ul>
            <li>Gather any existing project materials, wireframes, or design references</li>
            <li>Think about your target audience and business goals</li>
            <li>Consider your budget range and timeline preferences</li>
            <li>Prepare questions about our development process</li>
            <li>Have examples of websites or apps you like handy</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Link href="/" className={styles.primaryButton}>
            Back to Home
          </Link>
          <Link href="/portfolio" className={styles.secondaryButton}>
            View Our Work
          </Link>
        </div>

        <div className={styles.contact}>
          <p>Need to reschedule or have questions?</p>
          <a href="mailto:hello@boolean.so" className={styles.contactLink}>
            hello@boolean.so
          </a>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function DiscoverySuccessLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading your booking details...</p>
      </div>
    </div>
  );
}

export default function DiscoverySuccessPage() {
  return (
    <Suspense fallback={<DiscoverySuccessLoading />}>
      <DiscoverySuccessContent />
    </Suspense>
  );
} 