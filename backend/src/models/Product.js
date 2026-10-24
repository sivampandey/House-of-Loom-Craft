import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: (v) => Number.isFinite(v) && v >= 0,
      message: 'Variant price must be a finite, non-negative number.'
    }
  },
  compareAtPrice: {
    type: Number,
    default: null,
    min: 0,
    validate: {
      validator: (v) => v === null || v === undefined || (Number.isFinite(v) && v >= 0),
      message: 'Variant compare-at price must be a finite, non-negative number or null.'
    }
  },
  stock: {
    type: Number,
    default: 10,
    min: 0,
    validate: {
      validator: (v) => Number.isFinite(v) && v >= 0,
      message: 'Variant stock must be a finite, non-negative number.'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: null, min: 0 },
  hasVariants: { type: Boolean, default: false, index: true },
  variants: [variantSchema],
  category: { type: String, required: true, index: true },
  collection: { type: String, required: true, index: true }, // e.g. 'hand-knotted', 'hand-tufted'
  collectionName: { type: String, default: '' },
  material: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  knotDensity: { type: String, default: '' },
  origin: { type: String, default: 'Bhadohi, U.P. (India)' },
  manufacturer: { type: String, default: 'House of Loom & Craft (Manufacturer & Exporter)' },
  weaveTime: { type: String, default: '' },
  images: [{ type: String }],
  thumbnail: { type: String, default: '' },
  texture: { type: String, default: '' },
  badge: { type: String, default: '' },
  stock: { type: Number, required: true, default: 10, min: 0 },
  isFeatured: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  details: [{ type: String }],
  leadTime: { type: String, default: 'In Stock - Dispatches in 24-48 Hours' },
  seoTitle: { type: String, default: '' },
  seoDescription: { type: String, default: '' },
  seoKeywords: [{ type: String }]
}, { timestamps: true, suppressReservedKeysWarning: true });

// Validation and synchronization hook for size-wise variants
productSchema.pre('validate', function(next) {
  if (this.hasVariants && Array.isArray(this.variants) && this.variants.length > 0) {
    const seenIds = new Set();
    const seenSizes = new Set();
    let defaultCount = 0;

    for (let i = 0; i < this.variants.length; i++) {
      const v = this.variants[i];
      // Auto-assign stable ID if missing
      if (!v.id || !v.id.trim()) {
        v.id = `var_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;
      }

      // Prevent duplicate variant IDs within the product
      if (seenIds.has(v.id)) {
        return next(new Error(`Duplicate variant ID "${v.id}" detected.`));
      }
      seenIds.add(v.id);

      // Prevent empty or duplicate size label entries
      const normalizedSize = (v.size || '').trim().toLowerCase();
      if (!normalizedSize) {
        return next(new Error('Every variant must specify a non-empty size label.'));
      }
      if (seenSizes.has(normalizedSize)) {
        return next(new Error(`Duplicate variant size "${v.size}" detected. Each size variant must be unique.`));
      }
      seenSizes.add(normalizedSize);

      // Validate finite, non-negative price
      if (v.price !== undefined && (typeof v.price !== 'number' || isNaN(v.price) || v.price < 0 || !Number.isFinite(v.price))) {
        return next(new Error('Variant price must be a finite, non-negative number.'));
      }

      // Enforce at most one default variant
      if (v.isDefault) {
        defaultCount++;
      }
    }

    if (defaultCount > 1) {
      return next(new Error('Only one variant can be marked as default.'));
    }

    // Keep base price aligned with the lowest active variant price for consistent sorting/catalog display
    const activeVariants = this.variants.filter(v => v.active !== false);
    if (activeVariants.length > 0) {
      const minActivePrice = Math.min(...activeVariants.map(v => v.price));
      if (Number.isFinite(minActivePrice)) {
        this.price = minActivePrice;
      }
    }
  }
  next();
});

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  material: 'text',
  category: 'text'
});

// Performance compound indexes for public storefront catalog queries
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ isActive: 1, collection: 1 });

export const Product = mongoose.model('Product', productSchema);
