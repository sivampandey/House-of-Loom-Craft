import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';

// Fix Node.js on Windows when c-ares DNS resolver defaults to [ '127.0.0.1' ] causing querySrv ECONNREFUSED
if (dns.getServers().includes('127.0.0.1')) {
  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  } catch (err) {
    // Graceful fallback
  }
}

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pottery_rugs';

const initialCarpets = [
  {
    name: 'Nain Imperial Ivory Medallion Rug',
    slug: 'nain-imperial-ivory-medallion',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    category: 'Hand Knotted Rugs',
    price: 38500,
    compareAtPrice: 48500,
    dimensions: "9' x 12' (275 x 365 cm)",
    material: '80% High-Plateau Wool, 20% Mulberry Silk',
    knotDensity: '450 Knots / sq. inch',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '14 Months (Single Master Loom)',
    texture: '/images/carpets/royal-ivory-medallion.jpg',
    images: ['/images/carpets/royal-ivory-medallion.jpg', '/images/carpets/royal-ivory-medallion-detail.jpg'],
    thumbnail: '/images/carpets/royal-ivory-medallion.jpg',
    badge: 'Masterpiece Crown',
    description: 'A magnificent jewel of Indian master knotting, displaying an intricate 16-point gilded central medallion set against an antique ivory floral field. Framed by ornate corner spandrels (lachak-toranj) and multi-tiered borders with woven fringe tassels. Hand-knotted with pure silk highlights that illuminate under changing light.',
    shortDescription: 'Grand 16-point gilded central medallion carpet hand-knotted with 450 KPSI fine single knots.',
    details: [
      'Hand-knotted with 450 KPSI fine single knots in Bhadohi',
      'Lustrous pure mulberry silk inlay along flower petals and medallion core',
      'Naturally washed for a silky cashmere touch and generational longevity',
      'Accompanied by Atelier Certificate of Origin & Authenticity'
    ],
    stock: 3,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Nain Imperial Ivory Medallion Rug | House of Loom & Craft Bhadohi',
    seoDescription: 'Authentic hand-knotted Nain Imperial Ivory medallion carpet with 450 KPSI wool and silk highlights from Bhadohi.',
    seoKeywords: ['ivory medallion rug', 'nain carpet', 'hand knotted rug', 'bhadohi rugs', 'luxury silk rug']
  },
  {
    name: 'Royal Noir & Gilded Court Rug',
    slug: 'noir-gold-court-arabesque',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    category: 'Hand Knotted Rugs',
    price: 32500,
    compareAtPrice: 42500,
    dimensions: "8' x 10' (240 x 300 cm)",
    material: '85% Bikaner Hand-Spun Wool, 15% Mulberry Silk',
    knotDensity: '400 Knots / sq. inch',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '11 Months',
    texture: '/images/carpets/noir-gold-arabesque.jpg',
    images: ['/images/carpets/noir-gold-arabesque.jpg'],
    thumbnail: '/images/carpets/noir-gold-arabesque.jpg',
    badge: 'Atelier Signature',
    description: 'A striking nocturnal palace aesthetic featuring a deep midnight-noir field covered in continuous golden arabesque flora and palmette vines. The heavy ivory border features intricate floral cartouches finished with immaculate white fringes.',
    shortDescription: 'Striking midnight-noir field with continuous golden arabesque flora and ivory border.',
    details: [
      'Deep midnight noir ground with antique champagne gold floral motifs',
      'Hand-sheared 8.5mm tight dense pile offering supreme underfoot comfort',
      'Double overcast selvages with reinforced hand-spun cotton warp',
      'Hand-finished by master artisans in Bhadohi'
    ],
    stock: 4,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Royal Noir & Gilded Court Rug | House of Loom & Craft Bhadohi',
    seoDescription: 'Midnight noir and gold hand-knotted carpet with 400 KPSI density and pure silk accents crafted in Bhadohi.',
    seoKeywords: ['black and gold rug', 'noir court rug', 'hand knotted carpet', 'bhadohi luxury rugs']
  },
  {
    name: 'Isfahan Celestial Ivory & Indigo Bloom',
    slug: 'isfahan-celestial-ivory-bloom',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    category: 'Hand Knotted Rugs',
    price: 29500,
    compareAtPrice: 39500,
    dimensions: "8' x 10' (240 x 300 cm)",
    material: '80% High-Plateau Virgin Wool, 20% Pure Bamboo Silk',
    knotDensity: '380 Knots / sq. inch',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '10 Months',
    texture: '/images/carpets/ivory-celestial-bloom.jpg',
    images: ['/images/carpets/ivory-celestial-bloom.jpg'],
    thumbnail: '/images/carpets/ivory-celestial-bloom.jpg',
    badge: 'Heirloom Edition',
    description: 'An ethereal garden rug woven on a luminous ivory foundation with swirling lotus vines, slate blue scrolls, and subtle terracotta touches. Its harmonious symmetry breathes airy elegance into both classical and contemporary residences.',
    shortDescription: 'Luminous ivory garden rug with slate blue scrolls and delicate bamboo silk luster.',
    details: [
      'Luminous ivory field with Persian blue and sage mineral tones',
      'Naturally dyed with plant extracts aged under open sunlight',
      'Fine hand-knotted structure with soft, resilient high-grade fleece',
      'Includes bespoke care guide and signed inspection certificate'
    ],
    stock: 4,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Isfahan Celestial Ivory & Indigo Bloom Rug | House of Loom & Craft Bhadohi',
    seoDescription: 'Ethereal ivory and slate blue floral hand-knotted rug with 380 KPSI density by master artisans in Bhadohi.',
    seoKeywords: ['ivory floral rug', 'isfahan rug', 'blue and ivory carpet', 'hand knotted rug bhadohi']
  },
  {
    name: 'Kashan Imperial Crimson Medallion',
    slug: 'kashan-imperial-crimson',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    category: 'Hand Knotted Rugs',
    price: 28500,
    compareAtPrice: 38500,
    dimensions: "8' x 10' (240 x 300 cm)",
    material: '80% High-Plateau Wool, 20% Mulberry Silk',
    knotDensity: '360 Knots / sq. inch',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '9 Months (Single Master Loom)',
    texture: '/textures/carpet-crimson.jpg',
    images: ['/textures/carpet-crimson.jpg', '/images/journal-penthouse.jpg'],
    thumbnail: '/textures/carpet-crimson.jpg',
    badge: 'Atelier Signature',
    description: 'An extraordinary heirloom carpet reviving classical royal palace court motifs. Saturated natural pomegranate crimson and cobalt indigo borders embrace a gilded ivory floral medallion. Pure silk highlights catch changing ambient light throughout the day.',
    shortDescription: 'Generational royal medallion hand-knotted with natural dyes and pure mulberry silk.',
    details: [
      'Individually hand-knotted by generational master artisans in Bhadohi',
      'Naturally dyed with madder root, pomegranate rind, and pure indigo',
      'Lustrous pure mulberry silk accents on raised floral relief',
      'Hand-finished with double-overcast selvages and natural cotton fringes'
    ],
    stock: 5,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Kashan Imperial Crimson Hand Knotted Carpet | House of Loom & Craft Bhadohi',
    seoDescription: 'Handcrafted Kashan Imperial Crimson heirloom rug. Hand-knotted with 360 KPSI high-plateau wool & pure mulberry silk in Bhadohi, India.',
    seoKeywords: ['hand knotted rug', 'kashan rug', 'crimson medallion carpet', 'bhadohi rugs', 'luxury wool silk carpet']
  },
  {
    name: 'Emerald Safavid Royal Medallion',
    slug: 'emerald-safavid-court',
    collection: 'hand-knotted',
    collectionName: 'Hand Knotted Rugs',
    category: 'Hand Knotted Rugs',
    price: 34000,
    compareAtPrice: 44000,
    dimensions: "9' x 12' (275 x 365 cm)",
    material: '70% Hand-Spun Wool, 30% Pure Silk Weft',
    knotDensity: '420 Knots / sq. inch',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '12 Months',
    texture: '/textures/carpet-emerald.jpg',
    images: ['/textures/carpet-emerald.jpg', '/images/craft-weaving.jpg'],
    thumbnail: '/textures/carpet-emerald.jpg',
    badge: 'Masterpiece',
    description: 'A serene jewel-toned tribute to alpine royal terraces. Hand-spun virgin wool dyed in deep forest emerald and light olive, framing a complex ivory medallion with touches of burnt umber and sapphire lapis. Cashmere-soft hand feel with remarkable durability.',
    shortDescription: 'Ultra-fine 420 KPSI hand-knotted jewel-toned heirloom in virgin wool and pure silk weft.',
    details: [
      'Ultra-fine knotting density with velvety tactile pile',
      'Organic mineral dyes aged in open sunlight in Bhadohi',
      'Reversible tensile core with hand-spun cotton warp',
      'Includes bespoke certificate of provenance signed by master weaver'
    ],
    stock: 4,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Emerald Safavid Royal Medallion Rug | House of Loom & Craft Bhadohi',
    seoDescription: 'Discover the Emerald Safavid 420 KPSI royal medallion carpet hand-knotted in Bhadohi. Natural mineral dyes with cashmere-soft touch.',
    seoKeywords: ['emerald carpet', 'safavid royal rug', 'fine hand knotted carpet', 'bhadohi exporter']
  },
  {
    name: 'Monolith Sculpted High-Low Rug',
    slug: 'nordic-monolith-abstract',
    collection: 'hand-tufted',
    collectionName: 'Hand Tufted Rugs',
    category: 'Hand Tufted Rugs',
    price: 26000,
    compareAtPrice: 30000,
    dimensions: "8' x 10' (240 x 300 cm)",
    material: '100% Un-dyed New Zealand Fleece Wool',
    knotDensity: 'Dense Sculpted High-Low Pile',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '4 Months',
    texture: '/images/carpets/nordic-monolith-abstract.jpg',
    images: ['/images/carpets/nordic-monolith-abstract.jpg', '/images/journal-penthouse.jpg'],
    thumbnail: '/images/carpets/nordic-monolith-abstract.jpg',
    badge: 'Architectural Feature',
    description: 'Inspired by geological layering and minimalist interior architecture. Gentle topographical contours carved by hand into undyed ivory, taupe, slate, and desert sand fleece.',
    shortDescription: 'Topographical sculpted relief hand-tufted from 100% undyed New Zealand fleece wool.',
    details: [
      'Bevelled high-low dimensional pile relief with tactile depth',
      'Zero synthetic dyes — 100% unbleached natural fleece grading',
      'Heavy cotton canvas backing with eco-friendly natural latex',
      'Superior acoustic dampening for double-height spaces'
    ],
    stock: 8,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Monolith Sculpted High-Low Rug | House of Loom & Craft',
    seoDescription: 'Architectural hand-tufted rug crafted with undyed New Zealand fleece wool. Topographical high-low pile for contemporary spaces.',
    seoKeywords: ['sculpted rug', 'hand tufted rug', 'undyed wool carpet', 'minimalist luxury carpet']
  },
  {
    name: 'Dune Saffron Handloom Textured Rug',
    slug: 'terracotta-dune-modern',
    collection: 'handloom',
    collectionName: 'Handloom Rugs',
    category: 'Handloom Rugs',
    price: 23500,
    compareAtPrice: 28000,
    dimensions: "6' x 9' (180 x 270 cm)",
    material: '85% Bikaner Wool, 15% Raw Tussar Silk',
    knotDensity: 'Interlocking Handloom Weave',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '3 Months',
    texture: '/images/carpets/dune-saffron-handloom.jpg',
    images: ['/images/carpets/dune-saffron-handloom.jpg', '/images/room-after.jpg'],
    thumbnail: '/images/carpets/dune-saffron-handloom.jpg',
    badge: 'Artisan Handloom',
    description: 'Warm earthen warmth crafted for contemporary interiors. Terracotta and sun-baked ochre linear rhythms crafted on master handlooms with subtle abrash variations from hand-spun yarn lots.',
    shortDescription: 'Warm terracotta and saffron linear rhythms woven on master pit looms.',
    details: [
      'Rich natural abrash color variation',
      'Extremely durable tight weave suitable for high-traffic living rooms',
      'Finished with braided fringe tassels by hand'
    ],
    stock: 6,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Dune Saffron Handloom Textured Rug | House of Loom & Craft',
    seoDescription: 'Handloom textured wool rug with raw Tussar silk in terracotta and saffron. Artisan woven in Bhadohi.',
    seoKeywords: ['handloom rug', 'terracotta carpet', 'bikaner wool rug', 'handcrafted flatweave']
  },
  {
    name: 'Solarium Reversible Hand Woven Kilim',
    slug: 'solarium-ochre-flatweave',
    collection: 'hand-woven',
    collectionName: 'Hand Woven Rugs',
    category: 'Hand Woven Rugs',
    price: 16500,
    compareAtPrice: 20000,
    dimensions: "5' x 8' (150 x 240 cm)",
    material: '100% Hand-Spun Organic Indian Wool',
    knotDensity: 'Tight Slit Tapestry Flatweave',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '2 Months',
    texture: '/images/carpets/solarium-ochre-flatweave.jpg',
    images: ['/images/carpets/solarium-ochre-flatweave.jpg', '/images/craft-yarn.jpg'],
    thumbnail: '/images/carpets/solarium-ochre-flatweave.jpg',
    badge: 'Hand Woven',
    description: 'Geometric symmetry reimagined for clean modern homes. Fully reversible flatweave hand-woven on horizontal pit looms with naturally dyed sheep wool.',
    shortDescription: 'Fully reversible organic sheep wool flatweave kilim in warm ochre geometry.',
    details: [
      'Dual-sided reversible utility for longevity',
      'Lightweight yet remarkably resilient',
      'Treated with eco-friendly organic washed finish'
    ],
    stock: 10,
    isFeatured: false,
    isActive: true,
    leadTime: 'In Stock - Dispatches in 24-48 Hours',
    seoTitle: 'Solarium Reversible Hand Woven Kilim | House of Loom & Craft',
    seoDescription: 'Hand-woven kilim in 100% organic Indian wool. Fully reversible flatweave crafted by master weavers.',
    seoKeywords: ['hand woven kilim', 'flatweave rug', 'reversible rug', 'organic wool kilim']
  },
  {
    name: 'Atelier Curvilinear Sculpted Rug',
    slug: 'curvilinear-sculpted-arch',
    collection: 'special-shape',
    collectionName: 'Special Shape Rugs',
    category: 'Special Shape Rugs',
    price: 30000,
    compareAtPrice: 38000,
    dimensions: "7' x 9' Organic Oval Arch",
    material: 'Pure New Zealand Wool & Bamboo Silk Inlay',
    knotDensity: 'Sculpted Organic Shape Relief',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: '3.5 Months',
    texture: '/images/carpets/curvilinear-sculpted-arch.jpg',
    images: ['/images/carpets/curvilinear-sculpted-arch.jpg', '/images/bespoke-atelier.jpg'],
    thumbnail: '/images/carpets/curvilinear-sculpted-arch.jpg',
    badge: 'Special Shape Rug',
    description: 'Custom organic outline crafted for modern curved sofas, foyers, and bespoke living spaces. Hand-carved perimeter creates an artistic statement underfoot.',
    shortDescription: 'Organic contoured oval arch silhouette hand-carved in New Zealand wool and bamboo silk.',
    details: [
      'Non-rectangular custom contoured edge profile',
      'High-low pile relief with lustrous silk accent ribbons',
      'Tailored to fit curved architectural furniture arrangements'
    ],
    stock: 4,
    isFeatured: true,
    isActive: true,
    leadTime: 'In Stock / Custom Orders Welcome',
    seoTitle: 'Curvilinear Sculpted Arch Rug | House of Loom & Craft',
    seoDescription: 'Non-rectangular organic curved rug designed for modern architectural spaces and curved seating.',
    seoKeywords: ['special shape rug', 'curved rug', 'oval arch carpet', 'organic sculpted rug']
  },
  {
    name: 'Bespoke Custom Architectural Rug',
    slug: 'bespoke-custom-atelier',
    collection: 'custom',
    collectionName: 'Custom Rugs',
    category: 'Custom Rugs',
    price: 39500,
    compareAtPrice: 49500,
    dimensions: "Custom Sizes (Up to 20' x 30')",
    material: 'Client-Specified (Pure Silk, Cashmere, Himalayan Wool)',
    knotDensity: 'Tailored Knot Density (200 - 600 KPSI)',
    origin: 'Bhadohi, U.P. (India)',
    manufacturer: 'House of Loom & Craft (Manufacturer & Exporter)',
    weaveTime: 'Made to Order',
    texture: '/images/carpets/bespoke-custom-architectural.jpg',
    images: ['/images/carpets/bespoke-custom-architectural.jpg', '/images/craft-weaving.jpg'],
    thumbnail: '/images/carpets/bespoke-custom-architectural.jpg',
    badge: 'Custom Commission',
    description: 'Commission a completely unique masterpiece tailored to your interior floorplan. Select custom dimensions, color pantones, pile height, and shape directly with our Bhadohi master artisans.',
    shortDescription: 'Custom architectural carpet commission tailored to exact room plans, dye lots, and pile depths.',
    details: [
      'Direct coordination with master draftsmen and dye masters',
      'Complimentary yarn pom box and digital floor plan visualization',
      'Handcrafted to exact architectural specifications'
    ],
    stock: 20,
    isFeatured: true,
    isActive: true,
    leadTime: 'Custom Crafted - Delivery in 4-8 Weeks',
    seoTitle: 'Bespoke Custom Architectural Rug Commission | House of Loom & Craft',
    seoDescription: 'Bespoke handcrafted rugs made to measure for luxury residences and hotels. Handcrafted in Bhadohi, India.',
    seoKeywords: ['custom rugs', 'bespoke carpets', 'made to order rugs', 'architectural carpets bhadohi']
  }
];

