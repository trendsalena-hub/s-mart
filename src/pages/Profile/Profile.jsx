import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useCart } from '../../components/context/CartContext';
import './Profile.scss';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Track admin status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [removingItemId, setRemovingItemId] = useState(null);
  
  const { addToCart } = useCart();
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    dateOfBirth: '',
    gender: ''
  });

  const navigate = useNavigate();

  // Admin UIDs - Add your admin user IDs here
  const adminUIDs = ['PxUS6BooWHVl4X0reKaMyvOueg62']; // Replace with your admin UID

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Check if user is admin
        if (adminUIDs.includes(currentUser.uid)) {
          setIsAdmin(true);
        }
        
        await loadUserProfile(currentUser.uid);
        await loadOrders(currentUser.uid);
        await loadWishlist(currentUser.uid);
        await loadCoupons();
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData(data);
      } else {
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    }
  };

  const loadOrders = async (uid) => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', uid));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const loadWishlist = async (uid) => {
    try {
      const wishlistDoc = await getDoc(doc(db, 'wishlists', uid));
      if (wishlistDoc.exists()) {
        setWishlist(wishlistDoc.data().items || []);
      }
    } catch (err) {
      console.error('Error loading wishlist:', err);
    }
  };

  const loadCoupons = async () => {
    setCoupons([
      { id: 1, code: 'WELCOME10', discount: '10% OFF', description: 'On your first order', expiryDate: '2025-12-31', active: true },
      { id: 2, code: 'SAVE20', discount: '₹200 OFF', description: 'On orders above ₹1000', expiryDate: '2025-12-31', active: true },
      { id: 3, code: 'FREESHIP', discount: 'Free Delivery', description: 'On all orders', expiryDate: '2025-11-30', active: false }
    ]);
  };

  const handleRemoveFromWishlist = async (itemId) => {
    if (!user) return;

    setRemovingItemId(itemId);
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);

      if (wishlistDoc.exists()) {
        const wishlistItems = wishlistDoc.data().items || [];
        const updatedItems = wishlistItems.filter(item => item.id !== itemId);

        await updateDoc(wishlistRef, {
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });

        setWishlist(updatedItems);
        setSuccess('Item removed from wishlist');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleAddToCartFromWishlist = (item) => {
    const product = {
      id: item.id,
      image: item.image,
      title: item.title,
      price: item.price,
      originalPrice: item.originalPrice,
      discount: item.discount,
      badge: item.badge
    };

    addToCart(product);
    setSuccess(`${item.title} added to cart!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      const dataToSave = {
        ...profileData,
        phoneNumber: user.phoneNumber,
        uid: user.uid,
        updatedAt: new Date().toISOString()
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, dataToSave);
      } else {
        await setDoc(userRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }

      setSuccess('Profile saved successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to logout');
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess(`Coupon code ${code} copied!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading) {
    return (
      <div className="profile profile--loading">
        <div className="profile__loader">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__container">
        {/* Header */}
        <div className="profile__header">
          <div className="profile__header-content">
            <div className="profile__avatar">
              <i className="fas fa-user"></i>
              {isAdmin && (
                <span className="profile__admin-badge">
                  <i className="fas fa-shield-alt"></i>
                </span>
              )}
            </div>
            <div className="profile__header-info">
              <h2>
                {profileData.displayName || 'User'}
                {isAdmin && <span className="profile__admin-tag">Admin</span>}
              </h2>
              <p>{user?.phoneNumber || ''}</p>
            </div>
          </div>
          <div className="profile__header-actions">
            {isAdmin && (
              <button 
                className="profile__admin-btn"
                onClick={() => navigate('/admin')}
                title="Go to Admin Dashboard"
              >
                <i className="fas fa-shield-alt"></i>
                Admin Dashboard
              </button>
            )}
            <button 
              className="profile__logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        <div className="profile__content">
          {/* Sidebar Navigation */}
          <aside className="profile__sidebar">
            <nav className="profile__nav">
              <button
                className={`profile__nav-item ${activeTab === 'profile' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user"></i>
                <span>My Profile</span>
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'orders' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <i className="fas fa-shopping-bag"></i>
                <span>My Orders</span>
                {orders.length > 0 && <span className="profile__badge">{orders.length}</span>}
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'wishlist' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <i className="fas fa-heart"></i>
                <span>Wishlist</span>
                {wishlist.length > 0 && <span className="profile__badge">{wishlist.length}</span>}
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'coupons' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                <i className="fas fa-ticket-alt"></i>
                <span>Coupons</span>
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'help' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('help')}
              >
                <i className="fas fa-question-circle"></i>
                <span>Help Centre</span>
              </button>

              {/* Admin Quick Link in Sidebar */}
              {isAdmin && (
                <button
                  className="profile__nav-item profile__nav-item--admin"
                  onClick={() => navigate('/admin')}
                >
                  <i className="fas fa-shield-alt"></i>
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
          </aside>

          {/* Main Content Area - Keep existing code */}
          <main className="profile__main">
            <div className="profile__card">
              {/* Messages */}
              {error && (
                <div className="profile__message profile__message--error">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="profile__message profile__message--success">
                  <i className="fas fa-check-circle"></i>
                  <span>{success}</span>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSave} className="profile__form">
                  <div className="profile__section">
                    <div className="profile__section-header">
                      <h3>Personal Information</h3>
                      {!isEditing && (
                        <button
                          type="button"
                          className="profile__edit-btn"
                          onClick={() => setIsEditing(true)}
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                      )}
                    </div>

                    <div className="profile__form-grid">
                      <div className="profile__form-group">
                        <label htmlFor="displayName">Full Name *</label>
                        <input
                          type="text"
                          id="displayName"
                          name="displayName"
                          value={profileData.displayName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          required
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter your email"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={profileData.dateOfBirth}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="gender">Gender</label>
                        <select
                          id="gender"
                          name="gender"
                          value={profileData.gender}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select gender</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile__section">
                    <h3>Address Information</h3>

                    <div className="profile__form-grid">
                      <div className="profile__form-group profile__form-group--full">
                        <label htmlFor="street">Street Address</label>
                        <input
                          type="text"
                          id="street"
                          name="address.street"
                          value={profileData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter street address"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="city">City</label>
                        <input
                          type="text"
                          id="city"
                          name="address.city"
                          value={profileData.address.city}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter city"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="state">State</label>
                        <input
                          type="text"
                          id="state"
                          name="address.state"
                          value={profileData.address.state}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter state"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="pincode">Pincode</label>
                        <input
                          type="text"
                          id="pincode"
                          name="address.pincode"
                          value={profileData.address.pincode}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter pincode"
                          maxLength="6"
                        />
                      </div>

                      <div className="profile__form-group">
                        <label htmlFor="country">Country</label>
                        <input
                          type="text"
                          id="country"
                          name="address.country"
                          value={profileData.address.country}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="profile__actions">
                      <button
                        type="submit"
                        className="profile__btn profile__btn--primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Save Profile
                          </>
                        )}
                      </button>
                      {!saving && (
                        <button
                          type="button"
                          className="profile__btn profile__btn--secondary"
                          onClick={() => {
                            setIsEditing(false);
                            loadUserProfile(user.uid);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </form>
              )}

              {/* Keep all other tabs (Orders, Wishlist, Coupons, Help) as they were */}
              {/* ... rest of the component code remains the same ... */}
              {activeTab === 'orders' && (
                <div className="orders-section">
                  <h3 className="section-title">My Orders</h3>
                  {orders.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-shopping-bag"></i>
                      <h4>No Orders Yet</h4>
                      <p>Start shopping to see your orders here!</p>
                      <button className="profile__btn profile__btn--primary" onClick={() => navigate('/')}>
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {orders.map((order) => (
                        <div key={order.id} className="order-card">
                          <div className="order-card__header">
                            <div>
                              <span className="order-card__id">Order #{order.id}</span>
                              <span className="order-card__date">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`order-card__status order-card__status--${order.status}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="order-card__body">
                            <p className="order-card__total">Total: ₹{order.total}</p>
                            <p className="order-card__items">{order.items?.length || 0} items</p>
                          </div>
                          <div className="order-card__footer">
                            <button className="order-card__btn">View Details</button>
                            <button className="order-card__btn order-card__btn--secondary">Track Order</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="wishlist-section">
                  <h3 className="section-title">My Wishlist</h3>
                  {wishlist.length === 0 ? (
                    <div className="empty-state">
                      <i className="fas fa-heart"></i>
                      <h4>Your Wishlist is Empty</h4>
                      <p>Save your favorite items to shop later!</p>
                      <button className="profile__btn profile__btn--primary" onClick={() => navigate('/')}>
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="wishlist-grid">
                      {wishlist.map((item) => (
                        <div key={item.id} className="wishlist-card">
                          <img src={item.image} alt={item.title} />
                          {item.badge && (
                            <span className={`wishlist-card__badge wishlist-card__badge--${item.badge.toLowerCase()}`}>
                              {item.badge}
                            </span>
                          )}
                          <h4>{item.title}</h4>
                          <div className="wishlist-card__price-wrapper">
                            <p className="wishlist-card__price">₹{item.price.toLocaleString()}</p>
                            {item.originalPrice && (
                              <p className="wishlist-card__original-price">
                                ₹{item.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="wishlist-card__actions">
                            <button 
                              className="wishlist-card__btn"
                              onClick={() => handleAddToCartFromWishlist(item)}
                            >
                              <i className="fas fa-shopping-cart"></i>
                              Add to Cart
                            </button>
                            <button 
                              className="wishlist-card__btn wishlist-card__btn--remove"
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              disabled={removingItemId === item.id}
                              title="Remove from wishlist"
                            >
                              {removingItemId === item.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coupons' && (
                <div className="coupons-section">
                  <h3 className="section-title">Available Coupons</h3>
                  <div className="coupons-list">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className={`coupon-card ${!coupon.active ? 'coupon-card--expired' : ''}`}>
                        <div className="coupon-card__badge">
                          <i className="fas fa-ticket-alt"></i>
                        </div>
                        <div className="coupon-card__content">
                          <h4 className="coupon-card__code">{coupon.code}</h4>
                          <p className="coupon-card__discount">{coupon.discount}</p>
                          <p className="coupon-card__description">{coupon.description}</p>
                          <p className="coupon-card__expiry">Valid till: {coupon.expiryDate}</p>
                        </div>
                        {coupon.active && (
                          <button className="coupon-card__btn" onClick={() => copyCode(coupon.code)}>
                            Copy Code
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'help' && (
                <div className="help-section">
                  <h3 className="section-title">Help Centre</h3>
                  <div className="help-categories">
                    <div className="help-card">
                      <i className="fas fa-truck"></i>
                      <h4>Track Order</h4>
                      <p>Check your order status and delivery updates</p>
                    </div>
                    <div className="help-card">
                      <i className="fas fa-undo"></i>
                      <h4>Returns & Refunds</h4>
                      <p>Learn about our return policy and process</p>
                    </div>
                    <div className="help-card">
                      <i className="fas fa-credit-card"></i>
                      <h4>Payment Issues</h4>
                      <p>Get help with payment-related queries</p>
                    </div>
                    <div className="help-card">
                      <i className="fas fa-comments"></i>
                      <h4>Live Chat</h4>
                      <p>Chat with our support team</p>
                    </div>
                  </div>

                  <div className="help-contact">
                    <h4>Contact Us</h4>
                    <div className="help-contact__methods">
                      <div className="help-contact__item">
                        <i className="fas fa-envelope"></i>
                        <span>support@alenatrends.com</span>
                      </div>
                      <div className="help-contact__item">
                        <i className="fas fa-phone"></i>
                        <span>+91 9876543210</span>
                      </div>
                      <div className="help-contact__item">
                        <i className="fas fa-clock"></i>
                        <span>Mon-Sat: 9AM - 6PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
