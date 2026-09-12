import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowUpRight, Mail, MapPin, Phone, MessageSquare, User, Package, Sparkles, LogOut } from 'lucide-react';
import { companyInfo } from '../../data/carpets';
import { useAuth } from '../../context/AuthContext';

export default function MobileMenu({ isOpen, onClose, onNavigate, onOpenConsultation }) {
  const { user, isAuthenticated, logout } = useAuth();
  if (!isOpen) return null;

  const links = [
    { name: 'Carpets', href: '/#featured', sub: 'Hand-Knotted & Hand Tufted' },
    { name: 'Collections', href: '/collections', sub: 'Showroom Showcase' },
    { name: 'Studio', href: '/#studio', sub: 'Heirloom Detail Inspection' },
    { name: 'Home Decor', href: '/#home-decor', sub: 'Cushions, Throws & Objects' },
    { name: 'Our Story', href: '/#story', sub: 'Craftsmanship Heritage' },
    { name: 'Contact & Bespoke', href: '/#consultation', sub: 'Private Atelier' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#6B825D] text-[#FAF7F0] overflow-y-auto flex flex-col justify-between p-6 sm:p-10 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#89A17A]/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4BC9F]/60 bg-[#FAF7F0] p-0.5 shadow-md flex-shrink-0">
            <img src={companyInfo.logo} alt="Pottery Rugs & Home Decor Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-serif text-xl sm:text-2xl tracking-[0.16em] text-[#FAF7F0] font-medium block leading-tight">
              POTTERY RUGS
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.28em] text-[#D4BC9F] font-bold">
              & HOME DECOR
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-[#576D4B] border border-[#89A17A] text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Client Account Section in Mobile Menu */}
      <div className="py-4 border-b border-[#89A17A]/50">
        {isAuthenticated ? (
          <div className="flex items-center justify-between bg-[#576D4B]/70 p-3.5 rounded-2xl border border-[#89A17A]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#FAF7F0] text-[#362B21] font-serif font-bold flex items-center justify-center text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-[#FAF7F0]">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-[#D4BC9F] font-mono">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                onClick={onClose}
                className="text-[10px] uppercase tracking-wider font-bold bg-[#657C57] px-3 py-1.5 rounded-full border border-[#89A17A] text-[#FAF7F0]"
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
              className="py-2.5 px-3 text-center text-xs uppercase tracking-wider font-bold rounded-xl bg-[#576D4B] border border-[#89A17A] text-[#FAF7F0] hover:bg-[#657C57]"
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

      {/* Nav Links */}
      <nav className="py-5 flex flex-col space-y-2.5">
        {links.map((link, idx) => (
          <a
            key={link.name}
            href={link.href}
            onClick={(e) => {
              onClose();
              onNavigate(e, link.href);
            }}
            className="group flex items-baseline justify-between border-b border-[#6D7F62]/30 pb-2 transition-all"
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
              <span className="text-[11px] text-[#FAF7F0]/70 hidden sm:inline">{link.sub}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#D4BC9F] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </a>
        ))}
      </nav>

      {/* Bottom Info & CTA */}
      <div className="border-t border-[#6D7F62]/60 pt-4 space-y-3">
        <button
          onClick={() => {
            onClose();
            onOpenConsultation();
          }}
          className="w-full bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-colors border border-[#85997A]/60 shadow-lg"
        >
          Request Private Atelier Consultation
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#D4BC9F] font-medium pt-1">
          <a href={`tel:${companyInfo.phone1}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3.5 h-3.5 text-[#D4BC9F]" />
            Helpline: {companyInfo.phone1}
          </a>
          <a href={`https://wa.me/${companyInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
            WhatsApp Direct
          </a>
        </div>
      </div>
    </div>
  );
}
