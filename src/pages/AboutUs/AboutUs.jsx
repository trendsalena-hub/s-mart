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
                  Where Elegance Meets Contemporary Fashion
                </p>
                <p className="about-hero__description animate-fade-in-up delay-2">
                  AlenaTrends is your premier destination for sophisticated women's fashion, 
                  blending timeless elegance with modern trends. We curate collections that 
                  empower women to express their unique style with confidence and grace.
                </p>
                <div className="hero-stats animate-fade-in-up delay-3">
                  <div className="stat-pill">
                    <span className="stat-number">75K+</span>
                    <span className="stat-text">Happy Customers</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-number">4.9★</span>
                    <span className="stat-text">Customer Rating</span>
                  </div>
                  <div className="stat-pill">
                    <span className="stat-number">150+</span>
                    <span className="stat-text">Cities Served</span>
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
        <section className="section section--story">
          <div className="container">
            <div className="about-content">
              <div className="about-content__text animate-on-scroll">
                <div className="section-badge">Our Heritage</div>
                <h2 className="section__title">Crafting Fashion Stories Since 2020</h2>
                <div className="text-content">
                  <p>
                    Founded with a vision to redefine women's fashion in India, AlenaTrends emerged 
                    from a simple yet powerful belief: every woman deserves to feel beautiful, confident, 
                    and empowered through her clothing choices. What started as a small boutique in Mumbai 
                    has blossomed into a pan-India fashion phenomenon.
                  </p>
                  <p>
                    Our journey began when our founder, Alena Sharma, noticed a gap in the market for 
                    affordable yet premium quality fashion that catered to the modern Indian woman's 
                    diverse needs. From corporate wear to casual chic, traditional ethnic wear to 
                    contemporary fusion, we've dedicated ourselves to creating collections that 
                    celebrate every aspect of a woman's life.
                  </p>
                  <div className="story-highlights">
                    <div className="highlight-item">
                      <i className="fas fa-rocket"></i>
                      <div>
                        <span className="highlight-title">Pioneering Spirit</span>
                        <span>Leading fashion innovation since 2020</span>
                      </div>
                    </div>
                    <div className="highlight-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <div>
                        <span className="highlight-title">Nationwide Presence</span>
                        <span>Serving 150+ cities across India</span>
                      </div>
                    </div>
                    <div className="highlight-item">
                      <i className="fas fa-heart"></i>
                      <div>
                        <span className="highlight-title">Women-Centric</span>
                        <span>By women, for women</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="about-content__image animate-on-scroll delay-1">
                <div className="image-frame">
                  <img 
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=700&fit=crop" 
                    alt="AlenaTrends Fashion Store"
                    onLoad={() => handleImageLoad('story')}
                    className={loadedImages.story ? 'loaded' : ''}
                  />
                  <div className="image-overlay"></div>
                  <div className="experience-badge">
                    <span className="years">4+</span>
                    <span className="text">Years of Excellence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Mission & Vision */}
        <section className="section section--mission">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Our Philosophy</div>
              <h2 className="section__title">Guiding Principles</h2>
            </div>
            <div className="mission-vision">
              <div className="mission-vision__card animate-on-scroll">
                <div className="card-glow"></div>
                <div className="mission-vision__icon">
                  <i className="fas fa-bullseye"></i>
                </div>
                <h3>Our Mission</h3>
                <p>
                  To democratize premium fashion by making high-quality, elegant clothing accessible 
                  to every Indian woman. We strive to create pieces that not only enhance beauty but 
                  also boost confidence, enabling women to conquer their world with style and grace.
                </p>
                <ul className="mission-list">
                  <li><i className="fas fa-check"></i> Premium quality at affordable prices</li>
                  <li><i className="fas fa-check"></i> Inclusive sizing for all body types</li>
                  <li><i className="fas fa-check"></i> Sustainable and ethical practices</li>
                  <li><i className="fas fa-check"></i> Customer-first approach</li>
                </ul>
              </div>
              
              <div className="mission-vision__card animate-on-scroll delay-1">
                <div className="card-glow"></div>
                <div className="mission-vision__icon">
                  <i className="fas fa-eye"></i>
                </div>
                <h3>Our Vision</h3>
                <p>
                  To become India's most trusted fashion companion for women, creating a community 
                  where style meets substance. We envision a future where every woman has access to 
                  fashion that reflects her personality, values, and aspirations.
                </p>
                <ul className="mission-list">
                  <li><i className="fas fa-check"></i> Expand to 500+ cities by 2025</li>
                  <li><i className="fas fa-check"></i> Launch sustainable clothing line</li>
                  <li><i className="fas fa-check"></i> Introduce AI-powered styling</li>
                  <li><i className="fas fa-check"></i> Global presence by 2026</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Core Values */}
        <section className="section section--values">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Our Foundation</div>
              <h2 className="section__title">Core Values That Define Us</h2>
              <p className="section__subtitle">The principles that guide every stitch and every smile</p>
            </div>
            <div className="values-grid">
              {[
                { 
                  icon: 'fas fa-award', 
                  title: 'Quality Excellence', 
                  desc: 'Every garment undergoes 12-point quality check ensuring premium fabrics, perfect stitching, and lasting durability.',
                  color: '#d4af37'
                },
                { 
                  icon: 'fas fa-users', 
                  title: 'Customer First', 
                  desc: 'Your satisfaction is our success. We listen, adapt, and exceed expectations in every interaction.',
                  color: '#b8941f'
                },
                { 
                  icon: 'fas fa-leaf', 
                  title: 'Sustainable Fashion', 
                  desc: 'Committed to eco-friendly practices, sustainable sourcing, and reducing our environmental footprint.',
                  color: '#a3821a'
                },
                { 
                  icon: 'fas fa-palette', 
                  title: 'Creative Innovation', 
                  desc: 'Blending traditional craftsmanship with contemporary designs to create timeless fashion statements.',
                  color: '#d4af37'
                },
                { 
                  icon: 'fas fa-gem', 
                  title: 'Elegant Simplicity', 
                  desc: 'Believing in understated elegance that speaks volumes through subtle details and refined aesthetics.',
                  color: '#b8941f'
                },
                { 
                  icon: 'fas fa-hands-helping', 
                  title: 'Community Building', 
                  desc: 'Fostering a supportive sisterhood where women uplift and inspire each other through fashion.',
                  color: '#a3821a'
                }
              ].map((value, index) => (
                <div key={index} className={`value-card animate-on-scroll delay-${index % 3}`}>
                  <div className="value-card__icon" style={{ color: value.color }}>
                    <i className={value.icon}></i>
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.desc}</p>
                  <div className="value-decoration"></div>
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
                { number: '75,000+', label: 'Happy Customers', icon: 'fas fa-smile', suffix: '' },
                { number: '10,000+', label: 'Products Designed', icon: 'fas fa-tshirt', suffix: '' },
                { number: '150+', label: 'Cities Covered', icon: 'fas fa-map-marked-alt', suffix: '' },
                { number: '4.9', label: 'Average Rating', icon: 'fas fa-star', suffix: '★' },
                { number: '98', label: 'Customer Satisfaction', icon: 'fas fa-heart', suffix: '%' },
                { number: '24/7', label: 'Support Available', icon: 'fas fa-headset', suffix: '' }
              ].map((stat, index) => (
                <div key={index} className={`stat-card animate-on-scroll delay-${index % 3}`}>
                  <div className="stat-card__icon">
                    <i className={stat.icon}></i>
                  </div>
                  <div className="stat-card__number">
                    {stat.number}<span className="stat-suffix">{stat.suffix}</span>
                  </div>
                  <div className="stat-card__label">{stat.label}</div>
                  <div className="stat-card__background">{stat.number}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Why Choose Us */}
        <section className="section section--features">
          <div className="container">
            <div className="section__header">
              <div className="section-badge">Why We Stand Out</div>
              <h2 className="section__title">The AlenaTrends Experience</h2>
              <p className="section__subtitle">Discover what makes us the preferred choice for discerning women</p>
            </div>
            <div className="features-grid">
              {[
                { 
                  icon: 'fas fa-tshirt', 
                  title: 'Curated Collections', 
                  desc: 'Handpicked ensembles that blend current trends with timeless elegance',
                  features: ['Seasonal Trends', 'Timeless Classics', 'Exclusive Designs']
                },
                { 
                  icon: 'fas fa-ruler-combined', 
                  title: 'Perfect Fit Guarantee', 
                  desc: 'Comprehensive size guides and fit technology for flawless styling',
                  features: ['Detailed Size Charts', 'Fit Recommendations', 'Easy Exchanges']
                },
                { 
                  icon: 'fas fa-shipping-fast', 
                  title: 'Swift Delivery', 
                  desc: 'Express shipping across India with real-time order tracking',
                  features: ['3-5 Day Delivery', 'Pan-India Shipping', 'Order Tracking']
                },
                { 
                  icon: 'fas fa-shield-alt', 
                  title: 'Secure Shopping', 
                  desc: 'Bank-level security with multiple payment options for peace of mind',
                  features: ['SSL Encrypted', 'Multiple Payments', 'Data Protection']
                },
                { 
                  icon: 'fas fa-undo-alt', 
                  title: 'Hassle-Free Returns', 
                  desc: '7-day easy return policy with quick refunds and exchanges',
                  features: ['7-Day Returns', 'Quick Refunds', 'Easy Process']
                },
                { 
                  icon: 'fas fa-headset', 
                  title: 'Personal Styling', 
                  desc: 'Expert style advice and personalized recommendations just for you',
                  features: ['Style Consultation', 'Personal Shopper', 'Outfit Planning']
                }
              ].map((feature, index) => (
                <div key={index} className={`feature-card animate-on-scroll delay-${index % 3}`}>
                  <div className="feature-card__icon">
                    <i className={feature.icon}></i>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <div className="feature-list">
                    {feature.features.map((item, idx) => (
                      <span key={idx} className="feature-tag">{item}</span>
                    ))}
                  </div>
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
              <h2 className="section__title">Meet The Visionaries</h2>
              <p className="section__subtitle">The passionate team crafting your fashion journey</p>
            </div>
            <div className="team-grid">
              {[
                { 
                  img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face', 
                  name: 'Alena Sharma', 
                  role: 'Founder & CEO', 
                  bio: 'Former fashion editor with 12+ years in luxury fashion. Passionate about making premium fashion accessible.',
                  social: ['fab fa-linkedin', 'fab fa-twitter', 'fab fa-instagram']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face', 
                  name: 'Anjali Mehta', 
                  role: 'Creative Director', 
                  bio: 'NIFT graduate with award-winning designs featured in Vogue and Elle.',
                  social: ['fab fa-linkedin', 'fab fa-behance', 'fab fa-instagram']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face', 
                  name: 'Rahul Verma', 
                  role: 'Operations Head', 
                  bio: 'Supply chain expert ensuring seamless delivery and quality control.',
                  social: ['fab fa-linkedin', 'fab fa-twitter']
                },
                { 
                  img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face', 
                  name: 'Neha Singh', 
                  role: 'Customer Experience', 
                  bio: 'Dedicated to creating memorable shopping experiences for every customer.',
                  social: ['fab fa-linkedin', 'fab fa-instagram']
                }
              ].map((member, index) => (
                <div key={index} className={`team-card animate-on-scroll delay-${index % 4}`}>
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
                    <div className="team-card__badge">{member.role}</div>
                  </div>
                  <div className="team-card__content">
                    <h3>{member.name}</h3>
                    <p className="team-card__bio">{member.bio}</p>
                    <div className="team-card__contact">
                      <i className="fas fa-envelope"></i>
                      <span>Contact {member.name.split(' ')[0]}</span>
                    </div>
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
              <div className="cta-badge">Begin Your Style Journey</div>
              <h2>Join 75,000+ Women Who Trust AlenaTrends</h2>
              <p>Experience fashion that understands you, quality that lasts, and service that cares. Your perfect style story begins here.</p>
              <div className="cta-buttons">
                <a href="/shop" className="btn btn--primary">
                  <i className="fas fa-shopping-bag"></i>
                  <span>Explore Collections</span>
                </a>
                <a href="/style-guide" className="btn btn--secondary">
                  <i className="fas fa-palette"></i>
                  <span>Get Style Advice</span>
                </a>
                <a href="/contact" className="btn btn--outline">
                  <i className="fas fa-comments"></i>
                  <span>Book Consultation</span>
                </a>
              </div>
              <div className="cta-features">
                <div className="feature">
                  <i className="fas fa-truck"></i>
                  <span>Free Shipping Over ₹1999</span>
                </div>
                <div className="feature">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure Payment</span>
                </div>
                <div className="feature">
                  <i className="fas fa-undo-alt"></i>
                  <span>Easy 7-Day Returns</span>
                </div>
                <div className="feature">
                  <i className="fas fa-gem"></i>
                  <span>Premium Quality</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Back to Top Button */}
        <button 
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      </div>
    </div>
  );
};

export default AboutUs;