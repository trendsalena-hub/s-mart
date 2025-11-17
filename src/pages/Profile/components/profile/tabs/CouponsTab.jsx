import React, { useState } from 'react';
import "./CouponsTab.scss";

const CouponsTab = ({ coupons = [], onCopyCode, onError, onSuccess }) => {
  const [copyingCode, setCopyingCode] = useState(null);
  const [filter, setFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopyCode = async (coupon) => {
    if (copyingCode) return;
    
    setCopyingCode(coupon.id);
    try {
      await onCopyCode(coupon.code);
    } catch (error) {
      onError?.('Failed to copy coupon code');
    } finally {
      setTimeout(() => {
        setCopyingCode(null);
      }, 1500);
    }
  };
  
  // === UPDATED: formatDiscount to handle buy_x_get_y ===
  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`;
    }
    if (coupon.type === 'fixed') {
      return `₹${coupon.value} OFF`;
    }
    if (coupon.type === 'buy_x_get_y') {
      return `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity}`;
    }
    return coupon.discount;
  };
  
  // === UPDATED: formatDescription to handle buy_x_get_y ===
  const formatDescription = (coupon) => {
    if (coupon.type === 'buy_x_get_y') {
      let desc = `Buy ${coupon.buyQuantity} ${coupon.freeProduct ? coupon.freeProduct : 'items'} Get ${coupon.getQuantity} Free`;
      if (coupon.minPurchase > 0) {
        desc += ` on orders above ₹${coupon.minPurchase}`;
      }
      return desc;
    } else {
      let desc = `Get ${formatDiscount(coupon)}`;
      if (coupon.minPurchase > 0) {
        desc += ` on orders above ₹${coupon.minPurchase}`;
      }
      return desc;
    }
  };

  const getDaysUntilExpiry = (expiryTimestamp) => {
    if (!expiryTimestamp) return 0;
    const today = new Date();
    const expiry = expiryTimestamp.toDate();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryTimestamp) => {
    const days = getDaysUntilExpiry(expiryTimestamp);
    if (days < 0) return 'expired';
    if (days <= 7) return 'soon';
    return 'valid';
  };

  const filteredCoupons = coupons.filter(coupon => {
    const expiryStatus = getExpiryStatus(coupon.expiryDate);

    if (filter === 'active' && (expiryStatus === 'expired' || !coupon.isActive)) return false;
    if (filter === 'expired' && (expiryStatus !== 'expired' && coupon.isActive)) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const description = formatDescription(coupon).toLowerCase();
      return (
        coupon.code.toLowerCase().includes(term) ||
        description.includes(term)
      );
    }
    
    return true;
  });

  const activeCoupons = coupons.filter(c => getExpiryStatus(c.expiryDate) !== 'expired' && c.isActive).length;
  const expiredCoupons = coupons.length - activeCoupons;

  return (
    <div className="coupons-tab">
      {/* Header Section */}
      <div className="coupons-tab__header">
        <div className="coupons-tab__title-section">
          <h2 className="coupons-tab__title">
            <i className="fas fa-ticket-alt"></i>
            My Coupons & Vouchers
          </h2>
          <p className="coupons-tab__subtitle">
            Save more with these exclusive discount codes and offers
          </p>
        </div>
        
        <div className="coupons-tab__stats">
          <div className="coupons-tab__stat">
            <span className="coupons-tab__stat-number">{coupons.length}</span>
            <span className="coupons-tab__stat-label">Total</span>
          </div>
          <div className="coupons-tab__stat coupons-tab__stat--active">
            <span className="coupons-tab__stat-number">{activeCoupons}</span>
            <span className="coupons-tab__stat-label">Active</span>
          </div>
          <div className="coupons-tab__stat coupons-tab__stat--expired">
            <span className="coupons-tab__stat-number">{expiredCoupons}</span>
            <span className="coupons-tab__stat-label">Expired</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="coupons-tab__controls">
        <div className="coupons-tab__search">
          <div className="coupons-tab__search-container">
            <i className="fas fa-search coupons-tab__search-icon"></i>
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="coupons-tab__search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="coupons-tab__search-clear"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className="coupons-tab__filters">
          <button
            className={`coupons-tab__filter-btn ${filter === 'all' ? 'coupons-tab__filter-btn--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Coupons
          </button>
          <button
            className={`coupons-tab__filter-btn ${filter === 'active' ? 'coupons-tab__filter-btn--active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`coupons-tab__filter-btn ${filter === 'expired' ? 'coupons-tab__filter-btn--active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredCoupons.length === 0 ? (
        <div className="coupons-tab__empty">
          <div className="coupons-tab__empty-icon">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <h3 className="coupons-tab__empty-title">
            {searchTerm ? 'No coupons found' : 'No coupons available'}
          </h3>
          <p className="coupons-tab__empty-text">
            {searchTerm 
              ? 'Try adjusting your search terms to find what you\'re looking for.'
              : 'Check back later for new discount codes and special offers!'
            }
          </p>
          {searchTerm && (
            <button
              className="coupons-tab__btn coupons-tab__btn--secondary"
              onClick={() => setSearchTerm('')}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Coupons Grid */}
          <div className="coupons-tab__grid">
            {filteredCoupons.map((coupon) => {
              const expiryStatus = getExpiryStatus(coupon.expiryDate);
              const daysUntilExpiry = getDaysUntilExpiry(coupon.expiryDate);
              const isExpired = expiryStatus === 'expired' || !coupon.isActive;
              
              return (
                <div
                  key={coupon.id}
                  className={`coupons-tab__card ${isExpired ? 'coupons-tab__card--expired' : ''} ${expiryStatus === 'soon' ? 'coupons-tab__card--expiring' : ''}`}
                >
                  {/* Coupon Header */}
                  <div className="coupons-tab__card-header">
                    <div className="coupons-tab__discount-badge">
                      <i className="fas fa-tag"></i>
                      <span>{formatDiscount(coupon)}</span>
                    </div>
                    
                    <div className="coupons-tab__status">
                      {isExpired ? (
                        <span className="coupons-tab__status-badge coupons-tab__status-badge--expired">
                          <i className="fas fa-clock"></i>
                          Expired
                        </span>
                      ) : expiryStatus === 'soon' ? (
                        <span className="coupons-tab__status-badge coupons-tab__status-badge--soon">
                          <i className="fas fa-exclamation-circle"></i>
                          Expiring Soon
                        </span>
                      ) : (
                        <span className="coupons-tab__status-badge coupons-tab__status-badge--active">
                          <i className="fas fa-check-circle"></i>
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="coupons-tab__code-section">
                    <div className="coupons-tab__code-display">
                      <span className="coupons-tab__code-text">{coupon.code}</span>
                      <button
                        className={`coupons-tab__copy-btn ${copyingCode === coupon.id ? 'coupons-tab__copy-btn--copying' : ''}`}
                        onClick={() => handleCopyCode(coupon)}
                        disabled={isExpired || copyingCode === coupon.id}
                      >
                        {copyingCode === coupon.id ? (
                          <>
                            <div className="coupons-tab__copy-spinner"></div>
                            Copied!
                          </>
                        ) : (
                          <>
                            <i className="fas fa-copy"></i>
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Coupon Description */}
                  <div className="coupons-tab__description">
                    <p>{formatDescription(coupon)}</p>
                    {coupon.type === 'buy_x_get_y' && coupon.freeProduct && (
                      <p className="coupons-tab__free-product">
                        <i className="fas fa-gift"></i>
                        Free: {coupon.freeProduct}
                      </p>
                    )}
                  </div>

                  {/* Coupon Details */}
                  <div className="coupons-tab__details">
                    <div className="coupons-tab__detail-item">
                      <i className="fas fa-calendar-alt"></i>
                      <span className="coupons-tab__detail-label">Valid till:</span>
                      <span className="coupons-tab__detail-value">
                        {coupon.expiryDate ? new Date(coupon.expiryDate.toDate()).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    {!isExpired && (
                      <div className="coupons-tab__detail-item">
                        <i className="fas fa-clock"></i>
                        <span className="coupons-tab__detail-label">Expires in:</span>
                        <span className={`coupons-tab__detail-value coupons-tab__detail-value--${expiryStatus}`}>
                          {daysUntilExpiry === 0 ? 'Today' : `${daysUntilExpiry} days`}
                        </span>
                      </div>
                    )}

                    {coupon.minPurchase > 0 && (
                      <div className="coupons-tab__detail-item">
                        <i className="fas fa-shopping-cart"></i>
                        <span className="coupons-tab__detail-label">Min. order:</span>
                        <span className="coupons-tab__detail-value">₹{coupon.minPurchase}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="coupons-tab__info">
            <div className="coupons-tab__info-icon">
              <i className="fas fa-lightbulb"></i>
            </div>
            <div className="coupons-tab__info-content">
              <h4>How to use your coupons</h4>
              <ol>
                <li>Copy the coupon code by clicking "Copy Code"</li>
                <li>Add products to your cart and proceed to checkout</li>
                <li>Paste the code in the "Apply Coupon" section</li>
                <li>Enjoy your discount or free items!</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CouponsTab;