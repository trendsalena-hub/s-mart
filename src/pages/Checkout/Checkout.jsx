import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config.js'; // FIX: Corrected path
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot,
  collection,
  addDoc 
} from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../../components/context/CartContext.jsx'; // FIX: Corrected path
import './Checkout.scss';


// === SIMPLIFIED PRICING LOGIC FUNCTIONS ===

/**
 * Checks if a product has a regular discount (originalPrice > price).
 * @param {object} product - The product object.
 * @returns {boolean}
 */
const hasDiscount = (product) => {
  return product?.originalPrice && product.originalPrice > product.price;
};

/**
 * Calculates the regular discount percentage.
 * @param {object} product - The product object.
 * @returns {number} - The discount percentage.
 */
const calculateDiscountPercentage = (product) => {
  if (!hasDiscount(product)) return 0;
  if (product.discount) return product.discount;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
};

/**
 * Calculates the total price for a product, including quantity.
 * @param {object} product - The product object.
 * @param {number} quantity - The number of items.
 * @returns {number} - The total price.
 */
const calculateTotalPrice = (product, quantity = 1) => {
  return product.price * (quantity || 1);
};

// === END OF PRICING LOGIC ===

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
  const [placingOrder, setPlacingOrder] = useState(false); 
  const [showSizeChart, setShowSizeChart] = useState(false);
  
  // === NEW: State for payment method ===
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'

  // === SIMPLIFIED PRICING STATE ===
  const [subtotal, setSubtotal] = useState(0); // Full price (MSRP)
  const [totalDiscount, setTotalDiscount] = useState(0); // Regular discounts
  const [shipping, setShipping] = useState(50);
  
  // === NEW: States for COD fees ===
  const [codCharge, setCodCharge] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);
  const [total, setTotal] = useState(0); // Final price
  
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

    setLoading(true);
    const addressesRef = doc(db, 'addresses', user.uid);
    const unsubscribe = onSnapshot(addressesRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addressesArray = data.addresses || [];
        setSavedAddresses(addressesArray);

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
        quantity: location.state.product.quantity || 1,
        size: location.state.product.size || (location.state.product.sizes?.[0] || 'M'),
        color: location.state.product.color || (location.state.product.colors?.[0] || 'Default')
      };
      setCheckoutItems([product]);
    } else {
      const itemsWithDefaults = cartItems.map(item => ({
        ...item,
        size: item.size || (item.sizes?.[0] || 'M'),
        color: item.color || (item.colors?.[0] || 'Default')
      }));
      setCheckoutItems(itemsWithDefaults);
    }
  }, [location.state, cartItems]);

  // === UPDATED: Calculate totals (with payment logic) ===
  useEffect(() => {
    let newSubtotal = 0; // Based on originalPrice or price
    let newTotalDiscount = 0; // Regular price vs originalPrice

    checkoutItems.forEach(item => {
      const basePrice = item.originalPrice || item.price;
      newSubtotal += basePrice * (item.quantity || 1);
      
      if (hasDiscount(item)) {
        newTotalDiscount += (item.originalPrice - item.price) * (item.quantity || 1);
      }
    });

    const priceAfterDiscounts = newSubtotal - newTotalDiscount;
    // FIX: Calculate shipping based on price *after* discounts
    const calculatedShipping = priceAfterDiscounts > 1000 ? 0 : 50;
    
    let newTotal = priceAfterDiscounts + calculatedShipping;
    let newCodCharge = 0;
    let newSecurityDeposit = 0;

    if (paymentMethod === 'cod') {
      newCodCharge = 9;
      newSecurityDeposit = 50;
      newTotal = newTotal + newCodCharge; // Security deposit is paid online, not added to total due
    }

    setSubtotal(newSubtotal);
    setTotalDiscount(newTotalDiscount);
    setShipping(calculatedShipping);
    setCodCharge(newCodCharge);
    setSecurityDeposit(newSecurityDeposit);
    setTotal(newTotal > 0 ? newTotal : 0);

  }, [checkoutItems, paymentMethod]); // Recalculate when items or payment method change

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
      if (window.confirm('Cancel "Buy Now"? You will be returned to the previous page.')) {
        navigate(-1);
      }
      return;
    }
    if (window.confirm('Remove this item from checkout?')) {
      removeFromCart(itemId);
    }
  };

  // Manage form input for address
  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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

      await setDoc(addressesRef, { 
        userId: user.uid, 
        addresses: updatedAddresses, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });

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
        await setDoc(addressesRef, { 
          userId: user.uid, 
          addresses: updatedAddresses, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
        
        if (selectedAddress?.id === addressId) {
          setSelectedAddress(updatedAddresses.find(addr => addr.isDefault) || updatedAddresses[0] || null);
        }
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
        
        await setDoc(addressesRef, { 
          userId: user.uid, 
          addresses: updatedAddresses, 
          updatedAt: new Date().toISOString() 
        }, { merge: true });
        
        const newDefault = updatedAddresses.find(addr => addr.id === addressId);
        setSelectedAddress(newDefault);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      alert('Failed to set default address');
    }
  };


  // === UPDATED: Renamed to "Proceed to Payment" ===
  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
    if (!user) {
      alert('Please login to place order');
      navigate('/login');
      return;
    }

    setPlacingOrder(true); // Show spinner on button

    // Determine amount to pay online
    const amountToPayOnline = paymentMethod === 'cod' ? securityDeposit : total;
    
    // This is the object that will be saved to Firestore *after* payment
    const orderData = {
      userId: user.uid,
      items: checkoutItems.map(item => ({
        id: item.id,
        title: item.title,
        price: item.price, // Use the regular price
        originalPrice: item.originalPrice || item.price,
        quantity: item.quantity || 1,
        image: item.image,
        size: item.size,
        color: item.color,
      })),
      deliveryAddress: selectedAddress,
      
      // Save pricing details
      subtotal: subtotal,
      shipping: shipping,
      discount: totalDiscount,
      codCharge: codCharge,
      securityDepositPaid: paymentMethod === 'cod' ? securityDeposit : 0,
      total: total,
      
      paymentMethod: paymentMethod,
      // Amount to be paid on delivery
      amountDue: paymentMethod === 'cod' ? total - securityDeposit : 0,
      // Amount paid online
      amountPaid: amountToPayOnline,
      
      status: 'pending',
      paymentStatus: 'pending', // This will be updated by the payment page
      createdAt: new Date().toISOString()
    };

    // Navigate to the new payment page, passing all data
    navigate('/payment', { 
      state: { 
        orderData: orderData,
        amountToPay: amountToPayOnline,
        isCod: paymentMethod === 'cod',
        isBuyNow: !!location.state?.product // Flag to clear cart or not
      } 
    });
  };


  if (loading || !user) { // Wait for user to be loaded
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
                  onClick={() => { 
                    setShowAddressForm(true); 
                    setEditingAddress(null); 
                    setAddressForm({
                      name:'', 
                      mobile:'', 
                      pincode:'', 
                      address:'', 
                      locality:'', 
                      city:'', 
                      state:'', 
                      addressType:'home', 
                      isDefault:false
                    }); 
                  }}
                >
                  <i className="fas fa-plus"></i> Add New Address
                </button>
              </div>

              {showAddressForm && (
                <div className="address-form">
                  <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                  <div className="address-form__grid">
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        value={addressForm.name}
                        onChange={handleAddressChange}
                        placeholder="Full Name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="mobile">Mobile Number *</label>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        className="form-control"
                        value={addressForm.mobile}
                        onChange={handleAddressChange}
                        placeholder="10-digit Mobile Number"
                        maxLength="10"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pincode">Pincode *</label>
                      <input
                        type="text"
                        id="pincode"
                        name="pincode"
                        className="form-control"
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        placeholder="Pincode"
                        maxLength="6"
                        required
                      />
                    </div>

                    <div className="form-group form-group--full">
                      <label htmlFor="address">Address (House No., Building, Street) *</label>
                      <textarea
                        id="address"
                        name="address"
                        className="form-control"
                        value={addressForm.address}
                        onChange={handleAddressChange}
                        placeholder="House no., street, landmark"
                        rows="3"
                        required
                      ></textarea>
                    </div>

                    <div className="form-group">
                      <label htmlFor="locality">Locality *</label>
                      <input
                        type="text"
                        id="locality"
                        name="locality"
                        className="form-control"
                        value={addressForm.locality}
                        onChange={handleAddressChange}
                        placeholder="Locality"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">City/District *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        className="form-control"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        placeholder="City or District"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="state">State *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        className="form-control"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        placeholder="State"
                        required
                      />
                    </div>

                    <div className="form-group form-group--full">
                      <label>Address Type *</label>
                      <div className="address-type-options">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="addressType"
                            value="home"
                            checked={addressForm.addressType === 'home'}
                            onChange={handleAddressChange}
                          />
                          <span><i className="fas fa-home"></i> Home</span>
                        </label>
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="addressType"
                            value="work"
                            checked={addressForm.addressType === 'work'}
                            onChange={handleAddressChange}
                          />
                          <span><i className="fas fa-briefcase"></i> Work</span>
                        </label>
                      </div>
                    </div>

                    <div className="form-group form-group--full">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleAddressChange}
                        />
                        <span>Set as default address</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="address-form__actions">
                    <button 
                      className="btn btn--primary" 
                      onClick={handleSaveAddress} 
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i> Save Address
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn--secondary" 
                      onClick={() => { 
                        setShowAddressForm(false); 
                        setEditingAddress(null); 
                      }} 
                      disabled={saving}
                    >
                      Cancel
                    </button>
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
                           <button 
                             className="action-btn action-btn--default" 
                             onClick={e => { 
                               e.stopPropagation(); 
                               handleSetDefaultAddress(address.id); 
                             }}
                           >
                             <i className="fas fa-star"></i> Set Default
                           </button>
                        )}
                        <button 
                          className="action-btn action-btn--edit" 
                          onClick={e => { 
                            e.stopPropagation(); 
                            handleEditAddress(address); 
                          }}
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        <button 
                          className="action-btn action-btn--delete" 
                          onClick={e => { 
                            e.stopPropagation(); 
                            handleDeleteAddress(address.id); 
                          }}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* === NEW: Payment Method Section === */}
            <div className="checkout__section">
              <div className="checkout__section-header">
                <h2><i className="fas fa-credit-card"></i> Payment Method</h2>
              </div>
              <div className="payment-options">
                {/* Pay Online Option */}
                <div 
                  className={`payment-option ${paymentMethod === 'online' ? 'payment-option--selected' : ''}`}
                  onClick={() => setPaymentMethod('online')}
                >
                  <div className="payment-option__header">
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      value="online"
                      checked={paymentMethod === 'online'} 
                      onChange={() => setPaymentMethod('online')}
                    />
                    <label htmlFor="online">
                      <i className="fas fa-shield-alt"></i>
                      Pay Online
                    </label>
                    <div className="payment-option__icons">
                      <img src="https://placehold.co/40x25/3498db/fff?text=R" alt="Razorpay" />
                      <img src="https://placehold.co/40x25/2c3e50/fff?text=P" alt="Paytm" />
                    </div>
                  </div>
                  <p className="payment-option__description">
                    Pay with UPI, Credit/Debit Card, Net Banking.
                  </p>
                </div>
                
                {/* Cash on Delivery Option */}
                <div 
                  className={`payment-option ${paymentMethod === 'cod' ? 'payment-option--selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="payment-option__header">
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <label htmlFor="cod">
                      <i className="fas fa-hand-holding-usd"></i>
                      Cash on Delivery (COD)
                    </label>
                  </div>
                  <p className="payment-option__description">
                    Pay a <strong>₹50</strong> security deposit online. The rest is payable on delivery.
                    A <strong>₹9</strong> COD fee applies.
                  </p>
                </div>
              </div>
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
                            <th>Size</th>
                            <th>Chest (inches)</th>
                            <th>Waist (inches)</th>
                            <th>Length (inches)</th>
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
                  <div 
                    key={`${item.id}-${index}`} 
                    className="checkout-product" 
                    onClick={() => navigate('/quick-view', { state: { product: item } })}
                  >
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
                        <button 
                          className="checkout-product__remove" 
                          onClick={e => { 
                            e.stopPropagation(); 
                            handleRemoveItem(item.id); 
                          }} 
                          title="Remove item"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      
                      {/* Simplified Price Display */}
                      <div className="checkout-product__price">
                        <span className="price-current">₹{item.price.toLocaleString()}</span>
                        {hasDiscount(item) && (
                          <>
                            <span className="price-original">₹{item.originalPrice.toLocaleString()}</span>
                            <span className="price-discount">{calculateDiscountPercentage(item)}% OFF</span>
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
                                onClick={e => { 
                                  e.stopPropagation(); 
                                  handleSizeChange(item.id, size); 
                                }}
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
                              onClick={e => { 
                                e.stopPropagation(); 
                                handleQuantityChange(item.id, (item.quantity || 1) - 1); 
                              }}
                              disabled={(item.quantity || 1) <= 1}
                            >
                              <i className="fas fa-minus"></i>
                            </button>
                            <span className="quantity-value">{item.quantity || 1}</span>
                            <button 
                              className="quantity-btn"
                              onClick={e => { 
                                e.stopPropagation(); 
                                handleQuantityChange(item.id, (item.quantity || 1) + 1); 
                              }}
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
                      <span className="total-value">₹{calculateTotalPrice(item, item.quantity || 1).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="checkout__sidebar">
            {/* === UPDATED: Order Summary with COD logic === */}
            <div className="order-summary">
              <h2>Order Summary</h2>
              <div className="order-summary__row">
                <span>Subtotal ({checkoutItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items)</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              
              {totalDiscount > 0 && (
                <div className="order-summary__row order-summary__info--success">
                  <i className="fas fa-tag"></i>
                  <span>Product Discounts</span>
                  <span>- ₹{totalDiscount.toLocaleString()}</span>
                </div>
              )}
              
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

              {/* Show COD Charge if selected */}
              {paymentMethod === 'cod' && (
                <div className="order-summary__row order-summary__row--cod-fee">
                  <span>COD Handling Fee</span>
                  <span>+ ₹{codCharge.toLocaleString()}</span>
                </div>
              )}
              
              <div className="order-summary__divider"></div>
              
              <div className="order-summary__row order-summary__row--total">
                <span>Total Amount</span>
                <span>₹{total.toLocaleString()}</span>
              </div>

              {/* Show payment breakdown */}
              {paymentMethod === 'online' ? (
                <div className="order-summary__row order-summary__info--offer">
                  <span>Amount to Pay Online</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              ) : (
                <>
                  <div className="order-summary__row order-summary__info--offer">
                    <span>Security Deposit (Pay Online)</span>
                    <span>- ₹{securityDeposit.toLocaleString()}</span>
                  </div>
                  <div className="order-summary__row order-summary__row--total">
                    <span>Amount Payable on Delivery</span>
                    <span>₹{(total - securityDeposit).toLocaleString()}</span>
                  </div>
                </>
              )}
              
              <button 
                className="order-summary__place-order" 
                onClick={handleProceedToPayment} 
                disabled={!selectedAddress || placingOrder}
              >
                {placingOrder ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <i className="fas fa-lock"></i>
                    {paymentMethod === 'cod' ? `Pay ₹${securityDeposit} Security Deposit` : `Proceed to Pay ₹${total.toLocaleString()}`}
                  </>
                )}
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