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
  Sparkles,
  Layers,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import ProductImageUploader from '../../components/admin/ProductImageUploader';

export const CATEGORIES = [
  'Hand Knotted Rugs',
  'Hand Tufted Rugs',
  'Hand Woven Rugs',
  'Handloom Rugs',
  'Architectural Accents',
  'Home Decor',
  'Custom Rugs',
  'Special Shape Rugs'
];

export const CATEGORY_COLLECTION_MAP = {
  'Hand Knotted Rugs': { collection: 'hand-knotted', collectionName: 'Hand Knotted Rugs' },
  'Hand Tufted Rugs': { collection: 'hand-tufted', collectionName: 'Hand Tufted Rugs' },
  'Hand Woven Rugs': { collection: 'hand-woven', collectionName: 'Hand Woven Rugs' },
  'Handloom Rugs': { collection: 'handloom', collectionName: 'Handloom Rugs' },
  'Custom Rugs': { collection: 'custom', collectionName: 'Custom Rugs' },
  'Special Shape Rugs': { collection: 'special-shape', collectionName: 'Special Shape Rugs' },
  'Home Decor': { collection: 'home-decor', collectionName: 'Architectural Accents' },
  'Architectural Accents': { collection: 'home-decor', collectionName: 'Architectural Accents' }
};

export const COMMON_SIZE_PRESETS = [
  '4 × 6 ft',
  '5 × 8 ft',
  '6 × 9 ft',
  '8 × 10 ft',
  '9 × 12 ft',
  '10 × 14 ft',
  'Runner 2.5 × 10 ft',
  'Round 6 ft'
];

export const PRESET_DIMENSION_MAP = {
  '4 × 6 ft': { length: 183, width: 122, unit: 'cm', dimensions: '4 × 6 ft (122 × 183 cm)' },
  '5 × 8 ft': { length: 244, width: 152, unit: 'cm', dimensions: '5 × 8 ft (152 × 244 cm)' },
  '6 × 9 ft': { length: 274, width: 183, unit: 'cm', dimensions: '6 × 9 ft (183 × 274 cm)' },
  '8 × 10 ft': { length: 305, width: 244, unit: 'cm', dimensions: '8 × 10 ft (244 × 305 cm)' },
  '9 × 12 ft': { length: 366, width: 274, unit: 'cm', dimensions: '9 × 12 ft (274 × 366 cm)' },
  '10 × 14 ft': { length: 427, width: 305, unit: 'cm', dimensions: '10 × 14 ft (305 × 427 cm)' },
  'Runner 2.5 × 10 ft': { length: 305, width: 76, unit: 'cm', dimensions: '2.5 × 10 ft (76 × 305 cm)' },
  'Round 6 ft': { length: 183, width: 183, unit: 'cm', dimensions: 'Round 6 ft (183 × 183 cm)' }
};

