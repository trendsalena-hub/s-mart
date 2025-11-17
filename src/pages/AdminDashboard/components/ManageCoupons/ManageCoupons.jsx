import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../../firebase/config.js';
import './ManageCoupons.scss';

const ManageCoupons = ({ coupons, loading, onRefresh, onSuccess, onError }) => {
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage', // 'percentage', 'fixed', or 'buy_x_get_y'
    value: '',
    minPurchase: '',
    expiryDate: '',
    isActive: true,
    // New fields for buy_x_get_y
    buyQuantity: 1,
    getQuantity: 1,
    freeProduct: '',
  });

  // Effect to populate form when an existing coupon is clicked
  useEffect(() => {
    if (editingCoupon) {
      setForm({
        code: editingCoupon.code || '',
        type: editingCoupon.type || 'percentage',
        value: editingCoupon.value || '',
        minPurchase: editingCoupon.minPurchase || '',
        expiryDate: editingCoupon.expiryDate?.toDate
          ? editingCoupon.expiryDate.toDate().toISOString().slice(0, 16)
          : '',
        isActive: editingCoupon.isActive !== undefined ? editingCoupon.isActive : true,
        // New fields for buy_x_get_y
        buyQuantity: editingCoupon.buyQuantity || 1,
        getQuantity: editingCoupon.getQuantity || 1,
        freeProduct: editingCoupon.freeProduct || '',
      });
    } else {
      resetForm();
    }
  }, [editingCoupon]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      code: '',
      type: 'percentage',
      value: '',
      minPurchase: '',
      expiryDate: '',
      isActive: true,
      buyQuantity: 1,
      getQuantity: 1,
      freeProduct: '',
    });
    setEditingCoupon(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation based on coupon type
    if (!form.code || !form.expiryDate) {
      onError('Please fill in Code and Expiry Date.');
      return;
    }

    if (form.type === 'buy_x_get_y') {
      if (!form.buyQuantity || !form.getQuantity) {
        onError('Please fill in Buy Quantity and Get Quantity for Buy X Get Y coupon.');
        return;
      }
    } else {
      if (!form.value) {
        onError('Please fill in Value.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const couponData = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: form.value ? parseFloat(form.value) : 0,
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : 0,
        expiryDate: new Date(form.expiryDate),
        isActive: form.isActive,
        updatedAt: serverTimestamp(),
      };

      // Add buy_x_get_y specific fields
      if (form.type === 'buy_x_get_y') {
        couponData.buyQuantity = parseInt(form.buyQuantity);
        couponData.getQuantity = parseInt(form.getQuantity);
        couponData.freeProduct = form.freeProduct || '';
      }

      if (editingCoupon) {
        // Update existing coupon
        const couponRef = doc(db, 'coupons', editingCoupon.id);
        await updateDoc(couponRef, couponData);
        onSuccess('Coupon updated successfully!');
      } else {
        // Add new coupon
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          createdAt: serverTimestamp(),
        });
        onSuccess('Coupon created successfully!');
      }
      resetForm();
      onRefresh();
    } catch (err) {
      console.error('Error saving coupon:', err);
      onError('Failed to save coupon. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', couponId));
      onSuccess('Coupon deleted.');
      onRefresh();
    } catch (err) {
      onError('Failed to delete coupon.');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      const couponRef = doc(db, 'coupons', coupon.id);
      await updateDoc(couponRef, {
        isActive: !coupon.isActive,
        updatedAt: serverTimestamp(),
      });
      onSuccess(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}.`);
      onRefresh();
    } catch (err) {
      onError('Failed to toggle coupon status.');
    }
  };

  const isExpired = (expiryDate) => {
    return expiryDate && expiryDate.toDate() < new Date();
  };

  const getStatus = (coupon) => {
    if (isExpired(coupon.expiryDate)) {
      return { text: 'Expired', className: 'coupon-status--expired' };
    }
    return coupon.isActive
      ? { text: 'Active', className: 'coupon-status--active' }
      : { text: 'Inactive', className: 'coupon-status--inactive' };
  };

  const renderCouponValue = (coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}%`;
      case 'fixed':
        return `₹${coupon.value}`;
      case 'buy_x_get_y':
        return `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity}`;
      default:
        return coupon.value;
    }
  };

  return (
    <div className="manage-coupons">
      <div className="coupon-form-card">
        <h3>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3>
        <form onSubmit={handleSubmit} className="coupon-form">
          <div className="form-group">
            <label htmlFor="code">Coupon Code</label>
            <input
              type="text"
              id="code"
              name="code"
              value={form.code}
              onChange={handleInputChange}
              placeholder="e.g., SUMMER25"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Discount Type</label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleInputChange}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
              <option value="buy_x_get_y">Buy X Get Y</option>
            </select>
          </div>

          {/* Conditional fields based on coupon type */}
          {form.type === 'buy_x_get_y' ? (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="buyQuantity">Buy Quantity</label>
                  <input
                    type="number"
                    id="buyQuantity"
                    name="buyQuantity"
                    value={form.buyQuantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="getQuantity">Get Quantity (Free)</label>
                  <input
                    type="number"
                    id="getQuantity"
                    name="getQuantity"
                    value={form.getQuantity}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="freeProduct">Free Product Name (Optional)</label>
                <input
                  type="text"
                  id="freeProduct"
                  name="freeProduct"
                  value={form.freeProduct}
                  onChange={handleInputChange}
                  placeholder="e.g., Same product or specify product name"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="value">
                Value {form.type === 'percentage' ? '(%)' : '(₹)'}
              </label>
              <div className="input-group">
                <span>{form.type === 'percentage' ? '%' : '₹'}</span>
                <input
                  type="number"
                  id="value"
                  name="value"
                  value={form.value}
                  onChange={handleInputChange}
                  min="0"
                  step={form.type === 'percentage' ? '1' : '0.01'}
                  placeholder={form.type === 'percentage' ? '25' : '250'}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="minPurchase">Min. Purchase (₹)</label>
            <input
              type="number"
              id="minPurchase"
              name="minPurchase"
              value={form.minPurchase}
              onChange={handleInputChange}
              min="0"
              placeholder="0 (no minimum)"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              type="datetime-local"
              id="expiryDate"
              name="expiryDate"
              value={form.expiryDate}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleInputChange}
              />
              <span>Coupon is Active</span>
            </label>
          </div>
          
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-save"></i>
            )}
            {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
          </button>
          
          {editingCoupon && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="coupon-list-card">
        <h3>All Coupons ({coupons.length})</h3>
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-tags"></i>
            <h4>No Coupons</h4>
            <p>Create your first coupon to see it here.</p>
          </div>
        ) : (
          <div className="coupon-table-wrapper">
            <table className="coupon-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const status = getStatus(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td className="coupon-code">{coupon.code}</td>
                      <td>
                        {coupon.type === 'buy_x_get_y' ? 'Buy X Get Y' : coupon.type}
                      </td>
                      <td className="coupon-value">
                        {renderCouponValue(coupon)}
                      </td>
                      <td>
                        {coupon.expiryDate
                          ? coupon.expiryDate.toDate().toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td>
                        <span className={`coupon-status ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="coupon-actions">
                        <button
                          className="action-btn toggle"
                          title="Edit"
                          onClick={() => setEditingCoupon(coupon)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className={`action-btn ${
                            coupon.isActive ? 'toggle-off' : 'toggle-on'
                          }`}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleActive(coupon)}
                          disabled={isExpired(coupon.expiryDate)}
                        >
                          <i
                            className={`fas ${
                              coupon.isActive ? 'fa-toggle-off' : 'fa-toggle-on'
                            }`}
                          ></i>
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCoupons;