import React, { useState } from 'react';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';
import { decorProducts, decorCategories } from '../../data/decor';

export default function HomeDecorSection({ onAddToCart, onQuickView }) {
  const [selectedCategory, setSelectedCategory] = useState('All Decor');

  const filtered = selectedCategory === 'All Decor'
    ? decorProducts
    : decorProducts.filter(p => p.category === selectedCategory);

  return (
    <section id="home-decor" className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                ARCHITECTURAL ACCENTS
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
              Complete the Space.
            </h2>
          </div>

          <p className="font-sans text-xs sm:text-sm md:text-base text-[#4E3C2B] max-w-md font-medium leading-relaxed">
            Thoughtfully selected pieces that bring warmth, texture and character beyond the floor.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-5 scrollbar-none border-b border-[#DACDB3]/60 mb-8 sm:mb-10">
          {decorCategories.filter(cat => cat !== 'Artisan Baskets').map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium min-h-[36px] ${
                selectedCategory === cat
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                  : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
              }`}
            >
              {cat === 'Cashmere Throws' ? 'Throws & Blankets' : cat}
            </button>
          ))}
        </div>

        {/* Editorial Layout: Desktop 5-col + 7-col; Mobile Stacked with Clean Hierarchy */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Large Atmospheric Interior Still Life (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-[#DACDB3] relative group bg-[#EFE8D8] aspect-[4/3] lg:aspect-auto lg:h-[430px]">
              <img
                src="/images/decor-editorial.jpg"
                alt="Atmospheric luxury home decor styling"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#364430]/90 via-[#364430]/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 sm:bottom-6 left-5 sm:left-6 right-5 sm:right-6 text-[#FAF7F0]">
                <span className="text-[10px] uppercase tracking-widest text-[#D4BC9F] font-sans font-bold block mb-1">
                  ATELIER EDITORIAL
                </span>
                <h3 className="font-serif text-2xl font-light leading-snug">
                  The Tactile Dimension
                </h3>
                <p className="text-xs text-[#FAF7F0]/90 mt-1 font-sans font-normal leading-relaxed">
                  Embroidered linen, beaten brass, and unbleached bouclé curated for quiet contemplative rooms.
                </p>
              </div>
            </div>

            {/* Curated Note in Warm Earthy Olive Tone */}
            <div className="p-5 sm:p-6 rounded-xl bg-[#E2D8C3] border border-[#DACDB3] space-y-2 shadow-sm">
              <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold block">
                Ethical Craftsmanship
              </span>
              <p className="text-xs text-[#4E3C2B] font-sans font-medium leading-relaxed">
                Every cushion, urn, and throw is produced in micro-batches by multi-generational craft families across Rajasthan, Kashmir, and Uttar Pradesh.
              </p>
            </div>
          </div>

          {/* Right Column: Unified Cohesive Cards Grid (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 order-1 lg:order-2">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="group bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 card-hover-lift cursor-pointer"
              >
                <div>
                  {/* Category & Badge Row */}
                  <div className="flex items-center justify-between gap-2 mb-3 min-h-[26px]">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#55694A] font-sans font-bold truncate">
                      {item.category === 'Cashmere Throws' ? 'Throws & Blankets' : item.category}
                    </span>
                    {item.badge && (
                      <span className="text-[9.5px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#55694A] text-[#FAF7F0] font-bold shadow-sm whitespace-nowrap">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Uniform Aspect-Ratio Image Container */}
                  <div 
                    onClick={() => onQuickView(item)}
                    className="aspect-[4/3] rounded-xl bg-[#E5DDCB]/70 p-3 sm:p-4 flex items-center justify-center cursor-pointer overflow-hidden group-hover:bg-[#E0D7C4] transition-colors relative"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  {/* Structured Title & Description */}
                  <div className="mt-4 space-y-1.5">
                    <h4 
                      onClick={() => onQuickView(item)}
                      className="font-serif text-lg sm:text-xl text-[#362B21] hover:text-[#55694A] cursor-pointer transition-colors font-medium leading-snug line-clamp-2 min-h-[48px] sm:min-h-[52px]"
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#4E3C2B] font-sans font-normal leading-relaxed line-clamp-2 min-h-[36px]">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Aligned Price & Action Row */}
                <div className="mt-5 pt-3.5 border-t border-[#DACDB3]/70 flex items-center justify-between">
                  <div>
                    <span className="text-[9.5px] uppercase tracking-wider text-[#55694A] block font-sans font-semibold">
                      PRICE
                    </span>
                    <span className="font-sans font-bold text-lg text-[#362B21]">
                      {item.formattedPrice}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onQuickView(item)}
                      className="text-xs text-[#55694A] hover:text-[#362B21] font-sans flex items-center gap-1 font-bold py-1.5 px-2.5 rounded hover:bg-[#DACDB3]/40 transition-colors"
                      title="View Details"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="p-2.5 rounded-full bg-[#55694A] text-[#FAF7F0] hover:bg-[#657C58] active:scale-95 transition-all shadow-md flex items-center justify-center min-w-[38px] min-h-[38px]"
                      title="Add to Bag"
                      aria-label={`Add ${item.name} to Bag`}
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
