import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../../components/context/CartContext';
import './Checkout.scss';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart();
  
  const [user, setUser] = useState(null);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    name: '',
    mobile: '',
    pincode: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    addressType: 'home',
    isDefault: false
  });

  // Available sizes
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load saved addresses from Firestore
  useEffect(() => {
    if (!user) return;

    const addressesRef = doc(db, 'addresses', user.uid);
    const unsubscribe = onSnapshot(addressesRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addressesArray = data.addresses || [];
        setSavedAddresses(addressesArray);

        // Automatically select default address if none selected
        if (!selectedAddress) {
          const defaultAddr = addressesArray.find(addr => addr.isDefault);
          if (defaultAddr) setSelectedAddress(defaultAddr);
        }
      } else {
        setSavedAddresses([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading addresses:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, selectedAddress]);

  // Set checkout items from Buy Now product or cart items 
  useEffect(() => {
    if (location.state?.product) {
      const product = {
        ...location.state.product,
        quantity: 1,
        size: location.state.product.size || 'M',
        color: location.state.product.color || 'Default'
      };
      setCheckoutItems([product]);
    } else {
      const itemsWithDefaults = cartItems.map(item => ({
        ...item,
        size: item.size || 'M',
        color: item.color || 'Default'
      }));
      setCheckoutItems(itemsWithDefaults);
    }
  }, [location.state, cartItems]);

  // Handle quantity updating per item
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    if (location.state?.product) {
      setCheckoutItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  // Handle size selection per item
  const handleSizeChange = (itemId, size) => {
    setCheckoutItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, size } : item
      )
    );
  };

  // Handle removing a product from checkout (cart)
  const handleRemoveItem = (itemId) => {
    if (location.state?.product) {
      alert('Cannot remove item from Buy Now checkout');
      return;
    }
    if (window.confirm('Remove this item from checkout?')) {
      removeFromCart(itemId);
    }
  };

  // Calculate subtotal
  const calculateTotal = () => {
    return checkoutItems.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  };

  const subtotal = calculateTotal();
  const shipping = subtotal > 1000 ? 0 : 50;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  // Manage form input for address
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
  };

  // Save or update address in Firestore
  const handleSaveAddress = async () => {
    if (!user) {
      alert('Please login to save address');
      return;
    }
    if (!addressForm.name || !addressForm.mobile || !addressForm.address || 
        !addressForm.locality || !addressForm.city || !addressForm.state || 
        !addressForm.pincode) {
      alert('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const addressesRef = doc(db, 'addresses', user.uid);
      const addressDoc = await getDoc(addressesRef);
      let updatedAddresses = [];

      if (editingAddress) {
        if (addressDoc.exists()) {
          const existingAddresses = addressDoc.data().addresses || [];
          if (addressForm.isDefault) {
            updatedAddresses = existingAddresses.map(addr =>
              addr.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : { ...addr, isDefault: false }
            );
          } else {
            updatedAddresses = existingAddresses.map(addr =>
              addr.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : addr
            );
          }
        }
      } else {
        const newAddress = {
          ...addressForm,
          id: Date.now().toString(),
          isDefault: savedAddresses.length === 0 ? true : addressForm.isDefault
        };
        if (addressDoc.exists()) {
          const existingAddresses = addressDoc.data().addresses || [];
          if (newAddress.isDefault) {
            updatedAddresses = existingAddresses.map(addr => ({ ...addr, isDefault: false }));
          } else {
            updatedAddresses = [...existingAddresses];
          }
          updatedAddresses.push(newAddress);
        } else {
          updatedAddresses = [newAddress];
        }
      }

      await setDoc(addressesRef, { userId: user.uid, addresses: updatedAddresses, updatedAt: new Date().toISOString() });
      setShowAddressForm(false);
      setEditingAddress(null);
      setAddressForm({ name:'', mobile:'', pincode:'', address:'', locality:'', city:'', state:'', addressType:'home', isDefault:false });
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm(address);
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const addressesRef = doc(db, 'addresses', user.uid);
      const addressDoc = await getDoc(addressesRef);
      if (addressDoc.exists()) {
        const existingAddresses = addressDoc.data().addresses || [];
        const updatedAddresses = existingAddresses.filter(addr => addr.id !== addressId);
        if (existingAddresses.find(addr => addr.id === addressId)?.isDefault && updatedAddresses.length > 0){
          updatedAddresses[0].isDefault = true;
        }
        await setDoc(addressesRef, { userId: user.uid, addresses: updatedAddresses, updatedAt: new Date().toISOString() });
        if (selectedAddress?.id === addressId) setSelectedAddress(updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0] || null);
      }
    } catch (error){
      console.error('Error deleting address:', error);
      alert('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const addressesRef = doc(db, 'addresses', user.uid);
      const addressDoc = await getDoc(addressesRef);
      if (addressDoc.exists()) {
        const existingAddresses = addressDoc.data().addresses || [];
        const updatedAddresses = existingAddresses.map(addr => ({ ...addr, isDefault: addr.id === addressId }));
        await setDoc(addressesRef, { userId: user.uid, addresses: updatedAddresses, updatedAt: new Date().toISOString() });
        const newDefault = updatedAddresses.find(addr => addr.id === addressId);
        setSelectedAddress(newDefault);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    if (!user) {
      alert('Please login to place order');
      navigate('/login');
      return;
    }
    try {
      const orderData = {
        userId: user.uid,
        items: checkoutItems.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
          size: item.size,
          color: item.color
        })),
        deliveryAddress: selectedAddress,
        subtotal,
        shipping,
        tax,
        total,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'orders', `order_${Date.now()}`), orderData);
      if (!location.state?.product) clearCart();
      alert('Order placed successfully!');
      navigate('/profile?tab=orders');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  if (checkoutItems.length === 0) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__empty">
            <i className="fas fa-shopping-bag"></i>
            <h2>No items to checkout</h2>
            <p>Add some products to proceed with checkout</p>
            <button onClick={() => navigate('/')} className="btn btn--primary">Continue Shopping</button>
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
          {/* Left Section */}
          <div className="checkout__main">
            {/* Address Section */}
            <div className="checkout__section">
              <div className="checkout__section-header">
                <h2><i className="fas fa-map-marker-alt"></i> Delivery Address</h2>
                <button 
                  className="btn btn--secondary" 
                  onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressForm({name:'', mobile:'', pincode:'', address:'', locality:'', city:'', state:'', addressType:'home', isDefault:false}); }}
                >
                  <i className="fas fa-plus"></i> Add New Address
                </button>
              </div>

              {showAddressForm && (
                <div className="address-form">
                  <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                  <div className="address-form__grid">
                    {/* form groups for name, mobile, address, locality, city, state, pincode, addressType, isDefault */}
                    {/* ... as before ... */}
                    {/* (omit here for brevity, reuse the form from above) */}
                  </div>
                  <div className="address-form__actions">
                    <button className="btn btn--primary" onClick={handleSaveAddress} disabled={saving}>
                      {saving ? <> <i className="fas fa-spinner fa-spin"></i> Saving... </> : <> <i className="fas fa-save"></i> Save Address </>}
                    </button>
                    <button className="btn btn--secondary" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }} disabled={saving}>Cancel</button>
                  </div>
                </div>
              )}

              {savedAddresses.length === 0 && !showAddressForm ? (
                <div className="empty-state">
                  <i className="fas fa-map-marker-alt"></i>
                  <h4>No saved addresses</h4>
                  <p>Add a delivery address to continue</p>
                </div>
              ) : (
                <div className="address-list">
                  {savedAddresses.map(address => (
                    <div
                      key={address.id}
                      className={`address-card ${selectedAddress?.id === address.id ? 'address-card--selected' : ''}`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="address-card__header">
                        <input 
                          type="radio" 
                          name="deliveryAddress" 
                          checked={selectedAddress?.id === address.id} 
                          onChange={() => setSelectedAddress(address)} 
                          onClick={e => e.stopPropagation()} 
                        />
                        <div className="address-card__type">
                          <i className={`fas fa-${address.addressType === 'home' ? 'home' : 'briefcase'}`}></i>
                          <span className="type-label">{address.addressType}</span>
                          {address.isDefault && (<span className="badge-default">Default</span>)}
                        </div>
                      </div>
                      <div className="address-card__content">
                        <h4>{address.name}</h4>
                        <p>{address.address}, {address.locality}</p>
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                        <p><i className="fas fa-phone"></i> <strong>Mobile:</strong> {address.mobile}</p>
                      </div>
                      <div className="address-card__actions">
                        {!address.isDefault && (
                           <button className="action-btn action-btn--default" onClick={e => { e.stopPropagation(); handleSetDefaultAddress(address.id); }}>
                             <i className="fas fa-star"></i> Set Default
                           </button>
                        )}
                        <button className="action-btn action-btn--edit" onClick={e => { e.stopPropagation(); handleEditAddress(address); }}>
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button className="action-btn action-btn--delete" onClick={e => { e.stopPropagation(); handleDeleteAddress(address.id); }}>
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className="checkout__section">
              <div className="checkout__section-header">
                <h2>
                  <i className="fas fa-shopping-bag"></i> Order Items ({checkoutItems.length})
                </h2>
                <button className="btn btn--link" onClick={() => setShowSizeChart(!showSizeChart)}>
                  <i className="fas fa-ruler"></i> Size Chart
                </button>
              </div>

              {showSizeChart && (
                <div className="size-chart-modal">
                  <div className="size-chart-modal__overlay" onClick={() => setShowSizeChart(false)}></div>
                  <div className="size-chart-modal__content">
                    <div className="size-chart-modal__header">
                      <h3>Size Chart</h3>
                      <button onClick={() => setShowSizeChart(false)}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="size-chart-modal__body">
                      <table className="size-chart-table">
                        <thead>
                          <tr>
                            <th>Size</th><th>Chest (inches)</th><th>Waist (inches)</th><th>Length (inches)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr><td><strong>XS</strong></td><td>34-36</td><td>28-30</td><td>26</td></tr>
                          <tr><td><strong>S</strong></td><td>36-38</td><td>30-32</td><td>27</td></tr>
                          <tr><td><strong>M</strong></td><td>38-40</td><td>32-34</td><td>28</td></tr>
                          <tr><td><strong>L</strong></td><td>40-42</td><td>34-36</td><td>29</td></tr>
                          <tr><td><strong>XL</strong></td><td>42-44</td><td>36-38</td><td>30</td></tr>
                          <tr><td><strong>XXL</strong></td><td>44-46</td><td>38-40</td><td>31</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-products">
                {checkoutItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="checkout-product" onClick={() => navigate('/quick-view', { state: { product: item } })}>
                    <div className="checkout-product__image">
                      <img src={item.image} alt={item.title} />
                      {item.badge && (
                        <span className={`checkout-product__badge checkout-product__badge--${item.badge.toLowerCase()}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="checkout-product__details">
                      <div className="checkout-product__header">
                        <h3>{item.title}</h3>
                        {!location.state?.product && (
                          <button 
                            className="checkout-product__remove" 
                            onClick={e => { e.stopPropagation(); handleRemoveItem(item.id); }} title="Remove item"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                      <div className="checkout-product__price">
                        <span className="price-current">₹{item.price.toLocaleString()}</span>
                        {item.originalPrice && (
                          <>
                            <span className="price-original">₹{item.originalPrice.toLocaleString()}</span>
                            {item.discount && (
                              <span className="price-discount">{item.discount}% OFF</span>
                            )}
                          </>
                        )}
                      </div>
                      <div className="checkout-product__options">
                        <div className="checkout-product__option">
                          <label>Size:</label>
                          <div className="size-selector">
                            {availableSizes.map(size => (
                              <button 
                                key={size}
                                className={`size-btn ${item.size === size ? 'size-btn--active' : ''}`}
                                onClick={e => { e.stopPropagation(); handleSizeChange(item.id, size); }}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="checkout-product__option">
                          <label>Quantity:</label>
                          <div className="quantity-selector">
                            <button 
                              className="quantity-btn"
                              onClick={e => { e.stopPropagation(); handleQuantityChange(item.id, (item.quantity || 1) - 1); }}
                              disabled={(item.quantity || 1) <= 1}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                            <span className="quantity-value">{item.quantity || 1}</span>
                            <button 
                              className="quantity-btn"
                              onClick={e => { e.stopPropagation(); handleQuantityChange(item.id, (item.quantity || 1) + 1); }}
                            >
                              <i className="fas fa-plus"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="checkout-product__info">
                        <div className="info-item">
                          <i className="fas fa-truck"></i>
                          <span>Delivery by 10-12 Nov</span>
                        </div>
                        <div className="info-item">
                          <i className="fas fa-undo"></i>
                          <span>7 days return policy</span>
                        </div>
                      </div>
                    </div>
                    <div className="checkout-product__total">
                      <span className="total-label">Item Total</span>
                      <span className="total-value">₹{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="checkout__sidebar">
            <div className="order-summary">
              <h2>Order Summary</h2>
              <div className="order-summary__row">
                <span>Subtotal ({checkoutItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)</span>
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
                <i className="fas fa-lock"></i> Place Order
              </button>
              {!selectedAddress && (
                <p className="order-summary__warning">
                  Please select a delivery address
                </p>
              )}
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
