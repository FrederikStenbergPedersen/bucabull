import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

import { sharedOptimizeDeps, sharedResolve } from './vite.config.shared';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.jsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    resolve: sharedResolve,
    optimizeDeps: sharedOptimizeDeps,
    esbuild: {
        jsx: 'automatic',
    },
});
