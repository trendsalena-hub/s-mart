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
import ManageCoupons from './components/ManageCoupons/ManageCoupons.jsx'; // 1. Import new component
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
  
  // 2. Add state for Coupons
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);

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
              await loadCoupons(); // 3. Load coupons on mount
              // await loadContacts();
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

  // 4. Add loadCoupons function
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
        {/* ... (error page JSX) ... */}
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        {/* Header */}
        <div className="admin-dashboard__header">
          {/* ... (header JSX) ... */}
        </div>

        {/* Messages */}
        {success && (
          <div className="admin-dashboard__message admin-dashboard__message--success">
            {/* ... (success message JSX) ... */}
          </div>
        )}
        {error && (
          <div className="admin-dashboard__message admin-dashboard__message--error">
            {/* ... (error message JSX) ... */}
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

              {/* 5. Add "Manage Coupons" to navigation */}
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'coupons' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('coupons')}
              >
                <i className="fas fa-tags"></i>
                <span>Manage Coupons</span>
                <span className="admin-dashboard__badge">{coupons.length}</span>
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
            
            {/* 6. Render new component */}
            {activeTab === 'coupons' && (
              <ManageCoupons
                coupons={coupons}
                loading={couponsLoading}
                onRefresh={loadCoupons}
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