import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Eye, Sparkles, Check, Heart } from 'lucide-react';
import SEO from '../components/common/SEO';
import { decorProducts, decorCategories } from '../data/decor';
import { productsAPI } from '../services/api';
import { normalizeProductList, DEFAULT_FALLBACK_IMAGE } from '../utils/productUtils';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import ProductCard from '../components/common/ProductCard';
import CurrencySelector from '../components/common/CurrencySelector';

export default function HomeDecorPage({ onOpenQuickView, onShowToast }) {
  const { formatPrice } = useCurrency();
  const [activeCategory, setActiveCategory] = useState('All Decor');
  const [products, setProducts] = useState(() => normalizeProductList(decorProducts));
  const [loading, setLoading] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    let isMounted = true;
    const fetchDecor = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getProducts({ collection: 'home-decor', limit: 50 });
        if (isMounted && res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setProducts(normalizeProductList(res.products));
        }
      } catch (err) {
        // Safe fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDecor();
    return () => { isMounted = false; };
  }, []);

  const filteredProducts = activeCategory === 'All Decor'
    ? products
    : products.filter(p => p.category === activeCategory);

  const handleWishlistClick = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const res = await toggleWishlist(product);
      if (onShowToast) {
        onShowToast('wishlist', res.saved ? 'Saved to Wishlist' : 'Removed from Wishlist', res.message);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Wishlist Error', err.message);
      }
    }
  };

  const craftHighlights = [
    {
      title: 'Hand-Hammered Antique Brass',
      region: 'Moradabad, India',
      desc: 'Formed by master metalsmiths through thousands of precision hand-hammer strikes. Finished with a natural aged living patina that deepens with ambient exposure.'
    },
    {
      title: 'Grade-A Himalayan Cashmere',
      region: 'Leh-Ladakh, India',
      desc: 'Spun on traditional wooden charkha wheels from cloud-soft high-altitude fleece. Woven with delicate hand-twisted eyelash fringe in natural sand hues.'
    },
    {
      title: 'Honed Roman Travertine',
      region: 'Jaipur, India',
      desc: 'Carved from solid geological limestone blocks. Features raw chiseled perimeter edges contrasted with satiny honed top surfaces.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-20">
      <SEO
        title="House of Loom & Craft | Home Decor & Architectural Accents"
        description="Explore handcrafted architectural accents, hand-embroidered cushions, cashmere throws, bouclé poufs, brass urns, and stone tables from House of Loom & Craft."
        path="/home-decor"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Home Decor', url: '/home-decor' }
        ]}
      />

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-10 pb-16 md:pb-24 border-b border-[#DACDB3]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                BEYOND THE FLOOR
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
              Architectural Accents & Home Decor
            </h1>
            <p className="font-sans text-sm sm:text-base md:text-lg text-[#4E3C2B] font-medium leading-relaxed max-w-2xl">
              Sculptural living objects, tactile embroidered textiles, and hand-beaten metals designed to bring warm materiality, quiet texture, and timeless presence into your space.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-[#DACDB3] bg-[#EFE8DC] aspect-[4/3]">
              <img
                src="/images/decor-editorial.jpg"
                alt="Atmospheric home decor styling"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Filter Grid */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DACDB3]">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block mb-1">
                CURATED LIVING OBJECTS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
                Atelier Decor Pieces
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {decorCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium ${
                    activeCategory === cat
                      ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                      : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
                  }`}
                >
                  {cat === 'Cashmere Throws' ? 'Throws & Blankets' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Toolbar with Currency Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#DACDB3]/50">
            <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Decor Object' : 'Decor Objects'} Available
            </span>
            <CurrencySelector variant="editorial" />
          </div>

          {/* Product Cards Grid */}
          {loading && products.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Loading Decor Objects...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-12">
              <p className="font-serif text-2xl text-[#362B21]">No Objects in this Category</p>
              <p className="text-xs text-[#4E3C2B] max-w-md mx-auto">
                Please select another decor category or view all home decor pieces.
              </p>
              <button
                type="button"
                onClick={() => setActiveCategory('All Decor')}
                className="mt-4 px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full hover:bg-[#657C58] transition-colors"
              >
                View All Decor
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
              {filteredProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onQuickView={onOpenQuickView}
                  onToggleWishlist={handleWishlistClick}
                  isWishlisted={isWishlisted(item.id)}
                  imageFit="object-contain"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Materials and Craftsmanship Section */}
      <section className="px-6 md:px-12 py-16 bg-[#EFE8DC] border-y border-[#DACDB3]/70">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              ARTISAN MATERIALITY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
              Craft Techniques & Living Patinas
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              Objects designed to acquire soul through touch and ambient exposure over decades of residence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {craftHighlights.map((craft, i) => (
              <div key={i} className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#DACDB3] space-y-3 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-[#55694A] font-bold block">
                  {craft.region}
                </span>
                <h3 className="font-serif text-2xl text-[#362B21] font-medium">{craft.title}</h3>
                <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">{craft.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
