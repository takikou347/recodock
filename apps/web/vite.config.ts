import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // shadcn/ui の慣習に合わせた `@/` エイリアス(ADR-0008)
    alias: { '@': new URL('./src/', import.meta.url).pathname },
  },
});
