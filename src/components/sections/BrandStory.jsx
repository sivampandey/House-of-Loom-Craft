import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function BrandStory({ onOpenConsultation }) {
  return (
    <section className="relative py-28 md:py-40 bg-[#FAF7F0] text-[#362B21] overflow-hidden border-t border-[#DACDB3]/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Narrative (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#BA9977]" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#8F6E50] font-sans font-semibold">
                OUR STORY & PHILOSOPHY
              </span>
            </div>

            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-[1.12]">
              Rooted in Craft. <br />
              <span className="italic text-[#8F6E50] font-normal">Made for Modern Living.</span>
            </h2>

            <div className="space-y-4 font-sans text-sm md:text-base text-[#544131]/85 font-normal leading-relaxed max-w-xl">
              <p>
                Founded on the belief that a true luxury carpet is an architectural anchor, House of Loom & Craft bridges five centuries of northern Indian hand-weaving genius with the serene discipline of international modernist spaces.
              </p>
              <p>
                We do not manufacture rugs; we cultivate generational relationships with master knotters in Bhadohi, Mirzapur, and Kashmir. Each piece is an unrepeatable dialogue between pure unbleached mountain fleece, river-washed silk, and mineral botanicals.
              </p>
            </div>

            {/* Core Values Pillars */}
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#DACDB3]">
              <div>
                <span className="font-serif text-xl text-[#8F6E50] block mb-1 font-medium">Preservation of Lineage</span>
                <p className="text-xs text-[#544131]/80 font-sans leading-relaxed">
                  Honoring the ancient Talim musical notation scripts and generational master weavers.
                </p>
              </div>
              <div>
                <span className="font-serif text-xl text-[#8F6E50] block mb-1 font-medium">Circular Pure Materials</span>
                <p className="text-xs text-[#544131]/80 font-sans leading-relaxed">
                  Zero petrochemical plastics or toxic backings — 100% biodegradable natural wool, cotton, and silk.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenConsultation}
                className="bg-[#BA9977] hover:bg-[#A38361] text-[#FAF7F0] font-sans font-semibold px-8 py-3.5 rounded text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group shadow-xl border border-[#D4BC9F]"
              >
                <span>Commission an Heirloom</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Dual Images Showcase (5 cols) */}
          <div className="lg:col-span-5 relative pb-8 sm:pb-10">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-[#DACDB3] aspect-[4/3] bg-[#EFE8DC]">
              <img
                src="/images/craft-weaving.jpg"
                alt="Artisan at traditional vertical carpet loom"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="hidden sm:block absolute -bottom-4 sm:-bottom-6 left-2 sm:-left-4 md:-left-6 lg:-left-8 w-1/2 sm:w-[55%] rounded-xl overflow-hidden shadow-2xl border border-[#DACDB3] aspect-square bg-[#EFE8DC]">
              <img
                src="/images/craft-yarn.jpg"
                alt="Sunlit naturally dyed yarn skeins"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
