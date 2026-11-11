import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// base './' fa funzionare lo stesso build su GitHub Pages (sotto /cogestione/) e dentro l'app Tauri.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: { target: 'es2022' },
});
