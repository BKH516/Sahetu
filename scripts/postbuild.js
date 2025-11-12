import { promises as fs } from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

async function createFallbackPage() {
  try {
    await fs.access(indexPath);
  } catch {
    console.warn('[postbuild] index.html not found, skipping fallback generation.');
    return;
  }

  try {
    const indexContent = await fs.readFile(indexPath);
    await fs.writeFile(fallbackPath, indexContent);
    console.log('[postbuild] 404.html generated for SPA routing.');
  } catch (error) {
    console.error('[postbuild] Failed to create 404.html:', error);
    process.exitCode = 1;
  }
}

createFallbackPage();

