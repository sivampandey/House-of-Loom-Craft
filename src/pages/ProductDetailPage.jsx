import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingBag, ArrowLeft, ShieldCheck, Truck, 
  RotateCcw, Check, MessageSquare, Phone, Sparkles 
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { companyInfo, carpetsData } from '../data/carpets';
import { useCurrency } from '../context/CurrencyContext';
import CurrencySelector from '../components/common/CurrencySelector';
import { normalizeProduct, normalizeProductList, DEFAULT_FALLBACK_IMAGE } from '../utils/productUtils';

export default function ProductDetailPage({ onShowToast }) {
  const { formatPrice } = useCurrency();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const res = await productsAPI.getProductBySlug(slug);
        if (res.success && res.product) {
          const norm = normalizeProduct(res.product);
          setProduct(norm);
          setRelated(normalizeProductList(res.related || []));
          setSelectedImage(norm.image || DEFAULT_FALLBACK_IMAGE);

          // If product has size variants, initialize default variant if set
          const activeVars = norm.hasVariants && Array.isArray(norm.variants)
            ? norm.variants.filter(v => v.active !== false)
            : [];
          const defaultVar = activeVars.find(v => v.isDefault);
          setSelectedVariantId(defaultVar ? defaultVar.id : '');
        } else {
          // Fallback to local data
          const local = carpetsData.find(c => c.slug === slug || c.id === slug);
          if (local) {
            const norm = normalizeProduct(local);
            setProduct(norm);
            setSelectedImage(norm.image || DEFAULT_FALLBACK_IMAGE);
            setRelated(normalizeProductList(carpetsData.filter(c => c.id !== local.id).slice(0, 3)));
            const activeVars = norm.hasVariants && Array.isArray(norm.variants)
              ? norm.variants.filter(v => v.active !== false)
              : [];
            const defaultVar = activeVars.find(v => v.isDefault);
            setSelectedVariantId(defaultVar ? defaultVar.id : '');
          }
        }
      } catch (err) {
        const local = carpetsData.find(c => c.slug === slug || c.id === slug);
        if (local) {
          const norm = normalizeProduct(local);
          setProduct(norm);
          setSelectedImage(norm.image || DEFAULT_FALLBACK_IMAGE);
          setRelated(normalizeProductList(carpetsData.filter(c => c.id !== local.id).slice(0, 3)));
          const activeVars = norm.hasVariants && Array.isArray(norm.variants)
            ? norm.variants.filter(v => v.active !== false)
            : [];
          const defaultVar = activeVars.find(v => v.isDefault);
          setSelectedVariantId(defaultVar ? defaultVar.id : '');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center pt-24">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg tracking-widest text-[#362B21] uppercase">Unfolding Heirloom Details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center pt-24">
        <div className="text-center space-y-4 max-w-md p-8 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3]">
          <h2 className="font-serif text-3xl text-[#362B21]">Piece Not Located</h2>
          <p className="text-sm text-[#4E3C2B]">This product may no longer be available or has been moved in our catalog.</p>
          <Link
            to="/collections"
            className="inline-block px-6 py-3 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-bold rounded-full"
          >
            Explore Collections
          </Link>
        </div>
      </div>
    );
  }

  const pId = product.slug || product.id || product._id;
  const wishlisted = isWishlisted(pId);

  // Active variants
  const activeVariants = product.hasVariants && Array.isArray(product.variants)
    ? product.variants.filter(v => v.active !== false)
    : [];

  const selectedVariant = activeVariants.find(v => v.id === selectedVariantId) || null;

  // Resolve dynamic price and stock based on variant selection
  const displayedPrice = selectedVariant
    ? selectedVariant.price
    : (activeVariants.length > 0 && product.hasPriceRange ? product.minVariantPrice : product.price);

  const displayedComparePrice = selectedVariant
    ? selectedVariant.compareAtPrice
    : (!selectedVariantId && product.hasPriceRange ? null : product.compareAtPrice);

  const availableStock = selectedVariant
    ? (typeof selectedVariant.stock === 'number' ? selectedVariant.stock : product.stock)
    : product.stock;

  const isOutOfStock = (availableStock !== undefined && Number(availableStock) <= 0) || product.isAvailable === false;

  const handleAddToCart = async () => {
    if (activeVariants.length > 0 && !selectedVariantId) {
      setSizeError(true);
      if (onShowToast) {
        onShowToast('error', 'Select Size', 'Please choose a rug size to place in your bag.');
      }
      return;
    }

    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      await addToCart(
        product,
        quantity,
        selectedVariant ? selectedVariant.size : '',
        selectedVariant ? selectedVariant.id : '',
        selectedVariant ? selectedVariant.price : product.price,
        selectedVariant ? selectedVariant.size : ''
      );
      if (onShowToast) {
        const sizeTag = selectedVariant ? ` (${selectedVariant.size})` : '';
        onShowToast('cart', 'Added to Bag', `${quantity}x ${product.name}${sizeTag} placed in your shopping bag.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Error', err.message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (activeVariants.length > 0 && !selectedVariantId) {
      setSizeError(true);
      if (onShowToast) {
        onShowToast('error', 'Select Size', 'Please choose a rug size to proceed.');
      }
      return;
    }

    if (isOutOfStock) return;
    try {
      await addToCart(
        product,
        quantity,
        selectedVariant ? selectedVariant.size : '',
        selectedVariant ? selectedVariant.id : '',
        selectedVariant ? selectedVariant.price : product.price,
        selectedVariant ? selectedVariant.size : ''
      );
      navigate('/checkout');
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Error', err.message);
      }
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const res = await toggleWishlist(product);
      if (onShowToast) {
        onShowToast('wishlist', res.saved ? 'Saved' : 'Removed', res.message);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Error', err.message);
      }
    }
  };

  const allImages = [
    product.image,
    product.thumbnail,
    product.texture,
    ...(product.images || [])
  ].filter((img, idx, self) => Boolean(img) && self.indexOf(img) === idx);

  // Size-specific dynamic attributes with strict isolation
  const hasVariants = activeVariants.length > 0;

  const formatVariantDims = (v) => {
    if (!v) return '';
    if (v.dimensions && v.dimensions.trim()) return v.dimensions.trim();
    if (v.length && v.width) return `${v.length} × ${v.width} ${v.unit || 'cm'}`;
    return v.size || '';
  };

  const formatProductDims = (p) => {
    if (!p) return '';
    if (p.dimensions && p.dimensions.trim()) return p.dimensions.trim();
    if (p.length && p.width) return `${p.length} × ${p.width} ${p.unit || 'cm'}`;
    return '';
  };

  let currentDimensions = 'Not specified';
  let currentDispatchTime = 'Not specified';
  let currentLeadTime = 'Not specified';
  let currentWeaveTime = 'Not specified';
  let currentSku = '';

  if (hasVariants) {
    if (selectedVariant) {
      currentDimensions = formatVariantDims(selectedVariant) || 'Not specified';
      currentDispatchTime = selectedVariant.dispatchTime?.trim() || 'Not specified';
      currentLeadTime = selectedVariant.leadTime?.trim() || 'Not specified';
      currentWeaveTime = selectedVariant.weaveTime?.trim() || 'Not specified';
      currentSku = selectedVariant.sku || '';
    } else {
      currentDimensions = 'Select a size above';
      currentDispatchTime = 'Select a size above';
      currentLeadTime = 'Select a size above';
      currentWeaveTime = 'Select a size above';
      currentSku = '';
    }
  } else {
    currentDimensions = formatProductDims(product) || 'Not specified';
    currentDispatchTime = product.dispatchTime?.trim() || 'Not specified';
    currentLeadTime = product.leadTime?.trim() || 'Not specified';
    currentWeaveTime = product.weaveTime?.trim() || 'Not specified';
    currentSku = product.sku || '';
  }

  const selectedSizeDescriptor = selectedVariant
    ? `${selectedVariant.size}${selectedVariant.dimensions ? ` (${selectedVariant.dimensions})` : ''}`
    : product.dimensions || 'Standard';

  const whatsappConciergeMsg = encodeURIComponent(
    `Hello House of Loom & Craft,\n\nI am inquiring about the piece: *${product.name}* (Selected Size: ${selectedSizeDescriptor}, Price: ${formatPrice(displayedPrice)}).\nCould you provide more details regarding custom weaving or delivery?`
  );

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title={product.seoTitle || `${product.name} | House of Loom & Craft Bhadohi`}
        description={product.seoDescription || product.shortDescription || product.description}
        path={`/products/${product.slug || pId}`}
        image={selectedImage}
        product={product}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Collections', url: '/collections' },
          { name: product.collectionName || 'Carpets', url: `/collections/${product.collection || 'all'}` },
          { name: product.name, url: `/products/${product.slug || pId}` }
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2.5 text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold mb-8">
          <Link to="/collections" className="hover:text-[#362B21] transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Collections
          </Link>
          <span className="text-[#DACDB3]">/</span>
          <Link to={`/collections/${product.collection || 'all'}`} className="hover:text-[#362B21] transition-colors">
            {product.collectionName || product.category}
          </Link>
          <span className="text-[#DACDB3]">/</span>
          <span className="text-[#362B21] truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Atmospheric Large Image & Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#E8E2D4] border border-[#DACDB3] shadow-lg group">
              <img
                src={selectedImage}
                alt={product.name}
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                }}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {product.badge && (
                <span className="absolute top-5 left-5 text-[11px] uppercase tracking-widest bg-[#45563D]/95 text-[#FAF7F0] px-4 py-1.5 rounded-full font-bold backdrop-blur-md border border-[#85977A]/50">
                  {product.badge}
                </span>
              )}

              <button
                onClick={handleToggleWishlist}
                className={`absolute top-5 right-5 p-3 rounded-full backdrop-blur-md transition-all shadow-md ${
                  wishlisted
                    ? 'bg-[#55694A] text-[#FAF7F0]'
                    : 'bg-[#FAF7F0]/90 text-[#362B21] hover:bg-[#FAF7F0]'
                }`}
                title="Save to Curated Wishlist"
                aria-label="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === img
                        ? 'border-[#55694A] shadow-md scale-105'
                        : 'border-[#DACDB3] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Angle ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Craftsmanship Narrative Box */}
            <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-8 space-y-4 mt-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#55694A]" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold">
                  BHADOHI CRAFTSMANSHIP
                </span>
              </div>
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Artisanal Provenance & Weave</h3>
              <p className="text-xs sm:text-sm text-[#4E3C2B] leading-relaxed font-sans">
                {product.description}
              </p>

              {product.details && product.details.length > 0 && (
                <ul className="space-y-2 pt-2 border-t border-[#DACDB3]/70">
                  {product.details.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#362B21]">
                      <Check className="w-3.5 h-3.5 text-[#55694A] mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column: Purchase Panel & Specifications (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
                {product.collectionName || product.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Pricing Section */}
            <div className="p-6 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#DACDB3]/70">
                <span className="text-[10px] uppercase tracking-widest text-[#4E3C2B]/70 font-sans font-semibold">
                  {activeVariants.length > 0 && !selectedVariantId && product.hasPriceRange ? 'STARTING PRICE' : 'PRICE (Inclusive of all duties)'}
                </span>
                <CurrencySelector variant="editorial" />
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="font-sans text-3xl font-bold text-[#362B21]">
                      {activeVariants.length > 0 && !selectedVariantId && product.hasPriceRange
                        ? `From ${formatPrice(product.minVariantPrice)}`
                        : formatPrice(displayedPrice || 0)}
                    </span>
                    {displayedComparePrice && (
                      <span className="font-sans text-sm text-[#4E3C2B]/60 line-through">
                        {formatPrice(displayedComparePrice)}
                      </span>
                    )}
                  </div>
                  {activeVariants.length > 0 && !selectedVariantId && (
                    <span className="text-[11px] text-[#55694A] font-sans font-semibold mt-1 block">
                      Select a size below to view exact piece price
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {isOutOfStock ? (
                    <span className="text-xs text-[#8A3324] font-sans font-bold flex items-center justify-end gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#8A3324] inline-block" />
                      Out of Stock
                    </span>
                  ) : (
                    <span className="text-xs text-[#55694A] font-sans font-bold flex items-center justify-end gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#55694A] inline-block animate-pulse" />
                      In Stock ({availableStock} available)
                    </span>
                  )}
                  <span className="text-[10px] text-[#4E3C2B]/80 block font-mono mt-0.5">
                    {isOutOfStock
                      ? 'Currently Unavailable'
                      : hasVariants && !selectedVariant
                      ? 'Select size for dispatch timeframe'
                      : currentDispatchTime !== 'Not specified'
                      ? `Dispatch: ${currentDispatchTime}`
                      : currentLeadTime !== 'Not specified'
                      ? `Delivery: ${currentLeadTime}`
                      : 'Dispatch: Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Size & Pricing Variant Selector */}
            {activeVariants.length > 0 && (
              <div
                className={`p-5 rounded-2xl bg-[#EFE8D8] border transition-all ${
                  sizeError && !selectedVariantId ? 'border-[#8A3324] ring-2 ring-[#8A3324]/30' : 'border-[#DACDB3]'
                } space-y-3.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs uppercase tracking-wider font-sans font-bold text-[#362B21]">
                      Available Sizes
                    </span>
                    <span className="text-[#8A3324] font-bold">*</span>
                  </div>
                  {selectedVariant ? (
                    <span className="text-xs text-[#55694A] font-bold font-mono bg-[#FAF7F0] px-2.5 py-0.5 rounded-full border border-[#DACDB3]">
                      Selected: {selectedVariant.size}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8A3324] font-sans font-medium">
                      Select size
                    </span>
                  )}
                </div>

                {sizeError && !selectedVariantId && (
                  <p className="text-xs text-[#8A3324] font-sans font-bold bg-[#8A3324]/10 p-2 rounded-lg border border-[#8A3324]/20">
                    Please select an available rug size variant to place in your bag.
                  </p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    const isVarOutOfStock = typeof v.stock === 'number' && v.stock <= 0;
                    const varDims = formatVariantDims(v);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={isVarOutOfStock}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setSizeError(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#55694A] text-[#FAF7F0] border-[#44543B] shadow-md scale-[1.02]'
                            : isVarOutOfStock
                            ? 'bg-[#E5DDCB]/50 border-[#DACDB3]/50 text-[#8C7E6C] cursor-not-allowed opacity-60'
                            : 'bg-[#FAF7F0] border-[#DACDB3] text-[#362B21] hover:border-[#55694A] hover:bg-[#FAF7F0]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#FAF7F0]' : 'text-[#362B21]'}`}>
                            {v.size}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#D4BC9F]" />}
                        </div>
                        {varDims && varDims !== v.size && (
                          <span className={`text-[10px] block mb-1 truncate ${isSelected ? 'text-[#FAF7F0]/80' : 'text-[#544131]/70'}`}>
                            {varDims}
                          </span>
                        )}
                        <div className="flex items-baseline justify-between mt-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-[#D4BC9F]' : 'text-[#55694A]'}`}>
                            {formatPrice(v.price)}
                          </span>
                          {isVarOutOfStock ? (
                            <span className="text-[9px] uppercase tracking-wider text-[#8A3324] font-bold">Sold Out</span>
                          ) : v.stock <= 3 ? (
                            <span className={`text-[9px] uppercase tracking-wider ${isSelected ? 'text-amber-200' : 'text-amber-800'} font-medium`}>
                              Only {v.stock} left
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedVariant && (
                  <div className="mt-3 p-3 bg-[#FAF7F0] rounded-xl border border-[#DACDB3] text-[11px] font-sans text-[#4E3C2B] grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[#55694A] font-bold block text-[10px] uppercase tracking-wider">Preparation / Dispatch</span>
                      <span className={selectedVariant.dispatchTime ? 'text-[#362B21] font-semibold' : 'italic text-[#4E3C2B]/60'}>
                        {selectedVariant.dispatchTime || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#55694A] font-bold block text-[10px] uppercase tracking-wider">Doorstep Delivery</span>
                      <span className={selectedVariant.leadTime ? 'text-[#362B21] font-semibold' : 'italic text-[#4E3C2B]/60'}>
                        {selectedVariant.leadTime || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#55694A] font-bold block text-[10px] uppercase tracking-wider">Atelier Weave Time</span>
                      <span className={selectedVariant.weaveTime ? 'text-[#362B21] font-semibold' : 'italic text-[#4E3C2B]/60'}>
                        {selectedVariant.weaveTime || 'Not specified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Matrix */}
            <div className="bg-[#FAF7F0] rounded-2xl border border-[#DACDB3] p-6 divide-y divide-[#DACDB3]/60 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#4E3C2B] font-medium">Selected Size / Dimensions</span>
                <span className="font-mono text-[#362B21] font-bold text-right">
                  {currentDimensions}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#4E3C2B] font-medium">Dispatch Time</span>
                <span className={`text-right font-medium ${currentDispatchTime === 'Not specified' ? 'text-[#4E3C2B]/60 italic' : 'text-[#362B21] font-semibold'}`}>
                  {currentDispatchTime}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#4E3C2B] font-medium">Estimated Delivery / Lead Time</span>
                <span className={`text-right font-medium ${currentLeadTime === 'Not specified' ? 'text-[#4E3C2B]/60 italic' : 'text-[#362B21] font-semibold'}`}>
                  {currentLeadTime}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#4E3C2B] font-medium">Weaving / Crafting Time</span>
                <span className={`text-right font-medium ${currentWeaveTime === 'Not specified' ? 'text-[#4E3C2B]/60 italic' : 'text-[#362B21] font-semibold'}`}>
                  {currentWeaveTime}
                </span>
              </div>
              {currentSku && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#4E3C2B] font-medium">Variation SKU</span>
                  <span className="font-mono text-[#544131] text-right font-semibold">{currentSku}</span>
                </div>
              )}
              {product.material && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#4E3C2B] font-medium">Material / Fiber</span>
                  <span className="text-[#362B21] font-medium text-right max-w-[65%]">{product.material}</span>
                </div>
              )}
              {product.knotDensity && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#4E3C2B] font-medium">Knot Density / Pile</span>
                  <span className="text-[#55694A] font-bold text-right">{product.knotDensity}</span>
                </div>
              )}
              {product.origin && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-[#4E3C2B] font-medium">Craft Origin</span>
                  <span className="text-[#362B21] text-right">{product.origin}</span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className={`flex items-center border border-[#DACDB3] rounded-full bg-[#EFE8D8] px-3 py-1 ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
                  <span className="text-xs uppercase tracking-wider text-[#4E3C2B] mr-3 font-medium">Qty</span>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded-full text-base font-bold flex items-center justify-center hover:bg-[#DACDB3]/50 transition-colors disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold font-sans">{isOutOfStock ? 0 : quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock || 10, quantity + 1))}
                    disabled={isOutOfStock}
                    className="w-7 h-7 rounded-full text-base font-bold flex items-center justify-center hover:bg-[#DACDB3]/50 transition-colors disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isOutOfStock}
                  className={`flex-1 font-sans font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md ${
                    isOutOfStock
                      ? 'bg-[#A89F91] text-[#EFE8D8] cursor-not-allowed shadow-none'
                      : 'bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Out of Stock' : isAdding ? 'Placing in Bag...' : 'Add to Bag'}</span>
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`w-full font-sans font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-[#A89F91] text-[#EFE8D8] cursor-not-allowed shadow-none'
                    : 'bg-[#362B21] hover:bg-[#4E3C2B] text-[#FAF7F0] shadow-lg'
                }`}
              >
                <span>{isOutOfStock ? 'Currently Unavailable' : 'Purchase Now'}</span>
              </button>
            </div>

            {/* Reassurance Guarantees */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#DACDB3]/60 text-[11px] text-[#4E3C2B]">
              <div className="flex items-center gap-2 p-3 bg-[#EFE8D8]/70 rounded-xl border border-[#DACDB3]/50">
                <Truck className="w-4 h-4 text-[#55694A] flex-shrink-0" />
                <span>Complimentary Insured Shipping</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#EFE8D8]/70 rounded-xl border border-[#DACDB3]/50">
                <ShieldCheck className="w-4 h-4 text-[#55694A] flex-shrink-0" />
                <span>Authentic Provenance Certificate</span>
              </div>
            </div>

            {/* Direct Atelier WhatsApp Concierge */}
            <div className="pt-2">
              <a
                href={`https://wa.me/${companyInfo.whatsappNumber}?text=${whatsappConciergeMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl border border-[#85977A] bg-[#45563D]/10 hover:bg-[#45563D]/20 text-[#362B21] flex items-center justify-center gap-2 text-xs font-sans font-bold tracking-wider transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>Consult Master Artisan on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Related Pieces */}
        {related.length > 0 && (
          <div className="mt-24 pt-16 border-t border-[#DACDB3]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
                  CURATED HARMONY
                </span>
                <h2 className="font-serif text-3xl text-[#362B21] font-light">Complementary Pieces</h2>
              </div>
              <Link
                to="/collections"
                className="text-xs uppercase tracking-widest text-[#55694A] hover:text-[#362B21] font-sans font-bold border-b border-[#55694A] pb-0.5 transition-colors"
              >
                View All Collections
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((rel) => {
                const rSlug = rel.slug || rel.id;
                return (
                  <Link
                    key={rSlug}
                    to={`/products/${rSlug}`}
                    className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-5 block shadow-sm hover:shadow-lg transition-all card-hover-lift"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#E8E2D4] mb-4">
                      <img
                        src={rel.image || rel.thumbnail || (rel.images && rel.images[0]) || rel.texture}
                        alt={rel.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-[#55694A] font-bold block mb-1">
                      {rel.collectionName || rel.category}
                    </span>
                    <h3 className="font-serif text-lg text-[#362B21] group-hover:text-[#55694A] transition-colors leading-snug">
                      {rel.name}
                    </h3>
                    <p className="font-sans font-bold text-sm text-[#362B21] mt-2">
                      {formatPrice(rel.price || 0)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
