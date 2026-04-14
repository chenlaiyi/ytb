<template>
  <div class="public-cockpit">
    <header class="hero">
      <div class="hero__text">
        <p class="hero__eyebrow">DATA COCKPIT</p>
        <h1>亿拓宝大数据中心</h1>
        <p>整合美团交易、星驿付流水与引流进件，提供对外可共享的全局视图。</p>
      </div>
      <div class="hero__meta">
        <p>统计区间：{{ rangeText }}</p>
        <p>最近刷新：{{ generatedAtText }}</p>
        <el-button size="small" type="primary" plain :loading="loading" @click="fetchData">
          {{ loading ? '加载中' : '刷新数据' }}
        </el-button>
      </div>
    </header>

    <section class="summary-grid">
      <el-card
        v-for="card in summaryCards"
        :key="card.key"
        shadow="hover"
        class="summary-card"
      >
        <p class="summary-card__label">{{ card.label }}</p>
        <p class="summary-card__value">
          <span>{{ card.value }}</span>
          <small>{{ card.unit }}</small>
        </p>
        <p class="summary-card__desc">{{ card.desc }}</p>
      </el-card>
    </section>

    <section class="map-section">
      <div class="section-heading">
        <div>
          <h2>全国交易热力</h2>
          <p>亮点标记昨日有交易的商户，实时心跳涟漪显示。</p>
        </div>
        <div class="section-actions">
          <el-checkbox-group v-model="selectedSources" class="source-filter" size="small">
            <el-checkbox
              v-for="item in sourceOptions"
              :key="item.key"
              :label="item.key"
              :disabled="!item.count"
            >
              {{ item.label }} <small>({{ item.count }})</small>
            </el-checkbox>
          </el-checkbox-group>
          <span class="badge highlight">昨日高亮 {{ mapInfo.highlight_total }}</span>
        </div>
      </div>

      <div class="map-wrapper">
        <div class="map-canvas">
          <div class="map-chart" ref="mapRef"></div>
          <el-empty v-if="!mapPoints.length && !loading" class="map-empty" description="暂无可视化数据" />
          <div class="map-controls" v-if="mapPoints.length">
            <button type="button" class="map-control-btn" @click="handleZoomIn">+</button>
            <button type="button" class="map-control-btn" @click="handleZoomOut">-</button>
            <button type="button" class="map-control-btn reset" @click="handleResetMap">复位</button>
          </div>
        </div>
        <div class="map-side">
          <el-skeleton :loading="loading" animated :rows="6">
            <div class="map-list">
              <div
                v-for="merchant in topMerchants"
                :key="merchant.id"
                class="map-list__item"
                :class="{ highlight: merchant.highlight }"
              >
                <div class="map-list__title">
                  <span class="dot" />
                  <strong>{{ merchant.name }}</strong>
                </div>
                <p class="map-list__meta">
                  {{ merchant.city || merchant.province || '未知城市' }} · {{ merchant.sourceLabel }}
                </p>
                <p class="map-list__amount">近30日 ¥{{ formatAmount(merchant.amount) }}</p>
              </div>
            </div>
          </el-skeleton>
        </div>
      </div>
    </section>

    <section class="ticker-section">
      <div class="section-heading">
        <div>
          <h2>实时心跳播报</h2>
          <p>展示近 {{ tickerItems.length }} 条交易 / 进件事件，{{ tickerInterval }} 秒轮播。</p>
        </div>
      </div>
      <div class="ticker-columns">
        <el-card shadow="never" class="ticker-card ticker-main">
          <div v-if="activeTicker" class="ticker-current">
            <span class="ticker-source" :class="`src-${activeTicker.source}`">
              {{ sourceLabel(activeTicker.source) }}
            </span>
            <div class="ticker-info">
              <p class="ticker-msg">{{ activeTicker.message }}</p>
              <p class="ticker-sub">
                {{ activeTicker.occurred_text }} · {{ activeTicker.city || '全国' }}
                <span v-if="activeTicker.amount">· ¥{{ formatAmount(activeTicker.amount) }}</span>
              </p>
            </div>
          </div>
          <div v-else class="ticker-empty">
            <el-empty :description="loading ? '心跳加载中' : '暂无心跳数据'" />
          </div>
          <el-divider />
          <el-scrollbar class="ticker-queue">
            <div
              v-for="item in upcomingTicker"
              :key="item.id"
              class="ticker-queue__item"
            >
              <span>{{ item.occurred_text }}</span>
              <span>{{ sourceLabel(item.source) }}</span>
              <span class="ellipsis">{{ item.message }}</span>
            </div>
          </el-scrollbar>
        </el-card>

        <el-card shadow="never" class="ticker-card ticker-leads">
        <div class="lead-card__header">
          <h3>进件心跳</h3>
          <small>{{ leadTickerItems.length }} 条</small>
        </div>
        <el-empty v-if="!leadTickerItems.length" description="暂无进件心跳" />
        <el-scrollbar v-else class="lead-list">
          <div
            v-for="lead in leadTickerItems"
            :key="lead.id"
            class="lead-item"
            :class="{ active: activeLeadTicker && lead.id === activeLeadTicker.id }"
          >
            <p class="lead-title">{{ lead.merchant }}</p>
            <p class="lead-meta">
              {{ lead.occurred_text }} · {{ lead.city || '全国' }}
            </p>
            <p class="lead-institution">
              所属机构：{{ lead.institution || '未匹配' }}
            </p>
            <p class="lead-status">{{ lead.message }}</p>
          </div>
        </el-scrollbar>
      </el-card>
    </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { MapChart, ScatterChart, EffectScatterChart } from 'echarts/charts'
