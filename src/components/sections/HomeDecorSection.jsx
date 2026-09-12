import React, { useState } from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { decorProducts } from '../../data/decor';

export default function HomeDecorSection({ onAddToCart, onQuickView }) {
  const [selectedCategory, setSelectedCategory] = useState('All Decor');

  const filtered = selectedCategory === 'All Decor'
    ? decorProducts
    : decorProducts.filter(p => p.category === selectedCategory);

  return (
    <section id="home-decor" className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                ARCHITECTURAL ACCENTS
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              Complete the Space.
            </h2>
          </div>

          <p className="font-sans text-sm md:text-base text-[#4E3C2B] max-w-md font-medium leading-relaxed">
            Thoughtfully selected pieces that bring warmth, texture and character beyond the floor.
          </p>
        </div>

        {/* Editorial Layout */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Large Atmospheric Interior Still Life (5 cols) */}
          <div className="lg:col-span-5 sticky top-28 space-y-6">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#DACDB3] relative group bg-[#EFE8D8]">
              <img
                src="/images/decor-editorial.jpg"
                alt="Atmospheric luxury home decor styling"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#45563D]/90 via-[#45563D]/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-[#FAF7F0]">
                <span className="text-xs uppercase tracking-widest text-[#D4BC9F] font-sans font-bold block mb-1">
                  ATELIER EDITORIAL
                </span>
                <h3 className="font-serif text-2xl font-light">
                  The Tactile Dimension
                </h3>
                <p className="text-xs text-[#FAF7F0]/90 mt-1 font-sans">
                  Embroidered linen, beaten brass, and unbleached bouclé curated for quiet contemplative rooms.
                </p>
              </div>
            </div>

            {/* Curated Note in Olive Green */}
            <div className="p-6 rounded-xl bg-[#E2D8C3] border border-[#DACDB3] space-y-2">
              <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold">
                Ethical Craftsmanship
              </span>
              <p className="text-xs text-[#4E3C2B] font-sans font-medium leading-relaxed">
                Every cushion, urn, and throw is produced in micro-batches by multi-generational craft families across Rajasthan, Kashmir, and Uttar Pradesh.
              </p>
            </div>
          </div>

          {/* Right Column: Editorial Product Assemblage (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className={`group bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 flex flex-col justify-between shadow-md card-hover-lift cursor-pointer ${
                  idx === 0 ? 'sm:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
                      {item.category}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#55694A] text-[#FAF7F0] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div 
                    onClick={() => onQuickView(item)}
                    className="overflow-hidden rounded-xl bg-[#E2D8C3] my-3 cursor-pointer p-3 flex items-center justify-center min-h-[160px]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-h-44 w-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <h4 
                    onClick={() => onQuickView(item)}
                    className="font-serif text-xl text-[#362B21] hover:text-[#55694A] cursor-pointer transition-colors mt-2 font-medium"
                  >
                    {item.name}
                  </h4>
                  <p className="text-xs text-[#4E3C2B] font-sans font-medium mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#DACDB3] flex items-center justify-between">
                  <span className="font-sans font-bold text-lg text-[#362B21]">
                    {item.formattedPrice}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuickView(item)}
                      className="text-xs text-[#55694A] hover:text-[#362B21] font-sans flex items-center gap-1 font-bold"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="p-2.5 rounded-full bg-[#55694A] text-[#FAF7F0] hover:bg-[#657C58] transition-colors shadow-sm"
                      title="Add to Bag"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
