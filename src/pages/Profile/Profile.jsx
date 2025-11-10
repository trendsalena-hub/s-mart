import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCart } from '../../components/context/CartContext';
import './Profile.scss';

// Enhanced default avatar with SVG
const DefaultAvatar = ({ name, size = 80 }) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const colors = ['#c9a86a', '#b89450', '#a8823c'];
  const color = colors[initial.charCodeAt(0) % colors.length];
  
  return (
    <div 
      className="default-avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    >
      <span className="default-avatar__initial">{initial}</span>
      <div className="default-avatar__decoration">
        <div className="default-avatar__ring"></div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const filePickerRef = useRef();
  const mobileMenuRef = useRef();

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
    gender: '',
    role: 'user'
  });

  const navigate = useNavigate();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when tab changes on mobile
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsMobileMenuOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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

  useEffect(() => {
    if (profileData.photoURL) {
      setProfileImageUrl(profileData.photoURL);
    }
  }, [profileData.photoURL]);

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    try {
      const imageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(db, 'users', user.uid), { 
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      });
      setProfileImageUrl(downloadURL);
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload failed', err);
      setError('Failed to upload profile image');
      setTimeout(() => setError(''), 3000);
    }
    setUploading(false);
  };

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData(data);
        const role = data.role || 'user';
        setUserRole(role);
      } else {
        setIsEditing(true);
        setUserRole('user');
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
        role: profileData.role || 'user',
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

  const isAdmin = userRole === 'admin';

  // Mobile navigation items
  const mobileNavItems = [
    { key: 'profile', icon: 'fas fa-user', label: 'Profile' },
    { key: 'orders', icon: 'fas fa-shopping-bag', label: 'Orders', badge: orders.length },
    { key: 'wishlist', icon: 'fas fa-heart', label: 'Wishlist', badge: wishlist.length },
    { key: 'coupons', icon: 'fas fa-ticket-alt', label: 'Coupons' },
    { key: 'help', icon: 'fas fa-question-circle', label: 'Help' },
  ];

  if (loading) {
    return (
      <div className="profile profile--loading">
        <div className="profile__loader">
          <div className="profile__loader-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__container">
        {/* Enhanced Header */}
        <div className="profile__header">
          <div className="profile__header-background"></div>
          <div className="profile__header-content">
            <div className="profile__avatar-section">
              <div className="profile__avatar">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    className="avatar-image"
                    onClick={() => { if (isEditing) filePickerRef.current.click(); }}
                    style={{ cursor: isEditing ? 'pointer' : 'default' }}
                  />
                ) : (
                  <DefaultAvatar name={profileData.displayName} />
                )}
                {isEditing && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      ref={filePickerRef}
                      style={{ display: 'none' }}
                      onChange={handleProfileImageChange}
                      disabled={uploading}
                    />
                    <button
                      type="button"
                      className="profile__edit-photo-btn"
                      onClick={() => filePickerRef.current.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <div className="uploading-spinner">
                          <div className="spinner-dot"></div>
                          <div className="spinner-dot"></div>
                          <div className="spinner-dot"></div>
                        </div>
                      ) : (
                        <>
                          <i className="fas fa-camera"></i>
                          Change Photo
                        </>
                      )}
                    </button>
                  </>
                )}
                {isAdmin && (
                  <span className="profile__admin-badge" title="Administrator">
                    <i className="fas fa-shield-alt"></i>
                  </span>
                )}
              </div>
              <div className="profile__header-info">
                <h2>
                  {profileData.displayName || 'Welcome!'}
                  {isAdmin && <span className="profile__admin-tag">Admin</span>}
                </h2>
                <p className="profile__email">{profileData.email || user?.email}</p>
                <p className="profile__phone">{user?.phoneNumber || 'Add your phone number'}</p>
              </div>
            </div>
            <div className="profile__header-actions">
              {/* Mobile Menu Button */}
              <button 
                className="profile__mobile-menu-btn"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>

              {isAdmin && (
                <button 
                  className="profile__admin-btn"
                  onClick={() => navigate('/admin')}
                >
                  <i className="fas fa-shield-alt"></i>
                  <span className="profile__btn-text">Admin</span>
                </button>
              )}
              <button 
                className="profile__logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="profile__btn-text">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="profile__mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}>
            <div 
              className="profile__mobile-sidebar"
              ref={mobileMenuRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile__mobile-sidebar-header">
                <h3>Menu</h3>
                <button 
                  className="profile__mobile-close"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <nav className="profile__mobile-nav">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.key}
                    className={`profile__mobile-nav-item ${activeTab === item.key ? 'profile__mobile-nav-item--active' : ''}`}
                    onClick={() => setActiveTab(item.key)}
                  >
                    <div className="profile__mobile-nav-icon">
                      <i className={item.icon}></i>
                    </div>
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="profile__mobile-badge">{item.badge}</span>
                    )}
                  </button>
                ))}
                {isAdmin && (
                  <button
                    className="profile__mobile-nav-item profile__mobile-nav-item--admin"
                    onClick={() => navigate('/admin')}
                  >
                    <div className="profile__mobile-nav-icon">
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <span>Admin Panel</span>
                  </button>
                )}
              </nav>
            </div>
          </div>
        )}

        {/* Enhanced Content Area */}
        <div className="profile__content">
          {/* Desktop Sidebar Navigation - Hidden on Mobile */}
          <aside className="profile__sidebar">
            <nav className="profile__nav">
              <button
                className={`profile__nav-item ${activeTab === 'profile' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="profile__nav-icon">
                  <i className="fas fa-user"></i>
                </div>
                <span>My Profile</span>
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'orders' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <div className="profile__nav-icon">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <span>My Orders</span>
                {orders.length > 0 && <span className="profile__badge">{orders.length}</span>}
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'wishlist' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <div className="profile__nav-icon">
                  <i className="fas fa-heart"></i>
                </div>
                <span>Wishlist</span>
                {wishlist.length > 0 && <span className="profile__badge">{wishlist.length}</span>}
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'coupons' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                <div className="profile__nav-icon">
                  <i className="fas fa-ticket-alt"></i>
                </div>
                <span>Coupons</span>
                {coupons.filter(c => c.active).length > 0 && (
                  <span className="profile__badge profile__badge--gold">
                    {coupons.filter(c => c.active).length}
                  </span>
                )}
              </button>
              <button
                className={`profile__nav-item ${activeTab === 'help' ? 'profile__nav-item--active' : ''}`}
                onClick={() => setActiveTab('help')}
              >
                <div className="profile__nav-icon">
                  <i className="fas fa-question-circle"></i>
                </div>
                <span>Help Centre</span>
              </button>
              {isAdmin && (
                <button
                  className="profile__nav-item profile__nav-item--admin"
                  onClick={() => navigate('/admin')}
                >
                  <div className="profile__nav-icon">
                    <i className="fas fa-shield-alt"></i>
                  </div>
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>
          </aside>

          {/* Mobile Bottom Navigation */}
          <nav className="profile__bottom-nav">
            {mobileNavItems.map((item) => (
              <button
                key={item.key}
                className={`profile__bottom-nav-item ${activeTab === item.key ? 'profile__bottom-nav-item--active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <div className="profile__bottom-nav-icon">
                  <i className={item.icon}></i>
                </div>
                <span className="profile__bottom-nav-label">{item.label}</span>
                {item.badge > 0 && (
                  <span className="profile__bottom-nav-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Main Content Area */}
          <main className="profile__main">
            <div className="profile__card">
              {error && (
                <div className="profile__message profile__message--error">
                  <div className="profile__message-icon">
                    <i className="fas fa-exclamation-circle"></i>
                  </div>
                  <span>{error}</span>
                  <button 
                    className="profile__message-close"
                    onClick={() => setError('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
              {success && (
                <div className="profile__message profile__message--success">
                  <div className="profile__message-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <span>{success}</span>
                  <button 
                    className="profile__message-close"
                    onClick={() => setSuccess('')}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSave} className="profile__form">
                  <div className="profile__section">
                    <div className="profile__section-header">
                      <h3>
                        <i className="fas fa-user-circle"></i>
                        Personal Information
                      </h3>
                      {!isEditing && (
                        <button
                          type="button"
                          className="profile__edit-btn"
                          onClick={() => setIsEditing(true)}
                        >
                          <i className="fas fa-edit"></i>
                          Edit Profile
                        </button>
                      )}
                    </div>
                    <div className="profile__form-grid">
                      <div className="profile__form-group">
                        <label htmlFor="displayName">
                          <i className="fas fa-user"></i>
                          Full Name *
                        </label>
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
                        <label htmlFor="email">
                          <i className="fas fa-envelope"></i>
                          Email Address
                        </label>
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
                        <label htmlFor="dateOfBirth">
                          <i className="fas fa-birthday-cake"></i>
                          Date of Birth
                        </label>
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
                        <label htmlFor="gender">
                          <i className="fas fa-venus-mars"></i>
                          Gender
                        </label>
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
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="profile__section">
                    <h3>
                      <i className="fas fa-map-marker-alt"></i>
                      Address Information
                    </h3>
                    <div className="profile__form-grid">
                      <div className="profile__form-group profile__form-group--full">
                        <label htmlFor="street">
                          <i className="fas fa-road"></i>
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="address.street"
                          value={profileData.address.street}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter your street address"
                        />
                      </div>
                      <div className="profile__form-group">
                        <label htmlFor="city">
                          <i className="fas fa-city"></i>
                          City
                        </label>
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
                        <label htmlFor="state">
                          <i className="fas fa-map"></i>
                          State
                        </label>
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
                        <label htmlFor="pincode">
                          <i className="fas fa-mail-bulk"></i>
                          Pincode
                        </label>
                        <input
                          type="text"
                          id="pincode"
                          name="address.pincode"
                          value={profileData.address.pincode}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter pincode"
                          maxLength="6"
                          pattern="[0-9]{6}"
                        />
                      </div>
                      <div className="profile__form-group">
                        <label htmlFor="country">
                          <i className="fas fa-globe"></i>
                          Country
                        </label>
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
                            <div className="button-spinner"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Save Profile
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="profile__btn profile__btn--secondary"
                        onClick={() => {
                          setIsEditing(false);
                          loadUserProfile(user.uid);
                        }}
                        disabled={saving}
                      >
                        <i className="fas fa-times"></i>
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Other tabs remain the same */}
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="orders-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <i className="fas fa-shopping-bag"></i>
                      My Orders
                    </h3>
                    <div className="section-subtitle">Track and manage your orders</div>
                  </div>
                  {orders.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state__icon">
                        <i className="fas fa-shopping-bag"></i>
                      </div>
                      <h4>No Orders Yet</h4>
                      <p>Start shopping to see your orders here!</p>
                      <button className="profile__btn profile__btn--primary" onClick={() => navigate('/')}>
                        <i className="fas fa-shopping-cart"></i>
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {orders.map((order) => (
                        <div key={order.id} className="order-card">
                          <div className="order-card__header">
                            <div className="order-card__info">
                              <span className="order-card__id">Order #{order.id.slice(-8)}</span>
                              <span className="order-card__date">
                                <i className="fas fa-calendar"></i>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <span className={`order-card__status order-card__status--${order.status}`}>
                              <i className="fas fa-circle"></i>
                              {order.status}
                            </span>
                          </div>
                          <div className="order-card__body">
                            <div className="order-card__total">
                              <i className="fas fa-indian-rupee-sign"></i>
                              Total: ₹{order.total?.toLocaleString() || '0'}
                            </div>
                            <div className="order-card__items">
                              <i className="fas fa-cube"></i>
                              {order.items?.length || 0} items
                            </div>
                          </div>
                          <div className="order-card__footer">
                            <button className="order-card__btn order-card__btn--primary">
                              <i className="fas fa-eye"></i>
                              View Details
                            </button>
                            <button className="order-card__btn order-card__btn--secondary">
                              <i className="fas fa-shipping-fast"></i>
                              Track Order
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div className="wishlist-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <i className="fas fa-heart"></i>
                      My Wishlist
                    </h3>
                    <div className="section-subtitle">Your favorite items</div>
                  </div>
                  {wishlist.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state__icon">
                        <i className="fas fa-heart"></i>
                      </div>
                      <h4>Your Wishlist is Empty</h4>
                      <p>Save your favorite items to shop later!</p>
                      <button className="profile__btn profile__btn--primary" onClick={() => navigate('/')}>
                        <i className="fas fa-search"></i>
                        Browse Products
                      </button>
                    </div>
                  ) : (
                    <div className="wishlist-grid">
                      {wishlist.map((item) => (
                        <div key={item.id} className="wishlist-card">
                          <div className="wishlist-card__image">
                            <img src={item.image} alt={item.title} />
                            {item.badge && (
                              <span className={`wishlist-card__badge wishlist-card__badge--${item.badge.toLowerCase()}`}>
                                {item.badge}
                              </span>
                            )}
                            <button 
                              className="wishlist-card__wishlist-btn wishlist-card__wishlist-btn--active"
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              disabled={removingItemId === item.id}
                              title="Remove from wishlist"
                            >
                              {removingItemId === item.id ? (
                                <div className="wishlist-spinner"></div>
                              ) : (
                                <i className="fas fa-heart"></i>
                              )}
                            </button>
                          </div>
                          <div className="wishlist-card__content">
                            <h4 className="wishlist-card__title">{item.title}</h4>
                            <div className="wishlist-card__price-wrapper">
                              <p className="wishlist-card__price">₹{item.price?.toLocaleString()}</p>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <p className="wishlist-card__original-price">
                                  ₹{item.originalPrice.toLocaleString()}
                                </p>
                              )}
                              {item.discount && (
                                <span className="wishlist-card__discount">{item.discount}% OFF</span>
                              )}
                            </div>
                            <div className="wishlist-card__actions">
                              <button 
                                className="wishlist-card__btn wishlist-card__btn--primary"
                                onClick={() => handleAddToCartFromWishlist(item)}
                              >
                                <i className="fas fa-shopping-cart"></i>
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Coupons Tab */}
              {activeTab === 'coupons' && (
                <div className="coupons-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <i className="fas fa-ticket-alt"></i>
                      Available Coupons
                    </h3>
                    <div className="section-subtitle">Save more with these offers</div>
                  </div>
                  <div className="coupons-list">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className={`coupon-card ${!coupon.active ? 'coupon-card--expired' : ''}`}>
                        <div className="coupon-card__badge">
                          <i className="fas fa-tag"></i>
                        </div>
                        <div className="coupon-card__content">
                          <h4 className="coupon-card__code">{coupon.code}</h4>
                          <p className="coupon-card__discount">{coupon.discount}</p>
                          <p className="coupon-card__description">{coupon.description}</p>
                          <p className="coupon-card__expiry">
                            <i className="fas fa-clock"></i>
                            Valid till: {coupon.expiryDate}
                          </p>
                        </div>
                        {coupon.active ? (
                          <button 
                            className="coupon-card__btn"
                            onClick={() => copyCode(coupon.code)}
                          >
                            <i className="fas fa-copy"></i>
                            Copy Code
                          </button>
                        ) : (
                          <span className="coupon-card__expired-text">Expired</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Help Tab */}
              {activeTab === 'help' && (
                <div className="help-section">
                  <div className="section-header">
                    <h3 className="section-title">
                      <i className="fas fa-question-circle"></i>
                      Help Centre
                    </h3>
                    <div className="section-subtitle">We're here to help you</div>
                  </div>
                  <div className="help-categories">
                    <div className="help-card">
                      <div className="help-card__icon">
                        <i className="fas fa-truck"></i>
                      </div>
                      <h4>Track Order</h4>
                      <p>Check your order status and delivery updates</p>
                      <button className="help-card__btn">Learn More</button>
                    </div>
                    <div className="help-card">
                      <div className="help-card__icon">
                        <i className="fas fa-undo"></i>
                      </div>
                      <h4>Returns & Refunds</h4>
                      <p>Learn about our return policy and process</p>
                      <button className="help-card__btn">Learn More</button>
                    </div>
                    <div className="help-card">
                      <div className="help-card__icon">
                        <i className="fas fa-credit-card"></i>
                      </div>
                      <h4>Payment Issues</h4>
                      <p>Get help with payment-related queries</p>
                      <button className="help-card__btn">Learn More</button>
                    </div>
                    <div className="help-card">
                      <div className="help-card__icon">
                        <i className="fas fa-comments"></i>
                      </div>
                      <h4>Live Chat</h4>
                      <p>Chat with our support team</p>
                      <button className="help-card__btn">Start Chat</button>
                    </div>
                  </div>
                  <div className="help-contact">
                    <h4 className="help-contact__title">
                      <i className="fas fa-headset"></i>
                      Contact Us
                    </h4>
                    <div className="help-contact__methods">
                      <div className="help-contact__item">
                        <div className="help-contact__icon">
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="help-contact__info">
                          <span className="help-contact__label">Email</span>
                          <span className="help-contact__value">support@alenatrends.com</span>
                        </div>
                      </div>
                      <div className="help-contact__item">
                        <div className="help-contact__icon">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="help-contact__info">
                          <span className="help-contact__label">Phone</span>
                          <span className="help-contact__value">+91 9876543210</span>
                        </div>
                      </div>
                      <div className="help-contact__item">
                        <div className="help-contact__icon">
                          <i className="fas fa-clock"></i>
                        </div>
                        <div className="help-contact__info">
                          <span className="help-contact__label">Working Hours</span>
                          <span className="help-contact__value">Mon-Sat: 9AM - 6PM</span>
                        </div>
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