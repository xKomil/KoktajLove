// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path'; // Import path module for resolving aliases

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Setup '@' alias to point to 'src' directory
    },
  },
  server: {
    port: 3000, // Optional: specify dev server port
    open: true,   // Optional: open browser on server start
  },
  build: {
    outDir: 'dist', // Output directory for production build
    // sourcemap: true, // Optional: generate sourcemaps for production
  },
});