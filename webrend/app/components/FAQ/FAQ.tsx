'use client';

import { useState } from 'react';
import styles from './FAQ.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What services do you offer?",
    answer: "We offer full-stack web development, mobile app development, custom software solutions, GitHub repository monetization, and digital transformation consulting. Our team specializes in React, Next.js, Node.js, and modern web technologies."
  },
  {
    question: "How does the GitHub marketplace work?",
    answer: "Our marketplace allows developers to sell their GitHub repositories as ready-to-use solutions. Buyers can purchase complete projects, including source code, documentation, and setup instructions. We handle the transaction process and provide ongoing support."
  },
  {
    question: "What's your typical project timeline?",
    answer: "Project timelines vary based on complexity and scope. Simple websites typically take 2-4 weeks, while complex web applications can take 8-16 weeks. We provide detailed project timelines during our initial consultation and keep you updated throughout the development process."
  },
  {
    question: "Do you provide ongoing support and maintenance?",
    answer: "Yes, we offer comprehensive support and maintenance packages. This includes bug fixes, security updates, performance optimization, and feature enhancements. We also provide hosting solutions and can handle all technical aspects of your project."
  },
  {
    question: "How much do your services cost?",
    answer: "Our pricing varies based on project requirements, complexity, and timeline. We offer competitive rates and provide detailed quotes after understanding your specific needs. Contact us for a free consultation and custom quote for your project."
  },
  {
    question: "Can you work with existing codebases?",
    answer: "Absolutely! We can work with existing projects, whether it's adding new features, fixing bugs, optimizing performance, or modernizing legacy code. We're experienced with various technologies and can adapt to your current tech stack."
  },
  {
    question: "Do you offer free consultations?",
    answer: "Yes, we offer free initial consultations to discuss your project requirements, provide technical advice, and create a custom proposal. This helps us understand your needs and allows you to get to know our team before making any commitments."
  },
  {
    question: "What makes WebRend different from other development agencies?",
    answer: "We combine technical expertise with a unique marketplace approach, allowing developers to monetize their work while providing businesses with proven solutions. Our team focuses on modern technologies, clean code practices, and delivering projects that scale with your business growth."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <section className={styles.faqSection}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          <h2 className={styles.heading}>Frequently Asked Questions</h2>
          <p className={styles.subheading}>
            Get answers to common questions about our services, process, and approach.
          </p>
        </div>
        
        <div className={styles.faqList}>
          {faqData.map((item, index) => (
            <div 
              key={index} 
              className={`${styles.faqItem} ${openItems.has(index) ? styles.open : ''}`}
            >
              <button 
                className={styles.questionButton}
                onClick={() => toggleItem(index)}
                aria-expanded={openItems.has(index)}
              >
                <span className={styles.questionText}>{item.question}</span>
                <svg 
                  className={styles.chevron}
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M6 9L12 15L18 9" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className={styles.answerWrapper}>
                <div className={styles.answerContent}>
                  <p className={styles.answerText}>{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.contactPrompt}>
          <p>Still have questions?</p>
          <a href="mailto:hello@webrend.com" className={styles.contactLink}>
            Get in touch with our team
          </a>
        </div>
      </div>
    </section>
  );
} 