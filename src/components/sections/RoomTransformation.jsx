import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sparkles, MoveHorizontal } from 'lucide-react';

export default function RoomTransformation() {
  const [sliderPos, setSliderPos] = useState(50);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);

  // Synchronize container width on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();

    const ro = new ResizeObserver(updateWidth);
    ro.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

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
    <section className="py-24 md:py-32 bg-[#EDE6D6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#6D7F62]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-medium">
              SPATIAL ALCHEMY
            </span>
            <span className="w-8 h-[2px] bg-[#6D7F62]" />
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
            Room Transformation
          </h2>

          <p className="font-sans text-xs sm:text-sm md:text-base text-[#4E3C2B] font-normal leading-relaxed">
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
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] min-h-[300px] sm:min-h-[420px] max-h-[640px] rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize border border-[#DACDB3] group"
        >
          {/* AFTER Image (Full background layer - WITH CARPET) */}
          <img
            src="/images/room-after.jpg"
            alt="Living room with luxury hand-knotted carpet"
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            loading="lazy"
            decoding="async"
          />

          {/* Right Label (WITH CARPET) */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 bg-[#3F4F36]/90 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-[#85977A]/30 text-[10px] sm:text-[11px] uppercase tracking-widest text-[#FAF7F0] font-sans font-medium flex items-center gap-1.5 sm:gap-2 pointer-events-none shadow-lg">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#BA9977]" />
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
              style={{ width: containerWidth > 0 ? `${containerWidth}px` : '100%' }}
              loading="lazy"
              decoding="async"
            />
            
            {/* Left Label (WITHOUT CARPET) */}
            <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 bg-[#4C5D41]/85 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-[#DACDB3]/20 text-[10px] sm:text-[11px] uppercase tracking-widest text-[#FAF7F0] font-sans font-medium pointer-events-none shadow-lg">
              WITHOUT CARPET
            </div>
          </div>

          {/* Draggable Divider Line & Knob */}
          <div
            className="absolute top-0 bottom-0 z-30 w-[2px] bg-[#FAF7F0] pointer-events-none transition-shadow group-hover:shadow-[0_0_15px_rgba(250,247,240,0.8)]"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Handle Knob in Olive Green & Cream */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-[#6D7F62] border-2 border-[#FAF7F0] text-[#FAF7F0] shadow-2xl flex items-center justify-center pointer-events-auto cursor-ew-resize hover:scale-110 transition-transform">
              <MoveHorizontal className="w-4 sm:w-5 h-4 sm:h-5" />
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
