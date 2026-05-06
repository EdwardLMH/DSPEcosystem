import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3002,
    proxy: {
      // /ucp-api → UCP (localhost:3001) /api — for content-assets, components, etc.
      '/ucp-api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ucp-api/, '/api'),
      },
      // /media → UCP (localhost:3001) /media — images and videos served from ucp-console/public/media
      '/media': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
