/**
 * 分享工具函数
 * 用于处理应用内页面的分享功能
 */

// 是否开启调试模式 - 生产环境关闭
const DEBUG = false;

const IS_YTB_STANDALONE =
  import.meta.env.MODE === 'ytb-standalone' ||
  String(import.meta.env.VITE_YTB_STANDALONE || '').toLowerCase() === 'true';

// 共享的微信JSSDK配置缓存
const CACHE_MAX_AGE = 300000; // 配置缓存有效期5分钟
const wxConfigCache = new Map();
const buildWxCacheKey = (url, branchCode) => `${branchCode || 'default'}::${url}`;

// 全局 Promise，用于确保 JSSDK 初始化完成
let wxSdkReadyPromise = null;
let wxSdkReadyResolve = null;
let wxSdkReadyReject = null;

// 防止重复初始化的标志
let isInitializing = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// 拦截wx.config，始终禁用调试模式
(function() {
  // 安全地拦截微信SDK调试模式
  function setupWxConfigInterceptor() {
    try {
      // 检查微信对象是否存在
      if (window.wx && window.wx.config && typeof window.wx.config === 'function') {
        // 保存原始方法
        const wxConfigOriginal = window.wx.config;

        // 重写方法，强制禁用debug模式
        window.wx.config = function(options) {
          try {
            if (options) {
              // 强制关闭调试模式
              options.debug = false;
            }
            // 调用原始方法
            return wxConfigOriginal.call(window.wx, options);
          } catch (error) {
            console.error('[分享组件] 执行wx.config时发生错误:', error);
            // 尝试以原始方式调用
            return wxConfigOriginal.call(window.wx, options);
          }
        };

        return true;
      }
      return false;
    } catch (error) {
      console.error('[分享组件] 拦截wx.config时发生错误:', error);
      return false;
    }
  }

  // 尝试直接拦截
  if (!setupWxConfigInterceptor()) {
    // 如果不成功，通过轮询监视wx对象加载
    const checkWxInterval = setInterval(() => {
      if (setupWxConfigInterceptor()) {
        clearInterval(checkWxInterval);
      }
    }, 100);

    // 最多检查10秒
    setTimeout(() => clearInterval(checkWxInterval), 10000);
  }
})();

// 调试日志
const log = (message, ...args) => {
  // 生产环境完全关闭日志输出
};

// 错误日志 - 保留错误日志输出用于调试
const errorLog = (message, ...args) => {
  console.error(`[分享组件] ${message}`, ...args);
};

/**
 * 获取网站默认图标URL
 * @returns {string} 图标URL
 */
const getDefaultLogo = () => {
  // 使用美团合作专用分享logo，确保在微信白色背景下清晰可见
  // 添加版本号参数，主动刷新各端缓存
  return 'https://pay.itapgo.com/app/images/logos_meituan.png?v=20251101';
};

/**
 * 获取默认副标题
 * @returns {string} 默认副标题
 */
const getDefaultSubtitle = () => {
  return '2025年11月全面启航，抢占先机！';
};

/**
 * 检查是否在微信环境
 * @returns {boolean} 是否在微信环境
 */
export const isWechatBrowser = () => {
  const isWx = /MicroMessenger/i.test(navigator.userAgent);
  log(`当前浏览器${isWx ? '是' : '不是'}微信环境`);
  return isWx;
};

/**
 * 设置页面的分享元数据
 * @param {Object} options 分享选项
 * @param {string} options.title 分享标题
 * @param {string} options.subtitle 分享副标题，不提供则使用默认副标题
 * @param {string} options.logo 分享Logo URL，不提供则使用站点默认logo
 * @param {string} options.url 分享URL，默认为当前页面URL
 * @param {string} options.branchCode 分支机构代码（可选）
 */
