const getSiteOrigin = () => {
  const configuredUrl = import.meta.env.VITE_SITE_URL;
  const currentUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const candidate = configuredUrl || currentUrl;

  try {
    return new URL(candidate).origin;
  } catch {
    return currentUrl;
  }
};

const setMeta = (key, value, attribute = 'name') => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
};

export const setDocumentSEO = (metadata, pathname = window.location.pathname) => {
  const siteOrigin = getSiteOrigin();
  const pageUrl = new URL(pathname, `${siteOrigin}/`).toString();
  const title = metadata.title || 'LensHire | Camera Rental';
  const description = metadata.description || 'Rent cameras, lenses and filmmaking gear with LensHire.';
  const image = import.meta.env.VITE_SEO_IMAGE;

  document.title = title;
  setMeta('description', description);
  setMeta('robots', metadata.noIndex ? 'noindex,follow' : 'index,follow');
  setMeta('og:type', 'website', 'property');
  setMeta('og:site_name', 'LensHire', 'property');
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:url', pageUrl, 'property');
  setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);

  if (image) {
    const absoluteImage = new URL(image, `${siteOrigin}/`).toString();
    setMeta('og:image', absoluteImage, 'property');
    setMeta('twitter:image', absoluteImage);
  }

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = pageUrl;

  let schema = document.head.querySelector('#lenshire-website-schema');
  if (!schema) {
    schema = document.createElement('script');
    schema.id = 'lenshire-website-schema';
    schema.type = 'application/ld+json';
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LensHire',
    url: `${siteOrigin}/`,
    description: 'Rent cameras, lenses and filmmaking gear with LensHire.',
  });
};