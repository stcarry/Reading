import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Reading/',
  server: {
    proxy: {
      '/api/aladin': {
        target: 'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aladin/, ''),
      }
    }
  }
})
