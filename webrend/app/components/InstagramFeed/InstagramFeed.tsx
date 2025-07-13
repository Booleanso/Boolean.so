'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './InstagramFeed.module.css';

interface InstagramPost {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username: string;
  account: string;
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchInstagramPosts();
  }, []);

  const fetchInstagramPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/instagram/posts');
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      } else {
        setError(data.error || 'Failed to fetch Instagram posts');
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      setError('Failed to fetch Instagram posts');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateCaption = (caption: string, maxLength: number = 100) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  const getAccountColor = (account: string) => {
    return account === 'webrendhq' ? '#007AFF' : '#FF3B30';
  };

  const getAccountIcon = (account: string) => {
    return account === 'webrendhq' ? '🌐' : '👨‍💻';
  };

  // Split posts into rows for marquee effect
  const splitPostsIntoRows = (posts: InstagramPost[]) => {
    const rows: InstagramPost[][] = [];
    const postsPerRow = 3;
    
    for (let i = 0; i < posts.length; i += postsPerRow) {
      rows.push(posts.slice(i, i + postsPerRow));
    }
    
    return rows;
  };

  const postRows = splitPostsIntoRows(posts);

  if (loading) {
    return (
      <section className={styles.instagramSection}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Live Feed</span>
            </div>
            <h2 className={styles.heading}>
              <span className={styles.headingLine}>Latest from</span>
              <span className={styles.headingLine}>
                <span className={styles.gradientText}>@webrendhq & @vincelawliet</span>
              </span>
            </h2>
          </div>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading Instagram posts...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.instagramSection}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>Live Feed</span>
            </div>
            <h2 className={styles.heading}>
              <span className={styles.headingLine}>Latest from</span>
              <span className={styles.headingLine}>
                <span className={styles.gradientText}>@webrendhq & @vincelawliet</span>
              </span>
            </h2>
          </div>
          <div className={styles.errorState}>
            <p>Unable to load Instagram posts at the moment.</p>
            <p>Follow us on Instagram for the latest updates!</p>
            <div className={styles.followLinks}>
              <a href="https://instagram.com/webrendhq" target="_blank" rel="noopener noreferrer">
                @webrendhq
              </a>
              <a href="https://instagram.com/vincelawliet" target="_blank" rel="noopener noreferrer">
                @vincelawliet
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className={styles.instagramSection}>
      <div className={styles.container}>
        {/* Header */}
        <div className={`${styles.headerContent} ${isVisible ? styles.visible : ''}`}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>Live Feed</span>
          </div>
          <h2 className={styles.heading}>
            <span className={styles.headingLine}>Latest from</span>
            <span className={styles.headingLine}>
              <span className={styles.gradientText}>@webrendhq & @vincelawliet</span>
            </span>
          </h2>
          <p className={styles.description}>
            Stay updated with our latest projects, behind-the-scenes content, and developer insights straight from Instagram.
          </p>
        </div>

        {/* Instagram Posts Marquee */}
        <div className={styles.postsMarquee}>
          {postRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`${styles.marqueeRow} ${
                rowIndex % 2 === 0 ? styles.leftToRight : styles.rightToLeft
              }`}
            >
              <div className={styles.marqueeContent}>
                {/* Duplicate content for seamless loop */}
                {[...row, ...row].map((post, index) => (
                  <div
                    key={`${post.id}-${index}`}
                    className={`${styles.postCard} ${isVisible ? styles.visible : ''}`}
                    style={{
                      animationDelay: `${(rowIndex * 3 + index) * 0.1}s`,
                    }}
                    onMouseEnter={() => setHoveredIndex(rowIndex * 10 + index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Account Badge */}
                    <div 
                      className={styles.accountBadge}
                      style={{ 
                        backgroundColor: getAccountColor(post.account),
                        color: 'white'
                      }}
                    >
                      <span className={styles.accountIcon}>
                        {getAccountIcon(post.account)}
                      </span>
                      <span className={styles.accountName}>
                        @{post.account}
                      </span>
                    </div>

                    {/* Media */}
                    <div className={styles.mediaContainer}>
                      <Image
                        src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url}
                        alt={post.caption || `Instagram post by @${post.account}`}
                        width={300}
                        height={300}
                        className={styles.postImage}
                      />
                      {post.media_type === 'VIDEO' && (
                        <div className={styles.videoOverlay}>
                          <div className={styles.playIcon}>▶</div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={styles.postContent}>
                      <p className={styles.postCaption}>
                        {truncateCaption(post.caption)}
                      </p>
                      <div className={styles.postMeta}>
                        <span className={styles.postDate}>
                          {formatDate(post.timestamp)}
                        </span>
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.viewOnInstagram}
                        >
                          View on Instagram
                        </a>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div 
                      className={`${styles.cardGlow} ${hoveredIndex === rowIndex * 10 + index ? styles.active : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className={`${styles.ctaSection} ${isVisible ? styles.visible : ''}`}>
          <p className={styles.ctaText}>
            Follow us for more updates and behind-the-scenes content
          </p>
          <div className={styles.followButtons}>
            <a 
              href="https://instagram.com/webrendhq" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              <span>Follow @webrendhq</span>
              <div className={styles.ctaGlow} />
            </a>
            <a 
              href="https://instagram.com/vincelawliet" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              <span>Follow @vincelawliet</span>
              <div className={styles.ctaGlow} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 