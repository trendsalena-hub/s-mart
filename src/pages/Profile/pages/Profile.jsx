import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../../components/context/AuthContext.jsx"; 
import { auth, db, storage } from "../../../firebase/config.js"; 
import { signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp, onSnapshot } from 'firebase/firestore'; // 1. Import onSnapshot
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCart } from "../../../components/context/CartContext.jsx"; 

// Layout Components
import ProfileHeader from "../components/profile/ProfileHeader.jsx";
import ProfileSidebar from "../components/profile/ProfileSidebar.jsx";

// Tabs
import ProfileTab from "../components/profile/tabs/ProfileTab.jsx";
import OrdersTab from "../components/profile/tabs/OrdersTab.jsx";
import WishlistTab from "../components/profile/tabs/WishlistTab.jsx";
import CouponsTab from "../components/profile/tabs/CouponsTab.jsx";
import HelpTab from "../components/profile/tabs/HelpTab.jsx";

import "./Profile.scss";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [coupons, setCoupons] = useState([]); 
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  // FIX: Removed duplicate coupons state line

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
    role: 'user',
    photoURL: ''
  });

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user: authUser, loading: authLoading } = useAuth(); 

  useEffect(() => {
    let unsubscribeCoupons = () => {}; // 2. Create a placeholder for the listener

    if (!authLoading) {
      if (authUser) {
        setUser(authUser);
        const loadAllData = async () => {
          setLoading(true);
          await loadUserProfile(authUser.uid);
          await loadOrders(authUser.uid);
          await loadWishlist(authUser.uid);
          // We will load coupons using the listener
          setLoading(false);
        };
        loadAllData();

        // === 3. SET UP REAL-TIME COUPON LISTENER ===
        const couponsRef = collection(db, 'coupons');
        const now = Timestamp.now();
        const q = query(
          couponsRef,
          where('isActive', '==', true),
          where('expiryDate', '>', now),
          orderBy('expiryDate', 'asc') 
        );
        
        // onSnapshot returns an unsubscribe function
        unsubscribeCoupons = onSnapshot(q, (querySnapshot) => {
          const activeCoupons = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCoupons(activeCoupons);
        }, (err) => {
           console.error("Error loading coupons:", err);
           // You could set an error state here
        });

      } else {
        navigate('/login');
      }
    }
    
    // 4. Return the cleanup function
    return () => {
      unsubscribeCoupons(); // This detaches the listener when the component unmounts
    };
  }, [authUser, authLoading, navigate]);

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData(data);
        setUserRole(data.role || 'user');
      } else {
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
      const q = query(ordersRef, where('userId', '==', uid), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  const handleOrderUpdate = () => {
    if (user) {
      loadOrders(user.uid);
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

  // 5. We no longer need the old loadCoupons() function as it's handled in useEffect

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to logout');
    }
  };

  const handleProfileUpdate = async (updatedData) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const dataToSave = {
        ...updatedData,
        phoneNumber: user.phoneNumber,
        uid: user.uid,
        role: updatedData.role || 'user',
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
      setProfileData(updatedData);
      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      return true;
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
      return false;
    }
  };

  const handleImageUpload = async (file) => {
    if (!user) return false;
    try {
      const imageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString(),
      });
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      setSuccess('Profile image updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      return downloadURL;
    } catch (err) {
      console.error('Upload failed', err);
      setError('Failed to upload profile image');
      setTimeout(() => setError(''), 3000);
      return false;
    }
  };

  const handleRemoveFromWishlist = async (itemId) => {
    if (!user) return false;
    try {
      const wishlistRef = doc(db, 'wishlists', user.uid);
      const wishlistDoc = await getDoc(wishlistRef);
      if (wishlistDoc.exists()) {
        const updatedItems = wishlistDoc.data().items.filter(item => item.id !== itemId);
        await updateDoc(wishlistRef, {
          items: updatedItems,
          updatedAt: new Date().toISOString()
        });
        setWishlist(updatedItems);
        setSuccess('Item removed from wishlist');
        setTimeout(() => setSuccess(''), 3000);
        return true;
      }
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError('Failed to remove item from wishlist');
      setTimeout(() => setError(''), 3000);
      return false;
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

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess(`Coupon code ${code} copied!`);
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleRemoveProfileImage = async () => {
    if (!user || !profileData.photoURL) return;
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setLoading(true);
    try {
      await updateProfile(user, { photoURL: null });
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoURL: '', updatedAt: new Date().toISOString() });
      setProfileData(prev => ({ ...prev, photoURL: '' }));
      setSuccess('Profile image removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to remove profile image', error);
      setError('Failed to remove profile image. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowMobileSidebar(false); // Close sidebar when tab is selected
  };

  const isAdmin = userRole === 'admin';

  if (loading || authLoading) { 
    return <div style={{ padding: '3em', textAlign: 'center', color: '#997629' }}>Loading your profile...</div>;
  }

  const renderStatus = () => {
    if (error) return <div style={{ color: 'crimson', fontWeight: 600, marginBottom: 18 }}>{error}</div>;
    if (success) return <div style={{ color: 'seagreen', fontWeight: 600, marginBottom: 18 }}>{success}</div>;
    return null;
  };

  return (
    <div className="profile-page">
      <ProfileHeader
        user={user}
        profileData={profileData}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onImageUpload={handleImageUpload}
        onRemoveImage={handleRemoveProfileImage}
        onNavigate={navigate}
        onError={setError}
        onSuccess={setSuccess}
        showMobileSidebar={showMobileSidebar}
        onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
      />

      <div className="profile-page__layout">
        {showMobileSidebar && (
          <div 
            className="profile-page__overlay"
            onClick={() => setShowMobileSidebar(false)}
            role="presentation"
          />
        )}

        <aside className={`profile-sidebar-wrapper ${showMobileSidebar ? 'profile-sidebar-wrapper--open' : 'profile-sidebar-wrapper--closed'}`}>
          <ProfileSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            ordersCount={orders.length}
            wishlistCount={wishlist.length}
            couponsCount={coupons.length} // This will now be live
            isAdmin={isAdmin}
            onNavigate={navigate}
          />
        </aside>

        <main className="profile-main">
          <div className="profile-page__card">
            {renderStatus()}
            {activeTab === 'profile' && (
              <ProfileTab
                profileData={profileData}
                user={user}
                onProfileUpdate={handleProfileUpdate}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveProfileImage}
                onError={setError}
                onSuccess={setSuccess}
              />
            )}
            
            {activeTab === 'orders' && (
              <OrdersTab 
                orders={orders} 
                onNavigate={navigate} 
                onOrderUpdate={handleOrderUpdate} 
              />
            )}

            {activeTab === 'wishlist' && (
              <WishlistTab
                wishlist={wishlist}
                onRemoveFromWishlist={handleRemoveFromWishlist}
                onAddToCart={handleAddToCartFromWishlist}
                onNavigate={navigate}
                onError={setError}
                onSuccess={setSuccess}
              />
            )}
            
            {activeTab === 'coupons' && <CouponsTab coupons={coupons} onCopyCode={copyCouponCode} onError={setError} onSuccess={setSuccess} />}
            {activeTab === 'help' && <HelpTab />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;