export const setShareMetadata = (options = {}) => {
  // 捕获所有可能的错误，确保不会影响页面正常功能
  try {
    const title = options.title || document.title || '点点够APP';
    const subtitle = options.subtitle || getDefaultSubtitle();
    const logo = options.logo || getDefaultLogo();
    const url = options.url || window.location.href;

    log('设置分享元数据:', {title, subtitle, logo, url});

    try {
      // 设置OpenGraph标签
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', title);

      let ogDescription = document.querySelector('meta[property="og:description"]');
      if (!ogDescription) {
        ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescription);
      }
      ogDescription.setAttribute('content', subtitle);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', logo);

      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', url);

      // 设置Twitter卡片标签
      let twitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCard) {
        twitterCard = document.createElement('meta');
        twitterCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCard);
      }
      twitterCard.setAttribute('content', 'summary_large_image');

      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', title);

      let twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescription) {
        twitterDescription = document.createElement('meta');
        twitterDescription.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescription);
      }
      twitterDescription.setAttribute('content', subtitle);

      let twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('name', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', logo);

      // 更新页面标题
      document.title = title;
    } catch (metaError) {
      errorLog('设置页面元数据时出错:', metaError);
      // 继续处理微信分享，不影响后续操作
    }

    // 在微信环境中，尝试配置微信分享，但不阻塞主流程
    if (isWechatBrowser() && !IS_YTB_STANDALONE) {
      // 异步处理微信分享，避免阻塞
      setTimeout(() => {
        try {
          initWechatSDK(options.branchCode)
            .then(() => {
              configWechatShare({
                title: title,
                desc: subtitle,
                link: url,
                imgUrl: logo,
                branchCode: options.branchCode
              });
            })
            .catch(error => {
              // 静默处理微信SDK错误，不影响页面功能
              log('微信SDK初始化失败，但不影响页面功能:', error);
            });
        } catch (error) {
          // 静默处理所有微信相关错误
          log('微信分享配置失败，但不影响页面功能:', error);
        }
      }, 100);
    } else if (isWechatBrowser() && IS_YTB_STANDALONE) {
      log('YTB standalone 模式下跳过微信 JSSDK 远程配置');
    }
  } catch (error) {
    errorLog('setShareMetadata 函数执行出错:', error);
    // 记录错误但不抛出，确保不会影响页面其他功能
  }
};

/**
 * 初始化微信JSSDK，返回一个Promise
 * @param {string} branchCode 分支机构代码（可选）
 * @returns {Promise<void>}
 */