import { GeoComponent, TooltipComponent, VisualMapComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

echarts.use([MapChart, ScatterChart, EffectScatterChart, GeoComponent, TooltipComponent, VisualMapComponent, LegendComponent, CanvasRenderer])

const DEFAULT_MAP_CENTER = [104.1954, 35.8617]
const DEFAULT_MAP_ZOOM = 1.35  // 增大缩放让地图填充容器
const CHINA_BOUNDS = Object.freeze({
  lngMin: 73.333,
  lngMax: 134.772,
  latMin: 18.167,
  latMax: 53.56,
})

// 省份中心坐标（用于聚合显示）
const PROVINCE_CENTERS = {
  '北京市': [116.4074, 39.9042],
  '天津市': [117.2000, 39.0842],
  '上海市': [121.4737, 31.2304],
  '重庆市': [106.5516, 29.5630],
  '河北省': [114.5300, 38.0371],
  '山西省': [112.5624, 37.8735],
  '辽宁省': [123.4291, 41.7968],
  '吉林省': [125.3245, 43.8868],
  '黑龙江省': [126.6424, 45.7569],
  '江苏省': [118.7637, 32.0617],
  '浙江省': [120.1536, 30.2656],
  '安徽省': [117.2273, 31.8206],
  '福建省': [119.2965, 26.0745],
  '江西省': [115.9092, 27.6395],
  '山东省': [117.0208, 36.6683],
  '河南省': [113.6654, 33.7570],
  '湖北省': [114.3054, 30.5931],
  '湖南省': [112.9834, 28.1124],
  '广东省': [113.2665, 23.1322],
  '海南省': [110.3492, 20.0174],
  '四川省': [104.0665, 30.5728],
  '贵州省': [106.7135, 26.5783],
  '云南省': [102.8332, 24.8797],
  '陕西省': [108.9542, 34.2658],
  '甘肃省': [103.8343, 36.0612],
  '青海省': [101.7782, 36.6171],
  '内蒙古自治区': [111.6708, 40.8183],
  '广西壮族自治区': [108.3275, 22.8150],
  '西藏自治区': [91.1409, 29.6456],
  '宁夏回族自治区': [106.2782, 38.4664],
  '新疆维吾尔自治区': [87.6168, 43.8254],
  '香港特别行政区': [114.1694, 22.3193],
  '澳门特别行政区': [113.5439, 22.1987],
  '台湾省': [121.5654, 25.0330],
}

// 城市到省份的映射（简化版）
const CITY_TO_PROVINCE = {
  '北京': '北京市', '天津': '天津市', '上海': '上海市', '重庆': '重庆市',
  '广州': '广东省', '深圳': '广东省', '东莞': '广东省', '佛山': '广东省', '珠海': '广东省', '中山': '广东省', '惠州': '广东省', '江门': '广东省', '汕头': '广东省', '湛江': '广东省', '茂名': '广东省', '肇庆': '广东省', '清远': '广东省', '韶关': '广东省', '梅州': '广东省', '河源': '广东省', '潮州': '广东省', '揭阳': '广东省', '汕尾': '广东省', '阳江': '广东省', '云浮': '广东省',
  '杭州': '浙江省', '宁波': '浙江省', '温州': '浙江省', '嘉兴': '浙江省', '湖州': '浙江省', '绍兴': '浙江省', '金华': '浙江省', '衢州': '浙江省', '舟山': '浙江省', '台州': '浙江省', '丽水': '浙江省',
  '南京': '江苏省', '苏州': '江苏省', '无锡': '江苏省', '常州': '江苏省', '镇江': '江苏省', '南通': '江苏省', '扬州': '江苏省', '泰州': '江苏省', '盐城': '江苏省', '淮安': '江苏省', '连云港': '江苏省', '徐州': '江苏省', '宿迁': '江苏省',
  '济南': '山东省', '青岛': '山东省', '烟台': '山东省', '威海': '山东省', '潍坊': '山东省', '淄博': '山东省', '东营': '山东省', '滨州': '山东省', '德州': '山东省', '聊城': '山东省', '菏泽': '山东省', '济宁': '山东省', '泰安': '山东省', '临沂': '山东省', '日照': '山东省', '枣庄': '山东省', '莱芜': '山东省',
  '成都': '四川省', '绵阳': '四川省', '德阳': '四川省', '宜宾': '四川省', '泸州': '四川省', '乐山': '四川省', '南充': '四川省', '眉山': '四川省', '自贡': '四川省', '内江': '四川省', '达州': '四川省', '广安': '四川省', '遂宁': '四川省', '广元': '四川省', '雅安': '四川省', '资阳': '四川省', '巴中': '四川省', '攀枝花': '四川省',
  '武汉': '湖北省', '宜昌': '湖北省', '襄阳': '湖北省', '荆州': '湖北省', '黄冈': '湖北省', '十堰': '湖北省', '孝感': '湖北省', '咸宁': '湖北省', '黄石': '湖北省', '鄂州': '湖北省', '荆门': '湖北省', '随州': '湖北省', '恩施': '湖北省',
  '长沙': '湖南省', '株洲': '湖南省', '湘潭': '湖南省', '衡阳': '湖南省', '邵阳': '湖南省', '岳阳': '湖南省', '常德': '湖南省', '张家界': '湖南省', '益阳': '湖南省', '郴州': '湖南省', '永州': '湖南省', '怀化': '湖南省', '娄底': '湖南省',
  '郑州': '河南省', '洛阳': '河南省', '开封': '河南省', '新乡': '河南省', '焦作': '河南省', '安阳': '河南省', '鹤壁': '河南省', '濮阳': '河南省', '许昌': '河南省', '漯河': '河南省', '三门峡': '河南省', '南阳': '河南省', '商丘': '河南省', '信阳': '河南省', '周口': '河南省', '驻马店': '河南省', '济源': '河南省', '平顶山': '河南省',
  '石家庄': '河北省', '唐山': '河北省', '秦皇岛': '河北省', '邯郸': '河北省', '邢台': '河北省', '保定': '河北省', '张家口': '河北省', '承德': '河北省', '沧州': '河北省', '廊坊': '河北省', '衡水': '河北省',
  '福州': '福建省', '厦门': '福建省', '泉州': '福建省', '漳州': '福建省', '莆田': '福建省', '宁德': '福建省', '三明': '福建省', '龙岩': '福建省', '南平': '福建省',
  '合肥': '安徽省', '芜湖': '安徽省', '蚌埠': '安徽省', '淮南': '安徽省', '马鞍山': '安徽省', '淮北': '安徽省', '铜陵': '安徽省', '安庆': '安徽省', '黄山': '安徽省', '阜阳': '安徽省', '宿州': '安徽省', '滁州': '安徽省', '六安': '安徽省', '宣城': '安徽省', '池州': '安徽省', '亳州': '安徽省',
  '南昌': '江西省', '九江': '江西省', '景德镇': '江西省', '萍乡': '江西省', '新余': '江西省', '鹰潭': '江西省', '赣州': '江西省', '吉安': '江西省', '宜春': '江西省', '抚州': '江西省', '上饶': '江西省',
  '西安': '陕西省', '咸阳': '陕西省', '宝鸡': '陕西省', '渭南': '陕西省', '铜川': '陕西省', '延安': '陕西省', '榆林': '陕西省', '汉中': '陕西省', '安康': '陕西省', '商洛': '陕西省',
  '沈阳': '辽宁省', '大连': '辽宁省', '鞍山': '辽宁省', '抚顺': '辽宁省', '本溪': '辽宁省', '丹东': '辽宁省', '锦州': '辽宁省', '营口': '辽宁省', '阜新': '辽宁省', '辽阳': '辽宁省', '盘锦': '辽宁省', '铁岭': '辽宁省', '朝阳': '辽宁省', '葫芦岛': '辽宁省',
  '长春': '吉林省', '吉林': '吉林省', '四平': '吉林省', '辽源': '吉林省', '通化': '吉林省', '白山': '吉林省', '松原': '吉林省', '白城': '吉林省', '延边': '吉林省',
  '哈尔滨': '黑龙江省', '齐齐哈尔': '黑龙江省', '牡丹江': '黑龙江省', '佳木斯': '黑龙江省', '大庆': '黑龙江省', '鸡西': '黑龙江省', '双鸭山': '黑龙江省', '伊春': '黑龙江省', '七台河': '黑龙江省', '鹤岗': '黑龙江省', '绥化': '黑龙江省', '黑河': '黑龙江省',
  '太原': '山西省', '大同': '山西省', '阳泉': '山西省', '长治': '山西省', '晋城': '山西省', '朔州': '山西省', '晋中': '山西省', '运城': '山西省', '忻州': '山西省', '临汾': '山西省', '吕梁': '山西省',
  '南宁': '广西壮族自治区', '柳州': '广西壮族自治区', '桂林': '广西壮族自治区', '梧州': '广西壮族自治区', '北海': '广西壮族自治区', '防城港': '广西壮族自治区', '钦州': '广西壮族自治区', '贵港': '广西壮族自治区', '玉林': '广西壮族自治区', '百色': '广西壮族自治区', '贺州': '广西壮族自治区', '河池': '广西壮族自治区', '来宾': '广西壮族自治区', '崇左': '广西壮族自治区',
  '昆明': '云南省', '曲靖': '云南省', '玉溪': '云南省', '保山': '云南省', '昭通': '云南省', '丽江': '云南省', '普洱': '云南省', '临沧': '云南省', '大理': '云南省', '红河': '云南省', '文山': '云南省', '西双版纳': '云南省', '楚雄': '云南省', '德宏': '云南省', '怒江': '云南省', '迪庆': '云南省',
  '贵阳': '贵州省', '六盘水': '贵州省', '遵义': '贵州省', '安顺': '贵州省', '毕节': '贵州省', '铜仁': '贵州省', '黔西南': '贵州省', '黔东南': '贵州省', '黔南': '贵州省',
  '兰州': '甘肃省', '嘉峪关': '甘肃省', '金昌': '甘肃省', '白银': '甘肃省', '天水': '甘肃省', '武威': '甘肃省', '张掖': '甘肃省', '平凉': '甘肃省', '酒泉': '甘肃省', '庆阳': '甘肃省', '定西': '甘肃省', '陇南': '甘肃省',
  '西宁': '青海省', '海东': '青海省', '海北': '青海省', '黄南': '青海省', '海南': '青海省', '果洛': '青海省', '玉树': '青海省', '海西': '青海省',
  '银川': '宁夏回族自治区', '石嘴山': '宁夏回族自治区', '吴忠': '宁夏回族自治区', '固原': '宁夏回族自治区', '中卫': '宁夏回族自治区',
  '乌鲁木齐': '新疆维吾尔自治区', '克拉玛依': '新疆维吾尔自治区', '吐鲁番': '新疆维吾尔自治区', '哈密': '新疆维吾尔自治区', '昌吉': '新疆维吾尔自治区', '博尔塔拉': '新疆维吾尔自治区', '巴音郭楞': '新疆维吾尔自治区', '阿克苏': '新疆维吾尔自治区', '克孜勒苏': '新疆维吾尔自治区', '喀什': '新疆维吾尔自治区', '和田': '新疆维吾尔自治区', '伊犁': '新疆维吾尔自治区', '塔城': '新疆维吾尔自治区', '阿勒泰': '新疆维吾尔自治区',
  '拉萨': '西藏自治区', '昌都': '西藏自治区', '山南': '西藏自治区', '日喀则': '西藏自治区', '那曲': '西藏自治区', '阿里': '西藏自治区', '林芝': '西藏自治区',
  '呼和浩特': '内蒙古自治区', '包头': '内蒙古自治区', '乌海': '内蒙古自治区', '赤峰': '内蒙古自治区', '通辽': '内蒙古自治区', '鄂尔多斯': '内蒙古自治区', '呼伦贝尔': '内蒙古自治区', '巴彦淖尔': '内蒙古自治区', '乌兰察布': '内蒙古自治区',
  '海口': '海南省', '三亚': '海南省', '三沙': '海南省', '儋州': '海南省',
  '香港': '香港特别行政区', '澳门': '澳门特别行政区', '台北': '台湾省', '高雄': '台湾省', '台中': '台湾省', '台南': '台湾省', '新北': '台湾省',
}

// 城市中心坐标（补充主要城市）
const CITY_CENTERS = {
  '北京': [116.4074, 39.9042], '天津': [117.2000, 39.0842], '上海': [121.4737, 31.2304], '重庆': [106.5516, 29.5630],
  '广州': [113.2644, 23.1291], '深圳': [114.0579, 22.5431], '东莞': [113.7518, 23.0208], '佛山': [113.1219, 23.0218],
  '杭州': [120.1551, 30.2741], '宁波': [121.5440, 29.8683], '温州': [120.6994, 27.9939],
  '南京': [118.7969, 32.0603], '苏州': [120.5853, 31.2989], '无锡': [120.3119, 31.4912],
  '济南': [117.1200, 36.6512], '青岛': [120.3826, 36.0671], '烟台': [121.3914, 37.5393],
  '成都': [104.0665, 30.5728], '武汉': [114.3054, 30.5931], '长沙': [112.9389, 28.2282],
  '郑州': [113.6254, 34.7466], '西安': [108.9398, 34.3416], '沈阳': [123.4291, 41.7968],
  '福州': [119.2965, 26.0745], '厦门': [118.0894, 24.4798], '泉州': [118.6759, 24.8740],
  '合肥': [117.2273, 31.8206], '南昌': [115.8582, 28.6820], '石家庄': [114.4898, 38.0428],
  '长春': [125.3245, 43.8868], '哈尔滨': [126.5349, 45.8038], '太原': [112.5489, 37.8706],
  '南宁': [108.3661, 22.8170], '昆明': [102.8332, 24.8797], '贵阳': [106.6302, 26.6477],
  '兰州': [103.8343, 36.0612], '西宁': [101.7782, 36.6171], '银川': [106.2782, 38.4664],
  '乌鲁木齐': [87.6168, 43.8254], '拉萨': [91.1409, 29.6456], '呼和浩特': [111.7490, 40.8426],
  '海口': [110.3312, 20.0310], '三亚': [109.5083, 18.2526], '香港': [114.1694, 22.3193], '澳门': [113.5439, 22.1987],
}

// 导入本地地图数据
import chinaGeoJson from '@/assets/geo/china.json'

const loadChinaGeoJson = async () => {
  if (echarts.getMap('china')) return

  // 优先使用本地地图文件
  try {
    echarts.registerMap('china', chinaGeoJson)
    console.log('[public-cockpit] loaded china map from local file')
    return
  } catch (error) {
    console.warn('[public-cockpit] register local china map failed', error)
  }

  // 备用：从 CDN 加载
  const candidates = [
    'https://fastly.jsdelivr.net/npm/echarts@5/map/json/china.json',
    'https://cdn.jsdelivr.net/npm/echarts@5/map/json/china.json',
  ]

  for (const url of candidates) {
    try {
      const resp = await fetch(url, { cache: 'force-cache' })
      if (resp.ok) {
        const json = await resp.json()
        echarts.registerMap('china', json)
        console.log('[public-cockpit] loaded china map from', url)
        return
      }
    } catch (error) {
      console.warn('[public-cockpit] load china map failed', url, error)
    }
  }

  console.error('[public-cockpit] all china map sources failed')
}

const loading = ref(false)
const summary = ref({ meituan: {}, leads: {}, starpay: {} })
const mapInfo = ref({ total: 0, highlight_total: 0, source_totals: {}, items: [] })
const ticker = ref({ items: [], rolling_interval_seconds: 8 })
const meta = ref({ generated_at: '', range: { start: '', end: '', days: 0 } })
const mapView = ref({
  center: [...DEFAULT_MAP_CENTER],
  zoom: DEFAULT_MAP_ZOOM,
})
const selectedSources = ref(['meituan', 'starpay', 'lead'])
const computedMapCenter = computed(() => {
  const center = mapInfo.value.center
  if (center && typeof center.lng === 'number' && typeof center.lat === 'number') {
    return [center.lng, center.lat]
  }
  return [...DEFAULT_MAP_CENTER]
})

const summaryCards = computed(() => {
  const m = summary.value.meituan || {}
  const l = summary.value.leads || {}
  const st = summary.value.starpay || {}
  return [
    { key: 'gmv', label: '美团 GMV', value: formatCurrency(m.gmv_total), unit: '', desc: `活跃商户 ${m.merchant_total || 0} 家` },
    { key: 'starpay', label: '星驿付流水', value: formatCurrency(st.amount_total), unit: '', desc: `活跃商户 ${st.merchant_total || 0} 家` },
    { key: 'leads', label: '新增进件', value: formatInteger(l.lead_total), unit: '个', desc: `昨日新增 ${l.new_yesterday || 0} 个` },
    { key: 'heart', label: '昨日心跳', value: formatInteger(mapInfo.value.highlight_total), unit: '个', desc: '覆盖全渠道活跃商户' },
  ]
})

const rangeText = computed(() => {
  const range = meta.value.range || {}
  if (!range.start || !range.end) return '--'
  return `${range.start} ~ ${range.end} · ${range.days || 0}天`
})

const generatedAtText = computed(() => {
  if (!meta.value.generated_at) return '--'
  return new Date(meta.value.generated_at).toLocaleString()
})

const mapRef = ref(null)
let chartInstance = null
let geoRoamHandler = null
let rippleTimer = null
const rippleIndex = ref(0)
const availableSources = ['meituan', 'lead']
const filteredMapItems = computed(() => {
  const items = (mapInfo.value.items || []).filter((item) => selectedSources.value.includes(item.source))
  // 调试：打印前5个商户的原始数据
  if (items.length > 0) {
    console.log('[map] 原始商户数据样本:', items.slice(0, 5).map(i => ({
      name: i.name,
      city: i.city,
      province: i.province,
      coord: i.coordinate,
    })))
  }
  return items
})

const isWithinChina = (lng, lat) => {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= CHINA_BOUNDS.lngMin &&
    lng <= CHINA_BOUNDS.lngMax &&
    lat >= CHINA_BOUNDS.latMin &&
    lat <= CHINA_BOUNDS.latMax
  )
}

