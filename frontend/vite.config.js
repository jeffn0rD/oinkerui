import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from project root (one level up from frontend/)
  const env = loadEnv(mode, '../', ['NODE_', 'PYTHON_', 'FRONTEND_', 'HOST', 'VITE_']);

  const frontendPort = parseInt(env.FRONTEND_PORT || '5173', 10);
  const nodePort = parseInt(env.NODE_PORT || '3000', 10);

  return {
    plugins: [svelte()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://localhost:${nodePort}`,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});