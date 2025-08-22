import { exec } from 'node:child_process';
import { glob } from 'node:fs/promises';
import { watch } from 'chokidar';
import { noop } from 'es-toolkit';

import { main as compile } from './compile.build';

let isCompiling = false;
let compileTimeoutId: NodeJS.Timeout | null;
const DEBOUNCE_DELAY = 500;

async function main(): Promise<void> {
  exec('pnpx http-server dist -c5 -a 127.0.0.1 -p 8080 -s', { cwd: process.cwd() });

  console.log('Server running at http://127.0.0.1:8080');

  const watcher = watch(await Array.fromAsync(glob('packages/*')), {
    ignored: /(^|\/)(\.|dist)(\/|$)/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async (path: string) => {
    if (compileTimeoutId) {
      clearTimeout(compileTimeoutId);
    }

    compileTimeoutId = setTimeout(async () => {
      if (isCompiling) {
        return;
      }
      isCompiling = true;

      try {
        console.log(`File ${path} has been changed. Rebuilding...`);
        await compile(path.match(/packages\\([^\\]+)\\/)?.[1]).catch(noop);
      } finally {
        isCompiling = false;
        compileTimeoutId = null;
      }
    }, DEBOUNCE_DELAY);
  });

  console.log('Watching for changes in packages...');
}

main().catch(console.trace);
