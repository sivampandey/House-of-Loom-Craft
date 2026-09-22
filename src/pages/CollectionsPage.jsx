import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Eye, ArrowLeft, SlidersHorizontal, Sparkles } from 'lucide-react';
import SEO from '../components/common/SEO';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { collectionsList, carpetsData } from '../data/carpets';
import { useCurrency } from '../context/CurrencyContext';

export default function CollectionsPage({ onOpenQuickView, onShowToast }) {
  const { formatPrice } = useCurrency();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeCollection, setActiveCollection] = useState(slug || 'all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');

  // Update active collection if url slug changes
  useEffect(() => {
    setActiveCollection(slug || 'all');
  }, [slug]);

  useEffect(() => {
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

        const filterExcluded = (list = []) => list.filter(p =>
          p.slug !== 'travertine-monolith-coffee-table' &&
          p.id !== 'travertine-monolith-coffee-table' &&
          !p.name?.toLowerCase().includes('travertine')
        );

        const res = await productsAPI.getProducts(params);
        if (res.success && res.products) {
          setProducts(filterExcluded(res.products));
        } else {
          // Fallback to local data
          setProducts(
            filterExcluded(
              activeCollection === 'all'
                ? carpetsData
                : carpetsData.filter(c => c.collection === activeCollection)
            )
          );
        }
      } catch (err) {
        // Safe fallback
        const filterExcluded = (list = []) => list.filter(p =>
          p.slug !== 'travertine-monolith-coffee-table' &&
          p.id !== 'travertine-monolith-coffee-table' &&
          !p.name?.toLowerCase().includes('travertine')
        );
        setProducts(
          filterExcluded(
            activeCollection === 'all'
              ? carpetsData
              : carpetsData.filter(c => c.collection === activeCollection)
          )
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCollection, sortBy]);

  const handleCollectionChange = (colId) => {
    setActiveCollection(colId);
    if (colId === 'all') {
      navigate('/collections');
    } else {
      navigate(`/collections/${colId}`);
    }
  };

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    try {
      await addToCart(product);
      if (onShowToast) {
        onShowToast('cart', 'Added to Bag', `${product.name} placed in your shopping bag.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Error', err.message);
      }
    }
  };

  const handleToggleWishlist = async (product, e) => {
    e.stopPropagation();
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

  const currentCollectionInfo = collectionsList.find(c => c.id === activeCollection) || {
    name: 'All Collections',
    subtitle: 'Heirloom carpets and architectural floor coverings handcrafted in Bhadohi.'
  };

  return (
    <div className="min-h-screen bg-[#F5F0E6] text-[#362B21] pt-28 sm:pt-32 pb-24">
      <SEO
        title={`${currentCollectionInfo.name} | House of Loom & Craft`}
        description={`Explore our collection of ${currentCollectionInfo.name}. Handcrafted with high knot density, organic dyes, and generational craftsmanship.`}
        path={activeCollection === 'all' ? '/collections' : `/collections/${activeCollection}`}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Collections', url: '/collections' },
          ...(activeCollection !== 'all' ? [{ name: currentCollectionInfo.name, url: `/collections/${activeCollection}` }] : [])
        ]}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Breadcrumb & Navigation Back */}
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold mb-8">
          <Link to="/" className="hover:text-[#362B21] transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <span className="text-[#DACDB3]">/</span>
          <span>Collections</span>
          {activeCollection !== 'all' && (
            <>
              <span className="text-[#DACDB3]">/</span>
              <span className="text-[#362B21]">{currentCollectionInfo.name}</span>
            </>
          )}
        </div>

        {/* Collection Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#DACDB3]">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#6D7F62]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
                HANDCRAFTED COLLECTIONS
              </span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light">
              {currentCollectionInfo.name}
            </h1>
            <p className="font-sans text-sm text-[#4E3C2B] font-medium leading-relaxed">
              {currentCollectionInfo.subtitle}
            </p>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-[#55694A]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#EFE8D8] border border-[#DACDB3] text-xs uppercase tracking-wider font-sans font-medium text-[#362B21] px-4 py-2 rounded-full focus:outline-none focus:border-[#6D7F62]"
            >
              <option value="featured">Featured Collections</option>
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

        {/* Product Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm tracking-widest text-[#4E3C2B] uppercase">Loading Products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-12">
            <p className="font-serif text-2xl text-[#362B21]">No Products Found in this Category</p>
            <p className="text-xs text-[#4E3C2B] max-w-md mx-auto">
              Please choose another collection tab or request a bespoke commission.
            </p>
            <button
              onClick={() => handleCollectionChange('all')}
              className="mt-4 px-6 py-2.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-full"
            >
              View All Collections
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {products.map((product) => {
              const pId = product.slug || product.id || product._id;
              const wishlisted = isWishlisted(pId);
              const isDuneSaffron = product.slug === 'terracotta-dune-modern' || product.id === 'terracotta-dune-modern' || product.name?.toLowerCase().includes('dune saffron');
              const isMonolith = product.slug === 'nordic-monolith-abstract' || product.id === 'nordic-monolith-abstract' || product.name?.toLowerCase().includes('monolith');
              const isTapestry = product.slug === 'heritage-indigo-wall-tapestry' || product.id === 'heritage-indigo-wall-tapestry' || product.name?.toLowerCase().includes('tapestry');
              const isSolarium = product.slug === 'solarium-ochre-flatweave' || product.id === 'solarium-ochre-flatweave' || product.name?.toLowerCase().includes('solarium');
              const cardImage = isDuneSaffron
                ? '/images/carpets/dune-saffron-handloom.jpg'
                : isMonolith
                ? '/images/carpets/nordic-monolith-abstract.jpg'
                : isTapestry
                ? '/images/kashmir-wall-tapestry.jpg'
                : isSolarium
                ? '/images/carpets/solarium-ochre-flatweave.jpg'
                : (product.thumbnail || (product.images && product.images[0]) || product.texture || product.image);

              return (
                <div
                  key={pId}
                  onClick={() => navigate(`/products/${product.slug || pId}`)}
                  className="group bg-[#EFE8D8] rounded-2xl overflow-hidden border border-[#DACDB3] flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer card-hover-lift"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#E8E2D4]">
                    <img
                      src={cardImage}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge */}
                    {product.badge && (
                      <span className="absolute top-4 left-4 text-[10px] uppercase tracking-widest bg-[#45563D]/90 text-[#FAF7F0] px-3 py-1 rounded-full font-bold backdrop-blur-sm border border-[#85977A]/40">
                        {product.badge}
                      </span>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={(e) => handleToggleWishlist(product, e)}
                        className={`p-2.5 rounded-full backdrop-blur-md transition-colors ${
                          wishlisted
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0]/80 text-[#362B21] hover:bg-[#FAF7F0]'
                        }`}
                        title="Save to Wishlist"
                        aria-label="Save to Wishlist"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenQuickView) onOpenQuickView({ ...product, image: cardImage });
                        }}
                        className="p-2.5 rounded-full bg-[#FAF7F0]/80 text-[#362B21] hover:bg-[#FAF7F0] backdrop-blur-md transition-colors"
                        title="Quick View"
                        aria-label="Quick View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#55694A] font-sans font-bold uppercase tracking-wider mb-1">
                        <span>{product.collectionName || product.category}</span>
                        {product.knotDensity && (
                          <span className="text-[10px] text-[#4E3C2B]/80 lowercase tracking-normal">
                            {product.knotDensity}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-xl sm:text-2xl text-[#362B21] font-medium leading-snug group-hover:text-[#55694A] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-[#4E3C2B] mt-1 line-clamp-2 leading-relaxed">
                        {product.shortDescription || product.description}
                      </p>
                      {product.dimensions && (
                        <p className="text-[11px] text-[#55694A] font-medium mt-2 font-mono">
                          Dimensions: {product.dimensions}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[#DACDB3]/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#55694A] block font-sans font-semibold">
                          PRICE
                        </span>
                        <span className="font-sans text-lg font-bold text-[#362B21]">
                          {formatPrice(product.price || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${product.slug || product.id}`}
                          className="bg-[#55694A] hover:bg-[#6D8262] text-[#FAF7F0] px-4 py-2 rounded-lg text-xs uppercase tracking-widest font-sans font-bold transition-colors shadow-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          className="p-2 rounded-lg bg-[#362B21] hover:bg-[#4E3C2B] text-[#FAF7F0] transition-colors shadow-sm"
                          title="Add to Bag"
                          aria-label={`Add ${product.name} to Bag`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
