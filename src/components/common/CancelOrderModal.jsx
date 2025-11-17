import React, { useState } from 'react';
import './CancelOrderModal.scss';

const CancelOrderModal = ({ order, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      // The onConfirm function (passed as a prop)
      // will contain the actual Firebase logic
      await onConfirm(order.id);
      setLoading(false);
      onClose(); // Close modal on success
    } catch (err) {
      setError('Failed to cancel order. Please try again.');
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="cancel-modal__close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <div className="cancel-modal__icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3 className="cancel-modal__title">Are you sure?</h3>
        <p className="cancel-modal__text">
          You are about to cancel Order #
          <strong>{(order.id || '').slice(-8).toUpperCase()}</strong>.
          This action cannot be undone.
        </p>

        {error && <p className="cancel-modal__error">{error}</p>}

        <div className="cancel-modal__actions">
          <button
            className="cancel-modal__btn cancel-modal__btn--secondary"
            onClick={onClose}
            disabled={loading}
          >
            No, Keep Order
          </button>
          <button
            className="cancel-modal__btn cancel-modal__btn--danger"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              'Yes, Cancel Order'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;