import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const base = env.VITE_ADMIN_BASE_URL || '/admin/';

    return {
        base,
        plugins: [
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
        ],
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            emptyOutDir: true,
            sourcemap: false,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'index.html')
                },
                output: {
                    entryFileNames: 'assets/[name].[hash].js',
                    chunkFileNames: 'assets/[name].[hash].js',
                    assetFileNames: 'assets/[name].[hash].[ext]',
                    manualChunks: {
                        'vendor-vue': ['vue', 'vue-router', 'pinia'],
                        'vendor-element': ['element-plus'],
                        'vendor-echarts': ['echarts'],
                        'vendor-utils': ['axios', 'dayjs'],
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '~': '/src',
                'vue': 'vue/dist/vue.esm-bundler.js',
            },
        },
        server: {
            port: 3000,
            proxy: {
                '/api': {
                    target: 'http://localhost:8000',
                    changeOrigin: true,
                },
            },
        },
    };
});
