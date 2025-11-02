import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // mantém o prefixo /api (se o backend expõe /api/continents etc)
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        // sem rewrite porque o backend já usa /api
        // rewrite: (p) => p, // (opcional, aqui é no-op)
      },
      // útil se quiser acessar swagger em dev via frontend
      '/docs': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
      '/docs.json': {
        target: 'http://localhost:3333',
        changeOrigin: true,
      },
    },
  },
});
