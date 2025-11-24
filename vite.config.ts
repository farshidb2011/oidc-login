import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'OidcLoginPlugin',
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
            formats: ['es', 'cjs']
        },
        rollupOptions: {
            external: ['vue', 'vue-router', 'pinia', 'axios', 'oidc-client-ts'],
            output: {
                globals: {
                    vue: 'Vue',
                    'vue-router': 'VueRouter',
                    pinia: 'Pinia',
                    axios: 'axios',
                    'oidc-client-ts': 'OidcClientTs'
                }
            }
        }
    }
});
