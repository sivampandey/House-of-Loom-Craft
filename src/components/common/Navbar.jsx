import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingBag, Menu, Phone, User, LogOut, Package, Sparkles, ShieldCheck } from 'lucide-react';
import MobileMenu from './MobileMenu';
import { companyInfo } from '../../data/carpets';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenConsultation,
  onNavigate
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountRef = useRef(null);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Carpets', href: '/carpets' },
    { name: 'Collections', href: '/collections' },
    { name: 'Studio', href: '/studio' },
    { name: 'Home Decor', href: '/home-decor' },
    { name: 'Our Story', href: '/our-story' },
    { name: 'Contact', href: '/contact' },
  ];

  const handleNavClick = (e, href) => {
    if (e) e.preventDefault();
    if (location.pathname === href) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      navigate(href);
    }
  };

  const handleLogout = async () => {
    setAccountMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto w-[94%] sm:w-[90%] max-w-6xl z-40 transition-all duration-500">
        <div
          className={`w-full mx-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-full flex items-center justify-between transition-all duration-500 ${scrolled
            ? 'bg-[#627954]/95 backdrop-blur-md border border-[#8EA780]/60 shadow-2xl shadow-[#362B21]/15'
            : 'bg-[#6B825D]/90 backdrop-blur-md border border-[#88A279]/50 shadow-xl'
            }`}
        >
          {/* Brand Logo - House of Loom & Craft */}
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/')}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#D4BC9F]/60 bg-[#FAF7F0] p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={companyInfo.logo}
                alt="House of Loom & Craft Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg tracking-[0.05em] text-[#FAF7F0] font-medium group-hover:text-[#D4BC9F] transition-colors leading-tight whitespace-nowrap">
                House of Loom & Craft
              </span>
              <span className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.22em] text-[#D4BC9F] font-sans font-medium">
                Bhadohi Atelier
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href || (link.href === '/collections' && location.pathname.startsWith('/collections'));
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-[11px] xl:text-[11.5px] uppercase tracking-[0.18em] font-sans font-medium transition-colors relative group py-1 whitespace-nowrap ${
                    isActive ? 'text-[#D4BC9F]' : 'text-[#FAF7F0]/90 hover:text-[#D4BC9F]'
                  }`}
                >
                  <span>{link.name}</span>
                  <span
                    className={`absolute bottom-0 left-0 h-[1.5px] bg-[#D4BC9F] transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons - Clean, balanced, vertically centered */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Direct Call Helplines - Tablet/Desktop */}
            <a
              href={`tel:${companyInfo.phone1}`}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] hover:bg-white/10 transition-colors hidden md:flex items-center justify-center"
              title={`Call Helpline: ${companyInfo.phoneDisplay}`}
              aria-label="Call Helpline"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] hover:bg-white/10 transition-colors relative hidden sm:flex items-center justify-center"
              title="Saved Pieces"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-[#45573B] text-[#FAF7F0] text-[8px] font-bold rounded-full flex items-center justify-center border border-[#FAF7F0]/40">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart / Bag - Always Visible */}
            <button
              onClick={onOpenCart}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] hover:bg-white/10 active:scale-95 transition-all relative flex items-center justify-center"
              title="Shopping Bag"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4BC9F] text-[#362B21] text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Client Account Trigger - Visible on sm and up */}
            <div className="relative hidden sm:block" ref={accountRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all flex items-center justify-center ${isAuthenticated
                  ? 'text-[#FAF7F0] bg-[#789069] border border-[#96AE87]'
                  : 'text-[#FAF7F0] hover:text-[#D4BC9F] hover:bg-white/10'
                  }`}
                title={isAuthenticated ? `Client: ${user.firstName}` : 'Client Sign In'}
                aria-label="Client Account"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {accountMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#657C57] border border-[#89A17A] rounded-2xl shadow-2xl py-3 px-2 z-50 text-[#FAF7F0] animate-fade-in backdrop-blur-md">
                  {isAuthenticated ? (
                    <div className="space-y-1">
                      <div className="px-3 py-2 border-b border-[#89A17A]/60 mb-1">
                        <p className="font-serif text-sm text-[#FAF7F0] font-medium leading-tight">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[10px] text-[#D4BC9F] font-mono truncate">{user.email}</p>
                      </div>

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setAccountMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold bg-[#BA9977]/25 text-[#FAF7F0] hover:bg-[#BA9977]/40 rounded-xl transition-colors mb-1 border border-[#BA9977]/40"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#D4BC9F]" />
                          <span>Admin Console</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-[#D4BC9F]" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/profile?tab=addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <span>Saved Addresses</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold text-red-200 hover:bg-red-900/30 rounded-xl transition-colors pt-2 border-t border-[#89A17A]/60"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="px-3 py-1.5 border-b border-[#89A17A]/60 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#D4BC9F] font-bold">
                          User Profile
                        </span>
                      </div>

                      <Link
                        to="/login"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <span>Sign In</span>
                        <User className="w-3.5 h-3.5 text-[#D4BC9F]" />
                      </Link>

                      <Link
                        to="/register"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold bg-[#576D4B] text-[#FAF7F0] hover:bg-[#4E6242] rounded-xl transition-colors"
                      >
                        <span>Create Account</span>
                        <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[#FAF7F0] hover:text-[#D4BC9F] hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={handleNavClick}
        onOpenConsultation={onOpenConsultation}
        onOpenWishlist={onOpenWishlist}
        wishlistCount={wishlistCount}
      />
    </>
  );
}
