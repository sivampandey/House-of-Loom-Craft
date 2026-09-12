import React from 'react';
import { Sparkles, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

export default function CustomCarpetCTA({ onOpenConsultation }) {
  return (
    <section id="consultation" className="relative py-28 md:py-36 bg-[#2B3726] text-[#FAF7F0] overflow-hidden">
      {/* Background Image with Deep Olive Contrast Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/bespoke-atelier.jpg"
          alt="Bespoke luxury carpet design studio"
          className="w-full h-full object-cover object-center scale-[1.02] filter brightness-50 opacity-35"
        />
        {/* Multilayer Olive Gradient Overlays for Crystal Clear Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2B3726]/95 via-[#1E271B]/85 to-[#2B3726]/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E271B]/80 via-transparent to-[#1E271B]/80" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center space-y-8">
        {/* Service Badge */}
        <div className="inline-flex items-center gap-2.5 bg-[#3B4A34]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#D4BC9F]/50 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#FAF7F0] font-sans font-semibold">
            BESPOKE ARCHITECTURAL SERVICE
          </span>
        </div>

        {/* Main Heading - Crystal Clear Luminous Cream with Contrast Shadow */}
        <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl text-[#FAF7F0] font-light leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]">
          Made for Your Space.
        </h2>

        {/* Subtitle - High Readability Luminous Cream */}
        <p className="font-sans text-base sm:text-lg md:text-xl text-[#FAF7F0] max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
          Looking for a specific size, pattern or design? Work with our team to create something that feels uniquely yours.
        </p>

        {/* High-Contrast Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={onOpenConsultation}
            className="w-full sm:w-auto bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-semibold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl border border-[#85977A]"
          >
            <Calendar className="w-4 h-4 text-[#FAF7F0]" />
            <span>Request a Consultation</span>
            <ArrowRight className="w-4 h-4 text-[#FAF7F0] group-hover:translate-x-1.5 transition-transform" />
          </button>

          <button
            onClick={onOpenConsultation}
            className="w-full sm:w-auto bg-[#2E3B29]/90 hover:bg-[#384832] border-2 border-[#D4BC9F] text-[#FAF7F0] hover:text-[#FAF7F0] font-sans font-semibold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-md flex items-center justify-center gap-2 shadow-2xl"
          >
            <MessageSquare className="w-4 h-4 text-[#D4BC9F]" />
            <span>Talk to an Expert</span>
          </button>
        </div>

        {/* Micro Guarantee Points */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-[#D4BC9F] font-sans font-semibold drop-shadow-sm">
          <span>&bull; Hand-dyed wool pom swatches delivered</span>
          <span>&bull; Scale 2D/3D architectural CAD renderings</span>
          <span>&bull; Direct loom progress video updates</span>
        </div>
      </div>
    </section>
  );
}
