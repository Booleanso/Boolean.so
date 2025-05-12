'use client';

import React from 'react';
import Image from 'next/image';
import styles from './TrustedBy.module.css';

const TrustedBy = () => {
  const partners = [
    { name: 'Tata Technologies', id: 'tata', logoSrc: '/logos/tata_technologies_logo.png' },
    { name: 'Vital Element', id: 'vital', logoSrc: '/logos/vital_element_logo.png' },
    { name: 'BlenderBin', id: 'blenderbin', logoSrc: '/logos/blenderbin_logo.png' },
    { name: 'Webflow', id: 'webflow', logoSrc: '/logos/webflow_logo.png' },
    { name: 'PLC Ultima', id: 'plc', logoSrc: '/logos/plcu_logo.png' },
    { name: 'LAUNCH Startup Accelerator', id: 'launch', logoSrc: '/logos/launch_accelorator.png' },
    { name: 'Beta Accelerator', id: 'beta', logoSrc: '/logos/beta_logo.png' }
  ];

  return (
    <section className={styles.trustedBySection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Trusted By</h2>
        <div className={styles.partnersContainer}>
          {partners.map((partner) => (
            <div key={partner.id} className={`${styles.partner} ${styles[partner.id]}`}>
              <Image 
                src={partner.logoSrc!}
                alt={`${partner.name} logo`} 
                width={150}
                height={50}
                className={styles.partnerLogo}
              />
              {partner.id === 'blenderbin' && (
                <span className={styles.blenderbinText}>BlenderBin</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy; 