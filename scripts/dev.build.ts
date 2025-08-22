import { exec } from 'node:child_process';
import { glob } from 'node:fs/promises';
import { watch } from 'chokidar';

import { main as compile } from './compile.build';

async function main(): Promise<void> {
  exec('pnpx http-server dist -c5 -a 127.0.0.1 -p 8080 -s', { cwd: process.cwd() });

  console.log('Server running at http://127.0.0.1:8080');

  const watcher = watch(await Array.fromAsync(glob('packages/*')), {
    ignored: /(^|\/)(\.|dist)(\/|$)/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (path: string) => {
    console.log(`File ${path} has been changed. Rebuilding...`);
    await compile(path.match(/packages\\([^\\]+)\\/)?.[1]);
  });

  console.log('Watching for changes in packages...');
}

main().catch(console.trace);