export const initWechatSDK = (branchCode = null) => {
  // 防止重复初始化
  if (isInitializing) {
    return wxSdkReadyPromise || Promise.reject(new Error('正在初始化中'));
  }

  // 检查初始化次数限制
  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    return Promise.reject(new Error('微信SDK初始化次数超限'));
  }

  // 全局对象记录微信初始化状态
  if (!window.wechatShareState) {
    window.wechatShareState = {
      initialized: false,
      ready: false,
      configuring: false,
      lastError: null,
      lastConfig: null
    };
  }

  // 如果 Promise 已存在且状态正常，则直接返回
  if (wxSdkReadyPromise && window.wechatShareState.ready) {
    log('微信 SDK 已初始化完成，直接返回');
    return wxSdkReadyPromise;
  }

  // 如果不在微信环境中，则直接 reject
  if (!isWechatBrowser()) {
    log('非微信环境，不初始化微信 JSSDK');
    return Promise.reject(new Error('非微信环境'));
  }

  isInitializing = true;
  initializationAttempts++;

  // 创建新的 Promise
  wxSdkReadyPromise = new Promise((resolve, reject) => {
    wxSdkReadyResolve = resolve;
    wxSdkReadyReject = reject;

    // 设置总体超时
    const globalTimeout = setTimeout(() => {
      isInitializing = false;
      if (wxSdkReadyReject) {
        wxSdkReadyReject(new Error('微信SDK初始化总体超时'));
        // 清理状态
        wxSdkReadyPromise = null;
        wxSdkReadyResolve = null;
        wxSdkReadyReject = null;
      }
    }, 15000); // 15秒总超时

    try {
      // 动态加载微信 JSSDK 脚本
      loadWechatScript(() => {
        // 脚本加载成功后，获取配置并进行 config
        try {
          fetchWxConfig((config) => {
            if (config) {
              try {
                configWx(config);
              } catch (configError) {
                clearTimeout(globalTimeout);
                isInitializing = false;
                errorLog('调用wx.config时发生错误:', configError);
                if (wxSdkReadyReject) {
                  wxSdkReadyReject(configError);
                  wxSdkReadyPromise = null;
                  wxSdkReadyResolve = null;
                  wxSdkReadyReject = null;
                }
              }
            } else {
              clearTimeout(globalTimeout);
              isInitializing = false;
              errorLog('获取微信配置失败');
              if (wxSdkReadyReject) {
                wxSdkReadyReject(new Error('获取微信配置失败'));
                wxSdkReadyPromise = null;
                wxSdkReadyResolve = null;
                wxSdkReadyReject = null;
              }
            }
          }, branchCode);
        } catch (fetchError) {
          clearTimeout(globalTimeout);
          isInitializing = false;
          errorLog('获取微信配置时发生错误:', fetchError);
          if (wxSdkReadyReject) {
            wxSdkReadyReject(fetchError);
            wxSdkReadyPromise = null;
            wxSdkReadyResolve = null;
            wxSdkReadyReject = null;
          }
        }
      }, (error) => {
        clearTimeout(globalTimeout);
        isInitializing = false;
        errorLog('微信 JSSDK 脚本加载失败:', error);
        if (wxSdkReadyReject) {
          wxSdkReadyReject(new Error('微信 JSSDK 脚本加载失败'));
          wxSdkReadyPromise = null;
          wxSdkReadyResolve = null;
          wxSdkReadyReject = null;
        }
      });
    } catch (error) {
      clearTimeout(globalTimeout);
      isInitializing = false;
      errorLog('初始化微信JSSDK时发生未捕获的错误:', error);
      if (wxSdkReadyReject) {
        wxSdkReadyReject(error);
        wxSdkReadyPromise = null;
        wxSdkReadyResolve = null;
        wxSdkReadyReject = null;
      }
    }
  });

  return wxSdkReadyPromise;
};

/**
 * 动态加载微信 JSSDK 脚本
 * @param {Function} onLoad 脚本加载成功回调
 * @param {Function} onError 脚本加载失败回调
 */
function loadWechatScript(onLoad, onError) {
  const scriptUrl = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
  
  // 检查脚本是否已存在
  if (document.querySelector(`script[src="${scriptUrl}"]`)) {
    log('微信 JSSDK 脚本已存在');
    if (window.wx) {
      onLoad();
    } else {
      // 等待wx对象加载
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;
        if (window.wx) {
          clearInterval(checkInterval);
          onLoad();
        } else if (checkCount > 50) { // 5秒后放弃
          clearInterval(checkInterval);
          onError(new Error('wx对象加载超时'));
        }
      }, 100);
    }
    return;
  }

  log('开始动态加载微信 JSSDK 脚本:', scriptUrl);
  const script = document.createElement('script');
  script.src = scriptUrl;
  script.async = true;
  script.onload = () => {
    // 等待wx对象完全加载
    if (window.wx) {
      onLoad();
    } else {
      setTimeout(() => {
        if (window.wx) {
          onLoad();
        } else {
          onError(new Error('wx对象未定义'));
        }
      }, 500);
    }
  };
  script.onerror = () => {
    errorLog('加载 JSSDK 脚本失败:', scriptUrl);
    onError(new Error(`加载 JSSDK 脚本失败: ${scriptUrl}`));
  };
  document.body.appendChild(script);
}

/**
 * 从服务器获取微信 JSSDK 配置信息
 * @param {Function} callback 获取成功后的回调，传入配置对象或 null
 */
