import { v2 as cloudinary } from 'cloudinary';

/**
 * Get the configured Cloudinary cloud name.
 * Reads CLOUDINARY_CLOUD_NAME or extracts it from CLOUDINARY_URL.
 */
export const getCloudinaryCloudName = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim()) {
    return process.env.CLOUDINARY_CLOUD_NAME.trim();
  }
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim()) {
    const match = process.env.CLOUDINARY_URL.match(/@([^/?#]+)/);
    if (match) return match[1].trim();
  }
  return '';
};

/**
 * Configure and verify Cloudinary environment credentials.
 * Credentials must be kept strictly on the backend (e.g., Render Environment Variables).
 */
export const isCloudinaryConfigured = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim()) return true;
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME.trim() &&
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim() &&
    process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_SECRET.trim()
  );
};

export const initCloudinary = () => {
  if (process.env.CLOUDINARY_URL && process.env.CLOUDINARY_URL.trim()) {
    // Cloudinary automatically loads from CLOUDINARY_URL
    return cloudinary;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
      api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
      secure: true
    });
  }

  return cloudinary;
};

// Initialize on module load
initCloudinary();

/**
 * Checks whether an image URL belongs to Cloudinary and specifically
 * matches the configured cloud name (if a cloud name is set).
 *
 * Rejects legacy local assets (/images/...), external image providers (Unsplash, etc.),
 * and assets from other Cloudinary accounts.
 *
 * @param {string} url - Image URL to inspect
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();

  const pattern = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\/(?:image|raw|video)\/upload\//i;
  const match = cleanUrl.match(pattern);
  if (!match) return false;

  const configuredCloud = getCloudinaryCloudName();
  if (configuredCloud && match[1].toLowerCase() !== configuredCloud.toLowerCase()) {
    // URL belongs to a different Cloudinary account!
    return false;
  }

  return true;
};

/**
 * Extract the Cloudinary public_id from a Cloudinary image URL.
 * Accounts for folders, versions (/v12345/), transformations (c_fill,w_800/), and file extensions.
 *
 * Examples:
 *  - "https://res.cloudinary.com/cloud/image/upload/v1700000000/house-of-loom/products/silk-rug-1.jpg"
 *    -> "house-of-loom/products/silk-rug-1"
 *  - "https://res.cloudinary.com/cloud/image/upload/c_fill,w_800/v1700000000/house-of-loom/products/silk-rug-1.webp"
 *    -> "house-of-loom/products/silk-rug-1"
 *  - "https://res.cloudinary.com/cloud/image/upload/house-of-loom/products/silk-rug-1.png"
 *    -> "house-of-loom/products/silk-rug-1"
 *  - "/images/carpets/dune-saffron.jpg" -> null
 *  - "https://images.unsplash.com/..." -> null
 *
 * @param {string} url - Full image URL
 * @returns {string|null}
 */
export const extractCloudinaryPublicId = (url) => {
  if (!isCloudinaryUrl(url)) return null;

  try {
    const cleanUrl = url.trim().split('?')[0].split('#')[0];
    const uploadIdx = cleanUrl.indexOf('/upload/');
    if (uploadIdx === -1) return null;

    let pathAfterUpload = cleanUrl.substring(uploadIdx + '/upload/'.length);

    // If version is present e.g. /v1234567890/ or v1234/
    const versionMatch = pathAfterUpload.match(/(?:^|\/)v\d+\/(.+)$/);
    if (versionMatch) {
      pathAfterUpload = versionMatch[1];
    } else {
      // If no version string, skip transformation segments (segments with commas or prefixes like c_, w_, q_, etc.)
      const segments = pathAfterUpload.split('/');
      while (segments.length > 1 && (segments[0].includes(',') || /^[a-z]{1,2}_/i.test(segments[0]))) {
        segments.shift();
      }
      pathAfterUpload = segments.join('/');
    }

    // Strip file extension (.jpg, .jpeg, .png, .webp, etc.)
    const lastDotIndex = pathAfterUpload.lastIndexOf('.');
    if (lastDotIndex > 0) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload.trim() || null;
  } catch (err) {
    console.warn('[Cloudinary Public ID Extraction Warning]:', err.message);
    return null;
  }
};

/**
 * Stream-upload a memory buffer directly to Cloudinary without writing temporary files to disk.
 *
 * @param {Buffer} buffer - In-memory image file buffer from Multer
 * @param {Object} customOptions - Optional custom Cloudinary upload options
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number, format: string, bytes: number }>}
 */
export const uploadBufferToCloudinary = (buffer, customOptions = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary credentials are not configured on the server. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your Render environment variables.'
        )
      );
    }

    // Refresh configuration in case env vars were updated
    initCloudinary();

    const uploadOptions = {
      folder: 'house-of-loom/products',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }
      ],
      ...customOptions
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Upload Error]:', error);
          return reject(new Error(`Cloudinary image upload failed: ${error.message}`));
        }

        resolve({
          url: result.secure_url || result.url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Delete an image asset from Cloudinary by its public ID.
 * Returns { success: boolean, result: string, publicId: string }.
 * Treats both 'ok' and 'not found' as successful cleanup (idempotent).
 *
 * @param {string} publicId - Cloudinary public_id of the asset
 * @returns {Promise<{ success: boolean, result: string, publicId: string }>}
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured on the server.');
  }

  if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
    return { success: false, result: 'invalid_id', publicId: publicId || '' };
  }

  const cleanId = publicId.trim();

  try {
    initCloudinary();
    const response = await cloudinary.uploader.destroy(cleanId, {
      invalidate: true,
      resource_type: 'image'
    });

    const isSuccess = response?.result === 'ok' || response?.result === 'not found';

    return {
      success: isSuccess,
      result: response?.result || 'unknown',
      publicId: cleanId
    };
  } catch (err) {
    console.warn(`[Cloudinary Warning] Could not remove asset "${cleanId}":`, err.message);
    throw err;
  }
};

/**
 * Bulk delete image assets from Cloudinary by array of public IDs.
 *
 * @param {string[]} publicIds - Array of public_ids
 * @returns {Promise<Object>}
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
  if (!isCloudinaryConfigured() || !Array.isArray(publicIds) || publicIds.length === 0) {
    return { success: true, deleted: {} };
  }

  try {
    initCloudinary();
    const response = await cloudinary.api.delete_resources(publicIds, {
      all: true,
      resource_type: 'image'
    });
    return { success: true, ...response };
  } catch (err) {
    console.warn('[Cloudinary Warning] Bulk delete failed, falling back to individual deletion:', err.message);
    const results = {};
    for (const pId of publicIds) {
      try {
        const res = await deleteFromCloudinary(pId);
        results[pId] = res.result;
      } catch (indErr) {
        results[pId] = indErr.message;
      }
    }
    return { success: false, fallbackResults: results };
  }
};

export default cloudinary;
