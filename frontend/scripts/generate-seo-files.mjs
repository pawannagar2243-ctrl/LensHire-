import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve('dist');
const configuredSiteUrl = process.env.VITE_SITE_URL;
let siteOrigin = '';

if (configuredSiteUrl) {
  try {
    const parsedUrl = new URL(configuredSiteUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('URL must use HTTP or HTTPS');
    siteOrigin = parsedUrl.origin;
  } catch (error) {
    throw new Error(`Invalid VITE_SITE_URL: ${error.message}`);
  }
}

await mkdir(outputDirectory, { recursive: true });

const robotsLines = ['User-agent: *', 'Allow: /', 'Disallow: /admin'];
if (siteOrigin) robotsLines.push(`Sitemap: ${siteOrigin}/sitemap.xml`);
await writeFile(resolve(outputDirectory, 'robots.txt'), `${robotsLines.join('\n')}\n`);

if (siteOrigin) {
  const paths = ['/', '/cameras', '/categories', '/about', '/contact'];
  const urls = paths.map((path) => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n');
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
  await writeFile(resolve(outputDirectory, 'sitemap.xml'), sitemap);
  console.log(`Generated robots.txt and sitemap.xml for ${siteOrigin}`);
} else {
  console.warn('VITE_SITE_URL is unset; generated robots.txt without a sitemap. Set it for production builds.');
}