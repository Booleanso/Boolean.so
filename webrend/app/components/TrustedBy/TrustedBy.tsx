'use client';

import React from 'react';
import Image from 'next/image';
import styles from './TrustedBy.module.css';

const partners = [
  { name: 'Tata Technologies', id: 'tata', logoSrc: '/logos/tata_technologies_logo.png' },
  { name: 'Webflow', id: 'webflow', logoSrc: '/logos/webflow_partner.png' },
  { name: 'BlenderBin', id: 'blenderbin', logoSrc: '/logos/blenderbin_logo.png' },
  { name: 'PLC Ultima', id: 'plc', logoSrc: '/logos/plcu_logo.png' },
  { name: 'LAUNCH Startup Accelerator', id: 'launch', logoSrc: '/logos/launch_accelorator.png' },
  { name: 'Beta Accelerator', id: 'beta', logoSrc: '/logos/beta_logo.png' }
];

const TrustedBy = () => {
  // Duplicate partners for a seamless infinite scroll effect
  const extendedPartners = [...partners, ...partners];

  return (
    <section className={styles.trustedBySection}>
      <div className={styles.container}>
        <h2 className={styles.title}>Powering innovation at world-class companies</h2>
        <div className={styles.scroller}>
          <div className={styles.scrollerInner}>
            {extendedPartners.map((partner, index) => (
              <div key={`${partner.id}-${index}`} className={styles.partner} data-id={partner.id}>
                <Image 
                  src={partner.logoSrc}
                  alt={`${partner.name} logo`} 
                  width={150}
                  height={50}
                  className={styles.partnerLogo}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy; 