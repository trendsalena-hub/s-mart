import React, { useState, useEffect } from 'react';
import "./ProfileTab.scss";

const ProfileTab = ({ profileData, user, onProfileUpdate, onError, onSuccess, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(profileData);

  useEffect(() => {
    setFormData(profileData);
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.displayName?.trim()) {
      onError?.('Full name is required');
      return;
    }
    setSaving(true);
    const success = await onProfileUpdate(formData);
    setSaving(false);
    if (success) {
      setIsEditing(false);
      onSuccess?.('Profile updated successfully.');
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  return (
    <form onSubmit={handleSave} className="profile-page__form">
      {/* Personal Information Section */}
      <div className="profile-page__section">
        <div className="profile-page__section-header">
          <h3>
            <i className="fas fa-user-circle"></i>
            Personal Information
          </h3>
          {!isEditing && (
            <button
              type="button"
              className="profile-page__btn profile-page__btn--secondary"
              onClick={() => setIsEditing(true)}
            >
              <i className="fas fa-edit"></i>
              Edit Profile
            </button>
          )}
        </div>

        <div className="profile-page__form-grid">
          {/* Full Name */}
          <div className="profile-page__form-group">
            <label htmlFor="displayName">
              <i className="fas fa-user"></i>
              Full Name *
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              required
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="profile-page__form-group">
            <label htmlFor="email">
              <i className="fas fa-envelope"></i>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your email"
            />
          </div>

          {/* Phone */}
          <div className="profile-page__form-group">
            <label htmlFor="phone">
              <i className="fas fa-phone"></i>
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={user?.phoneNumber || ''}
              disabled
              placeholder="Phone number from authentication"
              className="disabled-field"
            />
            <small className="profile-page__field-note">
              Phone number is managed by your account authentication
            </small>
          </div>

          {/* Date of Birth */}
          <div className="profile-page__form-group">
            <label htmlFor="dateOfBirth">
              <i className="fas fa-birthday-cake"></i>
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>

          {/* Gender */}
          <div className="profile-page__form-group">
            <label htmlFor="gender">
              <i className="fas fa-venus-mars"></i>
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
            >
              <option value="">Select gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="profile-page__section">
        <div className="profile-page__section-header">
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            Address Information
          </h3>
          {!isEditing && (
            <div className="profile-page__section-note">
              Update your delivery address for faster checkout
            </div>
          )}
        </div>

        <div className="profile-page__form-grid">
          <div className="profile-page__form-group profile-page__form-group--full">
            <label htmlFor="street">
              <i className="fas fa-road"></i>
              Street Address
            </label>
            <input
              type="text"
              id="street"
              name="address.street"
              value={formData.address?.street || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter your street address, building, apartment number"
            />
          </div>

          <div className="profile-page__form-group">
            <label htmlFor="city">
              <i className="fas fa-city"></i>
              City
            </label>
            <input
              type="text"
              id="city"
              name="address.city"
              value={formData.address?.city || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter city"
            />
          </div>

          <div className="profile-page__form-group">
            <label htmlFor="state">
              <i className="fas fa-map"></i>
              State
            </label>
            <input
              type="text"
              id="state"
              name="address.state"
              value={formData.address?.state || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter state"
            />
          </div>

          <div className="profile-page__form-group">
            <label htmlFor="pincode">
              <i className="fas fa-mail-bulk"></i>
              Pincode
            </label>
            <input
              type="text"
              id="pincode"
              name="address.pincode"
              value={formData.address?.pincode || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Enter 6-digit pincode"
              maxLength="6"
              pattern="[0-9]{6}"
            />
          </div>

          <div className="profile-page__form-group">
            <label htmlFor="country">
              <i className="fas fa-globe"></i>
              Country
            </label>
            <input
              type="text"
              id="country"
              name="address.country"
              value={formData.address?.country || 'India'}
              onChange={handleInputChange}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="profile-page__section">
        <div className="profile-page__section-header">
          <h3>
            <i className="fas fa-shield-alt"></i>
            Account Information
          </h3>
        </div>

        <div className="profile-page__form-grid">
          <div className="profile-page__form-group">
            <label htmlFor="accountType">
              <i className="fas fa-user-tag"></i>
              Account Type
            </label>
            <input
              type="text"
              id="accountType"
              value={formData.role === 'admin' ? 'Administrator' : 'Customer'}
              disabled
              className="disabled-field"
            />
          </div>

          <div className="profile-page__form-group">
            <label htmlFor="memberSince">
              <i className="fas fa-calendar-plus"></i>
              Member Since
            </label>
            <input
              type="text"
              id="memberSince"
              value={user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently'}
              disabled
              className="disabled-field"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="profile-page__actions">
          <button
            type="submit"
            className="profile-page__btn profile-page__btn--primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="profile-page__button-spinner"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save Profile
              </>
            )}
          </button>

          <button
            type="button"
            className="profile-page__btn profile-page__btn--secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
        </div>
      )}

      {/* View Mode Info */}
      {!isEditing && (
        <div className="profile-page__info-note">
          <div className="profile-page__info-icon">
            <i className="fas fa-info-circle"></i>
          </div>
          <div className="profile-page__info-content">
            <h4>Profile Information</h4>
            <p>
              Keep your profile information up to date to ensure smooth order processing 
              and delivery. Click "Edit Profile" to make changes to your personal and 
              address information.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};

export default ProfileTab;
