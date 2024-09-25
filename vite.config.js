import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
    ...(process.env.NODE_ENV === 'development'
        ? {
          define: {
            global: {},
          },
        }
        : {}),
    resolve: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        ...(process.env.NODE_ENV !== 'development'
        ? {
          './runtimeConfig': './runtimeConfig.browser',
        }
        : {}),
        alias: {
        '@js': path.resolve(__dirname, 'src/js'),
        '@css': path.resolve(__dirname, 'src/css'),
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
        input: 'index.html',
        },
    },
    server: {
        open: true,
        hmr: true,
        port: 3000,
    },
    plugins: [react()],
});
