import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './ProductCard.scss';

const ProductCard = ({ 
  id,
  image,           // Keep for backward compatibility
  images,          // NEW: Multiple images array
  title, 
  price, 
  originalPrice, 
  discount,
  badge,
  category,        // NEW
  description,     // NEW
  stock,           // NEW
  sizes,           // NEW
  colors,          // NEW
  material,        // NEW
  brand,           // NEW
  tags,            // NEW
  sku,             // NEW
  featured,        // NEW
  onQuickView 
}) => {
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const hasDiscount = originalPrice && originalPrice > price;
  const productId = id || Math.random().toString(36).substr(2, 9);
  
  // Use images array if available, otherwise fallback to single image
  const productImages = images && images.length > 0 ? images : [image];
  const currentImage = productImages[currentImageIndex];

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

  // Add/Remove from wishlist with ALL product data - FIXED VERSION
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

      // Create product data object with null checks - NO undefined values
      const productData = {
        id: productId || '',
        image: currentImage || '',
        images: productImages || [],
        title: title || '',
        price: price || 0,
        originalPrice: originalPrice || 0,
        discount: discount || 0,
        badge: badge || '',
        category: category || '',
        description: description || '',
        stock: stock !== undefined ? stock : 999,
        sizes: sizes || [],
        colors: colors || [],
        material: material || '',
        brand: brand || '',
        tags: tags || [],
        sku: sku || '',
        addedAt: new Date().toISOString()
      };

      // Remove any undefined values to be extra safe
      Object.keys(productData).forEach(key => {
        if (productData[key] === undefined) {
          productData[key] = null;
        }
      });

      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const productIndex = wishlistItems.findIndex(item => item.id === productId);

        if (productIndex > -1) {
          // Remove from wishlist
          wishlistItems.splice(productIndex, 1);
          await updateDoc(wishlistRef, { 
            items: wishlistItems,
            updatedAt: new Date().toISOString()
          });
          setIsInWishlist(false);
          showNotification(`${title} removed from wishlist`, 'info');
        } else {
          // Add to wishlist
          await updateDoc(wishlistRef, {
            items: arrayUnion(productData),
            updatedAt: new Date().toISOString()
          });
          setIsInWishlist(true);
          showNotification(`${title} added to wishlist!`, 'success');
        }
      } else {
        // Create new wishlist
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
      showNotification('Failed to update wishlist. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add to cart with ALL product data - FIXED VERSION
  const handleAddToCart = () => {
    if (isInCart) {
      navigate('/cart');
      return;
    }

    const product = {
      id: productId || '',
      image: currentImage || '',
      images: productImages || [],
      title: title || '',
      price: price || 0,
      originalPrice: originalPrice || 0,
      discount: discount || 0,
      badge: badge || '',
      category: category || '',
      description: description || '',
      stock: stock !== undefined ? stock : 999,
      sizes: sizes || [],
      colors: colors || [],
      material: material || '',
      brand: brand || '',
      tags: tags || [],
      sku: sku || ''
    };
    
    addToCart(product);
    showNotification(`${title} added to cart!`, 'success');
  };

  // Buy Now with ALL product data - FIXED VERSION
  const handleBuyNow = () => {
    const product = {
      id: productId || '',
      image: currentImage || '',
      images: productImages || [],
      title: title || '',
      price: price || 0,
      originalPrice: originalPrice || 0,
      discount: discount || 0,
      badge: badge || '',
      category: category || '',
      description: description || '',
      stock: stock !== undefined ? stock : 999,
      sizes: sizes || [],
      colors: colors || [],
      material: material || '',
      brand: brand || '',
      tags: tags || [],
      sku: sku || '',
      quantity: 1
    };

    if (!user) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify(product));
      const shouldLogin = window.confirm('Please login to proceed with checkout. Go to login?');
      if (shouldLogin) {
        navigate('/login', { state: { from: '/checkout' } });
      }
      return;
    }

    navigate('/checkout', { 
      state: { product: product }
    });
  };

  // Quick view with ALL product data - FIXED VERSION
  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView();
    } else {
      navigate(`/quick-view`, { 
        state: { productId } 
      });
    }
  };

  // Image navigation for multiple images
  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
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
          src={currentImage} 
          alt={title} 
          className="product-card__image"
          loading="lazy"
        />
        
        {/* Multiple Images Navigation */}
        {productImages.length > 1 && (
          <>
            <button 
              className="product-card__image-nav product-card__image-nav--prev"
              onClick={handlePrevImage}
              aria-label="Previous image"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="product-card__image-nav product-card__image-nav--next"
              onClick={handleNextImage}
              aria-label="Next image"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <div className="product-card__image-dots">
              {productImages.map((_, index) => (
                <span 
                  key={index}
                  className={`product-card__image-dot ${currentImageIndex === index ? 'product-card__image-dot--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </div>
          </>
        )}
        
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

        {/* Stock Status */}
        {stock !== undefined && stock < 10 && stock > 0 && (
          <span className="product-card__stock-label product-card__stock-label--low">
            Only {stock} left
          </span>
        )}

        {stock === 0 && (
          <span className="product-card__stock-label product-card__stock-label--out">
            Out of Stock
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
            disabled={stock === 0}
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
        {/* Category & Brand */}
        <div className="product-card__meta">
          {category && (
            <span className="product-card__category">{category}</span>
          )}
          {brand && (
            <span className="product-card__brand">{brand}</span>
          )}
        </div>

        <h3 className="product-card__title">{title}</h3>
        
        {/* Material */}
        {material && (
          <p className="product-card__material">
            <i className="fas fa-certificate"></i>
            {material}
          </p>
        )}

        <div className="product-card__price-wrapper">
          <span className="product-card__price">₹{price.toLocaleString()}</span>
          {hasDiscount && (
            <span className="product-card__original-price">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Available Sizes */}
        {sizes && sizes.length > 0 && (
          <div className="product-card__sizes">
            <span className="product-card__sizes-label">Sizes:</span>
            <div className="product-card__sizes-list">
              {sizes.slice(0, 4).map((size, index) => (
                <span key={index} className="product-card__size-tag">{size}</span>
              ))}
              {sizes.length > 4 && (
                <span className="product-card__size-tag product-card__size-tag--more">
                  +{sizes.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Available Colors */}
        {colors && colors.length > 0 && (
          <div className="product-card__colors">
            <span className="product-card__colors-label">Colors:</span>
            <div className="product-card__colors-list">
              {colors.slice(0, 4).map((color, index) => (
                <span 
                  key={index} 
                  className="product-card__color-dot"
                  style={{ backgroundColor: color.toLowerCase() }}
                  title={color}
                />
              ))}
              {colors.length > 4 && (
                <span className="product-card__color-more">+{colors.length - 4}</span>
              )}
            </div>
          </div>
        )}

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

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="product-card__tags">
            {tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="product-card__tag">#{tag}</span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="product-card__buttons">
          <button 
            className="product-card__buy-btn"
            onClick={handleBuyNow}
            disabled={stock === 0}
          >
            <i className="fas fa-bolt"></i>
            {stock === 0 ? 'Out of Stock' : 'Buy Now'}
          </button>

          <button 
            className={`product-card__cart-btn ${isInCart ? 'product-card__cart-btn--added' : ''}`}
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            <i className={`fas ${isInCart ? 'fa-check-circle' : 'fa-shopping-bag'}`}></i>
            {stock === 0 ? 'Unavailable' : isInCart ? 'Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
