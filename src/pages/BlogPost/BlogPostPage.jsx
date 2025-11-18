import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './BlogPostPage.scss';

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [views, setViews] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      try {
        const postsRef = collection(db, 'blogPosts');
        const q = query(
          postsRef,
          where('slug', '==', slug),
          where('status', '==', 'published')
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Post not found or is not published.');
        } else {
          const docId = querySnapshot.docs[0].id;
          const postData = querySnapshot.docs[0].data();
          
          setPost(postData);
          setPostId(docId);
          setViews(postData.views || 0);
          setLikes(postData.likes || 0);
          
          // Check if user has already liked this post
          checkUserLike(docId);
          
          // Increment view count
          await updateDoc(doc(db, 'blogPosts', docId), {
            views: increment(1)
          });

          // Fetch related posts
          fetchRelatedPosts(postData.category, docId);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
        setError('Failed to load post. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const checkUserLike = async (docId) => {
    try {
      // Create a unique identifier for the user (in a real app, use proper auth)
      const userId = getUserId();
      const likeDocRef = doc(db, 'blogPosts', docId, 'likes', userId);
      const likeDoc = await getDoc(likeDocRef);
      
      setIsLiked(likeDoc.exists());
    } catch (err) {
      console.error("Error checking like status:", err);
    }
  };

  const getUserId = () => {
    // In a real application, you would get this from your auth system
    // For now, we'll use a combination of browser fingerprint and local storage
    let userId = localStorage.getItem('blog_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('blog_user_id', userId);
    }
    return userId;
  };

  const handleLike = async () => {
    if (!postId || likeLoading) return;
    
    setLikeLoading(true);
    try {
      const userId = getUserId();
      const likeDocRef = doc(db, 'blogPosts', postId, 'likes', userId);

      if (isLiked) {
        // Unlike the post
        await updateDoc(doc(db, 'blogPosts', postId), {
          likes: increment(-1)
        });
        await setDoc(likeDocRef, { liked: false }); // Or delete the document
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like the post
        await updateDoc(doc(db, 'blogPosts', postId), {
          likes: increment(1)
        });
        await setDoc(likeDocRef, { 
          liked: true,
          likedAt: new Date(),
          userId: userId
        });
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error("Error updating like:", err);
      alert('Failed to update like. Please try again.');
    } finally {
      setLikeLoading(false);
    }
  };

  const fetchRelatedPosts = async (category, currentPostId) => {
    try {
      const postsRef = collection(db, 'blogPosts');
      const q = query(
        postsRef,
        where('category', '==', category),
        where('status', '==', 'published')
      );
      
      const querySnapshot = await getDocs(q);
      const related = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(post => post.id !== currentPostId)
        .slice(0, 3);
      
      setRelatedPosts(related);
    } catch (err) {
      console.error("Error fetching related posts:", err);
    }
  };

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
    h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
    h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
    h4: ({node, ...props}) => <h4 className="markdown-h4" {...props} />,
    h5: ({node, ...props}) => <h5 className="markdown-h5" {...props} />,
    h6: ({node, ...props}) => <h6 className="markdown-h6" {...props} />,
    p: ({node, ...props}) => <p className="markdown-p" {...props} />,
    blockquote: ({node, ...props}) => <blockquote className="markdown-blockquote" {...props} />,
    ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
    ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
    li: ({node, ...props}) => <li className="markdown-li" {...props} />,
    strong: ({node, ...props}) => <strong className="markdown-strong" {...props} />,
    em: ({node, ...props}) => <em className="markdown-em" {...props} />,
    code: ({node, inline, ...props}) => 
      inline ? 
        <code className="markdown-code-inline" {...props} /> : 
        <code className="markdown-code-block" {...props} />,
    pre: ({node, ...props}) => <pre className="markdown-pre" {...props} />,
    a: ({node, ...props}) => <a className="markdown-a" target="_blank" rel="noopener noreferrer" {...props} />,
    img: ({node, ...props}) => <img className="markdown-img" loading="lazy" {...props} />,
  };

  if (loading) {
    return (
      <div className="blog-post-loading">
        <div className="container">
          <div className="loading-state">
            <div className="golden-loader">
              <div className="loader-spinner"></div>
              <div className="loader-content">
                <h3>Loading Article</h3>
                <p>Preparing an amazing read for you...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-post-error">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <div className="error-actions">
              <Link to="/blog" className="btn btn--primary">
                <i className="fas fa-arrow-left"></i>
                Back to Blog
              </Link>
              <button 
                className="btn btn--secondary"
                onClick={() => window.location.reload()}
              >
                <i className="fas fa-redo"></i>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="blog-post-page">
      {/* Navigation */}
      <nav className="blog-post-nav">
        <div className="container">
          <Link to="/blog" className="back-to-blog">
            <i className="fas fa-arrow-left"></i>
            Back to All Posts
          </Link>
          <div className="nav-actions">
            <button 
              className={`like-btn ${isLiked ? 'liked' : ''} ${likeLoading ? 'loading' : ''}`}
              onClick={handleLike}
              disabled={likeLoading}
            >
              <i className={`fas fa-heart ${isLiked ? 'solid' : 'regular'}`}></i>
              {likes} {likes === 1 ? 'Like' : 'Likes'}
            </button>
            <button className="share-btn" onClick={handleShare}>
              <i className="fas fa-share-alt"></i>
              Share
            </button>
          </div>
        </div>
      </nav>

      {/* Article */}
      <article className="blog-post-article">
        <div className="container">
          <header className="article-header">
            {post.category && (
              <span className="article-category">{post.category}</span>
            )}
            <h1 className="article-title">{post.title}</h1>
            
            <div className="article-meta">
              <div className="author-info">
                <div className="author-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="author-details">
                  <span className="author-name">By {post.author}</span>
                  <span className="publish-date">{formatDate(post.createdAt)}</span>
                </div>
              </div>
              
              <div className="article-stats">
                <span className="stat">
                  <i className="fas fa-clock"></i>
                  {getReadTime(post)}
                </span>
                <span className="stat">
                  <i className="fas fa-eye"></i>
                  {views + 1} views
                </span>
                <span className="stat">
                  <i className="fas fa-heart"></i>
                  {likes} likes
                </span>
              </div>
            </div>
          </header>

          {/* Feature Image */}
          <div className="article-feature-image">
            <img 
              src={post.featureImage} 
              alt={post.title} 
              loading="eager"
              onError={(e) => {
                e.target.src = '/images/placeholder-blog.jpg';
              }}
            />
          </div>

          {/* Article Content */}
          <div className="article-content">
            <div className="content-wrapper">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {post.content}
              </ReactMarkdown>
              
              {/* Content Images Gallery */}
              {post.contentImages && post.contentImages.length > 0 && (
                <div className="content-gallery">
                  <h3>Gallery</h3>
                  <div className="gallery-grid">
                    {post.contentImages.map((image, index) => (
                      <figure key={index} className="gallery-item">
                        <img 
                          src={image.url} 
                          alt={image.alt || `Gallery image ${index + 1}`}
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = '/images/placeholder-blog.jpg';
                          }}
                        />
                        {image.caption && (
                          <figcaption className="image-caption">
                            {image.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Article Footer */}
            <footer className="article-footer">
              <div className="interaction-section">
                <button 
                  className={`like-btn-large ${isLiked ? 'liked' : ''} ${likeLoading ? 'loading' : ''}`}
                  onClick={handleLike}
                  disabled={likeLoading}
                >
                  <i className={`fas fa-heart ${isLiked ? 'solid' : 'regular'}`}></i>
                  {isLiked ? 'Liked' : 'Like this post'} ({likes})
                </button>
              </div>

              <div className="tags-section">
                {post.tags && post.tags.length > 0 && (
                  <>
                    <h4>Tags:</h4>
                    <div className="tags-list">
                      {post.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="share-section">
                <h4>Share this article:</h4>
                <div className="share-buttons">
                  <button 
                    className="share-btn facebook"
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <i className="fab fa-facebook-f"></i>
                  </button>
                  <button 
                    className="share-btn twitter"
                    onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
                  >
                    <i className="fab fa-twitter"></i>
                  </button>
                  <button 
                    className="share-btn linkedin"
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  >
                    <i className="fab fa-linkedin-in"></i>
                  </button>
                  <button 
                    className="share-btn copy-link"
                    onClick={handleShare}
                  >
                    <i className="fas fa-link"></i>
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="related-posts">
          <div className="container">
            <div className="section-header">
              <h2>You Might Also Like</h2>
              <p>More articles on {post.category}</p>
            </div>
            <div className="related-posts-grid">
              {relatedPosts.map(relatedPost => (
                <Link 
                  key={relatedPost.id} 
                  to={`/blog/${relatedPost.slug}`} 
                  className="related-post-card"
                >
                  <div className="related-post-image">
                    <img 
                      src={relatedPost.featureImage} 
                      alt={relatedPost.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholder-blog.jpg';
                      }}
                    />
                  </div>
                  <div className="related-post-content">
                    <h3>{relatedPost.title}</h3>
                    <p>{relatedPost.excerpt}</p>
                    <div className="related-post-meta">
                      <span>{formatDate(relatedPost.createdAt)}</span>
                      <span>•</span>
                      <span>{getReadTime(relatedPost)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BlogPostPage;