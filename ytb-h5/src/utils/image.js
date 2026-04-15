export async function compressImageFile(file, options = {}) {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    maxSize = 1024 * 1024,
    quality = 0.85
  } = options

  const image = await loadImageFromFile(file)
  const { width, height } = calculateSize(image, maxWidth, maxHeight)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0, width, height)

  let currentQuality = quality
  let blob = await canvasToBlob(canvas, currentQuality)

  while (blob.size > maxSize && currentQuality > 0.45) {
    currentQuality -= 0.05
    blob = await canvasToBlob(canvas, currentQuality)
  }

  if (blob.size > maxSize) {
    throw new Error('图片压缩后仍超过限制，请选择更小的图片')
  }

  const fileName = `${Date.now()}-${slugifyFileName(file.name)}.jpg`
  return new File([blob], fileName, { type: 'image/jpeg' })
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (error) => reject(error)
      img.src = reader.result
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

function calculateSize(image, maxWidth, maxHeight) {
  const { width, height } = image
  let targetWidth = width
  let targetHeight = height

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    targetWidth = Math.round(width * ratio)
    targetHeight = Math.round(height * ratio)
  }

  return { width: targetWidth, height: targetHeight }
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('图像压缩失败'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', quality)
  })
}

function slugifyFileName(name) {
  return (name || 'image')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
