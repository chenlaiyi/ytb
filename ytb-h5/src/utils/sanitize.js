import DOMPurify from 'dompurify'

export function sanitize(html) {
  if (!html) return ''
  return DOMPurify.sanitize(String(html), {
    USE_PROFILES: { html: true },
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data:image\/)(?:.|\n)*)$/i
  })
}

export default sanitize

