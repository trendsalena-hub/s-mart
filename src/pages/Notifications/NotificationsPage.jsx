import React, { useEffect, useState } from "react";
import "./NotificationsPage.scss";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // ---------------------------------------------------
  // FETCH NOTIFICATIONS
  // ---------------------------------------------------
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ---------------------------------------------------
  // HANDLE CLICK (BLOG, ORDER, PRODUCT)
  // ---------------------------------------------------
  const handleNotificationClick = async (n) => {
    try {
      // Only mark as read if it's not already read
      if (!n.isRead) {
        await updateDoc(doc(db, "notifications", n.id), { isRead: true });
        
        // Dispatch event to update header notification count
        window.dispatchEvent(new CustomEvent('notificationRead', {
          detail: { notificationId: n.id }
        }));
      }

      // ORDER
      if (n.type === "order") {
        return navigate(`/profile/orders/${n.docId}`);
      }

      // PRODUCT → open Quick View modal page
      if (n.type === "product" || n.type === "product_offer") {
        return navigate("/quick-view", {
          state: { productId: n.docId }
        });
      }

      // BLOG → open by slug
      if (n.type === "blog") {
        const blogRef = doc(db, "blogPosts", n.docId);
        const snap = await getDoc(blogRef);

        if (snap.exists()) {
          const blog = snap.data();
          return navigate(`/blog/${blog.slug}`);
        } else {
          return navigate("/blog");
        }
      }

    } catch (err) {
      console.error("Error handling notification:", err);
    }
  };

  // ---------------------------------------------------
  // DELETE NOTIFICATION
  // ---------------------------------------------------
  const deleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    setDeletingId(notificationId);

    try {
      await deleteDoc(doc(db, "notifications", notificationId));
      
      // Dispatch event to update header notification count
      window.dispatchEvent(new CustomEvent('notificationDeleted', {
        detail: { notificationId }
      }));
    } catch (err) {
      console.error("Error deleting notification:", err);
      setDeletingId(null);
    }
  };

  // ---------------------------------------------------
  // CLEAR ALL
  // ---------------------------------------------------
  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;

    if (!window.confirm("Are you sure you want to clear all notifications?")) return;

    try {
      const deletePromises = notifications.map((n) =>
        deleteDoc(doc(db, "notifications", n.id))
      );
      await Promise.all(deletePromises);
      
      // Dispatch event to update header notification count for all cleared notifications
      window.dispatchEvent(new CustomEvent('allNotificationsCleared'));
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  // ---------------------------------------------------
  // MARK ALL AS READ
  // ---------------------------------------------------
  const markAllAsRead = async () => {
    if (notifications.length === 0) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      const updatePromises = unreadNotifications.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { isRead: true })
      );
      
      await Promise.all(updatePromises);
      
      // Dispatch events for each notification marked as read
      unreadNotifications.forEach(n => {
        window.dispatchEvent(new CustomEvent('notificationRead', {
          detail: { notificationId: n.id }
        }));
      });
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // ---------------------------------------------------
  // ICONS / COLORS
  // ---------------------------------------------------
  const getIcon = (type) => {
    const icons = {
      order: "fas fa-shopping-bag",
      product: "fas fa-tags",
      product_offer: "fas fa-bolt",
      blog: "fas fa-newspaper",
    };
    return icons[type] || "fas fa-bell";
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f39c12",
      confirmed: "#3498db",
      processing: "#9b59b6",
      shipped: "#2980b9",
      delivered: "#27ae60",
      cancelled: "#e74c3c",
      refunded: "#95a5a6",
    };
    return colors[status] || "#3498db";
  };

  const getBorderColor = (n) => {
    if (n.type === "product") return "#2ecc71";
    if (n.type === "product_offer") return "#e6b325";
    if (n.type === "order") return getStatusColor(n.status);
    return "#3498db";
  };

  // ---------------------------------------------------
  // MESSAGE FORMATTER
  // ---------------------------------------------------
  const formatMessage = (n) => {
    if (n.type === "order" && n.status)
      return `Your order is now "${n.status}"`;

    if (n.type === "product")
      return `New product "${n.product?.name}" has been added!`;

    if (n.type === "product_offer")
      return `${n.offer?.title} - ${
        n.offer?.type === "percentage"
          ? `${n.offer.value}% OFF`
          : `₹${n.offer.value} OFF`
      }`;

    if (n.type === "blog")
      return n.title
        ? `New blog: "${n.title}"`
        : n.message || "New blog post available";

    return n.message || "You have a new update";
  };

  // ---------------------------------------------------
  // TIME FORMATTER
  // ---------------------------------------------------
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / (1000 * 60 * 60);

    if (diff < 1) return `${Math.floor(diff * 60)}m ago`;
    if (diff < 24) return `${Math.floor(diff)}h ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const hasUnreadNotifications = unreadCount > 0;

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-content">
          <h1>Notifications</h1>
          <div className="header-actions">
            {notifications.length > 0 && (
              <>
                <div className="notification-stats">
                  <span className="unread-badge">{unreadCount} unread</span>
                  <span className="total-badge">{notifications.length} total</span>
                </div>
                <div className="action-buttons">
                  {hasUnreadNotifications && (
                    <button 
                      className="mark-all-read-btn"
                      onClick={markAllAsRead}
                    >
                      Mark All as Read
                    </button>
                  )}
                  <button 
                    className="clear-all-btn"
                    onClick={clearAllNotifications}
                  >
                    Clear All
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="notifications-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-bell-slash"></i>
            </div>
            <h3>No notifications yet</h3>
            <p>We'll notify you when something new arrives</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`notification-card ${n.isRead ? "read" : "unread"}`}
                onClick={() => handleNotificationClick(n)}
                style={{ borderLeft: `4px solid ${getBorderColor(n)}` }}
              >
                <div className="notification-main">
                  <div className="notification-icon">
                    <i className={getIcon(n.type)}></i>
                  </div>

                  <div className="notification-content-wrapper">
                    {/* Image for mobile - placed before content */}
                    <div className="mobile-image">
                      {(n.type === "product" || n.type === "product_offer" || n.type === "blog") && n.image && (
                        <div className="notification-image">
                          <img src={n.image} alt={n.product?.name || n.title || "Notification"} />
                        </div>
                      )}
                      {n.type === "order" && n.productImage && (
                        <div className="notification-image">
                          <img src={n.productImage} alt={n.productName} />
                        </div>
                      )}
                    </div>

                    <div className="notification-content">
                      <div className="notification-header">
                        <div className="header-title">
                          <h3>
                            {n.type === "order"
                              ? "Order Update"
                              : n.type === "product_offer"
                              ? "Special Offer!"
                              : n.type === "blog"
                              ? "New Blog Post"
                              : n.title || "Notification"}
                          </h3>
                          <span className="notification-time">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        
                        {/* Desktop delete button - moved inside header */}
                        <button
                          className={`delete-btn desktop-delete ${deletingId === n.id ? "deleting" : ""}`}
                          onClick={(e) => deleteNotification(e, n.id)}
                          disabled={deletingId === n.id}
                        >
                          {deletingId === n.id ? (
                            <div className="delete-spinner"></div>
                          ) : (
                            <i className="fas fa-times"></i>
                          )}
                        </button>
                      </div>

                      <p className="notification-message">{formatMessage(n)}</p>

                      {/* Desktop images */}
                      <div className="desktop-image">
                        {(n.type === "product" || n.type === "product_offer" || n.type === "blog") && n.image && (
                          <div className="notification-image">
                            <img src={n.image} alt={n.product?.name || n.title || "Notification"} />
                          </div>
                        )}
                        {n.type === "order" && n.productImage && (
                          <div className="notification-image">
                            <img src={n.productImage} alt={n.productName} />
                          </div>
                        )}
                      </div>

                      {/* BLOG CONTENT - FIXED */}
                      {n.type === "blog" && (
                        <div className="blog-mini-details">
                          {/* Show blog description if available */}
                          {n.description && (
                            <p className="blog-description">
                              {n.description}
                            </p>
                          )}
                          {/* Show blog message if available */}
                          {n.message && !n.description && (
                            <p className="blog-message">
                              {n.message}
                            </p>
                          )}
                          {/* Show excerpt if available */}
                          {n.excerpt && (
                            <p className="blog-excerpt">
                              {n.excerpt}
                            </p>
                          )}
                        </div>
                      )}

                      {(n.type === "product" || n.type === "product_offer") && n.product && (
                        <div className="product-mini-details">
                          <p className="product-name">{n.product.name}</p>
                          <div className="product-price">
                            <span>₹{n.product.price}</span>
                            {n.type === "product_offer" && (
                              <span className="offer-badge">
                                {n.offer.type === "percentage"
                                  ? `${n.offer.value}% OFF`
                                  : `₹${n.offer.value} OFF`}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {n.type === "order" && (
                        <div className="order-mini-details">
                          {n.productName && (
                            <p className="order-product">
                              <strong>Product:</strong> {n.productName}
                            </p>
                          )}
                          {n.quantity && <p className="order-quantity">Qty: {n.quantity}</p>}
                          {n.orderId && (
                            <p className="order-id">
                              <strong>Order ID:</strong> {n.orderId}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile delete button - fixed position */}
                <button
                  className={`delete-btn mobile-delete ${deletingId === n.id ? "deleting" : ""}`}
                  onClick={(e) => deleteNotification(e, n.id)}
                  disabled={deletingId === n.id}
                >
                  {deletingId === n.id ? (
                    <div className="delete-spinner"></div>
                  ) : (
                    <i className="fas fa-times"></i>
                  )}
                </button>

                {!n.isRead && <div className="unread-indicator"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;