import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    external: ['vue', 'vue-router', 'pinia', 'axios', 'oidc-client-ts'],
    esbuildOptions(options) {
        options.loader = {
            ...options.loader,
            '.vue': 'text',
        };
    },
});
