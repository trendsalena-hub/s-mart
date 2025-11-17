import React, { useState } from 'react';
import './ReplyModal.scss';

const ReplyModal = ({ contact, onClose, onSendReply, onError }) => {
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (replyText.trim() === '') {
      onError('Reply message cannot be empty.');
      return;
    }
    
    setIsSending(true);
    // The onSendReply function is passed from ContactMessages.jsx
    await onSendReply(contact.id, replyText); 
    setIsSending(false);
    // The parent component is responsible for closing the modal on success
  };

  return (
    <div className="reply-modal-overlay" onClick={onClose}>
      <div className="reply-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="reply-modal-header">
          <h3>Reply to Customer</h3>
          <button onClick={onClose} className="reply-modal-close-btn">
            &times;
          </button>
        </div>
        
        <div className="reply-modal-body">
          <div className="original-message">
            <strong>From:</strong> {contact.name} ({contact.email})<br />
            <strong>Phone:</strong> {contact.phone || 'N/A'}<br />
            <strong>Received:</strong> {new Date(contact.createdAt).toLocaleString()}
            <p className="original-comment">"{contact.comment}"</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="replyText">Your Reply:</label>
              <textarea
                id="replyText"
                rows="6"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                required
              />
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn--primary" 
                disabled={isSending}
              >
                {isSending ? (
                  <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                ) : (
                  <><i className="fas fa-paper-plane"></i> Send Reply</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;