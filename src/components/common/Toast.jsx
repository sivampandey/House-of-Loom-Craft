import React from 'react';
import { CheckCircle, Heart, ShoppingBag, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isCart = toast.type === 'cart';
  const isWishlist = toast.type === 'wishlist';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="bg-luxury-darkBg/95 text-luxury-ivory border border-luxury-sand/30 shadow-2xl rounded-xl px-5 py-4 flex items-center gap-3.5 max-w-sm backdrop-blur-md">
        <div className="p-2 rounded-full bg-luxury-sand/15 text-luxury-gold flex-shrink-0">
          {isCart ? <ShoppingBag className="w-4 h-4" /> : isWishlist ? <Heart className="w-4 h-4 text-luxury-terracotta" /> : <CheckCircle className="w-4 h-4" />}
        </div>
        <div className="flex-1 pr-2">
          <p className="text-xs font-sans font-medium text-luxury-champagne uppercase tracking-wider">{toast.title}</p>
          <p className="text-xs font-sans text-luxury-sand/80 mt-0.5 line-clamp-1">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-luxury-sand/50 hover:text-luxury-ivory p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
