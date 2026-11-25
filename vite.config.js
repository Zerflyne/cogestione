import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'node:path';

// Due pagine nello stesso build:
//   /             il sito dei rappresentanti (src/sito)
//   /cogestione/  l'app della cogestione (src/pagine, src/lib), anche dentro l'app Tauri.
// base './' fa funzionare gli stessi file con qualsiasi dominio e dentro Tauri.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        sito: resolve(import.meta.dirname, 'index.html'),
        cogestione: resolve(import.meta.dirname, 'cogestione/index.html'),
      },
    },
  },
});
