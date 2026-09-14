import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stockStatus, setStockStatus] = useState('all');
  const [status, setStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Delete modal state
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getProducts({
        search,
        category,
        stockStatus,
        status,
        sort,
        page,
        limit: 15
      });
      if (res?.success) {
        setProducts(res.products || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, stockStatus, status, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalProduct) return;
    setIsDeleting(true);
    try {
      const res = await adminAPI.deleteProduct(deleteModalProduct._id);
      setToastMessage(res.message || 'Product updated successfully.');
      setDeleteModalProduct(null);
      fetchProducts();
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err) {
      alert(err.message || 'Unable to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DACDB3]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#55694A] font-sans font-bold block">
            Inventory & Catalog Management
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light mt-1">
            Products
          </h1>
          <p className="text-xs text-[#544131]/70 font-sans mt-0.5">
            {total} items in database ({products.length} displayed on page {page})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2 rounded-xl border border-[#DACDB3] bg-[#EFE8D8] text-[#362B21] hover:bg-[#E2D8C3]"
            title="Reload catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase tracking-wider font-sans font-bold rounded-xl transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-sans flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="font-bold">&times;</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8F6E50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, material, slug..."
              className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl pl-10 pr-20 py-2 text-xs text-[#362B21] placeholder-[#544131]/40 focus:outline-none focus:border-[#55694A]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#55694A] text-[#FAF7F0] text-[10px] uppercase tracking-wider font-bold rounded-lg"
            >
              Search
            </button>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Stock Status Dropdown */}
            <select
              value={stockStatus}
              onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock (&gt;5)</option>
              <option value="low_stock">Low Stock (≤5)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            {/* Visibility Status */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="all">All Visibility</option>
              <option value="active">Active / Published</option>
              <option value="inactive">Inactive / Draft</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-[#FAF7F0] border border-[#DACDB3] text-xs rounded-xl px-3 py-2 text-[#362B21] font-sans focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs uppercase tracking-wider text-[#544131]/70 font-sans block">
              Retrieving Catalog Items...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="w-12 h-12 text-[#8F6E50]/40 mx-auto" />
            <h2 className="font-serif text-xl text-[#362B21] font-light">No Products Found</h2>
            <p className="text-xs text-[#544131]/70 font-sans max-w-sm mx-auto">
              No catalog pieces match your active search or filter criteria.
            </p>
            <button
              onClick={() => { setSearch(''); setCategory('all'); setStockStatus('all'); setStatus('all'); }}
              className="px-4 py-1.5 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-wider rounded-lg font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#E8DFD0] border-b border-[#DACDB3] text-[10px] uppercase tracking-wider text-[#8F6E50] font-bold">
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category & Collection</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Visibility</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DACDB3]/60">
                {products.map((p) => {
                  const isLow = p.stock <= 5 && p.stock > 0;
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-[#FAF7F0]/60 transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail || (p.images && p.images[0]) || '/images/room-after.jpg'}
                            alt={p.name}
                            className="w-12 h-12 rounded-lg object-cover bg-[#EAE2D2] shrink-0 border border-[#DACDB3]"
                          />
                          <div className="max-w-[200px] sm:max-w-xs">
                            <span className="font-serif text-sm font-medium text-[#362B21] block truncate" title={p.name}>
                              {p.name}
                            </span>
                            <span className="text-[10px] text-[#544131]/60 font-mono block truncate">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Collection */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-[#362B21] block">
                          {p.category}
                        </span>
                        <span className="text-[10px] text-[#55694A] font-medium block">
                          {p.collectionName || p.collection}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#362B21] block">
                          {formatINR(p.price)}
                        </span>
                        {p.compareAtPrice && (
                          <span className="text-[10px] text-[#544131]/60 line-through block">
                            {formatINR(p.compareAtPrice)}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          isOut
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {isOut ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      </td>

                      {/* Active / Draft */}
                      <td className="py-3 px-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-stone-500">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      {/* Featured */}
                      <td className="py-3 px-4">
                        {p.isFeatured ? (
                          <span className="px-2 py-0.5 rounded bg-[#BA9977]/20 text-[#8F6E50] border border-[#BA9977]/40 text-[9.5px] uppercase tracking-wider font-bold">
                            Featured
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#544131]/40">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/products/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-[#DACDB3] text-[#4E3C2B] hover:bg-[#E2D8C3]"
                            title="View product in storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            to={`/admin/products/${p._id}/edit`}
                            className="p-1.5 rounded-lg border border-[#DACDB3] text-[#55694A] hover:bg-[#55694A] hover:text-[#FAF7F0] transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => setDeleteModalProduct(p)}
                            className="p-1.5 rounded-lg border border-[#DACDB3] text-[#B24C40] hover:bg-[#B24C40]/10 transition-colors"
                            title="Delete or unpublish product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#DACDB3] flex items-center justify-between">
            <span className="text-xs text-[#544131]/70">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg border border-[#DACDB3] text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded-lg border border-[#DACDB3] text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-full bg-[#B24C40]/10 text-[#B24C40] flex items-center justify-center mx-auto border border-[#B24C40]/20">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="font-serif text-xl text-[#362B21]">
                Delete this Product?
              </h2>
              <p className="text-xs text-[#544131]/80 leading-relaxed">
                Are you sure you want to remove <strong className="text-[#362B21]">"{deleteModalProduct.name}"</strong>?
              </p>
              <p className="text-[11px] text-[#8F6E50] bg-[#FAF7F0] p-3 rounded-xl border border-[#DACDB3] text-left">
                Safety Protocol: If this item has existing historical orders, the database will safely unpublish (set to inactive) rather than break customer order records.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalProduct(null)}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl border border-[#DACDB3] text-xs uppercase tracking-wider font-bold text-[#4E3C2B] hover:bg-[#E2D8C3]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-[#B24C40] hover:bg-[#993E34] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold shadow-md disabled:opacity-50"
              >
                {isDeleting ? 'Processing...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
