import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseUrl = (env.VITE_API_BASE_URL ?? 'http://localhost:3010').trim().replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5183,
    },
    define: {
      __APP_API_BASE_URL__: JSON.stringify(baseUrl),
    },
  };
});
