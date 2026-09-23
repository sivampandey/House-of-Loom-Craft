/**
 * Perspective Warp Engine
 * 
 * Implements true 4-corner projective transform (homography) for realistic
 * floor-plane carpet placement with depth scaling, realistic contact shadow,
 * and furniture occlusion.
 */

/**
 * Computes the 3x3 forward projective matrix mapping normalized unit square [0,1]^2
 * to the arbitrary convex quadrilateral defined by 4 corner points:
 * p0: topLeft, p1: topRight, p2: bottomRight, p3: bottomLeft
 */
export function getHomographyMatrix(p0, p1, p2, p3) {
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;

  let g = 0, h = 0;
  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) > 1e-7) {
    g = (sx * dy2 - sy * dx2) / det;
    h = (dx1 * sy - dy1 * sx) / det;
  }

  const a = p1.x - p0.x + g * p1.x;
  const b = p3.x - p0.x + h * p3.x;
  const c = p0.x;
  const d = p1.y - p0.y + g * p1.y;
  const e = p3.y - p0.y + h * p3.y;
  const f = p0.y;

  return [
    a, b, c,
    d, e, f,
    g, h, 1
  ];
}

/**
 * Inverts a 3x3 matrix and returns it in column-major order for WebGL.
 * Returns null if singular.
 */
export function invert3x3(m) {
  const [
    a, b, c,
    d, e, f,
    g, h, i
  ] = m;

  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;

  if (Math.abs(det) < 1e-12) return null;
  const invDet = 1 / det;

  // Returns in column-major format for WebGL uniformMatrix3fv
  return [
    A * invDet, B * invDet, C * invDet,
    (c * h - b * i) * invDet, (a * i - c * g) * invDet, (b * g - a * h) * invDet,
    (b * f - c * e) * invDet, (c * d - a * f) * invDet, (a * e - b * d) * invDet
  ];
}

/**
 * Transforms a floor quadrilateral while strictly preserving its perspective convergence.
 * - Move: translates all 4 points.
 * - Scale: expands/contracts around quad center.
 * - Rotate: rotates around quad center in floor plane.
 */
