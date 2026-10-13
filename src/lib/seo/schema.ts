import type { Work } from '../content/schema.ts';
import { PUBLICATION_INFO } from '../../data/fixtures.ts';

const SITE_URL = 'https://ag-literary-publication.pages.dev';

export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: PUBLICATION_INFO.name,
    alternateName: PUBLICATION_INFO.nameHi,
    url: SITE_URL,
    description: PUBLICATION_INFO.description,
    inLanguage: ['hi', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/archive?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function getPeriodicalSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Periodical',
    name: PUBLICATION_INFO.name,
    alternateName: PUBLICATION_INFO.nameHi,
    url: SITE_URL,
    editor: {
      '@type': 'Person',
      name: PUBLICATION_INFO.editor,
      alternateName: PUBLICATION_INFO.editorHi
    },
    publisher: {
      '@type': 'Organization',
      name: PUBLICATION_INFO.name,
      url: SITE_URL
    }
  };
}

export function getArticleSchema(work: Work, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': work.contentType === 'poem' ? ['CreativeWork', 'Article'] : 'Article',
    headline: work.title,
    description: work.excerpt || work.summary,
    inLanguage: work.language,
    datePublished: work.publishedAt,
    dateModified: work.modifiedAt || work.publishedAt,
    author: {
      '@type': 'Person',
      name: work.creator
    },
    publisher: {
      '@type': 'Organization',
      name: PUBLICATION_INFO.name,
      url: SITE_URL
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    keywords: work.tags && work.tags.length > 0 ? work.tags.join(', ') : undefined
  };
}

export function getVisualArtworkSchema(artwork: Work, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artwork.title,
    creator: {
      '@type': 'Person',
      name: artwork.creator
    },
    artMedium: artwork.artworkDetails?.medium || 'Visual Art',
    description: artwork.excerpt || artwork.summary,
    image: artwork.coverImage ? `${SITE_URL}${artwork.coverImage}` : undefined,
    dateCreated: artwork.artworkDetails?.year ? artwork.artworkDetails.year.toString() : undefined,
    url: canonicalUrl
  };
}

export function getQuotationSchema(quote: Work, canonicalUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quotation',
    text: quote.body,
    creator: {
      '@type': 'Person',
      name: quote.creator
    },
    citation: quote.quoteSource?.sourceTitle || quote.quoteSource?.sourceAuthor,
    url: canonicalUrl
  };
}

export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  };
}
