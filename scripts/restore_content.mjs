import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT_DIR = process.cwd();

export async function restoreContent(backupFilePath, targetDir = path.join(ROOT_DIR, 'src/data/seed')) {
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file not found at ${backupFilePath}`);
  }

  const rawBundle = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
  const { checksum, ...payload } = rawBundle;

  // Verify Checksum
  const computedChecksum = crypto.createHash('sha256').update(JSON.stringify(payload, null, 2)).digest('hex');
  if (computedChecksum !== checksum) {
    throw new Error(`[Checksum Mismatch] Backup file is corrupt or altered! Expected ${checksum}, computed ${computedChecksum}`);
  }

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Restore files
  const worksPath = path.join(targetDir, 'works.json');
  const collectionsPath = path.join(targetDir, 'collections.json');
  const creatorsPath = path.join(targetDir, 'creators.json');

  fs.writeFileSync(worksPath, JSON.stringify(payload.data.works, null, 2), 'utf-8');
  fs.writeFileSync(collectionsPath, JSON.stringify(payload.data.collections, null, 2), 'utf-8');
  fs.writeFileSync(creatorsPath, JSON.stringify(payload.data.creators, null, 2), 'utf-8');

  console.log(`[Restore Success] Verified and restored content from ${backupFilePath} into ${targetDir}`);
  console.log(`  Restored ${payload.data.works.length} works, ${payload.data.collections.length} collections, ${payload.data.creators.length} creators.`);

  return { success: true, stats: payload.stats };
}

// Direct execution
if (process.argv[1]?.endsWith('restore_content.mjs')) {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/restore_content.mjs <path-to-backup-file>');
    process.exit(1);
  }
  restoreContent(fileArg).catch(err => {
    console.error('[Restore Failed]:', err);
    process.exit(1);
  });
}
