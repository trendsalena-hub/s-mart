import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase/config';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useCart } from '../../components/context/CartContext';
import './Collections.scss';

const Collections = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Products', icon: 'fa-th' },
    { id: 'dresses', name: 'Dresses', icon: 'fa-tshirt' },
    { id: 'tops', name: 'Tops', icon: 'fa-vest' },
    { id: 'bottoms', name: 'Bottoms', icon: 'fa-socks' },
    { id: 'outerwear', name: 'Outerwear', icon: 'fa-coat-arms' },
    { id: 'accessories', name: 'Accessories', icon: 'fa-gem' }
  ];

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: '0-1000', name: 'Under ₹1,000' },
    { id: '1000-2000', name: '₹1,000 - ₹2,000' },
    { id: '2000-3000', name: '₹2,000 - ₹3,000' },
    { id: '3000-5000', name: '₹3,000 - ₹5,000' },
    { id: '5000+', name: 'Above ₹5,000' }
  ];

  const sizes = ['all', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const sortOptions = [
    { id: 'featured', name: 'Featured' },
    { id: 'price-low', name: 'Price: Low to High' },
    { id: 'price-high', name: 'Price: High to Low' },
    { id: 'newest', name: 'Newest First' },
    { id: 'popularity', name: 'Most Popular' }
  ];

  // Load products from Firebase
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(v => v.replace('+', ''));
      result = result.filter(product => {
        const price = product.price;
        if (max) {
          return price >= parseInt(min) && price <= parseInt(max);
        } else {
          return price >= parseInt(min);
        }
      });
    }

    // Size filter
    if (selectedSize !== 'all') {
      result = result.filter(product => 
        product.sizes?.includes(selectedSize) || !product.sizes
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popularity':
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      default:
        // Featured - keep original order
        break;
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, selectedPriceRange, selectedSize, sortBy]);

  // Check URL params for initial category
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const handleProductClick = (product) => {
    navigate('/quick-view', { state: { product } });
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      image: product.image,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      badge: product.badge,
      size: 'M',
      quantity: 1
    });

    const event = new CustomEvent('cartNotification', {
      detail: { message: `${product.title} added to cart!`, type: 'success' }
    });
    window.dispatchEvent(event);
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setSelectedSize('all');
    setSortBy('featured');
  };

  if (loading) {
    return (
      <div className="collections collections--loading">
        <div className="container">
          <div className="collections__loader">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading collections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="collections">
      <div className="container">
        {/* Header */}
        <div className="collections__header">
          <div className="collections__title-section">
            <h1 className="collections__title">Our Collections</h1>
            <p className="collections__subtitle">
              Discover {filteredProducts.length} beautiful pieces crafted just for you
            </p>
          </div>

          <div className="collections__controls">
            <button 
              className="collections__filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fas fa-filter"></i>
              Filters
              {(selectedCategory !== 'all' || selectedPriceRange !== 'all' || selectedSize !== 'all') && (
                <span className="collections__filter-badge"></span>
              )}
            </button>

            <div className="collections__sort">
              <label htmlFor="sort">Sort by:</label>
              <select 
                id="sort"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="collections__sort-select"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="collections__content">
          {/* Filters Sidebar */}
          <aside className={`collections__filters ${showFilters ? 'collections__filters--open' : ''}`}>
            <div className="collections__filters-header">
              <h2>Filters</h2>
              <button 
                className="collections__filters-close"
                onClick={() => setShowFilters(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Category Filter */}
            <div className="collections__filter-group">
              <h3 className="collections__filter-title">Category</h3>
              <div className="collections__filter-options">
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`collections__filter-option ${selectedCategory === category.id ? 'collections__filter-option--active' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <i className={`fas ${category.icon}`}></i>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="collections__filter-group">
              <h3 className="collections__filter-title">Price Range</h3>
              <div className="collections__filter-options">
                {priceRanges.map(range => (
                  <button
                    key={range.id}
                    className={`collections__filter-option ${selectedPriceRange === range.id ? 'collections__filter-option--active' : ''}`}
                    onClick={() => setSelectedPriceRange(range.id)}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="collections__filter-group">
              <h3 className="collections__filter-title">Size</h3>
              <div className="collections__filter-sizes">
                {sizes.map(size => (
                  <button
                    key={size}
                    className={`collections__size-btn ${selectedSize === size ? 'collections__size-btn--active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size === 'all' ? 'All' : size}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button 
              className="collections__clear-filters"
              onClick={clearFilters}
            >
              <i className="fas fa-redo"></i>
              Clear All Filters
            </button>
          </aside>

          {/* Products Grid */}
          <div className="collections__products">
            {filteredProducts.length === 0 ? (
              <div className="collections__empty">
                <i className="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button className="btn btn--primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="collections__grid">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="collections__product-card"
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="collections__product-image">
                      <img src={product.image} alt={product.title} />
                      
                      {product.badge && (
                        <span className={`collections__badge collections__badge--${product.badge.toLowerCase()}`}>
                          {product.badge}
                        </span>
                      )}

                      {product.discount && (
                        <span className="collections__discount">
                          {product.discount}% OFF
                        </span>
                      )}

                      <button 
                        className="collections__quick-add"
                        onClick={(e) => handleAddToCart(e, product)}
                      >
                        <i className="fas fa-shopping-bag"></i>
                        Add to Cart
                      </button>
                    </div>

                    <div className="collections__product-details">
                      <h3 className="collections__product-title">{product.title}</h3>
                      
                      <div className="collections__product-price">
                        <span className="collections__price-current">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="collections__price-original">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="collections__product-rating">
                        <div className="collections__stars">
                          {[1,2,3,4,5].map(i => (
                            <i key={i} className="fas fa-star"></i>
                          ))}
                        </div>
                        <span className="collections__rating-count">(128)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter Overlay for Mobile */}
        {showFilters && (
          <div 
            className="collections__overlay"
            onClick={() => setShowFilters(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default Collections;
