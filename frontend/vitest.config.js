import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    },
    // Required for Svelte 5 to use client-side code in tests
    alias: [
      { find: /^svelte$/, replacement: 'svelte' }
    ]
  },
  resolve: {
    // Ensure browser conditions are used for Svelte 5
    conditions: ['browser']
  }
});