// 解析城市坐标 - 优先使用预设的城市中心坐标
const resolveCityCoordinate = (item) => {
  const city = (item.city || '').replace(/市$/, '').replace(/县$/, '').replace(/区$/, '')
  const province = item.province || ''

  // 1. 优先从城市中心坐标获取
  if (city && CITY_CENTERS[city]) {
    const coord = CITY_CENTERS[city]
    if (isWithinChina(coord[0], coord[1])) return coord
  }

  // 2. 检查城市全名
  if (city && CITY_CENTERS[city + '市']) {
    const coord = CITY_CENTERS[city + '市']
    if (isWithinChina(coord[0], coord[1])) return coord
  }

  // 3. 根据城市找到省份，使用省份中心（带随机偏移）
  const mappedProvince = CITY_TO_PROVINCE[city]
  if (mappedProvince && PROVINCE_CENTERS[mappedProvince]) {
    const center = PROVINCE_CENTERS[mappedProvince]
    // 使用商户ID生成稳定的随机偏移，避免所有点重叠
    const hash = (item.id || item.name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const offsetLng = ((hash % 100) - 50) / 200  // -0.25 ~ +0.25 度
    const offsetLat = (((hash * 7) % 100) - 50) / 200
    const newCoord = [center[0] + offsetLng, center[1] + offsetLat]
    if (isWithinChina(newCoord[0], newCoord[1])) return newCoord
    return center // 偏移后超出边界则使用中心点
  }

  // 4. 使用原始坐标（必须在中国范围内）
  const origLng = item.coordinate?.lng
  const origLat = item.coordinate?.lat
  if (isWithinChina(origLng, origLat)) {
    return [origLng, origLat]
  }

  // 5. 如果有省份信息，使用省份中心
  if (province) {
    for (const [provinceName, center] of Object.entries(PROVINCE_CENTERS)) {
      const shortProvince = provinceName.replace(/省|市|自治区|特别行政区$/, '')
      if (provinceName.includes(province) || province.includes(shortProvince) || shortProvince.includes(province)) {
        const hash = (item.id || item.name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        const offsetLng = ((hash % 100) - 50) / 200
        const offsetLat = (((hash * 7) % 100) - 50) / 200
        const newCoord = [center[0] + offsetLng, center[1] + offsetLat]
        if (isWithinChina(newCoord[0], newCoord[1])) return newCoord
        return center
      }
    }
  }

  // 6. 无法解析的坐标，返回 null（会被过滤掉）
  return null
}

// 验证坐标是否有效且在中国地图可视区域内（更严格的边界）
const isValidCoordinate = (coord) => {
  if (!coord || !Array.isArray(coord) || coord.length < 2) return false
  const lng = coord[0]
  const lat = coord[1]
  // 严格的中国地图可视区域边界
  // 经度: 80-127 (排除新疆西部、黑龙江东部边缘)
  // 纬度: 22-48 (排除海南南部、内蒙古北部边缘)
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= 80 &&
    lng <= 127 &&
    lat >= 22 &&
    lat <= 48
  )
}

const validMapItems = computed(() => {
  const items = filteredMapItems.value.map((item) => {
    const coord = resolveCityCoordinate(item)
    // 严格验证：确保坐标有效且在中国范围内
    if (!isValidCoordinate(coord)) {
      return null
    }
    return {
      ...item,
      resolvedCoordinate: coord,
    }
  }).filter(Boolean)
  
  // 开发调试：输出被过滤的数量
  const filtered = filteredMapItems.value.length - items.length
  if (filtered > 0) {
    console.log(`[map] 过滤掉 ${filtered} 个无效坐标的商户`)
  }
  
  return items
})

const mapPoints = computed(() => {
  const points = validMapItems.value
    .filter((item) => isValidCoordinate(item.resolvedCoordinate))
    .map((item) => ({
      name: item.name,
      value: [
        item.resolvedCoordinate[0],
        item.resolvedCoordinate[1],
        item.amount ?? 0,
      ],
      meta: item,
    }))
    // 最终过滤：确保所有点都在严格的边界内（与 isValidCoordinate 保持一致）
    .filter((point) => {
      const lng = point.value[0]
      const lat = point.value[1]
      return lng >= 80 && lng <= 127 && lat >= 22 && lat <= 48
    })
  
  console.log(`[map] 最终有效点数: ${points.length}`)
  return points
})

// 省份交易聚合数据（用于热力图）
const provinceData = computed(() => {
  const provinceStats = {}

  validMapItems.value.forEach((item) => {
    const city = (item.city || '').replace(/市$/, '')
    let province = CITY_TO_PROVINCE[city]

    if (!province && item.province) {
      for (const [provinceName] of Object.entries(PROVINCE_CENTERS)) {
        if (provinceName.includes(item.province) || item.province.includes(provinceName.replace(/省|市|自治区|特别行政区$/, ''))) {
          province = provinceName
          break
        }
      }
    }

    if (province) {
      if (!provinceStats[province]) {
        provinceStats[province] = { count: 0, amount: 0, highlight: 0 }
      }
      provinceStats[province].count += 1
      provinceStats[province].amount += item.amount || 0
      if (item.highlight) provinceStats[province].highlight += 1
    }
  })

  return Object.entries(provinceStats).map(([name, stats]) => ({
    name: name.replace(/省|市|自治区|特别行政区$/, ''),
    value: stats.amount,
    count: stats.count,
    highlight: stats.highlight,
  }))
})

const highlightPoints = computed(() => {
  // 严格过滤高亮点，确保坐标在有效范围内
  return mapPoints.value.filter((item) => {
    if (!item.meta?.highlight) return false
    const lng = item.value[0]
    const lat = item.value[1]
    // 与 isValidCoordinate 保持一致的边界
    return lng >= 80 && lng <= 127 && lat >= 22 && lat <= 48
  })
})

const highlightSequence = computed(() =>
  [...highlightPoints.value].sort((a, b) => (b.meta?.amount || 0) - (a.meta?.amount || 0))
)

const sourceOptions = computed(() => {
  const totals = mapInfo.value.source_totals || {}
  return [
    { key: 'meituan', label: '美团', count: totals.meituan || 0 },
    { key: 'starpay', label: '星驿付', count: totals.starpay || 0 },
    { key: 'lead', label: '进件', count: totals.lead || 0 },
  ]
})

const topMerchants = computed(() =>
  [...validMapItems.value]
    .sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0) || (b.amount || 0) - (a.amount || 0))
    .slice(0, 6)
    .map((item) => ({
      ...item,
      sourceLabel: sourceLabel(item.source),
    }))
)

