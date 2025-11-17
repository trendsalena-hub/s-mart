import React, { useState } from 'react';
import "./OrdersTab.scss";
// FIX: Corrected the relative path to the components directory
import CancelOrderModal from '../../../../../components/common/CancelOrderModal.jsx'; 
// Import Firebase functions (adjust path as needed)
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
// FIX: Corrected the relative path to the firebase config
import { db } from '../../../../../firebase/config.js'; 

// You may need to pass down a function from ProfilePage 
// to refetch orders after cancellation
const OrdersTab = ({ orders = [], onNavigate, onOrderUpdate }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOrder, setExpandedOrder] = useState(null);

  // === New State for Modal ===
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        // Ensure createdAt is a valid Date object or timestamp
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        return dateB - dateA;
      case 'oldest':
        const dateA_old = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB_old = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA_old - dateB_old;
      case 'price-high':
        return (b.total || 0) - (a.total || 0);
      case 'price-low':
        return (a.total || 0) - (b.total || 0);
      case 'default':
        return 0;
    }
  });

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': '#f39c12',
      'confirmed': '#3498db',
      'processing': '#9b59b6',
      'shipped': '#2980b9',
      'delivered': '#27ae60',
      'cancelled': '#e74c3c',
      'refunded': '#95a5a6'
    };
    return statusColors[status] || '#7f8c8d';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      'pending': 'fas fa-clock',
      'confirmed': 'fas fa-check-circle',
      'processing': 'fas fa-cog',
      'shipped': 'fas fa-shipping-fast',
      'delivered': 'fas fa-box-open',
      'cancelled': 'fas fa-times-circle',
      'refunded': 'fas fa-undo'
    };
    return statusIcons[status] || 'fas fa-question-circle';
  };

  const formatOrderDate = (dateStringOrTimestamp) => {
    const date = dateStringOrTimestamp?.toDate ? dateStringOrTimestamp.toDate() : new Date(dateStringOrTimestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateDeliveryDate = (dateStringOrTimestamp, status) => {
    if (status === 'delivered') return 'Delivered';
    
    const deliveryDate = dateStringOrTimestamp?.toDate ? dateStringOrTimestamp.toDate() : new Date(dateStringOrTimestamp);
    deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 days for delivery
    
    return `Est. ${deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })}`;
  };

  const handleReorder = (order) => {
    // Logic to reorder items
    console.log('Reordering:', order);
    // This would typically add all items from the order to cart
  };

  // === Updated Handler ===
  const handleTrackOrder = (order) => {
    // Use the onNavigate prop to go to the new page
    onNavigate(`/profile/orders/track/${order.id}`);
  };

  // === Updated Handler ===
  const handleViewDetails = (order) => {
    // Use the onNavigate prop to go to the new page
    onNavigate(`/profile/orders/${order.id}`);
  };

  // === Updated Handler ===
  const handleCancelOrderClick = (order) => {
    // Open the modal instead of window.confirm
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };
  
  // === New Function to Confirm Cancellation ===
  const handleConfirmCancel = async (orderId) => {
    // This is where the actual Firebase logic runs
    // 'throw new Error()' will be caught by the modal's error state
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp() // Update timestamp
      });
      
      // Close the modal
      setIsCancelModalOpen(false);
      
      // Call the callback function passed from ProfilePage to refetch data
      if (onOrderUpdate) {
        onOrderUpdate();
      }
    } catch (error) {
      console.error("Failed to cancel order: ", error);
      // Let the modal handle showing the error
      throw error;
    }
  };

  const getTotalItems = (order) => {
    return order.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 0;
  };

  // Order statistics
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  return (
    <div className="orders-tab">
      {/* Render the modal */}
      {isCancelModalOpen && (
        <CancelOrderModal
          order={orderToCancel}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* Header Section */}
      <div className="orders-tab__header">
        <div className="orders-tab__title-section">
          <h2 className="orders-tab__title">
            <i className="fas fa-shopping-bag"></i>
            My Orders
          </h2>
          <p className="orders-tab__subtitle">Track and manage your orders</p>
        </div>
        
        {orders.length > 0 && (
          <div className="orders-tab__stats">
            <div className="orders-tab__stat">
              <span className="orders-tab__stat-number">{orderStats.total}</span>
              <span className="orders-tab__stat-label">Total</span>
            </div>
            <div className="orders-tab__stat orders-tab__stat--pending">
              <span className="orders-tab__stat-number">{orderStats.pending}</span>
              <span className="orders-tab__stat-label">Pending</span>
            </div>
            <div className="orders-tab__stat orders-tab__stat--delivered">
              <span className="orders-tab__stat-number">{orderStats.delivered}</span>
              <span className="orders-tab__stat-label">Delivered</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Section */}
      {orders.length > 0 && (
        <div className="orders-tab__controls">
          <div className="orders-tab__filters">
            <button
              className={`orders-tab__filter-btn ${filter === 'all' ? 'orders-tab__filter-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Orders
            </button>
            <button
              className={`orders-tab__filter-btn ${filter === 'pending' ? 'orders-tab__filter-btn--active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button
              className={`orders-tab__filter-btn ${filter === 'delivered' ? 'orders-tab__filter-btn--active' : ''}`}
              onClick={() => setFilter('delivered')}
            >
              Delivered
            </button>
            <button
              className={`orders-tab__filter-btn ${filter === 'cancelled' ? 'orders-tab__filter-btn--active' : ''}`}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>

          <div className="orders-tab__sort">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="orders-tab__sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="orders-tab__empty">
          <div className="orders-tab__empty-icon">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h3 className="orders-tab__empty-title">No Orders Yet</h3>
          <p className="orders-tab__empty-text">
            Start shopping to see your orders here! Explore our collection and find something you love.
          </p>
          <div className="orders-tab__empty-actions">
            <button 
              className="orders-tab__btn orders-tab__btn--primary"
              onClick={() => onNavigate('/products')}
            >
              <i className="fas fa-shopping-cart"></i>
              Start Shopping
            </button>
            <button 
              className="orders-tab__btn orders-tab__btn--secondary"
              onClick={() => onNavigate('/')}
            >
              <i className="fas fa-home"></i>
              Go to Homepage
            </button>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-tab__empty">
          <div className="orders-tab__empty-icon">
            <i className="fas fa-search"></i>
          </div>
          <h3 className="orders-tab__empty-title">No Orders Found</h3>
          <p className="orders-tab__empty-text">
            No orders match your current filter. Try changing the filter to see more orders.
          </p> {/* FIX: Was </Nothing> */}
          <button 
            className="orders-tab__btn orders-tab__btn--secondary"
            onClick={() => setFilter('all')}
          >
            Show All Orders
          </button>
        </div>
      ) : (
        <>
          {/* Orders List */}
          <div className="orders-tab__list">
            {sortedOrders.map((order) => (
              <div key={order.id} className="orders-tab__card">
                {/* Order Header */}
                <div className="orders-tab__card-header">
                  <div className="orders-tab__order-info">
                    <div className="orders-tab__order-id">
                      Order #{(order.id || '').slice(-8).toUpperCase()}
                    </div>
                    <div className="orders-tab__order-date">
                      <i className="fas fa-calendar"></i>
                      {formatOrderDate(order.createdAt)}
                    </div>
                  </div>
                  <div 
                    className="orders-tab__status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    <i className={getStatusIcon(order.status)}></i>
                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="orders-tab__items-preview">
                  <div className="orders-tab__items-list">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="orders-tab__item-preview">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="orders-tab__item-image"
                        />
                        <div className="orders-tab__item-info">
                          <div className="orders-tab__item-name">{item.name}</div>
                          <div className="orders-tab__item-price">
                            ₹{item.price?.toLocaleString()} × {item.quantity || 1}
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="orders-tab__more-items">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                  
                  <div className="orders-tab__order-summary">
                    <div className="orders-tab__summary-item">
                      <span>Items:</span>
                      <span>{getTotalItems(order)}</span>
                    </div>
                    <div className="orders-tab__summary-item">
                      <span>Delivery:</span>
                      <span>{calculateDeliveryDate(order.createdAt, order.status)}</span>
                    </div>
                    <div className="orders-tab__summary-item orders-tab__summary-item--total">
                      <span>Total:</span>
                      <span>₹{order.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="orders-tab__card-actions">
                  <button
                    className="orders-tab__btn orders-tab__btn--primary"
                    onClick={() => handleViewDetails(order)}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                  
                  {order.status === 'pending' || order.status === 'confirmed' ? (
                    <button
                      className="orders-tab__btn orders-tab__btn--secondary"
                      onClick={() => handleTrackOrder(order)}
                    >
                      <i className="fas fa-shipping-fast"></i>
                      Track Order
                    </button>
                  ) : order.status === 'delivered' ? (
                    <button
                      className="orders-tab__btn orders-tab__btn--secondary"
                      onClick={() => handleReorder(order)}
                    >
                      <i className="fas fa-redo"></i>
                      Reorder
                    </button>
                  ) : null}

                  {order.status === 'pending' && (
                    <button
                      className="orders-tab__btn orders-tab__btn--outline"
                      onClick={() => handleCancelOrderClick(order)}
                    >
                      <i className="fas fa-times"></i>
                      Cancel Order
                    </button>
                  )}

                  <button
                    className="orders-tab__btn orders-tab__btn--text"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <i className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`}></i>
                    {expandedOrder === order.id ? 'Show Less' : 'Show More'}
                  </button>
                </div>

                {/* Expanded Order Details */}
                {expandedOrder === order.id && (
                  <div className="orders-tab__expanded-details">
                    <div className="orders-tab__details-section">
                      <h4>Order Details</h4>
                      <div className="orders-tab__details-grid">
                        <div className="orders-tab__detail-item">
                          <span>Order ID:</span>
                          <span>{(order.id || '').toUpperCase()}</span>
                        </div>
                        <div className="orders-tab__detail-item">
                          <span>Order Date:</span>
                          <span>{formatOrderDate(order.createdAt)}</span>
                        </div>
                        <div className="orders-tab__detail-item">
                          <span>Payment Method:</span>
                          <span>{order.paymentMethod || 'Credit Card'}</span>
                        </div>
                        <div className="orders-tab__detail-item">
                          <span>Shipping Address:</span>
                          <span>{order.shippingAddress || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="orders-tab__details-section">
                      <h4>All Items ({getTotalItems(order)})</h4>
                      <div className="orders-tab__all-items">
                        {order.items?.map((item, index) => (
                          <div key={index} className="orders-tab__item-full">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="orders-tab__item-image"
                            />
                            <div className="orders-tab__item-details">
                              <div className="orders-tab__item-name">{item.name}</div>
                              <div className="orders-tab__item-meta">
                                <span>Quantity: {item.quantity || 1}</span>
                                <span>Price: ₹{item.price?.toLocaleString()}</span>
                                <span>Total: ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load More (if applicable) */}
          {sortedOrders.length > 5 && (
            <div className="orders-tab__load-more">
              <button className="orders-tab__btn orders-tab__btn--secondary">
                <i className="fas fa-arrow-down"></i>
                Load More Orders
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersTab;