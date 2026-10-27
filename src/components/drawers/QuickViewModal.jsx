import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, Check, Shield, Clock, MapPin, Sparkles, Truck } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { normalizeProduct, getProductImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/productUtils';

export default function QuickViewModal({ 
  product: rawProduct, 
  isOpen, 
  onClose, 
  onAddToCart, 
  onBuyNow, 
  onToggleWishlist, 
  isWishlisted 
}) {
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const product = rawProduct ? normalizeProduct(rawProduct) || rawProduct : null;

  const activeVariants = product && product.hasVariants && Array.isArray(product.variants)
    ? product.variants.filter(v => v.active !== false)
    : [];

  useEffect(() => {
    if (activeVariants.length > 0) {
      const def = activeVariants.find(v => v.isDefault) || activeVariants[0];
      setSelectedVariantId(def ? def.id : '');
    } else {
      setSelectedVariantId('');
    }
  }, [product?.id, product?._id, activeVariants.length]);

  if (!isOpen || !product) return null;

  const selectedVariant = activeVariants.find(v => v.id === selectedVariantId) || (activeVariants.length > 0 ? activeVariants[0] : null);

  const displayedPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayedStock = selectedVariant
    ? (typeof selectedVariant.stock === 'number' ? selectedVariant.stock : product.stock)
    : product.stock;

  const isOutOfStock = (displayedStock !== undefined && Number(displayedStock) <= 0) || product.isAvailable === false || product.inStock === false;

  const formatVariantDims = (v) => {
    if (!v) return '';
    if (v.dimensions && v.dimensions.trim()) return v.dimensions.trim();
    if (v.length && v.width) return `${v.length} × ${v.width} ${v.unit || 'cm'}`;
    return v.size || '';
  };

  const currentDimensions = selectedVariant
    ? formatVariantDims(selectedVariant) || 'Not specified'
    : (product.dimensions || 'Not specified');

  const currentDispatchTime = selectedVariant
    ? (selectedVariant.dispatchTime?.trim() || 'Not specified')
    : (product.dispatchTime?.trim() || 'Not specified');

  const currentLeadTime = selectedVariant
    ? (selectedVariant.leadTime?.trim() || 'Not specified')
    : (product.leadTime?.trim() || 'Not specified');

  const currentWeaveTime = selectedVariant
    ? (selectedVariant.weaveTime?.trim() || 'Not specified')
    : (product.weaveTime?.trim() || 'Not specified');

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleInstantBuy = () => {
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, selectedVariant);
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

      <div className="relative w-full max-w-5xl bg-[#45553C] text-[#FAF7F0] rounded-2xl border border-[#6D7F62] shadow-2xl overflow-hidden z-10 my-auto max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-[#3C4A34] border border-[#6D7F62] text-[#FAF7F0] hover:text-[#D4BC9F] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto">
          {/* Visual Showcase */}
          <div className="relative bg-[#3C4A34] p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-[#6D7F62]/60 min-h-[300px] lg:min-h-[480px]">
            <img 
              src={getProductImage(product)} 
              alt={product.name} 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
              }}
              className="max-h-[420px] w-auto object-contain rounded shadow-2xl transition-transform duration-500 hover:scale-105"
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
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#D4BC9F]" />
                Weave: {currentWeaveTime}
              </span>
            </div>
          </div>

          {/* Editorial Details */}
          <div className="p-6 lg:p-8 flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#D4BC9F] font-bold block mb-1">
                {product.category || product.collectionName || 'Handcrafted Rug'}
              </span>
              <h2 className="font-serif text-2xl md:text-3xl text-[#FAF7F0] leading-tight font-light">
                {product.name}
              </h2>
              <div className="mt-2.5 flex items-baseline gap-4">
                <span className="font-sans text-3xl font-bold text-[#D4BC9F]">
                  {formatPrice(displayedPrice)}
                </span>
                <span className="text-xs text-[#FAF7F0]/80 uppercase tracking-wider font-sans font-medium">
                  {currentDispatchTime !== 'Not specified' ? `Dispatches: ${currentDispatchTime}` : 'Insured Delivery Included'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-sans text-[#FAF7F0]/90 leading-relaxed mt-3 font-normal line-clamp-3">
                {product.description}
              </p>
            </div>

            {/* Size Variants Selector */}
            {activeVariants.length > 0 && (
              <div className="p-3.5 bg-[#3C4A34] rounded-xl border border-[#6D7F62]/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#D4BC9F] uppercase tracking-wider font-bold">Select Rug Size</span>
                  {selectedVariant && (
                    <span className="font-mono text-[11px] text-[#FAF7F0] bg-[#5D7053] px-2 py-0.5 rounded">
                      {selectedVariant.size}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const isVarOutOfStock = typeof v.stock === 'number' && v.stock <= 0;
                    const varDims = formatVariantDims(v);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isVarOutOfStock}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-[#5D7053] border-[#FAF7F0] text-[#FAF7F0] shadow'
                            : isVarOutOfStock
                            ? 'bg-[#2E3A28]/50 border-[#4D5E44] text-[#FAF7F0]/40 cursor-not-allowed'
                            : 'bg-[#374530] border-[#6D7F62] text-[#FAF7F0] hover:border-[#85997A]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span>{v.size}</span>
                          {isSelected && <Check className="w-3 h-3 text-[#D4BC9F]" />}
                        </div>
                        {varDims && varDims !== v.size && (
                          <span className="text-[10px] block opacity-75 truncate">{varDims}</span>
                        )}
                        <span className="text-xs font-bold text-[#D4BC9F] block mt-0.5">{formatPrice(v.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specifications Grid */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#6D7F62]/50 text-xs">
              <div>
                <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Size & Dimensions</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{currentDimensions}</span>
              </div>
              <div>
                <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Dispatch Time</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{currentDispatchTime}</span>
              </div>
              <div>
                <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Lead / Delivery Time</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{currentLeadTime}</span>
              </div>
              <div>
                <span className="text-[#D4BC9F] block text-[10px] uppercase tracking-wider font-bold">Weaving Time</span>
                <span className="text-[#FAF7F0] font-medium mt-0.5 block">{currentWeaveTime}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={handleInstantBuy}
                  disabled={isOutOfStock}
                  className={`flex-1 py-3 px-4 rounded-lg text-xs uppercase tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
                    isOutOfStock
                      ? 'bg-[#3C4A34]/60 text-[#FAF7F0]/50 cursor-not-allowed'
                      : 'bg-[#5D7053] hover:bg-[#6D8262] text-[#FAF7F0] border border-[#85997A]/60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Sold Out' : 'Buy Now (Online / COD)'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={isOutOfStock}
                    className={`py-3 px-4 rounded-lg text-xs uppercase tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      isOutOfStock
                        ? 'bg-[#3C4A34]/60 text-[#FAF7F0]/50 cursor-not-allowed'
                        : added
                        ? 'bg-[#6D8262] text-[#FAF7F0]'
                        : 'bg-[#3C4A34] hover:bg-[#48593F] text-[#FAF7F0] border border-[#6D7F62]'
                    }`}
                  >
                    {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4 text-[#D4BC9F]" />}
                    <span>{isOutOfStock ? 'Out of Stock' : added ? 'Added' : 'Add to Bag'}</span>
                  </button>

                  <button
                    onClick={() => onToggleWishlist(product)}
                    className={`p-3 rounded-lg border transition-colors ${
                      isWishlisted
                        ? 'bg-[#5D7053] border-[#85997A] text-[#FAF7F0]'
                        : 'border-[#6D7F62] hover:border-[#D4BC9F] text-[#FAF7F0] bg-[#3C4A34]'
                    }`}
                    title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#D4BC9F] pt-1 font-sans font-medium">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  White-glove Delivery & COD
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
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