const tickerIndex = ref(0)
let tickerTimer = null
const tickerItems = computed(() => ticker.value.items || [])
const leadTickerItems = computed(() => {
  const today = ticker.value.lead_items_today
  if (Array.isArray(today) && today.length) {
    return today
  }
  const provided = ticker.value.lead_items
  if (Array.isArray(provided) && provided.length) {
    return provided
  }
  return tickerItems.value.filter((item) => item.source === 'lead')
})
const nonLeadTickerItems = computed(() => tickerItems.value.filter((item) => item.source !== 'lead'))
const primaryTickerItems = computed(() => (nonLeadTickerItems.value.length ? nonLeadTickerItems.value : tickerItems.value))
const tickerInterval = computed(() => ticker.value.rolling_interval_seconds || 8)
const activeTicker = computed(() => {
  if (!primaryTickerItems.value.length) return null
  return primaryTickerItems.value[tickerIndex.value % primaryTickerItems.value.length]
})
const upcomingTicker = computed(() => {
  if (!primaryTickerItems.value.length) return []
  const result = []
  for (let i = 1; i < Math.min(6, primaryTickerItems.value.length); i += 1) {
    result.push(primaryTickerItems.value[(tickerIndex.value + i) % primaryTickerItems.value.length])
  }
  return result
})
const leadTickerIndex = ref(0)
let leadTickerTimer = null
const activeLeadTicker = computed(() => {
  if (!leadTickerItems.value.length) return null
  return leadTickerItems.value[leadTickerIndex.value % leadTickerItems.value.length]
})

