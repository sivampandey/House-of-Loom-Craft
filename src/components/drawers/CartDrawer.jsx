import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function CartDrawer({ isOpen, onClose, items, onRemove, onUpdateQty, onCheckout }) {
  const { formatPrice, currency } = useCurrency();
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#45553C] text-[#FAF7F0] shadow-2xl border-l border-[#6D7F62] flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 border-b border-[#6D7F62]/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#D4BC9F]" />
              <h2 className="font-serif text-2xl tracking-wide font-medium">Shopping Bag</h2>
              <span className="text-xs bg-[#5D7053] text-[#FAF7F0] px-2.5 py-0.5 rounded-full font-bold">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-[#FAF7F0]/70 hover:text-[#FAF7F0] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#6D7F62]/40">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 text-[#D4BC9F]/80">
                <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-4 opacity-60" />
                <p className="font-serif text-xl text-[#FAF7F0] mb-2 font-medium">Your Bag is Empty</p>
                <p className="text-xs max-w-xs font-sans leading-relaxed mb-6 text-[#FAF7F0]/80">
                  Explore our curated collections of hand-knotted heirlooms and artisanal home decor.
                </p>
                <button
                  onClick={onClose}
                  className="text-xs uppercase tracking-widest text-[#D4BC9F] border-b border-[#D4BC9F] pb-1 transition-colors font-bold"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-5 flex gap-4">
                  <div className="w-20 h-20 bg-[#3C4A34] rounded overflow-hidden flex-shrink-0 border border-[#6D7F62]/50">
                    <img 
                      src={item.image || item.texture} 
                      alt={item.name} 
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
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#D4BC9F] mt-0.5">{item.dimensions || item.collectionName}</p>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#6D7F62] rounded bg-[#3C4A34]">
                        <button
                          onClick={() => onUpdateQty(item.id, Math.max(1, (item.quantity || 1) - 1))}
                          className="px-2.5 py-0.5 text-xs text-[#FAF7F0] hover:text-[#D4BC9F]"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs text-[#FAF7F0] font-bold">{item.quantity || 1}</span>
                        <button
                          onClick={() => onUpdateQty(item.id, (item.quantity || 1) + 1)}
                          className="px-2.5 py-0.5 text-xs text-[#FAF7F0] hover:text-[#D4BC9F]"
                        >
                          +
                        </button>
                      </div>
                      <p className="font-sans font-bold text-sm text-[#D4BC9F]">
                        {formatPrice((item.price) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-6 bg-[#3C4A34] border-t border-[#6D7F62]/60 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-[#FAF7F0]/90">
                  <span>Subtotal</span>
                  <span className="font-sans text-[#FAF7F0] font-bold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#D4BC9F]">
                  <span>Insured Shipping</span>
                  <span className="uppercase tracking-wider font-bold">Complimentary</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#6D7F62]/50 flex justify-between text-base text-[#FAF7F0]">
                <span className="font-serif tracking-wider font-medium">Total</span>
                <span className="font-sans font-bold text-xl text-[#D4BC9F]">{formatPrice(subtotal)}</span>
              </div>

              <button
                onClick={onCheckout}
                className="w-full bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-4 px-6 rounded text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg border border-[#85997A]/60"
              >
                <span>{currency === 'INR' ? 'Proceed to Checkout (Online / COD)' : `Proceed to Checkout (${currency})`}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex flex-col items-center justify-center gap-1.5 text-[11px] text-[#D4BC9F] pt-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  <span>{currency === 'INR' ? 'Online Payment (UPI/Cards) & Cash on Delivery Available' : `Secure International Payment in ${currency}`}</span>
                </div>
                <span className="text-[#FAF7F0]/70 text-[10px]">Free Insured Express Delivery from Bhadohi Workshop</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
