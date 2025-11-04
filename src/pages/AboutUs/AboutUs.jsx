import React, { useEffect, useState, useRef } from 'react';
import './AboutUs.scss';

const AboutUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);

    // Initialize Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({ ...prev, [imageId]: true }));
  };

  return (
    <div className="main-aboutus">
      <div className={`about-us ${isVisible ? 'visible' : ''}`}>
        
        {/* Enhanced Hero Section */}
        <section className="about-hero">
          <div className="about-hero__background">
            <div className="floating-elements">
              <div className="floating-element element-1"></div>
              <div className="floating-element element-2"></div>
              <div className="floating-element element-3"></div>
            </div>
          </div>
          <div className="about-hero__overlay">
            <div className="container">
              <div className="hero-content">
                <h1 className="about-hero__title animate-fade-in-up">
                  About <span className="brand-highlight">AlenaTrends</span>
                </h1>
                <p className="about-hero__subtitle animate-fade-in-up delay-1">
                  Redefining Women's Fashion Since 2020
                </p>
                <div className="hero-stats animate-fade-in-up delay-2">
                  <div className="stat-pill">
                    <span className="stat-number">50K+</span>
                    <span className="stat-text">Customers</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-number">4.8★</span>
                    <span className="stat-text">Rating</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-number">100+</span>
                    <span className="stat-text">Cities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="scroll-indicator">
            <div className="scroll-arrow"></div>
          </div>
        </section>

        {/* Enhanced Our Story Section */}
        <section className="section">
          <div className="container">
            <div className="about-content">
              <div className="about-content__text animate-on-scroll">
                <div className="section-badge">Our Journey</div>
                <h2 className="section__title">Our Story</h2>
                <div className="text-content">
                  <p>
                    AlenaTrends was born from a passion to bring elegant, affordable, and high-quality fashion to women across India. Founded in 2020, we started as a small boutique with a vision to celebrate the diversity and beauty of Indian women through fashion.
                  </p>
                  <p>
                    What began as a dream has now blossomed into a thriving fashion brand that serves thousands of customers nationwide. We believe that every woman deserves to feel confident, beautiful, and empowered in what she wears.
                  </p>
                  <div className="story-highlights">
                    <div className="highlight-item">
                      <i className="fas fa-rocket"></i>
                      <span>Founded in 2020</span>
                    </div>
                    <div className="highlight-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>Pan-India Presence</span>
                    </div>
                    <div className="highlight-item">
                      <i className="fas fa-heart"></i>
                      <span>Women-Focused</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-content__image animate-on-scroll delay-1">
                <div className="image-frame">
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop" 
                    alt="AlenaTrends Fashion Store"
                    onLoad={() => handleImageLoad('story')}
                    className={loadedImages.story ? 'loaded' : ''}
                  />
                  <div className="image-overlay"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Mission & Vision */}
        <section className="section section--gradient">
          <div className="container">
            <div className="mission-vision">
              <div className="mission-vision__card animate-on-scroll">
                <div className="card-glow"></div>
                <div className="mission-vision__icon">
                  <i className="fas fa-bullseye"></i>
                </div>
                <h3>Our Mission</h3>
                <p>
                  To empower women through fashion by providing high-quality, affordable, and stylish clothing that celebrates their individuality and enhances their confidence. We strive to make every woman feel like the main character in her own story.
                </p>
                <div className="card-footer">
                  <span className="read-more">Learn More</span>
                </div>
              </div>
              <div className="mission-vision__card animate-on-scroll delay-1">
                <div className="card-glow"></div>
                <div className="mission-vision__icon">
                  <i className="fas fa-eye"></i>
                </div>
                <h3>Our Vision</h3>
                <p>
                  To become India's most trusted and loved fashion brand for women, known for our exceptional quality, inclusive designs, and commitment to customer satisfaction. We envision a world where every woman has access to fashion that reflects her unique style.
                </p>
                <div className="card-footer">
                  <span className="read-more">Learn More</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Core Values */}
        <section className="section">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Our Foundation</div>
              <h2 className="section__title">Our Core Values</h2>
              <p className="section__subtitle">The principles that guide everything we do</p>
            </div>
            <div className="values-grid">
              {[
                { icon: 'fas fa-heart', title: 'Quality First', desc: 'We never compromise on quality. Every piece is carefully inspected to meet our high standards.' },
                { icon: 'fas fa-users', title: 'Customer Centric', desc: 'Our customers are at the heart of everything we do. Your satisfaction is our success.' },
                { icon: 'fas fa-leaf', title: 'Sustainability', desc: 'We are committed to ethical practices and sustainable fashion for a better tomorrow.' },
                { icon: 'fas fa-palette', title: 'Innovation', desc: 'We constantly evolve our designs to bring you the latest trends and timeless classics.' },
                { icon: 'fas fa-gem', title: 'Elegance', desc: 'Every design reflects sophistication and timeless beauty that transcends trends.' },
                { icon: 'fas fa-hands-helping', title: 'Community', desc: 'Building a supportive community of confident women through fashion.' }
              ].map((value, index) => (
                <div key={index} className={`value-card animate-on-scroll delay-${index}`}>
                  <div className="value-card__icon">
                    <i className={value.icon}></i>
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Statistics Section */}
        <section className="section section--stats">
          <div className="container">
            <div className="stats-grid">
              {[
                { number: '50K+', label: 'Happy Customers', icon: 'fas fa-smile' },
                { number: '5000+', label: 'Products', icon: 'fas fa-tshirt' },
                { number: '100+', label: 'Cities Covered', icon: 'fas fa-map-marked-alt' },
                { number: '4.8★', label: 'Average Rating', icon: 'fas fa-star' },
                { number: '24/7', label: 'Support', icon: 'fas fa-headset' },
                { number: '98%', label: 'Satisfaction', icon: 'fas fa-heart' }
              ].map((stat, index) => (
                <div key={index} className={`stat-card animate-on-scroll delay-${index}`}>
                  <div className="stat-card__icon">
                    <i className={stat.icon}></i>
                  </div>
                  <div className="stat-card__number" data-count={stat.number}>
                    {stat.number}
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Why Choose Us */}
        <section className="section">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Why We Stand Out</div>
              <h2 className="section__title">Why Choose AlenaTrends?</h2>
              <p className="section__subtitle">Experience the difference that makes us special</p>
            </div>
            <div className="features-grid">
              {[
                { icon: 'fas fa-shipping-fast', title: 'Fast Delivery', desc: 'Get your orders delivered within 3-5 business days across India.' },
                { icon: 'fas fa-shield-alt', title: 'Secure Payment', desc: '100% secure payment gateway with multiple payment options.' },
                { icon: 'fas fa-undo-alt', title: 'Easy Returns', desc: '7-day hassle-free return and exchange policy on all products.' },
                { icon: 'fas fa-headset', title: '24/7 Support', desc: 'Our customer support team is always here to help you.' },
                { icon: 'fas fa-tags', title: 'Best Prices', desc: 'Competitive pricing with regular discounts and special offers.' },
                { icon: 'fas fa-award', title: 'Quality Assured', desc: 'Every product is quality checked before dispatch.' },
                { icon: 'fas fa-ruler-combined', title: 'Perfect Fit', desc: 'Detailed size guides and fit assurance on all products.' },
                { icon: 'fas fa-gem', title: 'Premium Quality', desc: 'Only the finest fabrics and materials used in our products.' }
              ].map((feature, index) => (
                <div key={index} className={`feature-card animate-on-scroll delay-${index % 4}`}>
                  <div className="feature-card__icon">
                    <i className={feature.icon}></i>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <div className="feature-hover">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Team Section */}
        <section className="section section--team">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Our Family</div>
              <h2 className="section__title">Meet Our Team</h2>
              <p className="section__subtitle">The passionate faces behind AlenaTrends</p>
            </div>
            <div className="team-grid">
              {[
                { 
                  img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop', 
                  name: 'Alena Sharma', 
                  role: 'Founder & CEO', 
                  bio: 'Fashion enthusiast with 10+ years of industry experience.',
                  social: ['fab fa-linkedin', 'fab fa-twitter', 'fab fa-instagram']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop', 
                  name: 'Anjali Mehta', 
                  role: 'Head of Design', 
                  bio: 'Award-winning designer passionate about Indian fashion.',
                  social: ['fab fa-linkedin', 'fab fa-behance', 'fab fa-instagram']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&h=300&fit=crop', 
                  name: 'Rahul Verma', 
                  role: 'Operations Manager', 
                  bio: 'Expert in logistics and supply chain management.',
                  social: ['fab fa-linkedin', 'fab fa-twitter']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop', 
                  name: 'Neha Singh', 
                  role: 'Customer Relations', 
                  bio: 'Dedicated to ensuring exceptional customer experience.',
                  social: ['fab fa-linkedin', 'fab fa-instagram']
                }
              ].map((member, index) => (
                <div key={index} className={`team-card animate-on-scroll delay-${index}`}>
                  <div className="team-card__image">
                    <img 
                      src={member.img} 
                      alt={member.name}
                      onLoad={() => handleImageLoad(`team-${index}`)}
                      className={loadedImages[`team-${index}`] ? 'loaded' : ''}
                    />
                    <div className="team-card__overlay">
                      <div className="social-links">
                        {member.social.map((socialIcon, socialIndex) => (
                          <a key={socialIndex} href="#" className="social-link">
                            <i className={socialIcon}></i>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="team-card__content">
                    <h3>{member.name}</h3>
                    <p className="team-card__role">{member.role}</p>
                    <p className="team-card__bio">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="section section--cta">
          <div className="container">
            <div className="cta-content animate-on-scroll">
              <div className="cta-badge">Ready to Shop?</div>
              <h2>Join the AlenaTrends Family Today</h2>
              <p>Experience fashion that celebrates you. Discover your perfect style and start shopping today!</p>
              <div className="cta-buttons">
                <a href="/" className="btn btn--primary">
                  <span>Shop Collection</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
                <a href="/contact" className="btn btn--secondary">
                  <span>Get Styled</span>
                  <i className="fas fa-palette"></i>
                </a>
                <a href="/about" className="btn btn--outline">
                  <span>Our Story</span>
                  <i className="fas fa-book-open"></i>
                </a>
              </div>
              <div className="cta-features">
                <div className="feature">
                  <i className="fas fa-truck"></i>
                  <span>Free Shipping Over ₹1999</span>
                </div>
                <div className="feature">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure Checkout</span>
                </div>
                <div className="feature">
                  <i className="fas fa-undo-alt"></i>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Top Button */}
        <button 
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      </div>
    </div>
  );
};

export default AboutUs;