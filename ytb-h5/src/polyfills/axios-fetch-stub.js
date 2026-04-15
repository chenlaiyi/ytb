/**
 * Axios fetch adapter stub for legacy WebViews (e.g. older WeChat browsers).
 *
 * The upstream axios fetch adapter tries to destructure `Request`/`Response`
 * from the global scope during module evaluation. In certain legacy runtimes
 * those globals are missing, causing a hard crash before our polyfills run.
 *
 * We disable the fetch adapter in such environments and let axios fall back
 * to the XHR adapter, which is already enforced in our request utilities.
 */

export const getFetch = () => false;

export default false;
