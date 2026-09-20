import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Sparkles, Check, Compass, Feather, Scissors, Sun, ShieldCheck } from 'lucide-react';
import SEO from '../components/common/SEO';
import { carpetsData, collectionsList } from '../data/carpets';
import { productsAPI } from '../services/api';
import { useWishlist } from '../context/WishlistContext';

export default function CarpetsPage({ onOpenQuickView, onShowToast }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [carpets, setCarpets] = useState(carpetsData);
  const [loading, setLoading] = useState(false);

  const { wishlistItems, toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    const fetchCarpets = async () => {
      try {
        const params = {};
        if (activeCategory !== 'all') {
          params.collection = activeCategory;
        }
        const res = await productsAPI.getProducts(params);
        if (res.success && res.products && res.products.length > 0) {
          setCarpets(res.products);
        } else {
          setCarpets(
            activeCategory === 'all'
              ? carpetsData
              : carpetsData.filter(c => c.collection === activeCategory || c.category.toLowerCase().includes(activeCategory))
          );
        }
      } catch (e) {
        setCarpets(
          activeCategory === 'all'
            ? carpetsData
            : carpetsData.filter(c => c.collection === activeCategory || c.category.toLowerCase().includes(activeCategory))
        );
      }
    };
    fetchCarpets();
  }, [activeCategory]);

  const handleWishlistClick = async (carpet, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await toggleWishlist(carpet);
      if (onShowToast) {
        onShowToast('wishlist', res.saved ? 'Saved to Wishlist' : 'Removed from Wishlist', res.message);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Wishlist Error', err.message);
      }
    }
  };

  const filteredCarpets = activeCategory === 'all'
    ? carpets
    : carpets.filter(c => c.collection === activeCategory || c.category?.toLowerCase().includes(activeCategory));

  const weaveMethods = [
    {
      title: 'Hand Knotted Weaving',
      kpsi: '250 – 600 Knots / Sq. In.',
      duration: '6 to 14 Months',
      desc: 'Each knot is tied by hand around vertical cotton or silk warps on traditional timber looms in Bhadohi. Provides unmatched tensile strength and generational longevity.',
      materials: 'High-Plateau Wool & Pure Mulberry Silk'
    },
    {
      title: 'Hand Tufted Sculpting',
      kpsi: 'Architectural High-Low Pile',
      duration: '2 to 4 Months',
      desc: 'Wool tufts are punched through stretched natural cotton canvas with precision tools, followed by hand-shearing and beveling to produce dimensional contours.',
      materials: 'Pure New Zealand Wool & Bamboo Silk Inlay'
    },
    {
      title: 'Artisanal Flatweave & Kilims',
      kpsi: 'Slit-Tapestry Interlock',
      duration: '1 to 3 Months',
      desc: 'Interlocking warp and weft yarns create durable, dual-sided reversible textiles with geometric clarity and organic warmth.',
      materials: 'Organic Indian Sheep Wool & Jute Core'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-24 sm:pt-28 pb-20">
      <SEO
        title="Handcrafted Carpets & Rugs | House of Loom & Craft Bhadohi"
        description="Explore luxury hand-knotted, hand-tufted, and handloom rugs from House of Loom & Craft. Handcrafted in Bhadohi with high knot density, virgin fleece, and natural botanical dyes."
        path="/carpets"
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Carpets', url: '/carpets' }
        ]}
      />

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-10 pb-16 md:pb-24 border-b border-[#DACDB3]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                CRAFTED IN BHADOHI, INDIA
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
              Handcrafted Carpets & Rugs
            </h1>
            <p className="font-sans text-sm sm:text-base md:text-lg text-[#4E3C2B] font-medium leading-relaxed max-w-2xl">
              Generational master knotting, unbleached mountain fleece, and living vegetable dyes. Every rug is an architectural foundation designed to ground contemporary living spaces.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-[#DACDB3]/70">
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-[#55694A] font-light block">Bhadohi</span>
              <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-sans font-medium">Craft Origin</span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-[#55694A] font-light block">200–600</span>
              <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-sans font-medium">KPSI Knot Density</span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-[#55694A] font-light block">100% Pure</span>
              <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-sans font-medium">Natural Fibers</span>
            </div>
            <div>
              <span className="font-serif text-2xl sm:text-3xl text-[#55694A] font-light block">Custom</span>
              <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-sans font-medium">Bespoke Scales</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rug Categories & Interactive Product Showcase */}
      <section className="px-6 md:px-12 py-16">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DACDB3]">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block mb-1">
                CURATED CATALOGUE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
                Explore by Weave & Collection
              </h2>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {collectionsList.map((col) => (
                <button
                  key={col.id}
                  onClick={() => setActiveCategory(col.id)}
                  className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium ${
                    activeCategory === col.id
                      ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                      : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
                  }`}
                >
                  {col.name} ({col.count})
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCarpets.map((carpet) => {
              const carpetSlug = carpet.slug || carpet.id;
              const wishlisted = isWishlisted(carpet.slug || carpet.id || carpet._id);

              return (
                <div
                  key={carpet.id}
                  className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] p-6 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 card-hover-lift"
                >
                  <div>
                    {/* Top Row: Category & Wishlist */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[#55694A] font-sans font-bold">
                        {carpet.category || carpet.collectionName}
                      </span>
                      <button
                        onClick={(e) => handleWishlistClick(carpet, e)}
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

                    {/* Image with Quick View trigger */}
                    <div
                      onClick={() => onOpenQuickView && onOpenQuickView(carpet)}
                      className="aspect-[4/3] rounded-xl bg-[#E2D8C3] p-4 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm"
                    >
                      <img
                        src={carpet.thumbnail || carpet.image || carpet.texture}
                        alt={carpet.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                      />
                      {carpet.badge && (
                        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#55694A] text-[#FAF7F0] font-bold shadow-sm">
                          {carpet.badge}
                        </span>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="mt-4 space-y-1.5">
                      <h3 className="font-serif text-xl text-[#362B21] font-medium leading-snug group-hover:text-[#55694A] transition-colors line-clamp-2">
                        {carpet.name}
                      </h3>
                      <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed line-clamp-2">
                        {carpet.description}
                      </p>
                      {carpet.dimensions && (
                        <p className="text-[11px] text-[#55694A] font-mono font-medium pt-1">
                          Dimensions: {carpet.dimensions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Price and View Details CTA */}
                  <div className="mt-5 pt-4 border-t border-[#DACDB3]/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#55694A] block font-sans font-semibold">
                        PRICE
                      </span>
                      <span className="font-sans font-bold text-xl text-[#362B21]">
                        {carpet.formattedPrice || `₹${carpet.price?.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${carpetSlug}`}
                        className="bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] px-4 py-2.5 rounded-lg text-xs uppercase tracking-widest font-sans font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Materials & Fibers Section */}
      <section className="px-6 md:px-12 py-16 bg-[#EFE8DC] border-y border-[#DACDB3]/70">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl space-y-3 mb-12">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              MATERIAL INTEGRITY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
              Pure Fibers & Botanical Dyes
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              We select raw fibers for tactile softness, resilience under footfall, and organic luster.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
                <Feather className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">High-Plateau Virgin Wool</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Harvested from high-altitude sheep with natural lanolin retention. Provides natural soil resistance, resilient spring-back pile, and acoustic absorption.
              </p>
            </div>

            <div className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Pure Mulberry & Bamboo Silk</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Hand-spun silk inlays illuminate intricate medallion curves and floral spandrels, reflecting ambient sunlight throughout different times of day.
              </p>
            </div>

            <div className="bg-[#FAF7F0] p-8 rounded-2xl border border-[#DACDB3] space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#55694A]/10 text-[#55694A] flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl text-[#362B21] font-medium">Open-Air Botanical Dyes</h3>
              <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed">
                Madder root, fermented natural indigo, walnut rinds, and pomegranate peel aged under the Uttar Pradesh sun for subtle living abrash variations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship & Weaving Method Details */}
      <section className="px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="max-w-3xl space-y-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              WEAVING DISCIPLINES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
              Indian Craftsmanship & Weave Techniques
            </h2>
            <p className="text-sm text-[#4E3C2B] font-sans leading-relaxed">
              Every method preserves a specific tactile feel, pile density, and spatial role within the home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {weaveMethods.map((m, idx) => (
              <div key={idx} className="bg-[#EFE8D8] p-8 rounded-2xl border border-[#DACDB3] flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-mono font-bold text-[#55694A]">0{idx + 1}</span>
                  <h3 className="font-serif text-2xl text-[#362B21] font-medium">{m.title}</h3>
                  <div className="space-y-1 pt-1 text-xs">
                    <p className="text-[#362B21] font-bold"><span className="text-[#4E3C2B] font-normal">Density:</span> {m.kpsi}</p>
                    <p className="text-[#362B21] font-bold"><span className="text-[#4E3C2B] font-normal">Craft Duration:</span> {m.duration}</p>
                  </div>
                  <p className="text-xs text-[#4E3C2B] font-sans leading-relaxed pt-2">
                    {m.desc}
                  </p>
                </div>
                <div className="pt-4 border-t border-[#DACDB3]/70 text-[11px] text-[#55694A] font-medium">
                  {m.materials}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bespoke / Custom Commission CTA */}
      <section className="px-6 md:px-12 py-12">
        <div className="max-w-7xl mx-auto bg-[#3D4C35] text-[#FAF7F0] rounded-3xl p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-2xl border border-[#5B6E51]">
          <div className="max-w-2xl space-y-6 relative z-10">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4BC9F] font-sans font-bold">
              BESPOKE ARCHITECTURAL SCALES
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#FAF7F0] font-light leading-tight">
              Commission a Custom Rug Tailored to Your Space
            </h2>
            <p className="text-xs sm:text-sm text-[#FAF7F0]/85 font-sans leading-relaxed">
              Work directly with our Bhadohi master draftsmen to specify exact room dimensions, knot densities, color palettes, and geometric silhouettes.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/contact"
                className="bg-[#D4BC9F] hover:bg-[#FAF7F0] text-[#362B21] font-sans font-bold px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md"
              >
                Inquire for Custom Commission
              </Link>
              <Link
                to="/collections"
                className="border border-[#FAF7F0]/40 hover:border-[#FAF7F0] text-[#FAF7F0] font-sans font-medium px-7 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all"
              >
                View Full Showroom
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