function fetchWxConfig(callback, branchCode = null) {
  if (IS_YTB_STANDALONE) {
    callback(null);
    return;
  }

  const currentTime = Date.now();

  // 使用当前页面的完整URL进行签名（保留查询参数，移除 hash）
  let currentUrl = window.location.href.split('#')[0];
  const cacheKey = buildWxCacheKey(currentUrl, branchCode);
  const cachedEntry = wxConfigCache.get(cacheKey);
  if (cachedEntry && (currentTime - cachedEntry.timestamp) < CACHE_MAX_AGE) {
    log('使用缓存的微信配置');
    callback(cachedEntry.config);
    return;
  }
  
  // 微信JSSDK签名必须使用用户实际访问的URL
  // 不能随意修改URL，否则签名会失败
  log('当前页面URL用于签名:', currentUrl);

  // 基础URL
  const baseUrl = window.location.origin;

  // 构建API路径
  let apiUrl;
  if (branchCode) {
    // 使用分支机构微信配置API
    apiUrl = `${baseUrl}/Tapp/admin/api/branch/wechat/jsconfig?url=${encodeURIComponent(currentUrl)}&branch_code=${encodeURIComponent(branchCode)}&t=${currentTime}`;
  } else {
    // 使用默认微信配置API
    apiUrl = `${baseUrl}/Tapp/admin/api/wechat/jsconfig.php?url=${encodeURIComponent(currentUrl)}&t=${currentTime}`;
  }

  log('请求微信配置:', apiUrl);

  // 使用fetch请求，添加超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

  fetch(apiUrl, {
    signal: controller.signal,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.text();
    })
    .then(text => {
      // 检查返回内容
      if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('API返回HTML页面，可能需要登录');
      }

      // 尝试解析为JSON
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new Error(`解析JSON失败: ${error.message}`);
      }
    })
    .then(data => {
      log('获取到微信配置数据:', data);

      if (data) {
        if (data.code === 0 && data.data) {
          // 兼容旧格式
          wxConfigCache.set(cacheKey, {
            config: data.data,
            timestamp: currentTime
          });
          callback(data.data);
        } else if (data.appId && data.timestamp && (data.nonceStr || data.nonce_str) && data.signature) {
          // 标准格式 - 兼容不同的字段名
          if (data.nonce_str && !data.nonceStr) {
            data.nonceStr = data.nonce_str;
          }
          wxConfigCache.set(cacheKey, {
            config: data,
            timestamp: currentTime
          });
          callback(data);
        } else {
          const errorMsg = (data && data.message) ? data.message : '返回数据格式错误';
          log('微信配置数据格式错误:', errorMsg);
          callback(null);
        }
      } else {
        log('微信配置数据为空');
        callback(null);
      }
    })
    .catch(error => {
      clearTimeout(timeoutId);
      errorLog('请求微信配置接口出错:', error);
      
      // 清除缓存
      wxConfigCache.delete(cacheKey);
      
      callback(null);
    });
}

/**
 * 调用 wx.config 配置 JSSDK
 * @param {Object} config JSSDK 配置对象
 */
