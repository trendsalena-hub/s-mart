import React, { useState, useEffect } from 'react'; // Import useEffect
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from "../../../../firebase/config";
import './AddProduct.scss';

// FIX: Receive new props `productToEdit` and `onClearEdit`
const AddProduct = ({ onSuccess, onError, onLoadProducts, productToEdit, onClearEdit }) => {
  const [submitting, setSubmitting] = useState(false);
  // FIX: This state is now controlled by the new useEffect
  const [editingProduct, setEditingProduct] = useState(null); 
  const [uploadingImages, setUploadingImages] = useState([]);
  
  const [productForm, setProductForm] = useState({
    title: '',
    price: '',
    originalPrice: '',
    discount: '',
    images: [],
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
    sku: '',
    offer: {
      enabled: false,
      title: '',
      description: '',
      validUntil: '',
      type: 'percentage', // percentage or fixed
      value: ''
    }
  });

  // === NEW useEffect to load product for editing ===
  useEffect(() => {
    if (productToEdit) {
      // Product data from Firestore
      const data = productToEdit;
      
      // Convert data back into form state
      setProductForm({
        title: data.title || '',
        price: data.price || '',
        originalPrice: data.originalPrice || '',
        discount: data.discount || '',
        // Convert array of URLs back to the state's object structure
        images: data.images ? data.images.map(url => ({ 
          url: url, 
          name: url.split('/').pop().split('?')[0].substring(14) || 'image.jpg',
          size: 0, // We don't have this info from Firestore
          type: 'image/jpeg' // We don't have this info
        })) : [],
        badge: data.badge || '',
        category: data.category || '',
        description: data.description || '',
        stock: data.stock || '',
        featured: data.featured || false,
        sizes: data.sizes || [],
        colors: data.colors && data.colors.length > 0 ? data.colors : [''],
        material: data.material || '',
        brand: data.brand || '',
        tags: data.tags ? data.tags.join(', ') : '', // Convert array back to string
        sku: data.sku || '',
        // Handle offer object, including converting Timestamp
        offer: data.offer ? {
          ...data.offer,
          validUntil: data.offer.validUntil?.toDate ? 
                      data.offer.validUntil.toDate().toISOString().slice(0, 16) 
                      : (data.offer.validUntil || '') // Handle string date
        } : { ...productForm.offer } // Keep default structure
      });
      setEditingProduct(data); // Set the editing product (which includes its ID)
    } else {
      resetForm(); // If no product, ensure form is reset
    }
  }, [productToEdit]); // This hook runs whenever productToEdit changes

  // ... (handleImageUpload, handleFileChange, handleRemoveImage, etc. remain the same) ...
  const handleImageUpload = async (files) => {
    // ... (existing code) ...
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
        const storageRef = ref(storage, `products/${fileName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { url: downloadURL, name: file.name, size: file.size, type: file.type };
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    });

    try {
      const uploadedImages = await Promise.all(uploadPromises);
      return uploadedImages;
    } catch (error) {
      throw new Error('Failed to upload one or more images');
    }
  };

  const handleFileChange = async (e) => {
    // ... (existing code) ...
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(Array.from(files).map(file => file.name));

    try {
      const uploadedImages = await handleImageUpload(files);
      setProductForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
      onSuccess(`${uploadedImages.length} image(s) uploaded successfully!`);
    } catch (error) {
      onError('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages([]);
    }
  };

  const handleRemoveImage = (index) => {
    // ... (existing code) ...
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleReorderImages = (fromIndex, toIndex) => {
    // ... (existing code) ...
    const newImages = [...productForm.images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setProductForm(prev => ({ ...prev, images: newImages }));
  };

  const handleSizeToggle = (size) => {
    // ... (existing code) ...
    setProductForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleColorChange = (index, value) => {
    // ... (existing code) ...
    setProductForm(prev => {
      const newColors = [...prev.colors];
      newColors[index] = value;
      return { ...prev, colors: newColors };
    });
  };

  const handleAddColor = () => {
    // ... (existing code) ...
    setProductForm(prev => ({
      ...prev,
      colors: [...prev.colors, '']
    }));
  };

  const handleRemoveColor = (index) => {
    // ... (existing code) ...
    if (productForm.colors.length > 1) {
      setProductForm(prev => ({
        ...prev,
        colors: prev.colors.filter((_, i) => i !== index)
      }));
    }
  };

  const handleInputChange = (e) => {
    // ... (existing code) ...
    const { name, value, type, checked } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOfferChange = (field, value) => {
    // ... (existing code) ...
    setProductForm(prev => ({
      ...prev,
      offer: {
        ...prev.offer,
        [field]: value
      }
    }));
  };


  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    onError('');
    onSuccess('');
  
    if (productForm.images.length === 0) {
      onError('Please upload at least one product image.');
      setSubmitting(false);
      return;
    }
  
    try {
      // Convert validUntil to Timestamp
      let validUntilTimestamp = null;
      if (productForm.offer.enabled && productForm.offer.validUntil) {
        validUntilTimestamp = Timestamp.fromDate(new Date(productForm.offer.validUntil));
      }
  
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
        discount: productForm.discount ? parseFloat(productForm.discount) : null,
        stock: parseInt(productForm.stock, 10),
        images: productForm.images.map(img => img.url),
        image: productForm.images[0]?.url || '',
        sizes: productForm.sizes,
        colors: productForm.colors.filter(c => c.trim() !== ''),
        tags: productForm.tags ? productForm.tags.split(',').map(t => t.trim()) : [],
        offer: {
          ...productForm.offer,
          value: productForm.offer.value ? parseFloat(productForm.offer.value) : 0,
          validUntil: validUntilTimestamp
        },
        updatedAt: Timestamp.now(),
        createdAt: editingProduct ? editingProduct.createdAt : Timestamp.now(),
      };
  
      delete productData.productToEdit;
  
      let productRef;
  
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        productRef = { id: editingProduct.id };
        onSuccess("Product updated successfully!");
      } else {
        productRef = await addDoc(collection(db, "products"), productData);
        onSuccess("Product added successfully!");
      }
  
      // ------------------------------------------------------------------
      // 🔥 ADD PRODUCT NOTIFICATION
      // ------------------------------------------------------------------
      await addDoc(collection(db, "notifications"), {
        type: "product",
        title: "New Product Added!",
        message: `New product "${productData.title}" is now available!`,
        price: productData.price,
        image: productData.image,
        product: {
          name: productData.title,
          image: productData.image,
          price: productData.price
        },
        docId: productRef.id,
        isRead: false,
        createdAt: Timestamp.now(),
      });
  
      // ------------------------------------------------------------------
      // 🔥 ADD OFFER NOTIFICATION (ONLY IF OFFER ENABLED)
      // ------------------------------------------------------------------
      if (productData.offer.enabled) {
        await addDoc(collection(db, "notifications"), {
          type: "product_offer",
          title: `Offer on ${productData.title}!`,
          message: `${productData.offer.title} - ${
            productData.offer.type === "percentage"
              ? `${productData.offer.value}% OFF`
              : `₹${productData.offer.value} OFF`
          }`,
          image: productData.image,
          offer: productData.offer,
          price: productData.price,
          product: {
            name: productData.title,
            image: productData.image,
            price: productData.price,
            discountType: productData.offer.type,
            discountValue: productData.offer.value,
          },
          docId: productRef.id,
          isRead: false,
          createdAt: Timestamp.now(),
        });
      }
  
      // Reset
      resetForm();
      onLoadProducts();
  
    } catch (err) {
      console.error("Error saving product:", err);
      onError("Failed to save product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  

  // FIX: Update resetForm to also call onClearEdit
  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({
      title: '',
      price: '',
      originalPrice: '',
      discount: '',
      images: [],
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
      sku: '',
      offer: {
        enabled: false,
        title: '',
        description: '',
        validUntil: '',
        type: 'percentage',
        value: ''
      }
    });
    // Clear the parent state
    if (onClearEdit) {
      onClearEdit();
    }
  };

  return (
    <div className="admin-dashboard__card">
      <h2>{editingProduct ? `Edit Product (ID: ${editingProduct.id.slice(0, 6)}...)` : 'Add New Product'}</h2>
      
      <form onSubmit={handleSubmitProduct} className="product-form">
        {/* ... (all form JSX) ... */}
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

          {/* Multiple Images Upload */}
          <div className="product-form__group product-form__group--full">
            <label>Product Images *</label>
            <div className="image-upload-manager">
              {/* File Upload Area */}
              <div className="image-upload-area">
                <input
                  type="file"
                  id="product-images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="image-upload-input"
                />
                <label htmlFor="product-images" className="image-upload-label">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Click to upload images</span>
                  <small>Supports JPG, PNG, WEBP (Max 5MB each)</small>
                </label>
              </div>

              {/* Uploading Progress */}
              {uploadingImages.length > 0 && (
                <div className="uploading-files">
                  <h4>Uploading {uploadingImages.length} image(s)...</h4>
                  <div className="uploading-list">
                    {uploadingImages.map((fileName, index) => (
                      <div key={index} className="uploading-item">
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>{fileName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Previews */}
              {productForm.images.length > 0 && (
                <div className="image-previews">
                  <h4>Uploaded Images ({productForm.images.length})</h4>
                  <div className="preview-grid">
                    {productForm.images.map((image, index) => (
                      <div key={index} className="preview-item">
                        <div className="preview-image">
                          <img src={image.url} alt={`Preview ${index + 1}`} />
                          {index === 0 && (
                            <span className="primary-badge">Primary</span>
                          )}
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => handleRemoveImage(index)}
                            title="Remove image"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                        <div className="preview-info">
                          <span className="image-name" title={image.name}>{image.name}</span>
                          {image.size > 0 && (
                            <span className="image-size">
                              {(image.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                        {index > 0 && (
                          <button
                            type="button"
                            className="set-primary-btn"
                            onClick={() => handleReorderImages(index, 0)}
                            title="Set as primary"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

          {/* Offer Section */}
          <div className="product-form__group product-form__group--full mobile-optimized">
            <div className="offer-section">
              <label className="product-form__checkbox">
                <input
                  type="checkbox"
                  checked={productForm.offer.enabled}
                  onChange={(e) => handleOfferChange('enabled', e.target.checked)}
                />
                <span>🎁 Enable Special Offer</span>
              </label>

              {productForm.offer.enabled && (
                <div className="offer-fields">
                  <div className="offer-grid">
                    {/* Offer Title */}
                    <div className="product-form__group">
                      <label htmlFor="offerTitle">Offer Title *</label>
                      <input
                        type="text"
                        id="offerTitle"
                        value={productForm.offer.title}
                        onChange={(e) => handleOfferChange('title', e.target.value)}
                        placeholder="e.g., Summer Sale, Flash Deal"
                        required
                      />
                    </div>

                    {/* Offer Type */}
                    <div className="product-form__group">
                      <label htmlFor="offerType">Offer Type *</label>
                      <select
                        id="offerType"
                        value={productForm.offer.type}
                        onChange={(e) => handleOfferChange('type', e.target.value)}
                        required
                      >
                        <option value="percentage">Percentage Off</option>
                        <option value="fixed">Fixed Amount Off</option>
                      </select>
                    </div>

                    {/* Offer Value */}
                    <div className="product-form__group">
                      <label htmlFor="offerValue">
                        {productForm.offer.type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount (₹) *'}
                      </label>
                      <input
                        type="number"
                        id="offerValue"
                        value={productForm.offer.value}
                        onChange={(e) => handleOfferChange('value', e.target.value)}
                        min="0"
                        max={productForm.offer.type === 'percentage' ? '100' : ''}
                        step={productForm.offer.type === 'percentage' ? '1' : '0.01'}
                        placeholder={productForm.offer.type === 'percentage' ? '25' : '100'}
                        required
                      />
                    </div>

                    {/* Valid Until */}
                    <div className="product-form__group">
                      <label htmlFor="offerValidUntil">Valid Until *</label>
                      <input
                        type="datetime-local"
                        id="offerValidUntil"
                        value={productForm.offer.validUntil}
                        onChange={(e) => handleOfferChange('validUntil', e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>

                    {/* Offer Description */}
                    <div className="product-form__group product-form__group--full">
                      <label htmlFor="offerDescription">Offer Description</label>
                      <textarea
                        id="offerDescription"
                        value={productForm.offer.description}
                        onChange={(e) => handleOfferChange('description', e.target.value)}
                        rows="3"
                        placeholder="Describe the offer details..."
                      ></textarea>
                    </div>
                  </div>

                  {/* Offer Preview */}
                  {(productForm.offer.title || productForm.offer.value) && (
                    <div className="offer-preview">
                      <h5>Offer Preview:</h5>
                      <div className="preview-card">
                        <span className="offer-badge">
                          {productForm.offer.title || 'Special Offer'}
                        </span>
                        {productForm.offer.value && (
                          productForm.offer.type === 'percentage' ? (
                            <span className="offer-value">-{productForm.offer.value}% OFF</span>
                          ) : (
                            <span className="offer-value">-₹{productForm.offer.value} OFF</span>
                          )
                        )}
                        {productForm.offer.validUntil && (
                          <span className="offer-validity">
                            Valid until: {new Date(productForm.offer.validUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
            disabled={submitting || productForm.images.length === 0}
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
          {/* FIX: Show Cancel button when editing */}
          {editingProduct && (
            <button
              type="button"
              className="product-form__btn product-form__btn--secondary"
              onClick={resetForm} // resetForm now also calls onClearEdit
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddProduct;