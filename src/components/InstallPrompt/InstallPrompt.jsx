import React, { useEffect, useState, useRef } from "react";
import './InstallPrompt.scss';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const filePickerRef = useRef();

  useEffect(() => {
    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
    if (isInstalled) {
      console.log("✅ App already installed");
      return;
    }

    // Check if user dismissed prompt recently (within 7 days)
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        console.log("⏰ Install prompt dismissed recently");
        return;
      }
    }

    // Detect iOS devices (Safari lacks beforeinstallprompt)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    if (iOS) {
      setTimeout(() => {
        setVisible(true);
      }, 3000);
      return;
    }

    // Listen for beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      console.log("✅ beforeinstallprompt event triggered");
      setDeferredPrompt(e);
      setTimeout(() => {
        setVisible(true);
      }, 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log("User choice:", outcome);

    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
    console.log("ℹ️ Install prompt dismissed by user");
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible || dismissed) return null;

  if (isIOS) {
    // iOS-specific prompt UI
    return (
      <div className="install-prompt install-prompt--ios">
        <div className="install-prompt__overlay" onClick={handleClose}></div>
        <div className="install-prompt__content">
          <button 
            className="install-prompt__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
          <div className="install-prompt__header">
            <img src="/logo192.png" alt="Alena Trends" className="install-prompt__icon" />
            <h3 className="install-prompt__title">Install Alena Trends</h3>
          </div>
          <p className="install-prompt__description">
            Install our app on your iPhone for a better shopping experience!
          </p>
          <div className="install-prompt__steps">
            <div className="install-prompt__step">
              <span className="install-prompt__step-number">1</span>
              <span className="install-prompt__step-text">
                Tap the <i className="fas fa-share"></i> Share button
              </span>
            </div>
            <div className="install-prompt__step">
              <span className="install-prompt__step-number">2</span>
              <span className="install-prompt__step-text">
                Select "Add to Home Screen" <i className="fas fa-plus-square"></i>
              </span>
            </div>
            <div className="install-prompt__step">
              <span className="install-prompt__step-number">3</span>
              <span className="install-prompt__step-text">
                Tap "Add" to install
              </span>
            </div>
          </div>
          <button className="install-prompt__dismiss-btn" onClick={handleDismiss}>Maybe Later</button>
        </div>
      </div>
    );
  }

  // Android/Desktop prompt UI
  return (
    <div className="install-prompt install-prompt--android">
      <div className="install-prompt__card">
        <button 
          className="install-prompt__close-small"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <i className="fas fa-times"></i>
        </button>
        <div className="install-prompt__card-content">
          <img src="/favicon-32x32.png" alt="Alena Trends" className="install-prompt__card-icon" />
          <div className="install-prompt__card-info">
            <h4 className="install-prompt__card-title">Alena Trends</h4>
            <p className="install-prompt__card-subtitle">Install app for quick access</p>
          </div>
        </div>
        <div className="install-prompt__card-actions">
          <button onClick={handleDismiss} className="install-prompt__btn install-prompt__btn--secondary">Not Now</button>
          <button onClick={handleInstall} className="install-prompt__btn install-prompt__btn--primary">
            <i className="fas fa-download"></i>Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
