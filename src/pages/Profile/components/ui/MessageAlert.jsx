import React from 'react';

const MessageAlert = ({ type, message, onClose }) => {
  if (!message) return null;

  const icons = {
    error: 'fas fa-exclamation-circle',
    success: 'fas fa-check-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };

  return (
    <div className={`profile__message profile__message--${type}`}>
      <div className="profile__message-icon">
        <i className={icons[type]}></i>
      </div>
      <span>{message}</span>
      <button 
        className="profile__message-close"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default MessageAlert;