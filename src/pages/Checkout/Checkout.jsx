import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../components/context/CartContext';
import './Checkout.scss';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, getCartTotal } = useCart();
  
  // Get product from location state (for Buy Now) or use cart items
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    name: '',
    mobile: '',
    pincode: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    addressType: 'home'
  });

  // Sample addresses (in real app, fetch from backend/context)
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: 1,
      name: 'John Doe',
      mobile: '+91 9876543210',
      address: '123, MG Road',
      locality: 'Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      addressType: 'home',
      isDefault: true
    }
  ]);

  useEffect(() => {
    // If coming from Buy Now button, get product from location state
    if (location.state?.product) {
      setCheckoutItems([{ ...location.state.product, quantity: 1 }]);
    } else {
      // Otherwise use cart items
      setCheckoutItems(cartItems);
    }

    // Set default address if exists
    const defaultAddress = savedAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      setSelectedAddress(defaultAddress);
    }
  }, [location.state, cartItems, savedAddresses]);

  const calculateTotal = () => {
    return checkoutItems.reduce((total, item) => {
      return total + (item.price * (item.quantity || 1));
    }, 0);
  };

  const subtotal = calculateTotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      // Update existing address
      setSavedAddresses(prev =>
        prev.map(addr =>
          addr.id === editingAddress.id
            ? { ...addressForm, id: editingAddress.id }
            : addr
        )
      );
    } else {
      // Add new address
      const newAddress = {
        ...addressForm,
        id: Date.now(),
        isDefault: savedAddresses.length === 0
      };
      setSavedAddresses(prev => [...prev, newAddress]);
    }

    // Reset form and close
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({
      name: '',
      mobile: '',
      pincode: '',
      address: '',
      locality: '',
      city: '',
      state: '',
      addressType: 'home'
    });
  };

  const handleEditAddress = (address) => {
    setAddressForm(address);
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = (addressId) => {
    setSavedAddresses(prev => prev.filter(addr => addr.id !== addressId));
    if (selectedAddress?.id === addressId) {
      setSelectedAddress(null);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    // In real app, process payment and create order
    alert('Order placed successfully!');
    navigate('/');
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__empty">
            <i className="fas fa-shopping-bag"></i>
            <h2>No items to checkout</h2>
            <p>Add some products to proceed with checkout</p>
            <button onClick={() => navigate('/')} className="btn btn--primary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="container">
        <div className="checkout__header">
          <h1>Checkout</h1>
          <button onClick={() => navigate(-1)} className="checkout__back-btn">
            <i className="fas fa-arrow-left"></i> Back
          </button>
        </div>

        <div className="checkout__content">
          {/* Left Section - Address & Products */}
          <div className="checkout__main">
            {/* Address Section */}
            <div className="checkout__section">
              <div className="checkout__section-header">
                <h2>
                  <i className="fas fa-map-marker-alt"></i>
                  Delivery Address
                </h2>
                <button
                  className="btn btn--secondary"
                  onClick={() => setShowAddressForm(true)}
                >
                  <i className="fas fa-plus"></i> Add New Address
                </button>
              </div>

              {/* Address Form */}
              {showAddressForm && (
                <div className="address-form">
                  <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                  <div className="address-form__grid">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={addressForm.name}
                        onChange={handleAddressChange}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={addressForm.mobile}
                        onChange={handleAddressChange}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>
                    <div className="form-group form-group--full">
                      <label>Address (House No, Building Name) *</label>
                      <input
                        type="text"
                        name="address"
                        value={addressForm.address}
                        onChange={handleAddressChange}
                        placeholder="Enter address"
                        required
                      />
                    </div>
                    <div className="form-group form-group--full">
                      <label>Locality/Town *</label>
                      <input
                        type="text"
                        name="locality"
                        value={addressForm.locality}
                        onChange={handleAddressChange}
                        placeholder="Enter locality"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        placeholder="Enter city"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        type="text"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        placeholder="Enter state"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        placeholder="Enter pincode"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Address Type</label>
                      <div className="address-type-buttons">
                        <button
                          type="button"
                          className={`address-type-btn ${addressForm.addressType === 'home' ? 'active' : ''}`}
                          onClick={() => setAddressForm(prev => ({ ...prev, addressType: 'home' }))}
                        >
                          <i className="fas fa-home"></i> Home
                        </button>
                        <button
                          type="button"
                          className={`address-type-btn ${addressForm.addressType === 'work' ? 'active' : ''}`}
                          onClick={() => setAddressForm(prev => ({ ...prev, addressType: 'work' }))}
                        >
                          <i className="fas fa-briefcase"></i> Work
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="address-form__actions">
                    <button className="btn btn--primary" onClick={handleSaveAddress}>
                      <i className="fas fa-save"></i> Save Address
                    </button>
                    <button
                      className="btn btn--secondary"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddress(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Addresses */}
              <div className="address-list">
                {savedAddresses.map((address) => (
                  <div
                    key={address.id}
                    className={`address-card ${selectedAddress?.id === address.id ? 'address-card--selected' : ''}`}
                  >
                    <div className="address-card__header">
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddress?.id === address.id}
                        onChange={() => setSelectedAddress(address)}
                      />
                      <div className="address-card__type">
                        <i className={`fas fa-${address.addressType === 'home' ? 'home' : 'briefcase'}`}></i>
                        <span>{address.addressType}</span>
                        {address.isDefault && <span className="badge-default">Default</span>}
                      </div>
                    </div>
                    <div className="address-card__content">
                      <h4>{address.name}</h4>
                      <p>{address.address}, {address.locality}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                      <p><strong>Mobile:</strong> {address.mobile}</p>
                    </div>
                    <div className="address-card__actions">
                      <button onClick={() => handleEditAddress(address)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button onClick={() => handleDeleteAddress(address.id)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Products Section */}
            <div className="checkout__section">
              <div className="checkout__section-header">
                <h2>
                  <i className="fas fa-shopping-bag"></i>
                  Order Items ({checkoutItems.length})
                </h2>
              </div>

              <div className="checkout-products">
                {checkoutItems.map((item, index) => (
                  <div key={index} className="checkout-product">
                    <div className="checkout-product__image">
                      <img src={item.image} alt={item.title} />
                    </div>
                    <div className="checkout-product__details">
                      <h3>{item.title}</h3>
                      {item.badge && (
                        <span className={`badge badge--${item.badge.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      )}
                      <div className="checkout-product__price">
                        <span className="price-current">₹{item.price.toLocaleString()}</span>
                        {item.originalPrice && (
                          <span className="price-original">₹{item.originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="checkout-product__quantity">
                        Quantity: {item.quantity || 1}
                      </div>
                    </div>
                    <div className="checkout-product__total">
                      ₹{(item.price * (item.quantity || 1)).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section - Order Summary */}
          <div className="checkout__sidebar">
            <div className="order-summary">
              <h2>Order Summary</h2>

              <div className="order-summary__row">
                <span>Subtotal ({checkoutItems.length} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              <div className="order-summary__row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>

              {shipping === 0 && (
                <div className="order-summary__info order-summary__info--success">
                  <i className="fas fa-check-circle"></i>
                  You've got free shipping!
                </div>
              )}

              <div className="order-summary__row">
                <span>Tax (18% GST)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>

              <div className="order-summary__divider"></div>

              <div className="order-summary__row order-summary__row--total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              <button
                className="order-summary__place-order"
                onClick={handlePlaceOrder}
                disabled={!selectedAddress}
              >
                <i className="fas fa-lock"></i>
                Place Order
              </button>

              <div className="order-summary__security">
                <i className="fas fa-shield-alt"></i>
                <span>Safe and Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;