/**
 * AR & Camera Capability Detection Service
 * 
 * Safely inspects the browser environment for:
 * 1. WebXR with 'immersive-ar' session support and hit-test
 * 2. MediaDevices camera access (getUserMedia)
 * 3. Secure context (HTTPS or localhost)
 */

export async function detectARCapabilities() {
  const isSecure = typeof window !== 'undefined'
    ? (
        window.isSecureContext ?? 
        (window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.endsWith('.localhost'))
      )
    : false;

  const result = {
    isSecure,
    hasWebXR: false,
    hasCamera: false,
    canUseLiveView: false,
    recommendedMode: 'upload', // 'webxr' | 'camera-preview' | 'upload'
    reason: ''
  };

  if (typeof window === 'undefined') {
    return result;
  }

  // 1. Insecure Context Check (Production HTTPS enforcement)
  if (!isSecure) {
    const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname);
    result.reason = isLanIp
      ? `Browsers restrict camera access on HTTP IP addresses (${window.location.hostname}). For live camera, use localhost or an HTTPS tunnel/domain.`
      : 'Live View and camera access require a secure HTTPS context.';
    result.recommendedMode = 'upload';
    result.canUseLiveView = false;
    return result;
  }

  // 2. Camera availability via getUserMedia
  if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    result.hasCamera = true;
    result.canUseLiveView = true;
    result.recommendedMode = 'camera-preview';
  }

  // 3. WebXR 'immersive-ar' capability detection (Dynamic per device, NEVER hard-coded)
  if ('xr' in navigator && typeof navigator.xr?.isSessionSupported === 'function') {
    try {
      const isArSupported = await navigator.xr.isSessionSupported('immersive-ar');
      if (isArSupported === true) {
        result.hasWebXR = true;
        result.recommendedMode = 'webxr';
      }
    } catch (err) {
      console.warn('[AR Capability] Dynamic WebXR check error:', err?.message || err);
      result.hasWebXR = false;
    }
  }

  if (!result.hasCamera && !result.hasWebXR) {
    result.reason = 'Device or browser does not support camera access or WebXR.';
    result.recommendedMode = 'upload';
    result.canUseLiveView = false;
  }

  return result;
}

/**
 * Parses product dimensions into real-world meters for WebXR AR.
 * Preserves the exact physical dimensions and catalog aspect ratio.
 * 
 * 1 foot = 0.3048 meters
 * 
 * Examples:
 * - 8' x 10' -> 2.4384m x 3.048m
 * - 5' x 8'  -> 1.524m x 2.4384m
 * - 9' x 12' -> 2.7432m x 3.6576m
 * - 6' x 9'  -> 1.8288m x 2.7432m
 * - 240 x 300 cm -> 2.4m x 3.0m
 */
export function parseRugDimensionsInMeters(dimensionsStr) {
  if (!dimensionsStr || typeof dimensionsStr !== 'string') {
    return { widthMeters: 2.4384, lengthMeters: 3.048, aspectRatio: 0.8 };
  }

  // Feet format: e.g. "8' x 10'", "8' × 10'", "8x10", "9' x 12'"
  const feetMatch = dimensionsStr.match(/(\d+(?:\.\d+)?)\s*['’]?\s*[xX×]\s*(\d+(?:\.\d+)?)/);
  if (feetMatch) {
    const d1 = parseFloat(feetMatch[1]);
    const d2 = parseFloat(feetMatch[2]);
    if (d1 > 0 && d2 > 0) {
      const wFeet = Math.min(d1, d2);
      const lFeet = Math.max(d1, d2);
      // Exact metric conversion (1 ft = 0.3048 m)
      const widthMeters = Math.round(wFeet * 0.3048 * 10000) / 10000;
      const lengthMeters = Math.round(lFeet * 0.3048 * 10000) / 10000;
      return {
        widthMeters,
        lengthMeters,
        aspectRatio: widthMeters / lengthMeters
      };
    }
  }

  // Centimeter format: e.g. "240 x 300 cm", "275 x 365"
  const cmMatch = dimensionsStr.match(/(\d+)\s*[xX×]\s*(\d+)/);
  if (cmMatch) {
    const d1 = parseFloat(cmMatch[1]);
    const d2 = parseFloat(cmMatch[2]);
    if (d1 > 0 && d2 > 0) {
      const widthMeters = Math.round((Math.min(d1, d2) / 100) * 10000) / 10000;
      const lengthMeters = Math.round((Math.max(d1, d2) / 100) * 10000) / 10000;
      return {
        widthMeters,
        lengthMeters,
        aspectRatio: widthMeters / lengthMeters
      };
    }
  }

  return { widthMeters: 2.4384, lengthMeters: 3.048, aspectRatio: 0.8 };
}
