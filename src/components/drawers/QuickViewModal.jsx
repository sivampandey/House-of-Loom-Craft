import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Check, Shield, Clock, MapPin, Sparkles } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

export default function QuickViewModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onBuyNow,
  onToggleWishlist, 
  isWishlisted 
}) {
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleInstantBuy = () => {
    if (onBuyNow) {
      onBuyNow(product);
    } else {
      handleAdd();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div className="relative w-full max-w-5xl bg-[#45553C] text-[#FAF7F0] rounded-2xl border border-[#6D7F62] shadow-2xl overflow-hidden z-10 my-auto">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-[#3C4A34] border border-[#6D7F62] text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Visual Showcase */}
          <div className="relative bg-[#3C4A34] p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#6D7F62]/60 min-h-[350px] lg:min-h-[500px]">
            <img 
              src={product.image || product.texture} 
              alt={product.name} 
              className="max-h-[460px] w-auto object-contain rounded shadow-2xl transition-transform duration-500 hover:scale-105"
            />
            {product.badge && (
              <span className="absolute top-6 left-6 text-xs uppercase tracking-widest px-3.5 py-1.5 bg-[#5D7053] text-[#FAF7F0] font-bold rounded-full border border-[#85997A]">
                {product.badge}
              </span>
            )}
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-[#D4BC9F] font-medium font-sans">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4BC9F]" />
                {product.origin || 'Bhadohi, India'}
              </span>
              {product.weaveTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#D4BC9F]" />
                  Weave: {product.weaveTime}
                </span>
              )}
            </div>
          </div>

          {/* Editorial Details */}
          <div className="p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#D4BC9F] font-bold block mb-1">
                {product.category || product.collectionName || 'Handcrafted Rug'}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#FAF7F0] leading-tight font-light">
                {product.name}
              </h2>
              <div className="mt-3 flex items-baseline gap-4">
                <span className="font-sans text-3xl font-bold text-[#D4BC9F]">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-[#FAF7F0]/80 uppercase tracking-wider font-sans font-medium">
                  Insured Delivery Included
                </span>
              </div>
              <p className="text-sm font-sans text-[#FAF7F0]/90 leading-relaxed mt-4 font-normal">
                {product.description}
              </p>
            </div>

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#6D7F62]/50 text-xs">
              <div>
                <span className="text-[#D4BC9F] block text-[11px] uppercase tracking-wider font-bold">Material Composition</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{product.material}</span>
              </div>
              <div>
                <span className="text-[#D4BC9F] block text-[11px] uppercase tracking-wider font-bold">Craft Origin</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{product.origin || 'Bhadohi, India'}</span>
              </div>
              {product.dimensions && (
                <div>
                  <span className="text-[#D4BC9F] block text-[11px] uppercase tracking-wider font-bold">Dimensions</span>
                  <span className="text-[#FAF7F0] font-medium mt-0.5 block">{product.dimensions}</span>
                </div>
              )}
              {product.knotDensity && (
                <div>
                  <span className="text-[#D4BC9F] block text-[11px] uppercase tracking-wider font-bold">Knot Density</span>
                  <span className="text-[#FAF7F0] font-medium mt-0.5 block">{product.knotDensity}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleInstantBuy}
                  disabled={product.inStock === false}
                  className={`flex-1 py-3.5 px-5 rounded-lg text-xs uppercase tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
                    product.inStock === false
                      ? 'bg-[#3C4A34]/60 text-[#FAF7F0]/50 cursor-not-allowed'
                      : 'bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] border border-[#85997A]/60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Buy Now (Online / COD)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={product.inStock === false}
                    className={`py-3.5 px-5 rounded-lg text-xs uppercase tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      added
                        ? 'bg-[#6D8262] text-[#FAF7F0]'
                        : 'bg-[#3C4A34] hover:bg-[#48593F] text-[#FAF7F0] border border-[#6D7F62]'
                    }`}
                  >
                    {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4 text-[#D4BC9F]" />}
                    <span>{added ? 'Added' : 'Add to Bag'}</span>
                  </button>

                  <button
                    onClick={() => onToggleWishlist(product)}
                    className={`p-3.5 rounded-lg border transition-colors ${
                      isWishlisted
                        ? 'bg-[#5D7053] border-[#85997A] text-[#FAF7F0]'
                        : 'border-[#6D7F62] hover:border-[#D4BC9F] text-[#FAF7F0] bg-[#3C4A34]'
                    }`}
                    title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#D4BC9F] pt-2 font-sans font-medium">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#D4BC9F]" />
                  Online Payment & Cash on Delivery Accepted
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4BC9F]" />
                  Direct from Bhadohi Weavers
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

