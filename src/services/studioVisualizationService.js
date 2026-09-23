/**
 * Studio Visualization Service
 * 
 * Provides calibrated sample room metadata, floor bounding planes,
 * dimension-aware aspect ratio calculations, file validation,
 * and extensible hooks for future AI inpainting providers.
 */

// Supported file types for room photo upload
export const SUPPORTED_ROOM_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const MAX_ROOM_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Robust Product Dimension Parser.
 * Derives true width-to-length aspect ratio (e.g. 8x10 = 0.8, 9x12 = 0.75, 6x9 = 0.67).
 * Prevents any stretching or unnatural distortion.
 */
export function parseRugAspectRatio(dimensions) {
  if (!dimensions || typeof dimensions !== 'string') return 0.75; // Standard 3:4 ratio fallback

  // Feet format: e.g. "8' x 10'", "8' × 10'", "8 x 10", "9'x12'"
  const feetMatch = dimensions.match(/(\d+(?:\.\d+)?)\s*['’]?\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  if (feetMatch) {
    const d1 = parseFloat(feetMatch[1]);
    const d2 = parseFloat(feetMatch[2]);
    if (d1 > 0 && d2 > 0) {
      // Rugs on floor: smaller dimension is width across, larger is length receding into room
      return Math.min(d1, d2) / Math.max(d1, d2);
    }
  }

  // Centimeter format: e.g. "240 x 300 cm", "275 x 365"
  const cmMatch = dimensions.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (cmMatch) {
    const d1 = parseFloat(cmMatch[1]);
    const d2 = parseFloat(cmMatch[2]);
    if (d1 > 0 && d2 > 0) {
      return Math.min(d1, d2) / Math.max(d1, d2);
    }
  }

  return 0.75;
}

/**
 * Curated local sample architectural rooms with verified clean, bare floors (NO existing rugs).
 * Each room has calibrated floor bounding coordinates, perspective vanishing origin,
 * and realistic floor tilt.
 */
export const SAMPLE_ROOMS = [
  {
    id: 'curated-living',
    name: 'Curated Living Room',
    subtitle: 'Warm chevron oak floor with panoramic garden vista',
    image: '/images/room-before.jpg',
    thumbnail: '/images/room-before.jpg',
    perspectiveOrigin: { x: 50, y: 44 }, // Horizon at sofa/window line
    defaultTransform: {
      x: 48, // % from left
      y: 77, // % from top (settled in front of travertine table)
      scale: 33, // % of container width (realistic 8x10 proportion)
      rotation: 0,
      perspectiveTilt: 58 // 3D floor tilt
    },
    bounds: {
      minX: 20,
      maxX: 78,
      minY: 62,
      maxY: 88,
      minScale: 20,
      maxScale: 48
    }
  },
  {
    id: 'sunlit-salon',
    name: 'Sunlit High-Ceiling Salon',
    subtitle: 'High-ceiling architectural salon with bare parquet floor',
    image: '/images/sample-room-salon.jpg',
    thumbnail: '/images/sample-room-salon.jpg',
    perspectiveOrigin: { x: 50, y: 40 },
    defaultTransform: {
      x: 50,
      y: 76,
      scale: 34,
      rotation: -3,
      perspectiveTilt: 56
    },
    bounds: {
      minX: 18,
      maxX: 82,
      minY: 58,
      maxY: 88,
      minScale: 20,
      maxScale: 50
    }
  },
  {
    id: 'mountain-suite',
    name: 'Japandi Bedroom Suite',
    subtitle: 'Minimalist suite with wide-plank wood floor',
    image: '/images/sample-room-penthouse.jpg',
    thumbnail: '/images/sample-room-penthouse.jpg',
    perspectiveOrigin: { x: 50, y: 42 },
    defaultTransform: {
      x: 42,
      y: 78,
      scale: 33,
      rotation: 0,
      perspectiveTilt: 56
    },
    bounds: {
      minX: 16,
      maxX: 74,
      minY: 62,
      maxY: 89,
      minScale: 18,
      maxScale: 48
    }
  }
];

/**
 * Default calibration for customer uploaded rooms.
 * Uses a conservative, realistic scale and lower-floor positioning.
 */
export const DEFAULT_UPLOAD_CALIBRATION = {
  perspectiveOrigin: { x: 50, y: 45 },
  defaultTransform: {
    x: 50,
    y: 78,
    scale: 33,
    rotation: 0,
    perspectiveTilt: 55
  },
  bounds: {
    minX: 12,
    maxX: 88,
    minY: 50,
    maxY: 92,
    minScale: 18,
    maxScale: 52
  }
};

/**
 * Validates an uploaded room photo file.
 */
export function validateRoomFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' };
  }

  if (!SUPPORTED_ROOM_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload JPG, JPEG, PNG, or WEBP.'
    };
  }

  if (file.size > MAX_ROOM_FILE_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMb}MB) exceeds the 10MB limit. Please choose a smaller image.`
    };
  }

  const previewUrl = URL.createObjectURL(file);
  return {
    valid: true,
    previewUrl,
    file
  };
}

/**
 * Standard AI Room Inpainting Prompt Specification (decoupled for future integration).
 */
export function getAiInpaintingPrompt(productName = 'handcrafted rug') {
  return (
    `Use the uploaded room photograph as the base image. ` +
    `Preserve the room's architecture, walls, windows, doors, furniture, decor, camera angle, perspective and lighting. ` +
    `Place only the selected ${productName} naturally on the visible floor area. ` +
    `Preserve the exact rug pattern, colors, texture and proportions from the product image. ` +
    `Match perspective, scale, shadows and lighting realistically. ` +
    `Do not redesign the room. Do not add or remove furniture. Do not modify walls or architecture.`
  );
}

/**
 * Future AI Inpainting Provider Hook.
 * Explicitly reports current limitations without faking.
 */
export async function requestFutureAiInpainting({ roomImage, product, transform }) {
  return {
    supported: false,
    reason: 'Gemini model is configured for text-only completion. True room inpainting requires Google Cloud Vertex AI Imagen inpainting credentials.',
    prompt: getAiInpaintingPrompt(product?.name)
  };
}
