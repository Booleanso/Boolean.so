'use client';

import React from 'react';
import Image from 'next/image';
import styles from './TrustedByInline.module.css';

const partners = [
  { name: 'Tata Technologies', id: 'tata', logoSrc: '/testimonials/tatatechnologies_testimonial_logo.png' },
  { name: 'Webflow', id: 'webflow', logoSrc: '/testimonials/webflow_testimonial_logo.png' },
  { name: 'BlenderBin', id: 'blenderbin', logoSrc: '/testimonials/blenderbin__testimonial_logo.png' },
  { name: 'Beta Accelerator', id: 'beta', logoSrc: '/testimonials/beta_testimonial_logo.png' },
  { name: 'Antler', id: 'antler', logoSrc: '/testimonials/antler_testimonial_logo.png' },
  { name: 'RMC', id: 'rmc', logoSrc: '/testimonials/rmc_testimonial_logo.png' },
  { name: 'La Creme', id: 'lacreme', logoSrc: '/testimonials/lacreme_testimonial_logo.png' }
];

export default function TrustedByInline() {
  const extendedPartners = [...partners, ...partners];
  return (
    <div className={styles.inlineTrustedBy} aria-label="Trusted by logos">
      <div className={styles.scroller}>
        <div className={styles.scrollerInner}>
          {extendedPartners.map((partner, index) => (
            <div key={`${partner.id}-${index}`} className={styles.partner}>
              <Image
                src={partner.logoSrc}
                alt={`${partner.name} logo`}
                width={100}
                height={28}
                className={styles.partnerLogo}
                priority
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
