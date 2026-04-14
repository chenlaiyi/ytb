<template>
  <div class="app-container" :class="{ 'detail-embedded': isEmbedded }">
    <div v-loading="loading" element-loading-text="加载中...">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span><strong>设备基本信息</strong></span>
            <div class="card-actions" v-if="!isEmbedded">
              <el-button 
                style="margin-left: 10px;" 
                type="primary" 
                size="small" 
                @click="$router.push(`tapp-devices/${deviceId}/edit`)"
              >
                编辑
              </el-button>
              <el-button 
                type="default" 
                size="small" 
                @click="$router.go(-1)"
              >
                返回
              </el-button>
            </div>
          </div>
        </template>

        <el-descriptions :column="2" border>
            <el-descriptions-item label="设备编号">{{ device.device_number }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ device.device_name }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ device.device_type }}</el-descriptions-item>
            <el-descriptions-item label="所属渠道商">{{ device.dealer_name }}</el-descriptions-item>
            <el-descriptions-item label="所属客户">{{ device.client_name }}</el-descriptions-item> 
          <el-descriptions-item label="IMEI">{{ device.imei }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="box-card mt-20">
        <template #header>
          <div class="card-header">
            <span><strong>设备控制</strong></span>
          </div>
        </template>
        <div class="control-grid">
          <el-button type="success" plain :loading="controlLoading === 'power_on'" @click="handleControl('power_on')">
            开机
          </el-button>
          <el-button type="danger" plain :loading="controlLoading === 'power_off'" @click="handleControl('power_off')">
            关机
          </el-button>
          <el-button type="warning" plain :loading="controlLoading === 'flush'" @click="handleControl('flush')">
            强冲
          </el-button>
        </div>
      </el-card>

      <el-card class="box-card mt-20">
        <template #header>
          <div class="card-header">
            <span><strong>设备状态</strong></span>
          </div>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备状态">
            <el-tag :type="getStatusType(device.status)">{{ device.status_text }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="网络状态">
            <el-tag :type="device.network_status === '1' ? 'success' : 'info'">
              {{ device.network_status === '1' ? '在线' : '离线' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否自用">
            <el-tag :type="device.is_self_use == 1 ? 'warning' : 'success'">
              {{ device.is_self_use == 1 ? '自用设备' : '销售设备' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计费模式">
            {{ device.billing_mode === '1' ? '流量计费' : '包年计费' }}
          </el-descriptions-item>
          <el-descriptions-item label="剩余用量">
            <span v-if="device.billing_mode === '1'">{{ device.surplus_flow || 0 }}L</span>
            <span v-else>{{ device.remaining_days || 0 }}天</span>
          </el-descriptions-item>
          <el-descriptions-item label="累计过滤水量">{{ device.cumulative_filtration_flow || 0 }}L</el-descriptions-item>
          <el-descriptions-item label="激活时间">{{ device.activate_date }}</el-descriptions-item>
          <el-descriptions-item label="最后在线时间">{{ device.last_online_time }}</el-descriptions-item>
          <el-descriptions-item label="最后同步时间">{{ device.last_sync_time }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 滤芯寿命卡片 -->
      <el-card class="box-card mt-20">
        <template #header>
          <div class="card-header">
            <span><strong>滤芯寿命</strong></span>
          </div>
        </template>

        <div class="filter-life-container">
          <div class="filter-life-item">
            <h4>PP棉滤芯</h4>
            <el-progress 
              :percentage="device.f1_life_percent || 0" 
              :status="getFilterLifeStatus(device.f1_life_percent)"
              :stroke-width="15"
            ></el-progress>
            <div class="filter-life-data">
              <span>当前值: {{ device.f1_flux || 0 }}</span>
              <span>最大值: {{ device.f1_flux_max || 0 }}</span>
            </div>
          </div>

          <div class="filter-life-item">
            <h4>活性炭滤芯</h4>
            <el-progress 
              :percentage="device.f2_life_percent || 0" 
              :status="getFilterLifeStatus(device.f2_life_percent)"
              :stroke-width="15"
            ></el-progress>
            <div class="filter-life-data">
              <span>当前值: {{ device.f2_flux || 0 }}</span>
              <span>最大值: {{ device.f2_flux_max || 0 }}</span>
            </div>
          </div>

          <div class="filter-life-item">
            <h4>RO反渗透滤芯</h4>
            <el-progress 
              :percentage="device.f3_life_percent || 0" 
              :status="getFilterLifeStatus(device.f3_life_percent)"
              :stroke-width="15"
            ></el-progress>
            <div class="filter-life-data">
              <span>当前值: {{ device.f3_flux || 0 }}</span>
              <span>最大值: {{ device.f3_flux_max || 0 }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="box-card mt-20">
        <template #header>
          <div class="card-header">
            <span><strong>滤芯管理</strong></span>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col v-for="item in filterList" :key="item.key" :xs="24" :md="8">
            <div class="filter-card">
              <div class="filter-title">{{ item.name }}</div>
              <el-progress :percentage="item.percent" :status="item.percent <= 20 ? 'exception' : item.percent <= 50 ? 'warning' : 'success'" />
              <div class="filter-meta">
                <span>剩余：{{ item.flux ?? '-' }}</span>
                <span>总量：{{ item.max ?? '-' }}</span>
              </div>
              <el-button type="primary" plain size="small" :loading="filterLoading === item.key" @click="handleResetFilter(item.key)"
                :disabled="!item.max">
                复位
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="box-card mt-20">
        <template #header>
          <div class="card-header">
            <span><strong>其他信息</strong></span>
          </div>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备地址">{{ device.address || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ device.remark || '暂无' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ device.create_date }}</el-descriptions-item>
          <el-descriptions-item label="最后更新时间">{{ device.update_date }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getTappDeviceDetail, controlTappDevice, resetTappDeviceFilter } from '@/api/tapp-device';

export default {
  name: 'TappDeviceDetail',
  props: {
    id: {
      type: [String, Number],
      default: null
    },
    embedded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      deviceId: null,
      loading: false,
      device: {
        device_number: '',
        device_name: '',
        device_type: '',
        dealer_name: '',
        client_name: '',
        imei: '',
        status: '',
        status_text: '',
        network_status: '',
        billing_mode: '',
        surplus_flow: 0,
        remaining_days: 0,
        cumulative_filtration_flow: 0,
        activate_date: '',
        last_online_time: '',
        last_sync_time: '',
        address: '',
        remark: '',
        create_date: '',
        update_date: '',
        is_self_use: 0,
        f1_flux: null,
        f1_flux_max: null,
        f1_life_percent: null,
        f2_flux: null,
        f2_flux_max: null,
        f2_life_percent: null,
        f3_flux: null,
        f3_flux_max: null,
        f3_life_percent: null
      },
      controlLoading: '',
      filterLoading: ''
    };
  },
  computed: {
    isEmbedded() {
      return this.embedded;
    },
    filterList() {
      return [
        {
          key: 'f1',
          name: 'PP棉滤芯',
          flux: this.device.f1_flux,
          max: this.device.f1_flux_max,
          percent: this.getFilterPercent(this.device.f1_flux, this.device.f1_flux_max)
        },
        {
          key: 'f2',
          name: '活性炭滤芯',
          flux: this.device.f2_flux,
          max: this.device.f2_flux_max,
          percent: this.getFilterPercent(this.device.f2_flux, this.device.f2_flux_max)
        },
        {
          key: 'f3',
          name: 'RO反渗透滤芯',
          flux: this.device.f3_flux,
          max: this.device.f3_flux_max,
          percent: this.getFilterPercent(this.device.f3_flux, this.device.f3_flux_max)
        }
      ];
    }
  },
  watch: {
    id: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.deviceId = newVal;
          this.fetchDeviceDetail();
        }
      }
    }
  },
  created() {
    if (!this.id) {
      this.deviceId = this.$route.params.id;
      this.fetchDeviceDetail();
    }
  },
  methods: {
    fetchDeviceDetail() {
      this.loading = true;
      getTappDeviceDetail(this.deviceId)
        .then(response => {
          if (response.code === 0) {
            this.device = response.data;
          } else {
            this.$notify({
              title: '错误',
              message: response.message || '获取设备详情失败',
              type: 'error',
              duration: 2000
            });
          }
        })
        .catch(error => {
          this.$notify({
            title: '错误',
            message: '获取设备详情失败: ' + error.message,
            type: 'error',
            duration: 2000
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    handleControl(action) {
      if (!this.deviceId) return;
      const actionLabel = action === 'flush' ? '强冲' : action === 'power_off' ? '关机' : '开机';
      this.$confirm(`确定执行${actionLabel}操作吗？`, '提示', {
        type: 'warning'
      }).then(() => {
        this.controlLoading = action;
        controlTappDevice(this.deviceId, { action })
          .then(response => {
            if (response.code === 0) {
              this.$message.success('指令已发送');
            } else {
              this.$message.error(response.message || '操作失败');
            }
          })
          .catch(error => {
            this.$message.error(error.response?.data?.message || error.message || '操作失败');
          })
          .finally(() => {
            this.controlLoading = '';
          });
      }).catch(() => {});
    },
    handleResetFilter(filterKey) {
      if (!this.deviceId) return;
      this.$confirm('确定复位该滤芯吗？', '提示', {
        type: 'warning'
      }).then(() => {
        this.filterLoading = filterKey;
        resetTappDeviceFilter(this.deviceId, { filter: filterKey })
          .then(response => {
            if (response.code === 0) {
              this.$message.success('指令已发送');
              this.fetchDeviceDetail();
            } else {
              this.$message.error(response.message || '复位失败');
            }
          })
          .catch(error => {
            this.$message.error(error.response?.data?.message || error.message || '复位失败');
          })
          .finally(() => {
            this.filterLoading = '';
          });
      }).catch(() => {});
    },
    getStatusType(status) {
      const statusMap = {
        'E': 'success',
        'D': 'danger',
        'maintenance': 'warning'
      };
      return statusMap[status] || 'info';
    },
    getFilterPercent(value, max) {
      const current = Number(value);
      const total = Number(max);
      if (!total || isNaN(total)) {
        return 0;
      }
      if (current === null || current === undefined || isNaN(current)) {
        return 0;
      }
      const percent = (current / total) * 100;
      return percent > 100 ? 100 : Number(percent.toFixed(1));
    },
    getFilterLifeStatus(percent) {
      if (percent === null || percent === undefined) {
        return '';
      } else if (percent <= 20) {
        return 'danger';
      } else if (percent <= 50) {
        return 'warning';
      } else {
        return 'success';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.mt-20 {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  margin-bottom: 20px;
  
  .el-descriptions {
    width: 100%;
  }
}

.filter-life-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px;

  .filter-life-item {
    text-align: center;
    min-width: 220px;
    flex: 1;
    margin-bottom: 15px;
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);

    h4 {
      margin-bottom: 15px;
      color: #303133;
      font-weight: 600;
    }

    .el-progress {
      margin-bottom: 15px;
    }

    .filter-life-data {
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      padding: 0 10px;
      
      span {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

.control-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-card {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-title {
  font-weight: 600;
  color: #303133;
}

.filter-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #606266;
}

@media (max-width: 768px) {
  .filter-life-container {
    flex-direction: column;
    
    .filter-life-item {
      width: 100%;
    }
  }
}
 .card-actions {
  display: flex;
  gap: 8px;
}

.detail-embedded {
  padding: 0;
}
</style>
