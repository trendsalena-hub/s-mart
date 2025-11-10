import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { CartProvider } from "./components/context/CartContext";
import "./App.scss";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAZY-LOADED COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Layout Components
const Header = lazy(() => import("./components/Header/Header"));
const Footer = lazy(() => import("./components/Footer/Footer"));

// Page Components
const Home = lazy(() => import("./pages/Home/Home"));
const Collections = lazy(() => import("./pages/Collections/Collections"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));
const CartPage = lazy(() => import("./pages/Cart/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const QuickView = lazy(() => import("./pages/QuickView/QuickView"));
const Login = lazy(() => import("./pages/Login/Login"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard/AdminDashboard"));

// PWA Install Prompt
const InstallPrompt = lazy(() => import("./components/InstallPrompt/InstallPrompt"));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SPINNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner">
      <div className="spinner-ring"></div>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 404 NOT FOUND PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const NotFound = () => (
  <div className="not-found">
    <div className="not-found__content">
      <i className="fas fa-shopping-bag not-found__icon"></i>
      <h1>404</h1>
      <h2>Oops! Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <a href="/" className="btn btn--primary">
        <i className="fas fa-home"></i>
        Back to Home
      </a>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCROLL TO TOP ON ROUTE CHANGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ScrollToTop = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ 
      top: 0, 
      behavior: "smooth" 
    });
  }, [pathname]);
  
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN LAYOUT WRAPPER (Header + Content + Footer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MainLayout = ({ children }) => (
  <>
    <Header />
    <main className="main-content">
      {children}
    </main>
    <Footer />
  </>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  PUBLIC ROUTES
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/collections" element={<MainLayout><Collections /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  SHOP ROUTES
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
              <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
              <Route path="/quick-view" element={<MainLayout><QuickView /></MainLayout>} />
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  AUTH ROUTES
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  ADMIN ROUTES
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              <Route path="/admin/*" element={<MainLayout><AdminDashboard /></MainLayout>} />
              
              {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                  ERROR ROUTES (404)
              ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              
              <Route path="/404" element={<MainLayout><NotFound /></MainLayout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                PWA INSTALL PROMPT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            
            <InstallPrompt />
          </Suspense>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
