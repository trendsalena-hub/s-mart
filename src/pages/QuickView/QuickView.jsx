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
  const [activeTab, setActiveTab] = useState('description');

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
        offer: product.offer,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
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
  const hasActiveOffer = product?.offer?.enabled && product.offer.value > 0;

  // Calculate discount percentage if not provided
  const calculateDiscountPercentage = () => {
    if (!product || !hasDiscount) return 0;
    if (product.discount) return product.discount;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  // Calculate offer discount
  const calculateOfferDiscount = () => {
    if (!hasActiveOffer) return 0;
    if (product.offer.type === 'percentage') {
      return (product.price * product.offer.value) / 100;
    } else {
      return product.offer.value;
    }
  };

  // Calculate final price after offer
  const calculateFinalPrice = () => {
    if (!product) return 0;
    let finalPrice = product.price;
    
    if (hasActiveOffer) {
      finalPrice -= calculateOfferDiscount();
    }
    
    return Math.max(finalPrice, 0);
  };

  // Calculate total price based on quantity
  const calculateTotalPrice = () => {
    return calculateFinalPrice() * quantity;
  };

  const calculateOriginalTotalPrice = () => {
    if (!product || !product.originalPrice) return 0;
    return product.originalPrice * quantity;
  };

  const calculateTotalSavings = () => {
    if (!product) return 0;
    
    let savings = 0;
    if (hasDiscount) {
      savings += (product.originalPrice - product.price) * quantity;
    }
    if (hasActiveOffer) {
      savings += calculateOfferDiscount() * quantity;
    }
    
    return savings;
  };

  // Check if offer is valid
  const isOfferValid = () => {
    if (!hasActiveOffer) return false;
    if (!product.offer.validUntil) return true;
    
    const now = new Date();
    const validUntil = new Date(product.offer.validUntil);
    return now <= validUntil;
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
      price: calculateFinalPrice(), // Use final price after offer
      originalPrice: product.originalPrice || product.price,
      discount: product.discount,
      badge: product.badge,
      category: product.category,
      brand: product.brand,
      material: product.material,
      sku: product.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      offer: hasActiveOffer ? product.offer : null
    };
    
    addToCart(productWithDetails);
    showNotification(
      `${quantity}x ${product.title}${selectedSize ? ` (Size: ${selectedSize})` : ''}${selectedColor ? ` (Color: ${selectedColor})` : ''} added to cart!`, 
      'success'
    );
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
      price: calculateFinalPrice(), // Use final price after offer
      originalPrice: product.originalPrice || product.price,
      discount: product.discount,
      badge: product.badge,
      category: product.category,
      brand: product.brand,
      material: product.material,
      sku: product.sku,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      offer: hasActiveOffer ? product.offer : null
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
  const finalPrice = calculateFinalPrice();
  const offerValid = isOfferValid();

  return (
    <div className="quick-view">
      <div className="container">
        <div className="quick-view__content">
          {/* Left Side - Images */}
          <div className="quick-view__images">
            <div className="quick-view__main-image">
              <img src={productImages[selectedImage]} alt={product.title} />
              
              {/* Multiple Badges */}
              <div className="quick-view__badges">
                {/* Featured Badge */}
                {product.featured && (
                  <span className="quick-view__badge quick-view__badge--featured">
                    <i className="fas fa-star"></i>
                    Featured
                  </span>
                )}

                {/* Product Badge */}
                {product.badge && (
                  <span className={`quick-view__badge quick-view__badge--${product.badge.toLowerCase()}`}>
                    {product.badge}
                  </span>
                )}

                {/* Discount Badge */}
                {hasDiscount && discountPercentage > 0 && (
                  <span className="quick-view__badge quick-view__badge--discount">
                    {discountPercentage}% OFF
                  </span>
                )}

                {/* Offer Badge */}
                {hasActiveOffer && offerValid && (
                  <span className="quick-view__badge quick-view__badge--offer">
                    <i className="fas fa-gift"></i>
                    {product.offer.title}
                  </span>
                )}
              </div>
              
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

              {/* Wishlist Button */}
              <button 
                className={`quick-view__wishlist-btn ${isInWishlist ? 'quick-view__wishlist-btn--active' : ''}`}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <i className={`fas fa-heart ${wishlistLoading ? 'fa-spin' : ''}`}></i>
              </button>
            </div>

            {/* Thumbnails */}
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
              
            {/* Title */}
            <h1 className="quick-view__title">{product.title}</h1>

            {/* Description - MOVED BELOW TITLE */}
            {product.description && (
              <div className="quick-view__description">
                <p>{product.description}</p>
              </div>
            )}

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
              {/* Regular Price */}
              <div className="quick-view__price-row">
                <span className="quick-view__price-label">Price:</span>
                <div className="quick-view__price-values">
                  {/* Final Price (after all discounts) */}
                  <span className="quick-view__final-price">
                    ₹{finalPrice.toLocaleString()}
                  </span>

                  {/* Original Price */}
                  {hasDiscount && (
                    <span className="quick-view__original-price">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}

                  {/* Regular Price (if no original price) */}
                  {!hasDiscount && product.price !== finalPrice && (
                    <span className="quick-view__regular-price">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Offer Details */}
              {hasActiveOffer && offerValid && (
                <div className="quick-view__offer-details">
                  <div className="quick-view__offer-badge">
                    <i className="fas fa-gift"></i>
                    {product.offer.title}
                  </div>
                  <div className="quick-view__offer-description">
                    {product.offer.description}
                  </div>
                  {product.offer.validUntil && (
                    <div className="quick-view__offer-validity">
                      Valid until: {new Date(product.offer.validUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Total for Multiple Items */}
              {quantity > 1 && (
                <div className="quick-view__total-price-row">
                  <span className="quick-view__total-label">Total ({quantity} items):</span>
                  <div className="quick-view__total-values">
                    <span className="quick-view__total-price">
                      ₹{calculateTotalPrice().toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="quick-view__total-original-price">
                        ₹{calculateOriginalTotalPrice().toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Savings Summary */}
              {(hasDiscount || hasActiveOffer) && (
                <div className="quick-view__savings">
                  <i className="fas fa-piggy-bank"></i>
                  You Save ₹{calculateTotalSavings().toLocaleString()} 
                  {hasDiscount && ` (${discountPercentage}% OFF)`}
                  {hasActiveOffer && offerValid && ` + Offer`}
                </div>
              )}
            </div>

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
                        style={{ 
                          backgroundColor: color.toLowerCase(),
                          border: color.toLowerCase() === 'white' ? '1px solid #ddd' : 'none'
                        }}
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

            {/* Product Details Tabs */}
            <div className="quick-view__tabs">
              <div className="quick-view__tab-headers">
                <button 
                  className={`quick-view__tab-header ${activeTab === 'details' ? 'quick-view__tab-header--active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <i className="fas fa-info-circle"></i>
                  Details
                </button>
                {hasActiveOffer && (
                  <button 
                    className={`quick-view__tab-header ${activeTab === 'offer' ? 'quick-view__tab-header--active' : ''}`}
                    onClick={() => setActiveTab('offer')}
                  >
                    <i className="fas fa-gift"></i>
                    Offer
                  </button>
                )}
              </div>
                
              <div className="quick-view__tab-content">

                {activeTab === 'details' && (
                  <div className="quick-view__tab-panel">
                    <h4>Product Details</h4>
                    <div className="quick-view__details-grid">
                      {product.brand && (
                        <div className="quick-view__detail-item">
                          <strong>Brand:</strong>
                          <span>{product.brand}</span>
                        </div>
                      )}
                      {product.material && (
                        <div className="quick-view__detail-item">
                          <strong>Material:</strong>
                          <span>{product.material}</span>
                        </div>
                      )}
                      {product.sku && (
                        <div className="quick-view__detail-item">
                          <strong>SKU:</strong>
                          <span>{product.sku}</span>
                        </div>
                      )}
                      {product.category && (
                        <div className="quick-view__detail-item">
                          <strong>Category:</strong>
                          <span>{product.category}</span>
                        </div>
                      )}
                      {product.stock !== undefined && (
                        <div className="quick-view__detail-item">
                          <strong>Stock:</strong>
                          <span className={`quick-view__stock-status ${product.stock === 0 ? 'quick-view__stock-status--out' : product.stock < 10 ? 'quick-view__stock-status--low' : ''}`}>
                            {product.stock} units
                          </span>
                        </div>
                        
                      )}
                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="quick-view__tags-section">
                          <h3 className="quick-view__section-title">Product Tags</h3>
                          <div className="quick-view__tags">
                            {product.tags.map((tag, index) => (
                              <span key={index} className="quick-view__tag">#{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'offer' && hasActiveOffer && (
                  <div className="quick-view__tab-panel">
                    <h4>Special Offer</h4>
                    <div className="quick-view__offer-details-full">
                      <div className="quick-view__offer-header">
                        <h5>{product.offer.title}</h5>
                        {product.offer.type === 'percentage' ? (
                          <span className="quick-view__offer-value">
                            {product.offer.value}% OFF
                          </span>
                        ) : (
                          <span className="quick-view__offer-value">
                            ₹{product.offer.value} OFF
                          </span>
                        )}
                      </div>
                      {product.offer.description && (
                        <p className="quick-view__offer-description-full">
                          {product.offer.description}
                        </p>
                      )}
                      {product.offer.validUntil && (
                        <div className="quick-view__offer-validity-full">
                          <i className="fas fa-clock"></i>
                          <strong>Valid until:</strong> {new Date(product.offer.validUntil).toLocaleDateString()}
                          {!offerValid && <span className="quick-view__offer-expired"> (Expired)</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>



            {/* Product Features */}
            <div className="quick-view__features">
              <div className="quick-view__feature-item">
                <i className="fas fa-truck"></i>
                <div>
                  <strong>Free Delivery</strong>
                  <span>On orders above ₹1000</span>
                </div>
              </div>
              <div className="quick-view__feature-item">
                <i className="fas fa-undo"></i>
                <div>
                  <strong>Easy Returns</strong>
                  <span>7 days return policy</span>
                </div>
              </div>
              <div className="quick-view__feature-item">
                <i className="fas fa-shield-alt"></i>
                <div>
                  <strong>Quality Guarantee</strong>
                  <span>100% genuine products</span>
                </div>
              </div>
              <div className="quick-view__feature-item">
                <i className="fas fa-headset"></i>
                <div>
                  <strong>24/7 Support</strong>
                  <span>Customer care available</span>
                </div>
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

            {/* Social Share */}
            <div className="quick-view__social-share">
              <span>Share this product:</span>
              <div className="quick-view__social-buttons">
                <button className="quick-view__social-btn quick-view__social-btn--facebook">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button className="quick-view__social-btn quick-view__social-btn--twitter">
                  <i className="fab fa-twitter"></i>
                </button>
                <button className="quick-view__social-btn quick-view__social-btn--pinterest">
                  <i className="fab fa-pinterest-p"></i>
                </button>
                <button className="quick-view__social-btn quick-view__social-btn--whatsapp">
                  <i className="fab fa-whatsapp"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickView;