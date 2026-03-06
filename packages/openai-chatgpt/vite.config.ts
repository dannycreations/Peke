import preact from '@preact/preset-vite';

import { createViteConfig } from '../../scripts/vite.config';
import { name } from './package.json';

export default createViteConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: 'src/index.tsx',
    },
  },
  test: { name },
});
