import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import './BlogListingPage.scss';

const BlogListingPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, 'blogPosts');
        const q = query(
          postsRef,
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const publishedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Extract unique categories
        const uniqueCategories = [...new Set(publishedPosts.map(post => post.category).filter(Boolean))];
        setCategories(uniqueCategories);
        setPosts(publishedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle both Firestore Timestamp and other formats
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReadTime = (post) => {
    // Use readTime field if available, otherwise calculate from content
    if (post.readTime) {
      return typeof post.readTime === 'number' ? `${post.readTime} min` : post.readTime;
    }
    
    // Fallback: calculate from content
    const wordCount = post.content ? post.content.trim().split(/\s+/).length : 0;
    return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  };

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      // Search in tags as well
      post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.length > 0 && !searchTerm ? filteredPosts[0] : null;
  const regularPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  // Render tags for a post
  const renderTags = (tags) => {
    if (!tags || !Array.isArray(tags) || tags.length === 0) return null;
    
    return (
      <div className="post-tags">
        {tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="tag">
            {tag}
          </span>
        ))}
        {tags.length > 3 && <span className="tag-more">+{tags.length - 3} more</span>}
      </div>
    );
  };

  return (
    <div className="blog-listing-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="container">
          <div className="blog-hero__content">
            <h1 className="blog-hero__title">AlenaTrends Blog</h1>
            <p className="blog-hero__subtitle">
              Discover the latest fashion trends, style tips, and inspiration from our experts
            </p>
            <div className="blog-hero__search">
              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search articles, tags, categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="search-clear"
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="blog-categories">
        <div className="container">
          <div className="categories-filter">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Posts
            </button>
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category?.charAt(0).toUpperCase() + category?.slice(1) || 'Uncategorized'}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="featured-post">
          <div className="container">
            <div className="featured-post__header">
              <h2>Featured Post</h2>
              <div className="decorative-line"></div>
            </div>
            <Link to={`/blog/${featuredPost.slug}`} className="featured-post__card">
              <div className="featured-post__image">
                <img 
                  src={featuredPost.featureImage} 
                  alt={featuredPost.title} 
                  onError={(e) => {
                    e.target.src = '/images/placeholder-blog.jpg';
                  }}
                />
                <div className="featured-post__badge">
                  <i className="fas fa-star"></i>
                  Featured
                </div>
              </div>
              <div className="featured-post__content">
                {featuredPost.category && (
                  <span className="post-category">{featuredPost.category}</span>
                )}
                <h3 className="featured-post__title">{featuredPost.title}</h3>
                <p className="featured-post__excerpt">{featuredPost.excerpt}</p>
                
                {/* Render tags for featured post */}
                {renderTags(featuredPost.tags)}
                
                <div className="featured-post__meta">
                  <div className="author-info">
                    <div className="author-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <span>By {featuredPost.author || 'Unknown Author'}</span>
                  </div>
                  <div className="meta-details">
                    <span>{formatDate(featuredPost.createdAt)}</span>
                    <span>{getReadTime(featuredPost)}</span>
                    {featuredPost.views > 0 && (
                      <>
                        <span>
                          <i className="fas fa-eye"></i>
                          {featuredPost.views}
                        </span>
                      </>
                    )}
                    {featuredPost.likes > 0 && (
                      <>
                        <span>
                          <i className="fas fa-heart"></i>
                          {featuredPost.likes}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <span className="read-more-btn">
                  Read Full Article <i className="fas fa-arrow-right"></i>
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="blog-posts-section">
        <div className="container">
          <div className="section-header">
            <h2>
              {searchTerm 
                ? `Search Results (${filteredPosts.length})`
                : featuredPost ? 'Latest Articles' : 'All Articles'
              }
            </h2>
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="golden-loader">
                <div className="loader-spinner"></div>
                <div className="loader-content">
                  <h3>Loading Articles</h3>
                  <p>Discovering amazing content for you...</p>
                </div>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>No Posts Found</h3>
              <p>
                {searchTerm 
                  ? `No articles found for "${searchTerm}". Try different keywords or browse all categories.`
                  : 'No blog posts available yet. Check back soon!'
                }
              </p>
              {searchTerm && (
                <button 
                  className="btn btn--primary"
                  onClick={() => setSearchTerm('')}
                >
                  View All Posts
                </button>
              )}
            </div>
          ) : (
            <div className="blog-grid">
              {regularPosts.map(post => (
                <article key={post.id} className="blog-card">
                  <Link to={`/blog/${post.slug}`} className="blog-card__link">
                    <div className="blog-card__image-container">
                      <img 
                        src={post.featureImage} 
                        alt={post.title} 
                        className="blog-card__image" 
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/images/placeholder-blog.jpg';
                        }}
                      />
                      {post.category && (
                        <span className="blog-card__category">{post.category}</span>
                      )}
                    </div>
                    <div className="blog-card__content">
                      <h2 className="blog-card__title">{post.title}</h2>
                      <p className="blog-card__excerpt">{post.excerpt}</p>
                      
                      {/* Render tags for regular posts */}
                      {renderTags(post.tags)}
                      
                      <div className="blog-card__meta">
                        <div className="meta-left">
                          <div className="author">
                            <div className="author-avatar">
                              <i className="fas fa-user"></i>
                            </div>
                            <span>{post.author || 'Unknown Author'}</span>
                          </div>
                          <span className="read-time">
                            <i className="fas fa-clock"></i>
                            {getReadTime(post)}
                          </span>
                        </div>
                        <div className="meta-right">
                          <span className="post-date">
                            {formatDate(post.createdAt)}
                          </span>
                          <div className="engagement-stats">
                            {post.views > 0 && (
                              <span className="post-views">
                                <i className="fas fa-eye"></i>
                                {post.views}
                              </span>
                            )}
                            {post.likes > 0 && (
                              <span className="post-likes">
                                <i className="fas fa-heart"></i>
                                {post.likes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="blog-card__footer">
                        <span className="read-more">
                          Read More
                          <i className="fas fa-arrow-right"></i>
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BlogListingPage;