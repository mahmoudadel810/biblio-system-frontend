import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // A production bundle without an API address would call localhost in users' browsers. Fail the build instead.
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL) {
    throw new Error('VITE_API_URL is not set. Set it to the API origin before building for production.');
  }
  return {
    plugins: [react()],
    server: { port: 5173 },
  };
});
