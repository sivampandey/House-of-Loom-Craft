import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, ArrowUpRight } from 'lucide-react';
import { carpetsData } from '../../data/carpets';
import { decorProducts } from '../../data/decor';
import { productsAPI } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';
import { normalizeProductList, getProductImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/productUtils';

export default function SearchModal({ isOpen, onClose, onSelectProduct }) {
  const { formatPrice } = useCurrency();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [liveProducts, setLiveProducts] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const res = await productsAPI.getProducts({ limit: 150 });
        if (isMounted && res.success && res.products && res.products.length > 0) {
          setLiveProducts(normalizeProductList(res.products));
        }
      } catch (err) {
        // Fallback to static data
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, [isOpen]);

  const allItems = useMemo(() => {
    if (liveProducts && liveProducts.length > 0) {
      return liveProducts.map(p => ({
        ...p,
        type: (p.collection === 'home-decor' || p.category?.toLowerCase().includes('decor')) ? 'decor' : 'carpet'
      }));
    }
    return [
      ...carpetsData.map(c => ({ ...c, type: 'carpet' })),
      ...decorProducts.map(d => ({ ...d, type: 'decor' }))
    ];
  }, [liveProducts]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesFilter = 
        selectedFilter === 'all' || 
        (selectedFilter === 'carpets' && item.type === 'carpet') ||
        (selectedFilter === 'decor' && item.type === 'decor');

      if (!matchesFilter) return false;
      if (!query.trim()) return true;

      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.material && item.material.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.origin && item.origin.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [allItems, query, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex items-start justify-center">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-3xl bg-[#45553C] text-[#FAF7F0] rounded-xl border border-[#6D7F62] shadow-2xl overflow-hidden z-10 my-auto">
        {/* Search Header */}
        <div className="p-6 border-b border-[#6D7F62]/60 flex items-center gap-4">
          <Search className="w-6 h-6 text-[#D4BC9F] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by weave, material (e.g. Mulberry Silk, Wool), style, or origin..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-lg md:text-xl text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:outline-none font-serif"
          />
          <button 
            onClick={onClose}
            className="p-2 text-[#FAF7F0]/60 hover:text-[#FAF7F0] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-[#3C4A34] border-b border-[#6D7F62]/50 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[#D4BC9F] mr-2 uppercase tracking-wider text-[11px] font-bold">Filter:</span>
          {[
            { id: 'all', label: 'All Creations' },
            { id: 'carpets', label: 'Rugs & Carpets' },
            { id: 'decor', label: 'Home Decor' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full uppercase tracking-wider text-[11px] font-sans font-bold transition-colors ${
                selectedFilter === f.id
                  ? 'bg-[#5D7053] text-[#FAF7F0] border border-[#85997A]/60'
                  : 'bg-[#45553C] text-[#FAF7F0]/70 hover:bg-[#526449]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-6 divide-y divide-[#6D7F62]/40">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-[#D4BC9F]/70">
              <p className="font-serif text-lg">No pieces found matching "{query}"</p>
              <p className="text-xs font-sans mt-1 text-[#FAF7F0]/70">Try searching for "Hand Knotted", "Kashan", "Silk", or "Cushion"</p>
            </div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id || item._id || item.slug}
                onClick={() => {
                  onSelectProduct(item);
                  onClose();
                }}
                className="py-4 flex items-center justify-between group cursor-pointer hover:bg-[#526449] px-3 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded overflow-hidden bg-[#3C4A34] border border-[#6D7F62]/50 flex-shrink-0">
                    <img 
                      src={getProductImage(item)} 
                      alt={item.name} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-[#D4BC9F] font-bold">
                      {item.type === 'carpet' ? item.collectionName || 'Carpet' : item.category}
                    </span>
                    <h4 className="font-serif text-lg text-[#FAF7F0] group-hover:text-[#D4BC9F] transition-colors font-medium">
                      {item.name}
                    </h4>
                    <p className="text-xs text-[#FAF7F0]/70">{item.material}</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-sans font-bold text-base text-[#D4BC9F]">
                    {formatPrice(item.price)}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#D4BC9F] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
