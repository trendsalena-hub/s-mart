import React, { useState } from 'react';
import "./OrdersTab.scss";
import CancelOrderModal from '../../../../../components/common/CancelOrderModal.jsx'; 

// Firebase
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  addDoc, 
  collection 
} from 'firebase/firestore';
import { db } from '../../../../../firebase/config.js'; 


// 🔥 NEW — Notification Helper
const sendOrderStatusNotification = async (orderId, newStatus) => {
  try {
    await addDoc(collection(db, "notifications"), {
      type: "order",
      title: "Order Update",
      message: `Your order is now ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      status: newStatus,
      docId: orderId,
      collection: "orders",
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};


const OrdersTab = ({ orders = [], onNavigate, onOrderUpdate }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);


  // FILTER
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // SORT
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

    switch (sortBy) {
      case 'newest': return dateB - dateA;
      case 'oldest': return dateA - dateB;
      case 'price-high': return (b.total || 0) - (a.total || 0);
      case 'price-low': return (a.total || 0) - (b.total || 0);
      default: return 0;
    }
  });


  // COLORS + ICONS
  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      shipped: '#2980b9',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
      refunded: '#95a5a6'
    };
    return statusColors[status] || '#7f8c8d';
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      pending: 'fas fa-clock',
      confirmed: 'fas fa-check-circle',
      processing: 'fas fa-cog',
      shipped: 'fas fa-shipping-fast',
      delivered: 'fas fa-box-open',
      cancelled: 'fas fa-times-circle',
      refunded: 'fas fa-undo'
    };
    return statusIcons[status] || 'fas fa-question-circle';
  };


  // DATE FORMATTER
  const formatOrderDate = (dateObj) => {
    const date = dateObj?.toDate ? dateObj.toDate() : new Date(dateObj);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateDeliveryDate = (createdAt, status) => {
    if (status === 'delivered') return 'Delivered';

    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    date.setDate(date.getDate() + 7);

    return `Est. ${date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })}`;
  };


  // TRACK + VIEW
  const handleTrackOrder = (order) => {
    onNavigate(`/profile/orders/track/${order.id}`);
  };

  const handleViewDetails = (order) => {
    onNavigate(`/profile/orders/${order.id}`);
  };


  // CANCEL ORDER
  const handleCancelOrderClick = (order) => {
    setOrderToCancel(order);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async (orderId) => {
    try {
      const orderRef = doc(db, 'orders', orderId);

      // UPDATE ORDER STATUS
      await updateDoc(orderRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });

      // 🔥 NEW — Send cancellation notification
      await sendOrderStatusNotification(orderId, "cancelled");

      // Refresh UI
      setIsCancelModalOpen(false);

      if (onOrderUpdate) onOrderUpdate();

    } catch (error) {
      console.error("Failed to cancel order:", error);
      throw error;
    }
  };


  // ITEMS IN ORDER
  const getTotalItems = (order) =>
    order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;


  // STATISTICS
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };


  // ==============================
  // UI STARTS
  // ==============================

  return (
    <div className="orders-tab">

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <CancelOrderModal
          order={orderToCancel}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* Header */}
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


      {/* Filters */}
      {orders.length > 0 && (
        <div className="orders-tab__controls">
          <div className="orders-tab__filters">
            {["all", "pending", "delivered", "cancelled"].map(f => (
              <button
                key={f}
                className={`orders-tab__filter-btn ${filter === f ? "orders-tab__filter-btn--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
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


      {/* EMPTY STATE */}
      {orders.length === 0 ? (
        <div className="orders-tab__empty">
          <div className="orders-tab__empty-icon"><i className="fas fa-shopping-bag"></i></div>
          <h3>No Orders Yet</h3>
          <p>Start shopping to see your orders here!</p>
          <button className="orders-tab__btn orders-tab__btn--primary" onClick={() => onNavigate('/products')}>
            Shop Now
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-tab__empty">
          <div className="orders-tab__empty-icon"><i className="fas fa-search"></i></div>
          <h3>No Orders Found</h3>
          <button className="orders-tab__btn orders-tab__btn--secondary" onClick={() => setFilter('all')}>
            Show All Orders
          </button>
        </div>
      ) : (
        <>
          {/* ORDER LIST */}
          <div className="orders-tab__list">
            {sortedOrders.map((order) => (
              <div key={order.id} className="orders-tab__card">

                {/* HEADER */}
                <div className="orders-tab__card-header">
                  <div>
                    <div className="orders-tab__order-id">Order #{(order.id || '').slice(-8).toUpperCase()}</div>
                    <div className="orders-tab__order-date">
                      <i className="fas fa-calendar"></i> {formatOrderDate(order.createdAt)}
                    </div>
                  </div>

                  <div className="orders-tab__status" style={{ color: getStatusColor(order.status) }}>
                    <i className={getStatusIcon(order.status)}></i>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </div>
                </div>


                {/* ITEMS PREVIEW */}
                <div className="orders-tab__items-preview">
                  <div className="orders-tab__items-list">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div key={index} className="orders-tab__item-preview">
                        <img src={item.image} alt={item.name} />
                        <div>
                          <div>{item.name}</div>
                          <div>₹{item.price} × {item.quantity || 1}</div>
                        </div>
                      </div>
                    ))}

                    {order.items?.length > 3 && (
                      <div className="orders-tab__more-items">+{order.items.length - 3} more items</div>
                    )}
                  </div>

                  <div className="orders-tab__order-summary">
                    <div><span>Items:</span> <span>{getTotalItems(order)}</span></div>
                    <div><span>Delivery:</span> <span>{calculateDeliveryDate(order.createdAt, order.status)}</span></div>
                    <div className="orders-tab__summary-item--total">
                      <span>Total:</span> <span>₹{order.total?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>


                {/* ACTION BUTTONS */}
                <div className="orders-tab__card-actions">

                  <button className="orders-tab__btn orders-tab__btn--primary" onClick={() => handleViewDetails(order)}>
                    <i className="fas fa-eye"></i> View Details
                  </button>

                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button className="orders-tab__btn orders-tab__btn--secondary" onClick={() => handleTrackOrder(order)}>
                      <i className="fas fa-shipping-fast"></i> Track Order
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <button className="orders-tab__btn orders-tab__btn--secondary" onClick={() => handleReorder(order)}>
                      <i className="fas fa-redo"></i> Reorder
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      className="orders-tab__btn orders-tab__btn--outline"
                      onClick={() => handleCancelOrderClick(order)}
                    >
                      <i className="fas fa-times"></i> Cancel Order
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


                {/* EXPANDED DETAILS */}
                {expandedOrder === order.id && (
                  <div className="orders-tab__expanded-details">
                    <div>
                      <h4>Order Details</h4>
                      <div className="orders-tab__details-grid">
                        <div><span>Order ID:</span> {order.id}</div>
                        <div><span>Date:</span> {formatOrderDate(order.createdAt)}</div>
                        <div><span>Payment:</span> {order.paymentMethod}</div>
                        <div><span>Address:</span> {order.shippingAddress}</div>
                      </div>
                    </div>

                    <div>
                      <h4>All Items</h4>
                      {order.items?.map((item, i) => (
                        <div key={i} className="orders-tab__item-full">
                          <img src={item.image} alt={item.name} />
                          <div>
                            <div>{item.name}</div>
                            <div>Qty: {item.quantity}</div>
                            <div>Price: ₹{item.price}</div>
                            <div>Total: ₹{item.price * item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>


          {/* Load More */}
          {sortedOrders.length > 5 && (
            <div className="orders-tab__load-more">
              <button className="orders-tab__btn orders-tab__btn--secondary">
                <i className="fas fa-arrow-down"></i> Load More Orders
              </button>
            </div>
          )}

        </>
      )}

    </div>
  );
};

export default OrdersTab;
