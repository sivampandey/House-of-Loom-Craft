import React from 'react';

export default function TransitionSection() {
  return (
    <section className="relative py-28 md:py-36 bg-[#EFE8DC] text-[#362B21] overflow-hidden border-b border-[#DACDB3]/60">
      {/* Subtle architectural grid lines in warm brown */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#362b2108_1px,transparent_1px),linear-gradient(to_bottom,#362b2108_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center relative z-10 space-y-6">
        <div className="inline-flex items-center gap-3">
          <span className="w-10 h-[2px] bg-[#BA9977]" />
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#8F6E50] font-sans font-semibold">
            HANDCRAFTED PROVENANCE
          </span>
          <span className="w-10 h-[2px] bg-[#BA9977]" />
        </div>

        <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#362B21] font-light leading-tight tracking-wide">
          From the Master Loom <br className="hidden sm:inline" />
          <span className="italic text-[#8F6E50] font-normal">To Architectural Sanctuary</span>
        </h2>

        <p className="font-sans text-sm sm:text-base text-[#544131]/85 max-w-2xl mx-auto leading-relaxed font-normal">
          Every knot is an intentional dialogue between ancient Indian textile lineage and contemporary minimalist interiors. Enter our digital showroom gallery.
        </p>

        {/* Ambient numbers/stats */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#DACDB3]/80 max-w-3xl mx-auto text-left">
          <div>
            <span className="font-serif text-3xl md:text-4xl text-[#8F6E50] font-light block">500+</span>
            <span className="text-[10px] uppercase tracking-wider text-[#544131]/75 font-sans mt-1 block font-medium">Years of Weaving Lineage</span>
          </div>
          <div>
            <span className="font-serif text-3xl md:text-4xl text-[#8F6E50] font-light block">420</span>
            <span className="text-[10px] uppercase tracking-wider text-[#544131]/75 font-sans mt-1 block font-medium">Knots Per Square Inch</span>
          </div>
          <div>
            <span className="font-serif text-3xl md:text-4xl text-[#8F6E50] font-light block">100%</span>
            <span className="text-[10px] uppercase tracking-wider text-[#544131]/75 font-sans mt-1 block font-medium">High-Plateau Virgin Wool</span>
          </div>
          <div>
            <span className="font-serif text-3xl md:text-4xl text-[#8F6E50] font-light block">9-14</span>
            <span className="text-[10px] uppercase tracking-wider text-[#544131]/75 font-sans mt-1 block font-medium">Months Per Heirloom</span>
          </div>
        </div>
      </div>
    </section>
  );
}
