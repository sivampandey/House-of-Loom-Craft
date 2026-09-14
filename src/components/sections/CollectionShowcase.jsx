import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CollectionShowcase({ onSelectCategory, onExploreAll }) {
  const [activeCategory, setActiveCategory] = useState('hand-knotted');
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVideoLoaded(true);
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const categories = [
    {
      id: 'hand-tufted',
      title: 'HAND TUFTED RUGS',
      sub: 'Architectural sculpted high-low pile',
      density: 'Sculpted High-Low Relief',
      focusText: 'Dense virgin wool sheared at staggered heights to sculpt tactile 3D landscapes underfoot in Bhadohi.',
      highlightColor: '#B39274'
    },
    {
      id: 'hand-knotted',
      title: 'HAND KNOTTED RUGS',
      sub: 'Individual knots tied by hand',
      density: '350 - 500 Knots/sq. in',
      focusText: 'Master weavers spend up to 14 months interlocking single silk and wool threads over vertical master looms.',
      highlightColor: '#4E5D46'
    },
    {
      id: 'hand-woven',
      title: 'HAND WOVEN RUGS',
      sub: 'Artisanal organic flatweaves & kilims',
      density: 'Interlocking Slit Weave',
      focusText: 'Naturally dyed sheep wool woven on horizontal pit looms with reversible geometric symmetry.',
      highlightColor: '#8F6E50'
    },
    {
      id: 'handloom',
      title: 'HANDLOOM RUGS',
      sub: 'Pure textured wool & silk weaves',
      density: 'Master Handloom Construction',
      focusText: 'Pure handloom textures crafted with organic yarn lots, perfect for durable high-traffic living spaces.',
      highlightColor: '#687A5E'
    },
    {
      id: 'custom',
      title: 'CUSTOM RUGS',
      sub: 'Tailored architectural scale & palettes',
      density: 'Bespoke Custom Density',
      focusText: 'Commission bespoke scale, custom pantone dyes, and unique pile profiles directly with our atelier.',
      highlightColor: '#7A5E44'
    },
    {
      id: 'special-shape',
      title: 'SPECIAL SHAPE RUGS',
      sub: 'Curvilinear, arch & organic silhouettes',
      density: 'Hand-Carved Custom Profiles',
      focusText: 'Organic curvilinear boundaries and arch designs sculpted by hand to harmonize with modernist architectural spaces.',
      highlightColor: '#CBB49E'
    }
  ];

  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <section id="collections" className="py-24 md:py-32 bg-[#FAF7F0] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#DACDB3]/70">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#BA9977]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8F6E50] font-sans font-semibold">
                THE DIGITAL SHOWROOM
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              Explore Our Collections
            </h2>
          </div>

          <p className="font-sans text-sm md:text-base text-[#544131]/80 max-w-md font-normal leading-relaxed">
            From timeless traditional patterns to contemporary expressions, discover carpets crafted to transform the atmosphere of your space.
          </p>
        </div>

        {/* Video 2 Showroom Experience Container */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Video 2 Section (7 columns on desktop) */}
          <div 
            ref={containerRef}
            className="lg:col-span-7 relative rounded-2xl overflow-hidden shadow-2xl border border-[#DACDB3] group bg-[#EFE8DC] min-h-[340px] sm:min-h-[440px] md:min-h-[520px] aspect-[4/3] sm:aspect-[16/10] md:aspect-auto card-hover-lift"
          >
            {isVideoLoaded ? (
              <video
                ref={videoRef}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster="/images/room-after.jpg"
                className="w-full h-full object-cover object-center"
                style={{
                  transform: 'translate3d(0, 0, 0)',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                }}
              >
                <source src="/videos/showroom-collection.mp4" type="video/mp4" />
              </video>
            ) : (
              <img
                src="/images/room-after.jpg"
                alt="Pottery Rugs Showroom Collection"
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            )}

            {/* Video overlay badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#261E16]/90 via-[#261E16]/30 to-transparent pointer-events-none" />
            
            <div className="absolute top-5 sm:top-6 left-5 sm:left-6 flex items-center gap-2 bg-[#FAF7F0]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#DACDB3] text-xs text-[#362B21] shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#8F6E50]" />
              <span className="uppercase tracking-wider text-[10px] font-sans font-semibold">Atelier Live Gallery</span>
            </div>

            <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#D4BC9F] block font-semibold">
                  Current Spotlight
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#FAF7F0] mt-1 font-light">
                  {currentCategory.title}
                </h3>
                <p className="text-xs text-[#FAF7F0]/85 max-w-md mt-1 hidden sm:block">
                  {currentCategory.focusText}
                </p>
              </div>

              <button
                onClick={() => onSelectCategory(activeCategory)}
                className="inline-flex self-start sm:self-auto items-center gap-2 bg-[#BA9977] hover:bg-[#A38361] text-[#FAF7F0] font-medium text-xs uppercase tracking-wider px-4 py-2.5 rounded transition-colors flex-shrink-0 border border-[#D4BC9F]/60 shadow-lg min-h-[40px]"
              >
                <span>View Pieces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Editorial Category Selector (5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-2">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#8F6E50] mb-2 block font-sans font-semibold">
              Select Category To Inspect
            </span>

            <div className="space-y-2">
              {categories.map((cat, idx) => {
                const isActive = activeCategory === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    className={`p-4 md:p-5 rounded-xl border transition-all duration-300 cursor-pointer group relative ${
                      isActive
                        ? 'bg-[#E8DFD1] border-[#BA9977] shadow-xl translate-x-2 scale-[1.02]'
                        : 'bg-[#EFE8DC]/50 border-[#DACDB3]/60 hover:border-[#BA9977]/60 hover:bg-[#EFE8DC] hover:translate-x-1.5 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className={`text-[10px] font-mono font-bold transition-colors ${
                          isActive ? 'text-[#8F6E50]' : 'text-[#8F6E50]/60 group-hover:text-[#8F6E50]'
                        }`}>
                          0{idx + 1}
                        </span>
                        <h4 className={`font-serif text-lg sm:text-xl md:text-2xl transition-all duration-200 ${
                          isActive
                            ? 'text-[#362B21] font-medium tracking-wide'
                            : 'text-[#544131]/80 group-hover:text-[#362B21] group-hover:translate-x-1'
                        }`}>
                          {cat.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wider hidden sm:inline ${
                          isActive ? 'text-[#8F6E50] font-semibold' : 'text-transparent group-hover:text-[#8F6E50]/70'
                        }`}>
                          {cat.density}
                        </span>
                        <ArrowRight className={`w-4 h-4 transition-all duration-300 ${
                          isActive 
                            ? 'text-[#8F6E50] translate-x-1 opacity-100' 
                            : 'text-[#8F6E50]/40 opacity-0 group-hover:opacity-100 group-hover:text-[#8F6E50]'
                        }`} />
                      </div>
                    </div>

                    {isActive && (
                      <div className="mt-2.5 pt-2.5 border-t border-[#DACDB3] flex items-center justify-between animate-fade-in text-xs">
                        <span className="text-[#544131] text-[11px] font-sans">{cat.sub}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCategory(cat.id);
                          }}
                          className="text-[10px] uppercase tracking-widest text-[#8F6E50] font-bold hover:underline flex items-center gap-1 font-sans"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
