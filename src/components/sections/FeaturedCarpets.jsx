import React from 'react';
import { Heart, ArrowUpRight } from 'lucide-react';
import { carpetsData, collectionsList } from '../../data/carpets';

export default function FeaturedCarpets({
  onQuickView,
  onToggleWishlist,
  wishlistIds = [],
  activeCollectionFilter = 'all',
  onSelectCollectionFilter
}) {
  const filteredCarpets = activeCollectionFilter === 'all'
    ? carpetsData
    : carpetsData.filter(c => c.collection === activeCollectionFilter || c.category.toLowerCase().includes(activeCollectionFilter));

  return (
    <section id="featured" className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                CURATED ATELIER REPERTOIRE
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              Featured Heirlooms
            </h2>
          </div>

          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {collectionsList.map((col) => (
              <button
                key={col.id}
                onClick={() => onSelectCollectionFilter(col.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium ${
                  activeCollectionFilter === col.id
                    ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                    : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Asymmetric Editorial Product Grid */}
        <div className="mt-14 space-y-16">
          {/* Layout Block 1: 1 Large Hero Rug (left) + 2 Vertical Rugs (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Big Feature Item (7 cols) */}
            {filteredCarpets[0] && (
              <div className="lg:col-span-7 group relative bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-8 sm:p-12 flex flex-col justify-between shadow-md hover:shadow-xl transition-all duration-500 card-hover-lift">
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                    {filteredCarpets[0].collectionName}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(filteredCarpets[0]);
                    }}
                    className={`p-2.5 rounded-full border transition-colors ${
                      wishlistIds.includes(filteredCarpets[0].id)
                        ? 'bg-[#55694A] text-[#FAF7F0] border-[#55694A]'
                        : 'border-[#55694A]/30 text-[#362B21] hover:border-[#55694A]'
                    }`}
                    title="Save to Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${wishlistIds.includes(filteredCarpets[0].id) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Main Rug Image */}
                <div 
                  onClick={() => onQuickView(filteredCarpets[0])}
                  className="my-8 cursor-pointer overflow-hidden rounded-xl shadow-md flex items-center justify-center p-4 bg-[#E2D8C3]"
                >
                  <img
                    src={filteredCarpets[0].image}
                    alt={filteredCarpets[0].name}
                    className="w-full max-h-[420px] object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>

                {/* Bottom details with high contrast text */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-[#DACDB3]">
                  <div>
                    <h3 
                      onClick={() => onQuickView(filteredCarpets[0])}
                      className="font-serif text-2xl sm:text-3xl text-[#362B21] hover:text-[#55694A] cursor-pointer transition-colors font-medium"
                    >
                      {filteredCarpets[0].name}
                    </h3>
                    <p className="text-xs text-[#4E3C2B] mt-1 font-sans font-medium">
                      {filteredCarpets[0].material} &bull; {filteredCarpets[0].dimensions}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-sans text-2xl font-bold text-[#362B21]">
                      {filteredCarpets[0].formattedPrice}
                    </span>
                    <button
                      onClick={() => onQuickView(filteredCarpets[0])}
                      className="bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-5 py-3 rounded text-xs uppercase tracking-widest font-sans font-medium transition-colors flex items-center gap-1.5 shadow-md border border-[#6D7F62]"
                    >
                      <span>Examine</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Two Stacked Items (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
              {filteredCarpets.slice(1, 3).map((carpet) => (
                <div
                  key={carpet.id}
                  className="group relative bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-6 sm:p-8 flex flex-col justify-between shadow-md card-hover-lift cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
                      {carpet.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(carpet);
                      }}
                      className={`p-2 rounded-full border transition-colors ${
                        wishlistIds.includes(carpet.id)
                          ? 'bg-[#55694A] text-[#FAF7F0] border-[#55694A]'
                          : 'border-[#55694A]/30 text-[#362B21] hover:border-[#55694A]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(carpet.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div 
                    onClick={() => onQuickView(carpet)}
                    className="my-4 cursor-pointer overflow-hidden rounded-lg shadow-sm flex items-center justify-center p-3 bg-[#E2D8C3]"
                  >
                    <img
                      src={carpet.image}
                      alt={carpet.name}
                      className="w-full max-h-[190px] object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex items-end justify-between pt-2 border-t border-[#DACDB3]">
                    <div>
                      <h4 
                        onClick={() => onQuickView(carpet)}
                        className="font-serif text-xl text-[#362B21] hover:text-[#55694A] cursor-pointer transition-colors font-medium"
                      >
                        {carpet.name}
                      </h4>
                      <p className="text-xs text-[#4E3C2B] font-sans mt-0.5 font-medium">
                        {carpet.knotDensity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-sans font-bold text-lg text-[#362B21] block">
                        {carpet.formattedPrice}
                      </span>
                      <button
                        onClick={() => onQuickView(carpet)}
                        className="text-xs uppercase tracking-widest text-[#55694A] hover:underline mt-0.5 inline-block font-sans font-bold"
                      >
                        Details &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout Block 2: Architectural Quote Card + 2 Asymmetric Carpets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Item 3 */}
            {filteredCarpets[3] && (
              <div className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-6 flex flex-col justify-between shadow-md card-hover-lift cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
                    {filteredCarpets[3].collectionName}
                  </span>
                  <button
                    onClick={() => onToggleWishlist(filteredCarpets[3])}
                    className="p-1.5 text-[#362B21]/70 hover:text-[#55694A]"
                  >
                    <Heart className={`w-4 h-4 ${wishlistIds.includes(filteredCarpets[3].id) ? 'fill-[#55694A] text-[#55694A]' : ''}`} />
                  </button>
                </div>
                <div 
                  onClick={() => onQuickView(filteredCarpets[3])}
                  className="cursor-pointer overflow-hidden rounded my-2 bg-[#E2D8C3] p-2"
                >
                  <img
                    src={filteredCarpets[3].image}
                    alt={filteredCarpets[3].name}
                    className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-[#DACDB3] flex justify-between items-end">
                  <div>
                    <h4 
                      onClick={() => onQuickView(filteredCarpets[3])}
                      className="font-serif text-lg text-[#362B21] hover:text-[#55694A] cursor-pointer font-medium"
                    >
                      {filteredCarpets[3].name}
                    </h4>
                    <p className="text-xs text-[#4E3C2B] font-sans font-medium">{filteredCarpets[3].dimensions}</p>
                  </div>
                  <span className="font-sans font-bold text-base text-[#362B21]">
                    {filteredCarpets[3].formattedPrice}
                  </span>
                </div>
              </div>
            )}

            {/* Editorial Architectural Quote Card in Light Olive Green */}
            <div className="bg-[#4C5D41] text-[#FAF7F0] rounded-2xl p-8 sm:p-10 flex flex-col justify-between min-h-[340px] shadow-xl relative overflow-hidden border border-[#6D7F62]/50 card-hover-lift cursor-pointer">
              <div className="space-y-4 relative z-10">
                <span className="text-xs uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold">
                  ARCHITECTURAL PRINCIPLE
                </span>
                <p className="font-serif text-2xl sm:text-3xl leading-snug text-[#FAF7F0] font-light italic">
                  "A room without a handcrafted carpet is merely an enclosure. The carpet gives it acoustic soul, tactile warmth, and an enduring center."
                </p>
              </div>
              <div className="pt-6 border-t border-[#6D7F62]/40 text-xs text-[#D4BC9F] font-sans font-medium">
                Atelier Architectural Manifesto &bull; 2026
              </div>
            </div>

            {/* Item 4 */}
            {filteredCarpets[4] && (
              <div className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-6 flex flex-col justify-between shadow-md card-hover-lift cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
                    {filteredCarpets[4].collectionName}
                  </span>
                  <button
                    onClick={() => onToggleWishlist(filteredCarpets[4])}
                    className="p-1.5 text-[#362B21]/70 hover:text-[#55694A]"
                  >
                    <Heart className={`w-4 h-4 ${wishlistIds.includes(filteredCarpets[4].id) ? 'fill-[#55694A] text-[#55694A]' : ''}`} />
                  </button>
                </div>
                <div 
                  onClick={() => onQuickView(filteredCarpets[4])}
                  className="cursor-pointer overflow-hidden rounded my-2 bg-[#E2D8C3] p-2"
                >
                  <img
                    src={filteredCarpets[4].image}
                    alt={filteredCarpets[4].name}
                    className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-[#DACDB3] flex justify-between items-end">
                  <div>
                    <h4 
                      onClick={() => onQuickView(filteredCarpets[4])}
                      className="font-serif text-lg text-[#362B21] hover:text-[#55694A] cursor-pointer font-medium"
                    >
                      {filteredCarpets[4].name}
                    </h4>
                    <p className="text-xs text-[#4E3C2B] font-sans font-medium">{filteredCarpets[4].dimensions}</p>
                  </div>
                  <span className="font-sans font-bold text-base text-[#362B21]">
                    {filteredCarpets[4].formattedPrice}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
