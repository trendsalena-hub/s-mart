import React, { useState, useEffect } from 'react';
import { useCart } from '../../components/context/CartContext';
import { auth } from '../../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import './CartPage.scss';

const CartPage = () => {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
    getCartTotal,
    clearCart
  } = useCart();

  const [user, setUser] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const today = new Date();
    const delivery = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    const deliveryEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setEstimatedDelivery(
      `${delivery.toLocaleDateString()} - ${deliveryEnd.toLocaleDateString()}`
    );

    return () => unsubscribe();
  }, []);

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0) {
      updateQuantity(productId, quantity);
    }
  };

  const handleClearCart = () => {
    const confirmed = window.confirm('Are you sure you want to clear your cart?');
    if (confirmed) {
      clearCart();
      setAppliedPromo(null);
    }
  };

  const handleApplyPromo = () => {
    const promoCodes = {
      'WELCOME10': { discount: 10, type: 'percentage', label: '10% Off' },
      'SAVE100': { discount: 100, type: 'fixed', label: '₹100 Off' },
      'FREESHIP': { discount: 0, type: 'shipping', label: 'Free Shipping' },
      'SAVE20': { discount: 20, type: 'percentage', label: '20% Off' },
      'FLAT50': { discount: 50, type: 'fixed', label: '₹50 Off' }
    };

    const code = promoCode.toUpperCase().trim();
    if (promoCodes[code]) {
      setAppliedPromo(promoCodes[code]);
      setPromoError('');
      setShowPromoForm(false);
    } else {
      setPromoError('Invalid promo code');
      setAppliedPromo(null);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  // ✅ CORRECT: Calculate offer discount from originalPrice to subtotal
  const calculateOfferDiscount = () => {
    return cartItems.reduce((total, item) => {
      if (item.offer?.enabled && item.offer?.value > 0) {
        const originalPrice = item.originalPrice;
        
        let discountPerItem = 0;
        if (item.offer.type === 'percentage') {
          discountPerItem = originalPrice * (item.offer.value / 100);
        } else {
          discountPerItem = item.offer.value;
        }
        
        return total + (discountPerItem * item.quantity);
      }
      return total;
    }, 0);
  };

  // ✅ CORRECT: Subtotal uses ORIGINAL PRICE (before offers)
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const originalPrice = item.originalPrice;
      return total + (originalPrice * item.quantity);
    }, 0);
  };

  // ✅ Cart total (using already discounted price from cart)
  const getCartPriceTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const subtotal = getSubtotal();
  const offerDiscount = calculateOfferDiscount();
  const priceAfterOffer = getCartPriceTotal(); // This is already offer-applied from cart
  
  let shipping = priceAfterOffer > 0 ? (priceAfterOffer > 1000 ? 0 : 50) : 0;
  
  // REMOVED: Tax calculation
  // const tax = priceAfterOffer * 0.18;
  
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === 'percentage') {
      promoDiscount = priceAfterOffer * (appliedPromo.discount / 100);
    } else if (appliedPromo.type === 'fixed') {
      promoDiscount = appliedPromo.discount;
    } else if (appliedPromo.type === 'shipping') {
      shipping = 0;
    }
  }
  
  // REMOVED: Tax from total calculation
  const total = priceAfterOffer - promoDiscount + shipping;
  const totalSavings = offerDiscount + promoDiscount;

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-page__empty">
            <div className="cart-page__empty-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2>Your Cart is Empty</h2>
            <p>Add some products to your cart to see them here.</p>
            <p className="cart-page__session-note">
              <i className="fas fa-info-circle"></i> Cart items are stored in current session only
            </p>
            <Link to="/" className="btn btn--primary">
              <i className="fas fa-arrow-left"></i> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-page__header">
          <div>
            <h1>Shopping Cart</h1>
            <p className="cart-page__item-count">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
            </p>
          </div>
          <button 
            className="cart-page__clear-btn"
            onClick={handleClearCart}
            aria-label="Clear cart"
          >
            <i className="fas fa-trash"></i> Clear Cart
          </button>
        </div>

        <div className="cart-page__content">
          {/* Cart Items */}
          <div className="cart-page__items">
            {cartItems.map((item, index) => {
              // ✅ SIMPLE: item.price is already the final price
              const finalItemPrice = item.price;
              const originalPrice = item.originalPrice;
              
              let itemOfferDiscount = 0;
              if (item.offer?.enabled && item.offer?.value > 0) {
                if (item.offer.type === 'percentage') {
                  itemOfferDiscount = originalPrice * (item.offer.value / 100);
                } else {
                  itemOfferDiscount = item.offer.value;
                }
              }

              return (
                <div key={item.id} className="cart-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <div className="cart-item__image">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    {item.badge && (
                      <span className={`cart-item__badge cart-item__badge--${item.badge.toLowerCase()}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="cart-item__details">
                    <h3 className="cart-item__title">{item.title}</h3>
                    {item.brand && (
                      <p className="cart-item__brand">{item.brand}</p>
                    )}
                    
                    <div className="cart-item__price-wrapper">
                      <span className="cart-item__price">
                        ₹{finalItemPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      {originalPrice && originalPrice !== finalItemPrice && (
                        <span className="cart-item__original-price">
                          ₹{originalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      )}
                      {itemOfferDiscount > 0 && (
                        <span className="cart-item__offer-label">
                          <i className="fas fa-gift"></i> Offer
                        </span>
                      )}
                    </div>

                    {item.offer?.enabled && item.offer?.value > 0 && (
                      <div className="cart-item__offer-info">
                        <i className="fas fa-check-circle"></i>
                        {item.offer.type === 'percentage'
                          ? `${item.offer.value}% Off - ${item.offer.title}`
                          : `₹${item.offer.value} Off - ${item.offer.title}`
                        }
                      </div>
                    )}
                  </div>

                  <div className="cart-item__quantity">
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                    <input
                      type="number"
                      className="cart-item__qty-input"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min="1"
                      max={item.stock || 999}
                    />
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label="Increase quantity"
                      disabled={item.stock && item.quantity >= item.stock}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>

                  <div className="cart-item__total">
                    <span className="cart-item__total-label">Total</span>
                    <span className="cart-item__total-price">
                      ₹{(finalItemPrice * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    className="cart-item__remove"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    title="Remove from cart"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__section">
              <div className="cart-summary__row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>

              {offerDiscount > 0 && (
                <div className="cart-summary__row cart-summary__row--offer">
                  <span>
                    <i className="fas fa-gift"></i> Offers
                  </span>
                  <span>-₹{offerDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}

              {appliedPromo && appliedPromo.type !== 'shipping' && (
                <div className="cart-summary__row cart-summary__row--promo">
                  <span>
                    <i className="fas fa-check-circle"></i> {appliedPromo.label}
                  </span>
                  <span>-₹{promoDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="cart-summary__row">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'cart-summary__free' : ''}>
                  {shipping === 0 ? (
                    <>
                      <i className="fas fa-check-circle"></i> FREE
                    </>
                  ) : (
                    `₹${shipping}`
                  )}
                </span>
              </div>

              {shipping === 0 && priceAfterOffer > 0 && (
                <div className="cart-summary__info cart-summary__info--success">
                  <i className="fas fa-check-circle"></i>
                  You've got free shipping!
                </div>
              )}

              {shipping > 0 && (
                <div className="cart-summary__info cart-summary__info--warning">
                  <i className="fas fa-info-circle"></i>
                  Add ₹{((1000 - priceAfterOffer).toFixed(2)).toLocaleString()} more for free shipping
                </div>
              )}

              {/* REMOVED: Tax row */}
            </div>

            <div className="cart-summary__divider"></div>

            <div className="cart-summary__row cart-summary__row--total">
              <span>Total Amount</span>
              <span>₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>

            {totalSavings > 0 && (
              <div className="cart-summary__savings">
                <i className="fas fa-piggy-bank"></i>
                <strong>You Save ₹{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
            )}

            {/* Promo Code Section */}
            <div className="cart-summary__promo">
              {appliedPromo ? (
                <div className="cart-summary__promo-applied">
                  <i className="fas fa-check-circle"></i>
                  <div>
                    <p className="cart-summary__promo-success">{appliedPromo.label}</p>
                    <p className="cart-summary__promo-code">Code: {promoCode.toUpperCase()}</p>
                  </div>
                  <button 
                    className="cart-summary__promo-remove"
                    onClick={removePromo}
                    title="Remove promo code"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    className="cart-summary__promo-toggle"
                    onClick={() => setShowPromoForm(!showPromoForm)}
                  >
                    <i className="fas fa-tag"></i> Have a promo code?
                  </button>
                  
                  {showPromoForm && (
                    <div className="cart-summary__promo-input-wrapper">
                      <input 
                        type="text" 
                        placeholder="Enter promo code"
                        className="cart-summary__promo-input"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                      />
                      <button 
                        className="cart-summary__promo-apply"
                        onClick={handleApplyPromo}
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <p className="cart-summary__promo-error">
                      <i className="fas fa-times-circle"></i> {promoError}
                    </p>
                  )}

                  <div className="cart-summary__promo-hints">
                    <small>Try: WELCOME10, SAVE100, FREESHIP, SAVE20, FLAT50</small>
                  </div>
                </>
              )}
            </div>

            {/* Delivery Info */}
            <div className="cart-summary__delivery">
              <i className="fas fa-truck"></i>
              <div>
                <p className="cart-summary__delivery-label">Estimated Delivery</p>
                <p className="cart-summary__delivery-date">{estimatedDelivery}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="cart-summary__actions">
              <Link to="/checkout" className="cart-summary__checkout-btn">
                <i className="fas fa-lock"></i> Proceed to Checkout
              </Link>

              <Link to="/" className="cart-summary__continue-btn">
                <i className="fas fa-arrow-left"></i> Continue Shopping
              </Link>
            </div>

            {/* Security Badge */}
            <div className="cart-summary__security">
              <i className="fas fa-shield-alt"></i>
              <span>Secure Checkout with SSL Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;