watch(
  () => primaryTickerItems.value.length,
  () => {
    tickerIndex.value = 0
    startTicker()
  }
)

watch(
  () => leadTickerItems.value.length,
  () => {
    leadTickerIndex.value = 0
    startLeadTicker()
  }
)

watch(
  () => mapInfo.value.source_totals,
  () => {
    const available = sourceOptions.value.filter((item) => item.count > 0).map((item) => item.key)
    if (!available.length) {
      selectedSources.value = []
      return
    }
    const next = selectedSources.value.filter((key) => available.includes(key))
    if (!next.length) {
      selectedSources.value = [...available]
    } else if (next.length !== selectedSources.value.length) {
      selectedSources.value = [...next]
    }
  },
  { deep: true, immediate: true }
)

const renderChart = () => {
  if (!chartInstance) return
  
  // 按省份聚合的数据
  const provinces = provinceData.value
  
  // 为每个省份生成散点数据（使用省份中心坐标）
  const provincePoints = provinces.map((p) => {
    // 查找省份中心坐标
    let center = null
    for (const [name, coord] of Object.entries(PROVINCE_CENTERS)) {
      const shortName = name.replace(/省|市|自治区|特别行政区$/, '')
      if (shortName === p.name || name.includes(p.name)) {
        center = coord
        break
      }
    }
    if (!center) return null
    
    return {
      name: p.name,
      value: [...center, p.count, p.amount],
      highlight: p.highlight > 0,
      count: p.count,
      amount: p.amount,
      highlightCount: p.highlight,
    }
  }).filter(Boolean)
  
  // 分离活跃和非活跃省份
  const activeProvinces = provincePoints.filter(p => p.highlight)
  const inactiveProvinces = provincePoints.filter(p => !p.highlight)
  
  // 最大值用于计算点大小
  const maxCount = Math.max(...provincePoints.map(p => p.count), 1)
  const maxAmount = Math.max(...provincePoints.map(p => p.amount), 1)
  
  console.log('[map render] 省份数:', provincePoints.length, '活跃省份:', activeProvinces.length)

  // 计算省份热力图的最大值
  const maxProvinceValue = Math.max(...provinces.map((p) => p.value), 1)
  const maxProvinceCount = Math.max(...provinces.map((p) => p.count), 1)

  // 根据交易额计算省份颜色（渐变从深蓝到亮青色）
  const getProvinceColor = (value, count) => {
    if (value <= 0 && count <= 0) return '#0a1f3d'
    // 综合考虑交易额和商户数
    const ratio = Math.min((value / maxProvinceValue) * 0.7 + (count / maxProvinceCount) * 0.3, 1)
    // 颜色渐变：深蓝 -> 青蓝 -> 亮青
    const r = Math.round(10 + ratio * 81)  // 10 -> 91
    const g = Math.round(31 + ratio * 200) // 31 -> 231
    const b = Math.round(61 + ratio * 194) // 61 -> 255
    const alpha = 0.3 + ratio * 0.5
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  chartInstance.setOption({
    backgroundColor: 'transparent',
    // 图例
    legend: {
      show: true,
      orient: 'vertical',
      left: 10,
      top: 10,
      textStyle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
      },
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 10,
      data: [
        { name: '省份商户', icon: 'circle' },
        { name: '昨日活跃', icon: 'circle' },
      ],
    },
    geo: {
      map: 'china',
      roam: true,
      center: mapView.value.center,
      zoom: mapView.value.zoom,
      // 固定边距让地图居中显示
      top: 10,
      bottom: 10,
      left: 60,
      right: 10,
      aspectScale: 0.75,
      // 强制边界坐标，超出此范围的所有元素都会被裁剪
      boundingCoords: [
        [73, 54],   // 左上角 [经度, 纬度]
        [135, 17],  // 右下角 [经度, 纬度]
      ],
      silent: false,
      label: {
        show: true,
        color: 'rgba(143, 181, 255, 0.75)',
        fontSize: 10,
        formatter: (params) => {
          const province = provinces.find((p) => p.name === params.name)
          if (province && province.count > 0) {
            return `{name|${params.name}}\n{count|${province.count}家}`
          }
          return params.name
        },
        rich: {
          name: {
            fontSize: 10,
            color: 'rgba(143, 181, 255, 0.8)',
          },
          count: {
            fontSize: 9,
            color: '#ffd166',
            padding: [2, 0, 0, 0],
          },
        },
      },
      itemStyle: {
        areaColor: '#0a1f3d',
        borderColor: '#1c4b8e',
        borderWidth: 1,
        shadowColor: 'rgba(0, 80, 180, 0.3)',
        shadowBlur: 10,
      },
      emphasis: {
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
        },
        itemStyle: {
          areaColor: '#1e5cb3',
          borderColor: '#5be7ff',
          borderWidth: 2,
          shadowColor: 'rgba(91, 231, 255, 0.6)',
          shadowBlur: 20,
        },
      },
      select: {
        label: {
          show: true,
          color: '#fff',
        },
        itemStyle: {
          areaColor: '#1e4b9c',
        },
      },
      regions: provinces.map((p) => ({
        name: p.name,
        itemStyle: {
          areaColor: getProvinceColor(p.value, p.count),
        },
      })),
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 25, 50, 0.96)',
      borderColor: 'rgba(91, 231, 255, 0.4)',
      borderWidth: 1,
      borderRadius: 8,
      padding: 0,
      textStyle: {
        color: '#fff',
      },
      extraCssText: 'box-shadow: 0 4px 20px rgba(0, 80, 180, 0.4);',
      formatter: (params) => {
        // 省份 tooltip
        if (params.componentType === 'geo') {
          const province = provinces.find((p) => p.name === params.name)
          if (province) {
            const activityRate = province.count > 0 ? ((province.highlight / province.count) * 100).toFixed(1) : 0
            return `
              <div style="padding: 12px 16px; min-width: 160px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(91, 231, 255, 0.2);">
                  <div style="width: 8px; height: 8px; background: linear-gradient(135deg, #5be7ff, #3b9fff); border-radius: 50%; margin-right: 8px;"></div>
                  <strong style="font-size: 15px; color: #fff;">${params.name}</strong>
                </div>
                <div style="display: grid; gap: 6px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.6); font-size: 12px;">商户数量</span>
                    <span style="color: #5be7ff; font-weight: 600;">${province.count} 家</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.6); font-size: 12px;">昨日活跃</span>
                    <span style="color: #ffd166; font-weight: 600;">${province.highlight} 家</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: rgba(255,255,255,0.6); font-size: 12px;">活跃率</span>
                    <span style="color: #06d6a0; font-weight: 600;">${activityRate}%</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <span style="color: rgba(255,255,255,0.6); font-size: 12px;">累计交易</span>
                    <span style="color: #ff628c; font-weight: 600; font-size: 13px;">¥${formatAmount(province.value)}</span>
                  </div>
                </div>
              </div>
            `
          }
          return `
            <div style="padding: 10px 14px;">
              <strong style="color: rgba(255,255,255,0.9);">${params.name}</strong>
              <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 4px;">暂无商户数据</div>
            </div>
          `
        }
        // 省份聚合点 tooltip
        const data = params.data || {}
        const isActive = data.highlight
        return `
          <div style="padding: 12px 16px; min-width: 160px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(91, 231, 255, 0.2);">
              <div style="width: 8px; height: 8px; background: ${isActive ? '#ffd166' : '#ff9664'}; border-radius: 50%; margin-right: 8px; box-shadow: 0 0 8px ${isActive ? '#ffd166' : '#ff9664'};"></div>
              <strong style="font-size: 14px; color: #fff;">${data.name || '未知省份'}</strong>
            </div>
            <div style="display: grid; gap: 5px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5); font-size: 12px;">商户数量</span>
                <span style="color: #5be7ff; font-weight: 600;">${data.count || 0} 家</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: rgba(255,255,255,0.5); font-size: 12px;">昨日活跃</span>
                <span style="color: #ffd166; font-weight: 600;">${data.highlightCount || 0} 家</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
                <span style="color: rgba(255,255,255,0.5); font-size: 12px;">累计交易</span>
                <span style="color: #ff628c; font-weight: 600; font-size: 13px;">¥${formatAmount(data.amount || 0)}</span>
              </div>
            </div>
          </div>
        `
      },
    },
    // 视觉映射控件 - 显示交易额颜色渐变
    visualMap: {
      show: true,
      type: 'continuous',
      min: 0,
      max: maxProvinceValue > 0 ? maxProvinceValue : 100000,
      left: 10,
      bottom: 30,
      text: ['高', '低'],
      textStyle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
      },
      inRange: {
        color: ['#0a1f3d', '#1a3b5c', '#2a5b8c', '#3b9fff', '#5be7ff'],
      },
      calculable: false,
      orient: 'vertical',
      itemWidth: 12,
      itemHeight: 100,
      hoverLink: false,
      seriesIndex: -1, // 不应用到任何 series，仅作为图例说明
    },
    series: [
      // 无活跃的省份 - 橙色气泡
      {
        name: '省份商户',
        type: 'scatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        clip: true,
        zlevel: 2,
        symbol: 'circle',
        symbolSize: (val) => {
          const count = val[2] || 0
          const ratio = Math.sqrt(count / maxCount)
          return Math.max(14, Math.min(45, 14 + ratio * 31))
        },
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
            { offset: 0, color: 'rgba(255, 150, 100, 1)' },
            { offset: 0.5, color: 'rgba(255, 120, 80, 0.8)' },
            { offset: 1, color: 'rgba(255, 100, 60, 0.3)' },
          ]),
          opacity: 0.9,
          shadowBlur: 12,
          shadowColor: 'rgba(255, 120, 80, 0.5)',
        },
        data: inactiveProvinces,
      },
      // 昨日活跃省份 - 金色涟漪
      {
        name: '昨日活跃',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        clip: true,
        zlevel: 3,
        rippleEffect: {
          period: 3,
          scale: 2.5,
          brushType: 'stroke',
          color: 'rgba(255, 209, 102, 0.6)',
        },
        symbol: 'circle',
        symbolSize: (val) => {
          const count = val[2] || 0
          const ratio = Math.sqrt(count / maxCount)
          return Math.max(18, Math.min(55, 18 + ratio * 37))
        },
        itemStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
            { offset: 0, color: 'rgba(255, 230, 150, 1)' },
            { offset: 0.4, color: 'rgba(255, 209, 102, 0.9)' },
            { offset: 1, color: 'rgba(255, 180, 50, 0.4)' },
          ]),
          shadowBlur: 20,
          shadowColor: 'rgba(255, 209, 102, 0.8)',
        },
        data: activeProvinces,
      },
    ],
  })
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const stopRippleLoop = () => {
  if (rippleTimer) {
    clearInterval(rippleTimer)
    rippleTimer = null
  }
}

