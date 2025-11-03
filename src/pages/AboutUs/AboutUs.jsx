import React, { useEffect, useState } from 'react';
import './AboutUs.scss';

const AboutUs = () => {
    const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="main-aboutus">
    <div className={`about-us ${isVisible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero__overlay">
          <div className="container">
            <h1 className="about-hero__title animate-fade-in-up">
              About AlenaTrends
            </h1>
            <p className="about-hero__subtitle animate-fade-in-up delay-1">
              Redefining Women's Fashion Since 2020
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="section">
        <div className="container">
          <div className="about-content">
            <div className="about-content__text animate-fade-in-up">
              <h2 className="section__title">Our Story</h2>
              <p>
                AlenaTrends was born from a passion to bring elegant, affordable, and high-quality fashion to women across India. Founded in 2020, we started as a small boutique with a vision to celebrate the diversity and beauty of Indian women through fashion.
              </p>
              <p>
                What began as a dream has now blossomed into a thriving fashion brand that serves thousands of customers nationwide. We believe that every woman deserves to feel confident, beautiful, and empowered in what she wears.
              </p>
              <p>
                Our collection seamlessly blends traditional Indian craftsmanship with contemporary designs, offering everything from ethnic wear to western fashion, all carefully curated to suit the modern Indian woman's lifestyle. From stunning lehengas to chic western dresses, AlenaTrends is your one-stop destination for all fashion needs.
              </p>
            </div>
            <div className="about-content__image animate-fade-in-up delay-1">
              <img 
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop" 
                alt="AlenaTrends Fashion Store"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section section--pink">
        <div className="container">
          <div className="mission-vision">
            <div className="mission-vision__card animate-fade-in-up">
              <div className="mission-vision__icon">
                <i className="fas fa-bullseye"></i>
              </div>
              <h3>Our Mission</h3>
              <p>
                To empower women through fashion by providing high-quality, affordable, and stylish clothing that celebrates their individuality and enhances their confidence. We strive to make every woman feel like the main character in her own story.
              </p>
            </div>
            <div className="mission-vision__card animate-fade-in-up delay-1">
              <div className="mission-vision__icon">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Our Vision</h3>
              <p>
                To become India's most trusted and loved fashion brand for women, known for our exceptional quality, inclusive designs, and commitment to customer satisfaction. We envision a world where every woman has access to fashion that reflects her unique style.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">Our Core Values</h2>
            <p className="section__subtitle">The principles that guide everything we do</p>
          </div>
          <div className="values-grid">
            <div className="value-card animate-fade-in-up">
              <div className="value-card__icon">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Quality First</h3>
              <p>We never compromise on quality. Every piece is carefully inspected to meet our high standards.</p>
            </div>
            <div className="value-card animate-fade-in-up delay-1">
              <div className="value-card__icon">
                <i className="fas fa-users"></i>
              </div>
              <h3>Customer Centric</h3>
              <p>Our customers are at the heart of everything we do. Your satisfaction is our success.</p>
            </div>
            <div className="value-card animate-fade-in-up delay-2">
              <div className="value-card__icon">
                <i className="fas fa-leaf"></i>
              </div>
              <h3>Sustainability</h3>
              <p>We're committed to ethical practices and sustainable fashion for a better tomorrow.</p>
            </div>
            <div className="value-card animate-fade-in-up delay-3">
              <div className="value-card__icon">
                <i className="fas fa-palette"></i>
              </div>
              <h3>Innovation</h3>
              <p>We constantly evolve our designs to bring you the latest trends and timeless classics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="section section--stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card animate-fade-in-up">
              <div className="stat-card__number">50K+</div>
              <div className="stat-card__label">Happy Customers</div>
            </div>
            <div className="stat-card animate-fade-in-up delay-1">
              <div className="stat-card__number">5000+</div>
              <div className="stat-card__label">Products</div>
            </div>
            <div className="stat-card animate-fade-in-up delay-2">
              <div className="stat-card__number">100+</div>
              <div className="stat-card__label">Cities Covered</div>
            </div>
            <div className="stat-card animate-fade-in-up delay-3">
              <div className="stat-card__number">4.8★</div>
              <div className="stat-card__label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">Why Choose AlenaTrends?</h2>
            <p className="section__subtitle">What makes us different</p>
          </div>
          <div className="features-grid">
            <div className="feature-card animate-fade-in-up">
              <div className="feature-card__icon">
                <i className="fas fa-shipping-fast"></i>
              </div>
              <h3>Fast Delivery</h3>
              <p>Get your orders delivered within 3-5 business days across India.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-1">
              <div className="feature-card__icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure Payment</h3>
              <p>100% secure payment gateway with multiple payment options.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-2">
              <div className="feature-card__icon">
                <i className="fas fa-undo-alt"></i>
              </div>
              <h3>Easy Returns</h3>
              <p>7-day hassle-free return and exchange policy on all products.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-3">
              <div className="feature-card__icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Our customer support team is always here to help you.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-4">
              <div className="feature-card__icon">
                <i className="fas fa-tags"></i>
              </div>
              <h3>Best Prices</h3>
              <p>Competitive pricing with regular discounts and special offers.</p>
            </div>
            <div className="feature-card animate-fade-in-up delay-5">
              <div className="feature-card__icon">
                <i className="fas fa-award"></i>
              </div>
              <h3>Quality Assured</h3>
              <p>Every product is quality checked before dispatch.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section section--pink">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">Meet Our Team</h2>
            <p className="section__subtitle">The faces behind AlenaTrends</p>
          </div>
          <div className="team-grid">
            <div className="team-card animate-fade-in-up">
              <div className="team-card__image">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop" 
                  alt="Alena Sharma"
                />
              </div>
              <h3>Alena Sharma</h3>
              <p className="team-card__role">Founder & CEO</p>
              <p className="team-card__bio">Fashion enthusiast with 10+ years of industry experience.</p>
            </div>
            <div className="team-card animate-fade-in-up delay-1">
              <div className="team-card__image">
                <img 
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop" 
                  alt="Anjali Mehta"
                />
              </div>
              <h3>Anjali Mehta</h3>
              <p className="team-card__role">Head of Design</p>
              <p className="team-card__bio">Award-winning designer passionate about Indian fashion.</p>
            </div>
            <div className="team-card animate-fade-in-up delay-2">
              <div className="team-card__image">
                <img 
                  src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&h=300&fit=crop" 
                  alt="Rahul Verma"
                />
              </div>
              <h3>Rahul Verma</h3>
              <p className="team-card__role">Operations Manager</p>
              <p className="team-card__bio">Expert in logistics and supply chain management.</p>
            </div>
            <div className="team-card animate-fade-in-up delay-3">
              <div className="team-card__image">
                <img 
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop" 
                  alt="Neha Singh"
                />
              </div>
              <h3>Neha Singh</h3>
              <p className="team-card__role">Customer Relations</p>
              <p className="team-card__bio">Dedicated to ensuring exceptional customer experience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section--cta">
        <div className="container">
          <div className="cta-content animate-fade-in">
            <h2>Join the AlenaTrends Family</h2>
            <p>Experience fashion that celebrates you. Start shopping today!</p>
            <div className="cta-buttons">
              <a href="/" className="btn btn--primary">Shop Now</a>
              <a href="/contact" className="btn btn--secondary">Contact Us</a>
            </div>
          </div>
        </div>
      </section>
    </div>
    </div>
  );
};

export default AboutUs;
