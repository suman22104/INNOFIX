import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: { drop: ["console", "debugger"] },
  server: {
    port: 3000,
    allowedHosts: ['.ngrok-free.dev','.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    proxy: {
      '/api': {target: 'http://127.0.0.1:5000', changeOrigin: true },
      '/uploads': {target: 'http://127.0.0.1:5000', changeOrigin: true},
      './socket.io': {target: 'http://127.0.0.1:5000', changeOrigin: true, ws: true},
    },
  },
});
