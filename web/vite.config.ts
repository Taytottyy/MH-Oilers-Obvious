import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Project Pages site is served from /Obvious-Hackathon/ — relative asset
  // URLs would 404 without this.
  base: '/Obvious-Hackathon/',
  plugins: [react()],
  server: {
    // The data CSVs live at the repo root, one level above web/.
    fs: { allow: ['..'] },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
