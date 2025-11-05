import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add-product');
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Enhanced Product Form State with Multiple Images and New Fields
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    images: [''], // Multiple images
    badge: '',
    category: '',
    description: '',
    stock: '',
    featured: false,
    sizes: ['S', 'M', 'L', 'XL'], // Default sizes
    colors: ['Black', 'White'], // Default colors
    material: '',
    brand: '',
    tags: '',
    sku: ''
  });

  // Banner Settings State
  const [bannerSettings, setBannerSettings] = useState({
    text: 'Get 10% off and Free Delivery on all orders',
    enabled: true
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
              await loadProducts();
              await loadContacts();
              await loadBannerSettings();
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
    }
  };

  const loadContacts = async () => {
    try {
      const contactsRef = collection(db, 'contacts');
      const q = query(contactsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setContacts(contactsData);
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadBannerSettings = async () => {
    try {
      const bannerDoc = await getDoc(doc(db, 'settings', 'banner'));
      if (bannerDoc.exists()) {
        setBannerSettings(bannerDoc.data());
      }
    } catch (err) {
      console.error('Error loading banner settings:', err);
    }
  };

  // Image Management Functions
  const handleAddImageField = () => {
    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleRemoveImageField = (index) => {
    if (productForm.images.length > 1) {
      setProductForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleImageChange = (index, value) => {
    setProductForm(prev => {
      const newImages = [...prev.images];
      newImages[index] = value;
      return { ...prev, images: newImages };
    });
  };

  // Size Management
  const handleSizeToggle = (size) => {
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  // Color Management
  const handleColorChange = (index, value) => {
    setProductForm(prev => {
      const newColors = [...prev.colors];
      newColors[index] = value;
      return { ...prev, colors: newColors };
    });
  };

  const handleAddColor = () => {
    setProductForm(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  const handleRemoveColor = (index) => {
    if (productForm.colors.length > 1) {
      setProductForm(prev => ({
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index)
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
        discount: productForm.discount ? parseFloat(productForm.discount) : null,
        stock: parseInt(productForm.stock),
        images: productForm.images.filter(img => img.trim() !== ''),
        image: productForm.images[0], // Primary image for backward compatibility
        sizes: productForm.sizes,
        colors: productForm.colors.filter(c => c.trim() !== ''),
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : [],
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setSuccess('Product updated successfully!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        setSuccess('Product added successfully!');
      }

      // Reset form
      setProductForm({
        title: '',
        price: '',
        originalPrice: '',
        discount: '',
        images: [''],
        badge: '',
        category: '',
        description: '',
        stock: '',
        featured: false,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black', 'White'],
        material: '',
        brand: '',
        tags: '',
        sku: ''
      });
      setEditingProduct(null);
      
      await loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBannerUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await setDoc(doc(db, 'settings', 'banner'), {
        ...bannerSettings,
        updatedAt: new Date().toISOString()
      });

      setSuccess('Banner updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating banner:', err);
      setError('Failed to update banner.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      discount: product.discount ? product.discount.toString() : '',
      images: product.images && product.images.length > 0 ? product.images : [product.image || ''],
      badge: product.badge || '',
      category: product.category || '',
      description: product.description || '',
      stock: product.stock ? product.stock.toString() : '',
      featured: product.featured || false,
      sizes: product.sizes || ['S', 'M', 'L', 'XL'],
      colors: product.colors || ['Black', 'White'],
      material: product.material || '',
      brand: product.brand || '',
      tags: product.tags ? product.tags.join(', ') : '',
      sku: product.sku || ''
    });
    setActiveTab('add-product');
    setSidebarOpen(false);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      setSuccess('Product deleted successfully!');
      await loadProducts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product.');
    }
  };

  const handleUpdateContactStatus = async (contactId, status) => {
    try {
      await updateDoc(doc(db, 'contacts', contactId), {
        status: status,
        updatedAt: new Date().toISOString()
      });
      await loadContacts();
      setSuccess('Contact status updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Failed to update contact status.');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      setSuccess('Contact deleted successfully!');
      await loadContacts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting contact:', err);
      setError('Failed to delete contact.');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
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
            <button onClick={() => setSuccess('')} className="admin-dashboard__message-close">×</button>
          </div>
        )}

        {error && (
          <div className="admin-dashboard__message admin-dashboard__message--error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
            <button onClick={() => setError('')} className="admin-dashboard__message-close">×</button>
          </div>
        )}

        <div className="admin-dashboard__content">
          {/* Sidebar Navigation */}
          <aside className={`admin-dashboard__sidebar ${sidebarOpen ? 'admin-dashboard__sidebar--open' : ''}`}>
            <nav className="admin-dashboard__nav">
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'add-product' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => handleTabChange('add-product')}
              >
                <i className="fas fa-plus-circle"></i>
                <span>{editingProduct ? 'Edit Product' : 'Add Product'}</span>
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
            {/* Add/Edit Product Tab */}
            {activeTab === 'add-product' && (
              <div className="admin-dashboard__card">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                
                <form onSubmit={handleSubmitProduct} className="product-form">
                  <div className="product-form__grid">
                    {/* Basic Information */}
                    <div className="product-form__group">
                      <label htmlFor="title">Product Title *</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={productForm.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter product title"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="category">Category *</label>
                      <select
                        id="category"
                        name="category"
                        value={productForm.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="dresses">Dresses</option>
                        <option value="tops">Tops</option>
                        <option value="bottoms">Bottoms</option>
                        <option value="outerwear">Outerwear</option>
                        <option value="accessories">Accessories</option>
                      </select>
                    </div>

                    {/* Pricing */}
                    <div className="product-form__group">
                      <label htmlFor="price">Price (₹) *</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={productForm.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="499.00"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="originalPrice">Original Price (₹)</label>
                      <input
                        type="number"
                        id="originalPrice"
                        name="originalPrice"
                        value={productForm.originalPrice}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="799.00"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="discount">Discount (%)</label>
                      <input
                        type="number"
                        id="discount"
                        name="discount"
                        value={productForm.discount}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        placeholder="25"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="stock">Stock Quantity *</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={productForm.stock}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="100"
                      />
                    </div>

                    {/* Additional Fields */}
                    <div className="product-form__group">
                      <label htmlFor="brand">Brand</label>
                      <input
                        type="text"
                        id="brand"
                        name="brand"
                        value={productForm.brand}
                        onChange={handleInputChange}
                        placeholder="Brand name"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="sku">SKU</label>
                      <input
                        type="text"
                        id="sku"
                        name="sku"
                        value={productForm.sku}
                        onChange={handleInputChange}
                        placeholder="Product SKU/Code"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="material">Material</label>
                      <input
                        type="text"
                        id="material"
                        name="material"
                        value={productForm.material}
                        onChange={handleInputChange}
                        placeholder="e.g., Cotton, Polyester"
                      />
                    </div>

                    <div className="product-form__group">
                      <label htmlFor="badge">Badge</label>
                      <select
                        id="badge"
                        name="badge"
                        value={productForm.badge}
                        onChange={handleInputChange}
                      >
                        <option value="">No badge</option>
                        <option value="New">New</option>
                        <option value="Sale">Sale</option>
                        <option value="Hot">Hot</option>
                        <option value="Trending">Trending</option>
                      </select>
                    </div>

                    {/* Multiple Images */}
                    <div className="product-form__group product-form__group--full">
                      <label>Product Images * (First image will be primary)</label>
                      <div className="image-manager">
                        {productForm.images.map((image, index) => (
                          <div key={index} className="image-manager__item">
                            <div className="image-manager__input-group">
                              <span className="image-manager__label">
                                {index === 0 ? '🌟 Primary Image' : `Image ${index + 1}`}
                              </span>
                              <input
                                type="url"
                                value={image}
                                onChange={(e) => handleImageChange(index, e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                required={index === 0}
                              />
                              {productForm.images.length > 1 && (
                                <button
                                  type="button"
                                  className="image-manager__remove-btn"
                                  onClick={() => handleRemoveImageField(index)}
                                  title="Remove image"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                            {image && (
                              <div className="image-manager__preview">
                                <img src={image} alt={`Preview ${index + 1}`} />
                                {index === 0 && (
                                  <span className="image-manager__primary-badge">Primary</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="image-manager__add-btn"
                          onClick={handleAddImageField}
                        >
                          <i className="fas fa-plus"></i>
                          Add Another Image
                        </button>
                      </div>
                    </div>

                    {/* Size Selection */}
                    <div className="product-form__group product-form__group--full">
                      <label>Available Sizes *</label>
                      <div className="size-selector">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                          <button
                            key={size}
                            type="button"
                            className={`size-selector__btn ${productForm.sizes.includes(size) ? 'size-selector__btn--active' : ''}`}
                            onClick={() => handleSizeToggle(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <small>Click to select/deselect sizes</small>
                    </div>

                    {/* Colors */}
                    <div className="product-form__group product-form__group--full">
                      <label>Available Colors *</label>
                      <div className="color-manager">
                        {productForm.colors.map((color, index) => (
                          <div key={index} className="color-manager__item">
                            <input
                              type="text"
                              value={color}
                              onChange={(e) => handleColorChange(index, e.target.value)}
                              placeholder="Enter color name"
                              required
                            />
                            {productForm.colors.length > 1 && (
                              <button
                                type="button"
                                className="color-manager__remove-btn"
                                onClick={() => handleRemoveColor(index)}
                                title="Remove color"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          className="color-manager__add-btn"
                          onClick={handleAddColor}
                        >
                          <i className="fas fa-plus"></i>
                          Add Color
                        </button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="product-form__group product-form__group--full">
                      <label htmlFor="tags">Tags (comma-separated)</label>
                      <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={productForm.tags}
                        onChange={handleInputChange}
                        placeholder="summer, trending, new-arrival"
                      />
                      <small>Separate tags with commas for better searchability</small>
                    </div>

                    {/* Description */}
                    <div className="product-form__group product-form__group--full">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={productForm.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Enter product description"
                      ></textarea>
                    </div>

                    {/* Featured */}
                    <div className="product-form__group product-form__group--full">
                      <label className="product-form__checkbox">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={productForm.featured}
                          onChange={handleInputChange}
                        />
                        <span>⭐ Featured Product (Show on homepage)</span>
                      </label>
                    </div>
                  </div>

                  <div className="product-form__actions">
                    <button 
                      type="submit" 
                      className="product-form__btn product-form__btn--primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          {editingProduct ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          {editingProduct ? 'Update Product' : 'Add Product'}
                        </>
                      )}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        className="product-form__btn product-form__btn--secondary"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductForm({
                            title: '',
                            price: '',
                            originalPrice: '',
                            discount: '',
                            images: [''],
                            badge: '',
                            category: '',
                            description: '',
                            stock: '',
                            featured: false,
                            sizes: ['S', 'M', 'L', 'XL'],
                            colors: ['Black', 'White'],
                            material: '',
                            brand: '',
                            tags: '',
                            sku: ''
                          });
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Products List Tab */}
            {activeTab === 'products' && (
              <div className="admin-dashboard__card">
                <h2>All Products ({products.length})</h2>
                
                {products.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-box-open"></i>
                    <h4>No Products Yet</h4>
                    <p>Add your first product to get started!</p>
                    <button 
                      className="product-form__btn product-form__btn--primary"
                      onClick={() => handleTabChange('add-product')}
                    >
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="products-table-wrapper">
                    <table className="products-table">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Badge</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td data-label="Image">
                              <img 
                                src={product.images ? product.images[0] : product.image} 
                                alt={product.title}
                                className="products-table__image"
                              />
                            </td>
                            <td data-label="Title">{product.title}</td>
                            <td data-label="Category">
                              <span className="products-table__category">
                                {product.category}
                              </span>
                            </td>
                            <td data-label="Price">₹{product.price.toLocaleString()}</td>
                            <td data-label="Stock">
                              <span className={`products-table__stock ${product.stock < 10 ? 'products-table__stock--low' : ''}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td data-label="Badge">
                              {product.badge && (
                                <span className={`products-table__badge products-table__badge--${product.badge.toLowerCase()}`}>
                                  {product.badge}
                                </span>
                              )}
                            </td>
                            <td data-label="Actions">
                              <div className="products-table__actions">
                                <button
                                  className="products-table__btn products-table__btn--edit"
                                  onClick={() => handleEditProduct(product)}
                                  title="Edit"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="products-table__btn products-table__btn--delete"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Banner Settings Tab */}
            {activeTab === 'banner' && (
              <div className="admin-dashboard__card">
                <h2>Banner Settings</h2>
                <p className="admin-dashboard__description">
                  Manage the promotional banner that appears at the top of your website
                </p>
                
                <form onSubmit={handleBannerUpdate} className="banner-form">
                  <div className="banner-form__preview">
                    <div className="banner-form__preview-label">Preview:</div>
                    <div className="banner-form__preview-banner">
                      <div className="banner-form__preview-content">
                        <span>
                          {bannerSettings.text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          {bannerSettings.text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                          {bannerSettings.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="product-form__group">
                    <label htmlFor="bannerText">Banner Text *</label>
                    <input
                      type="text"
                      id="bannerText"
                      value={bannerSettings.text}
                      onChange={(e) => setBannerSettings({...bannerSettings, text: e.target.value})}
                      required
                      placeholder="Enter banner message"
                      maxLength="100"
                    />
                    <small className="banner-form__char-count">
                      {bannerSettings.text.length}/100 characters
                    </small>
                  </div>

                  <div className="product-form__group">
                    <label className="product-form__checkbox">
                      <input
                        type="checkbox"
                        checked={bannerSettings.enabled}
                        onChange={(e) => setBannerSettings({...bannerSettings, enabled: e.target.checked})}
                      />
                      <span>Enable Banner (Show on website)</span>
                    </label>
                  </div>

                  <div className="product-form__actions">
                    <button 
                      type="submit" 
                      className="product-form__btn product-form__btn--primary"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save"></i>
                          Update Banner
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="admin-dashboard__card">
                <h2>Contact Messages ({contacts.length})</h2>
                
                {contacts.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-envelope-open"></i>
                    <h4>No Messages Yet</h4>
                    <p>Contact submissions will appear here.</p>
                  </div>
                ) : (
                  <div className="contacts-list">
                    {contacts.map(contact => (
                      <div key={contact.id} className="contact-card">
                        <div className="contact-card__header">
                          <div>
                            <h4>{contact.name}</h4>
                            <p>{contact.email}</p>
                            {contact.phone && <p>{contact.phone}</p>}
                          </div>
                          <span className={`contact-card__status contact-card__status--${contact.status}`}>
                            {contact.status}
                          </span>
                        </div>
                        <div className="contact-card__body">
                          <p>{contact.comment}</p>
                        </div>
                        <div className="contact-card__footer">
                          <span className="contact-card__date">
                            {new Date(contact.createdAt).toLocaleString()}
                          </span>
                          <div className="contact-card__actions">
                            <select
                              value={contact.status}
                              onChange={(e) => handleUpdateContactStatus(contact.id, e.target.value)}
                              className="contact-card__select"
                            >
                              <option value="new">New</option>
                              <option value="in-progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                            </select>
                            <button
                              className="contact-card__btn contact-card__btn--delete"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
