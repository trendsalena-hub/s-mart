import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";
import "./Footer.scss";

const Footer = () => {
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    const email = e.target.elements.email.value.trim().toLowerCase();
    if (!email) return alert("Please enter an email address");

    setSubscribing(true);

    try {
      // Call Firebase Cloud Function
      const subscribeFn = httpsCallable(functions, "subscribeToNewsletter");
      const response = await subscribeFn({ email });

      if (response?.data?.success) {
        alert("🎉 Subscribed successfully! Check your email.");
        e.target.reset();
      } else {
        alert("Subscription failed.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("Subscription failed. Please try again later.");
    }

    setSubscribing(false);
  };

  return (
    <footer className="footer">
      {/* Main Footer */}
      <div className="footer__main">
        <div className="container">
          <div className="footer__grid">
            
            {/* About */}
            <div className="footer__section">
              <h3 className="footer__title">About AlenaTrends</h3>
              <p className="footer__text">
                Discover the latest trends in women's fashion. Quality ethnic,
                western and casual wear at affordable prices. Elegance meets
                modern style.
              </p>

              <div className="footer__social">
                <a href="https://facebook.com/alenatrends" target="_blank">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://instagram.com/alenatrends_fashion" target="_blank">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://twitter.com/alenatrends" target="_blank">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://youtube.com/alenatrends" target="_blank">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer__section">
              <h3 className="footer__title">Quick Links</h3>
              <ul className="footer__links">
                <li><a href="/about">About Us</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/shipping">Shipping Policy</a></li>
                <li><a href="/faq">FAQ</a></li>
              </ul>
            </div>

            {/* Categories */}
            <div className="footer__section">
              <h3 className="footer__title">Categories</h3>
              <ul className="footer__links">
                <li><a href="/collections">Collection</a></li>
                <li><a href="/ethnic">Ethnic Wear</a></li>
                <li><a href="/western">Western Wear</a></li>
                <li><a href="/new-arrivals">New Arrivals</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="footer__section">
              <h3 className="footer__title">Contact Us</h3>
              <ul className="footer__contact">
                <li>
                  <i className="fas fa-map-marker-alt"></i> 
                  <span>123 Fashion Street, Mumbai, India</span>
                </li>
                <li>
                  <i className="fas fa-phone"></i> 
                  <span>+91 1234567890</span>
                </li>
                <li>
                  <i className="fas fa-envelope"></i> 
                  <span>info@alenatrends.com</span>
                </li>
                <li>
                  <i className="fas fa-clock"></i> 
                  <span>Mon - Sat: 10 AM - 7 PM</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="footer__newsletter">
        <div className="container">
          <div className="footer__newsletter-content">
            <div className="footer__newsletter-text">
              <h3>Subscribe to our Newsletter</h3>
              <p>Get latest updates on new arrivals and exclusive offers</p>
            </div>

            <form className="footer__newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="footer__newsletter-input"
                required
                disabled={subscribing}
              />
              <button type="submit" className="footer__newsletter-btn" disabled={subscribing}>
                {subscribing ? "Please wait..." : "Subscribe"}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer__bottom">
        <div className="container">
          <div className="footer__bottom-content">
            <p className="footer__copyright">
              © {new Date().getFullYear()} AlenaTrends. All rights reserved.
            </p>

            <div className="footer__payment">
              <span>We Accept:</span>
              <div className="footer__payment-icons">
                <i className="fab fa-cc-visa"></i>
                <i className="fab fa-cc-mastercard"></i>
                <i className="fab fa-cc-paypal"></i>
                <i className="fab fa-google-pay"></i>
                <i className="fab fa-cc-amex"></i>
              </div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
