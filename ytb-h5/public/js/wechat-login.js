/**
 * 微信登录相关函数
 * 这个文件提供了微信登录相关的函数，用于在wechat-callback.html中使用
 */

// 获取微信登录URL
window.getWechatLoginUrl = function(data = {}) {
  console.log('获取微信登录URL，参数:', data);

  // 明确记录是否有redirect_uri参数
  if (data && data.redirect_uri) {
    console.log('使用指定的回调URI:', data.redirect_uri);
    // 确保不要在这里进行URL编码，让后端处理
    if (data.redirect_uri.includes('%')) {
      // 如果已经包含编码字符，先解码再传递给后端
      try {
        data.redirect_uri = decodeURIComponent(data.redirect_uri);
        console.log('解码后的回调URI:', data.redirect_uri);
      } catch (e) {
        console.error('解码回调URI失败:', e);
      }
    }
  } else {
    console.log('未指定回调URI，将使用后端默认值');
    // 设置默认回调地址
    data.redirect_uri = 'https://pay.itapgo.com/app/wechat-callback.html';
  }

  // 添加时间戳和随机数，避免缓存问题
  const params = {
    ...data,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000)
  };

  console.log('最终请求参数:', params);

  // 记录当前浏览器信息，帮助调试
  console.log('浏览器信息:', navigator.userAgent);
  console.log('当前URL:', window.location.href);

  // 使用axios实例，确保不依赖require
  // 优先使用Vue3应用中的axios，如果不可用则使用兼容层
  let axiosInstance = window.axios;

  // 如果Vue3的axios不可用，尝试使用兼容层
  if (!axiosInstance && window.axiosLegacy) {
    console.log('Vue3 axios不可用，使用兼容层axiosLegacy');
    axiosInstance = window.axiosLegacy;
  }

  if (!axiosInstance) {
    console.error('无法找到可用的axios实例，请确保axios已正确加载');
    return Promise.reject(new Error('网络请求模块未加载'));
  }

  // 记录请求开始时间，用于计算请求耗时
  const startTime = Date.now();

  // 只使用Laravel RESTful API，不再尝试旧API
  return axiosInstance({
    url: '/api/mobile/v1/auth/wechat-url',
    method: 'get',
    params: params,
    timeout: 30000,  // 增加到30秒超时，避免网络波动导致超时
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(response => {
    const endTime = Date.now();

    // 检查响应是否有效
    if (!response || !response.data) {
      console.error('获取微信登录URL响应无效:', response);
      throw new Error('获取微信登录URL响应无效');
    }

    // 检查响应格式是否正确
    if (response.data.code !== 0 || !response.data.data || !response.data.data.url) {
      console.error('获取微信登录URL响应格式错误:', response.data);
      throw new Error('获取微信登录URL响应无效');
    }

    console.log(`获取微信登录URL响应，耗时: ${endTime - startTime}ms`, response.data);
    return response.data;
  }).catch(error => {
    console.error('获取微信登录URL错误:', error);

    // 记录详细错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      console.error('请求发送但未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }

    throw error;
  });
};

// 微信登录回调处理
window.wechatLoginCallback = function(data) {
  console.log('处理微信登录回调，参数:', data);

  // 确保code参数存在
  if (!data.code) {
    console.error('微信回调缺少code参数');
    return Promise.reject(new Error('微信授权失败，缺少授权码'));
  }

  // 清除可能存在的token和用户信息，确保不会带着旧数据去请求
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  localStorage.removeItem('tempUserInfo');

  // 处理可能过长的state参数
  let processedData = { ...data };
  if (processedData.state && processedData.state.length > 500) {
    console.warn('State参数过长，长度为:', processedData.state.length);

    // 尝试判断state是否为URL
    if (processedData.state.startsWith('http')) {
      // 如果是URL，尝试提取域名和路径
      try {
        const stateUrl = new URL(processedData.state);
        // 只保留域名和路径，去掉查询参数
        processedData.original_state = processedData.state;
        processedData.state = stateUrl.origin + stateUrl.pathname;
        console.log('已提取state中的URL主要部分:', processedData.state);
      } catch (e) {
        console.error('解析state URL失败:', e);
        // 如果解析失败，截取前100个字符
        processedData.original_state = processedData.state;
        processedData.state = processedData.state.substring(0, 100) + '...';
      }
    } else {
      // 如果不是URL，截取前100个字符
      processedData.original_state = processedData.state;
      processedData.state = processedData.state.substring(0, 100) + '...';
    }

    // 记录到控制台，便于调试
    console.log('原始state长度:', processedData.original_state.length);
    console.log('处理后的state:', processedData.state);
  }

  // 添加时间戳、随机数和调试信息，避免缓存问题
  const requestData = {
    ...processedData,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 1000),
    debug: true,
    client_info: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    }
  };

  console.log('微信回调最终请求参数:', requestData);

  // 记录当前浏览器信息，帮助调试
  console.log('浏览器信息:', navigator.userAgent);
  console.log('当前URL:', window.location.href);
  console.log('当前路径:', window.location.pathname);
  console.log('当前查询参数:', window.location.search);
  console.log('当前Hash:', window.location.hash);

  // 使用axios实例，确保不依赖require
  // 优先使用Vue3应用中的axios，如果不可用则使用兼容层
  let axiosInstance = window.axios;

  // 如果Vue3的axios不可用，尝试使用兼容层
  if (!axiosInstance && window.axiosLegacy) {
    console.log('Vue3 axios不可用，使用兼容层axiosLegacy');
    axiosInstance = window.axiosLegacy;
  }

  if (!axiosInstance) {
    console.error('无法找到可用的axios实例，请确保axios已正确加载');
    return Promise.reject(new Error('网络请求模块未加载'));
  }

  // 记录请求开始时间，用于计算请求耗时
  const startTime = Date.now();

  // 创建一个超时Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('请求超时，请检查网络连接')), 30000);
  });

  // 创建实际的请求Promise
  // 记录当前URL，帮助调试
  console.log('当前URL:', window.location.href);
  console.log('当前路径:', window.location.pathname);
  console.log('当前Hash:', window.location.hash);

  // 添加额外的调试信息到请求中
  requestData.debug_info = {
    current_url: window.location.href,
    pathname: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
    timestamp: new Date().toISOString()
  };

  const requestPromise = axiosInstance({
    url: '/api/mobile/v1/auth/wechat-callback',
    method: 'post',
    data: requestData,
    timeout: 60000,  // 增加到60秒超时，确保有足够时间处理
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }).then(response => {
    const endTime = Date.now();

    // 检查响应是否有效
    if (!response || !response.data) {
      console.error('微信登录回调响应无效:', response);
      throw new Error('微信登录回调响应无效');
    }

    console.log(`微信登录回调响应，耗时: ${endTime - startTime}ms`, response.data);

    // 检查响应状态码
    if (response.data.code !== 0) {
      console.error('微信登录回调业务错误:', response.data.message || '未知错误');
      throw new Error(response.data.message || '微信登录处理失败');
    }

    // 检查响应数据完整性
    if (!response.data.data || !response.data.data.token) {
      console.error('微信登录回调响应数据不完整:', response.data);
      throw new Error('登录响应数据不完整，请重试');
    }

    return response.data;
  }).catch(error => {
    console.error('微信登录回调错误:', error);

    // 记录详细错误信息
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);

      // 尝试提取更有用的错误信息
      let errorMessage = '服务器响应错误';
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      throw new Error(errorMessage);
    } else if (error.request) {
      console.error('请求发送但未收到响应:', error.request);
      throw new Error('服务器未响应，请检查网络连接');
    } else {
      console.error('请求配置错误:', error.message);
      throw error;
    }
  });

  // 使用Promise.race实现超时控制
  return Promise.race([requestPromise, timeoutPromise]);
};

console.log('wechat-login.js 已加载');
