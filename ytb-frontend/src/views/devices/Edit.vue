<template>
  <div class="app-container">
    <div v-loading="loading" element-loading-text="加载中...">
      <el-card class="box-card">
        <template #header>
          <div class="card-header">
            <span><strong>编辑设备信息</strong></span>
            <el-button 
              style="float: right;" 
              type="default" 
              size="small" 
              @click="$router.go(-1)"
            >
              返回
            </el-button>
          </div>
        </template>

        <el-form 
          ref="deviceForm" 
          :model="deviceForm" 
          :rules="rules" 
          label-width="120px" 
          label-position="right"
        >
          <el-form-item label="设备编号">
            <span>{{ device.device_number }}</span>
          </el-form-item>
          
          <el-form-item label="设备名称" prop="device_name">
            <el-input v-model="deviceForm.device_name" placeholder="请输入设备名称" />
          </el-form-item>
          
          <el-form-item label="所属渠道商">
            <span>{{ device.dealer_name }}</span>
          </el-form-item>
          
          <el-form-item label="所属客户">
            <span>{{ device.client_name }}</span>
          </el-form-item>
          
          <el-form-item label="所属VIP" prop="app_user_id">
            <el-select
              v-model="deviceForm.app_user_id"
              filterable
              remote
              reserve-keyword
              placeholder="请输入VIP用户姓名或手机号搜索"
              :remote-method="remoteSearchAppUsers"
              :loading="loading"
              @change="handleAppUserChange"
              style="width: 100%;"
            >
              <el-option
                v-for="item in appUserOptions"
                :key="item.id"
                :label="item.label"
                :value="item.id"
              >
                <div style="display: flex; align-items: center;">
                  <img 
                    :src="item.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" 
                    style="width: 36px; height: 36px; border-radius: 50%; margin-right: 12px; object-fit: cover;"
                  />
                  <div>
                    <div style="font-size: 14px; font-weight: 500;">{{ item.name }}</div>
                    <div style="font-size: 12px; color: #8492a6;">ID: {{ item.id }}</div>
                  </div>
                  <span style="margin-left: auto; color: #8492a6; font-size: 13px">{{ item.phone || '无手机号' }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="form-tip" style="color: #909399; font-size: 12px; margin-top: 4px;">
              * 请仔细选择正确的VIP用户，避免误操作
            </div>
          </el-form-item>
          
          <el-form-item label="IMEI">
            <span>{{ device.imei }}</span>
          </el-form-item>

          <el-form-item label="设备状态" prop="status">
            <el-select v-model="deviceForm.status" placeholder="请选择设备状态">
              <el-option label="启用" value="E" />
              <el-option label="禁用" value="D" />
              <el-option label="维护中" value="maintenance" />
            </el-select>
          </el-form-item>

          <el-form-item label="计费模式" prop="billing_mode">
            <el-select v-model="deviceForm.billing_mode" placeholder="请选择计费模式">
              <el-option label="流量计费" value="1" />
              <el-option label="包年计费" value="0" />
            </el-select>
          </el-form-item>

          <el-form-item 
            v-if="deviceForm.billing_mode === '1'" 
            label="剩余流量(L)" 
            prop="surplus_flow"
          >
            <el-input-number 
              v-model="deviceForm.surplus_flow" 
              :min="0" 
              :precision="0" 
              style="width: 200px;" 
            />
          </el-form-item>

          <el-form-item 
            v-if="deviceForm.billing_mode === '0'" 
            label="剩余天数" 
            prop="remaining_days"
          >
            <el-input-number 
              v-model="deviceForm.remaining_days" 
              :min="0" 
              :precision="0" 
              style="width: 200px;" 
            />
          </el-form-item>

          <el-form-item label="是否自用" prop="is_self_use">
            <el-radio-group v-model="deviceForm.is_self_use">
              <el-radio :label="0">销售设备</el-radio>
              <el-radio :label="1">自用设备</el-radio>
            </el-radio-group>
            <div class="form-tip" style="color: #909399; font-size: 12px; margin-top: 4px;">
              * 自用设备不计入业务员销量统计
            </div>
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input 
              v-model="deviceForm.remark" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入备注信息"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getTappDeviceDetail, updateTappDevice, getAppUsersList } from '@/api/tapp-device';

export default {
  name: 'TappDeviceEdit',
  data() {
    return {
      deviceId: null,
      loading: false,
      submitLoading: false,
      device: {
        device_number: '',
        device_name: '',
        dealer_name: '',
        client_name: '',
        app_user_id: null,
        app_user_name: '',
        imei: '',
        status: '',
        network_status: '',
        billing_mode: '',
        surplus_flow: 0,
        remaining_days: 0,
        is_self_use: 0
      },
      deviceForm: {
        device_name: '',
        status: '',
        billing_mode: '',
        surplus_flow: 0,
        remaining_days: 0,
        app_user_id: null,
        app_user_name: '',
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
  created() {
    this.deviceId = this.$route.params.id;
    this.fetchDeviceDetail();
    this.loadAppUsers(); // 加载VIP用户列表
  },
  methods: {
    fetchDeviceDetail() {
      this.loading = true;
      getTappDeviceDetail(this.deviceId)
        .then(response => {
          if (response.code === 0) {
            this.device = response.data;
            this.deviceForm = {
              device_name: this.device.device_name,
              app_user_id: this.device.app_user_id,
              app_user_name: this.device.app_user_name,
              status: this.device.status,
              billing_mode: this.device.billing_mode,
              surplus_flow: parseInt(this.device.surplus_flow) || 0,
              remaining_days: parseInt(this.device.remaining_days) || 0,
              remark: this.device.remark,
              is_self_use: this.device.is_self_use === undefined ? 0 : parseInt(this.device.is_self_use)
            };
            
            // 如果已有VIP用户，初始化选项列表
            if (this.device.app_user_id && this.device.app_user_name) {
              this.appUserOptions = [{
                id: this.device.app_user_id,
                name: this.device.app_user_name,
                phone: '', // 没有电话号码信息
                label: this.device.app_user_name
              }];
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
            message: '获取设备详情失败: ' + error.message,
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
        this.loading = true;
        
        // 使用30秒超时
        const timeout = setTimeout(() => {
          this.loading = false;
          this.$notify({
            title: '提示',
            message: '搜索VIP用户超时，请重试',
            type: 'warning',
            duration: 3000
          });
        }, 30000);
        
        getAppUsersList({ keyword: query })
          .then(response => {
            clearTimeout(timeout);
            
            // 检查响应是否为有效JSON格式
            if (typeof response === 'object' && response !== null) {
              if (response.code === 0) {
                this.appUserOptions = response.data || [];
              } else {
                console.error('搜索VIP用户API返回错误:', response.message);
                this.$notify({
                  title: '错误',
                  message: response.message || '获取VIP用户列表失败',
                  type: 'error',
                  duration: 2000
                });
                // 设置为空数组避免undefined错误
                this.appUserOptions = [];
              }
            } else {
              // 处理非JSON响应
              console.error('搜索VIP用户API返回格式错误:', response);
              this.$notify({
                title: '错误',
                message: '获取VIP用户列表失败: API返回格式错误',
                type: 'error',
                duration: 2000
              });
              // 设置为空数组避免undefined错误
              this.appUserOptions = [];
            }
          })
          .catch(error => {
            clearTimeout(timeout);
            
            console.error('搜索VIP用户失败:', error);
            let errorMsg = '搜索VIP用户失败: ';
            if (error.response) {
              console.error('错误状态码:', error.response.status);
              console.error('错误数据:', error.response.data);
              errorMsg += `(${error.response.status}) ${error.response.data?.message || error.message || '未知错误'}`;
            } else {
              errorMsg += error.message || '网络错误';
            }
            this.$notify({
              title: '错误',
              message: errorMsg,
              type: 'error',
              duration: 5000
            });
            
            // 设置为空数组避免undefined错误
            this.appUserOptions = [];
          })
          .finally(() => {
            this.loading = false;
          });
      } else {
        // 如果查询为空，获取所有VIP用户
        this.loadAppUsers();
      }
    },
    handleAppUserChange(value) {
      // 当选择VIP用户时，自动填充用户名
      const selectedUser = this.appUserOptions.find(user => user.id === value);
      if (selectedUser) {
        this.deviceForm.app_user_name = selectedUser.name;
      } else {
        this.deviceForm.app_user_name = '';
      }
    },
    submitForm() {
      this.$refs.deviceForm.validate(valid => {
        if (valid) {
          this.submitLoading = true;
          
          // 保存原页面参数，用于返回
          const query = { ...this.$route.query };
          
          updateTappDevice(this.deviceId, this.deviceForm)
            .then(response => {
              if (response.code === 0) {
                this.$notify({
                  title: '成功',
                  message: '更新设备信息成功',
                  type: 'success',
                  duration: 2000
                });
                // 返回设备列表页
                this.$router.push({
                  path: `/tapp-devices`,
                  query: query // 保留查询参数
                });
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
                message: '更新设备信息失败: ' + error.message,
                type: 'error',
                duration: 2000
              });
            })
            .finally(() => {
              this.submitLoading = false;
            });
        } else {
          return false;
        }
      });
    },
    resetForm() {
      this.$refs.deviceForm.resetFields();
      // 重新获取设备详情
      this.fetchDeviceDetail();
    },
    loadAppUsers() {
      this.loading = true;
      
      // 使用30秒超时
      const timeout = setTimeout(() => {
        this.loading = false;
        this.$notify({
          title: '提示',
          message: '获取VIP用户列表超时，请重试',
          type: 'warning',
          duration: 3000
        });
      }, 30000);
      
      getAppUsersList({})
        .then(response => {
          clearTimeout(timeout);
          
          // 检查响应是否为有效JSON格式
          if (typeof response === 'object' && response !== null) {
            if (response.code === 0) {
              this.appUserOptions = response.data || [];
            } else {
              console.error('获取VIP用户列表API返回错误:', response.message);
              this.$notify({
                title: '提示',
                message: '获取VIP用户列表失败：' + (response.message || '未知错误'),
                type: 'warning',
                duration: 3000
              });
              
              // 设置默认数据以避免前端显示错误
              this.appUserOptions = [];
            }
          } else {
            // 处理非JSON响应
            console.error('获取VIP用户列表API返回格式错误:', response);
            this.$notify({
              title: '提示',
              message: '获取VIP用户列表失败：API返回格式错误',
              type: 'warning',
              duration: 3000
            });
            
            // 设置默认数据以避免前端显示错误
            this.appUserOptions = [];
          }
        })
        .catch(error => {
          clearTimeout(timeout);
          
          console.error('获取VIP用户列表失败:', error);
          // 显示详细错误信息
          let errorMsg = '获取VIP用户列表失败: ';
          if (error.response) {
            console.error('错误状态码:', error.response.status);
            console.error('错误数据:', error.response.data);
            errorMsg += `(${error.response.status}) ${error.response.data?.message || error.message || '未知错误'}`;
          } else {
            errorMsg += error.message || '网络错误';
          }
          this.$notify({
            title: '错误',
            message: errorMsg,
            type: 'error',
            duration: 5000
          });
          
          // 设置默认空数组以避免前端显示错误
          this.appUserOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  margin-bottom: 20px;
}
</style> 