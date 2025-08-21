import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, mergeConfig } from 'vite';
import checker from 'vite-plugin-checker';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults } from 'vitest/config';

import { name } from '../package.json';

import type { UserConfig } from 'vite';

const baseOptions = {
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    react(),
    checker({
      typescript: true,
      enableBuild: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'Peke',
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
      compress: true,
      format: {
        beautify: false,
        comments: false,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  test: {
    name,
    include: ['src/**/*.{test,spec}.{ts,mts,cts}'],
    exclude: [...configDefaults.exclude],
    watch: false,
    testTimeout: 10_000,
    passWithNoTests: true,
  },
} satisfies UserConfig;

export function createViteConfig(options: UserConfig = {}): UserConfig {
  return defineConfig(mergeConfig(baseOptions, options));
}
