import { createViteConfig } from '../../scripts/vite.config';
import { name } from './package.json';

export default createViteConfig({ test: { name } });
