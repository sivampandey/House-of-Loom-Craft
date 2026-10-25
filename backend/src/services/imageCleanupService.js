import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import {
  isCloudinaryConfigured,
  extractCloudinaryPublicId,
  isCloudinaryUrl,
  deleteFromCloudinary
} from '../config/cloudinary.js';

// Helper to escape regex special characters
const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Identifies and collects all distinct Cloudinary assets associated with a product.
 * Inspects:
 *  - Primary thumbnail
 *  - Product image gallery (images)
 *  - Texture image
 *  - Structured imageAssets metadata array
 *
 * Deduplicates by public_id and ignores non-Cloudinary / legacy local URLs.
 *
 * @param {Object} product - Mongoose Product document or plain product object
 * @returns {Array<{ publicId: string, url: string }>}
 */
export const collectProductCloudinaryAssets = (product) => {
  if (!product) return [];

  const assetMap = new Map(); // publicId -> { publicId, url }

  const register = (rawUrl, explicitPublicId = '') => {
    if (!rawUrl && !explicitPublicId) return;

    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    let publicId = (typeof explicitPublicId === 'string' ? explicitPublicId.trim() : '');

    // If explicit public_id wasn't provided, extract it from URL
    if (!publicId && url) {
      if (isCloudinaryUrl(url)) {
        publicId = extractCloudinaryPublicId(url) || '';
      }
    }

    // Only register valid Cloudinary public_ids
    if (publicId) {
      if (!assetMap.has(publicId)) {
        assetMap.set(publicId, {
          publicId,
          url: url || ''
        });
      } else if (url && !assetMap.get(publicId).url) {
        // Enrich URL if missing
        assetMap.get(publicId).url = url;
      }
    }
  };

  // 1. Inspect imageAssets array if present
  if (Array.isArray(product.imageAssets)) {
    for (const asset of product.imageAssets) {
      if (asset) {
        register(asset.url, asset.publicId);
      }
    }
  }

  // 2. Inspect primary thumbnail
  if (product.thumbnail) {
    register(product.thumbnail);
  }

  // 3. Inspect image gallery
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (img) register(img);
    }
  }

  // 4. Inspect texture image
  if (product.texture) {
    register(product.texture);
  }

  return Array.from(assetMap.values());
};

/**
 * Checks whether an asset is shared with another product or referenced in customer order history.
 *
 * Prevents accidental deletion of shared photographs:
 * If piece A and piece B share an image, deleting piece A will NEVER delete the shared photograph.
 * If historical customer orders reference the image, it is retained.
 *
 * @param {Object} asset - { publicId: string, url: string }
 * @param {string|mongoose.Types.ObjectId} excludeProductId - ID of product being deleted
 * @returns {Promise<{ isShared: boolean, reason?: string, sharedId?: string }>}
 */
export const isAssetSharedWithOtherEntities = async (asset, excludeProductId) => {
  if (!asset || !asset.publicId) {
    return { isShared: false };
  }

  const { publicId, url } = asset;
  const escapedPublicId = escapeRegex(publicId);

  // 1. Check if another product in the catalog references this public_id or URL
  const orConditions = [
    { 'imageAssets.publicId': publicId },
    { thumbnail: { $regex: escapedPublicId } },
    { images: { $regex: escapedPublicId } },
    { texture: { $regex: escapedPublicId } }
  ];

  if (url) {
    orConditions.push(
      { thumbnail: url },
      { images: url },
      { texture: url },
      { 'imageAssets.url': url }
    );
  }

  const otherProduct = await Product.findOne({
    _id: { $ne: excludeProductId },
    $or: orConditions
  }).select('_id name slug');

  if (otherProduct) {
    return {
      isShared: true,
      reason: `Referenced by catalog product "${otherProduct.name}" (${otherProduct._id})`,
      sharedId: otherProduct._id.toString()
    };
  }

  // 2. Check if any past customer order references this image
  const orderConditions = [
    { 'items.image': { $regex: escapedPublicId } }
  ];
  if (url) {
    orderConditions.push({ 'items.image': url });
  }

  const referencingOrder = await Order.findOne({
    $or: orderConditions
  }).select('_id orderNumber');

  if (referencingOrder) {
    return {
      isShared: true,
      reason: `Referenced in customer order record #${referencingOrder.orderNumber}`,
      sharedId: referencingOrder._id.toString()
    };
  }

  return { isShared: false };
};

/**
 * Executes safe Cloudinary cleanup for a permanently deleted product:
 *  - Identifies all Cloudinary assets
 *  - Checks whether each asset is shared
 *  - Deletes only exclusively owned assets from Cloudinary
 *  - Retains shared assets
 *  - Handles partial failures without crashing or throwing unhandled errors
 *
 * @param {Object} product - Product document being permanently deleted
 * @returns {Promise<{
 *   totalAssetsFound: number,
 *   deletedCount: number,
 *   retainedSharedCount: number,
 *   failedCount: number,
 *   deletedAssets: string[],
 *   retainedSharedAssets: string[],
 *   failedAssets: Array<{ publicId: string, error: string }>
 * }>}
 */
export const cleanupProductAssets = async (product) => {
  const report = {
    totalAssetsFound: 0,
    deletedCount: 0,
    retainedSharedCount: 0,
    failedCount: 0,
    deletedAssets: [],
    retainedSharedAssets: [],
    failedAssets: []
  };

  if (!product) return report;

  // If Cloudinary is not configured on this server, log and skip gracefully
  if (!isCloudinaryConfigured()) {
    console.warn('[Cloudinary Cleanup] Skipping Cloudinary cleanup because credentials are not configured.');
    return report;
  }

  const candidateAssets = collectProductCloudinaryAssets(product);
  report.totalAssetsFound = candidateAssets.length;

  if (candidateAssets.length === 0) {
    return report;
  }

  for (const asset of candidateAssets) {
    try {
      // Check if shared with any other product or historical order
      const shareCheck = await isAssetSharedWithOtherEntities(asset, product._id);

      if (shareCheck.isShared) {
        console.log(
          `[Cloudinary Cleanup] Retaining shared asset "${asset.publicId}": ${shareCheck.reason}`
        );
        report.retainedSharedCount++;
        report.retainedSharedAssets.push({
          publicId: asset.publicId,
          reason: shareCheck.reason
        });
        continue;
      }

      // Exclusively owned: remove from Cloudinary
      const delResult = await deleteFromCloudinary(asset.publicId);
      if (delResult.success) {
        console.log(`[Cloudinary Cleanup] Successfully deleted asset "${asset.publicId}" (${delResult.result}).`);
        report.deletedCount++;
        report.deletedAssets.push(asset.publicId);
      } else {
        console.warn(`[Cloudinary Cleanup] Asset "${asset.publicId}" could not be deleted: ${delResult.result}`);
        report.failedCount++;
        report.failedAssets.push({
          publicId: asset.publicId,
          error: delResult.result
        });
      }
    } catch (err) {
      console.error(`[Cloudinary Cleanup Error] Exception deleting asset "${asset.publicId}":`, err.message);
      report.failedCount++;
      report.failedAssets.push({
        publicId: asset.publicId,
        error: err.message
      });
    }
  }

  return report;
};
