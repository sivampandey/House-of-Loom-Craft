import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { 
  Tag, Plus, Search, Calendar, Percent, IndianRupee, 
  Trash2, Edit, CheckCircle2, XCircle, AlertTriangle, X, RefreshCw
} from 'lucide-react';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Form Modal State (Add/Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    perCustomerLimit: 1,
    isActive: true
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, offer: null, loading: false });

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getOffers();
      const offerList = res?.offers || res?.data?.offers || (Array.isArray(res) ? res : []);
      setOffers(offerList);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError(err.message || err.data?.message || err.response?.data?.message || 'Failed to load promotional offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: 0,
      maxDiscountAmount: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      usageLimit: '',
      perCustomerLimit: 1,
      isActive: true
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);
    setFormData({
      code: offer.code,
      title: offer.title || '',
      description: offer.description || '',
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minOrderAmount: offer.minOrderAmount || '',
      maxDiscountAmount: offer.maxDiscountAmount || '',
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().slice(0, 16) : '',
      validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().slice(0, 16) : '',
      usageLimit: offer.usageLimit !== null ? offer.usageLimit : '',
      perCustomerLimit: offer.perCustomerLimit || 1,
      isActive: offer.isActive
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        perCustomerLimit: formData.perCustomerLimit ? Number(formData.perCustomerLimit) : 1,
        isActive: formData.isActive
      };

      if (editingOffer) {
        await adminAPI.updateOffer(editingOffer._id, payload);
      } else {
        await adminAPI.createOffer(payload);
      }

      setModalOpen(false);
      fetchOffers();
    } catch (err) {
      setFormError(err.message || err.data?.message || err.response?.data?.message || 'Failed to save offer');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleStatus = async (offer) => {
    try {
      await adminAPI.updateOffer(offer._id, { isActive: !offer.isActive });
      fetchOffers();
    } catch (err) {
      alert(err.message || err.data?.message || err.response?.data?.message || 'Failed to update offer status');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.offer) return;
    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      await adminAPI.deleteOffer(deleteModal.offer._id);
      setDeleteModal({ open: false, offer: null, loading: false });
      fetchOffers();
    } catch (err) {
      alert(err.message || err.data?.message || err.response?.data?.message || 'Failed to delete offer');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredOffers = offers.filter(o => 
    o.code.toLowerCase().includes(search.toLowerCase()) ||
    (o.title && o.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1E261B] tracking-wide">Offers & Coupon Codes</h1>
          <p className="text-xs text-[#1E261B]/60 mt-1">
            Create and maintain promotional discount codes, validity windows, and purchase minimums.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOffers}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#1E261B] bg-white border border-[#1E261B]/15 rounded hover:bg-[#F5F0E6] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#FAF7F2] bg-[#45563D] rounded hover:bg-[#384631] transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border border-[#1E261B]/10 p-4 rounded-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E261B]/40" />
          <input
            type="text"
            placeholder="Search coupon code or campaign title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#1E261B]/15 rounded bg-transparent focus:outline-none focus:border-[#45563D]"
          />
        </div>
      </div>

      {/* Offers Table */}
      <div className="bg-white border border-[#1E261B]/10 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#1E261B]/60">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#45563D]" />
            Loading promotional discounts...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-600 bg-red-50/50">
            {error}
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#1E261B]/60">
            No coupon codes registered yet. Click "Create Coupon" to initiate a promotional offer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E261B]/10 bg-[#FAF7F2] text-[#1E261B]/70 font-serif">
                  <th className="p-3 pl-4">Coupon Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Thresholds</th>
                  <th className="p-3">Validity Window</th>
                  <th className="p-3 text-center">Redemptions</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E261B]/5">
                {filteredOffers.map((o) => {
                  const isExpired = new Date(o.validUntil) < new Date();
                  return (
                    <tr key={o._id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-[#45563D]/10 text-[#45563D] px-2 py-1 rounded tracking-wider border border-[#45563D]/20">
                            {o.code}
                          </span>
                          {o.title && (
                            <span className="text-xs text-[#1E261B]/70 hidden md:inline">
                              {o.title}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-[#1E261B]">
                        {o.discountType === 'percentage' ? (
                          <span className="inline-flex items-center gap-1 text-[#45563D]">
                            <Percent className="w-3 h-3" />
                            {o.discountValue}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#45563D]">
                            <IndianRupee className="w-3 h-3" />
                            ₹{o.discountValue} FLAT OFF
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-[#1E261B]/70">
                        <div>Min Order: ₹{o.minOrderAmount || 0}</div>
                        {o.maxDiscountAmount && (
                          <div className="text-[10px] text-[#1E261B]/50">Cap: ₹{o.maxDiscountAmount}</div>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-[#1E261B]/70">
                        <div>Till: {new Date(o.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {isExpired && (
                          <span className="text-[10px] text-red-600 font-medium">Expired</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="font-semibold text-[#1E261B]">{o.usedCount || 0}</span>
                        {o.usageLimit && (
                          <span className="text-[#1E261B]/40 text-[10px]"> / {o.usageLimit}</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStatus(o)}
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
                            o.isActive && !isExpired
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                          }`}
                        >
                          {o.isActive && !isExpired ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Disabled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(o)}
                            className="p-1.5 text-[#1E261B]/50 hover:text-[#45563D] rounded transition-colors"
                            title="Edit Offer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, offer: o, loading: false })}
                            className="p-1.5 text-[#1E261B]/40 hover:text-red-600 rounded transition-colors"
                            title="Delete Offer"
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
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-sm border border-[#1E261B]/15 shadow-xl p-6 relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#1E261B]/40 hover:text-[#1E261B]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-serif text-[#1E261B] mb-1">
              {editingOffer ? 'Edit Coupon Code' : 'Create Promotional Coupon'}
            </h3>
            <p className="text-xs text-[#1E261B]/60 mb-5">
              Specify the discount rules, minimum order values, and validity timeline.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded font-mono uppercase focus:outline-none focus:border-[#45563D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded bg-white focus:outline-none focus:border-[#45563D]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">
                    {formData.discountType === 'percentage' ? 'Percentage (e.g. 15 for 15%) *' : 'Amount in ₹ *'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Min Order Subtotal (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Max Discount Cap (₹ Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Leave empty for uncapped discount"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Valid Until *</label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited if blank"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Per-Customer Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E261B]/80 mb-1">Campaign Title (Internal / Display)</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Handcrafted Rugs Festival"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#1E261B]/20 rounded focus:outline-none focus:border-[#45563D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[#45563D] focus:ring-[#45563D]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-[#1E261B]">
                  Activate coupon immediately
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E261B]/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#1E261B]/70 hover:text-[#1E261B] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs bg-[#45563D] text-[#FAF7F2] rounded font-medium hover:bg-[#384631] transition-colors disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : editingOffer ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.offer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-sm border border-[#1E261B]/15 shadow-xl p-6 relative">
            <h3 className="text-base font-serif text-[#1E261B] mb-2">Delete Coupon</h3>
            <p className="text-xs text-[#1E261B]/70 leading-relaxed">
              Are you sure you wish to delete coupon code <strong className="text-[#1E261B]">{deleteModal.offer.code}</strong>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, offer: null, loading: false })}
                className="px-4 py-2 text-xs text-[#1E261B]/70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteModal.loading}
                className="px-4 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteModal.loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
