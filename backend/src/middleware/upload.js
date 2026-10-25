import multer from 'multer';

// Use memory storage so Render's ephemeral filesystem is bypassed completely
const storage = multer.memoryStorage();

// Supported image MIME types per specification: JPG, JPEG, PNG, WEBP
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported image format "${file.mimetype}". Only JPG, JPEG, PNG, and WEBP formats are accepted for master loom photography.`
      ),
      false
    );
  }
};

const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB per file
  files: 10
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits
});

/**
 * Middleware wrapper for single product image upload ('image' field)
 */
export const handleSingleImageUpload = (req, res, next) => {
  const upload = multerInstance.single('image');

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'The selected image exceeds the maximum allowed size of 10MB. Please choose an optimized photograph.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    next();
  });
};

/**
 * Middleware wrapper for multiple product images upload ('images' field, max 10)
 */
export const handleMultipleImageUpload = (req, res, next) => {
  const upload = multerInstance.array('images', 10);

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more selected images exceed the maximum allowed size of 10MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'You can upload up to 10 photographs per batch.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    next();
  });
};
