import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./components/context/CartContext";
import "./App.scss";

// 💤 Lazy-loaded components
const Header = lazy(() => import("./components/Header/Header"));
const Footer = lazy(() => import("./components/Footer/Footer"));
const Home = lazy(() => import("./pages/Home/Home"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const CartPage = lazy(() => import("./pages/Cart/CartPage"));
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const QuickView = lazy(() => import("./pages/QuickView/QuickView"));

// Loading component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner">
      <i className="fas fa-spinner fa-spin"></i>
    </div>
    <p>Loading beautiful fashion...</p>
  </div>
);

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Header />
            
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/quick-view" element={<QuickView />} />
                {/* Add more routes as needed */}
              </Routes>
            </main>

            <Footer />
          </Suspense>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;