function configWx(config) {
  if (!window.wx) {
    errorLog('wx 对象未定义，无法执行 wx.config');
    if (wxSdkReadyReject) {
      wxSdkReadyReject(new Error('wx 对象未定义'));
      isInitializing = false;
    }
    return;
  }

  try {
    // 更新微信分享状态
    if (window.wechatShareState) {
      window.wechatShareState.configuring = true;
      window.wechatShareState.lastConfig = config;
    }

    // 配置 wx.config
    window.wx.config({
      debug: DEBUG, // 调试模式根据DEBUG变量决定
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: config.jsApiList || [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareTimeline',
        'onMenuShareAppMessage'
      ],
      openTagList: config.openTagList || []
    });

    // 处理 wx.ready
    window.wx.ready(() => {
      log('微信 JSSDK wx.ready 触发');
      isInitializing = false;

      // 更新微信分享状态
      if (window.wechatShareState) {
        window.wechatShareState.initialized = true;
        window.wechatShareState.configuring = false;
        window.wechatShareState.ready = true;
      }

      // 初始化成功，resolve Promise
      if (wxSdkReadyResolve) {
        wxSdkReadyResolve();
        wxSdkReadyResolve = null;
        wxSdkReadyReject = null;
      }
    });

    // 处理 wx.error
    window.wx.error((res) => {
      errorLog('微信 JSSDK wx.error 触发:', res);
      isInitializing = false;

      // 更新微信分享状态
      if (window.wechatShareState) {
        window.wechatShareState.configuring = false;
        window.wechatShareState.ready = false;
        window.wechatShareState.lastError = res;
      }

      // 初始化失败，reject Promise
      if (wxSdkReadyReject) {
        wxSdkReadyReject(new Error('微信SDK配置失败'));
        wxSdkReadyPromise = null;
        wxSdkReadyResolve = null;
        wxSdkReadyReject = null;
      }
      
      // 清除缓存的配置
      wxConfigCache.clear();
    });
  } catch (error) {
    isInitializing = false;
    errorLog('执行wx.config时发生错误:', error);
    if (wxSdkReadyReject) {
      wxSdkReadyReject(error);
      wxSdkReadyPromise = null;
      wxSdkReadyResolve = null;
      wxSdkReadyReject = null;
    }
    
    // 清除缓存的配置
    wxConfigCache.clear();
  }
}

/**
 * 配置微信分享内容 (好友和朋友圈)
 * @param {Object} options 分享选项
 * @param {string} options.title 分享标题
 * @param {string} options.desc 分享描述
 * @param {string} options.link 分享链接
 * @param {string} options.imgUrl 分享图标URL
 */
export const configWechatShare = (options = {}) => {
  // 确保在微信环境且 wx 对象存在
  if (!isWechatBrowser() || !window.wx) {
    log('非微信环境或 wx 对象不存在，跳过分享配置');
    return;
  }

  // 验证 wx 对象和所需方法是否存在
  if (typeof window.wx.ready !== 'function') {
    log('wx.ready 方法不存在，跳过分享配置');
    return;
  }

  log('准备配置微信分享内容:', options);

  // 使用 wx.ready 确保配置在 SDK 准备好后执行
  window.wx.ready(() => {
    try {
      log('wx.ready 回调内：开始设置分享内容');

      // 更新微信分享状态
      if (window.wechatShareState) {
        window.wechatShareState.ready = true;
      }

      const shareOptions = {
        title: options.title || document.title || '点点够',
        desc: options.desc || getDefaultSubtitle(),
        link: options.link || window.location.href,
        imgUrl: options.imgUrl || getDefaultLogo(),
        success: function () {
          log('分享接口调用成功');
          if (window.wechatShareState) {
            window.wechatShareState.lastError = null;
          }
        },
        fail: function (err) {
          log('分享接口调用失败:', err);
          if (window.wechatShareState) {
            window.wechatShareState.lastError = err;
          }
        },
        cancel: function () {
          log('用户取消分享');
        }
      };

      // 验证并修正分享链接
      if (shareOptions.link && !shareOptions.link.startsWith('http')) {
        const baseUrl = window.location.origin;
        if (shareOptions.link.startsWith('/')) {
          shareOptions.link = baseUrl + shareOptions.link;
        } else {
          shareOptions.link = baseUrl + '/' + shareOptions.link;
        }
      }

      // 设置分享给朋友 (新接口) - 添加错误处理
      if (window.wx.updateAppMessageShareData && typeof window.wx.updateAppMessageShareData === 'function') {
        try {
          log('调用 updateAppMessageShareData');
          window.wx.updateAppMessageShareData(shareOptions);
        } catch (error) {
          errorLog('调用 updateAppMessageShareData 失败:', error);
          // 静默处理错误，不影响页面功能
        }
      }

      // 设置分享到朋友圈 (新接口) - 添加错误处理
      if (window.wx.updateTimelineShareData && typeof window.wx.updateTimelineShareData === 'function') {
        try {
          log('调用 updateTimelineShareData');
          window.wx.updateTimelineShareData({
            title: shareOptions.title,
            link: shareOptions.link,
            imgUrl: shareOptions.imgUrl,
            success: shareOptions.success,
            fail: shareOptions.fail,
            cancel: shareOptions.cancel
          });
        } catch (error) {
          errorLog('调用 updateTimelineShareData 失败:', error);
          // 静默处理错误，不影响页面功能
        }
      }

      // 兼容旧版 API - 添加错误处理
      if (window.wx.onMenuShareAppMessage && typeof window.wx.onMenuShareAppMessage === 'function') {
        try {
          log('调用 onMenuShareAppMessage (兼容旧版)');
          window.wx.onMenuShareAppMessage(shareOptions);
        } catch (error) {
          errorLog('调用 onMenuShareAppMessage 失败:', error);
          // 静默处理错误，不影响页面功能
        }
      }

      if (window.wx.onMenuShareTimeline && typeof window.wx.onMenuShareTimeline === 'function') {
        try {
          log('调用 onMenuShareTimeline (兼容旧版)');
          window.wx.onMenuShareTimeline({
            title: shareOptions.title,
            link: shareOptions.link,
            imgUrl: shareOptions.imgUrl,
            success: shareOptions.success,
            fail: shareOptions.fail,
            cancel: shareOptions.cancel
          });
        } catch (error) {
          errorLog('调用 onMenuShareTimeline 失败:', error);
          // 静默处理错误，不影响页面功能
        }
      }

      log('微信分享内容已配置');
    } catch (error) {
      errorLog('配置微信分享时发生错误:', error);
    }
  });
};

