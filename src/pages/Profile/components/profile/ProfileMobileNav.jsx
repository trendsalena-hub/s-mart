import React, { forwardRef } from 'react';
import './ProfileMobileNav.scss';
const ProfileMobileNav = forwardRef(({ 
  isOpen, 
  onClose, 
  activeTab, 
  onTabChange, 
  ordersCount = 0, 
  wishlistCount = 0, 
  couponsCount = 0, 
  isAdmin = false, 
  onNavigate 
}, ref) => {
  const mobileNavItems = [
    { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
    { key: 'orders', icon: 'fas fa-shopping-bag', label: 'Orders', badge: ordersCount },
    { key: 'wishlist', icon: 'fas fa-heart', label: 'Wishlist', badge: wishlistCount },
    { key: 'coupons', icon: 'fas fa-ticket-alt', label: 'Coupons' },
    { key: 'help', icon: 'fas fa-question-circle', label: 'Help' },
  ];

  if (!isOpen) return null;

  return (
    <div className="profile-mobile-overlay" onClick={onClose}>
      <div 
        className="profile-mobile-sidebar"
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-mobile-sidebar__header">
          <h3>Menu</h3>
          <button 
            className="profile-mobile-sidebar__close"
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="profile-mobile-sidebar__nav">
          {mobileNavItems.map((item) => (
            <button
              key={item.key}
              className={`profile-mobile-sidebar__item ${activeTab === item.key ? 'profile-mobile-sidebar__item--active' : ''}`}
              onClick={() => onTabChange(item.key)}
            >
              <div className="profile-mobile-sidebar__icon">
                <i className={item.icon}></i>
              </div>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="profile-mobile-sidebar__badge">{item.badge}</span>
              )}
            </button>
          ))}
          {isAdmin && (
            <button
              className="profile-mobile-sidebar__item profile-mobile-sidebar__item--admin"
              onClick={() => onNavigate('/admin')}
            >
              <div className="profile-mobile-sidebar__icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <span>Admin Panel</span>
            </button>
          )}
        </nav>
      </div>
    </div>
  );
});

// Bottom Navigation Component
const BottomNav = ({ activeTab, onTabChange, ordersCount = 0, wishlistCount = 0 }) => {
  const bottomNavItems = [
    { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
    { key: 'orders', icon: 'fas fa-shopping-bag', label: 'Orders', badge: ordersCount },
    { key: 'wishlist', icon: 'fas fa-heart', label: 'Wishlist', badge: wishlistCount },
    { key: 'coupons', icon: 'fas fa-ticket-alt', label: 'Coupons' },
    { key: 'help', icon: 'fas fa-question-circle', label: 'Help' },
  ];

  return (
    <nav className="profile-bottom-nav">
      {bottomNavItems.map((item) => (
        <button
          key={item.key}
          className={`profile-bottom-nav__item ${activeTab === item.key ? 'profile-bottom-nav__item--active' : ''}`}
          onClick={() => onTabChange(item.key)}
        >
          <div className="profile-bottom-nav__icon">
            <i className={item.icon}></i>
          </div>
          <span className="profile-bottom-nav__label">{item.label}</span>
          {item.badge > 0 && (
            <span className="profile-bottom-nav__badge">{item.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
};

ProfileMobileNav.BottomNav = BottomNav;
export default ProfileMobileNav;