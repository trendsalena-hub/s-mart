import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase/config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import './AdminDashboard.scss';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('add-product'); // add-product, products, contacts
  const [products, setProducts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Product Form State
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    image: '',
    badge: '',
    category: '',
    description: '',
    stock: '',
    featured: false
  });

  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Admin UIDs (Add your admin user IDs here)
  const adminUIDs = ['PxUS6BooWHVl4X0reKaMyvOueg62']; // Replace with your admin UID

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user is admin
        if (adminUIDs.includes(currentUser.uid)) {
          setUser(currentUser);
          await loadProducts();
          await loadContacts();
        } else {
          setError('Access denied. Admin only.');
          setTimeout(() => navigate('/'), 2000);
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        setSuccess('Product updated successfully!');
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), productData);
        setSuccess('Product added successfully!');
      }

      // Reset form
      setProductForm({
        title: '',
        price: '',
        originalPrice: '',
        discount: '',
        image: '',
        badge: '',
        category: '',
        description: '',
        stock: '',
        featured: false
      });
      setEditingProduct(null);
      
      // Reload products
      await loadProducts();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
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
      image: product.image,
      badge: product.badge || '',
      category: product.category || '',
      description: product.description || '',
      stock: product.stock ? product.stock.toString() : '',
      featured: product.featured || false
    });
    setActiveTab('add-product');
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

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__container">
        {/* Header */}
        <div className="admin-dashboard__header">
          <div className="admin-dashboard__header-content">
            <h1>
              <i className="fas fa-shield-alt"></i>
              Admin Dashboard
            </h1>
            <p>Manage your store</p>
          </div>
          <button 
            className="admin-dashboard__back-btn"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-home"></i>
            Back to Store
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="admin-dashboard__message admin-dashboard__message--success">
            <i className="fas fa-check-circle"></i>
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="admin-dashboard__message admin-dashboard__message--error">
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}

        <div className="admin-dashboard__content">
          {/* Sidebar Navigation */}
          <aside className="admin-dashboard__sidebar">
            <nav className="admin-dashboard__nav">
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'add-product' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => setActiveTab('add-product')}
              >
                <i className="fas fa-plus-circle"></i>
                <span>{editingProduct ? 'Edit Product' : 'Add Product'}</span>
              </button>
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'products' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <i className="fas fa-box"></i>
                <span>All Products</span>
                <span className="admin-dashboard__badge">{products.length}</span>
              </button>
              <button
                className={`admin-dashboard__nav-item ${activeTab === 'contacts' ? 'admin-dashboard__nav-item--active' : ''}`}
                onClick={() => setActiveTab('contacts')}
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

          {/* Main Content */}
          <main className="admin-dashboard__main">
            {/* Add/Edit Product Tab */}
            {activeTab === 'add-product' && (
              <div className="admin-dashboard__card">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                
                <form onSubmit={handleSubmitProduct} className="product-form">
                  <div className="product-form__grid">
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
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion</option>
                        <option value="home">Home & Kitchen</option>
                        <option value="beauty">Beauty</option>
                        <option value="sports">Sports</option>
                        <option value="books">Books</option>
                      </select>
                    </div>

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

                    <div className="product-form__group product-form__group--full">
                      <label htmlFor="image">Image URL *</label>
                      <input
                        type="url"
                        id="image"
                        name="image"
                        value={productForm.image}
                        onChange={handleInputChange}
                        required
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

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

                    <div className="product-form__group product-form__group--full">
                      <label className="product-form__checkbox">
                        <input
                          type="checkbox"
                          name="featured"
                          checked={productForm.featured}
                          onChange={handleInputChange}
                        />
                        <span>Featured Product (Show on homepage)</span>
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
                            image: '',
                            badge: '',
                            category: '',
                            description: '',
                            stock: '',
                            featured: false
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
                      onClick={() => setActiveTab('add-product')}
                    >
                      Add Product
                    </button>
                  </div>
                ) : (
                  <div className="products-table">
                    <table>
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
                            <td>
                              <img 
                                src={product.image} 
                                alt={product.title}
                                className="products-table__image"
                              />
                            </td>
                            <td>{product.title}</td>
                            <td>
                              <span className="products-table__category">
                                {product.category}
                              </span>
                            </td>
                            <td>₹{product.price}</td>
                            <td>
                              <span className={`products-table__stock ${product.stock < 10 ? 'products-table__stock--low' : ''}`}>
                                {product.stock}
                              </span>
                            </td>
                            <td>
                              {product.badge && (
                                <span className={`products-table__badge products-table__badge--${product.badge.toLowerCase()}`}>
                                  {product.badge}
                                </span>
                              )}
                            </td>
                            <td>
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
