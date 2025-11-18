import React, { useState, useEffect, useRef } from 'react';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useCart } from '../../components/context/CartContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.scss';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbBanners, setDbBanners] = useState([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedSlides, setLoadedSlides] = useState({});
  const sliderInterval = useRef(null);
  const videoRefs = useRef([]);

  const defaultBanners = [
    { 
      type: 'image', 
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
      duration: 5000,
      placeholder: 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
      title: 'Premium Collection',
      subtitle: 'Discover our exclusive range of products'
    },
    { 
      type: 'image', 
      url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=400&fit=crop',
      duration: 5000,
      placeholder: 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
      title: 'Summer Sale',
      subtitle: 'Up to 50% off on selected items'
    },
    { 
      type: 'image', 
      url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=400&fit=crop',
      duration: 5000,
      placeholder: 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
      title: 'New Arrivals',
      subtitle: 'Fresh styles just for you'
    }
  ];

  const banners = dbBanners.length > 0 ? dbBanners : defaultBanners;

  const loadBannersFromFirebase = async () => {
    try {
      const bannerDoc = await getDoc(doc(db, 'settings', 'banner'));
      if (bannerDoc.exists()) {
        const data = bannerDoc.data();
        if (data.banners && data.banners.length > 0) {
          setDbBanners(data.banners.map(b => ({ 
            ...b, 
            type: b.type || 'image',
            duration: b.duration || 5000,
            placeholder: b.placeholder || 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)'
          })));
          return;
        }
      }
      setDbBanners([]);
    } catch {
      setDbBanners([]);
    }
  };

  const loadProductsFromFirebase = async () => {
    setLoading(true);
    setError('');
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.seconds ? doc.data().createdAt.seconds * 1000 : doc.data().createdAt) : new Date(0)
      }));
      
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      await preloadProductImages(productsData);
      setProducts(productsData);
    } catch (err) {
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const preloadProductImages = (products) => {
    const promises = products.map(product => {
      return new Promise((resolve) => {
        if (product.image) {
          const img = new Image();
          img.src = product.image;
          img.onload = resolve;
          img.onerror = resolve;
        } else {
          resolve();
        }
      });
    });
    return Promise.all(promises);
  };

  const preloadBannerImages = (bannerArray) => {
    bannerArray.forEach((banner, index) => {
      if (banner.type === 'image') {
        const img = new Image();
        img.src = banner.url;
        img.onload = () => {
          setLoadedSlides(prev => ({ ...prev, [index]: true }));
        };
        img.onerror = () => {
          setLoadedSlides(prev => ({ ...prev, [index]: true }));
        };
      }
    });
  };

  const goToSlide = (index) => {
    if (index === currentSlide || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 500);
  };

  const handleVideoEnd = () => {
    goToSlide((currentSlide + 1) % banners.length);
  };

  // Preload banner images on component mount
  useEffect(() => {
    if (banners.length > 0) {
      preloadBannerImages(banners);
    }
  }, [banners]);

  // Handle video playback
  useEffect(() => {
    if (banners[currentSlide]?.type === "video" && videoRefs.current[currentSlide]) {
      try {
        const video = videoRefs.current[currentSlide];
        video.currentTime = 0;
        video.play().catch(e => console.log('Video play failed:', e));
      } catch (e) {
        console.log('Video error:', e);
      }
    }
  }, [currentSlide, banners]);

  // Handle video end event
  useEffect(() => {
    const currentVideoRef = videoRefs.current[currentSlide];
    if (banners[currentSlide]?.type === 'video' && currentVideoRef) {
      currentVideoRef.addEventListener('ended', handleVideoEnd);
      return () => {
        currentVideoRef.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [currentSlide, banners]);

  useEffect(() => {
    setIsVisible(true);
    loadProductsFromFirebase();
    loadBannersFromFirebase();
  }, []);

  useEffect(() => {
    clearInterval(sliderInterval.current);

    if (banners.length <= 1) return;

    const currentBanner = banners[currentSlide];

    if (currentBanner && currentBanner.type === 'image') {
      sliderInterval.current = setInterval(() => {
        goToSlide((currentSlide + 1) % banners.length);
      }, currentBanner.duration || 5000);
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [banners, currentSlide]);

  const now = Date.now();
  const newArrivals = products.filter(p =>
    p.createdAt && (now - new Date(p.createdAt).getTime()) < MS_PER_WEEK
  );
  
  const collections = products.filter(p =>
    !(p.createdAt && (now - new Date(p.createdAt).getTime()) < MS_PER_WEEK)
  );

  const showAddToCartNotification = (productTitle) => {
    setNotificationMessage(`${productTitle} added to cart!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showAddToCartNotification(product.title);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % banners.length);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + banners.length) % banners.length);
  };

  return (
    <div className="main-home">
      <div className={`home ${isVisible ? 'visible' : ''}`}>
        
        {/* Enhanced Notification */}
        {showNotification && (
          <div className="cart-notification show">
            <div className="notification-content">
              <div className="notification-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="notification-text">
                <span className="notification-title">Success!</span>
                <span className="notification-message">{notificationMessage}</span>
              </div>
              <button 
                className="notification-close"
                onClick={() => setShowNotification(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-notification show">
            <div className="notification-content">
              <div className="notification-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className="notification-text">
                <span className="notification-title">Oops!</span>
                <span className="notification-message">{error}</span>
              </div>
              <button 
                className="notification-close"
                onClick={() => setError('')}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}

        {/* Hero Section with Reduced Height */}
        <section className="hero">
          <div className="hero__slider-container">
            <div className="hero__slider">
              {banners.map((slide, idx) => (
                <div
                  key={idx}
                  className={`hero__slide ${idx === currentSlide ? 'hero__slide--active' : ''} ${
                    isTransitioning ? 'hero__slide--transitioning' : ''
                  }`}
                >
                  {slide.type === 'video' ? (
                    <video
                      ref={el => videoRefs.current[idx] = el}
                      src={slide.url}
                      autoPlay
                      muted
                      loop={false}
                      playsInline
                      className="hero__slide-video"
                      preload="metadata"
                    />
                  ) : (
                    <div className="hero__slide-image-container">
                      {!loadedSlides[idx] && (
                        <div 
                          className="hero__slide-placeholder"
                          style={{ background: slide.placeholder }}
                        />
                      )}
                      <div
                        className={`hero__slide-image ${loadedSlides[idx] ? 'hero__slide-image--loaded' : ''}`}
                        style={{ backgroundImage: `url(${slide.url})` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Slider Indicators */}
            {banners.length > 1 && (
              <div className="hero__slider-indicators">
                {banners.map((slide, idx) => (
                  <button
                    key={idx}
                    className={`hero__slider-indicator ${idx === currentSlide ? 'hero__slider-indicator--active' : ''}`}
                    onClick={() => goToSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                  >
                    <div className="indicator-progress">
                      {idx === currentSlide && slide.type === 'image' && (
                        <div 
                          className="progress-fill" 
                          style={{ 
                            animationDuration: `${slide.duration || 5000}ms` 
                          }}
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            {banners.length > 1 && (
              <>
                <button 
                  className="hero__nav-btn hero__nav-btn--prev"
                  onClick={prevSlide}
                  aria-label="Previous slide"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button 
                  className="hero__nav-btn hero__nav-btn--next"
                  onClick={nextSlide}
                  aria-label="Next slide"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Enhanced Loader */}
        {loading && (
          <section className="section">
            <div className="container">
              <div className="loading-state">
                <div className="golden-loader">
                  <div className="loader-spinner"></div>
                  <div className="loader-content">
                    <h3>Discovering Amazing Products</h3>
                    <p>We're curating the best collection just for you...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Products Section */}
        {!loading && (
          <>
            {newArrivals.length > 0 && (
              <section className="section section--premium">
                <div className="container">
                  <div className="section__header">
                    <div className="section__badge">New This Week</div>
                    <h2 className="section__title">New Arrivals</h2>
                    <p className="section__subtitle">
                      Fresh styles just landed in our collection
                    </p>
                    <div className="section__decorative">
                      <div className="decorative-line"></div>
                      <div className="decorative-dot"></div>
                      <div className="decorative-line"></div>
                    </div>
                  </div>
                  <div className="product-grid">
                    {newArrivals.map((product, index) => (
                      <div 
                        key={product.id} 
                        className="product-card-wrapper"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <ProductCard
                          id={product.id}
                          image={product.image}
                          images={product.images}
                          title={product.title}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          discount={product.discount}
                          badge={product.badge || 'New'}
                          category={product.category}
                          stock={product.stock}
                          material={product.material}
                          brand={product.brand}
                          offer={product.offer}
                          onAddToCart={() => handleAddToCart(product)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {collections.length > 0 && (
              <section className="section section--elegant">
                <div className="container">
                  <div className="section__header">
                    <div className="section__badge">Curated Selection</div>
                    <h2 className="section__title">Our Collection</h2>
                    <p className="section__subtitle">
                      Explore our complete range of premium fashion
                    </p>
                    <div className="section__decorative">
                      <div className="decorative-line"></div>
                      <div className="decorative-dot"></div>
                      <div className="decorative-line"></div>
                    </div>
                  </div>
                  <div className="product-grid">
                    {collections.map((product, index) => (
                      <div 
                        key={product.id} 
                        className="product-card-wrapper"
                        style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                      >
                        <ProductCard
                          id={product.id}
                          image={product.image}
                          images={product.images}
                          title={product.title}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          discount={product.discount}
                          badge={product.badge}
                          category={product.category}
                          stock={product.stock}
                          material={product.material}
                          brand={product.brand}
                          offer={product.offer}
                          onAddToCart={() => handleAddToCart(product)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {collections.length > 8 && (
                    <div className="section__footer">
                      <button className="view-more-btn">
                        View All Collection
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <section className="section section--premium">
            <div className="container">
              <div className="empty-state">
                <div className="empty-state__icon">
                  <i className="fas fa-box-open"></i>
                </div>
                <h3>No Products Available</h3>
                <p>We're working on bringing you amazing products. Check back soon!</p>
                <button className="retry-btn" onClick={loadProductsFromFirebase}>
                  <i className="fas fa-redo"></i>
                  Try Again
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;