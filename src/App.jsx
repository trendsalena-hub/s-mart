import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
const Login = lazy(() => import("./pages/Login/Login"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard/AdminDashboard"));

// Loading component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner">
      <i className="fas fa-spinner fa-spin"></i>
    </div>
    <p>Loading beautiful fashion...</p>
  </div>
);

// 404 Not Found Page
const NotFound = () => (
  <div className="not-found">
    <div className="not-found__content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn--primary">
        <i className="fas fa-home"></i>
        Back to Home
      </a>
    </div>
  </div>
);

// Main Layout with Header and Footer
const MainLayout = ({ children }) => (
  <>
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </>
);

function App() {
  return (
    <CartProvider>
      <Router>
        <div className="App">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Admin route without Header/Footer */}
              <Route path="/admin" element={<AdminDashboard />} />
              
              {/* Main routes with Header/Footer */}
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
              <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
              <Route path="/about" element={<MainLayout><AboutUs /></MainLayout>} />
              <Route path="/checkout" element={<MainLayout><Checkout /></MainLayout>} />
              <Route path="/quick-view" element={<MainLayout><QuickView /></MainLayout>} />
              <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              
              {/* 404 Not Found */}
              <Route path="/404" element={<MainLayout><NotFound /></MainLayout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
