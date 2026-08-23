/// <reference types="vitest" />
import { defineConfig } from 'vite';

// Repo name; when served from https://<user>.github.io/4d-visualizer/, all
// asset URLs need this prefix. Local dev on `/` still works.
export default defineConfig({
  base: '/4d-visualizer/',
  build: {
    // Three.js is intentionally the bulk of the bundle; a bigger threshold
    // just silences the noisy warning without hiding a real problem.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
