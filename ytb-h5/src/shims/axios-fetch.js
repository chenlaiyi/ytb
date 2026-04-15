/**
 * Axios fetch adapter shim for legacy environments (e.g., older WeChat webviews).
 * Returning false tells axios the fetch adapter is not supported so it will fall back to XHR.
 */

export const getFetch = () => false;

export default {
  getFetch
};
