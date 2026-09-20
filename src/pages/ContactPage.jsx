import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageSquare, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import SEO from '../components/common/SEO';
import { companyInfo } from '../data/carpets';

function InstagramIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function ContactPage({ onShowToast }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'Custom Rug Commission',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate brief network submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      if (onShowToast) {
        onShowToast('success', 'Inquiry Sent', 'Thank you. Our team in Bhadohi will get back to you shortly.');
      }
    }, 600);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello House of Loom & Craft,\n\nI would like to inquire about your handcrafted rugs and home decor collection.`
  );

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-20">
      <SEO
        title="Contact | House of Loom & Craft"
        description="Contact House of Loom & Craft. Manufacturer & Exporter of handcrafted rugs and home decor located in Bhadohi, Uttar Pradesh, India."
        path="/contact"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' }
        ]}
      />

      {/* Hero Header */}
      <section className="relative px-6 md:px-12 pt-10 pb-16 md:pb-24 border-b border-[#DACDB3]">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#6D7F62]" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              GET IN TOUCH
            </span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight max-w-3xl">
            We Are Here to Assist Your Spatial Vision
          </h1>
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#4E3C2B] font-medium leading-relaxed max-w-2xl">
            Whether inquiring about custom rug dimensions, trade commissions, showroom viewings, or dispatch updates, connect directly with our Bhadohi workshop team.
          </p>
        </div>
      </section>

      {/* Contact Grid: Form & Info */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Direct Contact Information (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
                DIRECT CONTACT CHANNELS
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#362B21] font-light">
                Workshop & Office
              </h2>
              <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed">
                Connect directly with our master draftsmen and client support representatives.
              </p>
            </div>

            {/* Contact Details Cards */}
            <div className="space-y-4">
              {/* Address */}
              <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#55694A] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#55694A]" />
                  <span>Workshop & Registered Office</span>
                </div>
                <p className="text-xs text-[#362B21] font-mono leading-relaxed">
                  {companyInfo.address}
                </p>
                <p className="text-[11px] text-[#4E3C2B] font-sans font-medium">
                  {companyInfo.companyType} &bull; Bhadohi 221301 U.P. (India)
                </p>
              </div>

              {/* Telephone */}
              <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#55694A] uppercase tracking-wider">
                  <Phone className="w-4 h-4 text-[#55694A]" />
                  <span>Direct Helplines</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href={`tel:${companyInfo.phone1}`}
                    className="inline-flex items-center gap-2 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 {companyInfo.phone1}</span>
                  </a>
                  <a
                    href={`tel:${companyInfo.phone2}`}
                    className="inline-flex items-center gap-2 bg-[#FAF7F0] hover:bg-[#E5DCB8] text-[#362B21] border border-[#DACDB3] px-4 py-2.5 rounded-lg text-xs font-sans font-bold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+91 {companyInfo.phone2}</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp Direct */}
              <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#55694A] uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Concierge</span>
                </div>
                <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                  For quick floorplan sizing, live carpet photos, or bespoke loom questions:
                </p>
                <a
                  href={`https://wa.me/${companyInfo.whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-lg text-xs font-sans font-bold transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>

              {/* Email & Instagram */}
              <div className="p-5 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#55694A] uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#55694A]" />
                  <span>Email & Social</span>
                </div>
                <div className="space-y-1.5 text-xs text-[#362B21]">
                  <p>
                    <span className="text-[#4E3C2B] font-medium">Official Inquiries:</span>{' '}
                    <a href={`mailto:${companyInfo.email}`} className="font-mono text-[#55694A] hover:underline font-bold">
                      {companyInfo.email}
                    </a>
                  </p>
                  <p>
                    <span className="text-[#4E3C2B] font-medium">Instagram:</span>{' '}
                    <a
                      href={companyInfo.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#55694A] hover:underline font-bold"
                    >
                      {companyInfo.instagramHandle}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#FAF7F0] p-8 sm:p-10 md:p-12 rounded-3xl border border-[#DACDB3] shadow-md space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block mb-1">
                ONLINE INQUIRY
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#362B21] font-light">
                Send a Message to Our Team
              </h2>
              <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed mt-1">
                Fill in the details below. We respond within 24 business hours.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-[#EFE8D8] border border-[#55694A]/40 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#55694A] mx-auto" />
                <h3 className="font-serif text-2xl text-[#362B21] font-medium">Inquiry Received</h3>
                <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans max-w-md mx-auto leading-relaxed">
                  Thank you for contacting House of Loom & Craft. A representative will review your message and connect with you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs uppercase tracking-widest text-[#55694A] font-bold underline pt-2 inline-block font-sans"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans font-bold uppercase tracking-wider text-[#362B21]">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sivam Pandey"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl px-4 py-3 text-xs text-[#362B21] placeholder:text-[#4E3C2B]/50 focus:border-[#55694A] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans font-bold uppercase tracking-wider text-[#362B21]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl px-4 py-3 text-xs text-[#362B21] placeholder:text-[#4E3C2B]/50 focus:border-[#55694A] focus:outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-sans font-bold uppercase tracking-wider text-[#362B21]">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 9839116625"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl px-4 py-3 text-xs text-[#362B21] placeholder:text-[#4E3C2B]/50 focus:border-[#55694A] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-sans font-bold uppercase tracking-wider text-[#362B21]">
                      Inquiry Purpose
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                      className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl px-4 py-3 text-xs text-[#362B21] focus:border-[#55694A] focus:outline-none font-sans"
                    >
                      <option value="Custom Rug Commission">Custom Rug Commission</option>
                      <option value="Trade & Interior Design">Trade & Interior Design Inquiry</option>
                      <option value="Home Decor Inquiry">Home Decor & Accents</option>
                      <option value="Existing Order Status">Existing Order Status</option>
                      <option value="General Question">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-bold uppercase tracking-wider text-[#362B21]">
                    Message / Specifications *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us about your spatial dimensions, rug preferences, or questions..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#EFE8D8] border border-[#DACDB3] rounded-xl px-4 py-3 text-xs text-[#362B21] placeholder:text-[#4E3C2B]/50 focus:border-[#55694A] focus:outline-none font-sans resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] font-sans font-bold py-4 px-6 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 shadow-md flex items-center justify-center gap-2"
                >
                  <span>{submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
