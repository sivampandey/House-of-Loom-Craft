import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Upload, Image as ImageIcon, Sparkles, RefreshCw, ShoppingBag, 
  Eye, Check, Sliders, Move, RotateCw, ZoomIn, ZoomOut, 
  ArrowLeftRight, AlertCircle, X, ChevronDown, CheckCircle2,
  Camera, Crosshair
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { useCart } from '../../context/CartContext';
import { productsAPI } from '../../services/api';
import { carpetsData } from '../../data/carpets';
import { 
  SAMPLE_ROOMS, 
  parseRugAspectRatio,
  validateRoomFile
} from '../../services/studioVisualizationService';
import {
  ROOM_CALIBRATIONS,
  DEFAULT_UPLOAD_QUAD,
  ProjectiveWarpRenderer,
  transformQuad,
  applyAspectRatioToQuad
} from '../../services/perspectiveWarpEngine';
import LiveARVisualizer from '../studio/LiveARVisualizer';

export default function Interactive3DSection({ onOpenQuickView, onShowToast }) {
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();

  // Primary Studio Mode: 'upload' | 'live'
  const [visualizationMode, setVisualizationMode] = useState('upload');

  // Active Catalog Products for Rug Selection (Instant frame-0 population)
  const [catalogRugs, setCatalogRugs] = useState(carpetsData);
  const [selectedRug, setSelectedRug] = useState(carpetsData[0]);
  const [isRugPickerOpen, setIsRugPickerOpen] = useState(false);
  const [webglError, setWebglError] = useState(null);
  const [textureError, setTextureError] = useState(null);

  // Room Image & Active Room ID
  const [roomImage, setRoomImage] = useState(SAMPLE_ROOMS[0].image);
  const [activeSampleId, setActiveSampleId] = useState(SAMPLE_ROOMS[0].id);
  const [uploadError, setUploadError] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // 4-Corner Perspective Calibration State
  const [isCalibratingFloor, setIsCalibratingFloor] = useState(false);
  const [calibrationNotice, setCalibrationNotice] = useState(null);

  // Active Room Floor Calibration & Occlusion Polygons
  const activeCalibration = useMemo(() => {
    if (activeSampleId && ROOM_CALIBRATIONS[activeSampleId]) {
      return ROOM_CALIBRATIONS[activeSampleId];
    }
    return {
      id: 'custom-upload',
      name: 'Your Uploaded Space',
      defaultQuad: DEFAULT_UPLOAD_QUAD,
      occlusionPolygons: []
    };
  }, [activeSampleId]);

  // Derive genuine aspect ratio of the selected rug (e.g., 8x10 = 0.8, 5x8 = 0.625)
  const rugAspectRatio = useMemo(() => {
    return parseRugAspectRatio(selectedRug?.dimensions);
  }, [selectedRug?.dimensions]);

  // Base calibrated quad adjusted for genuine product aspect ratio
  const baseQuad = useMemo(() => {
    return applyAspectRatioToQuad(activeCalibration.defaultQuad, rugAspectRatio);
  }, [activeCalibration.defaultQuad, rugAspectRatio]);

  // User adjustments applied to base quad while strictly preserving perspective convergence
  const [userAdjustments, setUserAdjustments] = useState({
    dx: 0,
    dy: 0,
    scale: 1,
    rotation: 0
  });

  // Current active floor quadrilateral (4 corners in percentage coordinates)
  const [floorQuad, setFloorQuad] = useState(() => {
    return applyAspectRatioToQuad(ROOM_CALIBRATIONS['curated-living'].defaultQuad, 0.8);
  });

  // When room or rug aspect ratio changes, re-derive floor quad
  useEffect(() => {
    setUserAdjustments({ dx: 0, dy: 0, scale: 1, rotation: 0 });
    setFloorQuad(baseQuad);
  }, [baseQuad]);

  // Comparison & View State
  const [showComparisonSlider, setShowComparisonSlider] = useState(false);
  const [sliderPos, setSliderPos] = useState(50); // % from left (0 = bare room, 100 = full rug)
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeControlTab, setActiveControlTab] = useState('move'); // 'move', 'scale', 'rotate'

  // Canvas & WebGL Renderer Refs
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const previewContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textureImageRef = useRef(null);

  // Drag interaction tracking refs
  const isDraggingRugRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, origDx: 0, origDy: 0 });
  const activeDragCornerRef = useRef(null);
  const isDraggingSliderRef = useRef(false);
  const touchStartDistRef = useRef(null);
  const touchStartScaleRef = useRef(1);

  // Selected rug visual asset
  const rugImageUrl = useMemo(() => {
    if (!selectedRug) return '/images/carpets/royal-ivory-medallion.jpg';
    return selectedRug.texture || selectedRug.thumbnail || (selectedRug.images && selectedRug.images[0]) || selectedRug.image;
  }, [selectedRug]);

  // Helper: Smooth scroll with floating navbar clearance
  const scrollToStudio = useCallback(() => {
    const el = document.getElementById('studio');
    if (el) {
      const navbarHeight = 90;
      const targetY = el.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }
  }, []);

  // Initialize WebGL Projective Renderer on Canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new ProjectiveWarpRenderer(canvasRef.current);
    if (renderer.hasError) {
      setWebglError(renderer.errorMessage || 'WebGL failed to initialize on your browser/device.');
    } else {
      setWebglError(null);
    }
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // Render WebGL frame onto the floor plane
  const renderFrame = useCallback(() => {
    if (!rendererRef.current || !canvasRef.current || !previewContainerRef.current) return;

    const rect = previewContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvasRef.current.width !== targetW || canvasRef.current.height !== targetH) {
      canvasRef.current.width = targetW;
      canvasRef.current.height = targetH;
    }

    rendererRef.current.render(
      floorQuad, 
      0.97, 
      showComparisonSlider ? sliderPos : 100,
      activeCalibration?.occlusionPolygons || []
    );
  }, [floorQuad, showComparisonSlider, sliderPos, activeCalibration]);

  // Load Rug Texture into WebGL Renderer with robust CORS & same-origin handling
  useEffect(() => {
    if (!rugImageUrl) return;

    let isMounted = true;
    setTextureError(null);

    const isExternal = /^https?:\/\//i.test(rugImageUrl) || /^\/\//.test(rugImageUrl);
    const isDifferentOrigin = isExternal && (typeof window !== 'undefined' && !rugImageUrl.startsWith(window.location.origin));

    const loadTextureImage = (useCrossOrigin) => {
      const img = new Image();
      if (useCrossOrigin) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        if (!isMounted) return;
        textureImageRef.current = img;
        if (rendererRef.current) {
          const success = rendererRef.current.loadTexture(img);
          if (success) {
            setTextureError(null);
            renderFrame();
          } else {
            setTextureError(rendererRef.current.errorMessage || 'Failed to upload rug texture to 3D floor map.');
          }
        }
      };

      img.onerror = (err) => {
        if (!isMounted) return;
        if (useCrossOrigin) {
          // If crossOrigin anonymous failed due to missing CORS headers, retry as same-origin
          console.warn('[Interactive3D] Image load with crossOrigin anonymous failed, retrying without CORS...', rugImageUrl);
          loadTextureImage(false);
        } else {
          console.error('[Interactive3D] Failed to load rug texture image:', rugImageUrl, err);
          setTextureError(`Unable to load rug texture: ${rugImageUrl}`);
        }
      };

      img.src = rugImageUrl;
    };

    loadTextureImage(isDifferentOrigin);

    return () => {
      isMounted = false;
    };
  }, [rugImageUrl, renderFrame]);

  // Re-render whenever floor quad, slider position or active room calibration changes
  useEffect(() => {
    renderFrame();
  }, [floorQuad, showComparisonSlider, sliderPos, activeCalibration, renderFrame]);

  // Handle Container Resize (for responsive viewports)
  useEffect(() => {
    const handleResize = () => {
      renderFrame();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderFrame]);

  // 1. Fetch Catalog & Resolve Initial Product
  useEffect(() => {
    let isMounted = true;
    const loadCatalog = async () => {
      try {
        const res = await productsAPI.getProducts({ category: 'carpets' });
        const list = (res && res.success && res.products && res.products.length > 0)
          ? res.products
          : carpetsData;

        if (!isMounted) return;
        setCatalogRugs(list);

        const urlParams = new URLSearchParams(window.location.search);
        let targetParam = urlParams.get('product');
        let targetMode = urlParams.get('mode');

        if (window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.split('?')[1];
          const hashParams = new URLSearchParams(hashQuery);
          if (!targetParam) targetParam = hashParams.get('product');
          if (!targetMode) targetMode = hashParams.get('mode');
        }

        if (targetMode === 'live') {
          setVisualizationMode('live');
        }

        if (targetParam) {
          const matched = list.find(
            p => (p.slug && p.slug === targetParam) || 
                 (p.id && String(p.id) === targetParam) || 
                 (p._id && String(p._id) === targetParam)
          );
          if (matched) {
            setSelectedRug(matched);
            return;
          }
        }

        setSelectedRug(list[0] || carpetsData[0]);
      } catch (_) {
        if (isMounted) {
          setCatalogRugs(carpetsData);
          setSelectedRug(carpetsData[0]);
        }
      }
    };

    loadCatalog();
    return () => { isMounted = false; };
  }, []);

  // 2. Listen to URL Hash Changes (for "View in Your Room" triggers)
  useEffect(() => {
    const handleHashCheck = () => {
      if (window.location.hash.includes('studio') || window.location.hash.includes('interactive-3d')) {
        let targetParam = null;
        let targetMode = null;

        if (window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.split('?')[1];
          const hashParams = new URLSearchParams(hashQuery);
          targetParam = hashParams.get('product');
          targetMode = hashParams.get('mode');
        }
        if (!targetParam) {
          const urlParams = new URLSearchParams(window.location.search);
          targetParam = urlParams.get('product');
          if (!targetMode) targetMode = urlParams.get('mode');
        }

        if (targetMode === 'live') {
          setVisualizationMode('live');
        }

        if (targetParam && catalogRugs.length > 0) {
          const matched = catalogRugs.find(
            p => (p.slug && p.slug === targetParam) || 
                 (p.id && String(p.id) === targetParam) || 
                 (p._id && String(p._id) === targetParam)
          );
          if (matched) {
            setSelectedRug(matched);
          }
        }

        setTimeout(scrollToStudio, 150);
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [catalogRugs, scrollToStudio]);

  // Handle Room File Upload
  const handleFileUpload = (file) => {
    setUploadError(null);
    const result = validateRoomFile(file);
    if (!result.valid) {
      setUploadError(result.error);
      return;
    }

    setRoomImage(result.previewUrl);
    setActiveSampleId(null);
    setShowComparisonSlider(false);

    // Apply baseline quad and immediately guide user to calibrate floor corners
    const initialUploadQuad = applyAspectRatioToQuad(DEFAULT_UPLOAD_QUAD, rugAspectRatio);
    setUserAdjustments({ dx: 0, dy: 0, scale: 1, rotation: 0 });
    setFloorQuad(initialUploadQuad);
    setIsCalibratingFloor(true);
    setCalibrationNotice("Set the four floor corners to position your rug.");
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  // Select Curated Sample Room & Apply Pre-Calibrated Placement
  const handleSelectSample = (sample) => {
    setUploadError(null);
    setRoomImage(sample.image);
    setActiveSampleId(sample.id);
    setShowComparisonSlider(false);
    setIsCalibratingFloor(false);
    setCalibrationNotice(null);

    const calib = ROOM_CALIBRATIONS[sample.id];
    if (calib) {
      const q = applyAspectRatioToQuad(calib.defaultQuad, rugAspectRatio);
      setUserAdjustments({ dx: 0, dy: 0, scale: 1, rotation: 0 });
      setFloorQuad(q);
    }
  };

  // Reset Adjustments to Room's Calibrated Floor Quad
  const handleResetAdjustments = () => {
    setUserAdjustments({ dx: 0, dy: 0, scale: 1, rotation: 0 });
    setFloorQuad(baseQuad);
    setIsCalibratingFloor(false);
    setCalibrationNotice(null);
  };

  // Nudge Move Handler (Translates all 4 corners while strictly keeping perspective)
  const nudgeMove = (dx, dy) => {
    setUserAdjustments(prev => {
      const nextAdj = {
        ...prev,
        dx: Number((prev.dx + dx).toFixed(1)),
        dy: Number((prev.dy + dy).toFixed(1))
      };
      setFloorQuad(transformQuad(baseQuad, nextAdj));
      return nextAdj;
    });
  };

  // Scale Handler (Scales around quad center while keeping floor perspective)
  const handleScaleChange = (scaleMultiplier) => {
    setUserAdjustments(prev => {
      const nextAdj = {
        ...prev,
        scale: Number(scaleMultiplier.toFixed(2))
      };
      setFloorQuad(transformQuad(baseQuad, nextAdj));
      return nextAdj;
    });
  };

  // Rotate Handler (Rotates in floor plane around quad center)
  const handleRotationChange = (deg) => {
    setUserAdjustments(prev => {
      const nextAdj = {
        ...prev,
        rotation: Number(deg)
      };
      setFloorQuad(transformQuad(baseQuad, nextAdj));
      return nextAdj;
    });
  };

  // Add to Bag Integration
  const handleAddToCart = async () => {
    if (!selectedRug) return;
    try {
      setIsAddingToCart(true);
      await addToCart(selectedRug, 1);
      if (onShowToast) {
        onShowToast('cart', 'Added to Bag', `${selectedRug.name} added to your shopping bag.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('error', 'Cart Error', err.message);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Direct Rug Pointer Interaction (Move entire rug on floor plane)
  const handleStagePointerDown = (e) => {
    if (showComparisonSlider || isCalibratingFloor) return;
    e.preventDefault();
    isDraggingRugRef.current = true;
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      origDx: userAdjustments.dx,
      origDy: userAdjustments.dy
    };
  };

  // Corner Pin Pointer Down (During 4-Point Floor Calibration)
  const handleCornerPointerDown = (cornerKey, e) => {
    e.stopPropagation();
    e.preventDefault();
    activeDragCornerRef.current = cornerKey;
  };

  // Unified Pointer & Touch Move Handler
  const handlePointerMove = useCallback((e) => {
    // 1. Dragging a specific calibration corner pin
    if (activeDragCornerRef.current && previewContainerRef.current) {
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      const rect = previewContainerRef.current.getBoundingClientRect();

      const xPercent = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
      const yPercent = Math.max(2, Math.min(98, ((clientY - rect.top) / rect.height) * 100));

      setFloorQuad(prev => ({
        ...prev,
        [activeDragCornerRef.current]: {
          x: Number(xPercent.toFixed(1)),
          y: Number(yPercent.toFixed(1))
        }
      }));
      return;
    }

    // 2. Dragging the entire rug across the floor plane
    if (isDraggingRugRef.current && previewContainerRef.current) {
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);
      const rect = previewContainerRef.current.getBoundingClientRect();

      const deltaXPixels = clientX - dragStartRef.current.x;
      const deltaYPixels = clientY - dragStartRef.current.y;

      const deltaXPercent = (deltaXPixels / rect.width) * 100;
      const deltaYPercent = (deltaYPixels / rect.height) * 100;

      const nextDx = Number((dragStartRef.current.origDx + deltaXPercent).toFixed(1));
      const nextDy = Number((dragStartRef.current.origDy + deltaYPercent).toFixed(1));

      setUserAdjustments(prev => {
        const nextAdj = { ...prev, dx: nextDx, dy: nextDy };
        setFloorQuad(transformQuad(baseQuad, nextAdj));
        return nextAdj;
      });
      return;
    }

    // 3. Dragging the Before / After Comparison Splitter
    if (isDraggingSliderRef.current && previewContainerRef.current) {
      const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
      const rect = previewContainerRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      setSliderPos(pos);
    }
  }, [baseQuad]);

  // Pointer Up Handler
  const handlePointerUp = useCallback(() => {
    isDraggingRugRef.current = false;
    activeDragCornerRef.current = null;
    isDraggingSliderRef.current = false;
    touchStartDistRef.current = null;
  }, []);

  // Touch handlers for mobile pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = userAdjustments.scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDistRef.current;
      const newScale = Math.max(0.65, Math.min(1.45, touchStartScaleRef.current * factor));
      handleScaleChange(newScale);
    }
  };

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

  return (
    <section 
      id="studio" 
      className="py-20 md:py-28 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3] scroll-mt-24 sm:scroll-mt-28 md:scroll-mt-32"
    >
      <div id="interactive-3d" className="absolute -top-28 left-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Editorial Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-[2px] bg-[#55694A]" />
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              3D STUDIO
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#362B21] font-light tracking-tight leading-[1.15]">
            Visualize Your Space
          </h2>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-[#4E3C2B] font-sans font-light leading-relaxed max-w-2xl">
            See how our handcrafted rugs and carpets visually sit on the floor of your own architectural space with true perspective depth and floor alignment.
          </p>
        </div>

        {/* Primary Studio Mode Toggle Bar */}
        <div className="mb-8 p-1.5 sm:p-2 bg-[#EAE2D2] rounded-2xl border border-[#DACDB3] inline-flex items-center gap-2 shadow-inner">
          <button
            onClick={() => setVisualizationMode('upload')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold transition-all duration-300 min-h-[44px] ${
              visualizationMode === 'upload'
                ? 'bg-[#55694A] text-[#FAF7F0] shadow-md'
                : 'text-[#4E3C2B] hover:text-[#362B21] hover:bg-[#FAF7F0]/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Room Photo</span>
          </button>

          <button
            onClick={() => setVisualizationMode('live')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-sans text-xs sm:text-sm font-semibold transition-all duration-300 min-h-[44px] ${
              visualizationMode === 'live'
                ? 'bg-[#55694A] text-[#FAF7F0] shadow-md'
                : 'text-[#4E3C2B] hover:text-[#362B21] hover:bg-[#FAF7F0]/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live View / AR</span>
          </button>
        </div>

        {/* Selected Product Banner Bar */}
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#EFE8D8] border border-[#DACDB3] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[#FAF7F0] border border-[#DACDB3] shadow-inner flex-shrink-0">
              <img
                src={rugImageUrl}
                alt={selectedRug?.name || 'Selected Rug'}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#55694A] font-sans font-bold block">
                Visualizing Product:
              </span>
              <h3 className="font-serif text-lg sm:text-xl text-[#362B21] font-medium leading-snug">
                {selectedRug?.name || 'Handcrafted Heirloom Rug'}
              </h3>
              <p className="text-xs text-[#7A6A58] font-sans">
                {selectedRug?.origin || 'Bhadohi, India'} &bull; {selectedRug?.dimensions || "8' × 10'"} &bull; {selectedRug?.material || 'Hand-spun Virgin Wool'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsRugPickerOpen(!isRugPickerOpen)}
              className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3] text-xs font-sans font-semibold flex items-center gap-2 transition-colors min-h-[42px] shadow-sm"
            >
              <span>Change Rug</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isRugPickerOpen ? 'rotate-180' : ''}`} />
            </button>

            {selectedRug && onOpenQuickView && (
              <button
                onClick={() => onOpenQuickView(selectedRug)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3] text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors min-h-[42px] shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-[#55694A]" />
                <span>View Details</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Rug Catalog Drawer */}
        {isRugPickerOpen && (
          <div className="mb-6 bg-[#EFE8D8] p-4 sm:p-5 rounded-2xl border border-[#DACDB3] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#4E3C2B] font-bold">
                Select Rug from Atelier Catalog:
              </span>
              <button
                onClick={() => setIsRugPickerOpen(false)}
                className="text-xs text-[#55694A] hover:text-[#362B21] font-sans font-semibold"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {catalogRugs.map(rug => (
                <button
                  key={rug.slug || rug._id || rug.id}
                  onClick={() => {
                    setSelectedRug(rug);
                    setIsRugPickerOpen(false);
                  }}
                  className={`p-2 rounded-xl text-left flex flex-col gap-2 transition-all duration-200 ${
                    selectedRug?.slug === rug.slug
                      ? 'bg-[#55694A] text-[#FAF7F0] ring-2 ring-[#55694A] shadow-md'
                      : 'bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3]/70'
                  }`}
                >
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#DACDB3]/30">
                    <img
                      src={rug.texture || rug.thumbnail || rug.image}
                      alt={rug.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium font-serif truncate leading-tight">{rug.name}</p>
                    <p className={`text-[10px] font-sans font-bold mt-0.5 ${selectedRug?.slug === rug.slug ? 'text-[#FAF7F0]/90' : 'text-[#55694A]'}`}>
                      {formatPrice(rug.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ================= MODE 2: LIVE CAMERA / AR VIEW ================= */}
        {visualizationMode === 'live' ? (
          <LiveARVisualizer
            selectedRug={selectedRug}
            onClose={() => setVisualizationMode('upload')}
            onOpenQuickView={onOpenQuickView}
            onAddToCart={handleAddToCart}
            formatPrice={formatPrice}
            isAddingToCart={isAddingToCart}
          />
        ) : (
          /* ================= MODE 1: UPLOAD ROOM PHOTO VIEW ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Left Controls: Upload Area & Sample Rooms (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Room Photo Upload Area */}
              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`bg-[#EFE8D8] p-5 sm:p-6 rounded-2xl border-2 border-dashed transition-all duration-300 text-center space-y-3 ${
                  isDraggingFile
                    ? 'border-[#55694A] bg-[#E8E0CE]'
                    : 'border-[#DACDB3] hover:border-[#85977A]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-11 h-11 mx-auto rounded-full bg-[#E5DCC9] border border-[#DACDB3] flex items-center justify-center text-[#55694A] shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="font-serif text-lg sm:text-xl text-[#362B21] font-medium">
                    Upload Your Room Photo
                  </h3>
                  <p className="text-xs text-[#4E3C2B] font-sans mt-0.5">
                    Drag & drop or click to upload
                  </p>
                  <p className="text-[10.5px] text-[#7A6A58] font-sans mt-0.5">
                    Supported formats: JPG, JPEG, PNG, WEBP (Max 10MB)
                  </p>
                </div>

                {uploadError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-center gap-1.5 font-sans">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] font-sans font-semibold text-xs uppercase tracking-widest transition-all duration-300 shadow-md min-h-[42px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>

              {/* Sample Rooms Selection (Zero pre-existing rugs on the floor) */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold block">
                  Or Try A Pre-Calibrated Architectural Room:
                </span>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {SAMPLE_ROOMS.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`group relative rounded-xl overflow-hidden border p-1 text-left transition-all duration-200 min-h-[70px] sm:min-h-[80px] ${
                        activeSampleId === sample.id
                          ? 'border-[#55694A] bg-[#55694A]/10 ring-2 ring-[#55694A]/40'
                          : 'border-[#DACDB3] hover:border-[#85977A] bg-[#EFE8D8]'
                      }`}
                    >
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#DACDB3]/50 mb-1">
                        <img
                          src={sample.image}
                          alt={sample.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-sans font-medium text-[#362B21] line-clamp-1 block text-center">
                        {sample.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Stage: Photo Visualization Canvas & Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Visualization Stage with Perspective Floor Engine */}
              <div 
                ref={previewContainerRef}
                onPointerDown={handleStagePointerDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] overflow-hidden shadow-xl relative min-h-[380px] sm:min-h-[480px] md:min-h-[520px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                {roomImage ? (
                  <>
                    {/* Layer 1: Base Room Image */}
                    <img
                      src={roomImage}
                      alt="Room Space Base"
                      className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                      draggable={false}
                    />

                    {/* Layer 2: Perspective-Warped Soft Floor Contact Shadow */}
                    <svg 
                      className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden"
                      style={{
                        clipPath: showComparisonSlider 
                          ? `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` 
                          : 'none'
                      }}
                    >
                      <defs>
                        <filter id="rug-ambient-shadow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="4.0" />
                        </filter>
                        <filter id="rug-tight-contact" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1.5" />
                        </filter>
                      </defs>

                      {/* Ambient soft shadow underneath warped rug */}
                      <polygon
                        points={`
                          ${floorQuad.topLeft.x}%,${floorQuad.topLeft.y + 0.6}%
                          ${floorQuad.topRight.x}%,${floorQuad.topRight.y + 0.6}%
                          ${floorQuad.bottomRight.x}%,${floorQuad.bottomRight.y + 1.2}%
                          ${floorQuad.bottomLeft.x}%,${floorQuad.bottomLeft.y + 1.2}%
                        `}
                        fill="rgba(25, 20, 15, 0.22)"
                        filter="url(#rug-ambient-shadow)"
                      />

                      {/* Tight floor contact boundary */}
                      <polygon
                        points={`
                          ${floorQuad.topLeft.x}%,${floorQuad.topLeft.y + 0.2}%
                          ${floorQuad.topRight.x}%,${floorQuad.topRight.y + 0.2}%
                          ${floorQuad.bottomRight.x}%,${floorQuad.bottomRight.y + 0.4}%
                          ${floorQuad.bottomLeft.x}%,${floorQuad.bottomLeft.y + 0.4}%
                        `}
                        fill="rgba(20, 14, 10, 0.32)"
                        filter="url(#rug-tight-contact)"
                      />
                    </svg>

                    {/* Layer 3: WebGL Projective Homography Warped Rug Canvas */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    />

                    {/* WebGL or Texture Loading Error Banner */}
                    {(webglError || textureError) && (
                      <div className="absolute inset-x-4 top-4 z-30 p-3 bg-red-950/85 backdrop-blur-md rounded-xl border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-white">Visualizer Notice:</p>
                          <p className="truncate text-red-200">{webglError || textureError}</p>
                        </div>
                        <button
                          onClick={() => {
                            setWebglError(null);
                            setTextureError(null);
                            renderFrame();
                          }}
                          className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white text-[11px] rounded-lg transition-colors flex-shrink-0 font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Layer 5: Interactive 4-Corner Draggable Pins (When calibrating floor) */}
                    {isCalibratingFloor && (
                      <div className="absolute inset-0 z-40 pointer-events-auto">
                        {/* Connecting dashed floor quadrilateral */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <polygon
                            points={`
                              ${floorQuad.topLeft.x}%,${floorQuad.topLeft.y}%
                              ${floorQuad.topRight.x}%,${floorQuad.topRight.y}%
                              ${floorQuad.bottomRight.x}%,${floorQuad.bottomRight.y}%
                              ${floorQuad.bottomLeft.x}%,${floorQuad.bottomLeft.y}%
                            `}
                            fill="rgba(85, 105, 74, 0.12)"
                            stroke="#55694A"
                            strokeWidth="2"
                            strokeDasharray="6 4"
                          />
                        </svg>

                        {/* 4 Interactive Corner Drag Pins */}
                        {[
                          { key: 'topLeft', label: 'Top Left' },
                          { key: 'topRight', label: 'Top Right' },
                          { key: 'bottomRight', label: 'Bottom Right' },
                          { key: 'bottomLeft', label: 'Bottom Left' }
                        ].map(({ key, label }) => {
                          const pt = floorQuad[key];
                          return (
                            <div
                              key={key}
                              onPointerDown={(e) => handleCornerPointerDown(key, e)}
                              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move flex flex-col items-center group touch-none"
                              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#55694A]/30 border-2 border-[#55694A] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#FAF7F0] border-2 border-[#55694A] shadow" />
                              </div>
                              <span className="mt-1 px-1.5 py-0.5 rounded bg-[#362B21]/90 text-[#FAF7F0] text-[9.5px] font-sans font-bold tracking-wider uppercase pointer-events-none shadow whitespace-nowrap">
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Guided Calibration Banner */}
                    {isCalibratingFloor && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#362B21]/95 text-[#FAF7F0] px-4 py-2 rounded-full border border-[#DACDB3]/50 shadow-2xl flex items-center gap-3 text-xs font-sans backdrop-blur-md max-w-[92%]">
                        <Crosshair className="w-4 h-4 text-[#D4BC9F] flex-shrink-0 animate-pulse" />
                        <span className="font-medium truncate">Set the four floor corners to position your rug.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCalibratingFloor(false);
                            setCalibrationNotice("Floor calibrated — adjust the rug if needed.");
                            if (onShowToast) onShowToast('info', 'Floor Calibrated', 'Floor calibrated — adjust the rug if needed.');
                          }}
                          className="bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-[10.5px] font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors flex-shrink-0 ml-1 shadow-sm"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {/* Calibration Notice Message (Post-calibration) */}
                    {!isCalibratingFloor && calibrationNotice && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#362B21]/90 text-[#FAF7F0] px-3.5 py-1.5 rounded-full border border-[#DACDB3]/40 shadow-lg flex items-center gap-2 text-[11px] font-sans backdrop-blur-md animate-fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#55694A]" />
                        <span>{calibrationNotice}</span>
                      </div>
                    )}

                    {/* Before / After Draggable Splitter (When active) */}
                    {showComparisonSlider && (
                      <div
                        className="absolute inset-y-0 z-30 pointer-events-none"
                        style={{ left: `${sliderPos}%` }}
                      >
                        <div className="w-[2px] h-full bg-[#FAF7F0] shadow-2xl relative">
                          <div 
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              isDraggingSliderRef.current = true;
                            }}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#55694A] text-[#FAF7F0] border-2 border-[#FAF7F0] shadow-xl flex items-center justify-center cursor-ew-resize pointer-events-auto"
                          >
                            <ArrowLeftRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top-Right Badges: Active Room & Occlusion Indicator */}
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                      {activeCalibration.occlusionPolygons?.length > 0 && (
                        <span className="bg-[#55694A]/90 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-[#DACDB3]/40 text-[10.5px] text-[#FAF7F0] font-sans font-medium shadow-md flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-[#D4BC9F]" />
                          <span>Furniture Occlusion</span>
                        </span>
                      )}
                      <span className="bg-[#362B21]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#DACDB3]/40 text-[11px] text-[#FAF7F0] font-sans font-medium shadow-md">
                        {activeCalibration.name}
                      </span>
                    </div>

                    {/* Top-Left Drag Hint Indicator */}
                    {!showComparisonSlider && !isCalibratingFloor && (
                      <div className="absolute top-3.5 left-3.5 z-20 pointer-events-none bg-[#362B21]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#DACDB3]/40 text-[10.5px] text-[#FAF7F0] font-sans flex items-center gap-1.5 shadow-md">
                        <Move className="w-3 h-3 text-[#D4BC9F]" />
                        <span>Drag rug across floor</span>
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty State */
                  <div className="text-center p-8 sm:p-12 space-y-4 max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-[#E5DCC9] border border-[#DACDB3] flex items-center justify-center text-[#55694A] shadow-inner">
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
                    </div>
                    <h3 className="font-serif text-2xl sm:text-3xl text-[#362B21] font-light">
                      Your room preview will appear here
                    </h3>
                    <p className="font-sans text-xs sm:text-sm text-[#4E3C2B] leading-relaxed">
                      Upload a photograph of your room or choose an architectural sample room to begin.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectSample(SAMPLE_ROOMS[0])}
                      className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-sans font-bold text-[#55694A] hover:text-[#362B21] underline underline-offset-4 pt-1 transition-colors"
                    >
                      <span>Try With Sample Living Room</span>
                    </button>
                  </div>
                )}
              </div>

              {/* User-Uploaded Photo Placement Tip */}
              {roomImage && activeCalibration.id === 'custom-upload' && (
                <div className="bg-[#EFE8D8] border border-[#DACDB3] rounded-2xl p-3.5 text-xs font-sans text-[#4E3C2B] flex items-start gap-2.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-[#55694A] flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-[#362B21]">Photo Placement Tip:</strong> Apni room photo mein agar furniture rug ke upar aa raha hai, to neeche <strong className="text-[#55694A]">Floor Placement Controls (Resize / Move)</strong> ya upar <strong className="text-[#55694A]">Calibrate Floor</strong> button use karke rug ko open floor space par adjust karein taaki furniture natural dikhe.
                  </p>
                </div>
              )}

              {/* Manual Adjustment Bar (Preserves floor perspective convergence) */}
              {roomImage && (
                <div className="bg-[#EFE8D8] p-4 sm:p-5 rounded-2xl border border-[#DACDB3] shadow-sm space-y-4">
                  
                  {/* Control Header & Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DACDB3]/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#55694A]" />
                      <span className="text-xs uppercase tracking-wider text-[#362B21] font-sans font-bold">
                        Floor Placement Controls:
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveControlTab('move')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-sans uppercase tracking-wider font-semibold transition-colors ${
                          activeControlTab === 'move'
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0] text-[#362B21] hover:bg-[#EAE2D2]'
                        }`}
                      >
                        Move
                      </button>
                      <button
                        onClick={() => setActiveControlTab('scale')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-sans uppercase tracking-wider font-semibold transition-colors ${
                          activeControlTab === 'scale'
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0] text-[#362B21] hover:bg-[#EAE2D2]'
                        }`}
                      >
                        Resize
                      </button>
                      <button
                        onClick={() => setActiveControlTab('rotate')}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-sans uppercase tracking-wider font-semibold transition-colors ${
                          activeControlTab === 'rotate'
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0] text-[#362B21] hover:bg-[#EAE2D2]'
                        }`}
                      >
                        Rotate
                      </button>
                    </div>
                  </div>

                  {/* Sub-Controls according to active tab */}
                  <div className="pt-0.5">
                    {activeControlTab === 'move' && (
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
                        <span className="text-[#4E3C2B]">Fine Nudge Position:</span>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            onClick={() => nudgeMove(-1.5, 0)}
                            className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#EAE2D2] border border-[#DACDB3] rounded-lg font-bold text-xs"
                            title="Nudge Left"
                          >
                            &larr; Left
                          </button>
                          <button
                            onClick={() => nudgeMove(1.5, 0)}
                            className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#EAE2D2] border border-[#DACDB3] rounded-lg font-bold text-xs"
                            title="Nudge Right"
                          >
                            Right &rarr;
                          </button>
                          <button
                            onClick={() => nudgeMove(0, -1.5)}
                            className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#EAE2D2] border border-[#DACDB3] rounded-lg font-bold text-xs"
                            title="Nudge Up"
                          >
                            &uarr; Up
                          </button>
                          <button
                            onClick={() => nudgeMove(0, 1.5)}
                            className="px-3 py-2 bg-[#FAF7F0] hover:bg-[#EAE2D2] border border-[#DACDB3] rounded-lg font-bold text-xs"
                            title="Nudge Down"
                          >
                            Down &darr;
                          </button>
                        </div>
                      </div>
                    )}

                    {activeControlTab === 'scale' && (
                      <div className="flex items-center gap-4 text-xs font-sans">
                        <ZoomOut className="w-4 h-4 text-[#55694A] flex-shrink-0" />
                        <input
                          type="range"
                          min="0.7"
                          max="1.35"
                          step="0.01"
                          value={userAdjustments.scale}
                          onChange={(e) => handleScaleChange(Number(e.target.value))}
                          className="w-full accent-[#55694A] cursor-pointer"
                        />
                        <ZoomIn className="w-4 h-4 text-[#55694A] flex-shrink-0" />
                        <span className="w-12 text-right font-mono font-bold text-xs text-[#362B21]">
                          {Math.round(userAdjustments.scale * 100)}%
                        </span>
                      </div>
                    )}

                    {activeControlTab === 'rotate' && (
                      <div className="flex items-center gap-4 text-xs font-sans">
                        <RotateCw className="w-4 h-4 text-[#55694A] flex-shrink-0" />
                        <input
                          type="range"
                          min="-25"
                          max="25"
                          step="1"
                          value={userAdjustments.rotation}
                          onChange={(e) => handleRotationChange(Number(e.target.value))}
                          className="w-full accent-[#55694A] cursor-pointer"
                        />
                        <span className="w-12 text-right font-mono font-bold text-xs text-[#362B21]">
                          {userAdjustments.rotation}&deg;
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Result Actions Bar */}
                  <div className="pt-3 border-t border-[#DACDB3]/60 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowComparisonSlider(!showComparisonSlider)}
                        className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-sans font-semibold transition-all flex items-center gap-1.5 shadow-sm min-h-[40px] ${
                          showComparisonSlider
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3]'
                        }`}
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>{showComparisonSlider ? 'Exit Before/After' : 'Before / After'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCalibratingFloor(!isCalibratingFloor)}
                        className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-sans font-semibold transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px] ${
                          isCalibratingFloor
                            ? 'bg-[#55694A] text-[#FAF7F0]'
                            : 'bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3]'
                        }`}
                        title="Calibrate 4 floor plane corner pins"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-[#55694A]" />
                        <span>{isCalibratingFloor ? 'Done Calibrating' : 'Calibrate Floor'}</span>
                      </button>

                      <button
                        onClick={handleResetAdjustments}
                        className="px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-sans font-semibold bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3] transition-colors flex items-center gap-1.5 min-h-[40px]"
                        title="Reset rug position, scale, and rotation to calibrated defaults"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#55694A]" />
                        <span>Reset</span>
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-sans font-semibold bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3] transition-colors min-h-[40px]"
                      >
                        Upload Another Room
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedRug && onOpenQuickView && (
                        <button
                          onClick={() => onOpenQuickView(selectedRug)}
                          className="px-4 py-2 rounded-lg bg-[#FAF7F0] hover:bg-[#EAE2D2] text-[#362B21] border border-[#DACDB3] text-xs font-sans font-semibold flex items-center gap-1.5 transition-colors min-h-[40px] shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#55694A]" />
                          <span>View Product</span>
                        </button>
                      )}

                      <button
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || !selectedRug}
                        className="px-5 py-2 rounded-lg bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] text-xs uppercase tracking-widest font-sans font-semibold flex items-center gap-2 transition-colors shadow-md min-h-[40px] disabled:opacity-50"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{isAddingToCart ? 'Adding...' : 'Add to Bag'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </section>
  );
}