// 涟漪显示数量（同时显示多个点的涟漪，增加到5个让画面更丰富）
const RIPPLE_BATCH_SIZE = 5

const startRippleLoop = () => {
  stopRippleLoop()
  if (!highlightSequence.value.length) {
    renderChart()
    return
  }
  rippleIndex.value = 0
  // 缩短间隔到2秒，让动画更流畅
  rippleTimer = window.setInterval(() => {
    const total = highlightSequence.value.length
    if (!total) {
      rippleIndex.value = 0
      renderChart()
      return
    }
    rippleIndex.value = (rippleIndex.value + 1) % Math.ceil(total / RIPPLE_BATCH_SIZE)
    renderChart()
  }, 2000)
  renderChart()
}

// 修改 activeRipplePoints 以支持批量显示，并确保坐标有效
const activeRipplePoints = computed(() => {
  const sequence = highlightSequence.value
  if (!sequence.length) {
    return []
  }
  const batchIndex = rippleIndex.value % Math.ceil(sequence.length / RIPPLE_BATCH_SIZE)
  const startIdx = batchIndex * RIPPLE_BATCH_SIZE
  // 最终过滤：确保涟漪点坐标在严格范围内（与 isValidCoordinate 保持一致）
  return sequence.slice(startIdx, startIdx + RIPPLE_BATCH_SIZE).filter((item) => {
    const lng = item.value[0]
    const lat = item.value[1]
    return lng >= 80 && lng <= 127 && lat >= 22 && lat <= 48
  })
})

