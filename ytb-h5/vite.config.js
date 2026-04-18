import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
  // 公共路径配置
  base: env.VITE_APP_BASE || '/app/',
  
  // 插件配置
  plugins: [
    vue(),
    legacy({
      targets: [
        'ios >= 12',
        'chrome >= 64',
        'safari >= 12',
        'android >= 8'
      ],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: false,
      renderLegacyChunks: true
    }),
    // 自动导入Vant组件
    Components({
      resolvers: [VantResolver()],
      // 配置文件生成位置
      dts: 'src/components.d.ts',
    }),
  ],
  
  // 解析配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vant/es/composables/use-globalThis-z-index.mjs': 'vant/es/composables/use-global-z-index.mjs',
      'vant/es/composables/use-globalThis-z-index': 'vant/es/composables/use-global-z-index.mjs',
      'axios/lib/utils.js': path.resolve(__dirname, 'node_modules/axios/lib/utils.js'),
    },
  },
  
  // 全局变量定义
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  
  // 构建配置
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 启用代码分割，但简化配置
    cssCodeSplit: true,
    
    // 配置输出文件名格式
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 简化代码分割配置
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      },
    },
    
    // 设置构建目标浏览器
    target: 'es2015',
    
    // 设置chunk大小警告阈值
    chunkSizeWarningLimit: 1000,

    // 使用 esbuild 进行压缩，避免 Terser 引入的类初始化顺序问题
    minify: 'esbuild',
    esbuild: {
      drop: ['debugger'],
    },
  },
  
  // 服务器配置
  server: {
    // 配置代理
    proxy: {
      '/admin/api': {
        target: 'https://pay.itapgo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin\/api/, '/admin/api'),
      },
    },
    // 热更新配置
    hmr: {
      overlay: false,
    },
  },
  }
})
