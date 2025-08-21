import { execSync } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { snakeCase } from 'es-toolkit';

import { homepage } from '../package.json';

interface TsFile {
  readonly full: string;
  readonly relative: string;
}

async function getFiles(dir: string, extensions: string[], rootDir = dir, files: TsFile[] = []): Promise<TsFile[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = posix.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await getFiles(fullPath, extensions, rootDir, files);
    } else if (entry.isFile()) {
      const matchedExt = extensions.find((ext) => fullPath.endsWith(ext));
      if (matchedExt) {
        const relativePath = posix.relative(rootDir, fullPath);
        files.push({ full: fullPath, relative: relativePath });
      }
    }
  }
  return files;
}

interface Meta {
  name: string;
  match: string[];
  description?: string;
  icon?: string;
  grant?: string[];
}

const META_ICON = 'https://www.google.com/s2/favicons?sz=64&domain=violentmonkey.github.io';
const META_BLOCK = `
// ==UserScript==
// @name         {{name}}
// @description  {{description}}
// @icon         {{icon}}
// @author       {{author}}
// @version      {{version}}
// @namespace    ${homepage}
// @homepage     ${homepage}
// @match        {{match}}
// @grant        {{grant}}
// @run-at       document-start
// ==/UserScript==

{{source}}
`;

const INPUT_DIR = posix.resolve('packages');
const OUTPUT_DIR = posix.resolve('dist');
const TARGET_FILES = ['src/index.ts'];

const META_FILE = (path: string) => posix.resolve(path, 'meta.json');
const PACKAGE_FILE = (path: string) => posix.resolve(path, 'package.json');

async function main(): Promise<void> {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  execSync('pnpm run build', { stdio: 'inherit' });

  const files = await getFiles(INPUT_DIR, TARGET_FILES);
  for (const file of files) {
    const regex = new RegExp(TARGET_FILES.join('|'), 'gi');
    const repo = file.full.replace(regex, '');

    const meta: Meta = JSON.parse(await readFile(META_FILE(repo), 'utf8'));
    const pkg = JSON.parse(await readFile(PACKAGE_FILE(repo), 'utf8'));

    const dist = posix.resolve(repo, 'dist', 'index.js');
    const source = await readFile(dist, 'utf8');

    const userScript = META_BLOCK.replace('{{name}}', meta.name)
      .replace('{{description}}', meta.description ?? '-')
      .replace('{{icon}}', meta.icon ?? META_ICON)
      .replace('{{author}}', pkg.author ?? 'Peke')
      .replace('{{version}}', pkg.version ?? '0.0.0')
      .replace('{{match}}', meta.match.join('\n// @match        '))
      .replace('{{grant}}', meta.grant?.join('\n// @grant        ') ?? 'none')
      .replace('{{source}}', source);

    const finalFile = `${snakeCase(pkg.name)}.user.js`;
    const outFile = posix.resolve(OUTPUT_DIR, finalFile);
    await writeFile(outFile, userScript.trim(), 'utf8');
    console.log(`Success: ${finalFile}`);
  }

  console.log('All builds successfully.');
}

main().catch(console.trace);
