import React, { useState, useEffect } from "react";
import { db, auth } from "../../../../../firebase/config";
import { collection, addDoc, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./HelpTab.scss";

const HelpTab = () => {
  const [helpForm, setHelpForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [userMobile, setUserMobile] = useState("");
  const [userQueries, setUserQueries] = useState([]);
  const [showUserQueries, setShowUserQueries] = useState(false);

  // Get current user and their mobile number
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user mobile number from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const mobile = userData.phoneNumber || userData.mobile || "";
            setUserMobile(mobile);
            
            // Pre-fill form with user data
            setHelpForm(prev => ({
              ...prev,
              name: userData.name || currentUser.displayName || "",
              email: currentUser.email || ""
            }));
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setUserMobile("");
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user queries when component mounts or when showUserQueries changes
  useEffect(() => {
    if (user && userMobile && showUserQueries) {
      loadUserQueries();
    }
  }, [user, userMobile, showUserQueries]);

  const handleSupportInput = (e) => {
    const { name, value } = e.target;
    setHelpForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const loadUserQueries = async () => {
    if (!userMobile) return;

    try {
      const q = query(
        collection(db, "contacts"), 
        where("mobile", "==", userMobile),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const queries = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setUserQueries(queries);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error loading queries:", error);
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    // For logged-in users, use profile mobile number
    const mobileToUse = user ? userMobile : "";

    if (user && !userMobile) {
      setError("Mobile number not found in your profile. Please update your profile first.");
      setLoading(false);
      return;
    }

    try {
      const contactRef = collection(db, "contacts");
      await addDoc(contactRef, {
        name: helpForm.name,
        email: helpForm.email,
        mobile: mobileToUse, // Using mobile from profile for logged-in users
        comment: helpForm.message,
        createdAt: new Date().toISOString(),
        status: "new",
        adminReply: null,
        repliedAt: null,
        userId: user ? user.uid : null,
        source: "help_tab" // Mark that this came from help tab
      });

      setSuccess("Thank you! Your support request has been submitted. We will resolve it shortly.");
      
      // Clear form but keep user info
      setHelpForm({
        name: user ? (user.displayName || "") : "",
        email: user ? (user.email || "") : "",
        message: ""
      });

      // Automatically show user queries after submission
      if (user) {
        setShowUserQueries(true);
      }

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Error submitting support request:", err);
      setError("Failed to send message. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="help-tab">
      <div className="help-tab__header">
        <h2>
          <i className="fas fa-question-circle"></i> Help Centre
        </h2>
        <p className="help-tab__subtitle">How can we help you today?</p>
      </div>
      <div className="help-tab__content">

        {/* FAQ - Unchanged */}
        <ul className="help-tab__faq-list">
          <li>
            <span className="help-tab__q">How do I update my account information?</span>
            <span className="help-tab__a">Click 'Edit Profile' on the personal information tab, make your changes, and then save.</span>
          </li>
          <li>
            <span className="help-tab__q">How can I view my previous orders?</span>
            <span className="help-tab__a">Go to the <b>Orders</b> tab in your profile sidebar to see your order history.</span>
          </li>
          <li>
            <span className="help-tab__q">I need support. Where do I reach out?</span>
            <span className="help-tab__a">Use the contact form below to submit your query. We'll respond to your registered mobile number.</span>
          </li>
        </ul>

        {/* Success/Error Messages */}
        {success && (
          <div className="help-tab__message help-tab__message--success">
            <i className="fas fa-check-circle"></i> 
            <div className="help-tab__message-content">
              <span className="help-tab__message-title">Thank You!</span>
              <span className="help-tab__message-text">{success}</span>
            </div>
          </div>
        )}
        {error && (
          <div className="help-tab__message help-tab__message--error">
            <i className="fas fa-exclamation-circle"></i> 
            <span>{error}</span>
          </div>
        )}

        {/* User Queries Section - Only show if user has queries */}
        {user && userQueries.length > 0 && (
          <div className="help-tab__queries">
            <div className="help-tab__queries-header">
              <h4>
                <i className="fas fa-history"></i> Your Previous Queries
                <button 
                  className="help-tab__toggle-queries"
                  onClick={() => setShowUserQueries(!showUserQueries)}
                >
                  <i className={`fas fa-${showUserQueries ? 'chevron-up' : 'chevron-down'}`}></i>
                </button>
              </h4>
            </div>
            
            {showUserQueries && (
              <div className="help-tab__queries-list">
                {userQueries.map(query => (
                  <div key={query.id} className="help-tab__query-item">
                    <div className="help-tab__query-header">
                      <span className="help-tab__query-date">
                        {new Date(query.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`help-tab__query-status help-tab__query-status--${query.status}`}>
                        {query.status}
                      </span>
                    </div>
                    <div className="help-tab__query-message">
                      <p>{query.comment}</p>
                      {query.adminReply && (
                        <div className="help-tab__admin-reply">
                          <strong>
                            <i className="fas fa-reply"></i> Admin Response:
                          </strong>
                          <p>{query.adminReply}</p>
                          {query.repliedAt && (
                            <small>
                              Replied on: {new Date(
                                query.repliedAt?.toDate?.() || query.repliedAt
                              ).toLocaleDateString()}
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Support Form - Unchanged UI */}
        <div className="help-tab__contact">
          <h4>Contact Support</h4>
          <form
            className="help-tab__form"
            onSubmit={handleSupportSubmit}
          >
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={helpForm.name}
              onChange={handleSupportInput}
              required
              disabled={loading}
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={helpForm.email}
              onChange={handleSupportInput}
              required
              disabled={loading || user} // Disable email if user is logged in
            />
            {user && !userMobile && (
              <div className="help-tab__mobile-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Mobile number not found in profile. Please update your profile to submit queries.</span>
              </div>
            )}
            <textarea
              name="message"
              rows={4}
              placeholder="How can we help you?"
              value={helpForm.message}
              onChange={handleSupportInput}
              required
              disabled={loading}
            />
            <button 
              type="submit" 
              className="help-tab__submit" 
              disabled={loading || (user && !userMobile)}
            >
              {loading ?
                (<><i className="fas fa-spinner fa-spin"></i> Submitting...</>) :
                (<><i className="fas fa-paper-plane"></i> Submit Request</>)
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HelpTab;