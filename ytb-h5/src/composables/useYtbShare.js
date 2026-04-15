/**
 * 亿拓宝分享配置 composable
 * 统一管理亿拓宝H5页面的微信分享配置
 */
import { onMounted } from 'vue'
import { setShareMetadata } from '@/utils/share'

// 亿拓宝公众号logo
const YTB_LOGO = 'https://wx.qlogo.cn/mmopen/PiajxSqBRaEKwO9tEjCgLvIPqa96gV5bP2LoUpFvOiajAvicTO9OgibZ2sLzxP37UxktxFKw03JNTiaHh05EWmKT1MqPRH92MbCumtH0goy3Vh5TI0hu4P8BelkXuxvtINHjG/0'

// 亿拓宝默认slogan
const YTB_SUBTITLE = '极度真诚 • 极致服务'

/**
 * 设置亿拓宝页面的微信分享配置
 * @param {string} title - 分享标题（可选，默认为"亿拓宝联盟"）
 * @param {Object} options - 额外配置选项
 */
export function useYtbShare(title = '亿拓宝联盟', options = {}) {
  const setupShare = () => {
    setShareMetadata({
      title: title,
      subtitle: options.subtitle || YTB_SUBTITLE,
      logo: options.logo || YTB_LOGO,
      ...options
    })
  }

  onMounted(() => {
    setupShare()
  })

  return {
    setupShare,
    YTB_LOGO,
    YTB_SUBTITLE
  }
}

export default useYtbShare
