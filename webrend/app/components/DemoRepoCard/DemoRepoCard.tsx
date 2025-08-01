'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import styles from './DemoRepoCard.module.css';

const DemoRepoCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: 'all 0.1s ease-out'
  });
  
  const demoRepo = {
    name: "WebRend Demo Repository",
    description: "A sample repository showcasing our marketplace functionality. This is a demonstration of what you can expect when purchasing from our marketplace.",
    price: 99,
    imageUrl: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2070&auto=format&fit=crop",
    stars: 145,
    forks: 37,
    isSubscription: false,
    seller: {
      username: "webrend",
      avatarUrl: "https://github.com/github.png"
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate the tilt values based on mouse position
      const tiltX = (y / rect.height - 0.5) * 10; // -5 to 5 degrees
      const tiltY = (x / rect.width - 0.5) * -10; // -5 to 5 degrees
      
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`,
        transition: 'all 0.1s ease-out'
      });
    }
  };

  const handleMouseLeave = () => {
    // Reset tilt when mouse leaves the card
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'all 0.5s ease-out'
    });
  };

  return (
    <div className={styles.demoRepoCardContainer}>
      <div 
        ref={cardRef}
        className={styles.demoRepoCard}
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.repoImage}>
          <Image 
            src={demoRepo.imageUrl} 
            alt={demoRepo.name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className={styles.repoContent}>
          <div className={styles.repoHeader}>
            <h3 className={styles.repoName}>{demoRepo.name}</h3>
            <div className={styles.repoPrice}>
              ${demoRepo.price}
            </div>
          </div>
          <p className={styles.repoDescription}>{demoRepo.description}</p>
          <div className={styles.repoFooter}>
            <div className={styles.seller}>
              <div className={styles.avatar}>
                <Image 
                  src={demoRepo.seller.avatarUrl}
                  alt={demoRepo.seller.username}
                  width={24}
                  height={24}
                />
              </div>
              @{demoRepo.seller.username}
            </div>
            <div className={styles.repoStats}>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                {demoRepo.stars}
              </div>
              <div className={styles.stat}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="6" y1="3" x2="6" y2="15"></line>
                  <circle cx="18" cy="6" r="3"></circle>
                  <circle cx="6" cy="18" r="3"></circle>
                  <path d="M18 9a9 9 0 0 1-9 9"></path>
                </svg>
                {demoRepo.forks}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoRepoCard; 