watch(
  highlightSequence,
  () => {
    rippleIndex.value = 0
    startRippleLoop()
  },
  { deep: true, immediate: true }
)

watch(
  activeRipplePoints,
  () => renderChart(),
  { deep: true }
)

const applyMapView = () => {
  if (!chartInstance) return
  chartInstance.setOption({
    geo: {
      center: mapView.value.center,
      zoom: mapView.value.zoom,
    },
  })
}

const handleZoomChange = (delta) => {
  mapView.value = {
    ...mapView.value,
    zoom: clamp(mapView.value.zoom + delta, 0.8, 5),
  }
  applyMapView()
}

const handleZoomIn = () => handleZoomChange(0.2)
const handleZoomOut = () => handleZoomChange(-0.2)
const handleResetMap = () => {
  mapView.value = {
    center: [...computedMapCenter.value],
    zoom: DEFAULT_MAP_ZOOM,
  }
  applyMapView()
}

const cleanupGeoEvents = () => {
  if (chartInstance && geoRoamHandler) {
    chartInstance.off('georoam', geoRoamHandler)
    geoRoamHandler = null
  }
}

const bindGeoEvents = () => {
  if (!chartInstance) return
  cleanupGeoEvents()
  geoRoamHandler = () => {
    const geoOption = chartInstance.getOption()?.geo?.[0]
    if (!geoOption) {
      return
    }
    const nextCenter = Array.isArray(geoOption.center) ? [...geoOption.center] : mapView.value.center
    const nextZoom = typeof geoOption.zoom === 'number' ? geoOption.zoom : mapView.value.zoom
    mapView.value = {
      center: nextCenter,
      zoom: nextZoom,
    }
  }
  chartInstance.on('georoam', geoRoamHandler)
}

watch(
  computedMapCenter,
  (center) => {
    mapView.value = {
      ...mapView.value,
      center: [...center],
    }
    applyMapView()
  },
  { immediate: true }
)

const initChart = async () => {
  await loadChinaGeoJson()
  if (!mapRef.value) return
  if (chartInstance) {
    cleanupGeoEvents()
    chartInstance.dispose()
  }
  chartInstance = echarts.init(mapRef.value)
  renderChart()
  bindGeoEvents()
  applyMapView()
}

const startTicker = () => {
  stopTicker()
  if (!primaryTickerItems.value.length) return
  tickerTimer = window.setInterval(() => {
    tickerIndex.value = (tickerIndex.value + 1) % primaryTickerItems.value.length
  }, Math.max(5, tickerInterval.value) * 1000)
}

const stopTicker = () => {
  if (tickerTimer) {
    clearInterval(tickerTimer)
    tickerTimer = null
  }
}

const startLeadTicker = () => {
  stopLeadTicker()
  if (!leadTickerItems.value.length) return
  const interval = Math.max(6, tickerInterval.value + 2) * 1000
  leadTickerTimer = window.setInterval(() => {
    leadTickerIndex.value = (leadTickerIndex.value + 1) % leadTickerItems.value.length
  }, interval)
}

