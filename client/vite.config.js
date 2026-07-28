import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite 8 (Rolldown) can't resolve recharts' peer dep react-is automatically
  optimizeDeps: {
    include: ['react-is'],
  },
  build: {
    rolldownOptions: {
      external: [],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    css: false,
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000/api',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/**/__tests__/**',
        'src/styles/**',
      ],
      thresholds: {
        lines: 18,
        functions: 13,
        branches: 14,
      },
    },
  },
})