const initialDecor = [
  {
    name: 'Bikaner Hand-Embroidered Linen Cushions (Set of 2)',
    slug: 'zari-embroidered-cushion-set',
    category: 'Cushions & Pillows',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 18000,
    compareAtPrice: 28000,
    dimensions: '20" x 20" (50 x 50 cm)',
    material: 'Natural Belgian Linen, Hand-Spun Wool Embroidery, Brass Zipper',
    origin: 'Rajasthan, India',
    images: ['/images/bikaner-linen-cushions.jpg'],
    thumbnail: '/images/bikaner-linen-cushions.jpg',
    texture: '/images/bikaner-linen-cushions.jpg',
    description: 'Earthy terracotta, saffron, and sand motifs crewel-embroidered by artisan women onto heavyweight stonewashed linen. Features plush Hungarian goose down filler inserts.',
    shortDescription: 'Crewel hand-embroidered Belgian linen cushions with down inserts.',
    badge: 'Artisan Crafted',
    stock: 12,
    isFeatured: true,
    isActive: true,
    details: [
      'Hand-spun wool crewel embroidery on natural Belgian linen',
      'Heavyweight antique brass hidden zipper',
      'Includes premium goose down filler'
    ],
    seoTitle: 'Bikaner Hand-Embroidered Linen Cushions | House of Loom & Craft',
    seoDescription: 'Luxury hand-embroidered Belgian linen cushion set. Artisanal crewel embroidery with goose down inserts.',
    seoKeywords: ['luxury cushions', 'hand embroidered pillows', 'belgian linen cushion', 'artisan home decor']
  },
  {
    name: 'Ladakh Hand-Spun Cashmere Throw',
    slug: 'ladakh-pashmina-cashmere-throw',
    category: 'Cashmere Throws',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 24000,
    compareAtPrice: 34000,
    dimensions: '55" x 75" (140 x 190 cm)',
    material: '100% Grade-A Himalayan Cashmere Wool',
    origin: 'Leh-Ladakh, India',
    images: ['/images/ladakh-cashmere-throw.jpg', '/images/craft-yarn.jpg'],
    thumbnail: '/images/ladakh-cashmere-throw.jpg',
    texture: '/images/ladakh-cashmere-throw.jpg',
    description: 'Cloud-soft pashmina wool spun on traditional spinning wheels and woven on wooden handlooms. Natural unbleached sand hue with delicate hand-twisted eyelash fringe.',
    shortDescription: 'Pure Grade-A Himalayan pashmina cashmere throw with eyelash fringe.',
    badge: 'Limited Edition',
    stock: 5,
    isFeatured: true,
    isActive: true,
    details: [
      '100% pure hand-spun Himalayan cashmere',
      'Traditional wooden handloom weave',
      'Natural unbleached sand hue'
    ],
    seoTitle: 'Ladakh Hand-Spun Cashmere Throw | House of Loom & Craft',
    seoDescription: '100% Grade-A Himalayan cashmere throw hand-spun and hand-woven in Ladakh.',
    seoKeywords: ['cashmere throw', 'pashmina blanket', 'luxury wool throw', 'himalayan cashmere']
  },
  {
    name: 'Jodhpur Sculpted Bouclé Wool Pouf',
    slug: 'jodhpur-textured-wool-pouf',
    category: 'Wool Poufs',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 19000,
    compareAtPrice: 28000,
    dimensions: '24" W x 24" D x 16" H (60 x 60 x 40 cm)',
    material: 'High-Density Wool Bouclé & Jute Core, Sustainable Cotton Fill',
    origin: 'Jodhpur, India',
    images: ['/images/jodhpur-wool-pouf.jpg'],
    thumbnail: '/images/jodhpur-wool-pouf.jpg',
    texture: '/images/jodhpur-wool-pouf.jpg',
    description: 'Tactile sculptural seating with hand-braided terracotta accent banding. Heavy dense structure maintains shape while providing grounded lounging comfort.',
    shortDescription: 'Tactile wool bouclé sculptural pouf with hand-braided terracotta accent.',
    badge: 'Signature Piece',
    stock: 7,
    isFeatured: true,
    isActive: true,
    details: [
      'High-density wool bouclé upholstery',
      'Internal structured jute core holds form under use',
      'Handmade in Jodhpur, India'
    ],
    seoTitle: 'Jodhpur Sculpted Bouclé Wool Pouf | House of Loom & Craft',
    seoDescription: 'Sculptural wool bouclé ottoman pouf crafted with durable jute core and terracotta banding.',
    seoKeywords: ['wool pouf', 'bouclé ottoman', 'architectural seating', 'jodhpur furniture']
  },
  {
    name: 'Artisan Hand-Hammered Antique Brass Urn',
    slug: 'hammered-brass-kansa-vase',
    category: 'Decorative Brass & Stone',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 15500,
    compareAtPrice: 22000,
    dimensions: '14" Dia x 16" H (35 x 40 cm)',
    material: '100% Solid Repousse Hand-Beaten Brass',
    origin: 'Moradabad, India',
    images: ['/images/antique-brass-urn.jpg'],
    thumbnail: '/images/antique-brass-urn.jpg',
    texture: '/images/antique-brass-urn.jpg',
    description: 'Shaped by master metalsmiths through thousands of precision hand-hammer strikes. Finished with a natural aged living patina that deepens with time.',
    shortDescription: 'Repousse hand-beaten solid brass urn with natural living patina.',
    badge: 'Heirloom Metalwork',
    stock: 9,
    isFeatured: true,
    isActive: true,
    details: [
      '100% solid repousse brass with aged patina',
      'Formed by master metalsmiths with precision hand strikes',
      'Living antique finish deepens naturally'
    ],
    seoTitle: 'Artisan Hand-Hammered Brass Urn | House of Loom & Craft',
    seoDescription: 'Solid repousse brass urn handcrafted in Moradabad. Living patina finish.',
    seoKeywords: ['brass urn', 'hand hammered vase', 'indian metalwork', 'luxury home decor accents']
  },
  {
    name: 'Jaipur Travertine Low Monolith Table',
    slug: 'travertine-monolith-coffee-table',
    category: 'Sculptural Tables',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 28000,
    compareAtPrice: 35000,
    dimensions: '48" L x 32" W x 14" H (120 x 80 x 35 cm)',
    material: 'Honed Roman Travertine, Chiseled Raw Edge Base',
    origin: 'Jaipur, India',
    images: ['/images/room-after.jpg'],
    thumbnail: '/images/room-after.jpg',
    texture: '/images/room-after.jpg',
    description: 'Sculpted from a single block of warm vein-cut travertine. Features raw chiseled perimeter edges contrasted against a satiny honed top surface.',
    shortDescription: 'Solid vein-cut travertine monolith coffee table with raw chiseled edge.',
    badge: 'Architectural Special',
    stock: 3,
    isFeatured: false,
    isActive: false,
    details: [
      'Single solid block of warm vein-cut travertine',
      'Satin honed top surface with raw chiseled edge detailing',
      'Weight: 85 kg (White-glove delivery included)'
    ],
    seoTitle: 'Jaipur Travertine Low Monolith Coffee Table | House of Loom & Craft',
    seoDescription: 'Solid vein-cut travertine coffee table sculpted by Jaipur stonemasons.',
    seoKeywords: ['travertine table', 'stone monolith table', 'sculptural coffee table', 'jaipur stonework']
  },
  {
    name: 'Kashmir Royal Court Wall Hanging Tapestry',
    slug: 'heritage-indigo-wall-tapestry',
    category: 'Wall Tapestries',
    collection: 'home-decor',
    collectionName: 'Architectural Accents',
    price: 17000,
    compareAtPrice: 28000,
    dimensions: "4' x 6' (120 x 180 cm)",
    material: 'Silk Warp with Hand-Spun Wool Weft, Brass Hanging Rod',
    origin: 'Srinagar, India',
    images: ['/images/kashmir-wall-tapestry.jpg', '/images/craft-weaving.jpg'],
    thumbnail: '/images/kashmir-wall-tapestry.jpg',
    texture: '/images/kashmir-wall-tapestry.jpg',
    description: 'An architectural acoustic textile featuring sacred paisley and Tree of Life botanicals. Elevates double-height entry halls, dining rooms and salon walls.',
    shortDescription: 'Sacred Tree of Life tapestry hand-woven with silk warp and wool weft.',
    badge: 'Gallery Piece',
    stock: 2,
    isFeatured: false,
    isActive: true,
    details: [
      'Silk warp with vegetable-dyed hand-spun wool weft',
      'Includes solid antique brass mounting rod and finials',
      'Superb acoustic dampening for grand salons'
    ],
    seoTitle: 'Kashmir Royal Court Wall Tapestry | House of Loom & Craft',
    seoDescription: 'Hand-woven Tree of Life wall tapestry. Fine silk warp and wool weft crafted in Kashmir.',
    seoKeywords: ['wall tapestry', 'kashmir textile', 'acoustic wall hanging', 'heritage silk tapestry']
  }
];

