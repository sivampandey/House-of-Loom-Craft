import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowUpRight, Phone, MessageSquare, Heart } from 'lucide-react';
import { companyInfo } from '../../data/carpets';
import { useAuth } from '../../context/AuthContext';

export default function MobileMenu({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onOpenConsultation,
  onOpenWishlist,
  wishlistCount = 0
}) {
  const { user, isAuthenticated } = useAuth();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const links = [
    { name: 'Carpets', href: '/carpets', sub: 'Hand-Knotted & Hand Tufted' },
    { name: 'Collections', href: '/collections', sub: 'Showroom Showcase' },
    { name: 'Studio', href: '/studio', sub: 'Craft & Design Process' },
    { name: 'Home Decor', href: '/home-decor', sub: 'Cushions, Throws & Objects' },
    { name: 'Our Story', href: '/our-story', sub: 'Craftsmanship Heritage' },
    { name: 'Contact', href: '/contact', sub: 'Workshop & Helplines' },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#5C7251]/98 backdrop-blur-xl text-[#FAF7F0] overflow-y-auto flex flex-col justify-between p-5 sm:p-8 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#89A17A]/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D4BC9F]/60 bg-[#FAF7F0] p-0.5 shadow-md flex-shrink-0">
            <img src={companyInfo.logo} alt="House of Loom & Craft Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-serif text-base tracking-[0.06em] text-[#FAF7F0] font-medium block leading-tight">
              House of Loom & Craft
            </span>
            <span className="text-[7.5px] uppercase tracking-[0.2em] text-[#D4BC9F] font-medium">
              Bhadohi Atelier
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-[#4E6243] border border-[#7E9670] text-[#FAF7F0] hover:text-[#D4BC9F] active:scale-95 transition-all"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Client Account Section in Mobile Menu */}
      <div className="py-3.5 border-b border-[#89A17A]/50">
        {isAuthenticated ? (
          <div className="flex items-center justify-between bg-[#4E6243]/80 p-3 rounded-xl border border-[#7E9670]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF7F0] text-[#362B21] font-serif font-bold flex items-center justify-center text-xs">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div className="truncate max-w-[180px]">
                <p className="text-xs font-bold text-[#FAF7F0] truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-[#D4BC9F] font-mono truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  onClick={onClose}
                  className="text-[10px] uppercase tracking-wider font-bold bg-[#BA9977] px-3 py-1.5 rounded-full text-[#1E261B] shadow-sm"
                >
                  Admin
                </Link>
              )}
              <Link
                to="/profile"
                onClick={onClose}
                className="text-[10px] uppercase tracking-wider font-bold bg-[#607755] px-3 py-1.5 rounded-full border border-[#89A17A] text-[#FAF7F0]"
              >
                Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/login"
              onClick={onClose}
              className="py-2.5 px-3 text-center text-xs uppercase tracking-wider font-bold rounded-xl bg-[#4E6243] border border-[#7E9670] text-[#FAF7F0] hover:bg-[#5C7251]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="py-2.5 px-3 text-center text-xs uppercase tracking-wider font-bold rounded-xl bg-[#D4BC9F] text-[#362B21] hover:bg-[#FAF7F0]"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Saved Pieces (Wishlist) Quick Row */}
      {onOpenWishlist && (
        <div className="pt-2 pb-1">
          <button
            onClick={() => {
              onClose();
              onOpenWishlist();
            }}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-[#4E6243]/40 border border-[#7E9670]/40 text-xs text-[#FAF7F0] hover:bg-[#4E6243]"
          >
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-[#D4BC9F]" />
              <span className="uppercase tracking-wider font-sans font-medium text-[11px]">Saved Pieces (Wishlist)</span>
            </div>
            {wishlistCount > 0 && (
              <span className="bg-[#D4BC9F] text-[#362B21] text-[9px] font-bold px-2 py-0.5 rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Nav Links */}
      <nav className="py-4 flex flex-col space-y-1.5">
        {links.map((link, idx) => (
          <a
            key={link.name}
            href={link.href}
            onClick={(e) => {
              onClose();
              onNavigate(e, link.href);
            }}
            className="group flex items-baseline justify-between border-b border-[#7E9670]/30 py-2.5 transition-all"
          >
            <div>
              <span className="text-xs text-[#D4BC9F] font-mono mr-3 font-bold">
                0{idx + 1}
              </span>
              <span className="font-serif text-xl sm:text-2xl text-[#FAF7F0] group-hover:text-[#D4BC9F] group-hover:translate-x-1 transition-all inline-block font-light">
                {link.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#FAF7F0]/70 hidden sm:inline">{link.sub}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D4BC9F] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </a>
        ))}
      </nav>

      {/* Bottom Info & CTA */}
      <div className="border-t border-[#7E9670]/60 pt-4 space-y-3">
        <button
          onClick={() => {
            onClose();
            onOpenConsultation();
          }}
          className="w-full bg-[#4E6243] hover:bg-[#5C7251] text-[#FAF7F0] font-sans font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-colors border border-[#85997A]/60 shadow-lg min-h-[44px]"
        >
          Request Bespoke Consultation
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#D4BC9F] font-medium pt-1">
          <a href={`tel:${companyInfo.phone1}`} className="flex items-center gap-1.5 hover:text-white transition-colors py-1">
            <Phone className="w-3.5 h-3.5 text-[#D4BC9F]" />
            <span>Helpline: {companyInfo.phone1}</span>
          </a>
          <a href={`https://wa.me/${companyInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors py-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp Direct</span>
          </a>
        </div>
      </div>
    </div>
  );
}
