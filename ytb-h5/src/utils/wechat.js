import { showToast } from 'vant';
import request from '@/utils/request'; // 引入封装的 request

const WECHAT_SHARING_DEBUG = false;

/**
 * 获取微信授权信息
 * @returns {Promise<Object|null>} 微信用户信息
 */
export async function getWechatInfo() {
  try {
    // 检查本地存储是否已有用户信息
    const storedInfo = localStorage.getItem('wechat_user_info');
    if (storedInfo) {
      return JSON.parse(storedInfo);
    }

    // 尝试获取微信配置信息（忽略失败，授权流程仍可继续）
    try {
      const configResponse = await request.get('/api/mobile/v1/auth/wechat-config');
      if (configResponse.code !== 0 || !configResponse.data) {
        console.warn('获取微信配置失败:', configResponse.message);
      }
    } catch (configError) {
      console.warn('微信配置接口调用异常，忽略继续流程:', configError?.message || configError);
    }

    // 检查当前URL是否包含微信授权码
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // 有授权码，直接调用微信回调API
      const callbackResponse = await request.post('/api/mobile/v1/auth/wechat-callback', { code });
      if (callbackResponse.code === 0 && callbackResponse.data) {
        // 保存用户信息到本地存储
        localStorage.setItem('wechat_user_info', JSON.stringify(callbackResponse.data));
        return callbackResponse.data;
      }
    } else {
      // 没有授权码，获取授权URL并重定向
      const authUrlResponse = await request.get('/api/mobile/v1/auth/wechat-url', {
        params: {
          redirect_url: window.location.href,
        }
      });
      
      if (authUrlResponse.code === 0 && authUrlResponse.data) {
        // 重定向到微信授权页面
        window.location.href = authUrlResponse.data;
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取微信用户信息失败:', error);
    return null;
  }
}

/**
 * 清除微信授权信息
 */
export function clearWechatInfo() {
  localStorage.removeItem('wechat_user_info');
}

/**
 * 检查是否在微信浏览器中
 * @returns {boolean}
 */
export function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent);
}

/**
 * 获取微信 JSSDK 配置
 * @param {string} url 当前页面的 URL (不包含 # hash)
 * @param {string} branchCode 分支机构代码（可选）
 * @returns {Promise<Object|null>} JSSDK 配置
 */
export async function getWechatConfig(url, branchCode = null) {
  if (!isWechatBrowser()) {
    console.warn('非微信环境，无需获取 JSSDK 配置');
    return null;
  }
  
  try {
    let apiUrl = '/wechat/jsconfig.php';
    let params = { url };
    
    // 如果提供了分支机构代码，使用分支机构的微信配置API
    if (branchCode) {
      // 优先使用Laravel API
      apiUrl = '/branch/wechat/jsconfig';
      params.branch_code = branchCode;
      
      console.log('使用分支机构微信配置', { branchCode, url });
    } else {
      console.log('使用默认微信配置', { url });
    }
    
    const res = await request.get(apiUrl, { params });
    
    if (res.code === 0 && res.data) {
      console.log('获取微信JSSDK配置成功', {
        branchCode,
        appId: res.data.appId,
        branch: res.data.branch || null
      });
      return res.data;
    } else {
      console.error('获取微信 JSSDK 配置失败:', res.message || '未知错误');
      
      // 如果分支机构配置失败，尝试使用默认配置
      if (branchCode) {
        console.warn('分支机构微信配置获取失败，尝试使用默认配置');
        return await getWechatConfig(url, null);
      }
      
      showToast('获取微信分享配置失败');
      return null;
    }
  } catch (error) {
    console.error('请求微信 JSSDK 配置接口异常:', error);
    
    // 如果分支机构配置异常，尝试使用默认配置
    if (branchCode) {
      console.warn('分支机构微信配置请求异常，尝试使用默认配置');
      try {
        return await getWechatConfig(url, null);
      } catch (fallbackError) {
        console.error('默认微信配置也失败:', fallbackError);
        showToast('网络错误，无法获取微信分享配置');
        return null;
      }
    }
    
    showToast('网络错误，无法获取微信分享配置');
    return null;
  }
}

/**
 * 设置微信分享内容
 * @param {object} options 分享配置
 * @param {string} options.title 分享标题
 * @param {string} options.desc 分享描述
 * @param {string} options.link 分享链接
 * @param {string} options.imgUrl 分享图标
 * @param {string} options.branchCode 分支机构代码（可选）
 */
export function setWechatShare(options) {
  if (!isWechatBrowser() || typeof wx === 'undefined') {
    console.warn('非微信环境或微信 JSSDK 未加载，无法设置分享');
    return;
  }

  // 获取当前 URL 用于 JSSDK 配置
  const { origin, pathname, search } = window.location;
  const currentUrl = `${origin}${pathname}${search || ''}`;

  // 从多个来源获取分支机构代码（如果未在options中提供）
  const branchCode = options.branchCode || localStorage.getItem('branch_code') || null;
  
  if (WECHAT_SHARING_DEBUG) {
    console.log('设置微信分享', {
      branchCode,
      title: options.title,
      currentUrl
    });
  }

  getWechatConfig(currentUrl, branchCode).then(config => {
    if (!config) return;

    wx.config({
      debug: false, // 生产环境建议关闭 debug
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: config.jsApiList || ['updateAppMessageShareData', 'updateTimelineShareData'],
      openTagList: [] // 根据需要添加开放标签列表
    });

    wx.ready(() => {
      if (WECHAT_SHARING_DEBUG) {
        console.log('微信 JSSDK 配置成功，准备设置分享内容:', options);
      }
      // 设置分享给朋友
      wx.updateAppMessageShareData({
        title: options.title,
        desc: options.desc,
        link: options.link || window.location.href, // 默认为当前页面链接
        imgUrl: options.imgUrl,
        success: function () {
          if (WECHAT_SHARING_DEBUG) {
            console.log('设置分享给朋友成功');
          }
        },
        fail: function (err) {
          console.error('设置分享给朋友失败:', err);
        }
      });

      // 设置分享到朋友圈
      wx.updateTimelineShareData({
        title: options.title, // 朋友圈通常只显示标题
        link: options.link || window.location.href,
        imgUrl: options.imgUrl,
        success: function () {
          if (WECHAT_SHARING_DEBUG) {
            console.log('设置分享到朋友圈成功');
          }
        },
        fail: function (err) {
          console.error('设置分享到朋友圈失败:', err);
        }
      });
      
      // 兼容旧版API (分享给朋友)
      wx.onMenuShareAppMessage({
        title: options.title,
        desc: options.desc,
        link: options.link || window.location.href,
        imgUrl: options.imgUrl,
        success: function () {
          if (WECHAT_SHARING_DEBUG) {
            console.log('设置旧版分享给朋友成功');
          }
        },
        fail: function (err) {
          console.error('设置旧版分享给朋友失败:', err);
        }
      });

      // 兼容旧版API (分享到朋友圈)
      wx.onMenuShareTimeline({
        title: options.title,
        link: options.link || window.location.href,
        imgUrl: options.imgUrl,
        success: function () {
          if (WECHAT_SHARING_DEBUG) {
            console.log('设置旧版分享到朋友圈成功');
          }
        },
        fail: function (err) {
          console.error('设置旧版分享到朋友圈失败:', err);
        }
      });
      
    });

    wx.error((res) => {
      console.error('微信 JSSDK 配置失败:', res);
      showToast('微信分享功能初始化失败');
    });

  }).catch(error => {
    console.error('设置微信分享过程中发生错误:', error);
  });
}
