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

  // Normalize size-wise variants if present
  const hasVariants = Boolean(raw.hasVariants && Array.isArray(raw.variants) && raw.variants.length > 0);
  let normalizedVariants = [];
  let minVariantPrice = null;
  let maxVariantPrice = null;
  let hasPriceRange = false;
  let defaultVariant = null;

  if (hasVariants) {
    normalizedVariants = raw.variants.map((v, idx) => {
      const vLength = v.length !== undefined && v.length !== null && v.length !== '' ? Number(v.length) : null;
      const vWidth = v.width !== undefined && v.width !== null && v.width !== '' ? Number(v.width) : null;
      const vUnit = v.unit || 'cm';
      const vSize = (v.size || '').trim();
      let vDimensions = (v.dimensions || '').trim();
      if (!vDimensions && vLength !== null && vWidth !== null) {
        vDimensions = `${vLength} × ${vWidth} ${vUnit}`;
      } else if (!vDimensions) {
        vDimensions = vSize;
      }

      return {
        id: v.id || `var_${idx}`,
        size: vSize,
        sku: (v.sku || '').trim(),
        price: Number(v.price) || 0,
        compareAtPrice: v.compareAtPrice !== null && v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : null,
        stock: typeof v.stock === 'number' ? v.stock : 10,
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

    const activeVariants = normalizedVariants.filter(v => v.active !== false);
    if (activeVariants.length > 0) {
      const prices = activeVariants.map(v => v.price);
      minVariantPrice = Math.min(...prices);
      maxVariantPrice = Math.max(...prices);
      hasPriceRange = minVariantPrice !== maxVariantPrice;
      defaultVariant = activeVariants.find(v => v.isDefault) || null;
    }
  }

  const basePrice = hasVariants && minVariantPrice !== null
    ? (Number(raw.price) || minVariantPrice)
    : (Number(raw.price) || 0);

  return {
    ...raw,
    id: pId,
    _id: raw._id || pId,
    slug: raw.slug || pId,
    sku: raw.sku || '',
    name: raw.name || 'Untitled Piece',
    price: basePrice,
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : null,
    hasVariants,
    variants: normalizedVariants,
    minVariantPrice,
    maxVariantPrice,
    hasPriceRange,
    defaultVariant,
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
    dispatchTime: raw.dispatchTime || '',
    badge: raw.badge || '',
    shortDescription: raw.shortDescription || '',
    description: raw.description || '',
    details: Array.isArray(raw.details) ? raw.details : [],
    leadTime: raw.leadTime || (numericStock > 0 ? 'In Stock - Dispatches in 24-48 Hours' : 'Made to Order - 4-8 Weeks')
  };
}

/**
 * Returns active variants for a given normalized product
 */
export function getActiveVariants(product) {
  if (!product || !product.hasVariants || !Array.isArray(product.variants)) {
    return [];
  }
  return product.variants.filter(v => v.active !== false);
}

/**
 * Returns the default or first active variant
 */
export function getDefaultVariant(product) {
  const active = getActiveVariants(product);
  if (active.length === 0) return null;
  return active.find(v => v.isDefault) || null;
}

/**
 * Returns the starting / minimum price for a product
 */
export function getStartingPrice(product) {
  if (!product) return 0;
  if (product.hasVariants && product.minVariantPrice !== null) {
    return product.minVariantPrice;
  }
  return product.price || 0;
}

/**
 * Batch normalizes an array of products
 */
export function normalizeProductList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeProduct).filter(Boolean);
}
