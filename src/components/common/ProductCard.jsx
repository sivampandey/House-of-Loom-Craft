import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Eye, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { normalizeProduct, DEFAULT_FALLBACK_IMAGE } from '../../utils/productUtils';

export default function ProductCard({
  product: rawProduct,
  onQuickView,
  onToggleWishlist,
  isWishlisted = false,
  className = '',
  imageFit = 'object-cover'
}) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const product = normalizeProduct(rawProduct);
  if (!product) return null;

  const pId = product.slug || product.id || product._id;
  const wishlisted = typeof isWishlisted === 'function' ? isWishlisted(pId) : Boolean(isWishlisted);

  const handleCardClick = () => {
    navigate(`/products/${product.slug || pId}`);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleWishlist) {
      onToggleWishlist(product, e);
    }
  };

  const handleQuickViewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer card-hover-lift ${className}`}
    >
      {/* Top Media & Image Stage */}
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#E8E2D4] flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
            }}
            className={`w-full h-full ${imageFit} group-hover:scale-105 transition-transform duration-700`}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-3.5 left-3.5 text-[10px] uppercase tracking-widest bg-[#45563D]/95 text-[#FAF7F0] px-3 py-1 rounded-full font-bold backdrop-blur-sm border border-[#85977A]/40 shadow-sm z-10">
              {product.badge}
            </span>
          )}

          {/* Quick Action Floating Pill */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
            {onToggleWishlist && (
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-md active:scale-90 ${
                  wishlisted
                    ? 'bg-[#55694A] text-[#FAF7F0]'
                    : 'bg-[#FAF7F0]/85 text-[#362B21] hover:bg-[#FAF7F0]'
                }`}
                title={wishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            )}

            {onQuickView && (
              <button
                type="button"
                onClick={handleQuickViewClick}
                className="p-2.5 rounded-full bg-[#FAF7F0]/85 text-[#362B21] hover:bg-[#FAF7F0] backdrop-blur-md transition-all shadow-md active:scale-90"
                title="Quick View"
                aria-label="Quick View"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Out of Stock Ribbon */}
          {!product.inStock && (
            <div className="absolute bottom-3 left-3 bg-[#362B21]/90 text-[#FAF7F0] text-[10px] uppercase tracking-widest font-sans font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              Out of Stock
            </div>
          )}
        </div>

        {/* Card Content Details */}
        <div className="p-5 sm:p-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#55694A] font-sans font-bold uppercase tracking-wider">
            <span className="truncate max-w-[70%]">{product.collectionName || product.category}</span>
            {product.knotDensity && (
              <span className="text-[10px] text-[#4E3C2B]/80 font-normal lowercase tracking-normal shrink-0">
                {product.knotDensity}
              </span>
            )}
          </div>

          {/* Product Name with locked min-height for uniform row heights */}
          <h3 className="font-serif text-lg sm:text-xl text-[#362B21] font-medium leading-snug group-hover:text-[#55694A] transition-colors line-clamp-2 min-h-[3rem]">
            {product.name}
          </h3>

          {/* Dimensions / Material */}
          <div className="text-xs text-[#4E3C2B] font-sans line-clamp-1">
            {product.dimensions ? (
              <span className="font-mono text-[#55694A] font-medium">{product.dimensions}</span>
            ) : product.material ? (
              <span>{product.material}</span>
            ) : (
              <span className="text-[#544131]/60">{product.origin}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Price & CTA */}
      <div className="p-5 sm:p-6 pt-0 mt-2">
        <div className="pt-4 border-t border-[#DACDB3]/70 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#55694A] block font-sans font-bold">
              PRICE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-sans font-bold text-lg sm:text-xl text-[#362B21]">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="text-[10px] text-[#4E3C2B]/60 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </div>

          <Link
            to={`/products/${product.slug || pId}`}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs uppercase tracking-widest font-sans font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
