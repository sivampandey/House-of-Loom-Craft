import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { getProductImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/productUtils';

export default function WishlistDrawer({ isOpen, onClose, items, onRemove, onMoveToCart }) {
  const { formatPrice } = useCurrency();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#45553C] text-[#FAF7F0] shadow-2xl border-l border-[#6D7F62] flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 border-b border-[#6D7F62]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-[#D4BC9F] fill-[#D4BC9F]" />
              <h2 className="font-serif text-2xl tracking-wide font-medium">Saved Heirlooms</h2>
              <span className="text-xs bg-[#5D7053] text-[#FAF7F0] px-2.5 py-0.5 rounded-full font-bold">
                {items.length}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-[#FAF7F0]/70 hover:text-[#FAF7F0] transition-colors"
              aria-label="Close wishlist"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#6D7F62]/40">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-[#D4BC9F]/80">
                <Heart className="w-12 h-12 stroke-[1.2] mb-4 opacity-60" />
                <p className="font-serif text-xl text-[#FAF7F0] mb-2 font-medium">No Saved Pieces Yet</p>
                <p className="text-xs max-w-xs font-sans leading-relaxed mb-6 text-[#FAF7F0]/80">
                  Save pieces you adore to compare knotting styles, palettes, and dimensions.
                </p>
                <button
                  onClick={onClose}
                  className="text-xs uppercase tracking-widest text-[#D4BC9F] border-b border-[#D4BC9F] pb-1 transition-colors font-bold"
                >
                  Discover Collections
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-5 flex gap-4">
                  <div className="w-20 h-20 bg-[#3C4A34] rounded overflow-hidden flex-shrink-0 border border-[#6D7F62]/50">
                    <img 
                      src={getProductImage(item)} 
                      alt={item.name} 
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-base text-[#FAF7F0] leading-snug font-medium">{item.name}</h4>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-[#FAF7F0]/50 hover:text-[#D4BC9F] p-1 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#D4BC9F] mt-0.5 font-medium">{item.dimensions || item.category}</p>
                      <p className="font-sans font-bold text-sm text-[#D4BC9F] mt-1">
                        {formatPrice(item.price)}
                      </p>
                    </div>

                    <div className="flex items-center justify-end mt-3">
                      <button
                        onClick={() => onMoveToCart(item)}
                        className="text-xs text-[#FAF7F0] hover:text-[#D4BC9F] flex items-center gap-1.5 border border-[#6D7F62] hover:border-[#D4BC9F] px-3.5 py-1.5 rounded transition-all bg-[#3C4A34] font-medium"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 bg-[#3C4A34] border-t border-[#6D7F62]/50">
              <button
                onClick={onClose}
                className="w-full border border-[#D4BC9F] text-[#FAF7F0] hover:bg-[#5D7053] font-sans font-bold py-3.5 px-6 rounded text-xs uppercase tracking-widest transition-all duration-300"
              >
                Continue Exploring
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
