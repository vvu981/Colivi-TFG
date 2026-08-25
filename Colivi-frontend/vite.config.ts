import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // supercluster and its dependency kdbush are pure-ESM packages.
  // Without this hint Vite's pre-bundler fails to resolve them in dev mode.
  optimizeDeps: {
    include: ['supercluster', 'kdbush'],
  },
  server: {
    host: true, // necesario para que Docker exponga el puerto
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});