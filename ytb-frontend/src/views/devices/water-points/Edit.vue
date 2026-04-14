<template>
  <div class="water-point-edit">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">编辑取水点</h1>
        <p class="page-description">修改取水点信息</p>
      </div>
      <div class="header-actions">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="pageLoading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 表单区域 -->
    <div v-else class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="large"
      >
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="取水点名称" prop="name">
                <el-input
                  v-model="form.name"
                  placeholder="请输入取水点名称"
                  maxlength="255"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact_person">
                <el-input
                  v-model="form.contact_person"
                  placeholder="请输入联系人姓名"
                  maxlength="100"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系电话" prop="contact_phone">
                <el-input
                  v-model="form.contact_phone"
                  placeholder="请输入联系电话"
                  maxlength="20"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="form.status" placeholder="请选择状态">
                  <el-option label="正常营业" value="active" />
                  <el-option label="暂停营业" value="inactive" />
                  <el-option label="维护中" value="maintenance" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>地址信息</span>
            </div>
          </template>

          <!-- 地址选择组件 -->
          <AddressSelector
            v-model="addressData"
            @location-change="handleLocationChange"
          />
        </el-card>

        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>位置信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="纬度" prop="latitude">
                <el-input
                  v-model="form.latitude"
                  placeholder="请输入纬度"
                  type="number"
                  step="0.000001"
                  readonly
                  style="background-color: #f5f7fa;"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="经度" prop="longitude">
                <el-input
                  v-model="form.longitude"
                  placeholder="请输入经度"
                  type="number"
                  step="0.000001"
                  readonly
                  style="background-color: #f5f7fa;"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-alert
              title="位置信息说明"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>经纬度将根据您填写的地址自动获取，也可以使用GPS定位功能。</p>
                <p>建议优先使用地址解析功能，可以获得更准确的位置信息。</p>
              </template>
            </el-alert>
          </el-form-item>
        </el-card>

        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>营业信息</span>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="营业状态">
                <el-switch
                  v-model="form.is_open"
                  active-text="营业中"
                  inactive-text="已关闭"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开始营业时间">
                <el-time-picker
                  v-model="form.open_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择开始时间"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="结束营业时间">
                <el-time-picker
                  v-model="form.close_time"
                  format="HH:mm"
                  value-format="HH:mm"
                  placeholder="选择结束时间"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="价格信息">
                <el-input
                  v-model="form.price"
                  placeholder="如：1元/升"
                  maxlength="100"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="营业时间">
                <el-input
                  v-model="form.business_hours"
                  placeholder="如：周一至周日 8:00-22:00"
                  maxlength="200"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>其他信息</span>
            </div>
          </template>

          <el-form-item label="描述信息">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入取水点描述信息"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="标签">
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              placeholder="请选择或输入标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in commonTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="设施">
            <el-checkbox-group v-model="form.facilities">
              <el-checkbox label="停车场">停车场</el-checkbox>
              <el-checkbox label="洗手间">洗手间</el-checkbox>
              <el-checkbox label="休息区">休息区</el-checkbox>
              <el-checkbox label="WiFi">WiFi</el-checkbox>
              <el-checkbox label="充电桩">充电桩</el-checkbox>
              <el-checkbox label="便利店">便利店</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-card>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button size="large" @click="handleBack">取消</el-button>
          <el-button type="primary" size="large" :loading="loading" @click="handleSubmit">
            保存
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Location } from '@element-plus/icons-vue'
import { getWaterPointDetail, updateWaterPoint } from '@/api/v1/waterPoint'
import AddressSelector from '@/components/AddressSelector.vue'

