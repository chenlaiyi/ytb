/**
 * Ensure a stable globalThis/global reference in legacy runtimes (e.g. WeChat webview)
 * before third-party libraries (axios fetch adapter) evaluate.
 */

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

  // eslint-disable-next-line no-new-func
  return Function('return this')();
};

const globalRef = resolveGlobal();

if (typeof globalThis === 'undefined') {
  globalRef.globalThis = globalRef;
}

if (typeof globalRef.global === 'undefined') {
  globalRef.global = globalRef;
}

export default globalRef;
