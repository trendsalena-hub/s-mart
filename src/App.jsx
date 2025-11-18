import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
// These paths are standard for a project with App.js in the /src folder
import { CartProvider } from "./components/context/CartContext.jsx"; 
import { AuthProvider } from "./components/context/AuthContext.jsx"; 
import "./App.scss"; // This file also needs to exist in /src

// Lazy Imports
const Header = lazy(() => import("./components/Header/Header.jsx"));
const Footer = lazy(() => import("./components/Footer/Footer.jsx"));
const InstallPrompt = lazy(() => import("./components/InstallPrompt/InstallPrompt.jsx"));

// FIX: Updated all paths to point inside page-specific folders
const pages = {
  Home: lazy(() => import("./pages/Home/Home.jsx")),
  Collections: lazy(() => import("./pages/Collections/Collections.jsx")),
  Contact: lazy(() => import("./pages/Contact/Contact.jsx")),
  About: lazy(() => import("./pages/AboutUs/AboutUs.jsx")),
  Cart: lazy(() => import("./pages/Cart/CartPage.jsx")),
  Checkout: lazy(() => import("./pages/Checkout/Checkout.jsx")),
  QuickView: lazy(() => import("./pages/QuickView/QuickView.jsx")),
  Login: lazy(() => import("./pages/Login/Login.jsx")),
  Profile: lazy(() => import("./pages/Profile/pages/Profile.jsx")),
  Admin: lazy(() => import("./pages/AdminDashboard/AdminDashboard.jsx")),
  OrderDetails: lazy(() => import("./pages/OrderDetailsPage/OrderDetailsPage.jsx")),
  OrderTracking: lazy(() => import("./pages/OrderTrackingPage/OrderTrackingPage.jsx")),
  ShippingPolicy: lazy(() => import("./pages/ShippingPolicy/ShippingPolicy.jsx")),
  Faq: lazy(() => import("./pages/Faq/FaqPage.jsx")),
  Payment: lazy(() => import("./pages/Payment/PaymentPage.jsx")),

  // === NEW BLOG PAGES ADDED ===
  BlogListing: lazy(() => import("./pages/BlogListing/BlogListingPage.jsx")),
  BlogPost: lazy(() => import("./pages/BlogPost/BlogPostPage.jsx")),
};

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo({ top: 0, behavior: "smooth" }), [pathname]);
  return null;
};

const Loading = () => (
  <div className="loading-spinner">
    <div className="spinner"><div className="spinner-ring"></div></div>
  </div>
);

const NotFound = () => (
  <div className="not-found">
    <i className="fas fa-shopping-bag not-found__icon"></i>
    <h1>404</h1>
    <p>Page not found</p>
    <a href="/" className="btn btn--primary"><i className="fas fa-home"></i> Home</a>
  </div>
);

// Layout wrapper with header/footer
const Layout = ({ children }) => (
  <>
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </>
);

// === NEW: PaymentLayout (No Header/Footer) ===
const PaymentLayout = ({ children }) => (
  <>
    <main className="main-content" style={{paddingTop: 0}}>
      {children}
    </main>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Layout><pages.Home /></Layout>} />
              <Route path="/collections" element={<Layout><pages.Collections /></Layout>} />
              <Route path="/contact" element={<Layout><pages.Contact /></Layout>} />
              <Route path="/about" element={<Layout><pages.About /></Layout>} />
              <Route path="/shipping" element={<Layout><pages.ShippingPolicy /></Layout>} />
              <Route path="/faq" element={<Layout><pages.Faq /></Layout>} />

              {/* === NEW BLOG ROUTES === */}
              <Route path="/blog" element={<Layout><pages.BlogListing /></Layout>} />
              <Route path="/blog/:slug" element={<Layout><pages.BlogPost /></Layout>} />

              {/* Shop */}
              <Route path="/cart" element={<Layout><pages.Cart /></Layout>} />
              <Route path="/checkout" element={<Layout><pages.Checkout /></Layout>} />
              <Route path="/quick-view" element={<Layout><pages.QuickView /></Layout>} />
              
              <Route path="/payment" element={<PaymentLayout><pages.Payment /></PaymentLayout>} />

              {/* Auth */}
              <Route path="/login" element={<Layout><pages.Login /></Layout>} />

              {/* Order Routes */}
              <Route 
                path="/profile/orders/:orderId" 
                element={<Layout><pages.OrderDetails /></Layout>} 
              />
              <Route 
                path="/profile/orders/track/:orderId" 
                element={<Layout><pages.OrderTracking /></Layout>} 
              />

              {/* Profile with nested subroutes catching all */}
              <Route path="/profile/*" element={<Layout><pages.Profile /></Layout>} />

              {/* Admin with nested subroutes */}
              <Route path="/admin/*" element={<Layout><pages.Admin /></Layout>} />

              {/* Not Found */}
              <Route path="/404" element={<Layout><NotFound /></Layout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>

            <InstallPrompt />
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}