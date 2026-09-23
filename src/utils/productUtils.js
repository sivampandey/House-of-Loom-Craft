/**
 * Centralized Product Normalization & Safe Image Utilities
 * 
 * Guarantees every product object adheres to a consistent, predictable contract
 * across all customer storefront components, preventing missing fields, undefined
 * properties, broken image cards, and unexpected layout shifts.
 */

export const DEFAULT_FALLBACK_IMAGE = '/images/carpets/royal-ivory-medallion.jpg';

/**
 * Resolves the most reliable image URL for a given product or item
 */
export function getProductImage(product) {
  if (!product) return DEFAULT_FALLBACK_IMAGE;

  if (typeof product === 'string') {
    return product.trim() || DEFAULT_FALLBACK_IMAGE;
  }

  return (
    product.thumbnail ||
    (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) ||
    product.image ||
    product.texture ||
    DEFAULT_FALLBACK_IMAGE
  );
}

/**
 * Normalizes any raw product from API, MongoDB, or local mock data into
 * a predictable, consistent frontend shape.
 */
export function normalizeProduct(raw) {
  if (!raw) return null;

  const pId = raw.slug || raw._id || raw.id || '';
  const primaryImage = getProductImage(raw);

  // Extract all distinct images for gallery
  let allImages = [];
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    allImages = [...raw.images];
  }
  if (raw.thumbnail && !allImages.includes(raw.thumbnail)) {
    allImages.unshift(raw.thumbnail);
  }
  if (raw.texture && !allImages.includes(raw.texture)) {
    allImages.push(raw.texture);
  }
  if (raw.image && !allImages.includes(raw.image)) {
    allImages.push(raw.image);
  }
  if (allImages.length === 0) {
    allImages = [primaryImage];
  }

  const numericStock = typeof raw.stock === 'number' 
    ? raw.stock 
    : (raw.inStock === false ? 0 : 10);

  return {
    ...raw,
    id: pId,
    _id: raw._id || pId,
    slug: raw.slug || pId,
    name: raw.name || 'Untitled Piece',
    price: Number(raw.price) || 0,
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : null,
    image: primaryImage,
    thumbnail: primaryImage,
    images: allImages,
    category: raw.category || 'Handcrafted Rugs',
    collection: raw.collection || 'all',
    collectionName: raw.collectionName || raw.category || 'Curated Heirlooms',
    stock: numericStock,
    inStock: numericStock > 0,
    isFeatured: Boolean(raw.isFeatured),
    isActive: raw.isActive !== false,
    dimensions: raw.dimensions || '',
    material: raw.material || '',
    knotDensity: raw.knotDensity || '',
    origin: raw.origin || 'Bhadohi, U.P. (India)',
    manufacturer: raw.manufacturer || 'House of Loom & Craft',
    weaveTime: raw.weaveTime || '',
    badge: raw.badge || '',
    shortDescription: raw.shortDescription || '',
    description: raw.description || '',
    details: Array.isArray(raw.details) ? raw.details : [],
    leadTime: raw.leadTime || (numericStock > 0 ? 'In Stock - Dispatches in 24-48 Hours' : 'Made to Order - 4-8 Weeks')
  };
}

/**
 * Batch normalizes an array of products
 */
export function normalizeProductList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct).filter(Boolean);
}