export default function AdminProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    category: 'Hand Knotted Rugs',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    price: '',
    compareAtPrice: '',
    stock: 10,
    hasVariants: false,
    variants: [],
    dimensions: '',
    material: '',
    knotDensity: '',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '',
    dispatchTime: 'Dispatches in 24-48 Hours',
    badge: '',
    shortDescription: '',
    description: '',
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    isFeatured: false,
    isActive: true,
    thumbnail: '',
    images: [],
    imageAssets: [],
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
            const parsedVariants = Array.isArray(p.variants) && p.variants.length > 0
              ? p.variants.map((v, i) => ({
                id: v.id || v._id || `var_${Date.now()}_${i}`,
                size: v.size || '',
                sku: v.sku || '',
                price: v.price !== undefined && v.price !== null ? v.price : '',
                compareAtPrice: v.compareAtPrice !== undefined && v.compareAtPrice !== null ? v.compareAtPrice : '',
                stock: v.stock !== undefined && v.stock !== null ? v.stock : 10,
                length: v.length !== undefined && v.length !== null ? v.length : '',
                width: v.width !== undefined && v.width !== null ? v.width : '',
                unit: v.unit || 'cm',
                dimensions: v.dimensions || '',
                dispatchTime: v.dispatchTime || '',
                leadTime: v.leadTime || '',
                weaveTime: v.weaveTime || '',
                active: v.active !== false,
                isDefault: Boolean(v.isDefault)
              }))
              : [];

            const hasVars = Boolean(p.hasVariants || parsedVariants.length > 0);

            setFormData({
              name: p.name || '',
              slug: p.slug || '',
              sku: p.sku || '',
              category: p.category || 'Hand Knotted Rugs',
              collection: p.collection || 'hand-knotted',
              collectionName: p.collectionName || p.category || '',
              price: p.price ?? '',
              compareAtPrice: p.compareAtPrice ?? '',
              stock: p.stock ?? 10,
              hasVariants: hasVars,
              variants: parsedVariants,
              dimensions: p.dimensions || '',
              material: p.material || '',
              knotDensity: p.knotDensity || '',
              origin: p.origin || 'Bhadohi, U.P. (India)',
              manufacturer: p.manufacturer || 'House of Loom & Craft',
              weaveTime: p.weaveTime || '',
              dispatchTime: p.dispatchTime || '',
              badge: p.badge || '',
              shortDescription: p.shortDescription || '',
              description: p.description || '',
              leadTime: p.leadTime || 'In Stock - Dispatches in 24-48 Hours',
              isFeatured: Boolean(p.isFeatured),
              isActive: Boolean(p.isActive),
              thumbnail: p.thumbnail || '',
              images: Array.isArray(p.images) ? p.images : [],
              imageAssets: Array.isArray(p.imageAssets) ? p.imageAssets : [],
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
    const mapping = CATEGORY_COLLECTION_MAP[cat] || {
      collection: cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      collectionName: cat
    };
    setFormData((prev) => ({
      ...prev,
      category: cat,
      collection: mapping.collection,
      collectionName: mapping.collectionName
    }));
  };

  // Toggle variant mode
  const handleToggleVariants = (enabled) => {
    setFormData((prev) => {
      let currentVariants = [...prev.variants];
      if (enabled && currentVariants.length === 0) {
        currentVariants = [
          {
            id: `var_${Date.now()}_1`,
            size: prev.dimensions || '5 × 8 ft',
            sku: prev.sku || '',
            price: prev.price || '',
            compareAtPrice: prev.compareAtPrice || '',
            stock: prev.stock || 10,
            length: '',
            width: '',
            unit: 'cm',
            dimensions: prev.dimensions || '',
            dispatchTime: prev.dispatchTime || prev.leadTime || 'Dispatches in 24-48 Hours',
            leadTime: prev.leadTime || 'Delivery in 5-7 business days',
            weaveTime: prev.weaveTime || '',
            active: true,
            isDefault: true
          }
        ];
      }
      return {
        ...prev,
        hasVariants: enabled,
        variants: currentVariants
      };
    });
  };

  // Add new variant
  const handleAddVariant = (presetSize = '') => {
    setFormData((prev) => {
      const isFirst = prev.variants.length === 0;
      const presetInfo = PRESET_DIMENSION_MAP[presetSize] || {};
      const newVar = {
        id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        size: presetSize || '',
        sku: '',
        price: prev.price || '',
        compareAtPrice: prev.compareAtPrice || '',
        stock: 10,
        length: presetInfo.length !== undefined ? presetInfo.length : '',
        width: presetInfo.width !== undefined ? presetInfo.width : '',
        unit: presetInfo.unit || 'cm',
        dimensions: presetInfo.dimensions || presetSize || '',
        dispatchTime: prev.dispatchTime || prev.leadTime || 'Dispatches in 24-48 Hours',
        leadTime: 'Delivery in 5-7 business days',
        weaveTime: prev.weaveTime || '',
        active: true,
        isDefault: isFirst
      };
      return {
        ...prev,
        variants: [...prev.variants, newVar]
      };
    });
  };

  // Remove variant
  const handleRemoveVariant = (indexToRemove) => {
    setFormData((prev) => {
      const updated = prev.variants.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0 && !updated.some((v) => v.isDefault)) {
        const firstActive = updated.find((v) => v.active) || updated[0];
        firstActive.isDefault = true;
      }
      return {
        ...prev,
        variants: updated
      };
    });
  };

  // Modify variant field
  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = prev.variants.map((v, idx) => {
        if (idx === index) {
          const next = { ...v, [field]: value };
          if ((field === 'length' || field === 'width' || field === 'unit') && !next.dimensionsManual) {
            const l = field === 'length' ? value : next.length;
            const w = field === 'width' ? value : next.width;
            const u = field === 'unit' ? value : (next.unit || 'cm');
            if (l && w) {
              next.dimensions = `${l} × ${w} ${u}`;
            }
          }
          if (field === 'dimensions') {
            next.dimensionsManual = true;
          }
          return next;
        }
        return v;
      });
      return {
        ...prev,
        variants: updated
      };
    });
  };

  // Set default variant
  const handleSetDefaultVariant = (index) => {
    setFormData((prev) => {
      const updated = prev.variants.map((v, idx) => ({
        ...v,
        isDefault: idx === index
      }));
      return {
        ...prev,
        variants: updated
      };
    });
  };

  // Toggle active status for variant
  const handleToggleVariantActive = (index) => {
    setFormData((prev) => {
      const updated = prev.variants.map((v, idx) => {
        if (idx === index) {
          const newActive = !v.active;
          return {
            ...v,
            active: newActive,
            isDefault: !newActive ? false : v.isDefault
          };
        }
        return v;
      });

      // If active status turned off default, reassign default to first active variant
      if (!updated.some((v) => v.isDefault && v.active)) {
        const nextActive = updated.find((v) => v.active);
        if (nextActive) nextActive.isDefault = true;
      }

      return {
        ...prev,
        variants: updated
      };
    });
  };

  const handleAddImage = () => {
    const clean = newImageUrl.trim();
    if (!clean) return;
    if (!clean.startsWith('/') && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      setError('Please provide a valid image path or URL (e.g. /images/... or https://...)');
      return;
    }
    setError('');
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
      if (!formData.name.trim()) {
        throw new Error('Product name is required.');
      }

      let payloadVariants = [];
      let calculatedBasePrice = Number(formData.price);
      let calculatedStock = Number(formData.stock);

      if (formData.hasVariants) {
        if (!Array.isArray(formData.variants) || formData.variants.length === 0) {
          throw new Error('Please add at least one size variant or disable variant pricing.');
        }

        const seenSizes = new Set();
        let hasDefault = false;

        payloadVariants = formData.variants.map((v, idx) => {
          const trimmedSize = (v.size || '').trim();
          if (!trimmedSize) {
            throw new Error(`Variant #${idx + 1} is missing a size label (e.g. "5 × 8 ft").`);
          }

          const lowerSize = trimmedSize.toLowerCase();
          if (seenSizes.has(lowerSize)) {
            throw new Error(`Duplicate size "${trimmedSize}" detected. Each variant must have a unique size.`);
          }
          seenSizes.add(lowerSize);

          const vPrice = Number(v.price);
          if (isNaN(vPrice) || vPrice < 0 || !isFinite(vPrice)) {
            throw new Error(`Variant "${trimmedSize}" must have a valid non-negative price.`);
          }

          const vCompareAtPrice = v.compareAtPrice !== '' && v.compareAtPrice !== null && v.compareAtPrice !== undefined
            ? Number(v.compareAtPrice)
            : null;
          if (vCompareAtPrice !== null && (isNaN(vCompareAtPrice) || vCompareAtPrice < 0)) {
            throw new Error(`Variant "${trimmedSize}" compare-at price must be a valid non-negative number.`);
          }

          const vStock = Number(v.stock);
          if (isNaN(vStock) || vStock < 0) {
            throw new Error(`Variant "${trimmedSize}" stock cannot be negative.`);
          }

          const vLength = v.length !== '' && v.length !== null && v.length !== undefined
            ? Number(v.length)
            : null;
          if (vLength !== null && (isNaN(vLength) || vLength < 0)) {
            throw new Error(`Variant "${trimmedSize}" length must be a valid non-negative number.`);
          }

          const vWidth = v.width !== '' && v.width !== null && v.width !== undefined
            ? Number(v.width)
            : null;
          if (vWidth !== null && (isNaN(vWidth) || vWidth < 0)) {
            throw new Error(`Variant "${trimmedSize}" width must be a valid non-negative number.`);
          }

          const vUnit = (v.unit || 'cm').trim();
          let vDimensions = (v.dimensions || '').trim();
          if (!vDimensions && vLength !== null && vWidth !== null) {
            vDimensions = `${vLength} × ${vWidth} ${vUnit}`;
          }

          if (v.isDefault && v.active) {
            hasDefault = true;
          }

          return {
            id: v.id || `var_${Date.now()}_${idx}`,
            size: trimmedSize,
            sku: (v.sku || '').trim(),
            price: vPrice,
            compareAtPrice: vCompareAtPrice,
            stock: vStock,
            length: vLength,
            width: vWidth,
            unit: vUnit,
            dimensions: vDimensions,
            dispatchTime: (v.dispatchTime || '').trim(),
            leadTime: (v.leadTime || '').trim(),
            weaveTime: (v.weaveTime || '').trim(),
            active: v.active !== false,
            isDefault: Boolean(v.isDefault)
          };
        });

        // Ensure at least one active variant is marked default
        const activeVariants = payloadVariants.filter((v) => v.active);
        if (!hasDefault && activeVariants.length > 0) {
          activeVariants[0].isDefault = true;
        }

        // Align base price to the minimum active variant price for catalog sorting
        if (activeVariants.length > 0) {
          calculatedBasePrice = Math.min(...activeVariants.map((v) => v.price));
        } else if (payloadVariants.length > 0) {
          calculatedBasePrice = payloadVariants[0].price;
        }

        // Base stock can represent the sum of variant stock
        calculatedStock = payloadVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      } else {
        if (formData.price === undefined || formData.price === null || formData.price === '' || isNaN(Number(formData.price))) {
          throw new Error('A valid selling price is required.');
        }
        if (calculatedBasePrice < 0) {
          throw new Error('Price cannot be negative.');
        }
        if (calculatedStock < 0) {
          throw new Error('Stock quantity cannot be negative.');
        }
      }

      const resolvedThumbnail = formData.thumbnail || (formData.images && formData.images[0]) || '';
      if (!resolvedThumbnail && (!formData.images || formData.images.length === 0)) {
        throw new Error('Please upload at least one product photograph before publishing.');
      }

      const payload = {
        ...formData,
        sku: (formData.sku || '').trim(),
        dispatchTime: (formData.dispatchTime || '').trim(),
        thumbnail: resolvedThumbnail,
        images: Array.isArray(formData.images) && formData.images.length > 0 ? formData.images : [resolvedThumbnail],
        hasVariants: Boolean(formData.hasVariants),
        variants: payloadVariants,
        price: calculatedBasePrice,
        compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : null,
        stock: calculatedStock
      };

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

        {/* Section 2: Size & Pricing Manager */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DACDB3] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-xl text-[#362B21] font-medium">
                  2. Size & Pricing
                </h2>
                {formData.hasVariants && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-[#55694A]/15 text-[#55694A] border border-[#55694A]/30">
                    {formData.variants.filter((v) => v.active).length} Active Sizes
                  </span>
                )}
              </div>
              <p className="text-xs text-[#544131]/75 font-sans mt-0.5">
                Configure size-wise variants with independent prices, or use a uniform single price.
              </p>
            </div>

            {/* Mode Toggle Button */}
            <div className="flex items-center gap-3 self-start sm:self-auto bg-[#FAF7F0] p-1.5 rounded-xl border border-[#DACDB3]">
              <button
                type="button"
                onClick={() => handleToggleVariants(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${!formData.hasVariants
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#544131] hover:text-[#362B21]'
                  }`}
              >
                Single Price
              </button>
              <button
                type="button"
                onClick={() => handleToggleVariants(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition-all ${formData.hasVariants
                  ? 'bg-[#55694A] text-[#FAF7F0] shadow-sm'
                  : 'text-[#544131] hover:text-[#362B21]'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multiple Sizes</span>
              </button>
            </div>
          </div>

          {!formData.hasVariants ? (
            /* Single Price View */
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
          ) : (
            /* Multi-Size Variant View */
            <div className="space-y-5">
              {/* Preset Shortcuts */}
              <div className="space-y-2 bg-[#FAF7F0] p-3.5 rounded-xl border border-[#DACDB3]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-bold text-[#4E3C2B] uppercase tracking-wider">
                    Quick Add Common Rug Sizes:
                  </span>
                  <span className="text-[11px] text-[#544131]/60 font-sans">
                    Click to add a size variant
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SIZE_PRESETS.map((preset) => {
                    const alreadyAdded = formData.variants.some(
                      (v) => (v.size || '').trim().toLowerCase() === preset.toLowerCase()
                    );
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => handleAddVariant(preset)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-sans font-medium transition-colors ${alreadyAdded
                          ? 'bg-[#EAE2D2] text-[#544131]/50 border-transparent cursor-not-allowed'
                          : 'bg-[#FAF7F0] text-[#362B21] border-[#DACDB3] hover:border-[#55694A] hover:bg-[#55694A]/10'
                          }`}
                      >
                        + {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Variants List / Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[#4E3C2B]">
                    Configured Size Variants ({formData.variants.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleAddVariant('')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#55694A] text-[#FAF7F0] text-xs font-sans font-bold rounded-lg hover:bg-[#657C58] transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Size</span>
                  </button>
                </div>

                {formData.variants.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-[#DACDB3] rounded-2xl text-center space-y-2 bg-[#FAF7F0]">
                    <Layers className="w-8 h-8 text-[#8F6E50]/50 mx-auto" />
                    <p className="text-xs text-[#544131]/75 font-sans">
                      No size variants added yet. Click a quick size preset above or &ldquo;Add Custom Size&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => {
                      const isDefault = Boolean(variant.isDefault);
                      const isActive = variant.active !== false;

                      return (
                        <div
                          key={variant.id || index}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                            isActive
                              ? isDefault
                                ? 'bg-[#FAF7F0] border-[#55694A] ring-2 ring-[#55694A]/25'
                                : 'bg-[#FAF7F0] border-[#DACDB3]'
                              : 'bg-[#FAF7F0]/70 border-[#DACDB3]/70 opacity-75'
                          }`}
                        >
                          {/* Variation Header */}
                          <div className="bg-[#EAE2D2]/60 px-5 py-3 border-b border-[#DACDB3] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#55694A] text-[#FAF7F0] text-xs font-bold font-mono flex items-center justify-center">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-serif text-sm font-bold text-[#362B21]">
                                  {variant.size || `Size Variation #${index + 1}`}
                                </h4>
                                {variant.sku && (
                                  <span className="text-[10px] font-mono text-[#544131]/70 block">
                                    SKU: {variant.sku}
                                  </span>
                                )}
                              </div>
                              {isDefault && (
                                <span className="ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider bg-[#55694A] text-[#FAF7F0] shadow-sm">
                                  Default Size
                                </span>
                              )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 ml-auto">
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultVariant(index)}
                                  className="text-xs font-sans font-medium px-2.5 py-1 rounded-lg border border-[#DACDB3] bg-[#FAF7F0] text-[#544131] hover:border-[#55694A] hover:text-[#362B21] transition-colors"
                                >
                                  Set as Default
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleToggleVariantActive(index)}
                                className={`text-xs font-sans font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-zinc-200 text-zinc-600 border border-zinc-300'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-600' : 'bg-zinc-400'}`} />
                                {isActive ? 'Active' : 'Hidden'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(index)}
                                className="p-1.5 rounded-lg text-[#B24C40] hover:bg-[#B24C40]/10 border border-transparent hover:border-[#B24C40]/20 transition-colors"
                                title="Delete this size variation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="p-5 space-y-5">
                            {/* Row 1: Identification, Pricing & Stock */}
                            <div>
                              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#55694A] block mb-2.5">
                                1. Identity & Pricing
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                                {/* Size Name */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Size Name / Label *
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.size}
                                    onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                    placeholder="e.g. 5 × 8 ft, 8 × 10 ft"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] font-semibold focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* SKU */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Variation SKU
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.sku || ''}
                                    onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                    placeholder="e.g. HLC-5X8-01"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs font-mono text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* Price */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Selling Price (INR ₹) *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.price}
                                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                    placeholder="24000"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] font-bold focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* Compare At Price */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Compare-at Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.compareAtPrice}
                                    onChange={(e) => handleVariantChange(index, 'compareAtPrice', e.target.value)}
                                    placeholder="30000"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#544131]/80 focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* Stock */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Stock Quantity *
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={variant.stock}
                                    onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                    placeholder="5"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] font-bold focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Row 2: Physical Dimensions */}
                            <div className="pt-3 border-t border-[#DACDB3]/70">
                              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#55694A] block mb-2.5">
                                2. Dimensions & Measurements
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* Length */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Length
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={variant.length ?? ''}
                                    onChange={(e) => handleVariantChange(index, 'length', e.target.value)}
                                    placeholder="e.g. 240"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* Width */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Width
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={variant.width ?? ''}
                                    onChange={(e) => handleVariantChange(index, 'width', e.target.value)}
                                    placeholder="e.g. 150"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>

                                {/* Unit */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Measurement Unit
                                  </label>
                                  <select
                                    value={variant.unit || 'cm'}
                                    onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  >
                                    <option value="cm">Centimeters (cm)</option>
                                    <option value="inches">Inches (in)</option>
                                    <option value="ft">Feet (ft)</option>
                                  </select>
                                </div>

                                {/* Formatted Dimensions */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Display Dimensions
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.dimensions || ''}
                                    onChange={(e) => handleVariantChange(index, 'dimensions', e.target.value)}
                                    placeholder="e.g. 5 × 8 ft (152 × 244 cm)"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Row 3: Timelines */}
                            <div className="pt-3 border-t border-[#DACDB3]/70">
                              <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#55694A] block mb-2.5">
                                3. Fulfillment & Manufacturing Timeframes
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                {/* Dispatch Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Preparation / Dispatch Time
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.dispatchTime || ''}
                                    onChange={(e) => handleVariantChange(index, 'dispatchTime', e.target.value)}
                                    placeholder="e.g. Dispatches in 24-48 Hours"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                  <span className="text-[10px] text-[#544131]/60 block">Warehouse prep/dispatch timeframe</span>
                                </div>

                                {/* Estimated Lead/Delivery Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Estimated Delivery / Lead Time
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.leadTime || ''}
                                    onChange={(e) => handleVariantChange(index, 'leadTime', e.target.value)}
                                    placeholder="e.g. Delivery in 5-7 business days"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                  <span className="text-[10px] text-[#544131]/60 block">Transit & doorstep delivery timeline</span>
                                </div>

                                {/* Weaving Time */}
                                <div className="space-y-1">
                                  <label className="text-[11px] font-sans font-bold text-[#4E3C2B] block">
                                    Weaving / Manufacturing Time
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.weaveTime || ''}
                                    onChange={(e) => handleVariantChange(index, 'weaveTime', e.target.value)}
                                    placeholder="e.g. Ready in Stock or 8-12 weeks"
                                    className="w-full bg-[#FFFFFF] border border-[#DACDB3] rounded-xl px-3 py-2 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
                                  />
                                  <span className="text-[10px] text-[#544131]/60 block">Artisan loom weaving duration</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Informational Guidance */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F0] border border-[#DACDB3] flex items-start gap-2.5 text-xs text-[#544131]">
                <Sparkles className="w-4 h-4 text-[#55694A] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#362B21]">
                    Starting Catalog Price Calculation
                  </p>
                  <p className="text-[11px] leading-relaxed text-[#544131]/80">
                    Product cards on the storefront catalog will dynamically display starting prices (e.g. &ldquo;From ₹...&rdquo;) based on the lowest active variant price. Only active size variants will be selectable by clients during purchase.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                Dispatch Time (Single Price / Fallback)
              </label>
              <input
                type="text"
                name="dispatchTime"
                value={formData.dispatchTime}
                onChange={handleChange}
                placeholder="Dispatches in 24-48 Hours"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B] block">
                Estimated Delivery Time (Single Price / Fallback)
              </label>
              <input
                type="text"
                name="leadTime"
                value={formData.leadTime}
                onChange={handleChange}
                placeholder="Delivery in 5-7 business days"
                className="w-full bg-[#FAF7F0] border border-[#DACDB3] rounded-xl px-4 py-2 text-xs text-[#362B21]"
              />
            </div>
          </div>
          {formData.hasVariants && (
            <p className="text-[11px] text-[#55694A] font-sans font-medium bg-[#55694A]/10 p-2.5 rounded-xl border border-[#55694A]/20">
              Note: Multiple sizes are active above. Each individual size variation&apos;s configured dimensions, dispatch time, delivery time, and weaving time will be displayed to customers when that size is selected.
            </p>
          )}
        </div>

        {/* Section 4: Imagery Management */}
        <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#DACDB3] pb-2">
            <div>
              <h2 className="font-serif text-xl text-[#362B21] font-medium">
                4. Product Images & Master Loom Photography
              </h2>
              <p className="text-xs text-[#544131]/70 font-sans mt-0.5">
                Upload authentic high-resolution photographs from mobile galleries, phones, laptops, and desktop computers.
              </p>
            </div>
            <span className="text-xs text-[#8F6E50] font-sans font-bold">
              {formData.images.length} Image{formData.images.length === 1 ? '' : 's'} registered
            </span>
          </div>

          <ProductImageUploader
            images={formData.images}
            thumbnail={formData.thumbnail}
            imageAssets={formData.imageAssets}
            onChange={({ images, thumbnail, imageAssets }) => {
              setFormData((prev) => ({
                ...prev,
                images,
                thumbnail,
                imageAssets: imageAssets || prev.imageAssets
              }));
            }}
            onError={(msg) => setError(msg)}
          />
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
