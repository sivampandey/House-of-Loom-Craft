import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingBag, ArrowLeft, ShieldCheck, Truck, 
  RotateCcw, Sparkles, Check, MessageSquare, Phone 
} from 'lucide-react';
import SEO from '../components/common/SEO';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { companyInfo, carpetsData } from '../data/carpets';

export default function ProductDetailPage({ onShowToast }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
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
          setProduct(res.product);
          setRelated(res.related || []);
          setSelectedImage(
            res.product.thumbnail || (res.product.images && res.product.images[0]) || res.product.texture
          );
        } else {
          // Fallback to local data
          const local = carpetsData.find(c => c.slug === slug || c.id === slug);
          if (local) {
            setProduct(local);
            setSelectedImage(local.texture || local.image);
            setRelated(carpetsData.filter(c => c.id !== local.id).slice(0, 3));
          }
        }
      } catch (err) {
        const local = carpetsData.find(c => c.slug === slug || c.id === slug);
        if (local) {
          setProduct(local);
          setSelectedImage(local.texture || local.image);
          setRelated(carpetsData.filter(c => c.id !== local.id).slice(0, 3));
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
          <p className="text-sm text-[#4E3C2B]">This heirloom carpet may have been acquired or transferred in our atelier archive.</p>
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

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(product, quantity);
      if (onShowToast) {
        onShowToast('cart', 'Added to Bag', `${quantity}x ${product.name} placed in your shopping bag.`);
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
    try {
      await addToCart(product, quantity);
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
    product.texture,
    product.image,
    product.thumbnail,
    ...(product.images || [])
  ].filter((img, idx, self) => Boolean(img) && self.indexOf(img) === idx);

  const whatsappConciergeMsg = encodeURIComponent(
    `Hello Pottery Rugs & Home Decor Atelier,\n\nI am inquiring about the piece: *${product.name}* (Price: ₹${product.price?.toLocaleString()}, Dimensions: ${product.dimensions || 'N/A'}).\nCould you provide more details regarding custom sizing or white-glove dispatch?`
  );

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title={product.seoTitle || `${product.name} | Pottery Rugs Bhadohi`}
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
                    <img src={img} alt={`Angle ${i + 1}`} className="w-full h-full object-cover" />
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

          {/* Right Column: Acquisition Panel & Specifications (5 cols) */}
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
            <div className="p-6 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#4E3C2B]/70 block font-sans font-semibold">
                  PRICE (Inclusive of all duties)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-sans text-3xl font-bold text-[#362B21]">
                    ₹{(product.price || 0).toLocaleString()}
                  </span>
                  {product.compareAtPrice && (
                    <span className="font-sans text-sm text-[#4E3C2B]/60 line-through">
                      ₹{product.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#55694A] font-sans font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#55694A] inline-block animate-pulse" />
                  {product.stock > 0 ? 'Available' : 'Made to Order'}
                </span>
                <span className="text-[10px] text-[#4E3C2B]/80 block font-mono mt-0.5">
                  {product.leadTime || 'Dispatches in 24-48 Hours'}
                </span>
              </div>
            </div>

            {/* Specifications Matrix */}
            <div className="bg-[#FAF7F0] rounded-2xl border border-[#DACDB3] p-6 divide-y divide-[#DACDB3]/60 text-xs">
              {product.dimensions && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#4E3C2B] font-medium">Dimensions</span>
                  <span className="font-mono text-[#362B21] font-bold text-right">{product.dimensions}</span>
                </div>
              )}
              {product.material && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#4E3C2B] font-medium">Material / Fiber</span>
                  <span className="text-[#362B21] font-medium text-right max-w-[65%]">{product.material}</span>
                </div>
              )}
              {product.knotDensity && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#4E3C2B] font-medium">Knot Density / Pile</span>
                  <span className="text-[#55694A] font-bold text-right">{product.knotDensity}</span>
                </div>
              )}
              {product.weaveTime && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#4E3C2B] font-medium">Crafting Duration</span>
                  <span className="text-[#362B21] text-right">{product.weaveTime}</span>
                </div>
              )}
              {product.origin && (
                <div className="py-2.5 flex justify-between">
                  <span className="text-[#4E3C2B] font-medium">Craft Origin</span>
                  <span className="text-[#362B21] text-right">{product.origin}</span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Action Buttons */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#DACDB3] rounded-full bg-[#EFE8D8] px-3 py-1">
                  <span className="text-xs uppercase tracking-wider text-[#4E3C2B] mr-3 font-medium">Qty</span>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-full text-base font-bold flex items-center justify-center hover:bg-[#DACDB3]/50 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold font-sans">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 10, quantity + 1))}
                    className="w-7 h-7 rounded-full text-base font-bold flex items-center justify-center hover:bg-[#DACDB3]/50 transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAdding ? 'Placing in Bag...' : 'Add to Bag'}</span>
                </button>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full bg-[#362B21] hover:bg-[#4E3C2B] text-[#FAF7F0] font-sans font-bold py-3.5 px-6 rounded-full text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Purchase Now</span>
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
                <h2 className="font-serif text-3xl text-[#362B21] font-light">Complementary Masterpieces</h2>
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
                        src={rel.thumbnail || (rel.images && rel.images[0]) || rel.texture || rel.image}
                        alt={rel.name}
                        loading="lazy"
                        decoding="async"
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
                      ₹{(rel.price || 0).toLocaleString()}
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
