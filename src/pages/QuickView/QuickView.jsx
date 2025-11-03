import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../components/context/CartContext';
import './QuickView.scss';

const QuickView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  const productImages = product ? [
    product.image,
    product.image,
    product.image,
    product.image
  ] : [];

  useEffect(() => {
    console.log('QuickView mounted, location.state:', location.state);
    if (location.state?.product) {
      setProduct(location.state.product);
      console.log('Product set:', location.state.product);
    } else {
      console.log('No product data, redirecting to home');
      navigate('/');
    }
  }, [location.state, navigate]);

  if (!product) {
    return (
      <div className="quick-view" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 20px' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: '#e8b4c9', marginBottom: '20px' }}></i>
            <p style={{ fontSize: '16px', color: '#666' }}>Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const handleQuantityChange = (type) => {
    if (type === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    const productWithDetails = {
      id: Math.random().toString(36).substr(2, 9),
      ...product,
      selectedSize,
      quantity
    };
    addToCart(productWithDetails);
    
    const event = new CustomEvent('cartNotification', { 
      detail: { 
        message: `${product.title} added to cart!`,
        type: 'success'
      } 
    });
    window.dispatchEvent(event);
    
    navigate(-1);
  };

  const handleBuyNow = () => {
    const productWithDetails = {
      id: Math.random().toString(36).substr(2, 9),
      ...product,
      selectedSize,
      quantity
    };
    
    navigate('/checkout', { 
      state: { product: productWithDetails } 
    });
  };

  return (
    <div className="quick-view" style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '30px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <i className="fas fa-arrow-left"></i>
          Back
        </button>

        <div style={{ 
          background: 'white', 
          borderRadius: '20px', 
          padding: '30px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 992 ? '1fr 1fr' : '1fr',
          gap: '40px'
        }}>
          {/* Left Side - Images */}
          <div>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: '15px', overflow: 'hidden', background: '#f5f5f5' }}>
              <img src={productImages[selectedImage]} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              
              {product.badge && (
                <span style={{
                  position: 'absolute',
                  top: '20px',
                  left: '20px',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'white',
                  textTransform: 'uppercase',
                  background: 'linear-gradient(135deg, #e8b4c9, #d48aa9)'
                }}>
                  {product.badge}
                </span>
              )}

              {hasDiscount && product.discount && (
                <span style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  color: 'white',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {product.discount}% OFF
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '20px' }}>
              {productImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: selectedImage === index ? '2px solid #e8b4c9' : '2px solid transparent',
                    cursor: 'pointer',
                    background: '#f5f5f5',
                    padding: 0
                  }}
                >
                  <img src={img} alt={`${product.title} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Side - Details */}
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '15px' }}>{product.title}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1,2,3,4].map(i => <i key={i} className="fas fa-star" style={{ color: '#ffd700', fontSize: '18px' }}></i>)}
                <i className="fas fa-star-half-alt" style={{ color: '#ffd700', fontSize: '18px' }}></i>
              </div>
              <span style={{ fontSize: '15px', color: '#666' }}>4.5 (128 reviews)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: '#e8b4c9' }}>₹{product.price.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: '20px', color: '#666', textDecoration: 'line-through' }}>₹{product.originalPrice.toLocaleString()}</span>
                  <span style={{ background: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
                    Save ₹{(product.originalPrice - product.price).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Select Size</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: '50px',
                      height: '50px',
                      border: selectedSize === size ? '2px solid #e8b4c9' : '2px solid #e0e0e0',
                      background: selectedSize === size ? '#e8b4c9' : 'white',
                      color: selectedSize === size ? 'white' : '#333',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px' }}>Quantity</h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', border: '2px solid #e0e0e0', borderRadius: '10px', padding: '10px 20px' }}>
                <button 
                  onClick={() => handleQuantityChange('decrement')}
                  disabled={quantity === 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '35px',
                    height: '35px',
                    cursor: quantity === 1 ? 'not-allowed' : 'pointer',
                    opacity: quantity === 1 ? 0.3 : 1
                  }}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <span style={{ fontSize: '20px', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange('increment')}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '35px',
                    height: '35px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexDirection: window.innerWidth < 576 ? 'column' : 'row' }}>
              <button 
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  padding: '16px 28px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #e8b4c9, #d48aa9)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <i className="fas fa-shopping-bag"></i>
                Add to Cart
              </button>
              <button 
                onClick={handleBuyNow}
                style={{
                  flex: 1,
                  padding: '16px 28px',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ff6b35, #ff5520)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <i className="fas fa-bolt"></i>
                Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickView;
