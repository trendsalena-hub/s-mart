import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { auth, db } from '../../firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import logo from '../../assets/Alena-trends.png';
import './Header.scss';

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState(null);
  const [bannerText, setBannerText] = useState('Get 10% off and Free Delivery on all orders');
  const [showBanner, setShowBanner] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const headerRef = useRef(null);
  
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Debounced search function
  const performSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const results = allProducts.filter(product => {
      const titleMatch = product.title?.toLowerCase().includes(lowerQuery);
      const categoryMatch = product.category?.toLowerCase().includes(lowerQuery);
      const brandMatch = product.brand?.toLowerCase().includes(lowerQuery);
      const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      const materialMatch = product.material?.toLowerCase().includes(lowerQuery);
      
      return titleMatch || categoryMatch || brandMatch || tagsMatch || materialMatch;
    });

    setSearchResults(results.slice(0, 8)); // Limit to 8 results for better performance
  }, [allProducts]);

  // Optimized scroll handler with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Hide header when scrolling down, show when scrolling up
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
            setIsVisible(true);
          }

          // Add scrolled class for background
          if (currentScrollY > 20) {
            setIsScrolled(true);
          } else {
            setIsScrolled(false);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load banner settings
  useEffect(() => {
    const loadBannerSettings = async () => {
      try {
        const bannerDoc = await getDoc(doc(db, 'settings', 'banner'));
        if (bannerDoc.exists()) {
          const data = bannerDoc.data();
          setBannerText(data.text || 'Get 10% off and Free Delivery on all orders');
          setShowBanner(data.enabled !== false);
        }
      } catch (err) {
        console.error('Error loading banner settings:', err);
      }
    };
    loadBannerSettings();
  }, []);

  // Load products for search with error handling
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  // Optimized search with debouncing
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout with debounce
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
      setIsSearching(false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Focus management for search
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleSearch = useCallback(() => {
    setIsSearchOpen(prev => !prev);
    if (!isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/quick-view`, { 
      state: { productId } 
    });
    setIsSearchOpen(false);
  };

  const handleProfileClick = () => {
    navigate(user ? '/profile' : '/login');
  };

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Keyboard navigation for search
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearch();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header 
        ref={headerRef}
        className={`header ${isScrolled ? 'header--scrolled' : ''} ${!isVisible ? 'header--hidden' : ''}`}
        onKeyDown={handleKeyDown}
      >
        {/* Top Banner */}
        {showBanner && (
          <div className="header__banner">
            <div className="header__banner-content">
              <span>{bannerText}</span>
              <span>{bannerText}</span>
              <span>{bannerText}</span>
              <span>{bannerText}</span>
              <span>{bannerText}</span>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="header__main">
          <div className="container">
            <div className="header__content">

              {/* Logo */}
              <div className="header__logo">
                <Link to="/" aria-label="Alena Trends Home">
                  <img src={logo} alt="Alena Trends" className="header__logo-img" />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="header__nav header__nav--desktop" aria-label="Main navigation">
                <ul className="header__nav-list">
                  <li>
                    <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/collections" className={({ isActive }) => isActive ? 'active' : ''}>
                      Collections
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/blog" className={({ isActive }) => isActive ? 'active' : ''}>
                      Blogs
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                      About Us
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>
                      Contact
                    </NavLink>
                  </li>
                </ul>
              </nav>

              {/* Desktop Actions */}
              <div className="header__actions">
                <button 
                  className={`header__action-btn ${isSearchOpen ? 'header__action-btn--active' : ''}`}
                  onClick={toggleSearch}
                  aria-label="Search"
                >
                  <i className="fas fa-search"></i>
                </button>
                <Link to="/cart" className="header__action-btn header__cart" aria-label="Cart">
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && (
                    <span className="header__cart-count">{cartCount > 99 ? '99+' : cartCount}</span>
                  )}
                </Link>
                <button 
                  className={`header__action-btn header__profile-btn ${user ? 'header__profile-btn--active' : ''}`}
                  onClick={handleProfileClick}
                  aria-label={user ? 'My Profile' : 'Login'}
                >
                  {user ? (
                    <>
                      <i className="fas fa-user-circle"></i>
                      <span className="header__online-indicator"></span>
                    </>
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            <div className={`header__mobile-nav ${isMobileMenuOpen ? 'header__mobile-nav--open' : ''}`}>
              <nav aria-label="Mobile navigation">
                <ul>
                  <li>
                    <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>
                      <i className="fas fa-home"></i>
                      Home
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/collections" onClick={() => setIsMobileMenuOpen(false)}>
                      <i className="fas fa-th-large"></i>
                      Collections
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/blog" onClick={() => setIsMobileMenuOpen(false)}>
                      <i className="fas fa-file-alt"></i>
                      Blogs
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/about" onClick={() => setIsMobileMenuOpen(false)}>
                      <i className="fas fa-info-circle"></i>
                      About Us
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                      <i className="fas fa-envelope"></i>
                      Contact
                    </NavLink>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
              <div className="header__search">
                <form onSubmit={handleSearchSubmit} className="header__search-form">
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search for products, brands, categories..." 
                    className="header__search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  <button 
                    type="submit"
                    className="header__search-btn"
                    disabled={!searchQuery.trim()}
                    aria-label="Search"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  <button 
                    type="button"
                    className="header__search-close"
                    onClick={closeSearch}
                    aria-label="Close search"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </form>

                {/* Search Results Dropdown */}
                {searchQuery && (
                  <div className="header__search-results">
                    {isSearching ? (
                      <div className="header__search-loading">
                        <div className="header__search-spinner"></div>
                        <span>Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="header__search-results-list">
                          {searchResults.map((product) => (
                            <div
                              key={product.id}
                              className="header__search-result-item"
                              onClick={() => handleProductClick(product.id)}
                              role="button"
                              tabIndex={0}
                              onKeyPress={(e) => e.key === 'Enter' && handleProductClick(product.id)}
                            >
                              <div className="header__search-result-image">
                                <img 
                                  src={product.images?.[0] || product.image} 
                                  alt={product.title}
                                  loading="lazy"
                                />
                              </div>
                              <div className="header__search-result-info">
                                <h4>{product.title}</h4>
                                <p className="header__search-result-category">
                                  {product.category} {product.brand && `• ${product.brand}`}
                                </p>
                                <div className="header__search-result-price">
                                  <span className="price">₹{product.price?.toLocaleString()}</span>
                                  {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="original-price">₹{product.originalPrice?.toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                              <i className="fas fa-chevron-right"></i>
                            </div>
                          ))}
                        </div>
                        <div className="header__search-results-footer">
                          <button
                            onClick={() => {
                              navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                              closeSearch();
                            }}
                            className="header__search-view-all"
                          >
                            View all {searchResults.length} results
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="header__search-empty">
                        <i className="fas fa-search"></i>
                        <p>No products found for "{searchQuery}"</p>
                        <span>Try different keywords or browse categories</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="header__search-overlay" onClick={closeSearch}></div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Bottom navigation">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
          }
          aria-label="Home"
        >
          <i className="fas fa-home"></i>
          <span>Home</span>
        </NavLink>
        
        <NavLink 
          to="/collections" 
          className={({ isActive }) => 
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
          }
          aria-label="Collections"
        >
          <i className="fas fa-th-large"></i>
          <span>Collections</span>
        </NavLink>
        
        <NavLink 
          to="/blog" 
          className={({ isActive }) => 
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
          }
          aria-label="Blog"
        >
          <i className="fas fa-file-alt"></i>
          <span>Blog</span>
        </NavLink>

        <NavLink 
          to="/cart" 
          className={({ isActive }) => 
            `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`
          }
          aria-label="Cart"
        >
          <div className="mobile-nav__cart-wrapper">
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && (
              <span className="mobile-nav__cart-badge">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span>Cart</span>
        </NavLink>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="header__mobile-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Header;