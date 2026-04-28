/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
		tailwindcss(),
		react()
	],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-socket': ['socket.io-client'],
          'vendor-form': ['react-hook-form', 'zod'],
          'vendor-ui': ['react-icons'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    hmr: process.env.VITE_HMR_DISABLED === 'true'
      ? false
      : process.env.VITE_HMR_HOST
        ? {
            clientPort: 443,
            protocol: 'wss',
            host: process.env.VITE_HMR_HOST,
            path: '/__vite_hmr',
          }
        : true,
  },
  resolve: {
    alias: {
      '@cookshare/hooks': path.resolve(__dirname, './src/hooks')
    }
  },
})
