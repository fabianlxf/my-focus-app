import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,      // 👈 erlaubt Zugriff von externen Hosts (ngrok, LAN usw.)
    port: 5177,      // dein Dev-Port
  },
});