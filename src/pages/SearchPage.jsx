import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X, ArrowRight, Heart, ShoppingBag } from 'lucide-react';
import SEO from '../components/common/SEO';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function SearchPage({ onShowToast }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery.trim());
    }
  }, [initialQuery]);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await productsAPI.searchProducts(term);
      if (res.success && res.results) {
        setResults(res.results);
      }
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ q: query });
    handleSearch(query);
  };

  const popularPills = [
    'Hand Knotted',
    'Silk Weft',
    'Crimson Medallion',
    'New Zealand Wool',
    'Sculpted High-Low',
    'Bespoke Custom'
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title="Search Handcrafted Rugs | House of Loom & Craft"
        description="Search our handcrafted carpets, flatweaves, and home decor by collection, material, knot density, and dimension."
        path="/search"
      />

      <div className="max-w-5xl mx-auto px-6 md:px-12">
        {/* Search Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
            SEARCH
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#362B21] font-light">
            Search Our Collections
          </h1>
          <p className="text-xs sm:text-sm text-[#4E3C2B]">
            Find rugs by name, collection, material, weave type, or room dimension.
          </p>
        </div>

        {/* Search Bar Input */}
        <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-8">
          <div className="relative flex items-center">
            <SearchIcon className="w-5 h-5 text-[#55694A] absolute left-5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search carpets, linen cushions, handloom weaves..."
              className="w-full bg-[#EFE8D8] border border-[#DACDB3] focus:border-[#55694A] rounded-full py-4 pl-14 pr-24 text-sm text-[#362B21] placeholder-[#4E3C2B]/60 focus:outline-none shadow-sm transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                }}
                className="absolute right-14 text-[#4E3C2B]/60 hover:text-[#362B21] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-5 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold rounded-full hover:bg-[#6D8262] transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-16 max-w-2xl mx-auto">
          <span className="text-xs text-[#4E3C2B] font-medium mr-1">Suggestions:</span>
          {popularPills.map((pill) => (
            <button
              key={pill}
              onClick={() => {
                setQuery(pill);
                setSearchParams({ q: pill });
                handleSearch(pill);
              }}
              className="px-3.5 py-1.5 rounded-full text-[11px] bg-[#E5DCB8]/60 hover:bg-[#DBCFB8] text-[#362B21] border border-[#DACDB3] transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Results Container */}
        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Searching Catalog...</p>
          </div>
        ) : searched && results.length === 0 ? (
          <div className="text-center py-16 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-10 space-y-4">
            <h3 className="font-serif text-2xl text-[#362B21]">No Products Match "{query}"</h3>
            <p className="text-xs text-[#4E3C2B] max-w-md mx-auto leading-relaxed">
              We could not find an exact match for your search. Browse our collections or contact us for custom rug options.
            </p>
            <Link
              to="/collections"
              className="inline-block px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-bold rounded-full mt-2"
            >
              Browse All Collections
            </Link>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-[#55694A] font-bold">
              Found {results.length} Product{results.length === 1 ? '' : 's'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => {
                const pId = product.slug || product._id;
                const wishlisted = isWishlisted(pId);

                return (
                  <div
                    key={pId}
                    onClick={() => navigate(`/products/${product.slug || pId}`)}
                    className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] flex flex-col justify-between shadow-sm hover:shadow-lg transition-all cursor-pointer p-4"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#E8E2D4] mb-3 relative">
                      <img
                        src={product.thumbnail || (product.images && product.images[0]) || product.texture}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const res = await toggleWishlist(product);
                          if (onShowToast) onShowToast('wishlist', res.saved ? 'Saved' : 'Removed', res.message);
                        }}
                        className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-colors ${
                          wishlisted ? 'bg-[#55694A] text-[#FAF7F0]' : 'bg-[#FAF7F0]/80 text-[#362B21]'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#55694A] font-bold block mb-1">
                        {product.collectionName || product.category}
                      </span>
                      <h4 className="font-serif text-lg text-[#362B21] leading-snug group-hover:text-[#55694A] transition-colors font-medium">
                        {product.name}
                      </h4>
                      {product.dimensions && (
                        <p className="text-[11px] text-[#4E3C2B] mt-0.5">{product.dimensions}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#DACDB3]/70 flex items-center justify-between mt-3">
                      <span className="font-sans font-bold text-sm text-[#362B21]">
                        ₹{(product.price || 0).toLocaleString()}
                      </span>
                      <span className="text-[11px] uppercase tracking-wider text-[#55694A] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