/**
 * 直接向微信分享内容
 * @param {Object} options 分享选项
 */
export const shareToWechat = (options = {}) => {
  log('向微信分享内容:', options);

  if (!isWechatBrowser()) {
    log('非微信环境，无法直接分享');
    return;
  }

  const shareOptions = {
    title: options.title || document.title,
    desc: options.subtitle || options.desc || getDefaultSubtitle(),
    imgUrl: options.logo || options.imgUrl || getDefaultLogo(),
    link: options.url || window.location.href
  };

  configWechatShare(shareOptions);
};

/**
 * 分享链接（复制到剪贴板）
 * @param {string} url 要分享的URL
 * @param {Function} callback 分享完成的回调
 */
export const shareLink = (url, callback) => {
  const shareUrl = url || window.location.href;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        if (callback && typeof callback === 'function') {
          callback(true);
        }
      })
      .catch(() => {
        // 回退到传统方法
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = 0;
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        try {
          document.execCommand('copy');
          if (callback && typeof callback === 'function') {
            callback(true);
          }
        } catch (err) {
          if (callback && typeof callback === 'function') {
            callback(false);
          }
        }

        document.body.removeChild(textarea);
      });
  } else {
    // 传统方法
    const textarea = document.createElement('textarea');
    textarea.value = shareUrl;
    textarea.style.position = 'fixed';
    textarea.style.opacity = 0;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      document.execCommand('copy');
      if (callback && typeof callback === 'function') {
        callback(true);
      }
    } catch (err) {
      if (callback && typeof callback === 'function') {
        callback(false);
      }
    }

    document.body.removeChild(textarea);
  }
};

/**
 * 设置微信分享 - 简化版API
 */
export const setupWechatShare = configWechatShare;

export default {
  setShareMetadata,
  shareToWechat,
  shareLink,
  getDefaultLogo,
  getDefaultSubtitle,
  initWechatSDK,
  configWechatShare,
  isWechatBrowser,
  setupWechatShare
};
