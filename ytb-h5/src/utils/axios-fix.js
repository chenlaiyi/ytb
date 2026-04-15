/**
 * Axios兼容性修复 - 必须在axios导入之前运行
 * 解决旧版微信WebView中fetch/Request/Response对象缺失的问题
 */

// 立即执行，不等待任何导入
(function() {
  // 确保 globalThis 存在
  if (typeof globalThis === 'undefined') {
    (globalThis || window || self || {}).globalThis = globalThis || window || self || {};
  }

  var g = globalThis;

  // 确保 global 存在
  if (typeof g.global === 'undefined') {
    g.global = g;
  }

  // 确保 window 存在
  if (typeof g.window === 'undefined') {
    g.window = g;
  }

  // 确保 self 存在
  if (typeof g.self === 'undefined') {
    g.self = g;
  }

  // 强制设置 Request 构造函数（如果不存在）
  if (typeof g.Request === 'undefined') {
    g.Request = function Request(input, init) {
      this.url = typeof input === 'string' ? input : (input && input.url) || '';
      this.method = (init && init.method) || (input && input.method) || 'GET';
      this.headers = (init && init.headers) || (input && input.headers) || {};
      this.body = (init && init.body) || (input && input.body) || null;
      this.credentials = (init && init.credentials) || (input && input.credentials) || 'same-origin';
    };
    g.Request.prototype = {};
  }

  // 强制设置 Response 构造函数
  if (typeof g.Response === 'undefined') {
    g.Response = function Response(body, init) {
      this.body = body;
      this.status = (init && init.status) || 200;
      this.statusText = (init && init.statusText) || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new g.Headers ? new g.Headers(init && init.headers) : {};
      this.url = (init && init.url) || '';
    };
    g.Response.prototype = {};
  }

  // 强制设置 Headers 构造函数
  if (typeof g.Headers === 'undefined') {
    g.Headers = function Headers(init) {
      this._map = {};
      if (init) {
        if (init instanceof g.Headers || typeof init === 'object') {
          var entries = init instanceof g.Headers ? Array.from(init.entries()) : Object.entries(init);
          entries.forEach(function(entry) {
            this._map[entry[0].toLowerCase()] = entry[1];
          }, this);
        }
      }
    };
    g.Headers.prototype.entries = function* entries() {
      var map = this._map;
      for (var key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
          yield [key, map[key]];
        }
      }
    };
    g.Headers.prototype.forEach = function forEach(callback, thisArg) {
      var map = this._map;
      for (var key in map) {
        if (Object.prototype.hasOwnProperty.call(map, key)) {
          callback.call(thisArg, map[key], key, this);
        }
      }
    };
    g.Headers.prototype.get = function get(key) {
      return this._map[key.toLowerCase()] || null;
    };
    g.Headers.prototype.has = function has(key) {
      return key.toLowerCase() in this._map;
    };
  }

  // 强制设置 fetch 函数（如果不存在）
  if (typeof g.fetch === 'undefined') {
    g.fetch = function fetch(input, init) {
      return new Promise(function(resolve, reject) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        var method = (init && init.method) || (input && input.method) || 'GET';

        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);

        if (init && init.headers) {
          if (init.headers instanceof g.Headers) {
            init.headers.forEach(function(value, key) {
              xhr.setRequestHeader(key, value);
            });
          } else if (typeof init.headers === 'object') {
            Object.keys(init.headers).forEach(function(key) {
              xhr.setRequestHeader(key, init.headers[key]);
            });
          }
        }

        xhr.withCredentials = init && init.credentials === 'include';

        xhr.onload = function() {
          var response = new g.Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {}
          });
          resolve(response);
        };

        xhr.onerror = function() {
          reject(new TypeError('Network request failed'));
        };

        xhr.ontimeout = function() {
          reject(new TypeError('Network request timed out'));
        };

        xhr.send(init && init.body || null);
      });
    };
  }

  // 强制设置 FormData
  if (typeof g.FormData === 'undefined') {
    g.FormData = function FormData() {
      this._data = [];
    };
    g.FormData.prototype.append = function append(key, value) {
      this._data.push({ key: key, value: value });
    };
  }

  // 强制设置 btoa/atob
  if (typeof g.btoa === 'undefined') {
    g.btoa = function btoa(str) {
      return (typeof Buffer !== 'undefined') ? Buffer.from(str, 'binary').toString('base64') : str;
    };
  }
  if (typeof g.atob === 'undefined') {
    g.atob = function atob(str) {
      return (typeof Buffer !== 'undefined') ? Buffer.from(str, 'base64').toString('binary') : str;
    };
  }

  // 强制设置 URLSearchParams
  if (typeof g.URLSearchParams === 'undefined') {
    g.URLSearchParams = function URLSearchParams(search) {
      this._search = search || '';
      this._map = {};
      if (this._search) {
        var params = this._search.replace(/^\?/, '').split('&');
        params.forEach(function(param) {
          var parts = param.split('=');
          if (parts[0]) {
            this._map[decodeURIComponent(parts[0])] = parts[1] ? decodeURIComponent(parts[1]) : '';
          }
        }, this);
      }
    };
    g.URLSearchParams.prototype.get = function get(key) {
      return this._map[key] || null;
    };
    g.URLSearchParams.prototype.has = function has(key) {
      return key in this._map;
    };
  }

  console.log('Axios compatibility polyfills initialized');
})();

export default {
  init: function() {
    // 初始化函数
  }
};
