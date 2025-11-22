import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/config.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

  const [paymentStatus, setPaymentStatus] = useState('selecting');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'fas fa-mobile-alt', description: 'Pay using UPI apps like Google Pay, PhonePe, Paytm', popular: true },
    { id: 'card', name: 'Credit/Debit Card', icon: 'fas fa-credit-card', description: 'Visa, Mastercard, RuPay cards', popular: false },
    { id: 'netbanking', name: 'Net Banking', icon: 'fas fa-university', description: 'Pay using bank account', popular: false },
    { id: 'wallet', name: 'Wallet', icon: 'fas fa-wallet', description: 'Paytm Wallet, Amazon Pay etc', popular: false }
  ];

  const upiApps = [
    { id: 'gpay', name: 'Google Pay', icon: 'fab fa-google-pay' },
    { id: 'phonepe', name: 'PhonePe', icon: 'fas fa-mobile-alt' },
    { id: 'paytm', name: 'Paytm UPI', icon: 'fab fa-paytm' },
    { id: 'bhim', name: 'BHIM UPI', icon: 'fas fa-indian-rupee-sign' },
    { id: 'other', name: 'Other UPI Apps', icon: 'fas fa-mobile-alt' }
  ];

  const cardTypes = [
    { id: 'visa', name: 'Visa', icon: 'fab fa-cc-visa' },
    { id: 'mastercard', name: 'Mastercard', icon: 'fab fa-cc-mastercard' },
    { id: 'rupay', name: 'RuPay', icon: 'fas fa-credit-card' },
    { id: 'amex', name: 'American Express', icon: 'fab fa-cc-amex' }
  ];

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else navigate('/login');
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
      setAmountToPay(location.state.amountToPay);
      setIsCod(location.state.isCod || false);
      setIsBuyNow(location.state.isBuyNow || false);
    } else {
      navigate('/checkout');
    }
  }, [location.state, navigate]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    switch (selectedMethod) {
      case 'upi':
        return formData.upiId.includes('@') && formData.selectedUpiApp;
      case 'card':
        return (
          formData.cardNumber.length === 16 &&
          formData.cardName &&
          formData.cardExpiry.length === 5 &&
          formData.cardCvv.length === 3 &&
          formData.cardType
        );
      case 'netbanking':
        return formData.netbankingBank;
      case 'wallet':
        return formData.walletType;
      default:
        return false;
    }
  };

  // FINAL PAYMENT PROCESSOR
  const handleFinalizePayment = async () => {
    if (!user || !orderData || !validateForm()) return;

    setPlacingOrder(true);
    setPaymentStatus('processing');

    await new Promise(res => setTimeout(res, 3000));

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

      // 1️⃣ CREATE ORDER
      const orderRef = await addDoc(collection(db, "orders"), finalOrderData);

      // 2️⃣ CREATE NOTIFICATION (UPDATED)
      await addDoc(collection(db, "notifications"), {
        type: "order",
        title: "Order Update",
        message: `Your order is now Confirmed`,
        status: "confirmed",
        docId: orderRef.id,
        collection: "orders",
        isRead: false,
        createdAt: serverTimestamp(),
      
        // 🟢 NEW FIELDS FOR IMAGE + PRODUCT NAME
        productImage: orderData.items?.[0]?.image || "",
        productName: orderData.items?.[0]?.title || "",
        quantity: orderData.items?.[0]?.quantity || 1,
      });
      

      // CLEAR CART
      if (!isBuyNow) clearCart();

      setPaymentStatus("success");
      setTimeout(() => navigate("/profile", { state: { tab: "orders" } }), 2000);

    } catch (error) {
      console.error(error);
      setPaymentStatus("failed");
      setPlacingOrder(false);
    }
  };

  if (!orderData) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="payment-page__box">
            <i className="fas fa-spinner fa-spin payment-spinner"></i>
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

          {/* PAYMENT SELECTION */}
          {paymentStatus === 'selecting' && (
            <>
              <div className="payment-page__header">
                <i className="fas fa-shield-alt payment-icon"></i>
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

              {/* PAYMENT METHODS */}
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
                        <div className="payment-method__icon"><i className={method.icon}></i></div>
                        <div className="payment-method__info">
                          <h4>{method.name}</h4>
                          <p>{method.description}</p>
                        </div>
                        {method.popular && <span className="payment-method__badge">Popular</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PAYMENT FORM */}
              {selectedMethod && (
                <div className="payment-form">

                  {/* UPI */}
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
                              onClick={() => setFormData(prev => ({ ...prev, selectedUpiApp: app.id }))}
                            >
                              <i className={app.icon}></i>
                              <span>{app.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label>UPI ID</label>
                        <input
                          name="upiId"
                          type="text"
                          placeholder="yourname@upi"
                          value={formData.upiId}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}

                  {/* CARD */}
                  {selectedMethod === 'card' && (
                    <div className="payment-form__section">
                      <h4>Enter Card Details</h4>

                      <div className="card-types__grid">
                        {cardTypes.map(card => (
                          <div
                            key={card.id}
                            className={`card-type ${formData.cardType === card.id ? "card-type--selected" : ""}`}
                            onClick={() => setFormData(prev => ({ ...prev, cardType: card.id }))}
                          >
                            <i className={card.icon}></i>
                            <span>{card.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="form-group">
                        <label>Card Number</label>
                        <input
                          name="cardNumber"
                          maxLength="16"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Name on Card</label>
                          <input name="cardName" value={formData.cardName} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label>Expiry (MM/YY)</label>
                          <input name="cardExpiry" maxLength="5" value={formData.cardExpiry} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                          <label>CVV</label>
                          <input name="cardCvv" maxLength="3" value={formData.cardCvv} onChange={handleInputChange} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NET BANKING */}
                  {selectedMethod === 'netbanking' && (
                    <div className="payment-form__section">
                      <h4>Select Your Bank</h4>
                      <select name="netbankingBank" value={formData.netbankingBank} onChange={handleInputChange}>
                        <option value="">Choose Bank</option>
                        <option value="sbi">SBI</option>
                        <option value="hdfc">HDFC</option>
                        <option value="icici">ICICI</option>
                        <option value="axis">Axis</option>
                      </select>
                    </div>
                  )}

                  {/* WALLET */}
                  {selectedMethod === 'wallet' && (
                    <div className="payment-form__section">
                      <h4>Select Wallet</h4>
                      <select name="walletType" value={formData.walletType} onChange={handleInputChange}>
                        <option value="">Choose Wallet</option>
                        <option value="paytm">Paytm</option>
                        <option value="amazon">Amazon Pay</option>
                        <option value="mobikwik">MobiKwik</option>
                      </select>
                    </div>
                  )}

                  <button className="payment-btn" disabled={!validateForm()} onClick={handleFinalizePayment}>
                    <i className="fas fa-lock"></i>
                    Pay ₹{amountToPay.toLocaleString()} via {selectedMethod.toUpperCase()}
                  </button>
                </div>
              )}

              <div className="payment-secure">
                <i className="fas fa-shield-alt"></i> Your payment is secure and encrypted
              </div>
            </>
          )}

          {/* PAYMENT STATUS */}
          {(placingOrder || paymentStatus !== "selecting") && (
            <div className="payment-status">
              <div className={`payment-status__icon ${paymentStatus}`}>
                {paymentStatus === "processing" && <i className="fas fa-spinner fa-spin"></i>}
                {paymentStatus === "success" && <i className="fas fa-check-circle"></i>}
                {paymentStatus === "failed" && <i className="fas fa-times-circle"></i>}
              </div>

              <h3 className={`payment-status__title ${paymentStatus}`}>
                {paymentStatus === "processing" && "Processing Payment..."}
                {paymentStatus === "success" && "Payment Successful!"}
                {paymentStatus === "failed" && "Payment Failed"}
              </h3>

              <p className="payment-status__message">
                {paymentStatus === "processing" && "Do not refresh the page."}
                {paymentStatus === "success" && "Your order has been confirmed."}
                {paymentStatus === "failed" && "Something went wrong, please try again."}
              </p>

              {paymentStatus === "failed" && (
                <button className="btn btn--primary" onClick={() => setPaymentStatus("selecting")}>
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