const stopLeadTicker = () => {
  if (leadTickerTimer) {
    clearInterval(leadTickerTimer)
    leadTickerTimer = null
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    const res = await request.get('/api/open/v1/data-cockpit', { params: { range: 30 } })
    if (res?.code !== 0) {
      throw new Error(res?.message || '获取数据失败')
    }
    summary.value = res.data?.summary || summary.value
    mapInfo.value = res.data?.map || mapInfo.value
    ticker.value = res.data?.ticker || ticker.value
    meta.value = {
      generated_at: res.data?.generated_at,
      range: res.data?.range,
    }
    tickerIndex.value = 0
    leadTickerIndex.value = 0
    await nextTick()
    initChart()
    startTicker()
    startLeadTicker()
  } catch (error) {
    console.error('[public-cockpit] fetch failed', error)
    ElMessage.error(error.message || '获取驾驶舱数据失败')
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

watch(
  () => mapPoints.value,
  () => renderChart(),
  { deep: true }
)

onMounted(() => {
  initChart()
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopTicker()
  stopLeadTicker()
  stopRippleLoop()
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    cleanupGeoEvents()
    chartInstance.dispose()
    chartInstance = null
  }
})

const formatAmount = (value) => {
  const num = Number(value) || 0
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatCurrency = (value) => `¥${formatAmount(value)}`
const formatInteger = (value) => (Number(value) || 0).toLocaleString()

const sourceLabel = (source) => {
  switch (source) {
    case 'meituan':
      return '美团'
    case 'starpay':
      return '星驿付'
    case 'lead':
      return '进件'
    default:
      return '未知来源'
  }
}
</script>

<style scoped lang="scss">
.public-cockpit {
  min-height: 100vh;
  padding: 32px;
  background: radial-gradient(circle at top, #081832, #030c1c 70%);
  color: #e2e8ff;

  h2 {
    margin: 0;
  }

  .hero {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding: 24px 32px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(18, 31, 68, 0.9), rgba(6, 12, 28, 0.95));
    box-shadow: 0 10px 40px rgba(8, 26, 52, 0.5);

    &__eyebrow {
      letter-spacing: 6px;
      font-size: 12px;
      color: #5be7ff;
      margin: 0 0 6px;
    }

    h1 {
      margin: 0 0 8px;
    }

    p {
      margin: 0;
      color: rgba(255, 255, 255, 0.75);
    }

    &__meta {
      text-align: right;

      p {
        margin-bottom: 6px;
      }
    }
  }

  .summary-grid {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
  }

  .summary-card {
    background: rgba(9, 20, 47, 0.8);
    border-radius: 16px;
    color: #fff;

    &__label {
      font-size: 14px;
      opacity: 0.7;
      margin: 0 0 8px;
    }

    &__value {
      font-size: 28px;
      font-weight: 600;
      margin: 0;

      small {
        font-size: 14px;
        margin-left: 6px;
      }
    }

    &__desc {
      margin-top: 6px;
      font-size: 13px;
      opacity: 0.7;
    }
  }

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 0 0 12px;
  padding: 0;

  p {
    margin: 4px 0 0;
    color: rgba(255, 255, 255, 0.7);
  }
}

  .badge {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    font-size: 12px;

    &.highlight {
      border-color: #ffd166;
      color: #ffd166;
    }
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .source-filter {
    display: flex;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(17, 34, 70, 0.6);

    :deep(.el-checkbox) {
      color: #c8d9ff;
      margin-right: 0;
    }

    :deep(.el-checkbox__label) {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    :deep(small) {
      opacity: 0.7;
    }
  }

  .map-section {
    margin-top: 20px;
    background: linear-gradient(135deg, rgba(8, 18, 44, 0.95) 0%, rgba(5, 12, 35, 0.95) 100%);
    border-radius: 20px;
    padding: 16px 20px 12px;
    border: 1px solid rgba(91, 231, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 40, 100, 0.2);
  }

  .map-wrapper {
    display: flex;
    gap: 16px;
    min-height: 460px;
  }

  .map-canvas {
    flex: 2;
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(3, 9, 28, 0.95) 0%, rgba(5, 15, 40, 0.98) 100%);
    position: relative;
    height: clamp(360px, 52vw, 620px);
    overflow: hidden !important;
    border: 1px solid rgba(28, 75, 142, 0.3);
    box-shadow: inset 0 0 60px rgba(0, 60, 120, 0.15);
    /* 强制裁剪超出容器的内容 - 多重保障 */
    clip-path: inset(0 round 18px);
    /* 创建新的绘制上下文，阻止任何子元素绘制到外部 */
    contain: strict;  /* 使用 strict 更强的隔离 */
    isolation: isolate;
    /* 确保 z-index 层叠上下文 */
    z-index: 0;
  }

  .map-chart {
    width: 100%;
    height: 100%;
    /* 强制裁剪所有 canvas 子元素 */
    overflow: hidden !important;
    position: relative;
    /* 额外的裁剪保障 */
    clip-path: inset(0);
    contain: paint;
  }

  .map-chart canvas,
  .map-chart > div {
    /* 确保 canvas 和所有子元素不会溢出父容器 */
    max-width: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
  }

  .map-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(3, 9, 28, 0.6);
  }

  .map-controls {
    position: absolute;
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 2;
  }

  .map-control-btn {
    width: 44px;
    height: 44px;
    border: 1px solid rgba(91, 231, 255, 0.3);
    border-radius: 12px;
    background: rgba(10, 45, 90, 0.85);
    color: #fff;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-weight: 600;
    backdrop-filter: blur(8px);
  }

  .map-control-btn:hover {
    background: rgba(26, 92, 170, 0.95);
    border-color: rgba(91, 231, 255, 0.6);
    transform: scale(1.05);
    box-shadow: 0 0 15px rgba(91, 231, 255, 0.3);
  }

  .map-control-btn.reset {
    font-size: 14px;
  }

  .map-side {
    flex: 1;
    background: linear-gradient(180deg, rgba(4, 12, 36, 0.9) 0%, rgba(6, 16, 42, 0.95) 100%);
    border-radius: 16px;
    padding: 12px 16px;
    border: 1px solid rgba(28, 75, 142, 0.25);
  }

  .map-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__item {
      padding: 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        transform: translateX(4px);
      }

      &.highlight {
        border-color: rgba(255, 209, 102, 0.6);
        box-shadow: 0 0 16px rgba(255, 209, 102, 0.15);
        background: rgba(255, 209, 102, 0.05);

        .dot {
          background: #ffd166;
          box-shadow: 0 0 8px rgba(255, 209, 102, 0.6);
        }
      }
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff4d6d;
      }
    }

    &__meta,
    &__amount {
      font-size: 13px;
      margin: 4px 0;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .ticker-section {
    margin-top: 32px;
  }

  .ticker-columns {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
  }

  .ticker-card {
    background: rgba(9, 19, 46, 0.85);
    border-radius: 18px;
    color: #fff;
  }

  .ticker-leads {
    display: flex;
    flex-direction: column;
  }

  .ticker-current {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .ticker-source {
    padding: 6px 14px;
    border-radius: 999px;
    text-transform: uppercase;
    font-size: 12px;

    &.src-meituan {
      background: rgba(91, 231, 255, 0.15);
      color: #5be7ff;
    }
    &.src-starpay {
      background: rgba(147, 112, 219, 0.15);
      color: #9370db;
    }
    &.src-lead {
      background: rgba(255, 98, 140, 0.15);
      color: #ff628c;
    }
  }

  .ticker-msg {
    margin: 0;
    font-size: 16px;
  }

  .ticker-sub {
    margin: 4px 0 0;
    opacity: 0.7;
    font-size: 13px;
  }

  .ticker-empty {
    text-align: center;
  }

  .lead-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
    }

    small {
      opacity: 0.7;
    }
  }

  .lead-list {
    max-height: 280px;
  }

  .lead-item {
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    &:last-child {
      border-bottom: none;
    }

    &.active {
      animation: heartbeat 1.5s infinite;
      background: rgba(255, 216, 102, 0.08);
      border-radius: 12px;
    }
  }

  .lead-title {
    margin: 0;
    font-weight: 600;
  }

  .lead-meta,
  .lead-institution,
  .lead-status {
    margin: 4px 0 0;
    font-size: 13px;
    opacity: 0.75;
  }

  .ticker-queue {
    max-height: 220px;

    &__item {
      display: grid;
      grid-template-columns: 120px 100px 1fr;
      gap: 12px;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  @media (max-width: 1200px) {
    padding: 20px;

    .map-wrapper {
      flex-direction: column;
      min-height: auto;
    }

    .map-canvas,
    .map-side {
      min-height: 360px;
    }

    .ticker-columns {
      grid-template-columns: 1fr;
    }
  }
}

@keyframes heartbeat {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 216, 102, 0.4);
  }
  30% {
    transform: scale(1.03);
    box-shadow: 0 0 15px 4px rgba(255, 216, 102, 0.35);
  }
  60% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 216, 102, 0.25);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 216, 102, 0);
  }
}
</style>
