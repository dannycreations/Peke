import { execSync } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { snakeCase } from 'es-toolkit';

import { homepage } from '../package.json';

interface FilePath {
  readonly full: string;
  readonly relative: string;
}

async function getFiles(dir: string, extensions: string[], rootDir = dir, files: FilePath[] = []): Promise<FilePath[]> {
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

interface MetaBlock {
  readonly name: string;
  readonly match: string[];
  readonly description?: string;
  readonly icon?: string;
  readonly grant?: string[];
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

export async function main(packageName?: string): Promise<void> {
  let command = 'pnpm run build';
  if (packageName) {
    command += ` --filter={./packages/${packageName}}`;
  }

  execSync(command, { stdio: 'inherit' });

  const targetFileRegex = new RegExp(TARGET_FILES.join('|'), 'g');
  let files = await getFiles(INPUT_DIR, TARGET_FILES);
  if (packageName) {
    files = files.filter((file) => file.full.includes(packageName));
  }

  for (const file of files) {
    const repo = file.full.replace(targetFileRegex, '');

    const [metaContent, pkgContent, source] = await Promise.all([
      readFile(META_FILE(repo), 'utf8'),
      readFile(PACKAGE_FILE(repo), 'utf8'),
      readFile(posix.resolve(repo, 'dist', 'index.js'), 'utf8'),
    ]);

    const meta: MetaBlock = JSON.parse(metaContent);
    const pkg = JSON.parse(pkgContent);

    const userScript = META_BLOCK.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      switch (key) {
        case 'name':
          return meta.name;
        case 'description':
          return meta.description ?? '-';
        case 'icon':
          return meta.icon ?? META_ICON;
        case 'author':
          return pkg.author ?? 'Peke';
        case 'version':
          return pkg.version ?? '0.0.0';
        case 'match':
          return meta.match.join('\n// @match        ');
        case 'grant':
          return meta.grant?.join('\n// @grant        ') ?? 'none';
        case 'source':
          return source;
        default:
          return match;
      }
    });

    const finalFile = `${snakeCase(pkg.name)}.user.js`;
    const outFile = posix.resolve(OUTPUT_DIR, finalFile);
    await writeFile(outFile, userScript.trim(), 'utf8');
    console.log(`Success: ${finalFile}`);
  }

  console.log('All builds successfully.');
}

const currentFile = posix.resolve(fileURLToPath(import.meta.url));
const entryFile = posix.resolve(process.argv[1]);

if (currentFile === entryFile) {
  main().catch(console.trace);
}
