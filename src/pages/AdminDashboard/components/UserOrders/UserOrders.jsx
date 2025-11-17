import React, { useState, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './UserOrders.scss';

const UserOrders = ({ orders, loading, onRefresh, onSuccess, onError }) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [generatingInvoice, setGeneratingInvoice] = useState(null);
  const invoiceRef = useRef();

  const handleStatusChange = async (order, newStatus) => {
    if (newStatus === order.status) return;

    const confirmUpdate = window.confirm(
      `Are you sure you want to change order #${order.id.slice(-6)} from "${
        order.status
      }" to "${newStatus}"?`
    );
    if (!confirmUpdate) return;

    setUpdatingStatus(order.id);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      onSuccess(`Order ${order.id.slice(-6)} status updated!`);
      onRefresh();
    } catch (err) {
      console.error('Error updating order status:', err);
      onError('Failed to update order status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatOrderDate = (dateStringOrTimestamp) => {
    const date = dateStringOrTimestamp?.toDate
      ? dateStringOrTimestamp.toDate()
      : new Date(dateStringOrTimestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatFullDate = (dateStringOrTimestamp) => {
    const date = dateStringOrTimestamp?.toDate
      ? dateStringOrTimestamp.toDate()
      : new Date(dateStringOrTimestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalItems = (items = []) => {
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: '#f39c12',
      confirmed: '#3498db',
      processing: '#9b59b6',
      shipped: '#2980b9',
      delivered: '#27ae60',
      cancelled: '#e74c3c',
      refunded: '#95a5a6',
    };
    return statusColors[status] || '#7f8c8d';
  };

  const formatAddress = (addr) => {
    if (!addr) return 'N/A';
    return `${addr.name}, ${addr.address}, ${addr.locality}, ${addr.city}, ${addr.state} - ${addr.pincode}, Mobile: ${addr.mobile}`;
  };

  const generateInvoice = async (order) => {
    setGeneratingInvoice(order.id);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ALENA-TRENDS-invoice-${order.id.slice(-8).toUpperCase()}.pdf`);
      
      onSuccess('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error generating invoice:', error);
      onError('Failed to generate invoice. Please try again.');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

  if (loading) {
    return (
      <div className="admin-dashboard__card">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Alena Trends orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard__card">
      <div className="products-header">
        <h2>All Customer Orders ({orders.length})</h2>
        <div className="invoice-actions">
          <button 
            className="btn btn--secondary"
            onClick={() => expandedOrderId && generateInvoice(orders.find(o => o.id === expandedOrderId))}
            disabled={!expandedOrderId || generatingInvoice}
          >
            <i className="fas fa-file-pdf"></i> 
            {generatingInvoice ? 'Generating PDF...' : 'Download Invoice'}
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-shopping-bag"></i>
          <h4>No Orders Found</h4>
          <p>When customers place orders, they will appear here.</p>
        </div>
      ) : (
        <>
          {/* Hidden Invoice Template for PDF Generation */}
          <div className="invoice-template" ref={invoiceRef}>
            {expandedOrderId && orders.filter(order => order.id === expandedOrderId).map(order => (
              <div key={order.id} className="invoice">
                {/* Compact Header */}
                <div className="invoice__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', paddingBottom: '10px', borderBottom: '2px solid #d4af37' }}>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ color: '#d4af37', margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>ALENA TRENDS</h1>
                    <p style={{ margin: '0', fontSize: '10px', color: '#666' }}>Trendy Fashion & Lifestyle Essentials</p>
                    <p style={{ margin: '2px 0', fontSize: '9px', color: '#666' }}>📧 contact@alenatrends.com | 📱 +91-XXXX-XXXX-XX</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>INVOICE</h2>
                    <p style={{ margin: '2px 0', fontSize: '9px' }}><strong>Invoice No:</strong> AT-{order.id.slice(-8).toUpperCase()}</p>
                    <p style={{ margin: '2px 0', fontSize: '9px' }}><strong>Date:</strong> {formatFullDate(order.createdAt)}</p>
                    <p style={{ margin: '2px 0', fontSize: '9px' }}><strong>Status:</strong> <span style={{color: getStatusColor(order.status), fontWeight: 'bold'}}>{order.status.toUpperCase()}</span></p>
                  </div>
                </div>

                {/* Customer & Order Info - Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', fontSize: '10px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#333' }}>Bill To:</h3>
                    <div style={{ lineHeight: '1.3' }}>
                      <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{order.deliveryAddress?.name || 'N/A'}</p>
                      <p style={{ margin: '2px 0' }}>{order.deliveryAddress?.address}</p>
                      <p style={{ margin: '2px 0' }}>{order.deliveryAddress?.locality}, {order.deliveryAddress?.city}</p>
                      <p style={{ margin: '2px 0' }}>{order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
                      <p style={{ margin: '2px 0' }}>📱 {order.deliveryAddress?.mobile}</p>
                    </div>
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#333' }}>Order Details:</h3>
                    <div style={{ lineHeight: '1.3' }}>
                      <p style={{ margin: '2px 0' }}><strong>Order ID:</strong> AT-{order.id.slice(-8).toUpperCase()}</p>
                      <p style={{ margin: '2px 0' }}><strong>Customer ID:</strong> ...{order.userId.slice(-6)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Items:</strong> {getTotalItems(order.items)}</p>
                      <p style={{ margin: '2px 0' }}><strong>Payment:</strong> {order.paymentStatus || 'Pending'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items Table */}
                <div style={{ marginBottom: '15px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333', paddingBottom: '3px', borderBottom: '1px solid #ddd' }}>Order Items</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '6px 4px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold' }}>Product</th>
                        <th style={{ padding: '6px 4px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>Size</th>
                        <th style={{ padding: '6px 4px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>Color</th>
                        <th style={{ padding: '6px 4px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>Qty</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>Price</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', verticalAlign: 'top' }}>
                            <div>
                              <strong style={{ fontSize: '9px' }}>{item.title}</strong>
                              {item.brand && <div style={{ fontSize: '8px', color: '#666', marginTop: '1px' }}>Brand: {item.brand}</div>}
                            </div>
                          </td>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '9px' }}>{item.size || 'N/A'}</td>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '9px' }}>{item.color || 'N/A'}</td>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '9px' }}>{item.quantity}</td>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'right', fontSize: '9px' }}>₹{item.price?.toLocaleString()}</td>
                          <td style={{ padding: '5px 4px', border: '1px solid #ddd', textAlign: 'right', fontSize: '9px', fontWeight: 'bold' }}>₹{(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Price Summary & Important Notice - Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  {/* Price Summary */}
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333', paddingBottom: '3px', borderBottom: '1px solid #ddd' }}>Price Summary</h3>
                    <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>Subtotal:</span>
                        <span>₹{order.subtotal?.toLocaleString()}</span>
                      </div>
                      {order.discount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#27ae60' }}>
                          <span>Product Discount:</span>
                          <span>- ₹{order.discount?.toLocaleString()}</span>
                        </div>
                      )}
                      {order.offerDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#27ae60' }}>
                          <span>Special Offers:</span>
                          <span>- ₹{order.offerDiscount?.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span>Shipping:</span>
                        <span>₹{order.shipping?.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: '2px solid #d4af37', fontWeight: 'bold', fontSize: '11px' }}>
                        <span>Grand Total:</span>
                        <span>₹{order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333', paddingBottom: '3px', borderBottom: '1px solid #ddd' }}>Important Notice</h3>
                    <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '4px', padding: '8px', fontSize: '8px', lineHeight: '1.3' }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', color: '#856404' }}>⚠️ SEAL TAG POLICY</p>
                      <p style={{ margin: '2px 0' }}><strong>Clothes with broken or removed seal tags cannot be returned or exchanged.</strong></p>
                      <p style={{ margin: '2px 0' }}>• Try garments without removing seal tag</p>
                      <p style={{ margin: '2px 0' }}>• Keep original packaging intact</p>
                      <p style={{ margin: '2px 0' }}>• 7-day return policy applies</p>
                    </div>
                  </div>
                </div>

                {/* Terms & Footer - Side by Side */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
                  {/* Terms */}
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '10px', color: '#333' }}>Terms & Conditions:</h4>
                    <ul style={{ margin: '0', paddingLeft: '12px', fontSize: '7px', lineHeight: '1.2', color: '#666' }}>
                      <li>Computer-generated invoice - no signature required</li>
                      <li>7-day return window from delivery date</li>
                      <li><strong>Seal tag must be intact for returns</strong></li>
                      <li>Original packaging and labels required</li>
                      <li>Contact: support@alenatrends.com</li>
                    </ul>
                  </div>

                  {/* Signature */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: '20px', borderBottom: '1px solid #333', marginBottom: '5px' }}></div>
                    <p style={{ margin: '0', fontSize: '8px', fontWeight: 'bold' }}>Alena Trends</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '7px', color: '#666' }}>Authorized Signature</p>
                  </div>
                </div>

                {/* Footer Note */}
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                  <p style={{ margin: '0', fontSize: '8px', color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                    Thank you for shopping with Alena Trends! • Quality Fashion Guaranteed
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Orders Table */}
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Total Amount</th>
                  <th>Items</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td data-label="Order ID">
                        <span className="order-id">
                          AT-{order.id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Date">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td data-label="Customer Name">
                        <div className="customer-info">
                          <span><strong>{order.deliveryAddress?.name || 'N/A'}</strong></span>
                          <small>CID: ...{order.userId.slice(-6)}</small>
                        </div>
                      </td>
                      <td data-label="Total Amount">
                        <span className="order-total" style={{fontWeight: 'bold', fontSize: '14px'}}>
                          ₹{order.total?.toLocaleString() || 0}
                        </span>
                      </td>
                      <td data-label="Items" style={{textAlign: 'center'}}>
                        {getTotalItems(order.items)} item(s)
                      </td>
                      <td data-label="Order Status">
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={updatingStatus === order.id}
                          style={{
                            color: getStatusColor(order.status),
                            borderColor: getStatusColor(order.status),
                            fontWeight: 'bold'
                          }}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Actions">
                        <div className="order-actions">
                          <button
                            className="orders-table__btn"
                            onClick={() =>
                              setExpandedOrderId(
                                expandedOrderId === order.id ? null : order.id
                              )
                            }
                            title="View Order Details"
                          >
                            <i
                              className={`fas fa-chevron-${
                                expandedOrderId === order.id ? 'up' : 'down'
                              }`}
                            ></i>
                            Details
                          </button>
                          {expandedOrderId === order.id && (
                            <button
                              className="orders-table__btn orders-table__btn--invoice"
                              onClick={() => generateInvoice(order)}
                              disabled={generatingInvoice === order.id}
                              title="Download Invoice PDF"
                            >
                              <i className="fas fa-file-pdf"></i>
                              {generatingInvoice === order.id ? '...' : 'PDF'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* Expandable Row */}
                    {expandedOrderId === order.id && (
                      <tr className="orders-table__expandable-row">
                        <td colSpan="7">
                          <div className="order-details-expanded">
                            <div className="order-details-section">
                              <h4>📦 Order Items ({getTotalItems(order.items)})</h4>
                              <ul className="item-list">
                                {order.items.map((item, index) => (
                                  <li key={index}>
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span className="item-title">{item.title}</span>
                                    <span className="item-meta">
                                      (Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'})
                                    </span>
                                    <span className="item-price">
                                      @ ₹{item.price?.toLocaleString()}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="order-details-section">
                              <h4>🏠 Delivery Address</h4>
                              <p className="address-details">
                                {formatAddress(order.deliveryAddress)}
                              </p>
                            </div>
                            <div className="order-details-section">
                              <h4>💰 Price Summary</h4>
                              <div className="price-summary">
                                <p><strong>Subtotal:</strong> ₹{order.subtotal?.toLocaleString()}</p>
                                {order.discount > 0 && <p><strong>Product Discount:</strong> - ₹{(order.discount || 0).toLocaleString()}</p>}
                                {order.offerDiscount > 0 && <p><strong>Offers/Coupons:</strong> - ₹{(order.offerDiscount || 0).toLocaleString()}</p>}
                                <p><strong>Shipping:</strong> {order.shipping === 0 ? 'FREE' : `₹${order.shipping?.toLocaleString()}`}</p>
                                <p className="price-total"><strong>Grand Total:</strong> ₹{order.total?.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="order-details-section">
                              <h4>📄 Invoice Actions</h4>
                              <div className="invoice-actions-expanded">
                                <button
                                  className="btn btn--primary"
                                  onClick={() => generateInvoice(order)}
                                  disabled={generatingInvoice === order.id}
                                >
                                  {generatingInvoice === order.id ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i> Generating Invoice...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-file-pdf"></i> Download Compact Invoice PDF
                                    </>
                                  )}
                                </button>
                                <p className="invoice-note">
                                  <i className="fas fa-info-circle"></i> 
                                  Single-page professional invoice with all details and return policy.
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UserOrders;