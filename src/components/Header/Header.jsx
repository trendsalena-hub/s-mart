import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth, db } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../../assets/Alena-trends.png';
import './Header.scss';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [user, setUser] = useState(null);
  const [bannerText, setBannerText] = useState('Get 10% off and Free Delivery on all orders');
  const [showBanner, setShowBanner] = useState(true);
  
  const { getCartItemsCount } = useCart();
  const cartCount = getCartItemsCount();
  const navigate = useNavigate();

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
          setShowBanner(data.enabled !== false); // Default to true if not set
        }
      } catch (err) {
        console.error('Error loading banner settings:', err);
      }
    };

    loadBannerSettings();

    // Optional: Set up real-time listener
    // const unsubscribe = onSnapshot(doc(db, 'settings', 'banner'), (doc) => {
    //   if (doc.exists()) {
    //     const data = doc.data();
    //     setBannerText(data.text || 'Get 10% off and Free Delivery on all orders');
    //     setShowBanner(data.enabled !== false);
    //   }
    // });
    // return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide header based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Add scrolled class when page is scrolled
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
    closeMobileMenu();
  };

  return (
    <div className="main-header">
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
              {/* Mobile Menu Toggle */}
              <button 
                className="header__mobile-toggle"
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

              {/* Logo */}
              <div className="header__logo">
                <Link to="/" onClick={closeMobileMenu}>
                  <img src={logo} alt="Alena Trends" className="header__logo-img" />
                </Link>
              </div>

              {/* Navigation */}
              <nav className={`header__nav ${isMobileMenuOpen ? 'header__nav--open' : ''}`}>
                <ul className="header__nav-list">
                  <li><Link to="/" onClick={closeMobileMenu}>Home</Link></li>
                  <li><Link to="/collections" onClick={closeMobileMenu}>Collections</Link></li>
                  <li><Link to="/new-arrivals" onClick={closeMobileMenu}>New Arrivals</Link></li>
                  <li><Link to="/sale" onClick={closeMobileMenu}>Sale</Link></li>
                  <li><Link to="/about" onClick={closeMobileMenu}>About Us</Link></li>
                  <li><Link to="/contact" onClick={closeMobileMenu}>Contact</Link></li>
                </ul>

                {/* Mobile Actions */}
                <div className="header__mobile-actions">
                  <button 
                    className="header__action-btn"
                    onClick={() => {
                      toggleSearch();
                      closeMobileMenu();
                    }}
                    aria-label="Search"
                  >
                    <i className="fas fa-search"></i>
                    Search
                  </button>
                  <button 
                    className={`header__action-btn ${user ? 'header__action-btn--active' : ''}`}
                    onClick={handleProfileClick}
                    aria-label={user ? 'My Profile' : 'Login'}
                  >
                    {user ? (
                      <>
                        <i className="fas fa-user-circle"></i>
                        <span className="header__profile-name">
                          {user.displayName || 'Profile'}
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user"></i>
                        Login
                      </>
                    )}
                  </button>
                  <Link to="/cart" className="header__action-btn header__cart" aria-label="Cart">
                    <i className="fas fa-shopping-cart"></i>
                    Cart
                    {cartCount > 0 && (
                      <span className="header__cart-count">{cartCount}</span>
                    )}
                  </Link>
                </div>
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
                <button 
                  className={`header__action-btn header__profile-btn ${user ? 'header__profile-btn--active' : ''}`}
                  onClick={handleProfileClick}
                  aria-label={user ? 'My Profile' : 'Login'}
                >
                  {user ? (
                    <>
                      <i className="fas fa-user-circle"></i>
                      {user && <span className="header__online-indicator"></span>}
                    </>
                  ) : (
                    <i className="fas fa-user"></i>
                  )}
                </button>
                <Link to="/cart" className="header__action-btn header__cart" aria-label="Cart">
                  <i className="fas fa-shopping-cart"></i>
                  {cartCount > 0 && (
                    <span className="header__cart-count">{cartCount}</span>
                  )}
                </Link>
              </div>
            </div>

            {/* Search Bar */}
            {isSearchOpen && (
              <div className="header__search">
                <input 
                  type="text" 
                  placeholder="Search for products..." 
                  className="header__search-input"
                  autoFocus
                />
                <button className="header__search-btn">
                  <i className="fas fa-search"></i>
                </button>
                <button 
                  className="header__search-close"
                  onClick={toggleSearch}
                  aria-label="Close search"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="header__overlay" onClick={closeMobileMenu}></div>
        )}
      </header>
    </div>
  );
};

export default Header;
