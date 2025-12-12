import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/cc-trace-viewer/', // Required for GitHub Pages subpath deployment
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      ignored: ['**/.claude-trace/**']
    }
  }
})
