import React, { useState } from 'react';
import { Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

export default function TextureExperience() {
  const [zoomLevel, setZoomLevel] = useState(1);

  const toggleZoom = () => {
    setZoomLevel(prev => prev === 1 ? 1.4 : 1);
  };

  return (
    <section className="relative h-[80vh] min-h-[580px] w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Background Macro Image with Natural Colors (Color Tint Removed) */}
      <div 
        onClick={toggleZoom}
        className="absolute inset-0 cursor-zoom-in overflow-hidden"
        title="Click to zoom fiber details"
      >
        <img
          src="/images/carpet-macro.jpg"
          alt="Macro carpet fiber details"
          className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        />
        {/* Clean Neutral Scrim for text visibility without any green or color tint */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-black/55" />
      </div>

      {/* Floating Editorial Narrative */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6 pointer-events-none">
        <div className="inline-flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#FAF7F0] font-sans font-semibold">
            MACRO TACTILE STUDY
          </span>
        </div>

        <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white font-light tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          Every Thread Has a Story.
        </h2>

        <p className="font-sans text-sm sm:text-base md:text-lg text-white/95 max-w-xl mx-auto font-light leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Carefully selected materials, skilled hands and timeless techniques come together in every piece.
        </p>

        {/* Micro Interaction Cue */}
        <div className="pt-4 pointer-events-auto">
          <button
            onClick={toggleZoom}
            className="inline-flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/40 hover:border-white text-white hover:text-[#D4BC9F] px-5 py-2.5 rounded-full text-xs uppercase tracking-widest font-sans transition-all duration-300 shadow-xl"
          >
            {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
            <span>{zoomLevel === 1 ? 'Inspect Macro Fibers (1.4x)' : 'Reset Scale'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
