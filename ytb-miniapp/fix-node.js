if (global.localStorage && typeof global.localStorage.getItem !== 'function') {
  delete global.localStorage;
}
