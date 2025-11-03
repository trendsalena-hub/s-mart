import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.scss';

const ProductCard = ({ 
  image, 
  title, 
  price, 
  originalPrice, 
  discount,
  badge,
  onQuickView 
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const hasDiscount = originalPrice && originalPrice > price;

  const handleAddToCart = () => {
    const product = {
      id: Math.random().toString(36).substr(2, 9),
      image,
      title,
      price,
      originalPrice,
      discount,
      badge
    };
    addToCart(product);
    
    // Show cart notification
    const event = new CustomEvent('cartNotification', { 
      detail: { 
        message: `${title} added to cart!`,
        type: 'success'
      } 
    });
    window.dispatchEvent(event);
  };

  const handleBuyNow = () => {
    const product = {
      id: Math.random().toString(36).substr(2, 9),
      image,
      title,
      price,
      originalPrice,
      discount,
      badge
    };
    
    navigate('/checkout', { 
      state: { product } 
    });
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView();  // ✅ Allows parent component to override
    } else {
      // ✅ Creates product object with all necessary data
      const product = {
        image,
        title,
        price,
        originalPrice,
        discount,
        badge
      };
      
      // ✅ Navigates to /quick-view route with product data
      navigate('/quick-view', { 
        state: { product }  // ✅ Passes data through state
      });
    }
  };


  return (
    <div className="product-card">
      {/* Product Image */}
      <div className="product-card__image-wrapper">
        <img 
          src={image} 
          alt={title} 
          className="product-card__image"
          loading="lazy"
        />
        
        {/* Badge */}
        {badge && (
          <span className={`product-card__badge product-card__badge--${badge.toLowerCase()}`}>
            {badge}
          </span>
        )}

        {/* Discount Label */}
        {hasDiscount && discount && (
          <span className="product-card__discount-label">
            {discount}% OFF
          </span>
        )}

        {/* Hover Actions */}
        <div className="product-card__actions">
          <button 
            className="product-card__action-btn product-card__action-btn--quickview"
            onClick={handleQuickView}
            aria-label="Quick view"
            title="Quick view"
          >
            <i className="fas fa-eye"></i>
          </button>
          <button 
            className="product-card__action-btn product-card__action-btn--cart"
            onClick={handleAddToCart}
            aria-label="Add to cart"
            title="Add to cart"
          >
            <i className="fas fa-shopping-cart"></i>
          </button>
          <button 
            className="product-card__action-btn product-card__action-btn--wishlist"
            aria-label="Add to wishlist"
            title="Add to wishlist"
          >
            <i className="fas fa-heart"></i>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-card__info">
        <h3 className="product-card__title">{title}</h3>
        
        <div className="product-card__price-wrapper">
          <span className="product-card__price">₹ {price.toLocaleString()}</span>
          {hasDiscount && (
            <span className="product-card__original-price">
              ₹ {originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="product-card__rating">
          <div className="product-card__stars">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star-half-alt"></i>
          </div>
          <span className="product-card__rating-count">(4.5)</span>
        </div>

        {/* Action Buttons */}
        <div className="product-card__buttons">
          <button 
            className="product-card__buy-btn"
            onClick={handleBuyNow}
          >
            <i className="fas fa-bolt"></i>
            Buy Now
          </button>

          <button 
            className="product-card__cart-btn"
            onClick={handleAddToCart}
          >
            <i className="fas fa-shopping-bag"></i>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
