import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config'; // Adjust this import path
import './OrderTrackingPage.scss';

// A simple loading spinner component
const Loader = () => (
  <div className="loader-container">
    <div className="loader"></div>
  </div>
);

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define the tracking steps
  const trackingSteps = [
    { status: 'pending', title: 'Order Placed', icon: 'fas fa-check-circle' },
    { status: 'confirmed', title: 'Order Confirmed', icon: 'fas fa-user-check' },
    { status: 'processing', title: 'Order Processed', icon: 'fas fa-cog' },
    { status: 'shipped', title: 'Shipped', icon: 'fas fa-shipping-fast' },
    { status: 'delivered', title: 'Delivered', icon: 'fas fa-box-open' }
  ];

  const cancelledStep = { status: 'cancelled', title: 'Order Cancelled', icon: 'fas fa-times-circle' };

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
      }
      setLoading(false);
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusIndex = (status) => {
    return trackingSteps.findIndex(step => step.status === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  
  const isCancelled = order && order.status === 'cancelled';

  if (loading) {
    return <Loader />;
  }
  
  if (error) {
    // You can build a richer error component
    return <div>{error} <button onClick={() => navigate('/profile/orders')}>Back</button></div>;
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-tracking-page">
      <div className="tracking-header">
        <button onClick={() => navigate('/profile/orders')} className="tracking-back-btn">
          <i className="fas fa-arrow-left"></i> Back to My Orders
        </button>
        <h2 className="tracking-title">Track Order</h2>
        <p className="tracking-subtitle">
          Order #{(order.id || '').toUpperCase()}
        </p>
      </div>
      
      {isCancelled ? (
        <div className="tracking-timeline tracking-timeline--cancelled">
          <div className="tracking-step is-complete is-active">
            <div className="tracking-step__icon-wrapper">
              <i className={cancelledStep.icon}></i>
            </div>
            <div className="tracking-step__title">{cancelledStep.title}</div>
            <div className="tracking-step__date">
              {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ) : (
        <div className="tracking-timeline">
          {trackingSteps.map((step, index) => (
            <div
              key={step.status}
              className={`
                tracking-step
                ${index <= currentStatusIndex ? 'is-complete' : ''}
                ${index === currentStatusIndex ? 'is-active' : ''}
              `}
            >
              <div className="tracking-step__icon-wrapper">
                <i className={step.icon}></i>
              </div>
              <div className="tracking-step__title">{step.title}</div>
              {index === currentStatusIndex && (
                <div className="tracking-step__date">
                  {new Date(order.updatedAt || order.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="tracking-summary">
        <div className="tracking-summary-item">
          <strong>Status:</strong>
          <span className={`status-badge status--${order.status}`}>
            {order.status}
          </span>
        </div>
        <div className="tracking-summary-item">
          <strong>Estimated Delivery:</strong>
          <span>
            {order.status === 'delivered' 
              ? `Delivered on ${new Date(order.deliveredAt || order.updatedAt).toLocaleDateString()}`
              : calculateDeliveryDate(order.createdAt, order.status)}
          </span>
        </div>
        <div className="tracking-summary-item">
          <strong>Shipping To:</strong>
          <span>{order.shippingAddress || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

// Helper function (can be moved to a utils file)
const calculateDeliveryDate = (orderDate, status) => {
  if (status === 'delivered') return 'Delivered';
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days for delivery
  return `Est. ${deliveryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  })}`;
};

export default OrderTrackingPage;