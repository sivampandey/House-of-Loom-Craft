import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';

export default function RoomTransformation() {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <section className="py-24 md:py-32 bg-palette-creamSoft text-palette-deepBrown relative overflow-hidden border-t border-palette-creamBorder">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[2px] bg-palette-olive" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-palette-olive font-sans font-medium">
              SPATIAL ALCHEMY
            </span>
            <span className="w-8 h-[2px] bg-palette-olive" />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-palette-deepBrown font-light">
            Room Transformation
          </h2>

          <p className="font-sans text-sm md:text-base text-palette-brownMuted font-light leading-relaxed">
            Drag the vertical divider to witness how an authentic hand-knotted heirloom introduces acoustic depth, visual warmth, and foundational harmony to contemporary architecture.
          </p>
        </div>

        {/* Interactive Comparison Stage */}
        <div 
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-[16/9] max-h-[640px] rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize border border-palette-creamBorder group"
        >
          {/* AFTER Image (Full background layer - WITH CARPET) */}
          <img
            src="/images/room-after.jpg"
            alt="Living room with luxury hand-knotted carpet"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          />

          {/* Right Label (WITH CARPET) */}
          <div className="absolute top-6 right-6 z-20 bg-palette-oliveDark/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-palette-oliveLight/30 text-[11px] uppercase tracking-widest text-palette-cream font-sans font-medium flex items-center gap-2 pointer-events-none shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-palette-lightBrown" />
            <span>WITH CARPET</span>
          </div>

          {/* BEFORE Image (Clipped layer - WITHOUT CARPET) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src="/images/room-before.jpg"
              alt="Living room without carpet"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none max-w-none"
              style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
            />
            
            {/* Left Label (WITHOUT CARPET) */}
            <div className="absolute top-6 left-6 z-20 bg-palette-oliveDeep/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-palette-creamBorder/20 text-[11px] uppercase tracking-widest text-palette-creamWarm font-sans font-medium pointer-events-none shadow-lg">
              WITHOUT CARPET
            </div>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div
            className="absolute top-0 bottom-0 z-30 w-[2px] bg-palette-cream pointer-events-none transition-shadow group-hover:shadow-[0_0_15px_rgba(250,247,240,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Handle Knob in Olive Green & Cream */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-palette-olive border-2 border-palette-cream text-palette-cream shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
              <MoveHorizontal className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Range Slider for Accessible / Mobile Control */}
        <div className="mt-8 max-w-md mx-auto flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-wider text-palette-brownMuted font-sans">Bare Space</span>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="w-full luxury-slider"
            aria-label="Room Transformation Slider"
          />
          <span className="text-[11px] uppercase tracking-wider text-palette-olive font-sans font-medium">Grounded</span>
        </div>
      </div>
    </section>
  );
}
