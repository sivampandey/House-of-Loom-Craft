import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Mail, Phone, ShieldCheck, MessageSquare } from 'lucide-react';
import { companyInfo } from '../../data/carpets';

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function Footer({ onNavigate, onOpenConsultation }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <footer className="bg-[#3D4C35] text-[#FAF7F0] border-t border-[#5B6E51] relative overflow-hidden pt-20 pb-12">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#55694A]/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 space-y-16">
        {/* Top Newsletter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-[#5B6E51]/60 items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold">
              PRIVATE DISPATCH & PREVIEWS
            </span>
            <h3 className="font-serif text-3xl md:text-4xl text-[#FAF7F0] font-light">
              Receive Private Preview Editions
            </h3>
            <p className="text-xs font-sans text-[#FAF7F0]/80 max-w-md font-medium leading-relaxed">
              Curated architectural project dispatches, new loom cuttings from Bhadohi, and invitations to private showroom exhibitions.
            </p>
          </div>

          <div className="lg:col-span-6">
            {subscribed ? (
              <div className="p-4 rounded-xl bg-[#48593F] border border-[#6D8262] text-[#FAF7F0] text-xs font-sans flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#D4BC9F] flex-shrink-0" />
                <span>You are now subscribed to our private dispatch. Welcome.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your residence email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-[#48593F] border border-[#657859] rounded-lg px-5 py-3.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/50 focus:border-[#D4BC9F] focus:outline-none font-sans"
                />
                <button
                  type="submit"
                  className="bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold px-6 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg flex-shrink-0 border border-[#7D9271]"
                >
                  <span>Inscribe</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 sm:gap-10 text-xs font-sans">
          {/* Column 1: Brand & Atelier Presence */}
          <div className="col-span-1 sm:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#D4BC9F]/60 bg-[#FAF7F0] p-1 shadow-md flex-shrink-0">
                <img src={companyInfo.logo} alt="Pottery Rugs & Home Decor Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl tracking-[0.16em] text-[#FAF7F0] block font-medium">
                  {companyInfo.name}
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4BC9F] block font-bold mt-0.5">
                  {companyInfo.companyType}
                </span>
              </div>
            </div>

            <p className="text-[#FAF7F0]/80 font-medium leading-relaxed max-w-sm">
              Heirloom hand-knotted and hand-tufted textiles, modern architectural floorings, and sculpted interior objects. Handcrafted by generational master weavers in Bhadohi, U.P.
            </p>

            <div className="space-y-2 pt-2 text-[#D4BC9F] font-medium">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-[#FAF7F0]/90">
                <MapPin className="w-4 h-4 text-[#D4BC9F] flex-shrink-0 mt-0.5" />
                <span>{companyInfo.address}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a href={`tel:${companyInfo.phone1}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  <span>+91 {companyInfo.phone1}</span>
                </a>
                <span>&bull;</span>
                <a href={`tel:${companyInfo.phone2}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  <span>+91 {companyInfo.phone2}</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a 
                  href={companyInfo.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-[#D4BC9F]" />
                  <span>Instagram: {companyInfo.instagramHandle}</span>
                </a>
                <span>&bull;</span>
                <a 
                  href={`https://wa.me/${companyInfo.whatsappNumber}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#25D366] hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Product Details & Categories */}
          <div className="space-y-3">
            <h4 className="font-serif text-base text-[#FAF7F0] tracking-wide font-medium">Carpets & Rugs</h4>
            <ul className="space-y-2 text-[#FAF7F0]/80 font-medium">
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Hand Tufted Rugs</Link></li>
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Hand Knotted Rugs</Link></li>
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Hand Woven Rugs</Link></li>
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Handloom Rugs</Link></li>
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Custom Rugs</Link></li>
              <li><Link to="/carpets" className="hover:text-[#D4BC9F] transition-colors">Special Shape Rugs</Link></li>
            </ul>
          </div>

          {/* Column 3: Home Decor & Bespoke */}
          <div className="space-y-3">
            <h4 className="font-serif text-base text-[#FAF7F0] tracking-wide font-medium">Home Decor</h4>
            <ul className="space-y-2 text-[#FAF7F0]/80 font-medium">
              <li><Link to="/home-decor" className="hover:text-[#D4BC9F] transition-colors">Hand-Embroidered Cushions</Link></li>
              <li><Link to="/home-decor" className="hover:text-[#D8B693] transition-colors">Cashmere & Pashmina Throws</Link></li>
              <li><Link to="/home-decor" className="hover:text-[#D8B693] transition-colors">Sculpted Bouclé Poufs</Link></li>
              <li><Link to="/home-decor" className="hover:text-[#D8B693] transition-colors">Antique Hand-Beaten Brass</Link></li>
              <li><Link to="/home-decor" className="hover:text-[#D8B693] transition-colors">Monolith Travertine Tables</Link></li>
              <li><Link to="/contact" className="text-[#D4BC9F] hover:underline font-bold">Custom Rug Commission</Link></li>
            </ul>
          </div>

          {/* Column 4: Curatorial Support */}
          <div className="space-y-3">
            <h4 className="font-serif text-base text-[#FAF7F0] tracking-wide font-medium">Client Concierge</h4>
            <ul className="space-y-2 text-[#FAF7F0]/80 font-medium">
              <li><Link to="/our-story" className="hover:text-[#D4BC9F] transition-colors">Our Story & Heritage</Link></li>
              <li><Link to="/studio" className="hover:text-[#D4BC9F] transition-colors">Studio & Craft Process</Link></li>
              <li><Link to="/contact" className="hover:text-[#D4BC9F] transition-colors">Contact Workshop</Link></li>
              <li><span className="hover:text-[#D4BC9F] cursor-pointer">Insured Nationwide Shipping</span></li>
              <li><span className="hover:text-[#D4BC9F] cursor-pointer">Carpet Care & Restoration</span></li>
              <li><span className="hover:text-[#D4BC9F] cursor-pointer">Certificate of Authenticity</span></li>
            </ul>
          </div>
        </div>

        {/* Brand Seal */}
        <div className="py-8 border-t border-[#5B6E51]/60 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full border border-[#D4BC9F] bg-[#FAF7F0] p-1 flex items-center justify-center overflow-hidden shadow">
              <img src={companyInfo.logo} alt="Pottery Rugs Official Emblem" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#FAF7F0] font-bold block">
                {companyInfo.name} &bull; REGISTERED
              </span>
              <span className="text-[10px] text-[#FAF7F0]/70 block">
                Manufacturer & Exporter &bull; Bhadohi, U.P. 221301 (India)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-[#FAF7F0]/80">
            <span>&copy; 2026 {companyInfo.name}. All rights reserved.</span>
            <span className="hover:text-[#FAF7F0] cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-[#FAF7F0] cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-[#FAF7F0] cursor-pointer">Provenance & Ethics</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
