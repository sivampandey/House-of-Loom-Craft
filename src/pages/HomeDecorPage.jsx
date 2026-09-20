import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Eye, Sparkles, Check, Heart } from 'lucide-react';
import SEO from '../components/common/SEO';
import { decorProducts, decorCategories } from '../data/decor';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function HomeDecorPage({ onOpenQuickView, onShowToast }) {
  const [activeCategory, setActiveCategory] = useState('All Decor');
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const filteredProducts = activeCategory === 'All Decor'
    ? decorProducts
    : decorProducts.filter(p => p.category === activeCategory);

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      if (onShowToast) {
        onShowToast('cart', 'Added to Bag', `${product.name} placed in your shopping bag.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Cart Error', err.message);
      }
    }
  };

  const handleWishlistClick = async (product, e) => {
    e.stopPropagation();
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
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filterable Products Showcase */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DACDB3]">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block mb-1">
                CURATED OBJECTS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
                Explore the Collection
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {decorCategories.filter(cat => cat !== 'Artisan Baskets').map((cat) => (
                <button
                  key={cat}
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

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((item) => {
              const wishlisted = isWishlisted(item.id);

              return (
                <div
                  key={item.id}
                  className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 card-hover-lift"
                >
                  <div>
                    {/* Top Row: Category & Wishlist */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[#55694A] font-sans font-bold">
                        {item.category === 'Cashmere Throws' ? 'Throws & Blankets' : item.category}
                      </span>
                      <button
                        onClick={(e) => handleWishlistClick(item, e)}
                        className={`p-2 rounded-full border transition-colors ${
                          wishlisted
                            ? 'bg-[#55694A] text-[#FAF7F0] border-[#55694A]'
                            : 'border-[#55694A]/30 text-[#362B21] hover:border-[#55694A]'
                        }`}
                        aria-label="Save to Wishlist"
                      >
                        <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Image Container with Quick View click */}
                    <div
                      onClick={() => onOpenQuickView && onOpenQuickView(item)}
                      className="aspect-[4/3] rounded-xl bg-[#E2D8C3] p-4 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      {item.badge && (
                        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#55694A] text-[#FAF7F0] font-bold shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    {/* Product Meta */}
                    <div className="mt-4 space-y-1.5">
                      <h3
                        onClick={() => onOpenQuickView && onOpenQuickView(item)}
                        className="font-serif text-xl text-[#362B21] font-medium leading-snug group-hover:text-[#55694A] transition-colors cursor-pointer line-clamp-2"
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      {item.dimensions && (
                        <p className="text-[11px] text-[#55694A] font-mono font-medium pt-1">
                          Dimensions: {item.dimensions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Price and Actions */}
                  <div className="mt-5 pt-4 border-t border-[#DACDB3]/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#55694A] block font-sans font-semibold">
                        PRICE
                      </span>
                      <span className="font-sans font-bold text-xl text-[#362B21]">
                        {item.formattedPrice || `₹${item.price?.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenQuickView && onOpenQuickView(item)}
                        className="bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-3.5 py-2.5 rounded-lg text-xs uppercase tracking-widest font-sans font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span>View Details</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleAddToCart(item, e)}
                        className="p-2.5 rounded-lg bg-[#362B21] hover:bg-[#4E3C2B] text-[#FAF7F0] active:scale-95 transition-all shadow-sm flex items-center justify-center min-w-[38px] min-h-[38px]"
                        title="Add to Bag"
                        aria-label={`Add ${item.name} to Bag`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              Craft Origins Across India
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              Every home decor accent is produced in micro-batches with regional craft families across Uttar Pradesh, Rajasthan, and Kashmir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {craftHighlights.map((craft, idx) => (
              <div key={idx} className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
                <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold block">
                  {craft.region}
                </span>
                <h3 className="font-serif text-2xl text-[#362B21] font-medium">{craft.title}</h3>
                <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                  {craft.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interior Styling Editorial Section */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 rounded-2xl overflow-hidden shadow-xl border border-[#DACDB3] bg-[#EFE8DC] aspect-[16/11]">
            <img
              src="/images/room-after.jpg"
              alt="Sculptural travertine table and wool rug interior styling"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="lg:col-span-6 space-y-5">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold block">
              INTERIOR STYLING
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light leading-tight">
              Creating Layered Tactile Sanctuaries
            </h2>
            <p className="text-xs sm:text-sm text-[#4E3C2B] font-sans leading-relaxed">
              True luxury does not overwhelm; it comforts. By pairing hand-knotted wool foundations with raw chiseled travertine, heavy linen cushions, and living antique brass, our pieces ground contemporary interiors in serene permanence.
            </p>
            <div className="pt-2">
              <Link
                to="/carpets"
                className="inline-flex items-center gap-2 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-6 py-3 rounded-lg text-xs uppercase tracking-widest font-sans font-bold transition-all shadow-md"
              >
                <span>Pair with Handcrafted Carpets</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decor CTA */}
      <section className="px-6 md:px-12 py-8">
        <div className="max-w-7xl mx-auto bg-[#3D4C35] text-[#FAF7F0] rounded-3xl p-8 sm:p-12 md:p-14 text-center space-y-6 shadow-2xl border border-[#5B6E51]">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold block">
            TRADE & BESPOKE ACCENTS
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light">
            Custom Dimensions & Trade Inquiries
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF7F0]/80 font-sans max-w-xl mx-auto leading-relaxed">
            Need bespoke dimensions, custom cushion fills, or trade volume sourcing for an interior project? Our team is available to assist.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="bg-[#D4BC9F] hover:bg-[#FAF7F0] text-[#362B21] font-sans font-bold px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md"
            >
              Contact Our Team
            </Link>
            <Link
              to="/collections"
              className="border border-[#FAF7F0]/40 hover:border-[#FAF7F0] text-[#FAF7F0] font-sans font-medium px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all"
            >
              Explore All Collections
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
