import React, { useState } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import "./Contact.scss";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    comment: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create contact submission in Firestore
      const contactRef = collection(db, "contacts");
      await addDoc(contactRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        comment: formData.comment,
        createdAt: new Date().toISOString(),
        status: "new", // Can be: new, in-progress, resolved
        replied: false
      });

      setSuccess("Thank you! Your message has been sent successfully.");
      
      // Clear form
      setFormData({
        name: "",
        email: "",
        phone: "",
        comment: ""
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setError("Failed to send message. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you. Send us a message!</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="contact-message contact-message--success">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="contact-message contact-message--error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder="Name *"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <textarea
            name="comment"
            placeholder="Comment *"
            rows="5"
            value={formData.comment}
            onChange={handleInputChange}
            required
            disabled={loading}
          ></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Sending...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane"></i>
              Send Message
            </>
          )}
        </button>
      </form>

      {/* Contact Info */}
      <div className="contact-info">
        <div className="contact-info-item">
          <i className="fas fa-envelope"></i>
          <div>
            <h4>Email</h4>
            <p>support@alenatrends.com</p>
          </div>
        </div>
        <div className="contact-info-item">
          <i className="fas fa-phone"></i>
          <div>
            <h4>Phone</h4>
            <p>+91 9876543210</p>
          </div>
        </div>
        <div className="contact-info-item">
          <i className="fas fa-map-marker-alt"></i>
          <div>
            <h4>Address</h4>
            <p>Deoria, Uttar Pradesh, India</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
