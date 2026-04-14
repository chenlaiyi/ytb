<template>
  <el-dialog
    title="编辑设备信息"
    v-model="dialogVisible"
    width="650px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="device-edit-dialog"
  >
    <div v-loading="loading" element-loading-text="加载中...">
      <el-form 
        ref="deviceForm" 
        :model="form" 
        :rules="rules" 
        label-width="100px" 
        label-position="right"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="设备编号">
              <el-input v-model="deviceInfo.device_number" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="device_name">
              <el-input v-model="form.device_name" placeholder="请输入设备名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="启用" value="E"></el-option>
                <el-option label="禁用" value="D"></el-option>
                <el-option label="维护中" value="maintenance"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="所属VIP" prop="app_user_id" class="vip-selector">
              <el-select
                v-model="form.app_user_id"
                filterable
                remote
                reserve-keyword
                placeholder="请输入VIP用户姓名或手机号搜索"
                :remote-method="remoteSearchAppUsers"
                :loading="userLoading"
                @change="handleAppUserChange"
                style="width: 100%;"
              >
                <el-option
                  v-for="item in appUserOptions"
                  :key="item.id"
                  :label="item.label"
                  :value="item.id"
                >
                  <div class="user-option">
                    <img 
                      :src="item.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" 
                      class="user-avatar"
                    />
                    <div class="user-info">
                      <div class="user-name">{{ item.name }}</div>
                      <div class="user-id">ID: {{ item.id }}</div>
                    </div>
                    <span class="user-phone">{{ item.phone || '无手机号' }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="form-tip">* 请仔细选择正确的VIP用户，避免误操作</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计费模式" prop="billing_mode">
              <el-select v-model="form.billing_mode" style="width: 100%">
                <el-option label="流量计费" value="1"></el-option>
                <el-option label="包年计费" value="0"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item 
              v-if="form.billing_mode === '1'" 
              label="剩余流量" 
              prop="surplus_flow"
            >
              <el-input-number 
                v-model="form.surplus_flow" 
                :min="0" 
                :precision="0" 
                style="width: 100%;"
                controls-position="right"
              ></el-input-number>
              <span class="unit">L</span>
            </el-form-item>
            
            <el-form-item 
              v-if="form.billing_mode === '0'" 
              label="剩余天数" 
              prop="remaining_days"
            >
              <el-input-number 
                v-model="form.remaining_days" 
                :min="0" 
                :precision="0" 
                style="width: 100%;"
                controls-position="right"
              ></el-input-number>
              <span class="unit">天</span>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="是否自用" prop="is_self_use">
              <el-radio-group v-model="form.is_self_use">
                <el-radio :label="0">销售设备</el-radio>
                <el-radio :label="1">自用设备</el-radio>
              </el-radio-group>
              <div class="form-tip">* 自用设备不计入业务员销量统计</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input 
                v-model="form.remark" 
                type="textarea" 
                :rows="3" 
                placeholder="请输入备注信息"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { getTappDeviceDetail, updateTappDevice, getAppUsersList } from '@/api/tapp-device';

export default {
  name: 'TappDeviceEditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    deviceId: {
      type: [Number, String],
      required: true
    }
  },
  data() {
    return {
      dialogVisible: false,
      loading: false,
      userLoading: false,
      submitLoading: false,
      deviceInfo: {
        device_number: '',
        dealer_name: '',
        client_name: '',
        imei: '',
        network_status: '',
      },
      form: {
        device_name: '',
        app_user_id: null,
        app_user_name: '',
        status: '',
        billing_mode: '',
        surplus_flow: 0,
        remaining_days: 0,
        remark: '',
        is_self_use: 0
      },
      appUserOptions: [],
      rules: {
        device_name: [
          { max: 50, message: '设备名称不能超过50个字符', trigger: 'blur' }
        ],
        app_user_id: [
          { required: true, message: '请选择所属VIP用户', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择设备状态', trigger: 'change' }
        ],
        billing_mode: [
          { required: true, message: '请选择计费模式', trigger: 'change' }
        ],
        surplus_flow: [
          { required: true, message: '请输入剩余流量', trigger: 'blur' }
        ],
        remaining_days: [
          { required: true, message: '请输入剩余天数', trigger: 'blur' }
        ]
      }
    };
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val && this.deviceId) {
        this.fetchDeviceDetail();
      }
    },
    dialogVisible(val) {
      this.$emit('update:visible', val);
    }
  },
  methods: {
    fetchDeviceDetail() {
      this.loading = true;
      getTappDeviceDetail(this.deviceId)
        .then(response => {
          if (response.code === 0) {
            const device = response.data;
            this.deviceInfo = {
              device_number: device.device_number || '',
              dealer_name: device.dealer_name || '',
              client_name: device.client_name || '',
              imei: device.imei || '',
              network_status: device.network_status || '',
            };
            
            this.form = {
              device_name: device.device_name || '',
              app_user_id: device.app_user_id || null,
              app_user_name: device.app_user_name || '',
              status: device.status || 'E',
              billing_mode: device.billing_mode || '1',
              surplus_flow: parseInt(device.surplus_flow) || 0,
              remaining_days: parseInt(device.remaining_days) || 0,
              remark: device.remark || '',
              is_self_use: device.is_self_use === undefined ? 0 : parseInt(device.is_self_use)
            };
            
            // 如果已有VIP用户，初始化选项列表
            if (device.app_user_id && device.app_user_name) {
              this.appUserOptions = [{
                id: device.app_user_id,
                name: device.app_user_name,
                phone: device.app_user_phone || '',
                avatar: device.app_user_avatar || '',
                label: device.app_user_name
              }];
            } else {
              // 预加载VIP用户列表
              this.loadAppUsers();
            }
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
            message: '获取设备详情失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 2000
          });
        })
        .finally(() => {
          this.loading = false;
        });
    },
    remoteSearchAppUsers(query) {
      if (query !== '') {
        this.userLoading = true;
        
        getAppUsersList({ keyword: query })
          .then(response => {
            if (response.code === 0) {
              this.appUserOptions = response.data || [];
            } else {
              this.$notify({
                title: '错误',
                message: response.message || '获取VIP用户列表失败',
                type: 'error',
                duration: 2000
              });
              this.appUserOptions = [];
            }
          })
          .catch(error => {
            this.$notify({
              title: '错误',
              message: '搜索VIP用户失败: ' + (error.message || '未知错误'),
              type: 'error',
              duration: 2000
            });
            this.appUserOptions = [];
          })
          .finally(() => {
            this.userLoading = false;
          });
      } else {
        this.loadAppUsers();
      }
    },
    loadAppUsers() {
      this.userLoading = true;
      
      getAppUsersList({})
        .then(response => {
          if (response.code === 0) {
            this.appUserOptions = response.data || [];
          } else {
            this.$notify({
              title: '提示',
              message: '获取VIP用户列表失败：' + (response.message || '未知错误'),
              type: 'warning',
              duration: 3000
            });
            this.appUserOptions = [];
          }
        })
        .catch(error => {
          this.$notify({
            title: '错误',
            message: '获取VIP用户列表失败: ' + (error.message || '未知错误'),
            type: 'error',
            duration: 2000
          });
          this.appUserOptions = [];
        })
        .finally(() => {
          this.userLoading = false;
        });
    },
    handleAppUserChange(value) {
      const selectedUser = this.appUserOptions.find(user => user.id === value);
      if (selectedUser) {
        this.form.app_user_name = selectedUser.name;
      } else {
        this.form.app_user_name = '';
      }
    },
    submitForm() {
      this.$refs.deviceForm.validate(valid => {
        if (valid) {
          this.submitLoading = true;
          
          updateTappDevice(this.deviceId, this.form)
            .then(response => {
              if (response.code === 0) {
                this.$notify({
                  title: '成功',
                  message: '更新设备信息成功',
                  type: 'success',
                  duration: 2000
                });
                this.$emit('saved', true);
                this.dialogVisible = false;
              } else {
                this.$notify({
                  title: '错误',
                  message: response.message || '更新设备信息失败',
                  type: 'error',
                  duration: 2000
                });
              }
            })
            .catch(error => {
              this.$notify({
                title: '错误',
                message: '更新设备信息失败: ' + (error.message || '未知错误'),
                type: 'error',
                duration: 2000
              });
            })
            .finally(() => {
              this.submitLoading = false;
            });
        }
      });
    },
    handleClose() {
      this.$emit('update:visible', false);
    }
  }
};
</script>

<style lang="scss" scoped>
.device-edit-dialog {
  ::v-deep .el-dialog__body {
    padding: 20px 30px;
  }
  
  .form-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.2;
  }
  
  .unit {
    margin-left: 8px;
    color: #606266;
  }
  
  .vip-selector {
    ::v-deep .el-select-dropdown__item {
      padding: 0;
      height: auto;
    }
  }
  
  .user-option {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      margin-right: 12px;
      object-fit: cover;
    }
    
    .user-info {
      flex: 1;
      
      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        line-height: 1.4;
      }
      
      .user-id {
        font-size: 12px;
        color: #909399;
        line-height: 1.2;
      }
    }
    
    .user-phone {
      margin-left: auto;
      color: #8492a6;
      font-size: 13px;
    }
  }
}
</style> 