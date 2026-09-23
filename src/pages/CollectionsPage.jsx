import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { productsAPI } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { collectionsList, carpetsData } from '../data/carpets';
import { normalizeProductList } from '../utils/productUtils';
import ProductCard from '../components/common/ProductCard';
import CurrencySelector from '../components/common/CurrencySelector';

export default function CollectionsPage({ onOpenQuickView, onShowToast }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeCollection, setActiveCollection] = useState(slug || 'all');
  const [products, setProducts] = useState(() => normalizeProductList(carpetsData));
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    setActiveCollection(slug || 'all');
  }, [slug]);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeCollection !== 'all') {
          params.collection = activeCollection;
        }
        if (sortBy) {
          params.sort = sortBy;
        }

        const res = await productsAPI.getProducts(params);
        if (isMounted && res?.success && Array.isArray(res.products) && res.products.length > 0) {
          setProducts(normalizeProductList(res.products));
        } else if (isMounted) {
          // If viewing standard collections and DB has none, provide graceful seed fallback
          if (activeCollection === 'all') {
            setProducts(normalizeProductList(carpetsData));
          } else {
            const seedMatches = carpetsData.filter(c => c.collection === activeCollection);
            setProducts(seedMatches.length > 0 ? normalizeProductList(seedMatches) : []);
          }
        }
      } catch (err) {
        if (isMounted) {
          const seedMatches = activeCollection === 'all' 
            ? carpetsData 
            : carpetsData.filter(c => c.collection === activeCollection);
          setProducts(normalizeProductList(seedMatches));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [activeCollection, sortBy]);

  const handleCollectionChange = (colId) => {
    setActiveCollection(colId);
    if (colId === 'all') {
      navigate('/collections');
    } else {
      navigate(`/collections/${colId}`);
    }
  };

  const handleToggleWishlist = async (product, e) => {
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

  const activeColObj = collectionsList.find(c => c.id === activeCollection) || collectionsList[0];

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title="Curated Collections | House of Loom & Craft Bhadohi"
        description="Explore curated collections of generational hand-knotted, hand-tufted, handloom, and architectural heirloom carpets from our Bhadohi atelier."
        path={`/collections${activeCollection !== 'all' ? `/${activeCollection}` : ''}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Collections', url: '/collections' },
          ...(activeCollection !== 'all' ? [{ name: activeColObj.name, url: `/collections/${activeCollection}` }] : [])
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#DACDB3]">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
              OUR ATELIER PORTFOLIO
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
              {activeColObj.name}
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#4E3C2B] leading-relaxed">
              {activeColObj.subtitle || 'Heirloom carpets uniting master knotting traditions with understated contemporary architecture.'}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#EFE8D8] border border-[#DACDB3] rounded-full px-4 py-2 text-xs font-sans text-[#362B21] focus:outline-none focus:border-[#55694A] transition-colors"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Collection Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto py-6 scrollbar-none border-b border-[#DACDB3]/60 mb-12">
          {collectionsList.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => handleCollectionChange(col.id)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 font-sans font-medium ${
                activeCollection === col.id
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-md border border-[#6D7F62]'
                  : 'bg-[#E5DCB8]/60 text-[#4E3C2B] hover:bg-[#DBCFB8] border border-[#DACDB3]'
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>

        {/* Results Toolbar with Currency Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 pt-2 border-b border-[#DACDB3]/70">
          <span className="text-xs uppercase tracking-wider text-[#55694A] font-sans font-bold">
            {products.length} {products.length === 1 ? 'Creation' : 'Creations'} in Collection
          </span>
          <CurrencySelector variant="editorial" />
        </div>

        {/* Product Grid */}
        {loading && products.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Loading Products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-12">
            <p className="font-serif text-2xl text-[#362B21]">No Products Found in this Collection</p>
            <p className="text-xs text-[#4E3C2B] max-w-md mx-auto">
              Please choose another collection tab or request a bespoke commission directly from our workshop.
            </p>
            <button
              type="button"
              onClick={() => handleCollectionChange('all')}
              className="mt-4 px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full hover:bg-[#657C58] transition-colors"
            >
              View All Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {products.map((product) => {
              const pId = product.slug || product.id || product._id;
              return (
                <ProductCard
                  key={pId}
                  product={product}
                  onQuickView={onOpenQuickView}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={isWishlisted(pId)}
                  imageFit="object-cover"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
