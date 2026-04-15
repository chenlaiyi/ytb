<template>
  <div class="purifier-devices-container">
    <van-nav-bar
      title="我的设备"
      left-arrow
      @click-left="$router.back()"
    />
    
    <div v-if="loading" class="loading-block">
      <van-loading color="#1989fa" size="24px">加载中...</van-loading>
    </div>
    
    <div v-else-if="devices.length === 0" class="empty-block">
      <van-empty description="暂无设备" />
      <van-button type="primary" block @click="showAddDevice">添加设备</van-button>
    </div>
    
    <div v-else class="devices-list">
      <div class="action-bar">
        <van-button type="primary" icon="plus" size="small" @click="showAddDevice">添加设备</van-button>
      </div>
      
      <van-swipe-cell v-for="device in devices" :key="device.id">
        <van-cell-group class="device-item" :class="{ 'primary-device': device.is_primary }">
          <van-cell>
            <template #title>
              <div class="device-name">
                {{ device.device_name }}
                <van-tag v-if="device.is_primary" type="primary" size="small">主设备</van-tag>
                <van-tag v-if="device.network_status === 1" type="success" size="small">在线</van-tag>
                <van-tag v-else type="danger" size="small">离线</van-tag>
              </div>
            </template>
            <template #label>
              <div class="device-info">
                <div class="info-item">
                  <span class="label">设备ID：</span>
                  <span class="value">{{ device.device_id }}</span>
                </div>
                <div class="info-item" v-if="device.device_model">
                  <span class="label">型号：</span>
                  <span class="value">{{ device.device_model }}</span>
                </div>
                <div class="info-item" v-if="device.install_location">
                  <span class="label">安装位置：</span>
                  <span class="value">{{ device.install_location }}</span>
                </div>
                <div class="info-item">
                  <span class="label">计费模式：</span>
                  <span class="value">{{ device.billing_mode === 1 ? '流量计费' : '包年计费' }}</span>
                </div>
                <div class="info-item" v-if="device.billing_mode === 1">
                  <span class="label">剩余流量：</span>
                  <span class="value">{{ formatFlow(device.surplus_flow) }}</span>
                </div>
                <div class="info-item" v-else>
                  <span class="label">剩余天数：</span>
                  <span class="value">{{ device.remaining_days || 0 }}天</span>
                </div>
                <div class="info-item">
                  <span class="label">累计制水量：</span>
                  <span class="value">{{ formatFlow(device.cumulative_filtration_flow) }} (约{{ formatBottleCount(device.cumulative_filtration_flow) }}瓶)</span>
                </div>
                <div class="info-item">
                  <span class="label">水质信息：</span>
                  <span class="value">原水TDS: {{ device.raw_water_value || '未知' }} / 净水TDS: {{ device.purification_water_value || '未知' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">绑定时间：</span>
                  <span class="value">{{ formatDate(device.bind_time) }}</span>
                </div>
              </div>
            </template>
            <template #right-icon>
              <div class="device-actions">
                <van-button 
                  v-if="!device.is_primary" 
                  size="small" 
                  type="primary" 
                  @click="setPrimaryDevice(device.id)">
                  设为主设备
                </van-button>
                <van-button size="small" type="info" @click="showEditDevice(device)">编辑</van-button>
                <van-button size="small" type="success" @click="viewDeviceDetail(device)">详情</van-button>
              </div>
            </template>
          </van-cell>
        </van-cell-group>
        <template #right>
          <van-button square type="danger" text="删除" class="delete-button" @click="confirmDeleteDevice(device.id)" />
        </template>
      </van-swipe-cell>
    </div>
    
    <!-- 添加/编辑设备弹窗 -->
    <van-dialog
      v-model:show="showDialog"
      :title="isEditing ? '编辑设备' : '添加设备'"
      show-cancel-button
      @confirm="submitDeviceForm"
      :before-close="beforeDialogClose"
    >
      <div class="dialog-content">
        <van-form>
          <van-field
            v-model="deviceForm.device_name"
            name="device_name"
            label="设备名称"
            placeholder="请输入设备名称"
            :rules="[{ required: true, message: '请输入设备名称' }]"
          />
          
          <van-field
            v-model="deviceForm.device_id"
            name="device_id"
            label="设备UUID"
            placeholder="请输入设备UUID"
            :rules="[{ required: true, message: '请输入设备UUID' }]"
            :readonly="isEditing"
          />
          
          <van-field
            v-model="deviceForm.device_model"
            name="device_model"
            label="设备型号"
            placeholder="请输入设备型号（选填）"
          />
          
          <van-field
            v-model="deviceForm.install_location"
            name="install_location"
            label="安装位置"
            placeholder="如：客厅、厨房（选填）"
          />
          
          <van-field name="is_primary" label="设为主设备">
            <template #input>
              <van-switch v-model="deviceForm.is_primary" />
            </template>
          </van-field>
        </van-form>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  showToast, 
  showDialog,
  showSuccessToast,
  showFailToast 
} from 'vant';
import { 
  getUserPurifierDevices, 
  addPurifierDevice, 
  updatePurifierDevice, 
  deletePurifierDevice,
  setPrimaryPurifierDevice
} from '@/api/user';

export default {
  name: 'PurifierDevices',
  
  setup() {
    const router = useRouter();
    const loading = ref(true);
    const devices = ref([]);
    const showDialog = ref(false);
    const isEditing = ref(false);
    const selectedDeviceId = ref(null);
    
    const deviceForm = reactive({
      device_name: '',
      device_id: '',
      device_model: '',
      install_location: '',
      is_primary: false
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 格式化流量
    const formatFlow = (flow) => {
      if (!flow) return '0L';
      return `${parseFloat(flow).toFixed(1)}L`;
    };
    
    // 格式化瓶数 (1L = 2瓶)
    const formatBottleCount = (flow) => {
      if (!flow) return '0';
      return `${Math.round(parseFloat(flow) * 2)}`;
    };
    
    // 获取设备列表
    const getDevicesList = async () => {
      loading.value = true;
      try {
        const res = await getUserPurifierDevices();
        if (res.code === 0) {
          devices.value = res.data || [];
        } else {
          showFailToast(res.message || '获取设备列表失败');
        }
      } catch (error) {
        console.error('获取设备列表失败:', error);
        showFailToast('获取设备列表失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 显示添加设备弹窗
    const showAddDevice = () => {
      isEditing.value = false;
      selectedDeviceId.value = null;
      
      // 重置表单
      Object.keys(deviceForm).forEach(key => {
        deviceForm[key] = '';
      });
      deviceForm.is_primary = false;
      
      showDialog.value = true;
    };
    
    // 显示编辑设备弹窗
    const showEditDevice = (device) => {
      isEditing.value = true;
      selectedDeviceId.value = device.id;
      
      // 填充表单
      deviceForm.device_name = device.device_name || '';
      deviceForm.device_id = device.device_id || '';
      deviceForm.device_model = device.device_model || '';
      deviceForm.install_location = device.install_location || '';
      deviceForm.is_primary = device.is_primary === 1;
      
      showDialog.value = true;
    };
    
    // 查看设备详情
    const viewDeviceDetail = (device) => {
      router.push(`/purifier/device-detail/${device.device_id}`);
    };
    
    // 确认删除设备
    const confirmDeleteDevice = (deviceId) => {
      showDialog({
        title: '删除设备',
        message: '确定要删除该设备吗？此操作不可恢复。',
        showCancelButton: true,
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      })
        .then(() => {
          deleteDevice(deviceId);
        })
        .catch(() => {
          // 用户取消删除
        });
    };
    
    // 删除设备
    const deleteDevice = async (deviceId) => {
      try {
        loading.value = true;
        const res = await deletePurifierDevice(deviceId);
        if (res.code === 0) {
          showSuccessToast('删除成功');
          await getDevicesList();
        } else {
          showFailToast(res.message || '删除失败');
        }
      } catch (error) {
        console.error('删除设备失败:', error);
        showFailToast('删除设备失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 设置主设备
    const setPrimaryDevice = async (deviceId) => {
      try {
        loading.value = true;
        const res = await setPrimaryPurifierDevice(deviceId);
        if (res.code === 0) {
          showSuccessToast('设置成功');
          await getDevicesList();
        } else {
          showFailToast(res.message || '设置失败');
        }
      } catch (error) {
        console.error('设置主设备失败:', error);
        showFailToast('设置主设备失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 提交设备表单
    const submitDeviceForm = async () => {
      try {
        loading.value = true;
        
        let res;
        if (isEditing.value) {
          // 编辑设备
          res = await updatePurifierDevice(selectedDeviceId.value, {
            device_name: deviceForm.device_name,
            device_model: deviceForm.device_model,
            install_location: deviceForm.install_location,
            is_primary: deviceForm.is_primary
          });
        } else {
          // 添加设备
          res = await addPurifierDevice({
            device_name: deviceForm.device_name,
            device_id: deviceForm.device_id,
            device_model: deviceForm.device_model,
            install_location: deviceForm.install_location,
            is_primary: deviceForm.is_primary
          });
        }
        
        if (res.code === 0) {
          showSuccessToast(isEditing.value ? '更新成功' : '添加成功');
          showDialog.value = false;
          await getDevicesList();
        } else {
          showFailToast(res.message || (isEditing.value ? '更新失败' : '添加失败'));
          return false; // 阻止对话框关闭
        }
      } catch (error) {
        console.error(isEditing.value ? '更新设备失败:' : '添加设备失败:', error);
        showFailToast(isEditing.value ? '更新设备失败' : '添加设备失败');
        return false; // 阻止对话框关闭
      } finally {
        loading.value = false;
      }
      
      return true; // 允许对话框关闭
    };
    
    // 对话框关闭前的回调
    const beforeDialogClose = (action, done) => {
      if (action === 'confirm') {
        // 若点击确认，则由submitDeviceForm处理
        done(false);
      } else {
        // 点击取消则直接关闭
        done();
      }
    };
    
    onMounted(() => {
      getDevicesList();
    });
    
    return {
      loading,
      devices,
      showDialog,
      isEditing,
      deviceForm,
      formatDate,
      formatFlow,
      formatBottleCount,
      showAddDevice,
      showEditDevice,
      viewDeviceDetail,
      confirmDeleteDevice,
      setPrimaryDevice,
      submitDeviceForm,
      beforeDialogClose
    };
  }
};
</script>

<style scoped>
.purifier-devices-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.loading-block, .empty-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
}

.empty-block .van-button {
  margin-top: 20px;
  width: 80%;
}

.devices-list {
  padding: 16px;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}

.device-item {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.primary-device {
  border-left: 4px solid #1989fa;
}

.device-name {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  flex-wrap: wrap;
}

.device-name .van-tag {
  margin-left: 8px;
}

.device-info {
  margin-top: 8px;
}

.info-item {
  display: flex;
  margin-bottom: 4px;
  font-size: 13px;
}

.info-item .label {
  color: #999;
  width: 90px;
}

.info-item .value {
  color: #666;
  word-break: break-all;
  flex: 1;
}

.device-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.delete-button {
  height: 100%;
}

.dialog-content {
  padding: 20px 16px;
}
</style> 