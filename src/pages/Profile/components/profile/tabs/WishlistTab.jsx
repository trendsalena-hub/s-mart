import React, { useState } from 'react';
import "./WishlistTab.scss";

const WishlistTab = ({ 
  wishlist = [], 
  onRemoveFromWishlist, 
  onAddToCart, 
  onNavigate,
  onError,
  onSuccess 
}) => {
  const [removingItemId, setRemovingItemId] = useState(null);
  const [addingToCartId, setAddingToCartId] = useState(null);

  const handleRemove = async (itemId, itemTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${itemTitle}" from your wishlist?`)) {
      return;
    }

    setRemovingItemId(itemId);
    try {
      await onRemoveFromWishlist(itemId);
    } catch (error) {
      onError?.('Failed to remove item from wishlist');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleAddToCart = async (item) => {
    setAddingToCartId(item.id);
    try {
      await onAddToCart(item);
    } catch (error) {
      onError?.('Failed to add item to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleQuickShop = () => {
    onNavigate?.('/products');
  };

  // Calculate total savings
  const totalSavings = wishlist.reduce((total, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return total + (item.originalPrice - item.price);
    }
    return total;
  }, 0);

  return (
    <div className="wishlist-tab">
      {/* Header Section */}
      <div className="wishlist-tab__header">
        <div className="wishlist-tab__title-section">
          <h2 className="wishlist-tab__title">
            <i className="fas fa-heart"></i>
            My Wishlist
          </h2>
          <p className="wishlist-tab__subtitle">Your saved items for later</p>
        </div>
        
        {wishlist.length > 0 && (
          <div className="wishlist-tab__stats">
            <div className="wishlist-tab__stat">
              <span className="wishlist-tab__stat-number">{wishlist.length}</span>
              <span className="wishlist-tab__stat-label">Items</span>
            </div>
            {totalSavings > 0 && (
              <div className="wishlist-tab__stat wishlist-tab__stat--savings">
                <span className="wishlist-tab__stat-number">₹{totalSavings.toLocaleString()}</span>
                <span className="wishlist-tab__stat-label">Total Savings</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="wishlist-tab__empty">
          <div className="wishlist-tab__empty-icon">
            <i className="fas fa-heart"></i>
          </div>
          <h3 className="wishlist-tab__empty-title">Your Wishlist is Empty</h3>
          <p className="wishlist-tab__empty-text">
            Save your favorite items here to shop later. They'll be waiting for you right here!
          </p>
          <div className="wishlist-tab__empty-actions">
            <button 
              className="wishlist-tab__btn wishlist-tab__btn--primary"
              onClick={handleQuickShop}
            >
              <i className="fas fa-shopping-bag"></i>
              Start Shopping
            </button>
            <button 
              className="wishlist-tab__btn wishlist-tab__btn--secondary"
              onClick={() => onNavigate?.('/')}
            >
              <i className="fas fa-home"></i>
              Go to Homepage
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Wishlist Actions */}
          <div className="wishlist-tab__actions">
            <div className="wishlist-tab__action-info">
              <span className="wishlist-tab__item-count">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in wishlist
              </span>
            </div>
            <div className="wishlist-tab__action-buttons">
              <button 
                className="wishlist-tab__btn wishlist-tab__btn--secondary wishlist-tab__btn--small"
                onClick={() => onNavigate?.('/collections')}
              >
                <i className="fas fa-plus"></i>
                Add More Items
              </button>
            </div>
          </div>

          {/* Wishlist Grid */}
          <div className="wishlist-tab__grid">
            {wishlist.map((item) => (
              <div key={item.id} className="wishlist-tab__card">
                {/* Product Image */}
                <div className="wishlist-tab__image-container">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="wishlist-tab__image"
                    // === FIX: Updated onClick handler ===
                    onClick={() => onNavigate?.('/quick-view', { state: { productId: item.id } })}
                  />
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className={`wishlist-tab__badge wishlist-tab__badge--${item.badge.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}

                  {/* Discount Tag */}
                  {item.discount && (
                    <span className="wishlist-tab__discount-tag">
                      {item.discount}% OFF
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    className={`wishlist-tab__remove-btn ${removingItemId === item.id ? 'wishlist-tab__remove-btn--loading' : ''}`}
                    onClick={() => handleRemove(item.id, item.title)}
                    disabled={removingItemId === item.id}
                    title="Remove from wishlist"
                  >
                    {removingItemId === item.id ? (
                      <div className="wishlist-tab__spinner"></div>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>

                {/* Product Info */}
                <div className="wishlist-tab__content">
                  <h3 
                    className="wishlist-tab__product-title"
                    // === FIX: Updated onClick handler ===
                    onClick={() => onNavigate?.('/quick-view', { state: { productId: item.id } })}
                  >
                    {item.title}
                  </h3>

                  {/* Price Section */}
                  <div className="wishlist-tab__price-section">
                    <div className="wishlist-tab__price-main">
                      <span className="wishlist-tab__current-price">₹{item.price?.toLocaleString()}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="wishlist-tab__original-price">
                          ₹{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="wishlist-tab__savings">
                        You save ₹{(item.originalPrice - item.price).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Product Features */}
                  <div className="wishlist-tab__features">
                    {item.features?.map((feature, index) => (
                      <span key={index} className="wishlist-tab__feature">
                        <i className="fas fa-check"></i>
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="wishlist-tab__card-actions">
                    <button
                      className={`wishlist-tab__btn wishlist-tab__btn--primary wishlist-tab__btn--full ${addingToCartId === item.id ? 'wishlist-tab__btn--loading' : ''}`}
                      onClick={() => handleAddToCart(item)}
                      disabled={addingToCartId === item.id}
                    >
                      {addingToCartId === item.id ? (
                        <>
                          <div className="wishlist-tab__btn-spinner"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart"></i>
                          Add to Cart
                        </>
                      )}
                    </button>
                    
                    <button
                      className="wishlist-tab__btn wishlist-tab__btn--secondary wishlist-tab__btn--full"
                      onClick={() => onNavigate?.('/quick-view', { state: { productId: item.id } })}
                    >
                      <i className="fas fa-eye"></i>
                      View Details
                    </button>
                  </div>

                  {/* Stock Status */}
                  <div className="wishlist-tab__stock-status">
                    <i className="fas fa-check-circle"></i>
                    <span>In Stock</span>
                    <span className="wishlist-tab__delivery">• Free Delivery</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions */}
          <div className="wishlist-tab__bulk-actions">
            <div className="wishlist-tab__bulk-info">
              <span>Select multiple items to perform bulk actions</span>
            </div>
            <div className="wishlist-tab__bulk-buttons">
              <button className="wishlist-tab__btn wishlist-tab__btn--secondary">
                <i className="fas fa-cart-plus"></i>
                Add All to Cart
              </button>
              <button className="wishlist-tab__btn wishlist-tab__btn--outline">
                <i className="fas fa-trash-alt"></i>
                Clear Wishlist
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WishlistTab;