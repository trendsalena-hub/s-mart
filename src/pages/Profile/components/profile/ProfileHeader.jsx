import React, { useRef, useState } from 'react';
import DefaultAvatar from '../ui/DefaultAvatar';
import './ProfileHeader.scss';

const ProfileHeader = ({ 
  user, 
  profileData, 
  isAdmin, 
  onLogout, 
  onImageUpload,
  onRemoveImage,
  onNavigate,
  onError,
  onSuccess,
  showMobileSidebar,      // ✅ Mobile sidebar state
  onToggleSidebar         // ✅ Mobile sidebar toggle
}) => {
  const filePickerRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  const validateImage = (file) => {
    setImageError('');
    
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF, etc.)';
      setImageError(errorMsg);
      onError?.(errorMsg);
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image size should be less than 5MB';
      setImageError(errorMsg);
      onError?.(errorMsg);
      return false;
    }

    return true;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    e.target.value = '';

    if (!validateImage(file)) return;

    setUploading(true);
    setImageError('');

    try {
      const result = await onImageUpload(file);
      if (result) {
        onSuccess?.('Profile image updated successfully!');
      }
    } catch (err) {
      const errorMsg = 'Failed to upload profile image';
      setImageError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (!uploading) {
      filePickerRef.current?.click();
    }
  };

  const handleAdminClick = () => {
    onNavigate('/admin');
  };

  return (
    <div className="profile-header">
      {/* Background Gradient */}
      <div className="profile-header__background">
        <div className="profile-header__background-gradient"></div>
        <div className="profile-header__background-pattern"></div>
      </div>

      {/* Main Content */}
      <div className="profile-header__content">
        {/* ✅ MOBILE MENU BUTTON - ONLY ON MOBILE */}
        <button 
          className={`profile-header__mobile-menu-btn ${showMobileSidebar ? 'profile-header__mobile-menu-btn--active' : ''}`}
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          aria-expanded={showMobileSidebar}
        >
          <i className={`fas ${showMobileSidebar ? 'fa-times' : 'fa-bars'}`}></i>
        </button>

        {/* Avatar and User Info Section */}
        <div className="profile-header__main">
          <div className="profile-header__avatar-section">
            <div className="profile-header__avatar-container">
              <div 
                className={`profile-header__avatar ${uploading ? 'profile-header__avatar--uploading' : ''}`}
                onClick={handleAvatarClick}
              >
                {profileData.photoURL ? (
                  <img
                    src={profileData.photoURL}
                    alt="Profile"
                    className="profile-header__avatar-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <DefaultAvatar 
                    name={profileData.displayName} 
                    size={120}
                  />
                )}
                
                {/* Upload Overlay */}
                <div className="profile-header__avatar-overlay">
                  {uploading ? (
                    <div className="profile-header__uploading-indicator">
                      <div className="profile-header__spinner">
                        <div className="profile-header__spinner-dot"></div>
                        <div className="profile-header__spinner-dot"></div>
                        <div className="profile-header__spinner-dot"></div>
                      </div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="profile-header__edit-indicator">
                      <i className="fas fa-camera"></i>
                      <span>Change Photo</span>
                    </div>
                  )}
                </div>

                {/* Admin Badge */}
                {isAdmin && (
                  <div className="profile-header__admin-badge" title="Administrator">
                    <i className="fas fa-shield-alt"></i>
                    <span className="profile-header__admin-tooltip">Admin</span>
                  </div>
                )}
              </div>

              {/* File Input */}
              <input
                type="file"
                accept="image/*"
                ref={filePickerRef}
                className="profile-header__file-input"
                onChange={handleImageChange}
                disabled={uploading}
              />

              {/* Error Message */}
              {imageError && (
                <div className="profile-header__error-message">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{imageError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Header Actions */}
          <div className="profile-header__actions">
            {/* Admin Button */}
            {isAdmin && (
              <button 
                className="profile-header__action-btn profile-header__action-btn--admin"
                onClick={handleAdminClick}
                aria-label="Go to admin panel"
              >
                <i className="fas fa-shield-alt"></i>
                <span className="profile-header__btn-text">Admin Panel</span>
                <span className="profile-header__btn-badge">New</span>
              </button>
            )}

            {/* Logout Button */}
            <button 
              className="profile-header__action-btn profile-header__action-btn--logout"
              onClick={onLogout}
              aria-label="Logout from account"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="profile-header__btn-text">Logout</span>
            </button>
          </div>
        </div>

        {/* Progress Bar for Upload */}
        {uploading && (
          <div className="profile-header__upload-progress">
            <div className="profile-header__progress-bar">
              <div className="profile-header__progress-fill"></div>
            </div>
            <span className="profile-header__progress-text">Processing your image...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
