import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.scss';

// FAQ data - you can easily add or change questions here
const faqData = [
  {
    category: 'Orders & Shopping',
    icon: 'fas fa-shopping-bag',
    questions: [
      {
        q: 'How can I track my order?',
        a: 'Once your order is shipped, you will receive an email with a tracking number. You can also track your order directly from the "My Orders" section in your profile.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'You can cancel your order from the "My Orders" page as long as it has not been processed for shipping. If the option is not available, please contact our customer support immediately.',
      },
      {
        q: 'What if I receive a damaged or incorrect item?',
        a: 'We are sorry for the inconvenience! Please visit our <a href="/returns">Returns & Exchange</a> page within 48 hours of delivery and fill out the return form with photos of the item. Our team will get back to you.',
      },
      {
        q: 'Do you offer international shipping?',
        a: 'Currently, we only ship within India. We are working on expanding our services to international locations soon.',
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    icon: 'fas fa-shipping-fast',
    questions: [
      {
        q: 'How long does delivery take?',
        a: 'Delivery times vary by location. Typically, metro cities take 2-4 business days, while other areas may take 4-7 business days. You can find more details on our <a href="/shipping">Shipping Policy</a> page.',
      },
      {
        q: 'What are the shipping charges?',
        a: 'We offer free shipping on all prepaid orders above ₹999. A flat fee of ₹50 is applied to orders below ₹999. A non-refundable Cash on Delivery (COD) fee of ₹40 is applicable for all COD orders.',
      },
      {
        q: 'Do you ship to all pin codes in India?',
        a: 'Yes, we ship to all serviceable pin codes across India. However, delivery times may vary for remote locations.',
      },
      {
        q: 'Can I change my delivery address after placing an order?',
        a: 'You can change the delivery address within 12 hours of placing the order, provided the order has not been shipped. Contact our customer support for assistance.',
      },
    ],
  },
  {
    category: 'Payments & Pricing',
    icon: 'fas fa-credit-card',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards (Visa, MasterCard, Amex), Net Banking, UPI, and popular mobile wallets. We also offer Cash on Delivery (COD) in most locations.',
      },
      {
        q: 'Is it safe to use my card on your website?',
        a: 'Yes! We use a secure SSL encrypted connection and all payments are processed through a PCI-DSS compliant payment gateway. We do not store your card details on our servers.',
      },
      {
        q: 'Why was my payment declined?',
        a: 'Payment declines can happen due to various reasons: insufficient funds, incorrect card details, bank security checks, or technical issues. Please try again or use an alternative payment method.',
      },
      {
        q: 'Do you offer any discounts or coupons?',
        a: 'Yes! We regularly offer discounts and promotional codes. Subscribe to our newsletter and follow us on social media to stay updated on the latest offers.',
      },
    ],
  },
  {
    category: 'Returns & Exchange',
    icon: 'fas fa-undo-alt',
    questions: [
      {
        q: 'What is your return policy?',
        a: 'We offer a 7-day return policy from the date of delivery. Items must be in original condition with all tags attached and in the original packaging.',
      },
      {
        q: 'How do I initiate a return?',
        a: 'You can initiate returns from your "My Orders" section. Select the item you want to return, choose the reason, and follow the instructions. Our team will guide you through the process.',
      },
      {
        q: 'What is the seal pack policy?',
        a: 'All our products come in original seal packs. Clothes with broken or removed seat tags cannot be returned. Please check our <a href="/shipping-policy">Shipping Policy</a> for detailed information.',
      },
      {
        q: 'How long does it take to process a refund?',
        a: 'Once we receive the returned item, refunds are processed within 5-7 business days. The time taken for the amount to reflect in your account depends on your bank.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: 'fas fa-user-shield',
    questions: [
      {
        q: 'I forgot my password. What should I do?',
        a: 'You can easily reset your password. Go to the <a href="/login">Login</a> page and click on the "Forgot Password" link. An email with instructions will be sent to your registered email address.',
      },
      {
        q: 'How do I update my profile information?',
        a: 'You can update your name, address, and other personal details by logging into your account and visiting the "My Profile" section.',
      },
      {
        q: 'Can I have multiple addresses saved?',
        a: 'Yes, you can save multiple addresses in your address book and choose your preferred shipping address during checkout.',
      },
      {
        q: 'How do I delete my account?',
        a: 'To delete your account, please contact our customer support team. Note that this action is permanent and cannot be undone.',
      },
    ],
  },
  {
    category: 'Product & Quality',
    icon: 'fas fa-award',
    questions: [
      {
        q: 'Are your products authentic?',
        a: 'Yes, all our products are 100% authentic and sourced directly from brands and authorized distributors.',
      },
      {
        q: 'What if the product doesn\'t fit me?',
        a: 'We provide detailed size charts for each product. If the item doesn\'t fit, you can exchange it for a different size subject to availability and our return policy.',
      },
      {
        q: 'Do you offer quality guarantee?',
        a: 'Yes, we stand by the quality of our products. If you receive a defective item, we will replace it immediately.',
      },
      {
        q: 'How do I care for the products?',
        a: 'Each product comes with specific care instructions. Generally, we recommend following the washing instructions on the label to maintain product quality.',
      },
    ],
  },
];

// Reusable FAQ Item component
const FaqItem = ({ item, isOpen, onToggle, index }) => {
  return (
    <div className={`faq-item ${isOpen ? 'faq-item--active' : ''}`}>
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <span className="faq-question__text">
          <span className="faq-number">{index + 1}.</span>
          {item.q}
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} faq-question__icon`}></i>
      </button>
      {isOpen && (
        <div 
          className="faq-answer"
          dangerouslySetInnerHTML={{ __html: item.a }}
        />
      )}
    </div>
  );
};

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState('0-0');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredFaqData = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(item => 
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => 
    (activeCategory === 'all' || category.category === activeCategory) && 
    category.questions.length > 0
  );

  const allCategories = ['all', ...faqData.map(cat => cat.category)];

  return (
    <div className="faq-page">
      <div className="container">
        {/* Header Section */}
        <div className="faq-header">
          <div className="faq-header__content">
            <h1 className="faq-header__title">
              Frequently Asked Questions
            </h1>
            <p className="faq-header__subtitle">
              Find quick answers to common questions about shopping with AlenaTrends
            </p>
          </div>
          <div className="faq-header__illustration">
            <i className="fas fa-question-circle"></i>
          </div>
        </div>

        {/* Search Section */}
        <div className="faq-search">
          <div className="faq-search__container">
            <i className="fas fa-search faq-search__icon"></i>
            <input
              type="text"
              placeholder="Search for questions... (e.g., returns, shipping, payments)"
              value={searchTerm}
              onChange={handleSearch}
              className="faq-search__input"
            />
            {searchTerm && (
              <button 
                className="faq-search__clear"
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="faq-categories">
          <div className="faq-categories__container">
            {allCategories.map(category => (
              <button
                key={category}
                className={`faq-category__filter ${activeCategory === category ? 'faq-category__filter--active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category === 'all' ? (
                  <>
                    <i className="fas fa-th-large"></i>
                    All Categories
                  </>
                ) : (
                  category
                )}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="faq-content">
          {filteredFaqData.length === 0 ? (
            <div className="faq-empty">
              <i className="fas fa-search faq-empty__icon"></i>
              <h3 className="faq-empty__title">No results found</h3>
              <p className="faq-empty__text">
                We couldn't find any questions matching "{searchTerm}". Try different keywords or browse all categories.
              </p>
              <button 
                className="btn btn--secondary"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
              >
                <i className="fas fa-refresh"></i>
                Reset Filters
              </button>
            </div>
          ) : (
            filteredFaqData.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <div className="faq-category__header">
                  <i className={category.icon}></i>
                  <h2 className="faq-category__title">{category.category}</h2>
                  <span className="faq-category__count">
                    {category.questions.length} question{category.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="faq-list">
                  {category.questions.map((item, itemIndex) => {
                    const globalIndex = `${catIndex}-${itemIndex}`;
                    return (
                      <FaqItem
                        key={globalIndex}
                        item={item}
                        isOpen={openIndex === globalIndex}
                        onToggle={() => handleToggle(globalIndex)}
                        index={itemIndex}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="faq-cta">
          <div className="faq-cta__content">
            <i className="fas fa-headset faq-cta__icon"></i>
            <div className="faq-cta__text">
              <h3 className="faq-cta__title">Still have questions?</h3>
              <p className="faq-cta__description">
                Our customer support team is here to help you with any other questions you might have.
              </p>
            </div>
            <div className="faq-cta__actions">
              <Link to="/contact" className="btn btn--primary btn--large">
                <i className="fas fa-envelope"></i> Contact Support
              </Link>
              <div className="faq-cta__contact-info">
                <p><i className="fas fa-phone"></i> +91 1234567890</p>
                <p><i className="fas fa-envelope"></i> support@alenatrends.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="faq-quick-links">
          <h3 className="faq-quick-links__title">Quick Links</h3>
          <div className="faq-quick-links__grid">
            <Link to="/shipping" className="faq-quick-link">
              <i className="fas fa-shipping-fast"></i>
              <span>Shipping Policy</span>
            </Link>
            <Link to="/returns" className="faq-quick-link">
              <i className="fas fa-undo-alt"></i>
              <span>Returns & Exchange</span>
            </Link>
            <Link to="/privacy-policy" className="faq-quick-link">
              <i className="fas fa-shield-alt"></i>
              <span>Privacy Policy</span>
            </Link>
            <Link to="/terms" className="faq-quick-link">
              <i className="fas fa-file-contract"></i>
              <span>Terms of Service</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;