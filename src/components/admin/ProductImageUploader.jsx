import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  Plus, 
  Star, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileImage
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const ACCEPTED_EXTENSIONS = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * ProductImageUploader
 *
 * Provides direct computer file upload to Cloudinary with:
 * - Computer file picker (JPG, JPEG, PNG, WEBP)
 * - Drag-and-drop zone
 * - Immediate local thumbnail preview and upload progress
 * - Primary thumbnail selector
 * - Image replacement
 * - Secondary URL input option
 * - Strict client and server validation
 */
export default function ProductImageUploader({
  images = [],
  thumbnail = '',
  imageAssets = [],
  onChange,
  onError
}) {
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replacingIndex, setReplacingIndex] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const [cloudinaryReady, setCloudinaryReady] = useState(true);

  // Check Cloudinary backend configuration status on mount
  useEffect(() => {
    let isMounted = true;
    adminAPI.getCloudinaryStatus()
      .then((res) => {
        if (isMounted && res) {
          setCloudinaryReady(Boolean(res.configured));
        }
      })
      .catch(() => {
        // Fallback silently if offline or simulation mode
      });
    return () => { isMounted = false; };
  }, []);

  const triggerFilePicker = () => {
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerReplacePicker = (index) => {
    setErrorMessage('');
    setReplacingIndex(index);
    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const validateFile = (file) => {
    const mime = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(name);

    if (!ACCEPTED_EXTENSIONS.includes(mime) && !hasValidExt) {
      return `"${file.name}" is not a supported format. Please select JPG, JPEG, PNG, or WEBP.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`;
    }
    return null;
  };

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    // Validate all files first
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        setErrorMessage(err);
        if (onError) onError(err);
        return;
      }
    }

    setErrorMessage('');
    setUploading(true);

    try {
      const newUploadedUrls = [];
      const newUploadedAssets = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(
          files.length > 1
            ? `Uploading photograph ${i + 1} of ${files.length} to Cloudinary...`
            : `Uploading photograph to Cloudinary...`
        );

        const res = await adminAPI.uploadImage(file);
        if (!res?.success || !res?.url) {
          throw new Error(res?.message || `Failed to upload "${file.name}".`);
        }

        newUploadedUrls.push(res.url);
        newUploadedAssets.push({
          url: res.url,
          publicId: res.publicId || '',
          width: res.width,
          height: res.height,
          format: res.format
        });
      }

      // Merge newly uploaded images
      const updatedImages = [...images, ...newUploadedUrls];
      const updatedThumbnail = thumbnail || updatedImages[0] || '';
      const updatedAssets = [...imageAssets, ...newUploadedAssets];

      if (onChange) {
        onChange({
          images: updatedImages,
          thumbnail: updatedThumbnail,
          imageAssets: updatedAssets
        });
      }
    } catch (err) {
      const msg = err.message || 'Image upload failed. Please verify your connection or Cloudinary credentials.';
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setUploading(false);
      setUploadProgressText('');
    }
  };

  const handleReplaceFileSelected = async (fileList) => {
    const file = fileList?.[0];
    if (!file || replacingIndex === null) return;

    const err = validateFile(file);
    if (err) {
      setErrorMessage(err);
      if (onError) onError(err);
      return;
    }

    setErrorMessage('');
    setUploading(true);
    setUploadProgressText(`Replacing image with "${file.name}" on Cloudinary...`);

    try {
      const res = await adminAPI.uploadImage(file);
      if (!res?.success || !res?.url) {
        throw new Error(res?.message || 'Failed to replace image.');
      }

      const oldUrl = images[replacingIndex];
      const updatedImages = [...images];
      updatedImages[replacingIndex] = res.url;

      let updatedThumbnail = thumbnail;
      if (thumbnail === oldUrl || !thumbnail) {
        updatedThumbnail = res.url;
      }

      const updatedAssets = [...imageAssets];
      if (updatedAssets[replacingIndex]) {
        updatedAssets[replacingIndex] = {
          url: res.url,
          publicId: res.publicId || '',
          width: res.width,
          height: res.height,
          format: res.format
        };
      }

      if (onChange) {
        onChange({
          images: updatedImages,
          thumbnail: updatedThumbnail,
          imageAssets: updatedAssets
        });
      }
    } catch (err) {
      const msg = err.message || 'Image replacement failed.';
      setErrorMessage(msg);
      if (onError) onError(msg);
    } finally {
      setUploading(false);
      setUploadProgressText('');
      setReplacingIndex(null);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const removedUrl = images[indexToRemove];
    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    const updatedAssets = imageAssets.filter((_, idx) => idx !== indexToRemove);

    let updatedThumbnail = thumbnail;
    if (thumbnail === removedUrl) {
      updatedThumbnail = updatedImages.length > 0 ? updatedImages[0] : '';
    }

    if (onChange) {
      onChange({
        images: updatedImages,
        thumbnail: updatedThumbnail,
        imageAssets: updatedAssets
      });
    }
  };

  const handleSetPrimary = (imgUrl) => {
    if (onChange) {
      onChange({
        images,
        thumbnail: imgUrl,
        imageAssets
      });
    }
  };

  const handleAddManualUrl = () => {
    const clean = manualUrlInput.trim();
    if (!clean) return;

    if (!clean.startsWith('/') && !clean.startsWith('http://') && !clean.startsWith('https://')) {
      setErrorMessage('Please provide a valid image URL (e.g. /images/... or https://...)');
      return;
    }

    setErrorMessage('');
    const updatedImages = [...images, clean];
    const updatedThumbnail = thumbnail || clean;

    if (onChange) {
      onChange({
        images: updatedImages,
        thumbnail: updatedThumbnail,
        imageAssets: [...imageAssets, { url: clean, publicId: '' }]
      });
    }

    setManualUrlInput('');
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
      />

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => handleReplaceFileSelected(e.target.files)}
      />

      {/* Cloudinary Configuration Advisory Notice (if not yet configured on Render) */}
      {!cloudinaryReady && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Render Environment Setup Required for Live Cloudinary Storage</p>
            <p className="text-amber-800">
              Set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">CLOUDINARY_CLOUD_NAME</code>,{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">CLOUDINARY_API_KEY</code>, and{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">CLOUDINARY_API_SECRET</code> in your Render dashboard service settings.
            </p>
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-2 text-xs text-red-900 animate-fadeIn">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-red-700 hover:text-red-900 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Primary Upload Zone: Drag and drop + File picker */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFilePicker}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#55694A] bg-[#55694A]/10 ring-4 ring-[#55694A]/20 scale-[0.99]'
            : 'border-[#DACDB3] bg-[#FAF7F0] hover:border-[#55694A] hover:bg-[#F5F0E6]'
        } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <div className="max-w-md mx-auto space-y-3">
          {uploading ? (
            <div className="space-y-3 py-2">
              <div className="w-10 h-10 border-2 border-[#55694A] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="font-serif text-sm font-medium text-[#362B21]">
                  {uploadProgressText || 'Uploading photograph to Cloudinary...'}
                </p>
                <p className="text-[11px] text-[#544131]/70 font-sans">
                  Optimizing image resolution and streaming to secure cloud storage.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[#55694A]/10 text-[#55694A] flex items-center justify-center mx-auto shadow-inner">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <p className="font-serif text-base sm:text-lg text-[#362B21] font-medium">
                  Click to select photographs from your computer
                </p>
                <p className="text-xs text-[#544131]/70 font-sans">
                  Or drag and drop your images directly into this area
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#55694A] text-[#FAF7F0] text-xs uppercase tracking-wider font-bold rounded-xl shadow-sm hover:bg-[#657C58] transition-colors">
                <FileImage className="w-4 h-4" />
                <span>Upload From Computer</span>
              </div>

              <p className="text-[10.5px] text-[#8F6E50] font-sans">
                Supported formats: <strong>JPG, JPEG, PNG, WEBP</strong> (up to {MAX_FILE_SIZE_MB}MB each)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Image Gallery / Previews Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans font-bold text-[#4E3C2B]">
              Registered Photographs ({images.length})
            </span>
            <span className="text-[11px] text-[#8F6E50] font-sans italic">
              Star marks the storefront primary image (thumbnail)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => {
              const isPrimary = thumbnail === img || (!thumbnail && idx === 0);

              return (
                <div
                  key={`${img}_${idx}`}
                  className={`group relative rounded-xl overflow-hidden border p-2 bg-[#FAF7F0] space-y-2 transition-all shadow-sm hover:shadow-md ${
                    isPrimary
                      ? 'border-[#55694A] ring-2 ring-[#55694A]/30'
                      : 'border-[#DACDB3]'
                  }`}
                >
                  {/* Primary Badge */}
                  {isPrimary && (
                    <div className="absolute top-3 left-3 z-10 bg-[#55694A] text-[#FAF7F0] text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>Primary</span>
                    </div>
                  )}

                  {/* Thumbnail Image Container */}
                  <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#EAE2D2] flex items-center justify-center relative">
                    <img
                      src={img}
                      alt={`Product piece view ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/room-after.jpg';
                      }}
                    />

                    {/* Quick Link Overlay */}
                    <a
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View full resolution image in new tab"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#DACDB3]/50">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img)}
                      disabled={isPrimary}
                      className={`text-[10px] font-sans font-bold px-2 py-1 rounded transition-colors inline-flex items-center gap-1 ${
                        isPrimary
                          ? 'bg-[#55694A] text-[#FAF7F0] cursor-default'
                          : 'border border-[#DACDB3] text-[#4E3C2B] hover:bg-[#EAE2D2]'
                      }`}
                      title={isPrimary ? 'Current primary image' : 'Make primary product image'}
                    >
                      {isPrimary ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Primary</span>
                        </>
                      ) : (
                        <span>Set Primary</span>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Replace Button */}
                      <button
                        type="button"
                        onClick={() => triggerReplacePicker(idx)}
                        disabled={uploading}
                        className="p-1.5 rounded text-[#544131] hover:bg-[#EAE2D2] hover:text-[#362B21] transition-colors"
                        title="Replace this photograph from computer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        disabled={uploading}
                        className="p-1.5 rounded text-[#B24C40] hover:bg-[#B24C40]/10 transition-colors"
                        title="Remove photograph"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary URL Input Accordion (For manual URL addition if needed) */}
      <div className="pt-2 border-t border-[#DACDB3]/70">
        <button
          type="button"
          onClick={() => setShowUrlFallback(!showUrlFallback)}
          className="text-xs text-[#8F6E50] hover:text-[#55694A] inline-flex items-center gap-1.5 font-sans font-medium"
        >
          {showUrlFallback ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showUrlFallback ? 'Hide URL entry option' : 'Or add photograph by public URL'}</span>
        </button>

        {showUrlFallback && (
          <div className="mt-3 p-3 bg-[#FAF7F0] rounded-xl border border-[#DACDB3] space-y-2 animate-fadeIn">
            <p className="text-[11px] text-[#544131]/70 font-sans">
              You can also specify a public URL (e.g., hosted on an external CDN or previous catalog path):
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualUrlInput}
                onChange={(e) => setManualUrlInput(e.target.value)}
                placeholder="https://res.cloudinary.com/... or /images/carpets/..."
                className="flex-1 bg-white border border-[#DACDB3] rounded-lg px-3 py-1.5 text-xs text-[#362B21] focus:outline-none focus:border-[#55694A]"
              />
              <button
                type="button"
                onClick={handleAddManualUrl}
                className="px-3 py-1.5 bg-[#55694A] text-[#FAF7F0] rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 hover:bg-[#657C58]"
              >
                Add URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
