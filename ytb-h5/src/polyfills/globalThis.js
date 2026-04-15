/**
 * Polyfills for legacy WebViews (e.g. WeChat browser)
 * Must run before any other modules that depend on fetch/Request/Response
 */

// Ensure globalThis exists
const resolveGlobal = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  return {};
};

const g = resolveGlobal();

// Ensure globalThis.globalThis
if (typeof g.globalThis === 'undefined') {
  g.globalThis = g;
}

// Ensure globalThis.global
if (typeof g.global === 'undefined') {
  g.global = g;
}

// Ensure fetch exists (needed for axios)
if (typeof g.fetch === 'undefined') {
  g.fetch = function fetch(input, init) {
    return new Promise((resolve, reject) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method || (input instanceof Request ? input.method : 'GET');

      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);

      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        } else if (typeof init.headers === 'object') {
          Object.keys(init.headers).forEach(key => {
            xhr.setRequestHeader(key, init.headers[key]);
          });
        }
      }

      xhr.withCredentials = init?.credentials === 'include';

      xhr.onload = () => {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: {}
        });
        resolve(response);
      };

      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.ontimeout = () => reject(new TypeError('Network request timed out'));

      xhr.send(init?.body || null);
    });
  };
}

// Ensure Request exists (needed for axios fetch adapter)
if (typeof g.Request === 'undefined') {
  g.Request = function Request(input, init) {
    if (typeof input === 'string') {
      this.url = input;
    } else if (input instanceof URL) {
      this.url = input.href;
    } else if (input) {
      this.url = input.url || '';
    }
    this.method = (init?.method || (input?.method) || 'GET').toUpperCase();
    this.headers = init?.headers || (input?.headers) || {};
    this.body = init?.body || (input?.body) || null;
    this.credentials = init?.credentials || (input?.credentials) || 'same-origin';
  };
}

// Ensure Response exists (needed for axios fetch adapter)
if (typeof g.Response === 'undefined') {
  g.Response = function Response(body, init) {
    this.body = body;
    this.status = (init?.status || 200);
    this.statusText = (init?.statusText || 'OK');
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Headers(init?.headers || {});
    this.url = (init?.url) || '';
  };
  g.Response.prototype = {};
}

// Ensure Headers exists (needed for axios fetch adapter)
if (typeof g.Headers === 'undefined') {
  g.Headers = function Headers(init) {
    this._map = {};
    if (init) {
      if (init instanceof Headers || typeof init === 'object') {
        const entries = init instanceof Headers ? Array.from(init.entries()) : Object.entries(init);
        entries.forEach(([key, value]) => {
          this._map[key.toLowerCase()] = value;
        });
      }
    }
  };
  g.Headers.prototype.entries = function* () {
    for (const [key, value] of Object.entries(this._map)) {
      yield [key, value];
    }
  };
  g.Headers.prototype.forEach = function (callback) {
    for (const [key, value] of Object.entries(this._map)) {
      callback(value, key, this);
    }
  };
  g.Headers.prototype.get = function (key) {
    return this._map[key.toLowerCase()] || null;
  };
  g.Headers.prototype.has = function (key) {
    return key.toLowerCase() in this._map;
  };
}

// Ensure FormData exists
if (typeof g.FormData === 'undefined') {
  g.FormData = function FormData() {
    this._data = [];
  };
  g.FormData.prototype.append = function (key, value) {
    this._data.push({ key, value });
  };
}

// Ensure btoa exists (needed by some libraries)
if (typeof g.btoa === 'undefined') {
  g.btoa = function btoa(str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

// Ensure atob exists
if (typeof g.atob === 'undefined') {
  g.atob = function atob(str) {
    return Buffer.from(str, 'base64').toString('binary');
  };
}

export default g;
