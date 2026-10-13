import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllPublishedWorks } from '../src/lib/content/repository.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(__dirname, '../dist/client/api');
const outputFile = path.join(outputDir, 'search.json');

try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = getAllPublishedWorks();

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

  const payload = JSON.stringify({
    success: true,
    count: items.length,
    results: items
  }, null, 2);

  fs.writeFileSync(outputFile, payload, 'utf-8');
  console.log(`✓ [Static Edge Search] Generated ${outputFile} (${items.length} works, ${Buffer.byteLength(payload)} bytes)`);
} catch (err) {
  console.error('Failed to generate static search index:', err);
  process.exit(1);
}
