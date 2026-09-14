import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider, useWishlist } from './context/WishlistContext';
import { prewarmBackend } from './services/api';

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

// Fast critical-path Landing Page
import HomePage from './pages/HomePage';

// Lazy-loaded Customer Pages (Splits bundle for ultra-fast initial paint)
const CarpetsPage = lazy(() => import('./pages/CarpetsPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));
const HomeDecorPage = lazy(() => import('./pages/HomeDecorPage'));
const OurStoryPage = lazy(() => import('./pages/OurStoryPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Lazy-loaded Admin Portal Pages (Admin bundle completely isolated from customer bundle)
const AdminRoute = lazy(() => import('./components/admin/AdminRoute'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('./pages/admin/AdminProductFormPage'));
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminOffersPage = lazy(() => import('./pages/admin/AdminOffersPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));

// Elegant Minimalist Page Transition Fallback
function PageLoader() {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center bg-[#FAF7F2]">
      <div className="w-7 h-7 border-2 border-[#45563D]/20 border-t-[#45563D] rounded-full animate-spin"></div>
      <span className="mt-3 text-[11px] tracking-widest uppercase font-serif text-[#1E261B]/60">
        Loading...
      </span>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-warm backend API upon initial site load to prevent Render cold-sleep latency
  useEffect(() => {
    prewarmBackend();
  }, []);

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

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen ${isAdminRoute ? 'bg-[#FAF7F2]' : 'bg-[#F5F0E6]'} text-[#1E261B] relative overflow-x-hidden selection:bg-[#43533D]/30 selection:text-[#1E261B]`}>
      {/* Route Scroll Restoration to Top */}
      <ScrollToTop />

      {/* Desktop Custom Cursor - only on public storefront */}
      {!isAdminRoute && <CustomCursor />}

      {/* Floating Header - only on public storefront */}
      {!isAdminRoute && (
        <Navbar
          cartCount={totalCount}
          wishlistCount={wishlistItems.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenConsultation={() => setConsultationOpen(true)}
          onNavigate={handleNavigate}
        />
      )}

      {/* Dynamic Route Pages */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public Storefront Routes */}
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

        {/* Admin Portal Authentication */}
        <Route
          path="/admin/login"
          element={<AdminLoginPage onShowToast={showToast} />}
        />

        {/* Protected Admin Console Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id/edit" element={<AdminProductFormPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="offers" element={<AdminOffersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* 404 Catch All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>

      {/* Global Dark Earthy Luxury Footer - only on public storefront */}
      {!isAdminRoute && (
        <Footer
          onNavigate={handleNavigate}
          onOpenConsultation={() => setConsultationOpen(true)}
        />
      )}

      {/* Drawers & Modals - only on public storefront */}
      {!isAdminRoute && (
        <>
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
        </>
      )}

      {/* Toast Notification - available everywhere */}
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
