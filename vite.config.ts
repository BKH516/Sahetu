import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5176,
    open: true,
    proxy: {
      '/api': {
        target: 'https://sahtee.evra-co.com',
        changeOrigin: true,
        secure: true,
        // preserve /api prefix so existing calls like /api/doctor/login work
        // if backend needs without /api, use rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console functions
        passes: 2, // Multiple passes for better minification
      },
      format: {
        comments: false, // Remove comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // Other node_modules
            return 'vendor';
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize chunk loading
    target: 'esnext',
    modulePreload: {
      polyfill: false, // Modern browsers don't need polyfill
    },
  },
})

