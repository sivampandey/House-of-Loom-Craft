import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA({ onExploreCollection, onContactUs }) {
  return (
    <section className="relative py-32 md:py-44 bg-black overflow-hidden flex items-center justify-center">
      {/* Background Natural Image with Clean Neutral Scrim (No Muddy Color Tint) */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/journal-penthouse.jpg"
          alt="Tranquil luxury bedroom with bespoke carpet"
          className="w-full h-full object-cover object-center scale-105"
        />
        {/* Clean Neutral Scrim for clear text visibility without color tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/55" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
        <div className="inline-flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#D4BC9F]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-white font-sans font-semibold">
            CRAFT & HERITAGE
          </span>
        </div>

        <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-white font-light leading-[1.08] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Bring Home <br />
          <span className="italic text-[#E5D4BE] font-normal font-serif">Something Timeless.</span>
        </h2>

        <p className="font-sans text-base sm:text-lg md:text-xl text-white/95 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Explore handcrafted carpets and home decor created to become part of your story.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={onExploreCollection}
            className="w-full sm:w-auto bg-[#BA9977] hover:bg-[#A38361] text-white font-sans font-semibold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl border border-[#D4BC9F]"
          >
            <span>Explore Collection</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
          </button>

          <button
            onClick={onContactUs}
            className="w-full sm:w-auto bg-black/40 hover:bg-black/60 backdrop-blur-sm border-2 border-white/60 hover:border-white text-white font-sans font-semibold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-2xl"
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}
