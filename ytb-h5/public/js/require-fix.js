/**
 * 修复require未定义的问题
 * 这个脚本提供了一个简单的require函数实现，用于解决微信回调页面中的"require is not defined"错误
 */

// 确保window对象存在
if (typeof window === 'undefined') {
  console.warn('window对象未定义，创建一个空对象');
  var window = {};
}

// 如果window.require不存在，则创建一个简单的实现
if (typeof window.require !== 'function') {
  console.log('检测到require未定义，创建兼容实现');

  // 创建一个简单的模块缓存
  const moduleCache = {};

  // 定义一个简单的require函数
  window.require = function(moduleName) {
    try {
      // 检查缓存
      if (moduleCache[moduleName]) {
        return moduleCache[moduleName].exports;
      }

      // 创建一个新模块
      const module = {
        exports: {}
      };

      // 将模块添加到缓存
      moduleCache[moduleName] = module;

      console.log(`尝试加载模块: ${moduleName}`);

      // 对于常见的模块，提供一个简单的实现
      if (moduleName === 'axios') {
        // 优先使用Vue3应用中的axios，如果不可用则使用兼容层
        if (window.axios) {
          module.exports = window.axios;
        } else if (window.axiosLegacy) {
          console.log(`模块 ${moduleName} 使用兼容层axiosLegacy`);
          module.exports = window.axiosLegacy;
        } else {
          console.warn(`模块 ${moduleName} 未找到，创建模拟实现`);
          // 创建一个模拟的axios实现
          module.exports = {
            get: function(url, config) { 
              return Promise.resolve({ data: {} }); 
            },
            post: function(url, data, config) { 
              return Promise.resolve({ data: {} }); 
            },
            put: function(url, data, config) { 
              return Promise.resolve({ data: {} }); 
            },
            delete: function(url, config) { 
              return Promise.resolve({ data: {} }); 
            },
            create: function(config) { 
              // 确保创建的实例有默认的method处理
              const instance = module.exports;
              instance.interceptors = {
                request: { use: function() {} },
                response: { use: function() {} }
              };
              instance.defaults = config || {};
              return instance;
            },
            interceptors: {
              request: { use: function() {} },
              response: { use: function() {} }
            },
            defaults: {}
          };
        }
      } else if (moduleName === 'vue') {
        // 提供一个简单的Vue模拟
        module.exports = {
          createApp: function() {
            return {
              mount: function() {},
              use: function() { return this; }
            };
          },
          reactive: function(obj) { return obj; },
          ref: function(val) { return { value: val }; }
        };
      } else {
        // 对于其他模块，返回一个空对象
        console.warn(`模块 ${moduleName} 未找到，返回空对象`);
        module.exports = {};
      }

      return module.exports;
    } catch (error) {
      console.error(`加载模块 ${moduleName} 时出错:`, error);
      return {};
    }
  };

  // 添加require.ensure方法（用于代码分割）
  window.require.ensure = function(dependencies, callback) {
    try {
      // 简单实现，直接调用回调
      callback(window.require);
    } catch (error) {
      console.error('require.ensure执行出错:', error);
    }
  };
}

// 确保window.location对象的关键属性存在
try {
  if (window.location) {
    if (!window.location.protocol) {
      Object.defineProperty(window.location, 'protocol', {
        get: function() { return 'https:'; }
      });
    }

    if (!window.location.host) {
      Object.defineProperty(window.location, 'host', {
        get: function() { return 'pay.itapgo.com'; }
      });
    }

    if (!window.location.origin) {
      const protocol = window.location.protocol || 'https:';
      const host = window.location.host || 'pay.itapgo.com';
      Object.defineProperty(window.location, 'origin', {
        get: function() { return protocol + '//' + host; }
      });
    }
  }
} catch (error) {
  console.error('设置window.location属性时出错:', error);
}

console.log('require-fix.js 已加载，版本: 1.1.0');
