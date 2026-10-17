import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174,
    host: '0.0.0.0',
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
