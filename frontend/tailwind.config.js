/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // Theme colors from spec/ui.yaml
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#ffffff',
        surface: '#f9fafb',
        text: '#1f2937',
        border: '#e5e7eb',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      }
    },
  },
  plugins: [],
}