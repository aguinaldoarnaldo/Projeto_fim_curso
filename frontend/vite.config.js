import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    // Mantém o warmup que é seguro e ajuda no carregamento
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
      ]
    },
    // Cache headers seguros
    headers: {
      'Cache-Control': 'no-store', // Evita cache agressivo no dev para prevenir erros
    }
  },
  
  // Resolve para garantir que sempre use a mesma instância do React
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': '/src'
    }
  },
  
  // Build otimizado mas seguro
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Útil para debug
  }
})
