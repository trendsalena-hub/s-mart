import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './ProductCard.scss';

const ProductCard = ({ 
  id,
  image, 
  title, 
  price, 
  originalPrice, 
  discount,
  badge,
  onQuickView 
}) => {
  const { addToCart, cartItems } = useCart(); // Get cartItems from context
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false); // Track cart status
  const [loading, setLoading] = useState(false);
  
  const hasDiscount = originalPrice && originalPrice > price;
  const productId = id || Math.random().toString(36).substr(2, 9);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkWishlistStatus(currentUser.uid);
      } else {
        setIsInWishlist(false);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  // Check if product is in cart whenever cartItems changes
  useEffect(() => {
    const inCart = cartItems.some(item => item.id === productId);
    setIsInCart(inCart);
  }, [cartItems, productId]);

  // Check if product is in wishlist
  const checkWishlistStatus = async (uid) => {
    try {
      const wishlistDoc = await getDoc(doc(db, 'wishlists', uid));
      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const inWishlist = wishlistItems.some(item => item.id === productId);
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  // Add/Remove from wishlist
  const handleWishlistToggle = async () => {
    if (!user) {
      const shouldLogin = window.confirm('Please login to add items to wishlist. Go to login?');
      if (shouldLogin) {
        navigate('/login');
      }
      return;
    }

    setLoading(true);
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);

      const productData = {
        id: productId,
        image,
        title,
        price,
        originalPrice,
        discount,
        badge,
        addedAt: new Date().toISOString()
      };

      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const productIndex = wishlistItems.findIndex(item => item.id === productId);

        if (productIndex > -1) {
          wishlistItems.splice(productIndex, 1);
          await updateDoc(wishlistRef, { 
            items: wishlistItems,
            updatedAt: new Date().toISOString()
          });
          setIsInWishlist(false);
          showNotification(`${title} removed from wishlist`, 'info');
        } else {
          await updateDoc(wishlistRef, {
            items: arrayUnion(productData),
            updatedAt: new Date().toISOString()
          });
          setIsInWishlist(true);
          showNotification(`${title} added to wishlist!`, 'success');
        }
      } else {
        await setDoc(wishlistRef, {
          userId: user.uid,
          items: [productData],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setIsInWishlist(true);
        showNotification(`${title} added to wishlist!`, 'success');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showNotification('Failed to update wishlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add to cart
  const handleAddToCart = () => {
    if (isInCart) {
      // If already in cart, navigate to cart page
      navigate('/cart');
      return;
    }

    const product = {
      id: productId,
      image,
      title,
      price,
      originalPrice,
      discount,
      badge
    };
    
    addToCart(product);
    showNotification(`${title} added to cart!`, 'success');
  };

  const handleBuyNow = () => {
    const product = {
      id: productId,
      image,
      title,
      price,
      originalPrice,
      discount,
      badge,
      quantity: 1
    };

    if (!user) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify(product));
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    navigate('/checkout', { 
      state: { 
        products: [product],
        userId: user.uid 
      } 
    });
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView();
    } else {
      const product = {
        id: productId,
        image,
        title,
        price,
        originalPrice,
        discount,
        badge
      };
      
      navigate('/quick-view', { 
        state: { product }
      });
    }
  };

  const showNotification = (message, type) => {
    const event = new CustomEvent('cartNotification', { 
      detail: { message, type } 
    });
    window.dispatchEvent(event);
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

        {/* Wishlisted Label */}
        {isInWishlist && (
          <span className="product-card__wishlisted-label">
            <i className="fas fa-heart"></i>
            Wishlisted
          </span>
        )}

        {/* In Cart Label */}
        {isInCart && (
          <span className="product-card__in-cart-label">
            <i className="fas fa-check-circle"></i>
            Added
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
            className={`product-card__action-btn product-card__action-btn--cart ${
              isInCart ? 'product-card__action-btn--in-cart' : ''
            }`}
            onClick={handleAddToCart}
            aria-label={isInCart ? 'Go to cart' : 'Add to cart'}
            title={isInCart ? 'Go to cart' : 'Add to cart'}
          >
            <i className={`fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}`}></i>
          </button>
          <button 
            className={`product-card__action-btn product-card__action-btn--wishlist ${
              isInWishlist ? 'product-card__action-btn--active' : ''
            }`}
            onClick={handleWishlistToggle}
            disabled={loading}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <i className={`fas fa-heart ${loading ? 'fa-spin' : ''}`}></i>
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
            className={`product-card__cart-btn ${isInCart ? 'product-card__cart-btn--added' : ''}`}
            onClick={handleAddToCart}
          >
            <i className={`fas ${isInCart ? 'fa-check-circle' : 'fa-shopping-bag'}`}></i>
            {isInCart ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
