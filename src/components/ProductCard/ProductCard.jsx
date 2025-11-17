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
  images,
  title,
  price,
  originalPrice,
  discount,
  badge,
  category,
  stock,
  material,
  brand,
  offer,
  onQuickView,
}) => {
  const { addToCart, cartItems } = useCart();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(false);

  const productId = id || Math.random().toString(36).substr(2, 9);

  // DEBUG: Check if offer prop is received
  useEffect(() => {
    console.log('ProductCard - Title:', title);
    console.log('ProductCard - Price:', price);
    console.log('ProductCard - Offer:', offer);
  }, [title, price, offer]);

  // Check if product has discount
  const hasDiscount = originalPrice && originalPrice > price;

  // Use images array or fallback to single image
  const productImages = images && images.length > 0 ? images : [image];
  const currentImage = productImages[0];

  // Check if offer is valid (same logic as QuickView)
  const isOfferValid = () => {
    if (!offer?.enabled || !offer.value || offer.value === 0) return false;
    if (!offer.validUntil) return true;

    const now = new Date();
    const validUntil = new Date(offer.validUntil);
    return now <= validUntil;
  };

  const hasActiveOffer = isOfferValid();

  // Calculate offer discount (same as QuickView)
  const calculateOfferDiscount = () => {
    if (!hasActiveOffer) return 0;
    if (offer.type === 'percentage') {
      return (price * offer.value) / 100;
    } else {
      return offer.value;
    }
  };

  // Calculate final price after offer (same as QuickView)
  const calculateFinalPrice = () => {
    let finalPrice = price;
    if (hasActiveOffer) {
      finalPrice -= calculateOfferDiscount();
    }
    return Math.max(finalPrice, 0);
  };

  const finalPrice = calculateFinalPrice();

  // DEBUG: Log final price calculation
  useEffect(() => {
    console.log('Has Active Offer:', hasActiveOffer);
    console.log('Final Price:', finalPrice);
  }, [hasActiveOffer, finalPrice]);

  useEffect(() => {
    const inCart = cartItems.some((item) => item.id === productId);
    setIsInCart(inCart);
  }, [cartItems, productId]);

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

  const checkWishlistStatus = async (uid) => {
    try {
      const wishlistDoc = await getDoc(doc(db, 'wishlists', uid));
      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const inWishlist = wishlistItems.some((item) => item.id === productId);
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (window.confirm('Please login to add items to wishlist. Go to login?')) {
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
        image: currentImage,
        images: productImages,
        title,
        price: finalPrice,
        originalPrice: originalPrice || 0,
        discount: discount || 0,
        badge,
        category,
        stock: stock ?? 999,
        material,
        brand,
        offer: offer || null,
        addedAt: new Date().toISOString(),
      };

      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const productIndex = wishlistItems.findIndex((item) => item.id === productId);
        if (productIndex > -1) {
          wishlistItems.splice(productIndex, 1);
          await updateDoc(wishlistRef, {
            items: wishlistItems,
            updatedAt: new Date().toISOString(),
          });
          setIsInWishlist(false);
          showNotification(`${title} removed from wishlist`, 'info');
        } else {
          await updateDoc(wishlistRef, {
            items: arrayUnion(productData),
            updatedAt: new Date().toISOString(),
          });
          setIsInWishlist(true);
          showNotification(`${title} added to wishlist!`, 'success');
        }
      } else {
        await setDoc(wishlistRef, {
          userId: user.uid,
          items: [productData],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isInCart) {
      navigate('/cart');
      return;
    }

    const product = {
      id: productId,
      image: currentImage,
      images: productImages,
      title,
      price: finalPrice,
      originalPrice: originalPrice || price,
      discount: discount || 0,
      badge,
      category,
      stock: stock ?? 999,
      material,
      brand,
      offer: offer || null,
    };

    addToCart(product);
    showNotification(`${title} added to cart!`, 'success');
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView();
    } else {
      navigate(`/quick-view`, { state: { productId } });
    }
  };

  const showNotification = (message, type) => {
    const event = new CustomEvent('cartNotification', { detail: { message, type } });
    window.dispatchEvent(event);
  };

  return (
    <div className="product-card" onClick={handleQuickView}>
      <div className="product-card__image-wrapper">
        <img src={currentImage} alt={title} className="product-card__image" loading="lazy" />
        <button
          className={`product-card__favorite-btn ${isInWishlist ? 'product-card__favorite-btn--active' : ''}`}
          onClick={handleWishlistToggle}
          disabled={loading}
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <i className={`fas fa-heart ${loading ? 'fa-spin' : ''}`}></i>
        </button>

        {badge && (
          <span className={`product-card__badge product-card__badge--${badge.toLowerCase()}`}>
            {badge}
          </span>
        )}

        {(hasDiscount || hasActiveOffer) && (
          <span className="product-card__discount-label">
            {hasActiveOffer
              ? offer.type === 'percentage'
                ? `${offer.value}% OFF`
                : `₹${offer.value} OFF`
              : `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`}
          </span>
        )}

        {hasActiveOffer && (
          <span className="product-card__offer-summary">
            <i className="fas fa-gift"></i> {offer.title}
          </span>
        )}
      </div>

      <div className="product-card__info">
        <h3 className="product-card__title">{title}</h3>
        {brand && <p className="product-card__brand">{brand.trim()}</p>}

        <div className="product-card__price-wrapper">
          <span className="product-card__price">
            ₹{finalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
          {(hasDiscount || hasActiveOffer) && (
            <span className="product-card__original-price">
              ₹{(hasDiscount ? originalPrice : price)?.toLocaleString()}
            </span>
          )}
        </div>

        {material && <p className="product-card__material">{material}</p>}

        <button
          className={`product-card__cart-btn ${isInCart ? 'product-card__cart-btn--added' : ''}`}
          onClick={handleAddToCart}
          disabled={stock === 0}
        >
          <i className={`fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}`}></i>
          {stock === 0 ? 'Out of Stock' : isInCart ? 'Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