export const seedDatabase = async () => {
  try {
    const maskedURI = mongoURI.replace(/:\/\/[^:]+:([^@]+)@/, '://Vrc-admin:****@');
    console.log(`[Seed] Connecting to MongoDB at ${maskedURI}...`);
    await mongoose.connect(mongoURI);

    // 1. Seed Products using non-destructive UPSERT to preserve data
    console.log('[Seed] Upserting Carpets & Decor products...');
    const allProducts = [...initialCarpets, ...initialDecor];

    for (const p of allProducts) {
      await Product.findOneAndUpdate(
        { slug: p.slug },
        { $set: p },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log(`[Seed] Successfully synchronized ${allProducts.length} product records.`);

    // 2. Seed Initial Client & Admin - strictly disabled unless SEED_DEMO_USERS === 'true'
    if (process.env.SEED_DEMO_USERS === 'true') {
      console.log('[Seed] SEED_DEMO_USERS is enabled. Processing demo client and curator accounts...');
      const clientEmail = process.env.SEED_CLIENT_EMAIL || 'client@potteryrugs.com';
      const clientPass = process.env.SEED_CLIENT_PASSWORD || 'AtelierClient2026!';
      const adminEmail = process.env.SEED_ADMIN_EMAIL || 'Potteryrugs@gmail.com';
      const adminPass = process.env.SEED_ADMIN_PASSWORD || 'AtelierMaster2026!';

      // Seed Demo Client
      let clientUser = await User.findOne({ email: clientEmail.toLowerCase() });
      if (!clientUser) {
        clientUser = await User.create({
          firstName: 'Devendra',
          lastName: 'Singhania',
          email: clientEmail.toLowerCase(),
          phone: '+91 9839116625',
          passwordHash: clientPass,
          role: 'customer',
          addresses: [
            {
              fullName: 'Devendra Singhania',
              phone: '+91 9839116625',
              addressLine1: 'Villa 14, The Oberoi Greens',
              addressLine2: 'Golf Course Road, Sector 42',
              city: 'Gurugram',
              state: 'Haryana',
              postalCode: '122002',
              country: 'India',
              landmark: 'Near Club House',
              isDefault: true
            }
          ]
        });
        console.log(`[Seed] Created demo client account: ${clientEmail}`);
      }

      // Seed Curator Admin
      let adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
      if (!adminUser) {
        adminUser = await User.create({
          firstName: 'Atelier',
          lastName: 'Curator',
          email: adminEmail.toLowerCase(),
          phone: '+91 7460007382',
          passwordHash: adminPass,
          role: 'admin'
        });
        console.log(`[Seed] Created demo curator account: ${adminEmail}`);
      }
    } else {
      console.log('[Seed] Demo accounts seeding is disabled (SEED_DEMO_USERS is not "true"). Production accounts preserved.');
    }

    console.log('[Seed] Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
