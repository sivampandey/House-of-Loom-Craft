import React, { useState, useEffect } from 'react';
import { collectionsList, carpetsData } from '../../data/carpets';
import { productsAPI } from '../../services/api';
import { normalizeProductList } from '../../utils/productUtils';
import ProductCard from '../common/ProductCard';
import CurrencySelector from '../common/CurrencySelector';

export default function FeaturedCarpets({
  onQuickView,
  onToggleWishlist,
  wishlistIds = [],
  activeCollectionFilter = 'all',
  onSelectCollectionFilter
}) {
  const [featuredProducts, setFeaturedProducts] = useState(() => normalizeProductList(carpetsData));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getProducts({ isFeatured: 'true', limit: 30 });
        if (isMounted && res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setFeaturedProducts(normalizeProductList(res.products));
        }
      } catch (err) {
        // Safe fallback to normalized initial data
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeatured();
    return () => { isMounted = false; };
  }, []);

  const filteredCarpets = activeCollectionFilter === 'all'
    ? featuredProducts
    : featuredProducts.filter(
        c => c.collection === activeCollectionFilter || 
             c.category.toLowerCase().includes(activeCollectionFilter)
      );

  return (
    <section id="featured" className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                CURATED COLLECTIONS
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              Featured Heirlooms
            </h2>
          </div>

          {/* Collection Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {collectionsList.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => onSelectCollectionFilter(col.id)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium ${
                  activeCollectionFilter === col.id
                    ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                    : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
                }`}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Toolbar with Currency Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-2 border-b border-[#DACDB3]/50">
          <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold">
            {filteredCarpets.length} {filteredCarpets.length === 1 ? 'Featured Piece' : 'Featured Pieces'}
          </span>
          <CurrencySelector variant="editorial" />
        </div>

        {/* Product Grid Stage */}
        {loading && featuredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">
              Curating Featured Heirlooms...
            </p>
          </div>
        ) : filteredCarpets.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-12 mt-12">
            <p className="font-serif text-2xl text-[#362B21]">No Featured Pieces in this Collection</p>
            <p className="text-xs text-[#4E3C2B] max-w-md mx-auto">
              Our master weavers are continually registering new pieces. Select another collection tab or explore all collections.
            </p>
            <button
              type="button"
              onClick={() => onSelectCollectionFilter('all')}
              className="mt-4 px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full hover:bg-[#657C58] transition-colors"
            >
              View All Featured Pieces
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mt-12 sm:mt-14">
            {filteredCarpets.map((carpet) => {
              const pId = carpet.slug || carpet.id || carpet._id;
              const isWish = Array.isArray(wishlistIds) && wishlistIds.includes(pId);

              return (
                <ProductCard
                  key={pId}
                  product={carpet}
                  onQuickView={onQuickView}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={isWish}
                  imageFit="object-cover"
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
