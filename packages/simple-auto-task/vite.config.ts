import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

import { createViteConfig } from '../../scripts/vite.config';
import { name } from './package.json';

export default createViteConfig({
  plugins: [tailwindcss(), preact()],
  build: {
    lib: {
      entry: 'src/index.tsx',
    },
  },
  test: { name },
});
