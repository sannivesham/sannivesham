import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If you deploy to https://<user>.github.io/<repo>/, set base to '/<repo>/'.
// If you deploy to a custom domain or user/org page, leave it as '/'.
export default defineConfig({
  plugins: [react()],
  base: '/vidyalaya/',
})
