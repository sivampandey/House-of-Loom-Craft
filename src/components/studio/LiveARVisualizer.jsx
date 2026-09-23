import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Camera, X, RefreshCw, ShoppingBag, Eye, Sliders, Move, 
  RotateCw, ZoomIn, ZoomOut, AlertCircle, CheckCircle2, 
  Sparkles, Maximize2, Minimize2, ShieldAlert
} from 'lucide-react';
import * as THREE from 'three';
import { 
  detectARCapabilities, 
  parseRugDimensionsInMeters 
} from '../../services/arCapabilityService';
import { parseRugAspectRatio } from '../../services/studioVisualizationService';

export default function LiveARVisualizer({
  selectedRug,
  onClose,
  onOpenQuickView,
  onAddToCart,
  formatPrice,
  isAddingToCart
}) {
  // Capability State
  const [capability, setCapability] = useState({
    checked: false,
    isSecure: true,
    hasWebXR: false,
    hasCamera: false,
    canUseLiveView: false,
    recommendedMode: 'camera-preview',
    reason: ''
  });

  const [activeMode, setActiveMode] = useState('camera-preview'); // 'webxr' | 'camera-preview'
  const [visualizerState, setVisualizerState] = useState('INITIALIZING CAMERA');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState('move');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // MediaStream & Video Feed Ref
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // WebXR & Three.js Refs (For Clean Disposal)
  const xrContainerRef = useRef(null);
  const xrSessionRef = useRef(null);
  const xrRendererRef = useRef(null);
  const xrSceneRef = useRef(null);
  const xrHitTestSourceRef = useRef(null);
  const xrRugMeshRef = useRef(null);
  const xrReticleRef = useRef(null);
  const xrTextureRef = useRef(null);
  const xrGeometriesRef = useRef([]);
  const xrMaterialsRef = useRef([]);

  // Camera Preview Fallback Transform State
  const [transform, setTransform] = useState({
    x: 50,
    y: 75,
    scale: 35,
    rotation: 0,
    perspectiveTilt: 60
  });

  const isDraggingRugRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origX: 50, origY: 75 });
  const containerRef = useRef(null);

  // Derive aspect ratio and exact metric dimensions with NaN/falsy guards
  const safeAspectRatio = useMemo(() => {
    const ratio = parseRugAspectRatio(selectedRug?.dimensions);
    return (typeof ratio === 'number' && !isNaN(ratio) && ratio > 0.1 && ratio < 10) ? ratio : 0.75;
  }, [selectedRug?.dimensions]);

  const realDimensions = useMemo(() => {
    return parseRugDimensionsInMeters(selectedRug?.dimensions);
  }, [selectedRug?.dimensions]);

  const rugImageUrl = useMemo(() => {
    const rawUrl = selectedRug && (
      selectedRug.texture ||
      selectedRug.thumbnail ||
      (Array.isArray(selectedRug.images) && selectedRug.images[0]) ||
      selectedRug.image
    );
    return (typeof rawUrl === 'string' && rawUrl.trim().length > 0)
      ? rawUrl.trim()
      : '/images/carpets/royal-ivory-medallion.jpg';
  }, [selectedRug]);

  // Reset image loading states when rug image source changes
  useEffect(() => {
    setImageLoaded(false);
    setImageLoadError(false);
  }, [rugImageUrl]);

  // 1. Strict MediaStream Teardown (Camera Privacy)
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 2. Strict WebXR & Three.js Memory Cleanup
  const cleanUpWebXR = useCallback(async () => {
    if (xrSessionRef.current) {
      try {
        await xrSessionRef.current.end();
      } catch (_) {}
      xrSessionRef.current = null;
    }

    if (xrHitTestSourceRef.current) {
      try {
        xrHitTestSourceRef.current.cancel();
      } catch (_) {}
      xrHitTestSourceRef.current = null;
    }

    // Dispose Three.js geometries
    xrGeometriesRef.current.forEach(geo => {
      try { geo.dispose(); } catch (_) {}
    });
    xrGeometriesRef.current = [];

    // Dispose Three.js materials
    xrMaterialsRef.current.forEach(mat => {
      try { mat.dispose(); } catch (_) {}
    });
    xrMaterialsRef.current = [];

    // Dispose textures
    if (xrTextureRef.current) {
      try { xrTextureRef.current.dispose(); } catch (_) {}
      xrTextureRef.current = null;
    }

    // Dispose Renderer & WebGL context
    if (xrRendererRef.current) {
      try {
        xrRendererRef.current.setAnimationLoop(null);
        xrRendererRef.current.dispose();
        xrRendererRef.current.forceContextLoss();
        if (xrRendererRef.current.domElement && xrRendererRef.current.domElement.parentNode) {
          xrRendererRef.current.domElement.parentNode.removeChild(xrRendererRef.current.domElement);
        }
      } catch (_) {}
      xrRendererRef.current = null;
    }

    xrSceneRef.current = null;
    xrRugMeshRef.current = null;
    xrReticleRef.current = null;
  }, []);

  // Teardown everything on unmount or close
  useEffect(() => {
    return () => {
      stopCameraStream();
      cleanUpWebXR();
    };
  }, [stopCameraStream, cleanUpWebXR]);

  // 3. Dynamic Capability Detection on Explicit Mount
  useEffect(() => {
    let isMounted = true;
    const runCheck = async () => {
      setVisualizerState('INITIALIZING CAMERA');
      const caps = await detectARCapabilities();
      if (!isMounted) return;

      setCapability({ ...caps, checked: true });

      if (!caps.isSecure) {
        setVisualizerState('Insecure context');
        setErrorMessage('Camera and Live AR require a secure HTTPS connection. Please browse via HTTPS.');
        return;
      }

      if (!caps.hasCamera && !caps.hasWebXR) {
        setVisualizerState('Browser not supported');
        setErrorMessage(caps.reason || 'Camera or AR hardware is unavailable on this browser.');
        return;
      }

      // Default to Camera Preview for reliable, instant live view
      startCameraPreview();
    };

    runCheck();
    return () => { isMounted = false; };
  }, []);

  // 4. Start Camera Preview with tiered getUserMedia constraints
  const startCameraPreview = async () => {
    try {
      setVisualizerState('INITIALIZING CAMERA');
      setErrorMessage('');

      stopCameraStream();

      let stream = null;
      let usedFallback = false;

      // Tier 1: Try rear / environment camera with HD resolution
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (tier1Err) {
        // If ideal environment/resolution is overconstrained or not found on laptops/webcams, fall back to basic video
        if (
          tier1Err.name === 'OverconstrainedError' ||
          tier1Err.name === 'ConstraintNotSatisfiedError' ||
          tier1Err.name === 'NotFoundError' ||
          tier1Err.name === 'TypeError'
        ) {
          console.warn('[Live AR] Rear camera constraint unavailable, falling back to default webcam/camera...', tier1Err);
          usedFallback = true;
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } else {
          throw tier1Err;
        }
      }

      streamRef.current = stream;

      const attachStreamToVideo = (videoEl) => {
        if (!videoEl || !stream) return;
        videoEl.srcObject = stream;

        const onReady = () => {
          videoEl.play().catch(playErr => {
            console.warn('[Live AR] Autoplay play() rejected (interaction needed?):', playErr);
          });
          setVisualizerState('Rug placed');
        };

        if (videoEl.readyState >= 1) {
          onReady();
        } else {
          videoEl.onloadedmetadata = onReady;
          videoEl.oncanplay = onReady;
        }
      };

      if (videoRef.current) {
        attachStreamToVideo(videoRef.current);
      }

      setActiveMode('camera-preview');
    } catch (err) {
      console.error('[Live View Camera Error]', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setVisualizerState('Camera permission denied');
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser or site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setVisualizerState('Camera error');
        setErrorMessage('No camera hardware was detected on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setVisualizerState('Camera error');
        setErrorMessage('The device camera is currently in use by another application or tab.');
      } else {
        setVisualizerState('Camera error');
        setErrorMessage(err.message || 'Unable to access device camera feed.');
      }
    }
  };

  // 5. Start WebXR Immersive AR (Dynamic per-device, strictly checked)
  const startWebXRSession = async () => {
    if (!window.isSecureContext || !navigator.xr || !capability.hasWebXR) {
      setVisualizerState('AR unavailable');
      setErrorMessage('WebXR immersive-ar is not supported by your current browser.');
      startCameraPreview();
      return;
    }

    try {
      setVisualizerState('INITIALIZING CAMERA');
      stopCameraStream(); // Release standard camera for WebXR exclusive control

      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
        domOverlay: xrContainerRef.current ? { root: xrContainerRef.current } : undefined
      });

      xrSessionRef.current = session;
      setActiveMode('webxr');
      setVisualizerState('Detecting surface...');

      // Three.js Scene Setup
      const scene = new THREE.Scene();
      xrSceneRef.current = scene;
      const camera = new THREE.PerspectiveCamera();

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      xrRendererRef.current = renderer;

      await renderer.xr.setSession(session);

      // Ambient & Directional Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.85);
      dirLight.position.set(0, 5, 2);
      scene.add(dirLight);

      // Hit-test Reticle (Horizontal Floor Indicator)
      const reticleGeometry = new THREE.RingGeometry(0.18, 0.22, 32).rotateX(-Math.PI / 2);
      const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x55694a, opacity: 0.85, transparent: true });
      xrGeometriesRef.current.push(reticleGeometry);
      xrMaterialsRef.current.push(reticleMaterial);

      const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      xrReticleRef.current = reticle;

      // Real-World Dimensioned Rug Mesh (Horizontal Plane)
      const texture = new THREE.TextureLoader().load(rugImageUrl);
      xrTextureRef.current = texture;

      const rugGeometry = new THREE.PlaneGeometry(realDimensions.widthMeters, realDimensions.lengthMeters);
      rugGeometry.rotateX(-Math.PI / 2); // Rotate to lie horizontal on ground
      xrGeometriesRef.current.push(rugGeometry);

      const rugMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0.05
      });
      xrMaterialsRef.current.push(rugMaterial);

      const rugMesh = new THREE.Mesh(rugGeometry, rugMaterial);
      rugMesh.visible = false;
      scene.add(rugMesh);
      xrRugMeshRef.current = rugMesh;

      // Reference Spaces
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      xrHitTestSourceRef.current = hitTestSource;
      const localSpace = await session.requestReferenceSpace('local');

      // Tap to place rug on detected horizontal surface
      const onSelect = () => {
        if (reticle.visible && rugMesh) {
          rugMesh.position.setFromMatrixPosition(reticle.matrix);
          rugMesh.position.y += 0.002; // Micro 2mm offset to prevent z-fighting with the floor mesh
          rugMesh.visible = true;
          setVisualizerState('Rug placed');
        }
      };

      session.addEventListener('select', onSelect);

      session.addEventListener('end', () => {
        cleanUpWebXR();
        startCameraPreview();
      });

      // Hit-Test & Render Loop
      renderer.setAnimationLoop((timestamp, frame) => {
        if (frame && hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(localSpace);
            if (pose) {
              const m = pose.transform.matrix;
              // Check orientation: m[5] is the Y-component of the surface normal.
              // Prefer horizontal/ground-like surface (> 0.65)
              const isHorizontal = Math.abs(m[5]) > 0.65;
              if (isHorizontal) {
                reticle.visible = true;
                reticle.matrix.fromArray(m);
                if (!rugMesh.visible) {
                  setVisualizerState('Surface detected');
                }
              } else {
                reticle.visible = false;
                if (!rugMesh.visible) {
                  setVisualizerState('Detecting surface...');
                }
              }
            }
          } else {
            reticle.visible = false;
            if (!rugMesh.visible) {
              setVisualizerState('Detecting surface...');
            }
          }
        }
        renderer.render(scene, camera);
      });

    } catch (err) {
      console.warn('[WebXR Session Initialization Failed]', err);
      setVisualizerState('AR unavailable');
      setErrorMessage('Could not launch immersive AR session. Falling back to Camera Preview mode.');
      cleanUpWebXR();
      startCameraPreview();
    }
  };

  // Direct Rug Dragging on Camera Preview Screen
  const handleRugPointerDown = (e) => {
    e.preventDefault();
    isDraggingRugRef.current = true;
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      origX: transform.x,
      origY: transform.y
    };
  };

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRugRef.current || !containerRef.current) return;
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    const rect = containerRef.current.getBoundingClientRect();

    const deltaXPercent = ((clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaYPercent = ((clientY - dragStartRef.current.y) / rect.height) * 100;

    setTransform(prev => ({
      ...prev,
      x: Math.max(15, Math.min(85, Number((dragStartRef.current.origX + deltaXPercent).toFixed(1)))),
      y: Math.max(40, Math.min(92, Number((dragStartRef.current.origY + deltaYPercent).toFixed(1))))
    }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDraggingRugRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const nudgeMove = (dx, dy) => {
    setTransform(prev => ({
      ...prev,
      x: Math.max(15, Math.min(85, Number((prev.x + dx).toFixed(1)))),
      y: Math.max(40, Math.min(92, Number((prev.y + dy).toFixed(1))))
    }));
  };

  const handleReset = () => {
    setTransform({
      x: 50,
      y: 75,
      scale: 35,
      rotation: 0,
      perspectiveTilt: 60
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl border border-[#DACDB3] overflow-hidden bg-[#1E1813] text-[#FAF7F0] shadow-2xl select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none pb-[env(safe-area-inset-bottom,16px)]' : 'min-h-[460px] sm:min-h-[540px]'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Three.js XR Container (DOM Overlay) */}
      <div ref={xrContainerRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Camera Video Feed (For Camera Preview Fallback) */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="w-full h-full object-cover absolute inset-0 pointer-events-none"
      />

      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 p-3 sm:p-4 z-30 flex items-center justify-between bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${activeMode === 'webxr' ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-[11px] sm:text-xs font-sans font-bold uppercase tracking-wider text-[#FAF7F0]">
            {activeMode === 'webxr' ? 'WebXR Immersive AR' : 'Camera Preview'}
          </span>
          <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[#FAF7F0]/90 font-mono hidden sm:inline">
            {selectedRug?.dimensions || "8' x 10'"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {capability.hasWebXR && activeMode !== 'webxr' && (
            <button
              onClick={startWebXRSession}
              className="px-3 py-1.5 rounded-full bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-[10.5px] uppercase font-sans font-bold tracking-wider flex items-center gap-1.5 shadow-md transition-all min-h-[36px]"
              title="Launch WebXR AR session"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
              <span>Launch AR</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-[#FAF7F0] flex items-center justify-center transition-colors border border-white/20 min-h-[36px]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-[#FAF7F0] flex items-center justify-center transition-colors border border-white/20 min-h-[36px]"
            title="Close Live View"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guided Instruction Banner */}
      <div className="absolute top-14 inset-x-3 sm:inset-x-6 z-30 pointer-events-none flex justify-center">
        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-center shadow-lg max-w-sm">
          {visualizerState === 'INITIALIZING CAMERA' && (
            <div className="flex items-center gap-2 text-xs text-[#D4BC9F] font-sans">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4BC9F]" />
              <span>Requesting device camera access...</span>
            </div>
          )}
          {visualizerState === 'Detecting surface...' && (
            <p className="text-xs text-[#FAF7F0] font-sans">
              Point your camera at the floor and move slowly to detect the surface.
            </p>
          )}
          {visualizerState === 'Surface detected' && (
            <p className="text-xs text-emerald-400 font-sans font-medium">
              Surface detected. Tap screen to place your rug.
            </p>
          )}
          {visualizerState === 'Rug placed' && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#FAF7F0] font-sans">
              {imageLoadError ? (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rug texture failed to load</span>
                </span>
              ) : !imageLoaded ? (
                <span className="text-[#D4BC9F] flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-[#D4BC9F]" />
                  <span>Loading rug design...</span>
                </span>
              ) : (
                <span>{activeMode === 'webxr' ? 'Rug anchored to floor. Move phone around to inspect.' : 'Drag to reposition rug onto your floor.'}</span>
              )}
            </div>
          )}
          {visualizerState === 'Camera permission denied' && (
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-sans">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Camera permission was denied.</span>
            </div>
          )}
          {visualizerState === 'Insecure context' && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-sans">
              <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
              <span>HTTPS Required for Camera</span>
            </div>
          )}
          {(visualizerState === 'Browser not supported' || visualizerState === 'Camera error') && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-sans">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage || 'Camera access error.'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Layer: Transformed Rug Placement (Camera Preview Mode) */}
      {activeMode === 'camera-preview' && visualizerState === 'Rug placed' && (
        <div 
          className="w-full h-full absolute inset-0 overflow-hidden pointer-events-none"
          style={{
            perspective: '750px',
            perspectiveOrigin: '50% 35%'
          }}
        >
          <div
            onPointerDown={handleRugPointerDown}
            className="absolute pointer-events-auto cursor-grab active:cursor-grabbing select-none"
            style={{
              left: `${transform.x}%`,
              top: `${transform.y}%`,
              width: `${Math.max(15, Math.min(85, transform.scale))}%`,
              aspectRatio: `${safeAspectRatio}`,
              transform: `translate(-50%, -50%) rotateX(${transform.perspectiveTilt}deg) rotateZ(${transform.rotation}deg)`,
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'visible'
            }}
          >
            {/* Soft Ambient Contact Shadow on Camera Floor */}
            <div 
              className="w-full h-full relative rounded-[2px] overflow-hidden"
              style={{
                boxShadow: `
                  0 4px 10px rgba(0, 0, 0, 0.40),
                  0 10px 22px rgba(0, 0, 0, 0.30),
                  0 18px 40px rgba(0, 0, 0, 0.20)
                `,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))'
              }}
            >
              <img
                src={rugImageUrl}
                alt={selectedRug?.name || 'Artisanal Rug'}
                className="w-full h-full object-cover block"
                draggable={false}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageLoadError(false);
                }}
                onError={(e) => {
                  console.error('[Live AR Visualizer] Rug image failed to load:', rugImageUrl, e);
                  setImageLoadError(true);
                  setImageLoaded(false);
                }}
                style={{
                  opacity: 0.98
                }}
              />

              {/* Natural ambient lighting gradient over camera floor */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/[0.08] via-transparent to-white/[0.08] pointer-events-none" />

              {/* Loading indicator while image is downloading over mobile data */}
              {!imageLoaded && !imageLoadError && (
                <div className="absolute inset-0 bg-[#2A2118]/80 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 text-[#D4BC9F]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#D4BC9F]" />
                  <span className="text-[10px] font-sans">Loading rug...</span>
                </div>
              )}

              {/* Image Load Error Overlay */}
              {imageLoadError && (
                <div className="absolute inset-0 bg-[#1E140E]/95 p-3 flex flex-col items-center justify-center text-center text-red-200">
                  <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
                  <p className="text-[11px] font-bold text-white">Rug Image Load Failed</p>
                  <p className="text-[9.5px] text-white/60 truncate max-w-[90%] mt-0.5">{rugImageUrl}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageLoadError(false);
                      setImageLoaded(false);
                    }}
                    className="mt-2 px-2.5 py-1 bg-[#55694A] hover:bg-[#657C58] text-white text-[10px] font-bold rounded-md uppercase tracking-wider transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error / Permission Fallback Overlay */}
      {(visualizerState === 'Camera permission denied' || visualizerState === 'Camera error' || visualizerState === 'Browser not supported' || visualizerState === 'Insecure context') && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/85 backdrop-blur-md space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center text-red-400">
            <Camera className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-2">
            <h4 className="font-serif text-xl sm:text-2xl text-[#FAF7F0]">
              {visualizerState === 'Camera permission denied' ? 'Camera Permission Required' : 'Live Camera Unavailable'}
            </h4>
            <p className="text-xs sm:text-sm text-[#D4BC9F] font-sans leading-relaxed">
              {errorMessage || 'Unable to open live camera stream. You can continue using our room photo visualizer with your own space or curated architectural rooms.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {visualizerState === 'Camera permission denied' && (
              <button
                onClick={startCameraPreview}
                className="px-5 py-2.5 rounded-full bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase font-sans font-bold tracking-wider transition-colors min-h-[42px]"
              >
                Try Camera Again
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-[#FAF7F0] text-xs uppercase font-sans font-bold tracking-wider transition-colors min-h-[42px]"
            >
              Switch to Room Photo Mode
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Control Panel (Camera Preview Mode) */}
      {activeMode === 'camera-preview' && visualizerState === 'Rug placed' && (
        <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 pb-[env(safe-area-inset-bottom,4px)]">
          <div className="bg-black/85 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 shadow-2xl space-y-3">
            
            {/* Control Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] uppercase tracking-wider text-[#D4BC9F] font-sans font-bold">
                Floor Controls:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveControlTab('move')}
                  className={`px-3 py-1 rounded-lg text-[10.5px] uppercase font-sans font-bold transition-colors min-h-[32px] ${
                    activeControlTab === 'move' ? 'bg-[#55694A] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Move
                </button>
                <button
                  onClick={() => setActiveControlTab('scale')}
                  className={`px-3 py-1 rounded-lg text-[10.5px] uppercase font-sans font-bold transition-colors min-h-[32px] ${
                    activeControlTab === 'scale' ? 'bg-[#55694A] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Resize
                </button>
                <button
                  onClick={() => setActiveControlTab('rotate')}
                  className={`px-3 py-1 rounded-lg text-[10.5px] uppercase font-sans font-bold transition-colors min-h-[32px] ${
                    activeControlTab === 'rotate' ? 'bg-[#55694A] text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  Rotate
                </button>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] uppercase font-sans text-white/70 hover:bg-white/10 min-h-[32px]"
                  title="Reset placement"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Active Control Body */}
            <div>
              {activeControlTab === 'move' && (
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-white/70 text-[11px]">Nudge Position:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button onClick={() => nudgeMove(-2, 0)} className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded text-[11px] font-bold min-h-[36px]">&larr; Left</button>
                    <button onClick={() => nudgeMove(2, 0)} className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded text-[11px] font-bold min-h-[36px]">Right &rarr;</button>
                    <button onClick={() => nudgeMove(0, -2)} className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded text-[11px] font-bold min-h-[36px]">&uarr; Up</button>
                    <button onClick={() => nudgeMove(0, 2)} className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded text-[11px] font-bold min-h-[36px]">Down &darr;</button>
                  </div>
                </div>
              )}

              {activeControlTab === 'scale' && (
                <div className="flex items-center gap-3 text-xs font-sans">
                  <ZoomOut className="w-4 h-4 text-[#D4BC9F]" />
                  <input
                    type="range"
                    min="20"
                    max="55"
                    value={transform.scale}
                    onChange={(e) => setTransform(prev => ({ ...prev, scale: Number(e.target.value) }))}
                    className="w-full accent-[#55694A] cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-[#D4BC9F]" />
                  <span className="w-10 text-right font-mono text-[11px]">{transform.scale}%</span>
                </div>
              )}

              {activeControlTab === 'rotate' && (
                <div className="flex items-center gap-3 text-xs font-sans">
                  <RotateCw className="w-4 h-4 text-[#D4BC9F]" />
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={transform.rotation}
                    onChange={(e) => setTransform(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                    className="w-full accent-[#55694A] cursor-pointer"
                  />
                  <span className="w-10 text-right font-mono text-[11px]">{transform.rotation}&deg;</span>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <div className="text-left truncate mr-2">
                <p className="text-xs font-serif truncate text-[#FAF7F0]">{selectedRug?.name || 'Artisanal Rug'}</p>
                <p className="text-[11px] font-bold font-sans text-[#D4BC9F]">{formatPrice(selectedRug?.price ?? 38500)}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {onOpenQuickView && selectedRug && (
                  <button
                    onClick={() => onOpenQuickView(selectedRug)}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs uppercase font-sans font-bold flex items-center gap-1 transition-colors min-h-[38px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4BC9F]" />
                    <span className="hidden sm:inline">View Details</span>
                  </button>
                )}

                <button
                  onClick={onAddToCart}
                  disabled={isAddingToCart}
                  className="px-4 py-2 rounded-xl bg-[#55694A] hover:bg-[#657C58] text-xs uppercase font-sans font-bold flex items-center gap-1.5 shadow-md transition-all min-h-[38px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{isAddingToCart ? 'Placing...' : 'Add to Bag'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
