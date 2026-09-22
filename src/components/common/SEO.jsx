import { useEffect } from 'react';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://potteryrugs.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/pottery-logo.jpg`;

export default function SEO({
  title = 'House of Loom & Craft | Manufacturer & Exporter | Bhadohi',
  description = 'House of Loom & Craft - Manufacturer & Exporter of Hand Tufted Rugs, Hand Knotted Rugs, Hand Woven Rugs, Handloom Rugs, Custom Rugs, and Special Shape Rugs. G.T. Road, Ghosia, Aurai, Bhadohi 221301 U.P. (India).',
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  product = null,
  breadcrumbs = null
}) {
  const fullTitle = title.includes('House of Loom & Craft') ? title : `${title} | House of Loom & Craft`;
  const canonicalUrl = `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;

  useEffect(() => {
    // Document Title
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMeta = (name, content, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard Meta
    setMeta('description', description);

    // OpenGraph
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:url', canonicalUrl, true);
    setMeta('og:type', type, true);
    setMeta('og:image', absoluteImage, true);
    setMeta('og:site_name', 'House of Loom & Craft', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', absoluteImage);

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Structured Data JSON-LD injection
    const jsonLdElements = [];

    // Organization Schema
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'House of Loom & Craft',
      legalName: 'House of Loom & Craft',
      url: SITE_URL,
      logo: `${SITE_URL}/images/pottery-logo.jpg`,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-7460007382',
          contactType: 'sales and customer service',
          areaServed: ['IN', 'US', 'GB', 'AE', 'EU'],
          availableLanguage: ['English', 'Hindi']
        },
        {
          '@type': 'ContactPoint',
          telephone: '+91-9839116625',
          contactType: 'customer support',
          areaServed: ['IN', 'US', 'GB', 'AE', 'EU'],
          availableLanguage: ['English', 'Hindi']
        }
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'G.T. ROAD, GHOSIA, AURAI',
        addressLocality: 'Bhadohi',
        addressRegion: 'Uttar Pradesh',
        postalCode: '221301',
        addressCountry: 'IN'
      }
    };

    // WebSite Search Schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'House of Loom & Craft',
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    const injectScript = (id, data) => {
      let script = document.getElementById(id);
      if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(data);
      jsonLdElements.push(script);
    };

    injectScript('org-schema', orgSchema);
    injectScript('website-schema', websiteSchema);

    // Product Schema (if on a product page)
    if (product) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: absoluteImage,
        description: product.description || product.shortDescription,
        brand: {
          '@type': 'Brand',
          name: 'House of Loom & Craft'
        },
        manufacturer: {
          '@type': 'Organization',
          name: 'House of Loom & Craft'
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'INR',
          price: product.price,
          availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'House of Loom & Craft'
          }
        }
      };
      injectScript('product-schema', productSchema);
    }

    // Breadcrumbs Schema (if provided)
    if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          item: item.url ? (item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`) : undefined
        }))
      };
      injectScript('breadcrumb-schema', breadcrumbSchema);
    }

    return () => {
      // Cleanup product and breadcrumbs schema on unmount
      const prodEl = document.getElementById('product-schema');
      if (prodEl) prodEl.remove();
      const breadEl = document.getElementById('breadcrumb-schema');
      if (breadEl) breadEl.remove();
    };
  }, [fullTitle, description, canonicalUrl, absoluteImage, type, product, breadcrumbs]);

  return null;
}
