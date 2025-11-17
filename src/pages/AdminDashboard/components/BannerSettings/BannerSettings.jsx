import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, storage } from "../../../../firebase/config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './BannerSettings.scss';

const BannerSettings = ({ onSuccess, onError }) => {
  const [banners, setBanners] = useState([]); // array of {id, type, url, text}
  const [textHighlight, setTextHighlight] = useState('Get 10% off and Free Delivery on all orders');
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef();
  const videoInputRef = useRef();

  // Load banners and highlight data
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'settings', 'banner');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setBanners(data.banners || []);
          setTextHighlight(data.text || '');
          setHighlightEnabled(data.enabled !== false);
        }
      } catch (err) {
        onError?.('Failed to load banner settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onError]);

  // Upload image or video
  const handleBannerUpload = async (files, type) => {
    setUploading(true);
    for (const file of files) {
      const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const storagePath = `home_banners/${id}-${file.name}`;
      const bannerRef = ref(storage, storagePath);
      try {
        await uploadBytes(bannerRef, file);
        const url = await getDownloadURL(bannerRef);
        setBanners(prev => [...prev, { id, type, url }]);
      } catch {
        onError?.(`Failed to upload ${type}`);
      }
    }
    setUploading(false);
  };

  // Remove a banner
  const handleRemove = async (bannerId, url) => {
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    try {
      // Remove from Storage if possible
      if (url) {
        const bannerRef = ref(storage, url);
        await deleteObject(bannerRef).catch(() => {});
      }
    } catch {}
  };

  // Remove all highlights
const handleRemoveHighlight = async () => {
  setTextHighlight('');
  setHighlightEnabled(false);

  try {
    await setDoc(doc(db, 'settings', 'banner'), {
      banners,
      text: '',        // highlight removed
      enabled: false,  // highlight disabled
      updatedAt: new Date().toISOString()
    }, { merge: true }); // Only update the relevant fields, merge with others
    onSuccess?.('Highlight removed!');
  } catch (err) {
    onError?.('Failed to remove highlight. Please try again.');
  }
};


  // Save all (banners, highlight text, etc)
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    onError?.('');
    onSuccess?.('');
    try {
      await setDoc(doc(db, 'settings', 'banner'), {
        banners,
        text: textHighlight,
        enabled: highlightEnabled,
        updatedAt: new Date().toISOString()
      });
      onSuccess?.('Banner settings updated!');
    } catch {
      onError?.('Failed to update banner settings.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="admin-dashboard__card">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading banner settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard__card">
      <h2>Banner Settings</h2>
      <p className="admin-dashboard__description">
        Manage homepage image/video banners and highlight text.
      </p>
      <form onSubmit={handleSave} className="banner-form">
        {/* Banner Carousel Preview */}
        <div className="banner-form__banners">
          <div className="banner-form__banners-list">
            {banners.length === 0 && <div className="banner-form__preview-banner--disabled">No banners</div>}
            {banners.map((b, idx) =>
              <div className="banner-form__banner-item" key={b.id || idx}>
                {b.type === 'image' ? (
                  <img src={b.url} alt="Banner" className="banner-form__banner-img" />
                ) : (
                  <video src={b.url} controls className="banner-form__banner-video" />
                )}
                <button
                  type="button"
                  className="banner-form__remove-btn"
                  onClick={() => handleRemove(b.id, b.url)}
                  disabled={uploading}
                  title="Remove banner"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            )}
          </div>
          <div className="banner-form__actions">
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              ref={imageInputRef}
              onChange={e => handleBannerUpload(e.target.files, 'image')}
              disabled={uploading}
            />
            <button type="button" onClick={() => imageInputRef.current.click()} disabled={uploading}>
              <i className="fas fa-image"></i> Add Images
            </button>
            <input
              type="file"
              accept="video/*"
              multiple
              hidden
              ref={videoInputRef}
              onChange={e => handleBannerUpload(e.target.files, 'video')}
              disabled={uploading}
            />
            <button type="button" onClick={() => videoInputRef.current.click()} disabled={uploading}>
              <i className="fas fa-video"></i> Add Video
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="bannerText">Highlight Text</label>
          <input
            type="text"
            id="bannerText"
            value={textHighlight}
            onChange={e => setTextHighlight(e.target.value)}
            placeholder="Enter banner message"
            maxLength="100"
            disabled={!highlightEnabled || loading}
          />
          <small className="banner-form__char-count">
            {textHighlight.length}/100 characters
          </small>
          <div>
            <label className="checkbox-label" style={{marginRight:8}}>
              <input
                type="checkbox"
                checked={highlightEnabled}
                onChange={e => setHighlightEnabled(e.target.checked)}
                />
              <span>Enable Highlight Text</span>
            </label>
            <button
              type="button"
              className="banner-form__remove-btn"
              onClick={handleRemoveHighlight}
              disabled={!highlightEnabled}
              title="Remove Highlight Text"
              style={{marginLeft:10}}
            >
              <i className="fas fa-trash-alt"></i> Remove
            </button>
          </div>
        </div>
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn--primary"
            disabled={uploading || loading}
          >
            {uploading || loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Update Banner Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default BannerSettings;
