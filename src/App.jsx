import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';

// Common UI & Layout
import CustomCursor from './components/common/CustomCursor';
import ScrollToTop from './components/common/ScrollToTop';
import Navbar from './components/common/Navbar';
import Toast from './components/common/Toast';
import ProtectedRoute from './components/common/ProtectedRoute';
import Footer from './components/sections/Footer';

// Drawers & Modals
import CartDrawer from './components/drawers/CartDrawer';
import WishlistDrawer from './components/drawers/WishlistDrawer';
import SearchModal from './components/drawers/SearchModal';
import QuickViewModal from './components/drawers/QuickViewModal';
import ConsultationModal from './components/drawers/ConsultationModal';

// Pages
import HomePage from './pages/HomePage';
import CarpetsPage from './pages/CarpetsPage';
import CollectionsPage from './pages/CollectionsPage';
import StudioPage from './pages/StudioPage';
import HomeDecorPage from './pages/HomeDecorPage';
import OurStoryPage from './pages/OurStoryPage';
import ContactPage from './pages/ContactPage';
import ProductDetailPage from './pages/ProductDetailPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import NotFoundPage from './pages/NotFoundPage';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    totalCount
  } = useCart();

  const {
    wishlistItems,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    removeFromWishlist,
    isWishlisted
  } = useWishlist();

  // Modals Visibility
  const [searchOpen, setSearchOpen] = useState(false);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Global Toast
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleBuyNow = (product) => {
    setQuickViewProduct(null);
    addToCart(product, 1);
    navigate('/checkout');
  };

  const moveToCartFromWishlist = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product.slug || product.id || product._id);
    showToast('cart', 'Added to Bag', `${product.name} moved to your shopping bag.`);
  };

  const handleNavigate = (e, href) => {
    if (e) e.preventDefault();
    if (href.startsWith('/#')) {
      const hash = href.replace('/', '');
      if (location.pathname === '/') {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(href);
      }
    } else if (href.startsWith('#')) {
      if (location.pathname === '/') {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate(`/${href}`);
      }
    } else {
      navigate(href);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#1E261B] relative overflow-x-hidden selection:bg-[#43533D]/30 selection:text-[#1E261B]">
      {/* Route Scroll Restoration to Top */}
      <ScrollToTop />

      {/* Desktop Custom Cursor */}
      <CustomCursor />

      {/* Floating Header */}
      <Navbar
        cartCount={totalCount}
        wishlistCount={wishlistItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenConsultation={() => setConsultationOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Dynamic Route Pages */}
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenQuickView={setQuickViewProduct}
              onOpenConsultation={() => setConsultationOpen(true)}
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/carpets"
          element={
            <CarpetsPage
              onOpenQuickView={setQuickViewProduct}
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/collections"
          element={
            <CollectionsPage
              onOpenQuickView={setQuickViewProduct}
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/collections/:slug"
          element={
            <CollectionsPage
              onOpenQuickView={setQuickViewProduct}
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/studio"
          element={<StudioPage />}
        />
        <Route
          path="/home-decor"
          element={
            <HomeDecorPage
              onOpenQuickView={setQuickViewProduct}
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/our-story"
          element={<OurStoryPage />}
        />
        <Route
          path="/contact"
          element={<ContactPage onShowToast={showToast} />}
        />
        <Route
          path="/products/:slug"
          element={
            <ProductDetailPage
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/register"
          element={
            <RegisterPage
              onShowToast={showToast}
            />
          }
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage
              onShowToast={showToast}
            />
          }
        />

        {/* Protected Client Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <ProfilePage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/security"
          element={
            <ProtectedRoute>
              <ProfilePage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/addresses"
          element={
            <ProtectedRoute>
              <ProfilePage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:orderId"
          element={
            <ProtectedRoute>
              <OrderDetailPage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage onShowToast={showToast} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-success/:orderId"
          element={<OrderSuccessPage />}
        />

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Dark Earthy Luxury Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenConsultation={() => setConsultationOpen(true)}
      />

      {/* Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={removeFromCart}
        onUpdateQty={updateQuantity}
        onCheckout={handleCheckout}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemove={removeFromWishlist}
        onMoveToCart={moveToCartFromWishlist}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectProduct={(item) => {
          setSearchOpen(false);
          navigate(`/products/${item.slug || item.id}`);
        }}
      />

      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p) => {
          addToCart(p, 1);
          showToast('cart', 'Added to Bag', `${p.name} placed in your shopping bag.`);
        }}
        onBuyNow={handleBuyNow}
        onToggleWishlist={async (p) => {
          const res = await toggleWishlist(p);
          showToast('wishlist', res.saved ? 'Saved to Wishlist' : 'Removed from Wishlist', res.message);
        }}
        isWishlisted={quickViewProduct ? isWishlisted(quickViewProduct.slug || quickViewProduct.id || quickViewProduct._id) : false}
      />

      <ConsultationModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
      />

      {/* Toast Notification */}
      <Toast
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <AppContent />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
