import type { APIRoute } from 'astro';
import { getAllPublishedWorks, getAllCollections } from '../lib/content/repository.ts';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site ? site.toString() : 'https://ag-literary-publication.pages.dev').replace(/\/$/, '');
  const publishedWorks = getAllPublishedWorks();
  const collections = getAllCollections();

  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/poetry', priority: '0.8', changefreq: 'weekly' },
    { path: '/prose', priority: '0.8', changefreq: 'weekly' },
    { path: '/thoughts', priority: '0.8', changefreq: 'weekly' },
    { path: '/gallery', priority: '0.8', changefreq: 'weekly' },
    { path: '/collections', priority: '0.8', changefreq: 'weekly' },
    { path: '/archive', priority: '0.7', changefreq: 'weekly' },
    { path: '/community', priority: '0.6', changefreq: 'monthly' },
    { path: '/about', priority: '0.5', changefreq: 'monthly' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

  // Core static literary routes
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Published works
  for (const work of publishedWorks) {
    let workPath = '';
    if (work.contentType === 'poem') {
      workPath = `/poetry/${work.slug}`;
    } else if (work.contentType === 'story' || work.contentType === 'essay') {
      workPath = `/prose/${work.slug}`;
    }

    if (!workPath) continue;

    const workUrl = `${baseUrl}${workPath}`;
    const lastMod = work.updatedAt || work.publishedAt;

    xml += `  <url>\n`;
    xml += `    <loc>${workUrl}</loc>\n`;
    if (lastMod) {
      xml += `    <lastmod>${new Date(lastMod).toISOString()}</lastmod>\n`;
    }
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;

    // Bilingual alternate links if companion edition exists
    if (work.translatedEditionSlug) {
      const companion = publishedWorks.find(w => w.slug === work.translatedEditionSlug);
      if (companion) {
        const companionPath = companion.contentType === 'poem' ? `/poetry/${companion.slug}` : `/prose/${companion.slug}`;
        xml += `    <xhtml:link rel="alternate" hreflang="${work.language}" href="${workUrl}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="${companion.language}" href="${baseUrl}${companionPath}" />\n`;
      }
    }

    xml += `  </url>\n`;
  }

  // Published Collections
  for (const col of collections) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/collections/${col.slug}</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
};
