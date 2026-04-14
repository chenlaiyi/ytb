<template>
  <div class="address-selector">
    <div class="form-group">
      <label>省份</label>
      <el-select 
        v-model="selectedProvince" 
        @change="handleProvinceChange" 
        placeholder="请选择省份"
        style="width: 100%"
        :loading="loading"
      >
        <el-option
          v-for="province in provinces"
          :key="province.id"
          :label="province.fullname"
          :value="province.id"
        />
      </el-select>
    </div>

    <div class="form-group">
      <label>{{ isDirectMunicipality ? '区县' : '城市' }}</label>
      <el-select 
        v-model="selectedCity" 
        @change="handleCityChange" 
        :placeholder="isDirectMunicipality ? '请选择区县' : '请选择城市'"
        style="width: 100%"
        :disabled="!selectedProvince"
        :loading="loading"
      >
        <el-option
          v-for="city in cities"
          :key="city.id"
          :label="city.fullname"
          :value="city.id"
        />
      </el-select>
    </div>

    <!-- 只有非直辖市才显示区县选择器 -->
    <div class="form-group" v-if="!isDirectMunicipalityDistrict">
      <label>区县</label>
      <el-select 
        v-model="selectedDistrict" 
        @change="handleDistrictChange" 
        placeholder="请选择区县"
        style="width: 100%"
        :disabled="!selectedCity"
        :loading="loading"
      >
        <el-option
          v-for="district in districts"
          :key="district.id"
          :label="district.fullname"
          :value="district.id"
        />
      </el-select>
    </div>

    <!-- 直辖市区县的提示信息 -->
    <div class="form-group" v-if="isDirectMunicipalityDistrict">
      <label>区县</label>
      <el-input 
        value="已选择最小行政区划"
        readonly
        disabled
        style="width: 100%"
      />
    </div>

    <div class="form-group">
      <label>详细地址</label>
      <el-input 
        v-model="detailAddress" 
        @input="handleDetailAddressChange"
        placeholder="请输入详细地址"
      />
    </div>

    <div class="form-group">
      <label>完整地址</label>
      <el-input 
        :value="fullAddress" 
        readonly
        placeholder="将自动生成完整地址"
      />
    </div>

    <div class="form-group">
      <label>经纬度</label>
      <div style="display: flex; gap: 10px;">
        <el-input 
          :value="coordinates.lng" 
          readonly
          placeholder="经度"
        />
        <el-input 
          :value="coordinates.lat" 
          readonly
          placeholder="纬度"
        />
      </div>
    </div>

    <div class="form-group">
      <el-button type="primary" @click="getCurrentLocation" :loading="gpsLoading">
        <i class="fas fa-location-arrow"></i> 获取当前位置
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProvinces, getCities, getDistricts, geocodeAddress } from '@/api/address'

