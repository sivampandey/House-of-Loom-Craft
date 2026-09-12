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
    <section id="hero" className="relative h-screen w-full overflow-hidden bg-[#45563D] flex items-center">
      {/* High-Performance Smooth Video 1 Background - Always Running */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/room-after.jpg"
          className="w-full h-full object-cover object-center"
          style={{
            transform: 'translate3d(0, 0, 0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
          }}
        >
          <source src="/videos/hero-carpet.mp4" type="video/mp4" />
        </video>

        {/* Light Olive, Cream & Light Brown tinted cinematic atmospheric vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#384632]/85 via-[#384632]/45 to-[#384632]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#384632]/90 via-transparent to-[#384632]/30" />
      </div>

      {/* Hero Content with Light Olive Green, Cream and Light Brown Accents */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full pt-16">
        <div className="max-w-2xl space-y-6 md:space-y-8">
          {/* Main Heading */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl lg:text-8xl text-[#FAF7F0] font-light leading-[1.08] tracking-tight">
            Where Tradition Meets <br />
            <span className="italic font-normal text-[#D4BC9F] font-serif">Timeless Design</span>
          </h1>

          {/* Description */}
          <p className="font-sans text-sm sm:text-base md:text-lg text-[#FAF7F0]/90 max-w-xl font-medium leading-relaxed">
            Discover handcrafted carpets and refined home decor designed to bring warmth, character and timeless beauty into your space.
          </p>

          {/* CTAs with Light Olive Green, Cream, and Light Brown Palette */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
            <button
              onClick={onExploreClick}
              className="bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl border border-[#85997A]/60"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </button>

            <button
              onClick={onStoryClick}
              className="border border-[#D4BC9F] hover:border-[#FAF7F0] text-[#FAF7F0] hover:text-[#FAF7F0] font-sans font-bold px-8 py-4 rounded text-xs uppercase tracking-[0.2em] transition-all duration-300 backdrop-blur-sm hover:bg-[#5D7053]/30"
            >
              Our Story
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3">
        <span className="text-[9px] uppercase tracking-[0.35em] text-[#D4BC9F] font-sans font-bold">
          SCROLL TO EXPLORE
        </span>
        <div className="w-[2px] h-10 bg-[#FAF7F0]/25 relative overflow-hidden rounded-full">
          <div className="w-full h-1/2 bg-[#D4BC9F] absolute top-0 animate-pulse-slow" />
        </div>
      </div>
    </section>
  );
}
