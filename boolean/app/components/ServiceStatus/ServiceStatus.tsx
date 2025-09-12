'use client';

import { useState, useEffect } from 'react';
import styles from './ServiceStatus.module.css';

interface ServiceStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function ServiceStatus({ showDetails = false, className = '' }: ServiceStatusProps) {
  const [serviceStatus, setServiceStatus] = useState({
    firebase: false,
    stripe: false,
    auth: false,
    loading: true
  });

  useEffect(() => {
    const checkServices = async () => {
      try {
        // Check Firebase client configuration
        const firebaseCheck = !!(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        );

        // Check Stripe configuration
        const stripeCheck = !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

        setServiceStatus({
          firebase: firebaseCheck,
          stripe: stripeCheck,
          auth: firebaseCheck, // Auth depends on Firebase
          loading: false
        });
      } catch (error) {
        console.warn('Error checking service status:', error);
        setServiceStatus(prev => ({ ...prev, loading: false }));
      }
    };

    checkServices();
  }, []);

  if (serviceStatus.loading) {
    return null;
  }

  const hasIssues = !serviceStatus.firebase || !serviceStatus.stripe;

  if (!showDetails && !hasIssues) {
    return null;
  }

  return (
    <div className={`${styles.serviceStatus} ${className}`}>
      {hasIssues && (
        <div className={styles.warning}>
          <div className={styles.warningIcon}>⚠️</div>
          <div className={styles.warningText}>
            <strong>Development Mode:</strong> Some features may be limited due to missing configuration.
          </div>
        </div>
      )}
      
      {showDetails && (
        <div className={styles.details}>
          <h4>Service Status</h4>
          <div className={styles.serviceList}>
            <div className={`${styles.serviceItem} ${serviceStatus.firebase ? styles.available : styles.unavailable}`}>
              <span className={styles.serviceName}>Firebase</span>
              <span className={styles.serviceIcon}>{serviceStatus.firebase ? '✅' : '❌'}</span>
            </div>
            <div className={`${styles.serviceItem} ${serviceStatus.auth ? styles.available : styles.unavailable}`}>
              <span className={styles.serviceName}>Authentication</span>
              <span className={styles.serviceIcon}>{serviceStatus.auth ? '✅' : '❌'}</span>
            </div>
            <div className={`${styles.serviceItem} ${serviceStatus.stripe ? styles.available : styles.unavailable}`}>
              <span className={styles.serviceName}>Payments</span>
              <span className={styles.serviceIcon}>{serviceStatus.stripe ? '✅' : '❌'}</span>
            </div>
          </div>
          {hasIssues && (
            <div className={styles.helpText}>
              <p>To enable all features, configure the required environment variables.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 