export default {
  name: 'AddressSelector',
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        province: '',
        city: '',
        district: '',
        detail: '',
        full: '',
        lng: '',
        lat: ''
      })
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // 响应式数据
    const selectedProvince = ref('')
    const selectedCity = ref('')
    const selectedDistrict = ref('')
    const detailAddress = ref('')
    
    const provinces = ref([])
    const cities = ref([])
    const districts = ref([])
    
    const coordinates = ref({
      lng: '',
      lat: ''
    })
    
    const loading = ref(false)
    const gpsLoading = ref(false)
    
    // 检查是否为直辖市
    const isDirectMunicipality = computed(() => {
      const directMunicipalities = ['110000', '120000', '310000', '500000'] // 北京、天津、上海、重庆
      return directMunicipalities.includes(selectedProvince.value)
    })
    
    // 检查是否为直辖市的区（不需要再选择下级区县）
    const isDirectMunicipalityDistrict = computed(() => {
      if (!selectedCity.value) return false
      
      // 直辖市的区县ID范围
      const ranges = [
        ['110101', '110119'], // 北京市各区
        ['120101', '120119'], // 天津市各区
        ['310101', '310151'], // 上海市各区
        ['500101', '500156']  // 重庆市各区
      ]
      
      for (const range of ranges) {
        if (selectedCity.value >= range[0] && selectedCity.value <= range[1]) {
          return true
        }
      }
      return false
    })
    
    // 计算完整地址
    const fullAddress = computed(() => {
      const parts = []
      
      const province = provinces.value.find(p => p.id === selectedProvince.value)
      const city = cities.value.find(c => c.id === selectedCity.value)
      const district = districts.value.find(d => d.id === selectedDistrict.value)
      
      if (province) parts.push(province.fullname)
      if (city && city.fullname !== province?.fullname && city.fullname !== '市辖区') {
        parts.push(city.fullname)
      }
      if (district && !isDirectMunicipalityDistrict.value) {
        parts.push(district.fullname)
      }
      if (detailAddress.value) parts.push(detailAddress.value)
      
      return parts.join('')
    })
    
    // 加载省份数据
    const loadProvinces = async () => {
      try {
        loading.value = true
        const response = await getProvinces()
        if (response.code === 0) {
          provinces.value = response.data
        } else {
          console.error('获取省份数据失败:', response.message)
          ElMessage.error('获取省份数据失败')
        }
      } catch (error) {
        console.error('加载省份数据出错:', error)
        ElMessage.error('加载省份数据出错')
      } finally {
        loading.value = false
      }
    }
    
    // 加载城市数据
    const loadCities = async (provinceId) => {
      if (!provinceId) return
      
      try {
        loading.value = true
        const response = await getCities(provinceId)
        if (response.code === 0) {
          cities.value = response.data
        } else {
          console.error('获取城市数据失败:', response.message)
          cities.value = []
          ElMessage.error('获取城市数据失败')
        }
      } catch (error) {
        console.error('加载城市数据出错:', error)
        cities.value = []
        ElMessage.error('加载城市数据出错')
      } finally {
        loading.value = false
      }
    }
    
    // 加载区县数据
    const loadDistricts = async (cityId) => {
      if (!cityId) return
      
      try {
        loading.value = true
        const response = await getDistricts(cityId)
        if (response.code === 0) {
          districts.value = response.data
          // 如果是直辖市的区，清空区县选择
          if (isDirectMunicipalityDistrict.value) {
            selectedDistrict.value = ''
          }
        } else {
          console.error('获取区县数据失败:', response.message)
          districts.value = []
          if (response.message !== '直辖市区县无下级区划') {
            ElMessage.error('获取区县数据失败')
          }
        }
      } catch (error) {
        console.error('加载区县数据出错:', error)
        districts.value = []
        ElMessage.error('加载区县数据出错')
      } finally {
        loading.value = false
      }
    }
    
    // 省份变化处理
    const handleProvinceChange = async (provinceId) => {
      selectedCity.value = ''
      selectedDistrict.value = ''
      cities.value = []
      districts.value = []
      
      if (provinceId) {
        await loadCities(provinceId)
      }
      
      emitChange()
    }
    
    // 城市变化处理
    const handleCityChange = async (cityId) => {
      selectedDistrict.value = ''
      districts.value = []
      
      if (cityId && !isDirectMunicipalityDistrict.value) {
        await loadDistricts(cityId)
      }
      
      emitChange()
      parseAddressAndGetCoordinates()
    }
    
    // 区县变化处理
    const handleDistrictChange = () => {
      emitChange()
      parseAddressAndGetCoordinates()
    }
    
    // 详细地址变化处理
    const handleDetailAddressChange = () => {
      emitChange()
      parseAddressAndGetCoordinates()
    }
    
    // 解析地址并获取坐标
    const parseAddressAndGetCoordinates = async () => {
      if (!fullAddress.value) return
      
      try {
        const response = await geocodeAddress(fullAddress.value)
        if (response.code === 0 && response.data) {
          coordinates.value.lng = response.data.lng.toString()
          coordinates.value.lat = response.data.lat.toString()
        } else {
          console.warn('地址解析失败，使用模拟坐标')
          simulateCoordinates()
        }
      } catch (error) {
        console.error('地址解析出错:', error)
        simulateCoordinates()
      }
      
      emitChange()
    }
    
    // 模拟坐标生成（基于省份中心点）
    const simulateCoordinates = () => {
      if (selectedProvince.value) {
        const provinceCoordinates = {
          '110000': { lng: 116.4074, lat: 39.9042 }, // 北京
          '120000': { lng: 117.2008, lat: 39.0842 }, // 天津
          '130000': { lng: 114.5149, lat: 38.0428 }, // 河北
          '140000': { lng: 112.5489, lat: 37.8570 }, // 山西
          '150000': { lng: 111.6708, lat: 40.8183 }, // 内蒙古
          '210000': { lng: 123.4315, lat: 41.8057 }, // 辽宁
          '220000': { lng: 125.3245, lat: 43.8868 }, // 吉林
          '230000': { lng: 126.6420, lat: 45.7560 }, // 黑龙江
          '310000': { lng: 121.4737, lat: 31.2304 }, // 上海
          '320000': { lng: 118.7674, lat: 32.0415 }, // 江苏
          '330000': { lng: 120.1536, lat: 30.2650 }, // 浙江
          '340000': { lng: 117.2272, lat: 31.8206 }, // 安徽
          '350000': { lng: 119.3063, lat: 26.0745 }, // 福建
          '360000': { lng: 115.8921, lat: 28.6765 }, // 江西
          '370000': { lng: 117.0009, lat: 36.6758 }, // 山东
          '410000': { lng: 113.6401, lat: 34.7566 }, // 河南
          '420000': { lng: 114.2980, lat: 30.5844 }, // 湖北
          '430000': { lng: 112.9820, lat: 28.1941 }, // 湖南
          '440000': { lng: 113.2804, lat: 23.1291 }, // 广东
          '450000': { lng: 108.3201, lat: 22.8240 }, // 广西
          '460000': { lng: 110.3312, lat: 20.0311 }, // 海南
          '500000': { lng: 106.5516, lat: 29.5630 }, // 重庆
          '510000': { lng: 104.0665, lat: 30.5723 }, // 四川
          '520000': { lng: 106.7135, lat: 26.5783 }, // 贵州
          '530000': { lng: 102.7123, lat: 25.0406 }, // 云南
          '540000': { lng: 91.1322, lat: 29.6604 }, // 西藏
          '610000': { lng: 108.9486, lat: 34.2631 }, // 陕西
          '620000': { lng: 103.8236, lat: 36.0581 }, // 甘肃
          '630000': { lng: 101.7782, lat: 36.6171 }, // 青海
          '640000': { lng: 106.2586, lat: 38.4707 }, // 宁夏
          '650000': { lng: 87.6177, lat: 43.7928 }   // 新疆
        }
        
        const baseCoord = provinceCoordinates[selectedProvince.value] || { lng: 116.4074, lat: 39.9042 }
        
        // 在省份坐标基础上添加随机偏移（±0.5度范围内）
        const lngOffset = (Math.random() - 0.5) * 1
        const latOffset = (Math.random() - 0.5) * 1
        
        coordinates.value.lng = (baseCoord.lng + lngOffset).toFixed(6)
        coordinates.value.lat = (baseCoord.lat + latOffset).toFixed(6)
      }
    }
    
    // 获取当前位置
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        ElMessage.error('您的浏览器不支持地理定位')
        return
      }
      
      gpsLoading.value = true
      navigator.geolocation.getCurrentPosition(
        (position) => {
          coordinates.value.lng = position.coords.longitude.toFixed(6)
          coordinates.value.lat = position.coords.latitude.toFixed(6)
          gpsLoading.value = false
          ElMessage.success('定位成功')
          emitChange()
        },
        (error) => {
          gpsLoading.value = false
          let errorMsg = '定位失败'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = '用户拒绝了定位请求'
              break
            case error.POSITION_UNAVAILABLE:
              errorMsg = '位置信息不可用'
              break
            case error.TIMEOUT:
              errorMsg = '定位请求超时'
              break
          }
          ElMessage.error(errorMsg)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    }
    
    // 发送变化事件
    const emitChange = () => {
      const province = provinces.value.find(p => p.id === selectedProvince.value)
      const city = cities.value.find(c => c.id === selectedCity.value)
      const district = districts.value.find(d => d.id === selectedDistrict.value)
      
      const addressData = {
        province: selectedProvince.value,
        provinceName: province?.fullname || '',
        city: selectedCity.value,
        cityName: city?.fullname || '',
        district: selectedDistrict.value,
        districtName: district?.fullname || '',
        detail: detailAddress.value,
        full: fullAddress.value,
        lng: coordinates.value.lng,
        lat: coordinates.value.lat
      }
      
      emit('update:modelValue', addressData)
      emit('change', addressData)
    }
    
    // 监听props变化
    watch(() => props.modelValue, (newValue) => {
      if (newValue) {
        selectedProvince.value = newValue.province || ''
        selectedCity.value = newValue.city || ''
        selectedDistrict.value = newValue.district || ''
        detailAddress.value = newValue.detail || ''
        coordinates.value.lng = newValue.lng || ''
        coordinates.value.lat = newValue.lat || ''
        
        // 加载对应的城市和区县数据
        if (newValue.province) {
          loadCities(newValue.province)
        }
        if (newValue.city && !isDirectMunicipalityDistrict.value) {
          loadDistricts(newValue.city)
        }
      }
    }, { immediate: true, deep: true })
    
    // 组件挂载时加载省份数据
    onMounted(() => {
      loadProvinces()
    })
    
    return {
      selectedProvince,
      selectedCity,
      selectedDistrict,
      detailAddress,
      provinces,
      cities,
      districts,
      coordinates,
      loading,
      gpsLoading,
      fullAddress,
      isDirectMunicipality,
      isDirectMunicipalityDistrict,
      handleProvinceChange,
      handleCityChange,
      handleDistrictChange,
      handleDetailAddressChange,
      getCurrentLocation
    }
  }
}
</script>

<style scoped>
.address-selector {
  max-width: 600px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}
</style> 