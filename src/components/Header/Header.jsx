import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth, db } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
  
  const { getCartItemsCount } = useCart();
  const cartCount = getCartItemsCount();
  const navigate = useNavigate();
  const location = useLocation();

  // Listen to authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Load banner settings from Firebase
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

  // Load all products for search
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

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    
    const results = allProducts.filter(product => {
      const titleMatch = product.title?.toLowerCase().includes(lowerQuery);
      const categoryMatch = product.category?.toLowerCase().includes(lowerQuery);
      const brandMatch = product.brand?.toLowerCase().includes(lowerQuery);
      const tagsMatch = product.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
      const materialMatch = product.material?.toLowerCase().includes(lowerQuery);
      
      return titleMatch || categoryMatch || brandMatch || tagsMatch || materialMatch;
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setIsSearching(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      toggleSearch();
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/quick-view`, { 
      state: { productId } 
    });
    toggleSearch();
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'header--scrolled' : ''} ${!isVisible ? 'header--hidden' : ''}`}>
        {/* Top Banner - Dynamic from Firebase */}
        {showBanner && (
          <div className="header__banner">
            <div className="header__banner-content">
              <span>
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {bannerText}
              </span>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="header__main">
          <div className="container">
            <div className="header__content">
              {/* Logo */}
              <div className="header__logo">
                <Link to="/">
                  <img src={logo} alt="Alena Trends" className="header__logo-img" />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="header__nav header__nav--desktop">
                <ul className="header__nav-list">
                  <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
                  <li><Link to="/collections" className={isActive('/collections') ? 'active' : ''}>Collections</Link></li>
                  <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>About Us</Link></li>
                  <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link></li>
                </ul>
              </nav>

              {/* Desktop Actions */}
              <div className="header__actions">
                <button 
                  className="header__action-btn"
                  onClick={toggleSearch}
                  aria-label="Search"
                >
                  <i className="fas fa-search"></i>
                </button>
                <Link to="/cart" className="header__action-btn header__cart" aria-label="Cart">
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && (
                    <span className="header__cart-count">{cartCount}</span>
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

            {/* Search Bar */}
            {isSearchOpen && (
              <div className="header__search">
                <form onSubmit={handleSearchSubmit} className="header__search-form">
                  <input 
                    type="text" 
                    placeholder="Search for products..." 
                    className="header__search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="header__search-btn"
                    disabled={!searchQuery.trim()}
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  <button 
                    type="button"
                    className="header__search-close"
                    onClick={toggleSearch}
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
                        <i className="fas fa-spinner fa-spin"></i>
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
                            >
                              <div className="header__search-result-image">
                                <img 
                                  src={product.images?.[0] || product.image} 
                                  alt={product.title}
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
                              toggleSearch();
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
                        <span>Try different keywords</span>
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
        <div className="header__search-overlay" onClick={toggleSearch}></div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <Link 
          to="/" 
          className={`mobile-nav__item ${isActive('/') ? 'mobile-nav__item--active' : ''}`}
          aria-label="Home"
        >
          <i className="fas fa-home"></i>
          <span>Home</span>
        </Link>
        
        <Link 
          to="/collections" 
          className={`mobile-nav__item ${isActive('/collections') ? 'mobile-nav__item--active' : ''}`}
          aria-label="Collections"
        >
          <i className="fas fa-th-large"></i>
          <span>Collections</span>
        </Link>
        
        <Link 
          to="/about" 
          className={`mobile-nav__item ${isActive('/about') ? 'mobile-nav__item--active' : ''}`}
          aria-label="About"
        >
          <i className="fas fa-info-circle"></i>
          <span>About</span>
        </Link>

        <Link 
          to="/contact" 
          className={`mobile-nav__item ${isActive('/contact') ? 'mobile-nav__item--active' : ''}`}
          aria-label="Contact"
        >
          <i className="fas fa-envelope"></i>
          <span>Contact</span>
        </Link>
      </nav>
    </>
  );
};

export default Header;
