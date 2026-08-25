import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-a11y', '@storybook/addon-docs'],
    framework: '@storybook/react-vite',
    async viteFinal(viteConfig) {
        const tailwindcss = (await import('@tailwindcss/vite')).default;

        return {
            ...viteConfig,
            plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
            resolve: {
                ...viteConfig.resolve,
                // kept in sync by hand with ../../../vite.config.shared.ts —
                // a cross-workspace dynamic import here doesn't resolve
                // reliably through Storybook's Node ESM config loader
                dedupe: ['react', 'react-dom'],
            },
            optimizeDeps: {
                ...viteConfig.optimizeDeps,
                exclude: ['@newapp/ui'],
            },
        };
    },
};
export default config;
