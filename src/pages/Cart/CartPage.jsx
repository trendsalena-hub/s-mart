import React from 'react';
import { useCart } from '../../components/context/CartContext';
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

  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity >= 0) {
      updateQuantity(productId, quantity);
    }
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? (subtotal > 1000 ? 0 : 50) : 0;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-page__empty">
            <i className="fas fa-shopping-cart"></i>
            <h2>Your Cart is Empty</h2>
            <p>Add some products to your cart to see them here.</p>
            <Link to="/" className="btn btn--primary">
              Continue Shopping
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
          <h1>Shopping Cart</h1>
          <button 
            className="cart-page__clear-btn"
            onClick={clearCart}
          >
            <i className="fas fa-trash"></i> Clear Cart
          </button>
        </div>

        <div className="cart-page__content">
          {/* Cart Items */}
          <div className="cart-page__items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__image">
                  <img src={item.image} alt={item.title} />
                </div>

                <div className="cart-item__details">
                  <h3 className="cart-item__title">{item.title}</h3>
                  <div className="cart-item__price-wrapper">
                    <span className="cart-item__price">₹{item.price.toLocaleString()}</span>
                    {item.originalPrice && (
                      <span className="cart-item__original-price">
                        ₹{item.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {item.badge && (
                    <span className={`cart-item__badge cart-item__badge--${item.badge.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="cart-item__quantity">
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => decreaseQuantity(item.id)}
                    aria-label="Decrease quantity"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <input
                    type="number"
                    className="cart-item__qty-input"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    min="1"
                  />
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => increaseQuantity(item.id)}
                    aria-label="Increase quantity"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>

                <div className="cart-item__total">
                  <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>

                <button
                  className="cart-item__remove"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="Remove item"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="cart-summary__row">
              <span>Shipping</span>
              <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>

            {shipping === 0 && subtotal > 0 && (
              <div className="cart-summary__info">
                <i className="fas fa-check-circle"></i>
                You've got free shipping!
              </div>
            )}

            {shipping > 0 && (
              <div className="cart-summary__info cart-summary__info--warning">
                <i className="fas fa-info-circle"></i>
                Add ₹{(1000 - subtotal).toLocaleString()} more for free shipping
              </div>
            )}

            <div className="cart-summary__row">
              <span>Tax (18% GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>

            <div className="cart-summary__divider"></div>

            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <Link to="/checkout" className="cart-summary__checkout-btn">
              Proceed to Checkout
            </Link>

            <Link to="/" className="cart-summary__continue-btn">
              <i className="fas fa-arrow-left"></i> Continue Shopping
            </Link>

            {/* Promo Code */}
            <div className="cart-summary__promo">
              <h3>Have a promo code?</h3>
              <div className="cart-summary__promo-input">
                <input type="text" placeholder="Enter promo code" />
                <button>Apply</button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="cart-summary__security">
              <i className="fas fa-lock"></i>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;