import React, { useState, useEffect } from 'react';
import './ProfileSidebar.scss';

const ProfileSidebar = ({ 
  activeTab, 
  onTabChange, 
  ordersCount = 0, 
  wishlistCount = 0, 
  couponsCount = 0, 
  isAdmin = false, 
  onNavigate 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    { 
      key: 'profile', 
      icon: 'fas fa-user', 
      label: 'My Profile',
      description: 'Manage your personal information'
    },
    { 
      key: 'orders', 
      icon: 'fas fa-shopping-bag', 
      label: 'My Orders', 
      badge: ordersCount,
      description: 'Track your purchases'
    },
    { 
      key: 'wishlist', 
      icon: 'fas fa-heart', 
      label: 'Wishlist', 
      badge: wishlistCount,
      description: 'Your saved items'
    },
    { 
      key: 'coupons', 
      icon: 'fas fa-ticket-alt', 
      label: 'Coupons', 
      badge: couponsCount,
      description: 'Discounts & offers'
    },
    { 
      key: 'help', 
      icon: 'fas fa-question-circle', 
      label: 'Help Centre',
      description: 'Get support'
    },
  ];

  const handleNavClick = (key) => {
    onTabChange(key);
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  const handleAdminClick = () => {
    onNavigate('/admin');
    if (isMobile) {
      setIsCollapsed(true);
    }
  };

  // ✅ MOBILE SIDEBAR (Drawer)
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {!isCollapsed && (
          <div 
            className="profile-sidebar__overlay"
            onClick={() => setIsCollapsed(true)}
            role="presentation"
          />
        )}

        {/* Mobile Sidebar Drawer */}
        <aside className={`profile-sidebar profile-sidebar--mobile ${isCollapsed ? 'profile-sidebar--closed' : 'profile-sidebar--open'}`}>

          {/* Navigation */}
          <nav className="profile-sidebar__nav">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`profile-sidebar__item ${activeTab === item.key ? 'profile-sidebar__item--active' : ''}`}
                onClick={() => handleNavClick(item.key)}
              >
                <div className="profile-sidebar__item-main">
                  <div className="profile-sidebar__icon">
                    <i className={item.icon}></i>
                    {item.badge > 0 && (
                      <span className={`profile-sidebar__badge ${item.key === 'coupons' ? 'profile-sidebar__badge--gold' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  <div className="profile-sidebar__content">
                    <span className="profile-sidebar__label">{item.label}</span>
                    <span className="profile-sidebar__description">{item.description}</span>
                  </div>
                </div>

                {/* Active indicator */}
                {activeTab === item.key && (
                  <div className="profile-sidebar__active-indicator"></div>
                )}
              </button>
            ))}

            {/* Admin Panel Button */}
            {isAdmin && (
              <button
                className="profile-sidebar__item profile-sidebar__item--admin"
                onClick={handleAdminClick}
              >
                <div className="profile-sidebar__item-main">
                  <div className="profile-sidebar__icon">
                    <i className="fas fa-shield-alt"></i>
                    <div className="profile-sidebar__admin-dot"></div>
                  </div>
                  
                  <div className="profile-sidebar__content">
                    <span className="profile-sidebar__label">Admin Panel</span>
                    <span className="profile-sidebar__description">Manage store</span>
                  </div>
                </div>

                <div className="profile-sidebar__admin-indicator">
                  <i className="fas fa-crown"></i>
                </div>
              </button>
            )}
          </nav>

          {/* Footer */}
          <div className="profile-sidebar__footer">
            <div className="profile-sidebar__stats">
              <div className="profile-sidebar__stat">
                <span className="profile-sidebar__stat-number">{ordersCount}</span>
                <span className="profile-sidebar__stat-label">Orders</span>
              </div>
              <div className="profile-sidebar__stat">
                <span className="profile-sidebar__stat-number">{wishlistCount}</span>
                <span className="profile-sidebar__stat-label">Wishlist</span>
              </div>
              <div className="profile-sidebar__stat">
                <span className="profile-sidebar__stat-number">{couponsCount}</span>
                <span className="profile-sidebar__stat-label">Coupons</span>
              </div>
            </div>
            
            <button className="profile-sidebar__help-btn">
              <i className="fas fa-headset"></i>
              <span>Need Help?</span>
            </button>
          </div>
        </aside>
      </>
    );
  }

  // ✅ DESKTOP SIDEBAR
  return (
    <aside className={`profile-sidebar ${isCollapsed ? 'profile-sidebar--collapsed' : ''}`}>


      {/* Sidebar Header */}
      <div className="profile-sidebar__header">
        {!isCollapsed && (
          <>
            <div className="profile-sidebar__logo">
              <i className="fas fa-user-circle"></i>
            </div>
            <h3 className="profile-sidebar__title">My Account</h3>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="profile-sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={`profile-sidebar__item ${activeTab === item.key ? 'profile-sidebar__item--active' : ''}`}
            onClick={() => handleNavClick(item.key)}
            title={isCollapsed ? item.label : ''}
          >
            <div className="profile-sidebar__item-main">
              <div className="profile-sidebar__icon">
                <i className={item.icon}></i>
                {item.badge > 0 && (
                  <span className={`profile-sidebar__badge ${item.key === 'coupons' ? 'profile-sidebar__badge--gold' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              
              {!isCollapsed && (
                <div className="profile-sidebar__content">
                  <span className="profile-sidebar__label">{item.label}</span>
                  <span className="profile-sidebar__description">{item.description}</span>
                </div>
              )}
            </div>

            {/* Active indicator */}
            {activeTab === item.key && (
              <div className="profile-sidebar__active-indicator"></div>
            )}
          </button>
        ))}

        {/* Admin Panel Button */}
        {isAdmin && (
          <button
            className="profile-sidebar__item profile-sidebar__item--admin"
            onClick={handleAdminClick}
            title={isCollapsed ? 'Admin Panel' : ''}
          >
            <div className="profile-sidebar__item-main">
              <div className="profile-sidebar__icon">
                <i className="fas fa-shield-alt"></i>
                <div className="profile-sidebar__admin-dot"></div>
              </div>
              
              {!isCollapsed && (
                <div className="profile-sidebar__content">
                  <span className="profile-sidebar__label">Admin Panel</span>
                  <span className="profile-sidebar__description">Manage store</span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="profile-sidebar__admin-indicator">
                <i className="fas fa-crown"></i>
              </div>
            )}
          </button>
        )}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="profile-sidebar__footer">
          <div className="profile-sidebar__stats">
            <div className="profile-sidebar__stat">
              <span className="profile-sidebar__stat-number">{ordersCount}</span>
              <span className="profile-sidebar__stat-label">Orders</span>
            </div>
            <div className="profile-sidebar__stat">
              <span className="profile-sidebar__stat-number">{wishlistCount}</span>
              <span className="profile-sidebar__stat-label">Wishlist</span>
            </div>
            <div className="profile-sidebar__stat">
              <span className="profile-sidebar__stat-number">{couponsCount}</span>
              <span className="profile-sidebar__stat-label">Coupons</span>
            </div>
          </div>
          
          <button className="profile-sidebar__help-btn">
            <i className="fas fa-headset"></i>
            <span>Need Help?</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default ProfileSidebar;
