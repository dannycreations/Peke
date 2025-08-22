import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

import { createViteConfig } from '../../scripts/vite.config';
import { name } from './package.json';

export default createViteConfig({
  plugins: [tailwindcss(), react()],
  build: {
    lib: {
      entry: 'src/index.tsx',
    },
  },
  test: { name },
});
