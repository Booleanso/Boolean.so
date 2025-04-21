'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './portfolio.module.scss';

type PortfolioProject = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  technologies: string[];
  featured?: boolean;
};

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Sample portfolio projects
  const portfolioProjects: PortfolioProject[] = [
    {
      id: 1,
      name: "3D Game Experience",
      description: "Interactive 3D environment built with Three.js and React, featuring realistic physics and immersive gameplay.",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      projectUrl: "/portfolio/game",
      technologies: ["React", "Three.js", "WebGL"],
      featured: true
    },
    {
      id: 2,
      name: "E-Commerce Platform",
      description: "Full-featured online store with product management, cart functionality, and secure payment processing.",
      imageUrl: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      projectUrl: "https://ecommerce-example.com",
      technologies: ["Next.js", "Stripe", "TailwindCSS"]
    },
    {
      id: 3,
      name: "AI Content Generator",
      description: "Machine learning application that creates unique content based on user input and preferences.",
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
      projectUrl: "https://ai-generator-example.com",
      technologies: ["Python", "TensorFlow", "React"]
    },
    {
      id: 4,
      name: "Social Media Dashboard",
      description: "Analytics platform that tracks engagement across multiple social media channels in real-time.",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2426&q=80",
      projectUrl: "https://dashboard-example.com",
      technologies: ["Vue.js", "D3.js", "Firebase"]
    },
    {
      id: 5,
      name: "Fitness Tracking App",
      description: "Mobile application for tracking workouts, nutrition, and personal fitness goals with data visualization.",
      imageUrl: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      projectUrl: "https://fitness-app-example.com",
      technologies: ["React Native", "GraphQL", "Node.js"]
    },
    {
      id: 6,
      name: "Blockchain Explorer",
      description: "Web application for exploring blockchain transactions, addresses, and smart contracts with visualizations.",
      imageUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
      projectUrl: "https://blockchain-example.com",
      technologies: ["JavaScript", "Web3.js", "Express"]
    }
  ];

  // Filter projects based on active filter
  const filteredProjects = portfolioProjects.filter(project => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'frontend' && project.technologies.some(tech => ['React', 'Vue.js', 'TailwindCSS', 'Next.js'].includes(tech))) return true;
    if (activeFilter === 'backend' && project.technologies.some(tech => ['Node.js', 'Express', 'Python', 'GraphQL'].includes(tech))) return true;
    if (activeFilter === '3d' && project.technologies.some(tech => ['Three.js', 'WebGL'].includes(tech))) return true;
    return false;
  });

  const featuredProject = portfolioProjects.find(project => project.featured);

  return (
    <div className={styles.portfolioContainer}>
      {/* Featured Project - Hero Section */}
      {featuredProject && (
        <div className={styles.featuredProject}>
          <div className={styles.featuredProjectImage} style={{ backgroundImage: `url(${featuredProject.imageUrl})` }}>
            <div className={styles.overlay}>
              <div className={styles.content}>
                <h2>{featuredProject.name}</h2>
                <p>{featuredProject.description}</p>
                <Link href={featuredProject.projectUrl} className={styles.enterButton}>
                  Enter Game
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1>Portfolio Projects</h1>
        <Link href="#contact" className={styles.contactButton}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Contact Me
        </Link>
      </div>

      <div className={styles.filters}>
        <button 
          className={`${styles.filter} ${activeFilter === 'all' ? styles.active : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All Projects
        </button>
        <button 
          className={`${styles.filter} ${activeFilter === 'frontend' ? styles.active : ''}`}
          onClick={() => setActiveFilter('frontend')}
        >
          Frontend
        </button>
        <button 
          className={`${styles.filter} ${activeFilter === 'backend' ? styles.active : ''}`}
          onClick={() => setActiveFilter('backend')}
        >
          Backend
        </button>
        <button 
          className={`${styles.filter} ${activeFilter === '3d' ? styles.active : ''}`}
          onClick={() => setActiveFilter('3d')}
        >
          3D / WebGL
        </button>
      </div>

      <div className={styles.grid}>
        {filteredProjects
          .filter(project => !project.featured) // Don't show featured project again in the grid
          .map(project => (
            <div key={project.id} className={styles.card}>
              <div className={styles.cardImage}>
                <Image 
                  src={project.imageUrl} 
                  alt={project.name}
                  width={600}
                  height={400}
                  layout="responsive"
                />
                <Link href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                  <button className={styles.viewButton}>
                    View Project
                  </button>
                </Link>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.projectName}>{project.name}</h2>
                </div>
                <p className={styles.description}>{project.description}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.technologies}>
                    {project.technologies.map((tech, index) => (
                      <span key={index} className={styles.tech}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>

      <div id="contact" className={styles.contactSection}>
        <h2>Get In Touch</h2>
        <p>Interested in working together? Let's discuss your project!</p>
        <div className={styles.contactForm}>
          <div className={styles.formRow}>
            <input type="text" placeholder="Name" className={styles.input} />
            <input type="email" placeholder="Email" className={styles.input} />
          </div>
          <textarea placeholder="Your message" className={styles.textarea} rows={5}></textarea>
          <button className={styles.submitButton}>Send Message</button>
        </div>
      </div>
    </div>
  );
} 