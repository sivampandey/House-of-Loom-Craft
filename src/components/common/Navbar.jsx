import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingBag, Menu, Phone, User, LogOut, Package, Sparkles } from 'lucide-react';
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
    { name: 'Carpets', href: '/#featured' },
    { name: 'Collections', href: '/collections' },
    { name: 'Studio', href: '/#studio' },
    { name: 'Home Decor', href: '/#home-decor' },
    { name: 'Our Story', href: '/#story' },
    { name: 'Contact', href: '/#consultation' },
  ];

  const handleNavClick = (e, href) => {
    if (href.startsWith('/#')) {
      const hash = href.replace('/', '');
      if (location.pathname === '/') {
        if (e) e.preventDefault();
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Navigate to home and then scroll
        navigate(href);
      }
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
      <header className="fixed top-3 sm:top-4 inset-x-0 mx-auto w-[94%] sm:w-[90%] max-w-5xl z-40 transition-all duration-500">
        <div
          className={`w-full mx-auto px-4 sm:px-6 py-2 sm:py-2.5 rounded-full flex items-center justify-between transition-all duration-500 ${scrolled
            ? 'bg-[#627954]/95 backdrop-blur-md border border-[#8EA780]/60 shadow-2xl shadow-[#362B21]/15'
            : 'bg-[#6B825D]/90 backdrop-blur-md border border-[#88A279]/50 shadow-xl'
            }`}
        >
          {/* Brand Logo - POTTERY RUGS & HOME DECOR */}
          <Link
            to="/"
            onClick={(e) => handleNavClick(e, '/#hero')}
            className="flex items-center gap-2.5 sm:gap-3 group pr-2"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#D4BC9F]/60 bg-[#FAF7F0] p-0.5 shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <img
                src={companyInfo.logo}
                alt="Pottery Rugs & Home Decor Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg tracking-[0.15em] text-[#FAF7F0] font-medium group-hover:text-[#D4BC9F] transition-colors leading-tight whitespace-nowrap">
                POTTERY RUGS
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] uppercase tracking-[0.26em] text-[#D4BC9F] font-sans font-bold">
                & HOME DECOR
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-3.5 xl:space-x-5">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-[11px] uppercase tracking-[0.18em] text-[#FAF7F0]/90 hover:text-[#D4BC9F] font-sans font-medium transition-colors relative group py-1 whitespace-nowrap"
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#D4BC9F] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 pr-1">
            {/* Direct Call Helplines */}
            <a
              href={`tel:${companyInfo.phone1}`}
              className="p-1.5 text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors hidden sm:flex items-center justify-center"
              title={`Call Atelier: ${companyInfo.phoneDisplay}`}
              aria-label="Call Atelier"
            >
              <Phone className="w-4 h-4" />
            </a>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="p-1.5 text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors relative flex items-center justify-center"
              title="Saved Pieces"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#506644] text-[#FAF7F0] text-[8px] font-bold rounded-full flex items-center justify-center border border-[#FAF7F0]/30">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart / Bag */}
            <button
              onClick={onOpenCart}
              className="p-1.5 text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors relative flex items-center justify-center"
              title="Atelier Bag"
              aria-label="Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#D4BC9F] text-[#362B21] text-[8px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Client Account Trigger */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isAuthenticated
                  ? 'text-[#FAF7F0] bg-[#789069] border border-[#96AE87]'
                  : 'text-[#FAF7F0] hover:text-[#D4BC9F]'
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

                      <Link
                        to="/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
                        <span>Private Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-[#D4BC9F]" />
                        <span>Acquisitions</span>
                      </Link>

                      <Link
                        to="/profile?tab=addresses"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wider font-sans font-bold hover:bg-[#576D4B] hover:text-[#D4BC9F] rounded-xl transition-colors"
                      >
                        <span>Saved Residences</span>
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
              className="lg:hidden p-1.5 text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors flex items-center justify-center"
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
      />
    </>
  );
}
