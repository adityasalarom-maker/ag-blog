import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();
const WORKS_PATH = path.join(ROOT_DIR, 'src/data/seed/works.json');
const COLLECTIONS_PATH = path.join(ROOT_DIR, 'src/data/seed/collections.json');
const CREATORS_PATH = path.join(ROOT_DIR, 'src/data/seed/creators.json');
const BACKUPS_DIR = path.join(ROOT_DIR, 'data/backups');

export async function exportContent() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }

  const works = JSON.parse(fs.readFileSync(WORKS_PATH, 'utf-8'));
  const collections = JSON.parse(fs.readFileSync(COLLECTIONS_PATH, 'utf-8'));
  const creators = JSON.parse(fs.readFileSync(CREATORS_PATH, 'utf-8'));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const payload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    stats: {
      totalWorks: works.length,
      publishedWorks: works.filter(w => w.status === 'published').length,
      draftWorks: works.filter(w => w.status === 'draft').length,
      collectionsCount: collections.length,
      creatorsCount: creators.length
    },
    data: {
      works,
      collections,
      creators
    }
  };

  const payloadString = JSON.stringify(payload, null, 2);
  const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

  const bundle = {
    ...payload,
    checksum
  };

  const backupFilePath = path.join(BACKUPS_DIR, `content_backup_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(bundle, null, 2), 'utf-8');

  console.log(`[Export Success] Created backup at ${backupFilePath}`);
  console.log(`  Total Works: ${bundle.stats.totalWorks} (Published: ${bundle.stats.publishedWorks}, Drafts: ${bundle.stats.draftWorks})`);
  console.log(`  Collections: ${bundle.stats.collectionsCount}`);
  console.log(`  Checksum (SHA-256): ${checksum}`);

  return { backupFilePath, checksum, stats: bundle.stats };
}

// Direct execution
if (process.argv[1]?.endsWith('export_content.mjs')) {
  exportContent().catch(err => {
    console.error('[Export Failed]:', err);
    process.exit(1);
  });
}
