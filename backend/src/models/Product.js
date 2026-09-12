import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: null },
  category: { type: String, required: true, index: true },
  collection: { type: String, required: true, index: true }, // e.g. 'hand-knotted', 'hand-tufted'
  collectionName: { type: String, default: '' },
  material: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  knotDensity: { type: String, default: '' },
  origin: { type: String, default: 'Bhadohi, U.P. (India)' },
  manufacturer: { type: String, default: 'POTTERY RUGS & HOME DECOR (Manufacturer & Exporter)' },
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

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  material: 'text',
  category: 'text'
});

export const Product = mongoose.model('Product', productSchema);
