import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const CATEGORIES = [
  'Hand Knotted Rugs',
  'Hand Tufted Rugs',
  'Hand Woven Rugs',
  'Handloom Rugs',
  'Architectural Accents',
  'Home Decor',
  'Custom Rugs',
  'Special Shape Rugs'
];

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Hand Knotted Rugs',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    price: '',
    compareAtPrice: '',
    stock: 10,
    dimensions: '',
    material: '',
    knotDensity: '',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'POTTERY RUGS & HOME DECOR (Manufacturer & Exporter)',
    weaveTime: '',
    badge: '',
    shortDescription: '',
    description: '',
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    isFeatured: false,
    isActive: true,
    thumbnail: '',
    images: [],
    details: []
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDetailText, setNewDetailText] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const res = await adminAPI.getProductById(id);
          if (res?.success && res.product) {
            const p = res.product;
            setFormData({
              name: p.name || '',
              slug: p.slug || '',
              category: p.category || 'Hand Knotted Rugs',
              collection: p.collection || 'hand-knotted',
              collectionName: p.collectionName || p.category || '',
              price: p.price ?? '',
              compareAtPrice: p.compareAtPrice ?? '',
              stock: p.stock ?? 10,
              dimensions: p.dimensions || '',
              material: p.material || '',
              knotDensity: p.knotDensity || '',
              origin: p.origin || 'Bhadohi, U.P. (India)',
              manufacturer: p.manufacturer || 'POTTERY RUGS & HOME DECOR',
              weaveTime: p.weaveTime || '',
              badge: p.badge || '',
              shortDescription: p.shortDescription || '',
              description: p.description || '',
              leadTime: p.leadTime || 'In Stock - Dispatches in 24-48 Hours',
              isFeatured: Boolean(p.isFeatured),
              isActive: Boolean(p.isActive),
              thumbnail: p.thumbnail || '',
              images: Array.isArray(p.images) ? p.images : [],
              details: Array.isArray(p.details) ? p.details : []
            });
          }
        } catch (err) {
          setError(err.message || 'Failed to load product details.');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    const colKey = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setFormData((prev) => ({
      ...prev,
      category: cat,
      collection: colKey,
      collectionName: cat
    }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const clean = newImageUrl.trim();
    setFormData((prev) => {
      const updated = [...prev.images, clean];
      return {
        ...prev,
        images: updated,
        thumbnail: prev.thumbnail || clean
      };
    });
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => {
      const filtered = prev.images.filter((_, idx) => idx !== indexToRemove);
      let thumb = prev.thumbnail;
      if (prev.thumbnail === prev.images[indexToRemove]) {
        thumb = filtered.length > 0 ? filtered[0] : '';
      }
      return {
        ...prev,
        images: filtered,
        thumbnail: thumb
      };
    });
  };

  const handleSetPrimary = (imgUrl) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail: imgUrl
    }));
  };

  const handleAddDetail = () => {
    if (!newDetailText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      details: [...prev.details, newDetailText.trim()]
    }));
    setNewDetailText('');
  };

  const handleRemoveDetail = (idx) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
        stock: Number(formData.stock)
      };

      if (!payload.name.trim() || !payload.price) {
        throw new Error('Product name and price are mandatory fields.');
      }

      if (isEditing) {
        await adminAPI.updateProduct(id, payload);
        setSuccessMsg('Product updated successfully.');
      } else {
        await adminAPI.createProduct(payload);
        setSuccessMsg('Product created successfully.');
      }

      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Error occurred while saving product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
        <span className="text-xs uppercase tracking-wider text-[#544131]/70 font-sans block">
          Loading Piece Information...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#DACDB3]">
        <div className="space-y-1">
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#55694A] hover:text-[#362B21] font-sans font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#362B21] font-light">
            {isEditing ? `Edit: ${formData.name || 'Catalog Item'}` : 'Add New Product'}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#55694A] hover:bg-[#657C58] disabled:opacity-60 text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-xl transition-all shadow-md active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : isEditing ? 'Update Piece' : 'Publish Piece'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-sans">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#B24C40]/10 border border-[#B24C40]/30 text-[#B24C40] text-xs font-sans">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Details */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
            1. Core Identity & Category
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Product Title *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Nain Imperial Ivory Medallion Rug"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-sm text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                URL Slug (leave blank to auto-generate)
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                placeholder="nain-imperial-ivory-medallion"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-xs font-mono text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleCategoryChange}
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Badge */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Editorial Badge (Optional)
              </label>
              <input
                type="text"
                name="badge"
                value={formData.badge}
                onChange={handleChange}
                placeholder="e.g. Best Seller, Handcrafted Heritage"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Collection Name */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Collection Display Name
              </label>
              <input
                type="text"
                name="collectionName"
                value={formData.collectionName}
                onChange={handleChange}
                placeholder="e.g. Hand Knotted Rugs"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
            2. Pricing & Stock
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Selling Price (INR ₹) *
              </label>
              <input
                type="number"
                name="price"
                required
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="38500"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-sm font-bold text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Compare-At Price */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Compare-at Price (INR ₹)
              </label>
              <input
                type="number"
                name="compareAtPrice"
                min="0"
                value={formData.compareAtPrice}
                onChange={handleChange}
                placeholder="48500"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-sm text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Stock Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="stock"
                required
                min="0"
                value={formData.stock}
                onChange={handleChange}
                placeholder="10"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2.5 text-sm font-bold text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Craft Specifications */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
            3. Craft & Material Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Dimensions
              </label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                placeholder="9' x 12' (275 x 365 cm)"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Material / Fiber
              </label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                placeholder="80% New Zealand Wool, 20% Mulberry Silk"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Knot Density
              </label>
              <input
                type="text"
                name="knotDensity"
                value={formData.knotDensity}
                onChange={handleChange}
                placeholder="450 Knots / sq. inch"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Origin
              </label>
              <input
                type="text"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                placeholder="Bhadohi, U.P. (India)"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Weave Time
              </label>
              <input
                type="text"
                name="weaveTime"
                value={formData.weaveTime}
                onChange={handleChange}
                placeholder="14 Months (Single Loom)"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Dispatch / Lead Time
              </label>
              <input
                type="text"
                name="leadTime"
                value={formData.leadTime}
                onChange={handleChange}
                placeholder="In Stock - Dispatches in 24-48 Hours"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Imagery Management */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DACDB3] pb-2">
            <h2 className="font-serif text-xl text-[#362B21] font-medium">
              4. Product Images
            </h2>
            <span className="text-xs text-[#8F6E50] font-sans">
              {formData.images.length} Image URLs registered
            </span>
          </div>

          {/* Add Image URL Row */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Enter public image URL (e.g. /images/carpets/dune-saffron.jpg or https://...)"
              className="flex-1 bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-[#55694A] text-[#FAF7F0] rounded-xl text-xs uppercase tracking-wider font-bold inline-flex items-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add URL</span>
            </button>
          </div>

          {/* Image Previews Grid */}
          {formData.images.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-[#DACDB3] rounded-2xl text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-[#8F6E50]/50 mx-auto" />
              <p className="text-xs text-[#544131]/70 font-sans">
                No images added yet. Enter an image URL above and click "Add URL".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.images.map((img, idx) => {
                const isPrimary = formData.thumbnail === img;

                return (
                  <div
                    key={idx}
                    className={`relative rounded-xl overflow-hidden border p-2 bg-[#FAF7F0] space-y-2 group ${
                      isPrimary ? 'border-[#55694A] ring-2 ring-[#55694A]/30' : 'border-[#DACDB3]'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#EAE2D2] flex items-center justify-center">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.target.src = '/images/room-after.jpg'; }}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        className={`text-[9.5px] uppercase font-bold px-2 py-0.5 rounded transition-colors ${
                          isPrimary
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'border border-[#DACDB3] text-[#4E3C2B] hover:bg-[#EAE2D2]'
                        }`}
                      >
                        {isPrimary ? 'Primary' : 'Set Primary'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded text-[#B24C40] hover:bg-[#B24C40]/10"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 5: Descriptions & Highlights */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <h2 className="font-serif text-xl text-[#362B21] font-medium border-b border-[#DACDB3] pb-2">
            5. Storytelling & Details
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Short Description (Summary)
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="e.g. Grand 16-point gilded central medallion carpet hand-knotted with 450 KPSI fine single knots."
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Detailed Craftsmanship Story *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Comprehensive editorial description of pattern, technique, finishing, and artistic intent..."
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl p-3 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
            </div>

            {/* Bullet Details */}
            <div className="space-y-2 pt-2">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Piece Highlights & Features
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDetailText}
                  onChange={(e) => setNewDetailText(e.target.value)}
                  placeholder="e.g. Hand-knotted with 450 KPSI single knots in Bhadohi"
                  className="flex-1 bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
                />
                <button
                  type="button"
                  onClick={handleAddDetail}
                  className="px-4 py-2 bg-[#55694A] text-[#FAF7F0] rounded-xl text-xs uppercase tracking-wider font-bold"
                >
                  Add
                </button>
              </div>

              {formData.details.length > 0 && (
                <ul className="space-y-1.5 pt-2">
                  {formData.details.map((d, i) => (
                    <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F0] text-xs text-[#362B21] border border-[#DACDB3]">
                      <span>&bull; {d}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDetail(i)}
                        className="text-[#B24C40] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Section 6: Visibility & Publishing */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg text-[#362B21] font-medium">
              Publishing Options
            </h3>
            <p className="text-xs text-[#544131]/70 font-sans">
              Control client visibility and homepage feature presence.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-[#55694A] rounded border-[#DACDB3] focus:ring-[#55694A]"
              />
              <span className="text-xs font-sans font-bold text-[#362B21] uppercase tracking-wider">
                Published (Active)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-4 h-4 text-[#55694A] rounded border-[#DACDB3] focus:ring-[#55694A]"
              />
              <span className="text-xs font-sans font-bold text-[#362B21] uppercase tracking-wider">
                Featured Piece
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DACDB3]">
          <Link
            to="/admin/products"
            className="px-6 py-2.5 rounded-xl border border-[#DACDB3] text-xs uppercase tracking-wider font-bold text-[#4E3C2B] hover:bg-[#E2D8C3]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#55694A] hover:bg-[#657C58] disabled:opacity-60 text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Update Piece' : 'Publish Piece'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
