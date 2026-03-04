import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:3001',
          changeOrigin: true,
        },
        '/supabase-functions': {
          target: `${env.VITE_SUPABASE_URL || 'https://uwwxpczsrafdrqdyrkgx.supabase.co'}/functions/v1`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase-functions/, '')
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
