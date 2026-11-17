import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Test-only configuration: resolves the "@/" alias used across src/.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node' },
});
