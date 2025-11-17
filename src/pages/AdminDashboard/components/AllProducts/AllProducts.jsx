import React from 'react'; // Removed useState, useEffect
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from "../../../../firebase/config.js"; // FIX: Added .js extension
import './AllProducts.scss';

// FIX: Receive new props: loading, onRefresh, onAddNewProduct
const AllProducts = ({ 
  products, 
  loading, 
  onRefresh, 
  onSuccess, 
  onError, 
  onEditProduct, 
  onAddNewProduct 
}) => {

  // REMOVED: useEffect and loadProducts (now in parent)

  const handleEditProduct = (product) => {
    // FIX: Pass the full product object to the parent handler
    onEditProduct(product);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteDoc(doc(db, 'products', productId));
      onSuccess('Product deleted successfully!');
      await onRefresh(); // FIX: Call the onRefresh prop
    } catch (err) {
      console.error('Error deleting product:', err);
      onError('Failed to delete product.');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard__card">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard__card">
      <div className="products-header">
        <h2>All Products ({products.length})</h2>
        <button 
          className="btn btn--primary"
          onClick={onAddNewProduct} // FIX: Use new prop
        >
          <i className="fas fa-plus"></i>
          Add New Product
        </button>
      </div>
      
      {products.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <h4>No Products Yet</h4>
          <p>Add your first product to get started!</p>
          <button 
            className="btn btn--primary"
            onClick={onAddNewProduct} // FIX: Use new prop
          >
            Add Product
          </button>
        </div>
      ) : (
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              {/* ... (table header) ... */}
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
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
                  <td data-label="Title" className="products-table__title">
                    {product.title}
                    {product.featured && (
                      <span className="products-table__featured-badge">
                        <i className="fas fa-star"></i>
                        Featured
                      </span>
                    )}
                  </td>
                  <td data-label="Category">
                    <span className="products-table__category">
                      {product.category}
                    </span>
                  </td>
                  <td data-label="Price">
                    <div className="products-table__price">
                      <span className="products-table__current-price">
                        ₹{product.price?.toLocaleString()}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="products-table__original-price">
                          ₹{product.originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="Stock">
                    <span className={`products-table__stock ${product.stock < 10 ? 'products-table__stock--low' : ''}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td data-label="Featured">
                    <span className={`products-table__status ${product.featured ? 'products-table__status--active' : ''}`}>
                      {product.featured ? 'Yes' : 'No'}
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
  );
};

export default AllProducts;