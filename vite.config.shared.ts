/**
 * Plugin/resolve wiring used by the app's vite.config.ts. The same values
 * are hand-duplicated in packages/ui/.storybook/main.ts — a cross-workspace
 * dynamic import of this file doesn't resolve reliably through Storybook's
 * Node ESM config loader, so keep both in sync manually if these change.
 */
export const sharedResolve = {
    dedupe: ['react', 'react-dom'],
};

export const sharedOptimizeDeps = {
    // the workspace package has no build output — let Vite transpile its
    // TSX source directly rather than treating it as an opaque pre-bundled dep
    exclude: ['@bucabull/ui'],
};
