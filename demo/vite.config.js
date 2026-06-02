import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mcp-consent/core': resolve(__dirname, '../packages/consent-core/src/index.js'),
      '@mcp-consent/react': resolve(__dirname, '../packages/consent-react/index.jsx'),
    },
  },
});
