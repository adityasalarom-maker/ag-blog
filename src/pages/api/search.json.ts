import type { APIRoute } from 'astro';
import { getAllPublishedWorks, searchPublishedWorks } from '../../lib/content/repository.ts';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || undefined;
  const contentType = url.searchParams.get('type') || undefined;
  const language = url.searchParams.get('lang') || undefined;

  let results = getAllPublishedWorks();

  if (query || (contentType && contentType !== 'all') || (language && language !== 'all')) {
    results = searchPublishedWorks({
      query,
      contentType,
      language
    });
  }

  // Format search items with public paths
  const items = results.map(work => {
    let section = 'poetry';
    if (work.contentType === 'story' || work.contentType === 'essay') {
      section = 'prose';
    } else if (work.contentType === 'artwork') {
      section = 'gallery';
    } else if (work.contentType === 'thought' || work.contentType === 'quote') {
      section = 'thoughts';
    }

    const publicPath = section === 'gallery' ? `/gallery#${work.slug}` : (section === 'thoughts' ? `/thoughts#${work.slug}` : `/${section}/${work.slug}`);

    return {
      id: work.id,
      title: work.title,
      slug: work.slug,
      contentType: work.contentType,
      language: work.language,
      script: work.script,
      creator: work.creator,
      excerpt: work.excerpt,
      tags: work.tags,
      categories: work.categories,
      coverImage: work.coverImage,
      coverAlt: work.coverAlt,
      publishedAt: work.publishedAt,
      publicPath
    };
  });

  return new Response(
    JSON.stringify({
      success: true,
      count: items.length,
      results: items
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    }
  );
};
