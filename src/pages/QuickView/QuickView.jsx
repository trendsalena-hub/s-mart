import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../../components/context/CartContext';
import './QuickView.scss';

const QuickView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  
  const [user, setUser] = useState(null);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Use product images array or fallback to single image
  const productImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.image 
    ? [product.image] 
    : [];

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && product) {
        await checkWishlistStatus(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [product]);

  // Load product
  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      if (location.state?.product) {
        const prod = location.state.product;
        setProduct(prod);
        // Set default selections
        if (prod.sizes && prod.sizes.length > 0) {
          setSelectedSize(prod.sizes[0]);
        }
        if (prod.colors && prod.colors.length > 0) {
          setSelectedColor(prod.colors[0]);
        }
        setLoading(false);
      } else if (location.state?.productId) {
        try {
          const productDoc = await getDoc(doc(db, 'products', location.state.productId));
          if (productDoc.exists()) {
            const prod = { id: productDoc.id, ...productDoc.data() };
            setProduct(prod);
            // Set default selections
            if (prod.sizes && prod.sizes.length > 0) {
              setSelectedSize(prod.sizes[0]);
            }
            if (prod.colors && prod.colors.length > 0) {
              setSelectedColor(prod.colors[0]);
            }
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching product:', error);
          navigate('/');
        }
        setLoading(false);
      } else {
        navigate('/');
      }
    };
    loadProduct();
  }, [location.state, navigate]);

  // Check if in cart
  useEffect(() => {
    if (product) {
      const inCart = cartItems.some(item => item.id === product.id);
      setIsInCart(inCart);
    }
  }, [cartItems, product]);

  // Check wishlist status
  const checkWishlistStatus = async (uid) => {
    if (!product) return;
    try {
      const wishlistDoc = await getDoc(doc(db, 'wishlists', uid));
      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const inWishlist = wishlistItems.some(item => item.id === product.id);
        setIsInWishlist(inWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  // Toggle wishlist with all product data
  const handleWishlistToggle = async () => {
    if (!user) {
      const shouldLogin = window.confirm('Please login to add items to wishlist. Go to login?');
      if (shouldLogin) navigate('/login');
      return;
    }
    if (!product) return;

    setWishlistLoading(true);
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      const productData = {
        id: product.id,
        image: productImages[0],
        images: productImages,
        title: product.title,
        price: product.price,
        originalPrice: product.originalPrice,
        discount: product.discount,
        badge: product.badge,
        category: product.category,
        description: product.description,
        stock: product.stock,
        sizes: product.sizes,
        colors: product.colors,
        material: product.material,
        brand: product.brand,
        tags: product.tags,
        sku: product.sku,
        featured: product.featured,
        addedAt: new Date().toISOString()
      };

      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const productIndex = wishlistItems.findIndex(item => item.id === product.id);
        if (productIndex > -1) {
          wishlistItems.splice(productIndex, 1);
          await updateDoc(wishlistRef, { items: wishlistItems, updatedAt: new Date().toISOString() });
          setIsInWishlist(false);
          showNotification(`${product.title} removed from wishlist`, 'info');
        } else {
          await updateDoc(wishlistRef, { items: arrayUnion(productData), updatedAt: new Date().toISOString() });
          setIsInWishlist(true);
          showNotification(`${product.title} added to wishlist!`, 'success');
        }
      } else {
        await setDoc(wishlistRef, {
          userId: user.uid,
          items: [productData],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setIsInWishlist(true);
        showNotification(`${product.title} added to wishlist!`, 'success');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showNotification('Failed to update wishlist', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const hasDiscount = product?.originalPrice && product.originalPrice > product.price;

  // Calculate discount percentage if not provided
  const calculateDiscountPercentage = () => {
    if (!product || !hasDiscount) return 0;
    if (product.discount) return product.discount;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  // Calculate total price based on quantity
  const calculateTotalPrice = () => {
    if (!product) return 0;
    return product.price * quantity;
  };

  const calculateOriginalTotalPrice = () => {
    if (!product || !product.originalPrice) return 0;
    return product.originalPrice * quantity;
  };

  const calculateTotalSavings = () => {
    if (!product || !hasDiscount) return 0;
    return (product.originalPrice - product.price) * quantity;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleQuantityChange = (type) => {
    if (type === 'increment') {
      if (product.stock && quantity >= product.stock) {
        showNotification('Maximum stock reached', 'warning');
        return;
      }
      setQuantity(prev => prev + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showNotification('Please select a size', 'warning');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      showNotification('Please select a color', 'warning');
      return;
    }

    const productWithDetails = {
      id: product.id,
      image: productImages[0],
      images: productImages,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      badge: product.badge,
      category: product.category,
      brand: product.brand,
      material: product.material,
      sku: product.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity
    };
    
    addToCart(productWithDetails);
    showNotification(
      `${quantity}x ${product.title}${selectedSize ? ` (Size: ${selectedSize})` : ''}${selectedColor ? ` (Color: ${selectedColor})` : ''} added to cart!`, 
      'success'
    );
    setTimeout(() => navigate(-1), 1000);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      showNotification('Please select a size', 'warning');
      return;
    }
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      showNotification('Please select a color', 'warning');
      return;
    }

    const productWithDetails = {
      id: product.id,
      image: productImages[0],
      images: productImages,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      badge: product.badge,
      category: product.category,
      brand: product.brand,
      material: product.material,
      sku: product.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity
    };

    if (!user) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify(productWithDetails));
      const shouldLogin = window.confirm('Please login to proceed with checkout. Go to login?');
      if (shouldLogin) navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    navigate('/checkout', { state: { product: productWithDetails } });
  };

  const showNotification = (message, type) => {
    const event = new CustomEvent('cartNotification', { detail: { message, type } });
    window.dispatchEvent(event);
  };

  if (loading || !product) {
    return (
      <div className="quick-view quick-view--loading">
        <div className="container">
          <div className="quick-view__loader">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  const discountPercentage = calculateDiscountPercentage();

  return (
    <div className="quick-view">
      <div className="container">
        <button className="quick-view__back-btn" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
          Back
        </button>

        <div className="quick-view__content">
          {/* Left Side - Images */}
          <div className="quick-view__images">
            <div className="quick-view__main-image">
              <img src={productImages[selectedImage]} alt={product.title} />
              
              {/* Featured Badge */}
              {product.featured && (
                <span className="quick-view__featured-badge">
                  <i className="fas fa-star"></i>
                  Featured
                </span>
              )}

              {product.badge && (
                <span className={`quick-view__badge quick-view__badge--${product.badge.toLowerCase()}`}>
                  {product.badge}
                </span>
              )}
              {hasDiscount && discountPercentage > 0 && (
                <span className="quick-view__discount-badge">
                  {discountPercentage}% OFF
                </span>
              )}
              
              {/* Stock Status */}
              {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                <span className="quick-view__stock-badge quick-view__stock-badge--low">
                  Only {product.stock} left
                </span>
              )}
              {product.stock === 0 && (
                <span className="quick-view__stock-badge quick-view__stock-badge--out">
                  Out of Stock
                </span>
              )}
              <button 
                className={`quick-view__wishlist-btn ${isInWishlist ? 'quick-view__wishlist-btn--active' : ''}`}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <i className={`fas fa-heart ${wishlistLoading ? 'fa-spin' : ''}`}></i>
              </button>
            </div>
            <div className="quick-view__thumbnails">
              {productImages.map((img, index) => (
                <button
                  key={index}
                  className={`quick-view__thumbnail ${selectedImage === index ? 'quick-view__thumbnail--active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`${product.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Details */}
          <div className="quick-view__details">
            {/* Category & Brand */}
            {(product.category || product.brand) && (
              <div className="quick-view__meta">
                {product.category && (
                  <span className="quick-view__category">
                    <i className="fas fa-tag"></i>
                    {product.category}
                  </span>
                )}
                {product.brand && (
                  <span className="quick-view__brand">
                    <i className="fas fa-award"></i>
                    {product.brand}
                  </span>
                )}
              </div>
            )}

            <h1 className="quick-view__title">{product.title}</h1>

            {/* SKU & Material */}
            <div className="quick-view__product-info">
              {product.sku && (
                <span className="quick-view__sku">
                  <i className="fas fa-barcode"></i>
                  SKU: {product.sku}
                </span>
              )}
              {product.material && (
                <span className="quick-view__material">
                  <i className="fas fa-certificate"></i>
                  Material: {product.material}
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="quick-view__rating">
              <div className="quick-view__stars">
                {[1,2,3,4].map(i => <i key={i} className="fas fa-star"></i>)}
                <i className="fas fa-star-half-alt"></i>
              </div>
              <span className="quick-view__rating-text">4.5 (128 reviews)</span>
            </div>

            {/* Price Section */}
            <div className="quick-view__price-section">
              <div className="quick-view__price-row">
                <span className="quick-view__price-label">Price per item:</span>
                <div className="quick-view__price-values">
                  <span className="quick-view__price">₹{product.price.toLocaleString()}</span>
                  {hasDiscount && (
                    <span className="quick-view__original-price">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {quantity > 1 && (
                <div className="quick-view__total-price-row">
                  <span className="quick-view__total-label">Total ({quantity} items):</span>
                  <div className="quick-view__total-values">
                    <span className="quick-view__total-price">₹{calculateTotalPrice().toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="quick-view__total-original-price">
                        ₹{calculateOriginalTotalPrice().toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {hasDiscount && (
                <span className="quick-view__savings">
                  You Save ₹{calculateTotalSavings().toLocaleString()} ({discountPercentage}% OFF)
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="quick-view__description">
                <h3 className="quick-view__section-title">Description</h3>
                <p>{product.description}</p>
              </div>
            )}

            {/* Selected Info Display */}
            <div className="quick-view__selected-info">
              {selectedSize && (
                <div className="quick-view__selected-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Size: <strong>{selectedSize}</strong></span>
                </div>
              )}
              {selectedColor && (
                <div className="quick-view__selected-item">
                  <i className="fas fa-palette"></i>
                  <span>Color: <strong>{selectedColor}</strong></span>
                </div>
              )}
              <div className="quick-view__selected-item">
                <i className="fas fa-box"></i>
                <span>Quantity: <strong>{quantity}</strong></span>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="quick-view__section">
                <h3 className="quick-view__section-title">
                  Select Size <span className="quick-view__required">*</span>
                </h3>
                <div className="quick-view__sizes">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`quick-view__size-btn ${selectedSize === size ? 'quick-view__size-btn--active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="quick-view__section">
                <h3 className="quick-view__section-title">
                  Select Color <span className="quick-view__required">*</span>
                </h3>
                <div className="quick-view__colors">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      className={`quick-view__color-btn ${selectedColor === color ? 'quick-view__color-btn--active' : ''}`}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    >
                      <span 
                        className="quick-view__color-preview"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                      <span className="quick-view__color-name">{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selection */}
            <div className="quick-view__section">
              <h3 className="quick-view__section-title">
                Quantity
                {product.stock !== undefined && (
                  <span className="quick-view__stock-info">
                    ({product.stock} available)
                  </span>
                )}
              </h3>
              <div className="quick-view__quantity">
                <button 
                  className="quick-view__quantity-btn"
                  onClick={() => handleQuantityChange('decrement')}
                  disabled={quantity === 1}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <span className="quick-view__quantity-value">{quantity}</span>
                <button 
                  className="quick-view__quantity-btn"
                  onClick={() => handleQuantityChange('increment')}
                  disabled={product.stock && quantity >= product.stock}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="quick-view__tags-section">
                <h3 className="quick-view__section-title">Tags</h3>
                <div className="quick-view__tags">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="quick-view__tag">#{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="quick-view__info">
              <div className="quick-view__info-item">
                <i className="fas fa-truck"></i>
                <span>Free delivery on orders above ₹1000</span>
              </div>
              <div className="quick-view__info-item">
                <i className="fas fa-undo"></i>
                <span>7 days return policy</span>
              </div>
              <div className="quick-view__info-item">
                <i className="fas fa-shield-alt"></i>
                <span>100% genuine products</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="quick-view__actions">
              <button 
                className="quick-view__btn quick-view__btn--cart" 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <i className="fas fa-shopping-bag"></i>
                {product.stock === 0 ? 'Out of Stock' : isInCart ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button 
                className="quick-view__btn quick-view__btn--buy" 
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                <i className="fas fa-bolt"></i>
                {product.stock === 0 ? 'Unavailable' : 'Buy Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickView;
