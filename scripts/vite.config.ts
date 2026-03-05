import { pascalCase } from 'es-toolkit';
import { defineConfig, loadEnv, mergeConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults } from 'vitest/config';

import { name } from '../package.json';

import type { UserConfig, UserConfigFnObject } from 'vite';

export function createViteConfig(options: UserConfig = {}): UserConfigFnObject {
  return defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return mergeConfig(
      {
        plugins: [
          tsconfigPaths(),
          checker({
            typescript: true,
            enableBuild: true,
          }),
        ],
        build: {
          lib: {
            entry: 'src/index.ts',
            name: pascalCase(name),
            formats: ['iife'],
          },
          rollupOptions: {
            output: {
              entryFileNames: 'index.js',
              inlineDynamicImports: true,
            },
          },
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              dead_code: true,
              unused: true,
            },
            format: {
              beautify: false,
              comments: false,
            },
          },
        },
        test: {
          name,
          include: ['src/**/*.{test,spec}.{ts,mts,cts}'],
          exclude: [...configDefaults.exclude],
          watch: false,
          testTimeout: 10_000,
          passWithNoTests: true,
        },
        define: {
          'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
        },
      },
      options,
    );
  });
}
