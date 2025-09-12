'use client';

import React from 'react';
import Image from 'next/image';
import styles from './TrustedBy.module.css';

const partners = [
  { name: 'Tata Technologies', id: 'tata', logoSrc: '/testimonials/tatatechnologies_testimonial_logo.png' },
  { name: 'Webflow', id: 'webflow', logoSrc: '/testimonials/webflow_testimonial_logo.png' },
  { name: 'BlenderBin', id: 'blenderbin', logoSrc: '/testimonials/blenderbin__testimonial_logo.png' },
  { name: 'Beta Accelerator', id: 'beta', logoSrc: '/testimonials/beta_testimonial_logo.png' },
  { name: 'Antler', id: 'antler', logoSrc: '/testimonials/antler_testimonial_logo.png' },
  { name: 'RMC', id: 'rmc', logoSrc: '/testimonials/rmc_testimonial_logo.png' },
  { name: 'La Creme', id: 'lacreme', logoSrc: '/testimonials/lacreme_testimonial_logo.png' }
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