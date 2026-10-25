import { v2 as cloudinary } from 'cloudinary';

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
  if (process.env.CLOUDINARY_URL) {
    // Cloudinary automatically loads from CLOUDINARY_URL
    return cloudinary;
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true
    });
  }

  return cloudinary;
};

// Initialize on module load
initCloudinary();

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
 *
 * @param {string} publicId - Cloudinary public_id of the asset
 */
export const deleteFromCloudinary = async (publicId) => {
  if (!isCloudinaryConfigured() || !publicId) return;

  try {
    initCloudinary();
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`[Cloudinary Warning] Could not remove asset "${publicId}":`, err.message);
  }
};

export default cloudinary;
