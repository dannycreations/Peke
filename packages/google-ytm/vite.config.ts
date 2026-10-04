import { createViteConfig } from '../../scripts/vite.config';
import { name } from './package.json' with { type: 'json' };

export default createViteConfig({ test: { name } });
