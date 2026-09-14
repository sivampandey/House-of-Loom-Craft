import React, { useRef, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero({ onExploreClick, onStoryClick }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.defaultMuted = true;
      
      const startVideo = () => {
        video.play().catch(() => {});
      };

      video.addEventListener('canplay', startVideo);
      startVideo();

      return () => {
        video.removeEventListener('canplay', startVideo);
      };
    }
  }, []);

  return (
    <section id="hero" className="relative min-h-[100svh] h-[100dvh] w-full overflow-hidden bg-[#45563D] flex items-center">
      {/* High-Performance Smooth Video 1 Background - Always Running */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/room-after.jpg"
          className="w-full h-full object-cover object-[center_62%] sm:object-[center_50%] md:object-[center_42%] lg:object-center transition-all duration-700"
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <source src="/videos/hero-carpet.mp4" type="video/mp4" />
        </video>

        {/* Cinematic Atmospheric Vignette - Preserves Video Brilliance & Carpet Detail while Guaranteeing Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2F3A2A]/85 via-[#2F3A2A]/40 to-[#2F3A2A]/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#273223]/90 via-transparent to-[#273223]/35 pointer-events-none" />
      </div>

      {/* Hero Content with Light Olive Green, Cream and Light Brown Accents */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full pt-20 sm:pt-24 md:pt-16 pb-12 sm:pb-8">
        <div className="max-w-2xl space-y-5 sm:space-y-6 md:space-y-8">
          {/* Main Heading */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-[#FAF7F0] font-light leading-[1.12] sm:leading-[1.08] tracking-tight">
            Where Tradition Meets <br />
            <span className="italic font-normal text-[#D4BC9F] font-serif">Timeless Design</span>
          </h1>

          {/* Description */}
          <p className="font-sans text-xs sm:text-base md:text-lg text-[#FAF7F0]/95 max-w-xl font-normal sm:font-medium leading-relaxed drop-shadow-sm">
            Discover handcrafted carpets and refined home decor designed to bring warmth, character and timeless beauty into your space.
          </p>

          {/* CTAs with Light Olive Green, Cream, and Light Brown Palette */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-6">
            <button
              onClick={onExploreClick}
              className="bg-[#5D7053] hover:bg-[#6D8262] active:scale-[0.98] text-[#FAF7F0] font-sans font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl border border-[#85997A]/60 min-h-[48px]"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={onStoryClick}
              className="border border-[#D4BC9F] hover:border-[#FAF7F0] active:scale-[0.98] text-[#FAF7F0] hover:text-[#FAF7F0] font-sans font-bold px-7 sm:px-8 py-3.5 sm:py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-sm hover:bg-[#5D7053]/30 min-h-[48px] flex items-center justify-center"
            >
              Our Story
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-5 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 sm:gap-3 pointer-events-none">
        <span className="text-[8.5px] sm:text-[9px] uppercase tracking-[0.35em] text-[#D4BC9F] font-sans font-bold drop-shadow">
          SCROLL TO EXPLORE
        </span>
        <div className="w-[2px] h-8 sm:h-10 bg-[#FAF7F0]/25 relative overflow-hidden rounded-full">
          <div className="w-full h-1/2 bg-[#D4BC9F] absolute top-0 animate-pulse-slow" />
        </div>
      </div>
    </section>
  );
}
