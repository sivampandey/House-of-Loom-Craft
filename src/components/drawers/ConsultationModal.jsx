import React, { useState } from 'react';
import { X, CheckCircle2, ArrowRight, Compass, Ruler, Palette } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ConsultationModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomType: 'Grand Living Room',
    shape: 'Rectangular',
    estimatedSize: '10\' x 14\'',
    preferredPalette: 'Olive Green & Rich Cream',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4E5D46', '#FAF7F0', '#B39274', '#7D5F43']
      });
    } catch (e) {}
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
      <div 
        onClick={handleClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-2xl bg-[#45553C] text-[#FAF7F0] rounded-2xl border border-[#6D7F62] shadow-2xl overflow-hidden z-10 my-auto">
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#3C4A34] text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors border border-[#6D7F62]"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="p-10 md:p-14 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#5D7053] border border-[#85997A] mx-auto flex items-center justify-center text-[#FAF7F0]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-3xl text-[#FAF7F0] font-light">Consultation Request Received</h3>
            <p className="text-sm font-sans text-[#FAF7F0]/90 max-w-md mx-auto leading-relaxed font-normal">
              Our Head Atelier Director will review your architectural specifications and contact you within 24 hours. A complimentary yarn pom box and custom design sketches will be prepared for you.
            </p>
            <div className="p-4 bg-[#3C4A34] rounded border border-[#6D7F62]/50 text-xs text-[#D4BC9F] max-w-sm mx-auto font-medium">
              Reference: <span className="font-mono text-[#FAF7F0]">ATELIER-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
            <button
              onClick={handleClose}
              className="bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold px-8 py-3 rounded text-xs uppercase tracking-widest transition-colors border border-[#85997A]/60"
            >
              Return to Showroom
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#D4BC9F] block mb-1 font-bold">
                Bespoke Atelier Service
              </span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#FAF7F0] font-light">
                Made for Your Space
              </h3>
              <p className="text-xs font-sans text-[#FAF7F0]/80 mt-2 leading-relaxed font-medium">
                Work directly with our master weavers to customize scale, dye formulas, pile height, and knot density to harmonize with your architectural vision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 font-bold">
                  Your Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="Lord / Lady / Architect"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 font-bold">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  placeholder="client@residence.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 flex items-center gap-1 font-bold">
                  <Compass className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  Room Setting
                </label>
                <select
                  value={formData.roomType}
                  onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                  className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-3 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                >
                  <option>Grand Living Room</option>
                  <option>Master Suite</option>
                  <option>Dining Salon</option>
                  <option>Double-Height Foyer</option>
                  <option>Executive Library</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 flex items-center gap-1 font-bold">
                  <Ruler className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  Approx. Size
                </label>
                <select
                  value={formData.estimatedSize}
                  onChange={e => setFormData({ ...formData, estimatedSize: e.target.value })}
                  className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-3 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                >
                  <option>8' x 10' (240 x 300 cm)</option>
                  <option>9' x 12' (275 x 365 cm)</option>
                  <option>10' x 14' (305 x 425 cm)</option>
                  <option>12' x 18' (365 x 550 cm)</option>
                  <option>Custom Architectural Scale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 flex items-center gap-1 font-bold">
                  <Palette className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  Palette
                </label>
                <select
                  value={formData.preferredPalette}
                  onChange={e => setFormData({ ...formData, preferredPalette: e.target.value })}
                  className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-3 py-2.5 text-xs text-[#FAF7F0] focus:border-[#D4BC9F] focus:outline-none"
                >
                  <option>Light Olive Green & Rich Cream</option>
                  <option>Light Brown & Sand Ivory</option>
                  <option>Light Olive & Warm Camel</option>
                  <option>Undyed Himalayan Fleece</option>
                  <option>Warm Ochre & Light Olive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D4BC9F] mb-1.5 font-bold">
                Architectural Notes or Material Desires
              </label>
              <textarea
                rows={3}
                placeholder="Share any specific room finishes (e.g. travertine floors, cedar ceilings) or timeline requirements..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-[#3C4A34] border border-[#6D7F62]/50 rounded px-4 py-2.5 text-xs text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#D4BC9F] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-4 px-6 rounded text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group shadow-xl border border-[#85997A]/60"
              >
                <span>Request Private Consultation & Swatches</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="pt-2 border-t border-[#6D7F62]/40 text-center space-y-1 text-[11px] text-[#D4BC9F]">
              <p>
                Direct Bhadohi Atelier Helplines: <a href="tel:9839116625" className="underline font-bold text-[#FAF7F0]">9839116625</a>, <a href="tel:7007879491" className="underline font-bold text-[#FAF7F0]">7007879491</a>
              </p>
              <p className="text-[#FAF7F0]/70">
                POTTERY RUGS & HOME DECOR &bull; G.T. ROAD, GHOSIA, AURAI, BHADOHI 221301 U.P. (INDIA)
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
