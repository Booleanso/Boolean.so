'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '../page.module.css';

interface Article {
  id: string;
  title: string;
  description: string;
  publishedAt: number | Date;
  imageUrl?: string;
  category: string;
  readTime: number;
  slug?: string;
}

interface BlogPageClientProps {
  articles: Article[];
  uniqueCategories: string[];
}

export default function BlogPageClient({ articles, uniqueCategories }: BlogPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationClass, setAnimationClass] = useState(styles.fadeIn);
  
  // Filter articles based on selected category and search query
  const filterArticles = useCallback(() => {
    let result = articles;
    
    // Apply category filter if selected
    if (selectedCategory) {
      result = result.filter(article => article.category === selectedCategory);
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(article => 
        article.title.toLowerCase().includes(query) || 
        article.description.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [articles, selectedCategory, searchQuery]);
  
  // Handle category click
  const handleCategoryClick = (category: string | null) => {
    if (selectedCategory === category || isAnimating) return;
    
    // Start fade out animation
    setIsAnimating(true);
    setAnimationClass(styles.fadeOut);
    
    // After fade out animation completes, update the data and fade in
    setTimeout(() => {
      setSelectedCategory(category);
      setFilteredArticles(filterArticles());
      setAnimationClass(styles.fadeIn);
      
      // After fade in completes, reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 400); // Match the duration of the fadeIn animation
      
    }, 300); // Match the duration of the fadeOut animation
  };
  
  // Handle search input changes - now just updates the input value
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };
  
  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If already searching for the same term, do nothing
    if (searchQuery === inputValue) return;
    
    if (isAnimating) return;
    
    // Start fade out animation
    setIsAnimating(true);
    setAnimationClass(styles.fadeOut);
    
    // After fade out animation completes, update the search query and filter
    setTimeout(() => {
      setSearchQuery(inputValue);
      setFilteredArticles(filterArticles());
      setAnimationClass(styles.fadeIn);
      
      // After fade in completes, reset animation state
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }, 300);
  };
  
  // Clear search and reset filters
  const clearSearch = () => {
    if (isAnimating) return;
    
    // Start fade out animation
    setIsAnimating(true);
    setAnimationClass(styles.fadeOut);
    
    setTimeout(() => {
      setInputValue('');
      setSearchQuery('');
      setFilteredArticles(selectedCategory 
        ? articles.filter(article => article.category === selectedCategory) 
        : articles);
      setAnimationClass(styles.fadeIn);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }, 300);
  };
  
  // Reset all filters
  const resetAllFilters = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationClass(styles.fadeOut);
    
    setTimeout(() => {
      setInputValue('');
      setSearchQuery('');
      setSelectedCategory(null);
      setFilteredArticles(articles);
      setAnimationClass(styles.fadeIn);
      
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }, 300);
  };
  
  // Update filtered articles when dependencies change
  useEffect(() => {
    setFilteredArticles(filterArticles());
    // Only run when searchQuery or selectedCategory changes, not when inputValue changes
  }, [filterArticles, searchQuery, selectedCategory]);
  
  // Initial fade in
  useEffect(() => {
    setAnimationClass(styles.fadeIn);
  }, []);
  
  // Update any styles to support dark mode
  useEffect(() => {
    // Add listener for theme changes - this ensures the UI updates appropriately
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark-theme');
      const searchInput = document.querySelector(`.${styles.searchInput}`) as HTMLInputElement;
      
      // Ensure input text color is properly set for dark mode
      if (searchInput) {
        searchInput.style.color = isDark ? '#fff' : '#333';
        searchInput.style.caretColor = isDark ? '#fff' : '#333';
      }
    };
    
    // Check on mount
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <>
      {/* Top Navigation Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <form 
            className={styles.searchBar} 
            onSubmit={handleSearchSubmit}
          >
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="Search articles..." 
              value={inputValue}
              onChange={handleSearchChange}
            />
            {inputValue && (
              <button 
                type="button" 
                className={styles.clearSearch}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button 
              type="submit"
              className={styles.searchSubmitButton}
              aria-label="Search"
            >
              ↵
            </button>
          </form>
        </div>
        <div className={styles.topBarRight}>
          <button className={styles.button}>Today</button>
          <button className={`${styles.button} ${styles.buttonPrimary}`}>Subscribe</button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className={styles.categoriesBar}>
        <span 
          className={`${styles.categoryTab} ${selectedCategory === null ? styles.categoryTabActive : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          All
        </span>
        {uniqueCategories.map(category => (
          <span 
            key={category} 
            className={`${styles.categoryTab} ${selectedCategory === category ? styles.categoryTabActive : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </span>
        ))}
      </div>

      {/* Main Content */}
      <div className={`${styles.content} ${styles.animatedContent}`}>
        <div className={animationClass}>
          {filteredArticles.length > 0 ? (
            <>
              {/* Header */}
              <div className={styles.header}>
                <h1 className={styles.title}>WebRend Blog</h1>
                <p className={styles.subtitle}>
                  {searchQuery ? (
                    `Search results for "${searchQuery}"`
                  ) : selectedCategory ? (
                    `Articles about ${selectedCategory}`
                  ) : (
                    'Insights, tips, and inspiration for web developers and designers'
                  )}
                </p>
              </div>

              {/* Featured Section */}
              <section className={styles.featuredSection}>
                <div className={styles.featuredGrid}>
                  {filteredArticles[0] && (
                    <Link 
                      href={`/blog/${filteredArticles[0].slug || filteredArticles[0].id}`} 
                      className={styles.mainArticle}
                    >
                      <div 
                        className={styles.mainArticleImage}
                        style={{ backgroundImage: filteredArticles[0].imageUrl ? `url(${filteredArticles[0].imageUrl})` : 'none' }}
                      >
                        <div className={styles.category}>{filteredArticles[0].category}</div>
                      </div>
                      <div className={styles.articleContent}>
                        <h2 className={styles.articleTitle}>{filteredArticles[0].title}</h2>
                        <p className={styles.articleDescription}>{filteredArticles[0].description}</p>
                        <div className={styles.articleMeta}>
                          <div className={styles.publishDate}>
                            <span>📅</span>
                            <span>{filteredArticles[0].publishedAt instanceof Date 
                              ? filteredArticles[0].publishedAt.toLocaleDateString() 
                              : new Date(filteredArticles[0].publishedAt).toLocaleDateString()}</span>
                          </div>
                          <div className={styles.readTime}>
                            <span>⏱️</span>
                            <span>{filteredArticles[0].readTime} min read</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}

                  {filteredArticles.slice(1, 3).map(article => (
                    <Link 
                      href={`/blog/${article.slug || article.id}`} 
                      key={article.id} 
                      className={styles.articleCard}
                    >
                      <div 
                        className={styles.articleImage}
                        style={{ backgroundImage: article.imageUrl ? `url(${article.imageUrl})` : 'none' }}
                      >
                        <div className={styles.category}>{article.category}</div>
                      </div>
                      <div className={styles.articleContent}>
                        <h2 className={styles.articleTitle}>{article.title}</h2>
                        <p className={styles.articleDescription}>{article.description}</p>
                        <div className={styles.articleMeta}>
                          <div className={styles.publishDate}>
                            <span>📅</span>
                            <span>{article.publishedAt instanceof Date 
                              ? article.publishedAt.toLocaleDateString() 
                              : new Date(article.publishedAt).toLocaleDateString()}</span>
                          </div>
                          <div className={styles.readTime}>
                            <span>⏱️</span>
                            <span>{article.readTime} min read</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Latest Articles Section */}
              {filteredArticles.length > 3 && (
                <section className={styles.articleSection}>
                  <h3 className={styles.sectionTitle}>
                    {searchQuery ? 'More Results' : 'Latest Articles'}
                  </h3>
                  <div className={styles.articleGrid}>
                    {filteredArticles.slice(3).map(article => (
                      <Link 
                        href={`/blog/${article.slug || article.id}`} 
                        key={article.id} 
                        className={styles.articleCard}
                      >
                        <div 
                          className={styles.articleImage}
                          style={{ backgroundImage: article.imageUrl ? `url(${article.imageUrl})` : 'none' }}
                        >
                          <div className={styles.category}>{article.category}</div>
                        </div>
                        <div className={styles.articleContent}>
                          <h2 className={styles.articleTitle}>{article.title}</h2>
                          <p className={styles.articleDescription}>{article.description}</p>
                          <div className={styles.articleMeta}>
                            <div className={styles.publishDate}>
                              <span>📅</span>
                              <span>{article.publishedAt instanceof Date 
                                ? article.publishedAt.toLocaleDateString() 
                                : new Date(article.publishedAt).toLocaleDateString()}</span>
                            </div>
                            <div className={styles.readTime}>
                              <span>⏱️</span>
                              <span>{article.readTime} min read</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <h2>No articles found</h2>
              <p>
                {searchQuery 
                  ? `No articles match your search for "${searchQuery}".`
                  : selectedCategory 
                    ? `There are currently no articles in the ${selectedCategory} category.` 
                    : 'There are currently no blog articles to display. Check back soon for new content.'}
              </p>
              {(searchQuery || selectedCategory) && (
                <button 
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={resetAllFilters}
                >
                  View All Articles
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 