import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import './Login.scss';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/profile');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const initializeRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: (response) => {
            console.log('reCAPTCHA verified successfully');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please verify again.');
            if (window.recaptchaVerifier) {
              window.recaptchaVerifier.clear();
              window.recaptchaVerifier = null;
            }
          }
        });

        window.recaptchaVerifier.render().catch(err => {
          console.error('Error rendering reCAPTCHA:', err);
        });
      } catch (err) {
        console.error('Error initializing reCAPTCHA:', err);
        setError('Failed to initialize verification. Please refresh the page.');
      }
    }
  };

  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeRecaptcha();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (err) {
          console.error('Error clearing reCAPTCHA:', err);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate phone number
      if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
        setError('Please enter a valid 10-digit phone number');
        setLoading(false);
        return;
      }

      const formattedPhone = `+91${phoneNumber}`;

      if (!window.recaptchaVerifier) {
        initializeRecaptcha();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(result);
      setShowOtpInput(true);
      setLoading(false);
    } catch (err) {
      console.error('Error sending OTP:', err);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMessage = 'Verification failed. Please complete the reCAPTCHA.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Reset reCAPTCHA
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clearErr) {
          console.error('Error clearing reCAPTCHA:', clearErr);
        }
        window.recaptchaVerifier = null;
      }
      
      // Reinitialize after error
      setTimeout(() => {
        initializeRecaptcha();
      }, 500);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!confirmationResult) {
        setError('Please request OTP first');
        setLoading(false);
        return;
      }

      if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        setError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      await confirmationResult.confirm(otp);
      // User will be redirected to profile by onAuthStateChanged
    } catch (err) {
      console.error('Error verifying OTP:', err);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtp('');
    setShowOtpInput(false);
    setConfirmationResult(null);
    setError('');
    
    // Reset reCAPTCHA
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (err) {
        console.error('Error clearing reCAPTCHA:', err);
      }
      window.recaptchaVerifier = null;
    }
    
    // Reinitialize
    setTimeout(() => {
      initializeRecaptcha();
    }, 500);
  };

  return (
    <div className="login">
      <div className="login__container">
        <div className="login__card">
          {/* Logo */}
          <div className="login__logo">
            <h1>AlenaTrends</h1>
            <p className="login__tagline">Your Fashion, Your Style</p>
          </div>

          {/* Login Form */}
          <div className="login__content">
            <h2 className="login__title">
              {showOtpInput ? 'Enter OTP' : 'Login with Phone'}
            </h2>
            <p className="login__subtitle">
              {showOtpInput 
                ? `OTP sent to +91${phoneNumber}` 
                : 'Enter your mobile number to continue'}
            </p>

            {error && (
              <div className="login__error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}

            {!showOtpInput ? (
              <form onSubmit={handleSendOtp} className="login__form">
                <div className="login__input-group">
                  <label htmlFor="phone">Mobile Number</label>
                  <div className="login__phone-input">
                    <span className="login__country-code">+91</span>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="Enter 10-digit number"
                      value={phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) {
                          setPhoneNumber(value);
                        }
                      }}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* reCAPTCHA Container */}
                <div id="recaptcha-container" className="login__recaptcha"></div>

                <button 
                  type="submit" 
                  className="login__btn login__btn--primary"
                  disabled={loading || phoneNumber.length !== 10}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>Send OTP</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="login__form">
                <div className="login__input-group">
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    type="text"
                    id="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setOtp(value);
                      }
                    }}
                    required
                    disabled={loading}
                    maxLength="6"
                  />
                </div>

                <button 
                  type="submit" 
                  className="login__btn login__btn--primary"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      <span>Verify & Login</span>
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={handleResendOtp}
                  className="login__btn login__btn--secondary"
                  disabled={loading}
                >
                  <i className="fas fa-redo"></i>
                  <span>Resend OTP</span>
                </button>
              </form>
            )}
          </div>

          {/* Features */}
          <div className="login__features">
            <div className="login__feature">
              <i className="fas fa-shield-alt"></i>
              <span>Secure Login</span>
            </div>
            <div className="login__feature">
              <i className="fas fa-lock"></i>
              <span>Privacy Protected</span>
            </div>
            <div className="login__feature">
              <i className="fas fa-bolt"></i>
              <span>Quick Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
