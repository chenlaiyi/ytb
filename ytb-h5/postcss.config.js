export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 375, // 设计稿的视口宽度
      unitPrecision: 5, // 单位转换后保留的精度
      viewportUnit: 'vw', // 希望使用的视口单位
      selectorBlackList: ['.ignore', '.hairlines'], // 不转换的类名
      minPixelValue: 1, // 小于或等于`1px`不转换为视口单位
      mediaQuery: false, // 允许在媒体查询中转换`px`
      exclude: [/node_modules\/vant/i], // 忽略vant组件库
    },
  },
}; 