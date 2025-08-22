import { exec } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';

import { main as compile } from './compile.build';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  exec('pnpx http-server dist -c5 -a 127.0.0.1 -p 8080 -s', { cwd: process.cwd() });

  console.log('http-server running at http://127.0.0.1:8080');

  const watcher = chokidar.watch(`${__dirname}/../packages`, {
    ignored: [
      // Ignore hidden files/folders (starts with .)
      /(^|[\/\\])\../,
      // Ignore any 'dist' directories
      /[\/\\]dist[\/\\]/,
    ],
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (path: string) => {
    console.log(`File ${path} has been changed. Rebuilding...`);
    let normalizedPath = path.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const packagesIndex = parts.indexOf('packages');
    let packageName = '';
    if (packagesIndex !== -1 && parts.length > packagesIndex + 1) {
      packageName = parts[packagesIndex + 1];
    }
    await compile(packageName);
  });

  console.log('Watching for changes in packages...');
}

main().catch(console.trace);
