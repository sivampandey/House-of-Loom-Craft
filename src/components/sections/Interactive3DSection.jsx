import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Sparkles, Check, Eye, ArrowUpRight, Layers } from 'lucide-react';

export default function Interactive3DSection({ onOpenQuickView }) {
  const [selectedTextureKey, setSelectedTextureKey] = useState('royal-ivory');
  const [activeViewMode, setActiveViewMode] = useState('full');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeSpecTab, setActiveSpecTab] = useState('wool');

  const carpets = [
    {
      id: 'royal-ivory',
      name: 'Nain Imperial Ivory Medallion',
      price: 38500,
      formattedPrice: '₹38,500',
      color: '#CBB49E',
      material: '80% High-Plateau Wool & 20% Mulberry Silk',
      origin: 'Bhadohi, India',
      pileHeight: '9.0mm Hand-Carved Relief',
      warpWeft: 'Reinforced Hand-Spun Cotton Warp',
      weight: '4.2 kg / sq. meter',
      weaveTime: '14 Months (Master Loom)',
      knotDensity: '450 Knots / sq. inch',
      dimensions: "9' x 12' (275 x 365 cm)",
      images: {
        full: '/images/carpets/royal-ivory-medallion.jpg',
        macro: '/images/carpets/royal-ivory-medallion-detail.jpg',
        room: '/images/carpets/royal-ivory-medallion.jpg',
        loom: '/images/craft-weaving.jpg'
      }
    },
    {
      id: 'noir-gold',
      name: 'Royal Noir & Gilded Court Rug',
      price: 32500,
      formattedPrice: '₹32,500',
      color: '#2A2A2A',
      material: '85% Bikaner Hand-Spun Wool & 15% Mulberry Silk',
      origin: 'Bhadohi, India',
      pileHeight: '8.5mm Uniform Sheared',
      warpWeft: '100% Hand-Spun Cotton Core',
      weight: '3.9 kg / sq. meter',
      weaveTime: '11 Months',
      knotDensity: '400 Knots / sq. inch',
      dimensions: "8' x 10' (240 x 300 cm)",
      images: {
        full: '/images/carpets/noir-gold-arabesque.jpg',
        macro: '/images/carpets/noir-gold-arabesque.jpg',
        room: '/images/carpets/noir-gold-arabesque.jpg',
        loom: '/images/craft-weaving.jpg'
      }
    },
    {
      id: 'ivory-celestial',
      name: 'Isfahan Celestial Ivory Bloom',
      price: 29500,
      formattedPrice: '₹29,500',
      color: '#55694A',
      material: '80% Virgin Wool & 20% Bamboo Silk',
      origin: 'Bhadohi, India',
      pileHeight: '8.0mm Sheared Velvet',
      warpWeft: '100% Fine Organic Cotton',
      weight: '3.7 kg / sq. meter',
      weaveTime: '10 Months',
      knotDensity: '380 Knots / sq. inch',
      dimensions: "8' x 10' (240 x 300 cm)",
      images: {
        full: '/images/carpets/ivory-celestial-bloom.jpg',
        macro: '/images/carpets/ivory-celestial-bloom.jpg',
        room: '/images/carpets/ivory-celestial-bloom.jpg',
        loom: '/images/craft-yarn.jpg'
      }
    },
    {
      id: 'crimson',
      name: 'Kashan Imperial Crimson Medallion',
      price: 28500,
      formattedPrice: '₹28,500',
      color: '#9E3838',
      material: '80% High-Plateau Wool & 20% Mulberry Silk',
      origin: 'Bhadohi, India',
      pileHeight: '8.5mm Uniform Sheared',
      warpWeft: '100% Hand-Spun Cotton Core',
      weight: '3.8 kg / sq. meter',
      weaveTime: '9 Months (Single Master Loom)',
      knotDensity: '360 Knots / sq. inch',
      dimensions: "8' x 10' (240 x 300 cm)",
      images: {
        full: '/textures/carpet-crimson.jpg',
        macro: '/images/carpet-macro.jpg',
        room: '/images/room-after.jpg',
        loom: '/images/craft-weaving.jpg'
      }
    },
    {
      id: 'emerald',
      name: 'Emerald Safavid Royal Medallion',
      price: 34000,
      formattedPrice: '₹34,000',
      color: '#476342',
      material: '70% Hand-Spun Wool & 30% Pure Silk Weft',
      origin: 'Kashmir, India',
      pileHeight: '9.0mm Hand-Carved Relief',
      warpWeft: 'Reinforced Egyptian Cotton Warp',
      weight: '4.1 kg / sq. meter',
      weaveTime: '12 Months',
      knotDensity: '420 Knots / sq. inch',
      dimensions: "9' x 12' (275 x 365 cm)",
      images: {
        full: '/textures/carpet-emerald.jpg',
        macro: '/images/carpet-macro.jpg',
        room: '/images/journal-penthouse.jpg',
        loom: '/images/craft-yarn.jpg'
      }
    }
  ];

  const currentCarpet = carpets.find(c => c.id === selectedTextureKey) || carpets[0];

  const viewModes = [
    { id: 'full', label: 'Full Perspective' },
    { id: 'macro', label: 'Knot & Pile Macro' },
    { id: 'room', label: 'Architectural Setting' },
    { id: 'loom', label: 'Master Loom Weave' }
  ];

  const craftsmanshipSpecs = {
    wool: {
      title: 'High-Plateau Virgin Wool',
      badge: 'Material Purity',
      desc: 'Selected from long-staple fleece shorn from mountain sheep. Provides natural lanolin luster, natural flame retardance, and generations of elastic resilience underfoot.'
    },
    knots: {
      title: '250,000+ Individually Tied Knots',
      badge: 'Craft Complexity',
      desc: 'Each knot is looped around adjacent warp threads and severed by hand using traditional crescent knives. Creates intricate pattern definition that machine looms cannot replicate.'
    },
    fringe: {
      title: 'Natural Braided Cotton Fringes',
      badge: 'Structural Integrity',
      desc: 'The un-dyed organic cotton warp threads extend directly past the kilim selvage, hand-knotted in delicate rows to lock the pile perpetually in place.'
    },
    'natural-dyes': {
      title: 'Sun-Cured Botanical Dyes',
      badge: 'Living Alchemy',
      desc: 'Madder roots for crimson, wild indigo plants for deep blues, and dried pomegranate peel for warm ochres. These mineral and plant pigments patina gracefully with age.'
    }
  };

  const activeSpec = craftsmanshipSpecs[activeSpecTab] || craftsmanshipSpecs['wool'];

  const currentImage = currentCarpet.images[activeViewMode] || currentCarpet.images.full;

  const toggleZoom = () => {
    setZoomLevel(prev => (prev === 1 ? 1.5 : prev === 1.5 ? 2.0 : 1));
  };

  return (
    <section 
      id="studio" 
      className="py-24 md:py-32 bg-[#F5F0E6] text-[#362B21] relative overflow-hidden border-t border-[#DACDB3] interactive-section"
    >
      {/* Anchor support for older links */}
      <div id="interactive-3d" className="absolute -top-12 left-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header - High Contrast Sharp Typography */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-3">
            <span className="w-8 h-[2px] bg-[#55694A]" />
            <span className="text-xs uppercase tracking-[0.3em] text-[#55694A] font-sans font-bold">
              ATELIER INSPECTION STUDIO
            </span>
            <span className="w-8 h-[2px] bg-[#55694A]" />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#362B21] font-light leading-tight">
            Heirloom Detail & Texture Inspection
          </h2>

          <p className="font-sans text-sm md:text-base text-[#4E3C2B] font-medium leading-relaxed max-w-2xl mx-auto">
            Inspect authentic knot density, pure high-plateau wool luster, and hand-braided fringe details up close with ultra-high resolution photography.
          </p>
        </div>

        {/* Studio Showcase Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main High-Resolution Image Box (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-[#EFE8D8] rounded-2xl border border-[#DACDB3] overflow-hidden shadow-xl relative h-[420px] sm:h-[500px] md:h-[580px] flex items-center justify-center p-4 card-hover-lift">
              {/* Top Controls Bar */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                {/* View Mode Indicator */}
                <div className="bg-[#362B21]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D4BC9F]/40 text-xs text-[#FAF7F0] flex items-center gap-2 pointer-events-auto shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4BC9F]" />
                  <span className="font-sans font-medium">{viewModes.find(v => v.id === activeViewMode)?.label}</span>
                </div>

                {/* Zoom Toggle Button */}
                <button
                  onClick={toggleZoom}
                  className="bg-[#362B21]/90 hover:bg-[#55694A] text-[#FAF7F0] backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#D4BC9F]/40 text-xs flex items-center gap-1.5 transition-colors pointer-events-auto shadow-md"
                  title="Click to zoom image"
                >
                  {zoomLevel > 1 ? <ZoomOut className="w-3.5 h-3.5 text-[#D4BC9F]" /> : <ZoomIn className="w-3.5 h-3.5 text-[#D4BC9F]" />}
                  <span className="font-sans font-medium">Zoom: {zoomLevel}x</span>
                </button>
              </div>

              {/* Interactive High-Res Image Display */}
              <div 
                onClick={toggleZoom}
                className="w-full h-full flex items-center justify-center cursor-zoom-in overflow-hidden rounded-xl"
              >
                <img
                  src={currentImage}
                  alt={`${currentCarpet.name} inspection`}
                  className="max-h-full w-auto max-w-full object-contain transition-transform duration-700 ease-out"
                  style={{ transform: `scale(${zoomLevel})` }}
                />
              </div>

              {/* Bottom Angle/Perspective Switcher Tabs */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-center gap-2 bg-[#362B21]/95 backdrop-blur-md p-2.5 rounded-xl border border-[#D4BC9F]/30 shadow-lg">
                <span className="text-[11px] uppercase tracking-wider text-[#D4BC9F] font-sans font-semibold hidden md:inline mr-1">
                  Perspective:
                </span>
                {viewModes.map(vm => (
                  <button
                    key={vm.id}
                    onClick={() => {
                      setActiveViewMode(vm.id);
                      setZoomLevel(1);
                    }}
                    className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-sans transition-all duration-200 ${
                      activeViewMode === vm.id
                        ? 'bg-[#55694A] text-[#FAF7F0] font-bold shadow-md border border-[#85977A]'
                        : 'text-[#FAF7F0]/80 hover:text-[#FAF7F0] hover:bg-white/10'
                    }`}
                  >
                    {vm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Carpet Model Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EFE8D8] p-4 rounded-xl border border-[#DACDB3] shadow-sm">
              <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold">
                Select Piece to Examine:
              </span>
              <div className="flex flex-wrap gap-2">
                {carpets.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedTextureKey(c.id);
                      setActiveViewMode('full');
                      setZoomLevel(1);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs uppercase tracking-wider font-sans transition-all duration-200 flex items-center gap-2 ${
                      selectedTextureKey === c.id
                        ? 'bg-[#55694A] text-[#FAF7F0] font-bold shadow-md border border-[#85977A]'
                        : 'bg-[#F5F0E6] text-[#362B21] hover:bg-[#E2D8C3] border border-[#DACDB3]'
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ 
                        backgroundColor: c.color || (c.id === 'crimson' ? '#9E3838' : c.id === 'emerald' ? '#476342' : '#B8860B')
                      }} 
                    />
                    <span>{c.name.split(' ')[0]}</span>
                    <span className="font-bold opacity-90">{c.formattedPrice}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inspection Details Panel (4 cols) - 100% Sharp Readable Text */}
          <div className="lg:col-span-4 flex flex-col space-y-6">
            {/* Craftsmanship Deep Dive Card */}
            <div className="bg-[#EFE8D8] p-6 sm:p-7 rounded-2xl border border-[#DACDB3] shadow-md space-y-4 relative overflow-hidden card-hover-lift">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-[#FAF7F0] font-sans font-bold px-3 py-1 rounded-full bg-[#55694A]">
                  {activeSpec.badge}
                </span>
                <span className="text-xs text-[#55694A] font-sans font-bold uppercase tracking-wider">
                  Artisan Quality
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-[#362B21] font-medium">
                {activeSpec.title}
              </h3>

              <p className="text-xs sm:text-sm font-sans text-[#4E3C2B] leading-relaxed font-normal">
                {activeSpec.desc}
              </p>

              {/* Craftsmanship Quick Selector Buttons */}
              <div className="pt-3 border-t border-[#DACDB3] grid grid-cols-2 gap-2">
                {[
                  { id: 'wool', label: '1. Mountain Wool' },
                  { id: 'knots', label: '2. Knot Density' },
                  { id: 'fringe', label: '3. Braided Fringe' },
                  { id: 'natural-dyes', label: '4. Botanical Dyes' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSpecTab(tab.id)}
                    className={`py-2 px-2.5 rounded text-xs tracking-wider uppercase text-left transition-all font-sans font-medium ${
                      activeSpecTab === tab.id
                        ? 'bg-[#55694A] text-[#FAF7F0] font-bold shadow-sm'
                        : 'bg-[#F5F0E6] text-[#362B21] hover:bg-[#E2D8C3] border border-[#DACDB3]/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Atelier Specification Summary Card */}
            <div className="bg-[#EFE8D8] p-6 sm:p-7 rounded-2xl border border-[#DACDB3] shadow-md space-y-4 card-hover-lift">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#55694A] font-sans font-bold block mb-1">
                  Inspected Masterpiece
                </span>
                <h4 className="font-serif text-2xl text-[#362B21] font-medium leading-snug">
                  {currentCarpet.name}
                </h4>
              </div>

              {/* Specification Table */}
              <div className="space-y-2 text-xs font-sans">
                <div className="flex justify-between py-2 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B] font-medium">Price</span>
                  <span className="text-[#362B21] font-bold text-lg">{currentCarpet.formattedPrice}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B]">Pile Height</span>
                  <span className="text-[#362B21] font-semibold">{currentCarpet.pileHeight}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B]">Knot Density</span>
                  <span className="text-[#362B21] font-semibold">{currentCarpet.knotDensity}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B]">Warp & Weft</span>
                  <span className="text-[#362B21] font-semibold">{currentCarpet.warpWeft}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B]">Dimensions</span>
                  <span className="text-[#362B21] font-semibold">{currentCarpet.dimensions}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#DACDB3]">
                  <span className="text-[#4E3C2B]">Weave Origin</span>
                  <span className="text-[#362B21] font-semibold">{currentCarpet.origin}</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => onOpenQuickView({
                  name: currentCarpet.name,
                  image: currentCarpet.images.full,
                  material: currentCarpet.material,
                  price: currentCarpet.price,
                  formattedPrice: currentCarpet.formattedPrice,
                  dimensions: currentCarpet.dimensions,
                  origin: currentCarpet.origin,
                  knotDensity: currentCarpet.knotDensity,
                  weaveTime: currentCarpet.weaveTime,
                  description: `Authentic handcrafted heirloom carpet. ${currentCarpet.material}. Examined in detail at our atelier studio.`
                })}
                className="w-full bg-[#55694A] hover:bg-[#657C58] text-[#FAF7F0] font-sans font-semibold py-3.5 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-md border border-[#6D7F62]"
              >
                <Eye className="w-4 h-4" />
                <span>Acquire or View Complete Specs</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
