import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase/config.js";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  doc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./Contact.scss";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    comment: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [userMobile, setUserMobile] = useState("");
  const [userQueries, setUserQueries] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [unsubscribeListener, setUnsubscribeListener] = useState(null);
  const [showUserQueries, setShowUserQueries] = useState(false);

  // Get current user and their mobile number from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user mobile number from Firestore: users/<USER_ID>/phoneNumber
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const mobile = userData.phoneNumber || userData.mobile || "";
            setUserMobile(mobile);
            
            // Auto-fill form with user data
            setFormData(prev => ({
              ...prev,
              name: userData.name || currentUser.displayName || ""
            }));
            
            // Auto-load user queries when mobile is available
            if (mobile) {
              setShowUserQueries(true);
            }
          } else {
            console.log("User document not found");
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUser(null);
        setUserMobile("");
        setUserQueries([]);
        setShowUserQueries(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeListener) {
        unsubscribeListener();
      }
    };
  }, [unsubscribeListener]);

  // Auto-load user queries when user mobile is available
  useEffect(() => {
    if (userMobile && showUserQueries) {
      loadUserQueries(userMobile);
    }
  }, [userMobile, showUserQueries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate required fields
    if (!formData.name.trim() || !formData.comment.trim()) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    // For logged-in users, ensure we have mobile from Firebase
    if (user && !userMobile) {
      setError("Mobile number not found in your profile. Please update your profile first.");
      setLoading(false);
      return;
    }

    try {
      const contactRef = collection(db, "contacts");
      
      // Use the mobile number from Firebase user document
      await addDoc(contactRef, {
        name: formData.name,
        mobile: userMobile, // Using mobile from users/<UID>/phoneNumber
        comment: formData.comment,
        createdAt: new Date().toISOString(),
        status: "new",
        adminReply: null,
        repliedAt: null,
        userId: user ? user.uid : null,
        userEmail: user ? user.email : null
      });

      setSuccess("Thank you! Your query has been submitted. We will resolve it shortly.");
      
      // Clear form but keep name
      setFormData({
        name: user ? (user.displayName || "") : "",
        comment: ""
      });

      // Automatically show queries for logged-in users
      if (user) {
        setShowUserQueries(true);
      }

      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      console.error("Error submitting contact form:", err);
      setError("Failed to send message. Please try again.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Load queries by mobile number
  const loadUserQueries = async (mobileNumber) => {
    if (!mobileNumber) {
      setCheckError('Mobile number not available');
      return;
    }

    setIsChecking(true);
    setCheckError('');
    setUserQueries([]);

    // Clean up previous listener
    if (unsubscribeListener) {
      unsubscribeListener();
    }

    try {
      const q = query(
        collection(db, "contacts"), 
        where("mobile", "==", mobileNumber),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
          setCheckError('No queries found for your account.');
          setUserQueries([]);
        } else {
          const queries = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          }));
          setUserQueries(queries);
          setCheckError('');
        }
        setIsChecking(false);
      }, (error) => {
        console.error("Error listening to query status:", error);
        setCheckError('Failed to load your queries. Please try again.');
        setIsChecking(false);
      });

      setUnsubscribeListener(() => unsubscribe);

    } catch (error) {
      console.error("Error setting up query listener:", error);
      setCheckError('Failed to load your queries. Please try again.');
      setIsChecking(false);
    }
  };

  // Toggle showing user queries
  const toggleUserQueries = () => {
    if (user && userMobile) {
      setShowUserQueries(!showUserQueries);
      if (!showUserQueries) {
        loadUserQueries(userMobile);
      }
    }
  };

  return (
    <div className="contact-page-wrapper">
      <div className="container">
        <div className="contact-grid">
          
          {/* Section 1: Submit a Query */}
          <div className="contact-form-section">
            <div className="contact-header">
              <h1>Contact Support</h1>
              <p>Have questions or need assistance? We're here to help!</p>
              
            </div>

            {/* Success Message */}
            {success && (
              <div className="contact-message contact-message--success">
                <i className="fas fa-check-circle"></i>
                <div className="success-content">
                  <span className="success-title">Thank You!</span>
                  <span className="success-message">Your query has been submitted. We will resolve it shortly.</span>
                </div>
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
                  {user ? (
                    <div className="mobile-display-input">
                      <div className="mobile-display-value">
                        <i className="fas fa-mobile-alt"></i>
                        <span>{userMobile || "Not set in profile"}</span>
                      </div>
                      {!userMobile && (
                        <small className="mobile-error">
                          <i className="fas fa-exclamation-triangle"></i>
                          Mobile number not found at users/{user?.uid}/phoneNumber
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="guest-mobile-info">
                      <i className="fas fa-info-circle"></i>
                      <span>Please login to contact us using your account mobile number</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <textarea
                  name="comment"
                  placeholder="How can we help you? Describe your issue in detail... *"
                  rows="5"
                  value={formData.comment}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="submit-btn" 
                disabled={loading || (user && !userMobile)}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    {user ? "Submit Query" : "Login to Submit Query"}
                  </>
                )}
              </button>

              {user && !userMobile && (
                <div className="profile-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>
                    Mobile number not found at <code>users/{user.uid}/phoneNumber</code>.{" "}
                    Please update your <a href="/profile" className="profile-link">profile</a>.
                  </p>
                </div>
              )}

              {!user && (
                <div className="login-prompt">
                  <i className="fas fa-sign-in-alt"></i>
                  <p>
                    <a href="/login" className="login-link">Login to your account</a> to submit queries using your profile mobile number.
                  </p>
                </div>
              )}
            </form>

            {/* Removed Contact Info Section */}
          </div>
          
          {/* Section 2: Query Status */}
          <div className="check-status-section">
            <div className="contact-header">
              <h2>Track Your Queries</h2>
              <p>
                {user 
                  ? "Monitor the status of all your support requests"
                  : "Login to track your query status automatically"
                }
              </p>
            </div>

            {/* For logged-in users - Automatic query display */}
            {user ? (
              <div className="user-queries-section">
                {userMobile ? (
                  <>
                    <div className="user-queries-header">
                      <button 
                        className="toggle-queries-btn"
                        onClick={toggleUserQueries}
                      >
                        <i className={`fas fa-${showUserQueries ? 'chevron-up' : 'chevron-down'}`}></i>
                        {showUserQueries ? 'Hide My Queries' : 'Show My Queries'}
                        {userQueries.length > 0 && (
                          <span className="query-count">({userQueries.length})</span>
                        )}
                      </button>
                      
                      {showUserQueries && (
                        <button 
                          className="refresh-btn"
                          onClick={() => loadUserQueries(userMobile)}
                          disabled={isChecking}
                        >
                          <i className={`fas fa-${isChecking ? 'spinner fa-spin' : 'sync'}`}></i>
                        </button>
                      )}
                    </div>

                    {showUserQueries && (
                      <>
                        {isChecking ? (
                          <div className="loading-queries">
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>Loading your queries...</span>
                          </div>
                        ) : checkError ? (
                          <div className="contact-message contact-message--error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{checkError}</span>
                          </div>
                        ) : (
                          <div className="queries-list">
                            {userQueries.length > 0 ? (
                              <>
                                <div className="mobile-display">
                                  <i className="fas fa-mobile-alt"></i>
                                  <span>Your Support Queries</span>
                                  <small>Tracked via: +91 {userMobile}</small>
                                </div>
                                {userQueries.map(query => (
                                  <div key={query.id} className="query-card">
                                    <div className="query-card__header">
                                      <span className="query-date">
                                        {new Date(query.createdAt).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      <span className={`query-status query-status--${query.status}`}>
                                        <i className={`fas fa-${
                                          query.status === 'resolved' ? 'check-circle' :
                                          query.status === 'in-progress' ? 'sync' : 'clock'
                                        }`}></i>
                                        {query.status === 'new' ? 'Under Review' : 
                                         query.status === 'in-progress' ? 'In Progress' : 
                                         'Resolved'}
                                      </span>
                                    </div>
                                    <div className="query-card__body">
                                      <div className="query-message">
                                        <strong>Your Query:</strong>
                                        <p>{query.comment}</p>
                                      </div>
                                      
                                      {query.adminReply && (
                                        <div className="admin-reply">
                                          <div className="admin-reply__header">
                                            <i className="fas fa-reply"></i>
                                            <strong>Support Response:</strong>
                                          </div>
                                          <p>{query.adminReply}</p>
                                          {query.repliedAt && (
                                            <span className="reply-date">
                                              Replied on: {new Date(
                                                query.repliedAt?.toDate?.() || query.repliedAt
                                              ).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="no-queries">
                                <i className="fas fa-inbox"></i>
                                <p>No support queries found for your account.</p>
                                <p className="submit-prompt">Submit a query above to get started!</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="no-mobile-prompt">
                    <i className="fas fa-mobile-alt"></i>
                    <p>Mobile number not found in your profile.</p>
                    <p>Update your profile to start tracking support queries.</p>
                    <a href="/profile" className="profile-link">Update Profile to Add Mobile</a>
                  </div>
                )}
              </div>
            ) : (
              /* For non-logged in users */
              <div className="guest-queries-section">
                <div className="login-suggestion">
                  <i className="fas fa-user-shield"></i>
                  <div>
                    <h4>Secure Query Tracking</h4>
                    <p>Login to automatically track all your support queries using your account mobile number.</p>
                    <a href="/login" className="login-btn">
                      <i className="fas fa-sign-in-alt"></i>
                      Login to Track Queries
                    </a>
                  </div>
                </div>

                <div className="support-info">
                  <i className="fas fa-headset"></i>
                  <div>
                    <h5>Our Support Promise:</h5>
                    <ul>
                      <li>Quick response to all queries</li>
                      <li>Professional and helpful support</li>
                      <li>Secure tracking using your account</li>
                      <li>Real-time status updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;