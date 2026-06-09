import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // proxy /tasks ไป backend ตอน dev (กัน CORS)
    proxy: {
      '/tasks': 'http://localhost:3000',
    },
  },
});
