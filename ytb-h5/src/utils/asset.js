const DEFAULT_ASSET_ORIGIN = 'https://pay.itapgo.com';
const DEFAULT_PROTOCOL = 'https:';

const runtimeOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
const runtimeProtocol = typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol : '';

let configuredOrigin = '';
try {
  configuredOrigin = (import.meta.env && import.meta.env.VITE_APP_ASSET_ORIGIN) || '';
} catch (error) {
  configuredOrigin = '';
}

const assetOrigin = configuredOrigin || runtimeOrigin || DEFAULT_ASSET_ORIGIN;
const assetProtocol = runtimeProtocol || (assetOrigin.startsWith('http') ? new URL(assetOrigin).protocol : DEFAULT_PROTOCOL);

const MAX_IMAGE_RESOLVE_DEPTH = 5;
const IMAGE_URL_KEYS = ['url', 'path', 'src', 'href', 'value', 'preview', 'thumbUrl', 'thumbnail', 'origin_url', 'originUrl'];

const isBrowserFileObject = (value) => {
  if (typeof File !== 'undefined' && value instanceof File) {
    return true;
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return true;
  }
  return false;
};

const coerceImageSource = (value, depth = 0, visited = new WeakSet()) => {
  if (depth > MAX_IMAGE_RESOLVE_DEPTH) {
    return '';
  }

  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    if (/^(data:|blob:)/i.test(trimmed)) {
      return trimmed;
    }

    if (/^[\[{]/.test(trimmed)) {
      try {
        const parsed = JSON.parse(trimmed);
        return coerceImageSource(parsed, depth + 1, visited);
      } catch (error) {
        // treat as plain string if JSON.parse fails
      }
    }

    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = coerceImageSource(item, depth + 1, visited);
      if (candidate) {
        return candidate;
      }
    }
    return '';
  }

  if (typeof value === 'object') {
    if (isBrowserFileObject(value)) {
      return '';
    }

    if (visited.has(value)) {
      return '';
    }
    visited.add(value);

    for (const key of IMAGE_URL_KEYS) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const candidate = coerceImageSource(value[key], depth + 1, visited);
        if (candidate) {
          return candidate;
        }
      }
    }

    const keys = Object.keys(value);
    for (const key of keys) {
      const candidate = coerceImageSource(value[key], depth + 1, visited);
      if (candidate) {
        return candidate;
      }
    }
  }

  return '';
};

export const resolveImageSource = (value) => coerceImageSource(value);

/**
 * Return the base origin used for assets. Prioritises explicit configuration,
 * then falls back to the current window origin, and finally a hard-coded default.
 */
export const getAssetOrigin = () => assetOrigin;

/**
 * Return the protocol to be used when normalising protocol-relative URLs.
 */
export const getAssetProtocol = () => assetProtocol || DEFAULT_PROTOCOL;

/**
 * Normalize an image URL so the client can load it correctly.
 * Handles complete URLs, protocol-relative URLs, relative paths and data/blob URIs.
 *
 * @param {string} value - Raw URL or path from the backend.
 * @param {Object} [options] - Optional configuration.
 * @param {string} [options.fallback=''] - Value returned when the input is empty/invalid.
 * @returns {string} A browser-loadable URL (may be empty if no valid URL is available).
 */
export const normalizeImageUrl = (value, { fallback = '' } = {}) => {
  const rawCandidate = resolveImageSource(value);

  if (!rawCandidate) {
    return fallback;
  }

  const raw = rawCandidate.trim();

  if (!raw) {
    return fallback;
  }

  if (/^(data:|blob:)/i.test(raw)) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('//')) {
    return `${getAssetProtocol()}${raw}`;
  }

  const origin = getAssetOrigin();

  try {
    return new URL(raw, origin).toString();
  } catch (error) {
    const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`;
    if (/^https?:\/\//i.test(origin)) {
      return `${origin.replace(/\/$/, '')}${normalizedPath}`;
    }
    return normalizedPath;
  }
};
