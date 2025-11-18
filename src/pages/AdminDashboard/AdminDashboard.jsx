import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config.js';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AddProduct from './components/AddProduct/AddProduct.jsx';
import AllProducts from './components/AllProducts/AllProducts.jsx';
import BannerSettings from './components/BannerSettings/BannerSettings.jsx';
import ContactMessages from './components/ContactMessages/ContactMessages.jsx';
import UserOrders from './components/UserOrders/UserOrders.jsx';
import ManageCoupons from './components/ManageCoupons/ManageCoupons.jsx';
import ManageBlog from './components/ManageBlog/ManageBlog.jsx'; // 1. Import new component
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user-orders'); 
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productToEdit, setProductToEdit] = useState(null);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true); 

  const [contacts, setContacts] = useState([]);
  
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);

  // 2. Add state for Blog Posts
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role || 'user';
            setUserRole(role);
            
            if (role !== 'admin') {
              setError('Access denied: Admin only');
              setTimeout(() => navigate('/'), 3000);
            } else {
              // Load all admin data
              await loadProducts();
              await loadOrders(); 
              await loadCoupons();
              await loadBlogPosts(); // 3. Load blog posts on mount
            }
          } else {
            setError('User profile not found');
            setTimeout(() => navigate('/'), 3000);
          }
        } catch (err) {
          console.error('Error checking user role:', err);
          setError('Failed to verify admin access');
          setTimeout(() => navigate('/'), 3000);
        }
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);
  
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadCoupons = async () => {
    setCouponsLoading(true);
    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const couponsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCoupons(couponsData);
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError('Failed to load coupons');
    } finally {
      setCouponsLoading(false);
    }
  };

  // 4. Add loadBlogPosts function
  const loadBlogPosts = async () => {
    setBlogLoading(true);
    try {
      const postsRef = collection(db, 'blogPosts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlogPosts(postsData);
    } catch (err) {
      console.error('Error loading blog posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setBlogLoading(false);
    }
  };

  const handleAddNewProduct = () => {
    setProductToEdit(null);
    setActiveTab('add-product');
    setSidebarOpen(false);
  };

  const handleEditProduct = (product) => {
    setProductToEdit(product);
    setActiveTab('add-product');
    setSidebarOpen(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  if (loading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="admin-dashboard__loader">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="admin-dashboard__error-page">
        <i className="fas fa-shield-alt"></i>
        <h2>Access Denied</h2>
        <p>{error || 'You do not have permission to access this page.'}</p>
        <button 
          onClick={() => navigate('/')}
          className="admin-dashboard__error-btn"
        >
          <i className="fas fa-home"></i>
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        {/* Header */}
        <div className="admin-dashboard__header">
          <div className="admin-dashboard__header-content">
            <button 
              className="admin-dashboard__menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <i className={`fas ${sidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
            <div>
              <h1>
                <i className="fas fa-shield-alt"></i>
                Admin Dashboard
              </h1>
              <p>Manage your store</p>
            </div>
          </div>
          <button 
            className="admin-dashboard__back-btn"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-home"></i>
            <span>Back to Store</span>
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="admin-dashboard__message admin-dashboard__message--success">
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
            <button onClick={clearMessages} className="admin-dashboard__message-close">×</button>
          </div>
        )}
        {error && (
          <div className="admin-dashboard__message admin-dashboard__message--error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
            <button onClick={clearMessages} className="admin-dashboard__message-close">×</button>
          </div>
        )}

        <div className="admin-dashboard__content">
          {/* Sidebar Navigation */}
          <aside className={`admin-dashboard__sidebar ${sidebarOpen ? 'admin-dashboard__sidebar--open' : ''}`}>
            <nav className="admin-dashboard__nav">
              
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'user-orders' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('user-orders')}
              >
                <i className="fas fa-shopping-bag"></i>
                <span>User Orders</span>
                {orders.filter(o => o.status === 'pending').length > 0 && (
                   <span className="admin-dashboard__badge admin-dashboard__badge--alert">
                    {orders.filter(o => o.status === 'pending').length}
                  </span>
                )}
              </button>
              
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'products' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('products')}
              >
                <i className="fas fa-box"></i>
                <span>All Products</span>
                <span className="admin-dashboard__badge">{products.length}</span>
              </button>
              
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'add-product' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={handleAddNewProduct}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Add Product</span>
              </button>

              <button
                className={`admin-dashboard__nav-item ${activeTab === 'coupons' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('coupons')}
              >
                <i className="fas fa-tags"></i>
                <span>Manage Coupons</span>
                <span className="admin-dashboard__badge">{coupons.length}</span>
              </button>

              {/* 5. Add "Blog Posts" to navigation */}
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'blog' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('blog')}
              >
                <i className="fas fa-file-alt"></i>
                <span>Blog Posts</span>
                <span className="admin-dashboard__badge">{blogPosts.length}</span>
              </button>

              <button
                className={`admin-dashboard__nav-item ${activeTab === 'banner' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('banner')}
              >
                <i className="fas fa-bullhorn"></i>
                <span>Banner Settings</span>
              </button>
              
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'contacts' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('contacts')}
              >
                <i className="fas fa-envelope"></i>
                <span>Contact Messages</span>
                {contacts.filter(c => c.status === 'new').length > 0 && (
                  <span className="admin-dashboard__badge admin-dashboard__badge--alert">
                    {contacts.filter(c => c.status === 'new').length}
                  </span>
                )}
              </button>
            </nav>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div 
              className="admin-dashboard__overlay"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          {/* Main Content */}
          <main className="admin-dashboard__main">
            {activeTab === 'user-orders' && (
              <UserOrders
                orders={orders}
                loading={ordersLoading}
                onRefresh={loadOrders}
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
              />
            )}
            
            {activeTab === 'add-product' && (
              <AddProduct 
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
                onLoadProducts={loadProducts}
                productToEdit={productToEdit}
                onClearEdit={() => setProductToEdit(null)}
              />
            )}
            
            {activeTab === 'products' && (
              <AllProducts 
                products={products}
                loading={productsLoading}
                onRefresh={loadProducts}
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
                onEditProduct={handleEditProduct}
                onAddNewProduct={handleAddNewProduct}
              />
            )}
            
            {activeTab === 'coupons' && (
              <ManageCoupons
                coupons={coupons}
                loading={couponsLoading}
                onRefresh={loadCoupons}
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
              />
            )}

            {/* 6. Render new component */}
            {activeTab === 'blog' && (
              <ManageBlog
                posts={blogPosts}
                loading={blogLoading}
                onRefresh={loadBlogPosts}
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
              />
            )}

            {activeTab === 'banner' && (
              <BannerSettings 
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
              />
            )}
            
            {activeTab === 'contacts' && (
              <ContactMessages 
                contacts={contacts}
                onContactsChange={setContacts}
                onSuccess={(message) => setSuccess(message)}
                onError={(message) => setError(message)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;