export function transformQuad(baseQuad, { dx = 0, dy = 0, scale = 1, rotation = 0 }) {
  const { topLeft: p0, topRight: p1, bottomRight: p2, bottomLeft: p3 } = baseQuad;

  // Center of quad
  const cx = (p0.x + p1.x + p2.x + p3.x) / 4;
  const cy = (p0.y + p1.y + p2.y + p3.y) / 4;

  const rad = (rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const transformPoint = (p) => {
    // Relative to center
    let rx = (p.x - cx) * scale;
    let ry = (p.y - cy) * scale;

    // Rotate
    let rotX = rx * cos - ry * sin;
    let rotY = rx * sin + ry * cos;

    return {
      x: Number((cx + rotX + dx).toFixed(2)),
      y: Number((cy + rotY + dy).toFixed(2))
    };
  };

  return {
    topLeft: transformPoint(p0),
    topRight: transformPoint(p1),
    bottomRight: transformPoint(p2),
    bottomLeft: transformPoint(p3)
  };
}

/**
 * Adjusts quadrilateral width to match the genuine aspect ratio of the selected rug.
 * Prevents any stretching or squishing of the original rug design.
 */
export function applyAspectRatioToQuad(quad, targetRatio = 0.8) {
  // Reference ratio for calibrated quads is 0.8 (standard 8x10)
  const ratioFactor = targetRatio / 0.8;
  const cx = (quad.topLeft.x + quad.topRight.x + quad.bottomRight.x + quad.bottomLeft.x) / 4;

  return {
    topLeft: { x: Number((cx + (quad.topLeft.x - cx) * ratioFactor).toFixed(2)), y: quad.topLeft.y },
    topRight: { x: Number((cx + (quad.topRight.x - cx) * ratioFactor).toFixed(2)), y: quad.topRight.y },
    bottomRight: { x: Number((cx + (quad.bottomRight.x - cx) * ratioFactor).toFixed(2)), y: quad.bottomRight.y },
    bottomLeft: { x: Number((cx + (quad.bottomLeft.x - cx) * ratioFactor).toFixed(2)), y: quad.bottomLeft.y }
  };
}

/**
 * Curated Room Calibrations:
 * Each curated room has its calibrated usable floor quadrilateral
 * with far edge smaller (narrower) than near edge, matching real room floor perspective.
 */
export const ROOM_CALIBRATIONS = {
  'curated-living': {
    id: 'curated-living',
    name: 'Curated Living Room',
    image: '/images/room-before.jpg',
    // Floor quadrilateral positioned naturally around the seating area
    // Top edge sits at the sofa base rail (Y=64.5%), front edge extends towards camera (Y=91.0%)
    defaultQuad: {
      topLeft: { x: 26.0, y: 64.5 },
      topRight: { x: 67.0, y: 64.5 },
      bottomRight: { x: 81.0, y: 91.0 },
      bottomLeft: { x: 15.0, y: 91.0 }
    },
    // Travertine coffee table and ceramic vase with branches sitting ON TOP of the rug
    occlusionPolygons: [
      [
        { x: 34.0, y: 70.0 },
        { x: 39.0, y: 70.0 },
        { x: 39.0, y: 52.0 }, // Vase left
        { x: 46.0, y: 45.0 }, // Branches top
        { x: 52.0, y: 45.0 }, // Branches top right
        { x: 50.0, y: 64.0 }, // Vase right
        { x: 55.0, y: 70.0 },
        { x: 61.5, y: 70.0 }, // Table top right
        { x: 62.0, y: 76.5 }, // Table right edge bottom
        { x: 56.5, y: 76.5 },
        { x: 56.0, y: 84.0 }, // Table base bottom right
        { x: 40.5, y: 84.0 }, // Table base bottom left
        { x: 40.0, y: 76.5 },
        { x: 34.0, y: 76.5 }  // Table left edge bottom
      ]
    ]
  },
  'sunlit-salon': {
    id: 'sunlit-salon',
    name: 'Sunlit High-Ceiling Salon',
    image: '/images/sample-room-salon.jpg',
    defaultQuad: {
      topLeft: { x: 26.0, y: 58.5 },
      topRight: { x: 68.0, y: 58.5 },
      bottomRight: { x: 82.0, y: 89.5 },
      bottomLeft: { x: 15.0, y: 89.5 }
    },
    occlusionPolygons: []
  },
  'mountain-suite': {
    id: 'mountain-suite',
    name: 'Japandi Bedroom Suite',
    image: '/images/sample-room-penthouse.jpg',
    defaultQuad: {
      topLeft: { x: 18.0, y: 63.5 },
      topRight: { x: 56.0, y: 63.5 },
      bottomRight: { x: 68.0, y: 91.5 },
      bottomLeft: { x: 9.0, y: 91.5 }
    },
    occlusionPolygons: []
  }
};

/**
 * Default calibration for customer-uploaded room photos.
 */
export const DEFAULT_UPLOAD_QUAD = {
  topLeft: { x: 28.0, y: 60.0 },
  topRight: { x: 72.0, y: 60.0 },
  bottomRight: { x: 84.0, y: 88.0 },
  bottomLeft: { x: 16.0, y: 88.0 }
};

/**
 * WebGL-based Projective Texture Homography Renderer.
 * High-performance, pixel-perfect perspective mapping with edge antialiasing.
 */
export class ProjectiveWarpRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false }) ||
              canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    this.isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && this.gl instanceof WebGL2RenderingContext;
    this.program = null;
    this.texture = null;
    this.posBuffer = null;
    this.isReady = false;
    this.hasError = false;
    this.errorMessage = null;

    // Offscreen 2D mask canvas for arbitrary occlusion polygon rasterization
    this.maskCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    if (this.maskCanvas) {
      this.maskCanvas.width = 512;
      this.maskCanvas.height = 512;
      this.maskCtx = this.maskCanvas.getContext('2d');
    }
    this.maskTexture = null;
    this.currentOcclusionKey = null;

    if (!this.gl) {
      this.hasError = true;
      this.errorMessage = 'WebGL is not supported or was disabled in your browser.';
      console.error('[PerspectiveWarpRenderer] WebGL context creation failed:', this.errorMessage);
      return;
    }

    this.initGL();
  }

  initGL() {
    const gl = this.gl;
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_pos;
      void main() {
        v_pos = a_position;
        // Convert [0, 1] to clip space [-1, 1]
        gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0.0, 1.0);
      }
    `;

    const fsSource = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif

      varying vec2 v_pos;
      uniform sampler2D u_texture;
      uniform sampler2D u_occlusionMask;
      uniform int u_hasOcclusion;
      uniform mat3 u_invH;
      uniform float u_opacity;
      uniform float u_sliderPos;

      void main() {
        if (v_pos.x > u_sliderPos) {
          discard;
        }

        // Real-time furniture & decor occlusion: discard pixels behind foreground objects
        if (u_hasOcclusion == 1) {
          float occluded = texture2D(u_occlusionMask, v_pos).r;
          if (occluded > 0.5) {
            discard;
          }
        }

        // Projective backward mapping from canvas coordinate to texture UV
        vec3 p = u_invH * vec3(v_pos, 1.0);
        if (p.z == 0.0) { discard; }
        vec2 uv = p.xy / p.z;

        // Clip strictly outside unit quad
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          discard;
        }

        // Sub-pixel edge antialiasing
        vec2 d = min(uv, 1.0 - uv);
        float edge = clamp(min(d.x, d.y) * 160.0, 0.0, 1.0);

        vec4 texColor = texture2D(u_texture, uv);

        // Subtle natural ambient floor illumination (slight depth shading)
        vec3 shaded = texColor.rgb * mix(0.95, 1.02, uv.y);
        gl_FragColor = vec4(shaded, texColor.a * u_opacity * edge);
      }
    `;

    // Compile Vertex Shader
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(vs);
      gl.deleteShader(vs);
      this.hasError = true;
      this.errorMessage = `Vertex shader compilation failed: ${info}`;
      console.error('[PerspectiveWarpRenderer]', this.errorMessage);
      return;
    }

    // Compile Fragment Shader
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(fs);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      this.hasError = true;
      this.errorMessage = `Fragment shader compilation failed: ${info}`;
      console.error('[PerspectiveWarpRenderer]', this.errorMessage);
      return;
    }

    // Link Program
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      this.hasError = true;
      this.errorMessage = `WebGL shader program linking failed: ${info}`;
      console.error('[PerspectiveWarpRenderer]', this.errorMessage);
      return;
    }

    // Clean up shaders after successful link
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    // Fullscreen quad buffer
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1
    ]), gl.STATIC_DRAW);
    this.posBuffer = posBuffer;

    // Initialize 2D occlusion mask texture
    const maskTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 1x1 black fallback (0 = no occlusion)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    this.maskTexture = maskTex;

    this.isReady = true;
    this.hasError = false;
    this.errorMessage = null;
  }

  updateOcclusionMask(occlusionPolygons) {
    const gl = this.gl;
    if (!gl || !this.maskCanvas || !this.maskCtx || !this.maskTexture) return false;

    if (!occlusionPolygons || !Array.isArray(occlusionPolygons) || occlusionPolygons.length === 0) {
      this.currentOcclusionKey = null;
      return false;
    }

    // Generate unique key to avoid re-rendering mask texture if polygons haven't changed
    const key = JSON.stringify(occlusionPolygons);
    if (this.currentOcclusionKey === key) {
      return true;
    }

    const ctx = this.maskCtx;
    const w = this.maskCanvas.width;
    const h = this.maskCanvas.height;

    // Black = floor transparent to rug (rug visible)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // White = furniture occlusion (rug discarded, underlying room photo visible)
    ctx.fillStyle = '#ffffff';

    for (const poly of occlusionPolygons) {
      if (Array.isArray(poly) && poly.length >= 3) {
        ctx.beginPath();
        ctx.moveTo((poly[0].x / 100) * w, (poly[0].y / 100) * h);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo((poly[i].x / 100) * w, (poly[i].y / 100) * h);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.maskCanvas);

    this.currentOcclusionKey = key;
    return true;
  }

  loadTexture(imageElement) {
    const gl = this.gl;
    if (!gl || !this.program) {
      console.warn('[PerspectiveWarpRenderer] Cannot load texture: WebGL is not ready.');
      return false;
    }

    if (!imageElement || !imageElement.complete || imageElement.naturalWidth === 0) {
      console.warn('[PerspectiveWarpRenderer] Invalid or uncompleted image element passed to loadTexture');
      return false;
    }

    if (this.texture) {
      gl.deleteTexture(this.texture);
      this.texture = null;
    }

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // In WebGL 1, NPOT textures REQUIRE gl.LINEAR or gl.NEAREST for min filter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    try {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
      if (this.isWebGL2) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      }
      this.texture = tex;
      return true;
    } catch (e) {
      this.hasError = true;
      this.errorMessage = `Texture upload failed: ${e?.message || e}`;
      console.error('[PerspectiveWarpRenderer] Failed to load WebGL texture:', e);
      return false;
    }
  }

  render(quad, opacity = 0.96, sliderPos = 100, occlusionPolygons = []) {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Compute normalized coordinates [0, 1]
    const p0 = { x: quad.topLeft.x / 100, y: quad.topLeft.y / 100 };
    const p1 = { x: quad.topRight.x / 100, y: quad.topRight.y / 100 };
    const p2 = { x: quad.bottomRight.x / 100, y: quad.bottomRight.y / 100 };
    const p3 = { x: quad.bottomLeft.x / 100, y: quad.bottomLeft.y / 100 };

    const H = getHomographyMatrix(p0, p1, p2, p3);
    const invH = invert3x3(H);
    if (!invH) return;

    // Set uniforms
    const uInvHLoc = gl.getUniformLocation(this.program, 'u_invH');
    gl.uniformMatrix3fv(uInvHLoc, false, new Float32Array(invH));

    const uOpacityLoc = gl.getUniformLocation(this.program, 'u_opacity');
    gl.uniform1f(uOpacityLoc, opacity);

    const uSliderPosLoc = gl.getUniformLocation(this.program, 'u_sliderPos');
    gl.uniform1f(uSliderPosLoc, sliderPos / 100);

    // Update and bind occlusion mask
    const hasOcclusion = this.updateOcclusionMask(occlusionPolygons);
    const uHasOcclusionLoc = gl.getUniformLocation(this.program, 'u_hasOcclusion');
    gl.uniform1i(uHasOcclusionLoc, hasOcclusion ? 1 : 0);

    if (hasOcclusion && this.maskTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
      const uMaskLoc = gl.getUniformLocation(this.program, 'u_occlusionMask');
      gl.uniform1i(uMaskLoc, 1);
    }

    // Bind rug texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    const uTexLoc = gl.getUniformLocation(this.program, 'u_texture');
    gl.uniform1i(uTexLoc, 0);

    // Bind vertex attribute
    const aPosLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  dispose() {
    const gl = this.gl;
    if (!gl) return;
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.maskTexture) gl.deleteTexture(this.maskTexture);
    if (this.program) gl.deleteProgram(this.program);
    if (this.posBuffer) gl.deleteBuffer(this.posBuffer);
  }
}
