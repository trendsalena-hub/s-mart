import React, { useState, useEffect } from 'react';
import { useCart } from '../../components/context/CartContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './Home.scss';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Hero slider images
  const heroSlides = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop',
    'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8ZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D&fm=jpg&q=60&w=3000',
    'https://images.squarespace-cdn.com/content/v1/5a2825178fd4d28d140369eb/39810c72-28db-4376-87d4-35ce8e3af913/pexels-ksenia-chernaya-3965545.jpg',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=800&fit=crop'
  ];

  useEffect(() => {
    setIsVisible(true);

    // Auto slide every 3 seconds
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);

    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  // Show notification when item is added to cart
  const showAddToCartNotification = (productTitle) => {
    setNotificationMessage(`${productTitle} added to cart!`);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Women's Collection Data
  const latestArrivals = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop',
      title: 'Floral Print Short Top',
      price: 499,
      originalPrice: 799,
      discount: 38,
      badge: 'New'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=500&fit=crop',
      title: 'Casual Printed Shirt',
      price: 599,
      originalPrice: 999,
      discount: 40,
      badge: 'Sale'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop',
      title: 'Designer Ethnic Wear',
      price: 899,
      originalPrice: 1299,
      discount: 31,
      badge: 'Hot'
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop',
      title: 'Blue Denim Shirt',
      price: 699,
      originalPrice: 1099,
      discount: 36,
      badge: 'Trending'
    }
  ];

  const ethnicCollection = [
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&h=500&fit=crop',
      title: 'Traditional Silk Saree',
      price: 2499,
      originalPrice: 3999,
      discount: 38,
      badge: 'New'
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop',
      title: 'Embroidered Lehenga',
      price: 3499,
      originalPrice: 4999,
      discount: 30,
      badge: 'Sale'
    },
    {
      id: 7,
      image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=500&fit=crop',
      title: 'Designer Anarkali Suit',
      price: 1899,
      originalPrice: 2799,
      discount: 32,
      badge: 'Hot'
    },
    {
      id: 8,
      image: 'https://images.unsplash.com/photo-1585487000113-6e5f4b6c4d78?w=400&h=500&fit=crop',
      title: 'Kalamkari Kurti Set',
      price: 1299,
      originalPrice: 1899,
      discount: 32,
      badge: 'Trending'
    }
  ];

  const westernCollection = [
    {
      id: 9,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop',
      title: 'Designer Evening Gown',
      price: 2999,
      originalPrice: 4599,
      discount: 35,
      badge: 'New'
    },
    {
      id: 10,
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop',
      title: 'Casual Summer Dress',
      price: 1499,
      originalPrice: 2299,
      discount: 35,
      badge: 'Sale'
    },
    {
      id: 11,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=500&fit=crop',
      title: 'Office Formal Wear',
      price: 1799,
      originalPrice: 2599,
      discount: 31,
      badge: 'Hot'
    },
    {
      id: 12,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop',
      title: 'Party Wear Jumpsuit',
      price: 2199,
      originalPrice: 3299,
      discount: 33,
      badge: 'Trending'
    }
  ];

  const accessoriesCollection = [
    {
      id: 13,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=500&fit=crop',
      title: 'Designer Handbag',
      price: 1299,
      originalPrice: 1999,
      discount: 35,
      badge: 'New'
    },
    {
      id: 14,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=500&fit=crop',
      title: 'Pearl Jewelry Set',
      price: 899,
      originalPrice: 1499,
      discount: 40,
      badge: 'Sale'
    },
    {
      id: 15,
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop',
      title: 'Designer Sunglasses',
      price: 599,
      originalPrice: 999,
      discount: 40,
      badge: 'Hot'
    },
    {
      id: 16,
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=500&fit=crop',
      title: 'Leather Sandals',
      price: 799,
      originalPrice: 1299,
      discount: 38,
      badge: 'Trending'
    }
  ];

  const handleAddToCart = (product) => {
    addToCart(product);
    showAddToCartNotification(product.title);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="main-home">
    <div className={`home ${isVisible ? 'visible' : ''}`}>
      {/* Add to Cart Notification */}
      {showNotification && (
        <div className="cart-notification">
          <i className="fas fa-check-circle"></i>
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Hero Section with Image Slider */}
      <section className="hero">
        <div className="hero__slider-container">
          <div className="hero__slider">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`hero__slide ${index === currentSlide ? 'hero__slide--active' : ''}`}
                style={{ backgroundImage: `url(${slide})` }}
              >
                <div className="hero__overlay">
                  <div className="container">
                    <div className="hero__text">
                      <h1 className="hero__title animate-fade-in-up">
                        Elegance Redefined
                      </h1>
                      <p className="hero__subtitle animate-fade-in-up delay-1">
                        Discover the finest women's fashion collection
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Slider Controls */}
          <button 
            className="hero__slider-btn hero__slider-btn--prev"
            onClick={goToPrevSlide}
            aria-label="Previous slide"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button 
            className="hero__slider-btn hero__slider-btn--next"
            onClick={goToNextSlide}
            aria-label="Next slide"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          
          {/* Slider Indicators */}
          <div className="hero__slider-indicators">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`hero__slider-indicator ${index === currentSlide ? 'hero__slider-indicator--active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Arrivals Section */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              New Arrivals
            </h2>
            <p className="section__subtitle">
              Fresh styles just for you
            </p>
          </div>
          <div className="product-grid">
            {latestArrivals.map((product, index) => (
              <div 
                key={product.id}
                className="product-card-wrapper animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <ProductCard 
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  badge={product.badge}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ethnic Wear Collection */}
      <section className="section section--pink">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Ethnic Collection
            </h2>
            <p className="section__subtitle">
              Traditional elegance with modern touch
            </p>
          </div>
          <div className="product-grid">
            {ethnicCollection.map((product, index) => (
              <div 
                key={product.id}
                className="product-card-wrapper animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <ProductCard 
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  badge={product.badge}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Western Wear Collection */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Western Collection
            </h2>
            <p className="section__subtitle">
              Contemporary styles for the modern woman
            </p>
          </div>
          <div className="product-grid">
            {westernCollection.map((product, index) => (
              <div 
                key={product.id}
                className="product-card-wrapper animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <ProductCard 
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  badge={product.badge}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessories Collection */}
      <section className="section section--pink-light">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Accessories
            </h2>
            <p className="section__subtitle">
              Complete your look with our accessories
            </p>
          </div>
          <div className="product-grid">
            {accessoriesCollection.map((product, index) => (
              <div 
                key={product.id}
                className="product-card-wrapper animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <ProductCard 
                  image={product.image}
                  title={product.title}
                  price={product.price}
                  originalPrice={product.originalPrice}
                  discount={product.discount}
                  badge={product.badge}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Women Collections Banner */}
      <section className="category-banner">
        <div className="container">
          <h2 className="category-banner__title animate-fade-in">
            Shop By Category
          </h2>
          <div className="category-banner__grid">
            {[
              { 
                src: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400&h=300&fit=crop', 
                title: 'Ethnic Wear',
                description: 'Traditional & Contemporary'
              },
              { 
                src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop', 
                title: 'Western Wear',
                description: 'Modern Styles'
              },
              { 
                src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=300&fit=crop', 
                title: 'Accessories',
                description: 'Complete Your Look'
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="category-banner__item animate-fade-in-up"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <img src={item.src} alt={item.title} />
                <div className="category-banner__overlay">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span>Shop Now</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Character Section */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Be The Main Character
            </h2>
            <p className="section__subtitle">
              Express your unique style with our curated collections
            </p>
          </div>
          <div className="character-grid">
            {[
              'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop',
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop',
              'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop',
              'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop'
            ].map((src, index) => (
              <div 
                key={index}
                className="character-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <img src={src} alt={`Fashion Style ${index + 1}`} />
                <div className="character-card__overlay">
                  <span>View Style</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="section section--pink-light">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Style Gallery
            </h2>
            <p className="section__subtitle">
              See our collections in action
            </p>
          </div>
          <div className="image-gallery">
            {[
              { src: 'https://i.pinimg.com/originals/5a/33/c4/5a33c4b974be0c4d0bc9d85622651b03.jpg', label: 'Traditional Elegance' },
              { src: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop', label: 'Lehenga Collection' },
              { src: 'https://media.istockphoto.com/id/1324844508/photo/gorgeous-woman-wearing-beautiful-maxi-dress-posing-against-wall-with-a-wild-grape.jpg?s=612x612&w=0&k=20&c=BJrcuLt0m5Hm6zOhgO-E0TGqIxzWKdecgw1xcOu1aN4=', label: 'Maxi Dresses' },
              { src: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=300&h=400&fit=crop', label: 'Casual Wear' }
            ].map((item, index) => (
              <div 
                key={index}
                className="image-gallery__item animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img src={item.src} alt={item.label} />
                <div className="image-gallery__label">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hindi Text Section */}
      <section className="section section--text">
        <div className="container">
          <h2 className="text-section__title animate-fade-in">
          हमारी नहीं, उन अप्सराओं की सुनो जो हर दिन संघर्ष से सुंदरता गढ़ती हैं।
          </h2>
          <p className="text-section__subtitle animate-fade-in delay-1">
            Discover the beauty of our exclusive women's collection
          </p>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2 className="section__title animate-fade-in">
              Follow Us on Instagram
            </h2>
            <p className="section__subtitle">
              @alenatrends_fashion
            </p>
          </div>
          <div className="instagram-grid">
            {[
              'https://image.made-in-china.com/202f0j00ZwtaORscfHrd/Women-Beach-Holiday-Bohemian-Chiffon-Long-Dress-Summer-Casual-Clothes.webp',
              'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQuO00fciOzC32O6JXOR6kU_965uN2h56zsl-8STyHptu2nWowInQyDTocABdIcUA-ORhgEy9MLLDD4LbM9Kxn39L1ZljtPMO1RAz6Ooj4-tpp7wzQaYmPc2w',
              'https://i.pinimg.com/736x/58/78/4c/58784c993ad4c27b12307814b253a492.jpg',
              'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop',
              'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=300&h=300&fit=crop',
              'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&h=300&fit=crop'
            ].map((src, index) => (
              <div 
                key={index}
                className="instagram-card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <img src={src} alt={`Instagram Post ${index + 1}`} />
                <div className="instagram-card__overlay">
                  <i className="fab fa-instagram"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </div>
  );
};

export default Home;
