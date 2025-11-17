import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js'; 
import './OrderDetailsPage.scss';

// A simple loading spinner component
const Loader = () => (
  <div className="loader-container">
    <div className="loader"></div>
  </div>
);

// Helper function to format the address object from your database
const formatAddress = (addr) => {
  if (!addr) return "N/A";
  // This matches your 'deliveryAddress' map structure
  return [
    addr.name,
    addr.address,
    addr.locality,
    `${addr.city}, ${addr.state} - ${addr.pincode}`,
    `Mobile: ${addr.mobile}`
  ].filter(Boolean).join('\n'); // Using newline for <pre> tag
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const orderRef = doc(db, 'orders', orderId); 
        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } else {
          setError('Order not found.');
        }
      } catch (err) {
        setError('Failed to fetch order details.');
        console.error(err);
      }
      setLoading(false);
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getTotalItems = (items = []) => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const formatOrderDate = (dateStringOrTimestamp) => {
    // This handles both Firebase Timestamps and ISO strings
    const date = dateStringOrTimestamp?.toDate ? dateStringOrTimestamp.toDate() : new Date(dateStringOrTimestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="order-details-page order-details-page--error">
        <h2 className="error-title">
          <i className="fas fa-exclamation-triangle"></i> Error
        </h2>
        <p>{error}</p>
        <button onClick={() => navigate('/profile')} className="btn btn--secondary">
          <i className="fas fa-arrow-left"></i> Back to Profile
        </button>
      </div>
    );
  }

  if (!order) {
    return null; // Should be covered by error state
  }

  return (
    <div className="order-details-page">
      <div className="order-details-page__header">
        <button onClick={() => navigate(-1)} className="order-details-page__back-btn">
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <h2 className="order-details-page__title">
          Order Details
        </h2>
        <div className="order-details-page__id-status">
          <span>Order #{(order.id || '').toUpperCase()}</span>
          <span className={`status status--${order.status}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="order-details-page__content">
        {/* Left Column: Items */}
        <div className="order-details-page__items-section">
          <h3 className="section-title">
            {getTotalItems(order.items)} Items
          </h3>
          <div className="order-items-list">
            {order.items?.map((item, index) => (
              <div key={item.id || index} className="order-item-card">
                <img src={item.image} alt={item.title} className="order-item-card__image" />
                <div className="order-item-card__details">
                  <div className="order-item-card__name">{item.title}</div>
                  <div className="order-item-card__meta">
                    <span>Qty: {item.quantity || 1}</span>
                    <span>Price: ₹{item.price?.toLocaleString()}</span>
                  </div>
                  <div className="order-item-card__meta">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>
                </div>
                <div className="order-item-card__total">
                  ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Summary & Info */}
        <div className="order-details-page__summary-section">
          
          {/* Price Summary based on your database fields */}
          <div className="summary-box">
            <h3 className="section-title">Price Summary</h3>
            <div className="price-line">
              <span>Subtotal</span>
              <span>₹{order.subtotal?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="price-line">
              <span>Shipping</span>
              <span>₹{order.shipping?.toLocaleString() || 'Free'}</span>
            </div>
            <div className="price-line">
              <span>Tax (GST)</span>
              <span>₹{order.tax?.toLocaleString() || 'N/A'}</span>
            </div>
            <div className="price-line">
              <span>Discount</span>
              {/* Your screenshot doesn't show discount, so we default to 0 */}
              <span className="text-danger">- ₹{order.discount?.toLocaleString() || 0}</span>
            </div>
            <div className="price-line price-line--total">
              <span>Total</span>
              <span>₹{order.total?.toLocaleString()}</span>
            </div>
          </div>

          {/* Shipping Info based on your 'deliveryAddress' map */}
          <div className="summary-box">
            <h3 className="section-title">Shipping Information</h3>
            <pre className="shipping-address">
              {formatAddress(order.deliveryAddress)}
            </pre>
            <div className="info-line">
              <i className="fas fa-calendar"></i>
              <span>Order Date: {formatOrderDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Payment Info based on your 'paymentStatus' field */}
          <div className="summary-box">
            <h3 className="section-title">Payment Information</h3>
            <div className="info-line">
              <i className="fas fa-credit-card"></i>
              <span>
                {order.paymentStatus === 'pending' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="info-line">
              <i className="fas fa-receipt"></i>
              <span>Payment Status: {order.paymentStatus}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;