export default {
  name: 'WaterPointEdit',
  components: {
    ArrowLeft,
    Location,
    AddressSelector
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const formRef = ref()
    const loading = ref(false)
    const pageLoading = ref(true)

    // 表单数据
    const form = reactive({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      contact_person: '',
      contact_phone: '',
      open_time: '',
      close_time: '',
      status: 'active',
      is_open: true,
      description: '',
      tags: [],
      price: '',
      business_hours: '',
      facilities: []
    })

    // 地址数据
    const addressData = reactive({
      province: '',
      city: '',
      district: '',
      detailAddress: '',
      fullAddress: '',
      latitude: '',
      longitude: ''
    })

    // 常用标签
    const commonTags = [
      '24小时营业',
      '免费停车',
      '环境优美',
      '交通便利',
      '设备先进',
      '服务优质'
    ]

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入取水点名称', trigger: 'blur' },
        { min: 2, max: 255, message: '长度在 2 到 255 个字符', trigger: 'blur' }
      ],
      contact_person: [
        { required: true, message: '请输入联系人', trigger: 'blur' },
        { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      contact_phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }

    // 解析地址信息
    const parseAddressFromString = (addressString) => {
      // 这里可以实现地址解析逻辑
      // 简单实现：将完整地址放在详细地址中
      return {
        province: '',
        city: '',
        district: '',
        detailAddress: addressString,
        fullAddress: addressString
      }
    }

    // 获取取水点详情
    const fetchWaterPointDetail = async () => {
      try {
        pageLoading.value = true
        const response = await getWaterPointDetail(route.params.id)
        
        if (response.code === 0) {
          const data = response.data
          // 填充表单数据
          Object.keys(form).forEach(key => {
            if (data[key] !== undefined) {
              form[key] = data[key]
            }
          })
          
          // 处理特殊字段
          form.latitude = data.latitude?.toString() || ''
          form.longitude = data.longitude?.toString() || ''
          form.tags = data.tags || []
          form.facilities = data.facilities || []

          // 解析地址信息到addressData
          if (data.address) {
            const parsedAddress = parseAddressFromString(data.address)
            Object.assign(addressData, {
              ...parsedAddress,
              latitude: form.latitude,
              longitude: form.longitude
            })
          }
        } else {
          ElMessage.error(response.message || '获取取水点详情失败')
          router.push('/devices/water-points')
        }
      } catch (error) {
        console.error('获取取水点详情失败:', error)
        ElMessage.error('获取取水点详情失败')
        router.push('/devices/water-points')
      } finally {
        pageLoading.value = false
      }
    }

    // 处理位置变化
    const handleLocationChange = (locationInfo) => {
      form.latitude = locationInfo.latitude.toString()
      form.longitude = locationInfo.longitude.toString()
      
      // 如果有地址信息，更新表单地址
      if (locationInfo.address) {
        form.address = locationInfo.address
      }
    }

    // 监听地址数据变化，同步到表单
    watch(addressData, (newAddressData) => {
      if (newAddressData.fullAddress) {
        form.address = newAddressData.fullAddress
      }
      if (newAddressData.latitude) {
        form.latitude = newAddressData.latitude
      }
      if (newAddressData.longitude) {
        form.longitude = newAddressData.longitude
      }
    }, { deep: true })

    // 提交表单
    const handleSubmit = async () => {
      try {
        await formRef.value.validate()
        
        // 验证地址信息
        if (!form.address) {
          ElMessage.error('请填写完整的地址信息')
          return
        }
        
        if (!form.latitude || !form.longitude) {
          ElMessage.error('请获取位置的经纬度信息')
          return
        }
        
        loading.value = true

        const submitData = {
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude)
        }

        await updateWaterPoint(route.params.id, submitData)
        ElMessage.success('取水点更新成功')
        router.push('/devices/water-points')
      } catch (error) {
        console.error('更新失败:', error)
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else {
          ElMessage.error('更新失败，请重试')
        }
      } finally {
        loading.value = false
      }
    }

    // 返回列表
    const handleBack = () => {
      router.push('/devices/water-points')
    }

    // 组件挂载时获取数据
    onMounted(() => {
      fetchWaterPointDetail()
    })

    return {
      formRef,
      form,
      rules,
      loading,
      pageLoading,
      commonTags,
      addressData,
      handleLocationChange,
      handleSubmit,
      handleBack
    }
  }
}
</script>

<style scoped>
.water-point-edit {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.page-description {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions .el-button {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255,255,255,0.3);
  border-color: rgba(255,255,255,0.5);
}

.loading-container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.form-container {
  max-width: 1200px;
  margin: 0 auto;
}

.form-card {
  margin-bottom: 20px;
  border-radius: 10px;
  overflow: hidden;
}

.form-card :deep(.el-card__header) {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.card-header {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.form-tip {
  margin-left: 10px;
  color: #666;
  font-size: 14px;
}

.form-actions {
  text-align: center;
  padding: 30px 0;
}

.form-actions .el-button {
  min-width: 120px;
  margin: 0 10px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}
</style> 