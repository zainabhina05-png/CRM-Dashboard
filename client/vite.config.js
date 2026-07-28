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
})
