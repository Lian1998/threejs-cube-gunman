import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/',
    mode: 'development',
    root: path.resolve(__dirname, './multi_pages/'),
    publicDir: path.resolve(__dirname, './public/'),
    cacheDir: path.resolve(__dirname, './.vite/'),
    assetsInclude: ['*.vert', '*.frag', '*.glsl'],
    build: {
        outDir: path.resolve(__dirname, './.vite/dist/'),
        target: 'esnext',
        assetsDir: path.resolve(__dirname, './assets/'),
        sourcemap: true,
        emptyOutDir: true,
        minify: false,
        assetsInlineLimit: 40960,
        rollupOptions: {
            input: {
                game: path.resolve(__dirname, './multi_pages/game/index.html')
            },
            output: {
                manualChunks: {}, // https://router.vuejs.org/zh/guide/advanced/lazy-loading.html#%E4%BD%BF%E7%94%A8-vite
            }
        }
    },
    resolve: {
        mainFields: ['module', 'jsnext:main', 'jsnext'],
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
        alias: {
            '@src': path.resolve(__dirname, './src/'),
            '@assets': path.resolve(__dirname, './assets/'),
            '@gameplay': path.resolve(__dirname, './src/gameplay/')
        }
    },
    plugins: [vue(), vueJsx()],
    envDir: path.resolve(__dirname, './vite_envs/'),
    envPrefix: 'VITE_',

    css: {
        modules: {
            generateScopedName: "[local]_[hash:base64:5]",
            hashPrefix: "prefix",
            localsConvention: "dashes",
        },
        preprocessorOptions: {
            scss: {
                charset: false,
            }
        }
    }
})
