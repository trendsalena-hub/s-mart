import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config.js';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../../components/context/CartContext.jsx';
import './PaymentPage.scss';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [orderData, setOrderData] = useState(null);
  const [amountToPay, setAmountToPay] = useState(0);
  const [isCod, setIsCod] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [user, setUser] = useState(null);
  
  const [paymentStatus, setPaymentStatus] = useState('selecting'); // selecting, processing, success, failed
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');

  // Payment methods data
  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI',
      icon: 'fas fa-mobile-alt',
      description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm',
      popular: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'fas fa-credit-card',
      description: 'Pay using Visa, Mastercard, RuPay cards',
      popular: false
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: 'fas fa-university',
      description: 'Pay directly through your bank account',
      popular: false
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: 'fas fa-wallet',
      description: 'Pay using Paytm Wallet, Amazon Pay, etc.',
      popular: false
    }
  ];

  // UPI Apps
  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: 'fab fa-google-pay' },
    { id: 'phonepe', name: 'PhonePe', icon: 'fas fa-mobile-alt' },
    { id: 'paytm', name: 'Paytm UPI', icon: 'fab fa-paytm' },
    { id: 'bhim', name: 'BHIM UPI', icon: 'fas fa-indian-rupee-sign' },
    { id: 'other', name: 'Other UPI Apps', icon: 'fas fa-mobile-alt' }
  ];

  // Card types
  const cardTypes = [
    { id: 'visa', name: 'Visa', icon: 'fab fa-cc-visa' },
    { id: 'mastercard', name: 'Mastercard', icon: 'fab fa-cc-mastercard' },
    { id: 'rupay', name: 'RuPay', icon: 'fas fa-credit-card' },
    { id: 'amex', name: 'American Express', icon: 'fab fa-cc-amex' }
  ];

  // Form states
  const [formData, setFormData] = useState({
    upiId: '',
    selectedUpiApp: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    cardType: '',
    netbankingBank: '',
    walletType: ''
  });

  // Get user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Get order details from navigation state
  useEffect(() => {
    if (location.state?.orderData && location.state?.amountToPay !== undefined) {
      setOrderData(location.state.orderData);
      setAmountToPay(location.state.amountToPay);
      setIsCod(location.state.isCod || false);
      setIsBuyNow(location.state.isBuyNow || false);
    } else {
      navigate('/checkout');
    }
  }, [location.state, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle UPI app selection
  const handleUpiAppSelect = (appId) => {
    setFormData(prev => ({
      ...prev,
      selectedUpiApp: appId
    }));
  };

  // Handle card type selection
  const handleCardTypeSelect = (cardType) => {
    setFormData(prev => ({
      ...prev,
      cardType
    }));
  };

  // Validate form based on selected method
  const validateForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return formData.upiId.includes('@') && formData.selectedUpiApp;
      case 'card':
        return formData.cardNumber.length === 16 && 
               formData.cardName.trim() && 
               formData.cardExpiry.length === 5 &&
               formData.cardCvv.length === 3 &&
               formData.cardType;
      case 'netbanking':
        return formData.netbankingBank;
      case 'wallet':
        return formData.walletType;
      default:
        return false;
    }
  };

  // Simulate payment processing
  const handleFinalizePayment = async () => {
    if (!user || !orderData || !validateForm()) return;

    setPlacingOrder(true);
    setPaymentStatus('processing');

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const finalOrderData = {
        ...orderData,
        paymentStatus: isCod ? 'security_paid' : 'paid',
        status: 'confirmed',
        paymentMethod: selectedMethod,
        paymentDetails: formData,
        paymentId: `pay_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), finalOrderData);

      if (!isBuyNow) {
        clearCart();
      }
      
      setPaymentStatus('success');

      setTimeout(() => {
        navigate('/profile', { state: { tab: 'orders' } });
      }, 2000);

    } catch (error) {
      console.error("Error placing order:", error);
      setPaymentStatus('failed');
      setPlacingOrder(false);
    }
  };

  if (!orderData) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-page__box">
            <i className="payment-spinner fas fa-spinner fa-spin"></i>
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-page__box">
          
          {/* Payment Selection */}
          {paymentStatus === 'selecting' && (
            <>
              <div className="payment-page__header">
                <i className="payment-icon fas fa-shield-alt"></i>
                <h2>Secure Payment</h2>
                <p>Choose your preferred payment method</p>
              </div>

              <div className="payment-page__summary">
                <div className="summary-row">
                  <span>{isCod ? "Security Deposit:" : "Total Amount:"}</span>
                  <span>₹{amountToPay.toLocaleString()}</span>
                </div>
                <div className="summary-row total">
                  <span>Amount to Pay Now</span>
                  <span>₹{amountToPay.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="payment-methods">
                <h3>Select Payment Method</h3>
                <div className="payment-methods__grid">
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`payment-method ${selectedMethod === method.id ? 'payment-method--selected' : ''}`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="payment-method__header">
                        <div className="payment-method__icon">
                          <i className={method.icon}></i>
                        </div>
                        <div className="payment-method__info">
                          <h4>{method.name}</h4>
                          <p>{method.description}</p>
                        </div>
                        {method.popular && (
                          <span className="payment-method__badge">Popular</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Forms */}
              {selectedMethod && (
                <div className="payment-form">
                  
                  {/* UPI Form */}
                  {selectedMethod === 'upi' && (
                    <div className="payment-form__section">
                      <h4>Enter UPI Details</h4>
                      <div className="upi-apps">
                        <p>Select your UPI app:</p>
                        <div className="upi-apps__grid">
                          {upiApps.map(app => (
                            <div
                              key={app.id}
                              className={`upi-app ${formData.selectedUpiApp === app.id ? 'upi-app--selected' : ''}`}
                              onClick={() => handleUpiAppSelect(app.id)}
                            >
                              <i className={app.icon}></i>
                              <span>{app.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="upiId">UPI ID</label>
                        <input
                          id="upiId"
                          name="upiId"
                          type="text"
                          className="form-control"
                          placeholder="yourname@upi"
                          value={formData.upiId}
                          onChange={handleInputChange}
                        />
                        <small>Enter your UPI ID (e.g., yourname@okicici)</small>
                      </div>
                    </div>
                  )}

                  {/* Card Form */}
                  {selectedMethod === 'card' && (
                    <div className="payment-form__section">
                      <h4>Enter Card Details</h4>
                      <div className="card-types">
                        <p>Select card type:</p>
                        <div className="card-types__grid">
                          {cardTypes.map(card => (
                            <div
                              key={card.id}
                              className={`card-type ${formData.cardType === card.id ? 'card-type--selected' : ''}`}
                              onClick={() => handleCardTypeSelect(card.id)}
                            >
                              <i className={card.icon}></i>
                              <span>{card.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                          id="cardNumber"
                          name="cardNumber"
                          type="text"
                          className="form-control"
                          placeholder="1234 5678 9012 3456"
                          maxLength="16"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="cardName">Name on Card</label>
                          <input
                            id="cardName"
                            name="cardName"
                            type="text"
                            className="form-control"
                            placeholder="John Doe"
                            value={formData.cardName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cardExpiry">Expiry Date</label>
                          <input
                            id="cardExpiry"
                            name="cardExpiry"
                            type="text"
                            className="form-control"
                            placeholder="MM/YY"
                            maxLength="5"
                            value={formData.cardExpiry}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="cardCvv">CVV</label>
                          <input
                            id="cardCvv"
                            name="cardCvv"
                            type="text"
                            className="form-control"
                            placeholder="123"
                            maxLength="3"
                            value={formData.cardCvv}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Net Banking Form */}
                  {selectedMethod === 'netbanking' && (
                    <div className="payment-form__section">
                      <h4>Select Your Bank</h4>
                      <div className="form-group">
                        <label htmlFor="netbankingBank">Bank Name</label>
                        <select
                          id="netbankingBank"
                          name="netbankingBank"
                          className="form-control"
                          value={formData.netbankingBank}
                          onChange={handleInputChange}
                        >
                          <option value="">Select your bank</option>
                          <option value="sbi">State Bank of India</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                          <option value="kotak">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Wallet Form */}
                  {selectedMethod === 'wallet' && (
                    <div className="payment-form__section">
                      <h4>Select Wallet</h4>
                      <div className="form-group">
                        <label htmlFor="walletType">Wallet Provider</label>
                        <select
                          id="walletType"
                          name="walletType"
                          className="form-control"
                          value={formData.walletType}
                          onChange={handleInputChange}
                        >
                          <option value="">Select your wallet</option>
                          <option value="paytm">Paytm Wallet</option>
                          <option value="amazon">Amazon Pay</option>
                          <option value="mobikwik">MobiKwik</option>
                          <option value="freecharge">FreeCharge</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button 
                    className="payment-btn" 
                    onClick={handleFinalizePayment}
                    disabled={!validateForm()}
                  >
                    <i className="fas fa-lock"></i>
                    Pay ₹{amountToPay.toLocaleString()} via {selectedMethod.toUpperCase()}
                  </button>
                </div>
              )}

              {/* Security Info */}
              <div className="payment-secure">
                <i className="fas fa-shield-alt"></i>
                <span>Your payment details are secure and encrypted</span>
              </div>
            </>
          )}

          {/* Processing/Success/Failed States */}
          {(placingOrder || paymentStatus !== 'selecting') && (
            <div className="payment-status">
              <div className={`payment-status__icon ${paymentStatus}`}>
                {paymentStatus === 'processing' && (
                  <i className="fas fa-spinner fa-spin"></i>
                )}
                {paymentStatus === 'success' && (
                  <i className="fas fa-check-circle"></i>
                )}
                {paymentStatus === 'failed' && (
                  <i className="fas fa-times-circle"></i>
                )}
              </div>
              
              <h3 className={`payment-status__title ${paymentStatus}`}>
                {paymentStatus === 'processing' && 'Processing Payment...'}
                {paymentStatus === 'success' && 'Payment Successful!'}
                {paymentStatus === 'failed' && 'Payment Failed'}
              </h3>
              
              <p className="payment-status__message">
                {paymentStatus === 'processing' && 'Please wait while we process your payment. Do not refresh the page.'}
                {paymentStatus === 'success' && 'Your order has been confirmed successfully. Redirecting to orders...'}
                {paymentStatus === 'failed' && 'There was an issue processing your payment. Please try again.'}
              </p>

              {paymentStatus === 'failed' && (
                <button 
                  className="btn btn--primary"
                  onClick={() => setPaymentStatus('selecting')}
                >
                  Try Again
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentPage;