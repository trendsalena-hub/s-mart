import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/config.js';
import './ContactMessages.scss';
import ReplyModal from '../ReplyModal/ReplyModal.jsx';

const ContactMessages = ({ contacts, onContactsChange, onSuccess, onError }) => {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const contactsRef = collection(db, 'contacts');
      const q = query(contactsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      onContactsChange(contactsData);
    } catch (err) {
      console.error('Error loading contacts:', err);
      onError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContactStatus = async (contactId, status) => {
    try {
      await updateDoc(doc(db, 'contacts', contactId), {
        status: status,
        updatedAt: serverTimestamp()
      });
      await loadContacts();
      onSuccess('Contact status updated!');
    } catch (err) {
      console.error('Error updating contact:', err);
      onError('Failed to update contact status.');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;

    try {
      await deleteDoc(doc(db, 'contacts', contactId));
      onSuccess('Contact deleted successfully!');
      await loadContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      onError('Failed to delete contact.');
    }
  };
  
  const handleOpenReplyModal = (contact) => {
    setSelectedContact(contact);
    setIsReplyModalOpen(true);
  };

  const handleSendReply = async (contactId, replyText) => {
    try {
      await updateDoc(doc(db, 'contacts', contactId), {
        adminReply: replyText,
        status: 'resolved',
        repliedAt: serverTimestamp()
      });
      await loadContacts();
      setIsReplyModalOpen(false);
      setSelectedContact(null);
      onSuccess('Reply sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
      onError('Failed to send reply.');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    if (filter === 'all') return true;
    return contact.status === filter;
  });

  const getStatusCount = (status) => {
    return contacts.filter(contact => contact.status === status).length;
  };

  if (loading) {
    return (
      <div className="admin-dashboard__card">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isReplyModalOpen && (
        <ReplyModal 
          contact={selectedContact}
          onClose={() => setIsReplyModalOpen(false)}
          onSendReply={handleSendReply}
          onError={onError}
        />
      )}
    
      <div className="admin-dashboard__card">
        <div className="contacts-header">
          <h2>Contact Messages ({contacts.length})</h2>
          
          <div className="contacts-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({contacts.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'new' ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter('new')}
            >
              New ({getStatusCount('new')})
            </button>
            <button 
              className={`filter-btn ${filter === 'in-progress' ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter('in-progress')}
            >
              In Progress ({getStatusCount('in-progress')})
            </button>
            <button 
              className={`filter-btn ${filter === 'resolved' ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved ({getStatusCount('resolved')})
            </button>
          </div>
        </div>
        
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-envelope-open"></i>
            <h4>No Messages Found</h4>
            <p>
              {filter === 'all' 
                ? 'Contact submissions will appear here.' 
                : `No ${filter} messages found.`
              }
            </p>
          </div>
        ) : (
          <div className="contacts-list">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="contact-card">
                <div className="contact-card__header">
                  <div className="contact-card__info">
                    <h4>{contact.name}</h4>
                    <div className="contact-card__meta">
                      <span className="contact-card__mobile">
                        <i className="fas fa-mobile-alt"></i>
                        +91 {contact.mobile}
                      </span>
                      {contact.userEmail && (
                        <span className="contact-card__email">
                          <i className="fas fa-envelope"></i>
                          {contact.userEmail}
                        </span>
                      )}
                      {contact.userId && (
                        <span className="contact-card__user-badge">
                          <i className="fas fa-user-check"></i>
                          Registered User
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`contact-card__status contact-card__status--${contact.status}`}>
                    {contact.status}
                  </span>
                </div>
                <div className="contact-card__body">
                  <p>{contact.comment}</p>
                  
                  {contact.adminReply && (
                    <div className="admin-reply">
                      <strong>Admin Reply:</strong>
                      <p>{contact.adminReply}</p>
                    </div>
                  )}
                </div>
                <div className="contact-card__footer">
                  <span className="contact-card__date">
                    <i className="fas fa-clock"></i>
                    {new Date(contact.createdAt).toLocaleString()}
                  </span>
                  <div className="contact-card__actions">
                    <select
                      value={contact.status}
                      onChange={(e) => handleUpdateContactStatus(contact.id, e.target.value)}
                      className="contact-card__select"
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    
                    {!contact.adminReply && contact.status !== 'resolved' && (
                      <button
                        className="contact-card__btn contact-card__btn--reply"
                        onClick={() => handleOpenReplyModal(contact)}
                        title="Send Reply"
                      >
                        <i className="fas fa-paper-plane"></i> Reply
                      </button>
                    )}

                    <button
                      className="contact-card__btn contact-card__btn--delete"
                      onClick={() => handleDeleteContact(contact.id)}
                      title="Delete message"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ContactMessages;