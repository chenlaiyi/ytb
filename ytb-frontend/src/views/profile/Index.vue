<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
        </div>
      </template>
      
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="100px"
        class="profile-form"
      >
        <!-- 头像上传 -->
        <el-form-item label="头像" prop="avatar">
          <div class="avatar-upload">
            <div class="avatar-container" @click="selectAvatar">
              <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
              <div v-else class="avatar-placeholder">
                <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                <div class="upload-text">点击上传头像</div>
              </div>
              <div class="avatar-overlay">
                <el-icon><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </div>
            <input 
              ref="avatarInputRef" 
              type="file" 
              accept="image/jpeg,image/png,image/jpg,image/gif" 
              style="display: none" 
              @change="handleFileSelect"
            />
            <div class="avatar-tips">
              <p>支持 JPG、PNG 格式，文件大小不超过 2MB</p>
              <p v-if="avatarFile">已选择: {{ avatarFile.name }}</p>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="profileForm.name" placeholder="请输入姓名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <!-- 微信绑定 -->
        <el-form-item label="微信绑定">
          <div class="wechat-binding">
            <div v-if="profileForm.wechat_openid" class="wechat-bound">
              <div class="wechat-info">
                <img v-if="profileForm.wechat_avatar" :src="profileForm.wechat_avatar" class="wechat-avatar" />
                <div class="wechat-details">
                  <div class="wechat-nickname">{{ profileForm.wechat_nickname || '微信用户' }}</div>
                  <div class="wechat-status">已绑定微信</div>
                  <div class="wechat-time">绑定时间：{{ formatWechatTime(profileForm.wechat_bound_at) }}</div>
                </div>
              </div>
              <div class="wechat-actions">
                <el-switch 
                  v-model="profileForm.wechat_enabled" 
                  @change="updateWechatStatus"
                  active-text="启用微信登录" 
                  inactive-text="禁用微信登录"
                />
                <el-button type="danger" size="small" @click="unbindWechat" :loading="unbindLoading">
                  解除绑定
                </el-button>
              </div>
            </div>
            <div v-else class="wechat-unbound">
              <div v-if="!showWechatBinding" class="wechat-tips-section">
                <div class="wechat-tips">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>绑定微信后可使用微信扫码登录</span>
                </div>
                <el-button type="primary" @click="bindWechat" :loading="bindLoading">
                  绑定微信
                </el-button>
              </div>
              
              <!-- 微信绑定状态提示 -->
              <div v-else class="wechat-binding-status">
                <div class="binding-status-card">
                  <el-icon class="status-icon"><Loading /></el-icon>
                  <h4>微信绑定进行中</h4>
                  <p>微信绑定窗口已打开，请在新窗口中扫码完成绑定</p>
                  <div class="status-actions">
                    <el-button @click="cancelWechatBinding" size="large">
                      取消绑定
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="updateProfile" :loading="loading">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, h } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Camera, ChatDotRound, Loading, Close, Refresh } from '@element-plus/icons-vue';
import adminApi from '@/api/admin';
import { getWechatBindUrl, checkWechatBindStatus, unbindWechat, toggleWechatLogin, bindWechatAfterLogin } from '@/api/v1/auth';
import authApi from '@/api/v1/auth';
import { getAdminToken, clearAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'Profile',
  components: {
    Plus,
    Camera,
    ChatDotRound,
    Loading,
    Close,
    Refresh
  },
  setup() {
    const profileFormRef = ref();
    const avatarInputRef = ref();
    const loading = ref(false);
    const avatarFile = ref(null);
    const bindLoading = ref(false);
    const unbindLoading = ref(false);
    const showWechatBinding = ref(false);
    const wechatBindData = reactive({
      qrcode_url: '',
      js_config: null,
      state: ''
    });
    
    const profileForm = reactive({
      username: '',
      name: '',
      email: '',
      phone: '',
      avatar: '',
      wechat_openid: '',
      wechat_unionid: '',
      wechat_nickname: '',
      wechat_avatar: '',
      wechat_bound_at: null,
      wechat_enabled: false
    });
    
    const profileRules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      email: [
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
      ],
      phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
      ]
    };
    
    // 计算头像URL - 优先显示微信头像
    const avatarUrl = computed(() => {
      // 优先使用微信头像
      if (profileForm.wechat_avatar) {
        return profileForm.wechat_avatar;
      }
      
      // 其次使用用户上传的头像
      if (profileForm.avatar) {
        // 如果是base64数据（预览），直接返回
        if (profileForm.avatar.startsWith('data:')) {
          return profileForm.avatar;
        }
        // 如果是完整URL，直接返回
        if (profileForm.avatar.startsWith('http')) {
          return profileForm.avatar;
        }
        // 如果是相对路径，添加正确的前缀
        return window.location.origin + '/admin/' + profileForm.avatar.replace(/^\//, '');
      }
      return '';
    });
    

    
    // 获取用户信息
    const fetchUserInfo = async () => {
      try {
        const response = await adminApi.getCurrentUser();
        
        if (response && (response.code === 0 || response.code === 200) && response.data) {
          const user = response.data;
          profileForm.username = user.username || '';
          profileForm.name = user.name || '';
          profileForm.email = user.email || '';
          profileForm.phone = user.phone || '';
          profileForm.avatar = user.avatar || '';
          profileForm.wechat_openid = user.wechat_openid || '';
          profileForm.wechat_unionid = user.wechat_unionid || '';
          profileForm.wechat_nickname = user.wechat_nickname || '';
          profileForm.wechat_avatar = user.wechat_avatar || '';
          profileForm.wechat_bound_at = user.wechat_bound_at || null;
          profileForm.wechat_enabled = user.wechat_enabled || false;
        } else {
          throw new Error(response?.message || '获取用户信息失败');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        
        // 如果是401错误，说明token无效，需要重新登录
        if (error.response && error.response.status === 401) {
          ElMessage.error('登录已过期，请重新登录');
          // 清除本地存储
          clearAdminToken();
          localStorage.removeItem('user');
          // 跳转到登录页
          setTimeout(() => {
            window.location.href = '/admin/#/login';
          }, 1500);
        } else {
          ElMessage.error('获取用户信息失败，请尝试重新登录');
        }
      }
    };
    
    // 头像上传相关方法
    const selectAvatar = () => {
      // 触发文件选择
      if (avatarInputRef.value) {
        avatarInputRef.value.click();
      }
    };
    
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // 验证文件类型
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'].includes(file.type);
      if (!isValidType) {
        ElMessage.error('头像图片只能是 JPG/PNG/GIF 格式!');
        return;
      }
      
      // 验证文件大小
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        ElMessage.error('头像图片大小不能超过 2MB!');
        return;
      }
      
      // 保存文件引用
      avatarFile.value = file;
      
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        profileForm.avatar = e.target.result; // 临时显示预览
      };
      reader.readAsDataURL(file);
    };
    
    // 更新个人信息
    const updateProfile = async () => {
      if (!profileFormRef.value) return;
      
      try {
        await profileFormRef.value.validate();
        loading.value = true;
        
        // 创建FormData以支持文件上传
        const formData = new FormData();
        formData.append('name', profileForm.name || '');
        formData.append('email', profileForm.email || '');
        formData.append('phone', profileForm.phone || '');
        
        // 如果有新的头像文件，添加到FormData
        if (avatarFile.value) {
          formData.append('avatar', avatarFile.value);
        }
        
        // 使用原生fetch发送请求，因为需要发送FormData
        const token = getAdminToken();
        const response = await fetch('/api/admin/v1/auth/update-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (result && (result.code === 0 || result.code === 200)) {
          // 更新本地用户信息
          if (result.data) {
            profileForm.username = result.data.username || '';
            profileForm.name = result.data.name || '';
            profileForm.email = result.data.email || '';
            profileForm.phone = result.data.phone || '';
            
            // 只有当服务器返回了新的头像路径时才更新
            if (result.data.avatar && !result.data.avatar.startsWith('data:')) {
              profileForm.avatar = result.data.avatar;
            }
            
            // 更新localStorage中的用户信息
            localStorage.setItem('user', JSON.stringify(result.data));
            
            // 触发全局用户信息更新事件
            window.dispatchEvent(new CustomEvent('userInfoUpdated', { 
              detail: result.data 
            }));
          }
          
          // 清除头像文件引用和重置文件输入
          avatarFile.value = null;
          if (avatarInputRef.value) {
            avatarInputRef.value.value = '';
          }
          
          ElMessage.success('个人信息更新成功');
        } else {
          throw new Error(result?.message || '更新失败');
        }
      } catch (error) {
        console.error('更新个人信息失败:', error);
        ElMessage.error(error.message || '更新个人信息失败');
      } finally {
        loading.value = false;
      }
    };
    
    // 重置表单
    const resetForm = () => {
      fetchUserInfo();
    };
    
    // 格式化微信绑定时间
    const formatWechatTime = (time) => {
      if (!time) return '';
      return new Date(time).toLocaleString('zh-CN');
    };
    
    // 绑定微信 - 完全参照登录模块的做法
    const bindWechat = async () => {
      try {
        bindLoading.value = true;
        
        console.log('🔄 开始获取微信绑定配置（参照登录模块）...');
        
        // 获取微信绑定配置
        const response = await getWechatBindUrl();
        
        console.log('微信绑定配置响应:', response);
        console.log('响应检查:', {
          hasResponse: !!response,
          code: response?.code,
          hasData: !!response?.data,
          dataKeys: response?.data ? Object.keys(response.data) : [],
          fullData: response?.data
        });
        
        if (response && (response.code === 0 || response.code === 200) && response.data) {
          // 设置绑定数据
          wechatBindData.qrcode_url = response.data.auth_url || response.data.wechat_url || '';
          wechatBindData.js_config = response.data.js_config || null;
          wechatBindData.state = response.data.state || '';
          
          console.log('✅ 微信绑定数据设置完成:', {
            qrcode_url: wechatBindData.qrcode_url,
            has_js_config: !!wechatBindData.js_config,
            state: wechatBindData.state
          });
          
          // 直接打开微信绑定URL，更简单可靠
          if (wechatBindData.qrcode_url) {
            console.log('🚀 直接打开微信绑定URL:', wechatBindData.qrcode_url);
            
                         // 打开新窗口进行微信绑定
             const bindWindow = window.open(wechatBindData.qrcode_url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
             
             if (bindWindow) {
               ElMessage.success('微信绑定窗口已打开，请在新窗口中扫码绑定');
               
               // 显示绑定状态
               showWechatBinding.value = true;
               
               // 开始检查绑定状态
               startBindStatusPolling(wechatBindData.state);
             } else {
               ElMessage.error('无法打开微信绑定窗口，请检查浏览器弹窗设置');
             }
          } else {
            ElMessage.error('获取微信绑定URL失败');
          }
          
        } else {
          ElMessage.error(response?.message || '获取绑定配置失败');
        }
        
      } catch (error) {
        console.error('获取微信绑定配置失败:', error);
        ElMessage.error('网络错误，请稍后重试');
      } finally {
        bindLoading.value = false;
      }
    };

    // 取消微信绑定
    const cancelWechatBinding = () => {
      showWechatBinding.value = false;
      wechatBindData.qrcode_url = '';
      wechatBindData.js_config = null;
      wechatBindData.state = '';
      stopBindStatusPolling();
    };

    // 轮询检查绑定状态
    let bindStatusTimer = null;
    
    const startBindStatusPolling = (state) => {
      bindStatusTimer = setInterval(async () => {
        try {
          const response = await checkWechatBindStatus(state);
          if (response && (response.code === 0 || response.code === 200)) {
            if (response.data.status === 'success') {
              // 绑定成功
              clearInterval(bindStatusTimer);
              showWechatBinding.value = false;
              cancelWechatBinding();
              await fetchUserInfo();
              ElMessage.success('微信绑定成功！');
            } else if (response.data.status === 'expired') {
              // 二维码已过期
              clearInterval(bindStatusTimer);
              showWechatBinding.value = false;
              cancelWechatBinding();
              ElMessage.warning('绑定已过期，请重新绑定');
            }
          }
        } catch (error) {
          console.error('检查绑定状态失败:', error);
        }
      }, 2000); // 每2秒检查一次
      
      // 30秒后停止轮询
      setTimeout(() => {
        if (bindStatusTimer) {
          clearInterval(bindStatusTimer);
          bindStatusTimer = null;
        }
      }, 30000);
    };
    
    const stopBindStatusPolling = () => {
      if (bindStatusTimer) {
        clearInterval(bindStatusTimer);
        bindStatusTimer = null;
      }
    };

    // 显示现代化微信绑定弹窗
    const showModernWechatBindDialog = (data) => {
      // 创建一个自定义的HTML内容
      const dialogContent = `
        <div style="text-align: center; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <!-- 头部图标 -->
          <div style="margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; color: white; box-shadow: 0 16px 40px rgba(7, 193, 96, 0.3);">
              <svg style="width: 40px; height: 40px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.162 4.203 2.969 5.543.303.225.485.583.485.961 0 .375-.116.742-.334 1.056l-1.169 1.683c-.218.314-.183.743.088 1.021.271.279.693.318 1.021.093l2.109-1.458c.336-.232.753-.317 1.169-.232.417.084.818.225 1.201.423 1.22.629 2.617.629 3.837 0 .383-.198.784-.339 1.201-.423.416-.085.833 0 1.169.232l2.109 1.458c.328.225.75.186 1.021-.093.271-.278.306-.707.088-1.021l-1.169-1.683c-.218-.314-.334-.681-.334-1.056 0-.378.182-.736.485-.961C14.838 13.733 16 11.742 16 9.53c0-4.054-3.891-7.342-8.691-7.342zm-.362 3.108c.667 0 1.208.541 1.208 1.208s-.541 1.208-1.208 1.208-1.208-.541-1.208-1.208.541-1.208 1.208-1.208zm4.329 0c.667 0 1.208.541 1.208 1.208s-.541 1.208-1.208 1.208-1.208-.541-1.208-1.208.541-1.208 1.208-1.208z"/>
              </svg>
            </div>
          </div>
          
          <!-- 标题 -->
          <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">微信账号绑定</h2>
          <p style="margin: 0 0 32px; font-size: 16px; color: #64748b; line-height: 1.6;">请使用微信扫描下方二维码完成账号绑定</p>
          
          <!-- 二维码区域 -->
          <div style="margin-bottom: 32px;">
            <div style="width: 240px; height: 240px; margin: 0 auto; padding: 20px; background: white; border: 3px solid rgba(7, 193, 96, 0.2); border-radius: 20px; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1); position: relative; overflow: hidden;">
              <img src="${data.qrcode_url}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;" alt="微信绑定二维码" />
              <!-- 扫描线动画 -->
              <div style="position: absolute; top: 20px; left: 20px; right: 20px; height: 3px; background: linear-gradient(90deg, transparent, #07c160, transparent); animation: scan 2s infinite;"></div>
            </div>
            <p style="margin: 16px 0 0; color: #909399; font-size: 14px;">等待扫码中...</p>
          </div>
          
          <!-- 操作步骤 -->
          <div style="display: flex; justify-content: space-around; margin-bottom: 24px; gap: 16px;">
            <div style="flex: 1; text-align: center; max-width: 120px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin: 0 auto 12px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);">1</div>
              <h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #333;">打开微信</h4>
              <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">启动微信应用</p>
            </div>
            <div style="flex: 1; text-align: center; max-width: 120px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin: 0 auto 12px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);">2</div>
              <h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #333;">扫描二维码</h4>
              <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">使用扫一扫功能</p>
            </div>
            <div style="flex: 1; text-align: center; max-width: 120px;">
              <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; margin: 0 auto 12px; box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);">3</div>
              <h4 style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #333;">确认绑定</h4>
              <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.4;">点击确认完成绑定</p>
            </div>
          </div>
          
          <!-- 安全提示 -->
          <div style="background: rgba(7, 193, 96, 0.08); border: 1px solid rgba(7, 193, 96, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #07c160; font-size: 14px; font-weight: 500;">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span>您的隐私和安全受到严格保护</span>
            </div>
          </div>
        </div>
        
        <style>
          @keyframes scan {
            0% { transform: translateY(0); opacity: 1; }
            50% { transform: translateY(100px); opacity: 0.8; }
            100% { transform: translateY(200px); opacity: 0; }
          }
        </style>
      `;
      
      ElMessageBox({
        title: '',
        message: dialogContent,
        dangerouslyUseHTMLString: true,
        confirmButtonText: '我知道了',
        showCancelButton: true,
        cancelButtonText: '关闭',
        customClass: 'beautiful-wechat-dialog',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            // 刷新绑定状态
            checkBindStatus(data.state);
          }
          done();
        }
      }).catch(() => {
        // 用户取消
      });
      
      // 开始轮询检查绑定状态
      startBindStatusPolling(data.state);
    };

    // 显示错误弹窗
    const showWechatBindErrorDialog = (errorMessage) => {
      ElMessageBox({
        title: '',
        message: h('div', { class: 'modern-error-dialog' }, [
          // 背景装饰
          h('div', { class: 'error-bg-decoration' }, [
            h('div', { class: 'error-circle error-circle-1' }),
            h('div', { class: 'error-circle error-circle-2' }),
            h('div', { class: 'error-particles' }, [
              h('div', { class: 'error-particle error-particle-1' }),
              h('div', { class: 'error-particle error-particle-2' }),
              h('div', { class: 'error-particle error-particle-3' })
            ])
          ]),
          
          // 主要内容
          h('div', { class: 'error-main-content' }, [
            // 错误图标
            h('div', { class: 'error-icon-container' }, [
              h('div', { class: 'error-icon-bg' }, [
                h('svg', { 
                  class: 'error-icon',
                  viewBox: '0 0 1024 1024',
                  width: '48',
                  height: '48'
                }, [
                  h('path', {
                    d: 'M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 0 1 1.9-11.2c1.5-1.2 3.3-1.9 5.2-1.9l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130.1 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8.1 8z',
                    fill: 'currentColor'
                  })
                ])
              ])
            ]),
            
            h('h2', { class: 'error-title' }, '绑定失败'),
            h('p', { class: 'error-subtitle' }, errorMessage),
            
            // 错误详情
            h('div', { class: 'error-details' }, [
              h('div', { class: 'error-message-box' }, [
                h('h4', '可能的原因：'),
                h('ul', [
                  h('li', '网络连接不稳定'),
                  h('li', '微信服务暂时不可用'),
                  h('li', '二维码已过期'),
                  h('li', '系统配置问题')
                ])
              ]),
              h('div', { class: 'error-suggestions' }, [
                h('h4', '解决建议：'),
                h('ul', [
                  h('li', '检查网络连接后重试'),
                  h('li', '刷新页面重新获取二维码'),
                  h('li', '联系系统管理员')
                ])
              ])
            ])
          ])
        ]),
        customClass: 'modern-error-bind-dialog',
        confirmButtonText: '重试',
        showCancelButton: true,
        cancelButtonText: '关闭'
      }).then(() => {
        // 重试绑定
        bindWechat();
      }).catch(() => {
        // 用户取消
      });
    };

    // 检查微信绑定状态
    const checkBindStatus = async (state) => {
      try {
        const response = await checkWechatBindStatus(state);
        if (response && (response.code === 0 || response.code === 200)) {
          if (response.data.status === 'success') {
            ElMessage.success('微信绑定成功！');
            // 刷新用户信息
            await fetchUserInfo();
            // 更新localStorage中的用户信息
            const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}') };
            if (response.data.user_info) {
              Object.assign(updatedUser, response.data.user_info);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            // 触发全局用户信息更新事件
            window.dispatchEvent(new CustomEvent('userInfoUpdated', { 
              detail: updatedUser 
            }));
            return true;
          } else if (response.data.status === 'failed') {
            ElMessage.error(response.data.message || '绑定失败');
            return false;
          }
        }
      } catch (error) {
        console.error('检查绑定状态失败:', error);
      }
      return null;
    };


    
    // 解除微信绑定
    const unbindWechat = async () => {
      try {
        await ElMessageBox.confirm(
          '解除绑定后将无法使用微信登录，确定要解除绑定吗？',
          '确认解除绑定',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        unbindLoading.value = true;
        
        const response = await fetch('/api/admin/v1/auth/wechat/unbind', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result && (result.code === 0 || result.code === 200)) {
          ElMessage.success('微信解除绑定成功');
          // 清空微信相关信息
          profileForm.wechat_openid = '';
          profileForm.wechat_unionid = '';
          profileForm.wechat_nickname = '';
          profileForm.wechat_avatar = '';
          profileForm.wechat_bound_at = null;
          profileForm.wechat_enabled = false;
        } else {
          throw new Error(result?.message || '解除绑定失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('解除微信绑定失败:', error);
          ElMessage.error(error.message || '解除微信绑定失败');
        }
      } finally {
        unbindLoading.value = false;
      }
    };
    
    // 更新微信登录状态
    const updateWechatStatus = async () => {
      try {
        const response = await fetch('/api/admin/v1/auth/wechat/toggle', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            wechat_enabled: profileForm.wechat_enabled
          })
        });
        
        const result = await response.json();
        
        if (result && (result.code === 0 || result.code === 200)) {
          ElMessage.success(
            profileForm.wechat_enabled ? '已启用微信登录' : '已禁用微信登录'
          );
        } else {
          // 如果更新失败，恢复原状态
          profileForm.wechat_enabled = !profileForm.wechat_enabled;
          throw new Error(result?.message || '更新微信登录状态失败');
        }
      } catch (error) {
        console.error('更新微信登录状态失败:', error);
        ElMessage.error(error.message || '更新微信登录状态失败');
      }
    };
    
    onMounted(() => {
      fetchUserInfo();
      checkPendingWechatBind();
    });
    
    // 检查是否有待绑定的微信信息
    const checkPendingWechatBind = async () => {
      try {
        // 检查URL参数中是否有state参数（从登录页面跳转过来）
        const urlParams = new URLSearchParams(window.location.search);
        const state = urlParams.get('wechat_bind_state');
        
        if (state) {
          // 清除URL参数
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
          
          // 显示绑定确认对话框
          ElMessageBox.confirm(
            '检测到您刚才扫码登录时微信账号未绑定，是否现在绑定微信账号？绑定后可以使用微信扫码登录。',
            '绑定微信账号',
            {
              confirmButtonText: '立即绑定',
              cancelButtonText: '稍后绑定',
              type: 'info',
              customClass: 'wechat-bind-confirm-dialog'
            }
          ).then(async () => {
            // 用户确认绑定
            try {
              bindLoading.value = true;
              const response = await bindWechatAfterLogin(state);
              
              if (response && (response.code === 0 || response.code === 200)) {
                ElMessage.success('微信账号绑定成功！');
                await fetchUserInfo(); // 刷新用户信息
              } else {
                ElMessage.error(response?.message || '绑定失败，请重试');
              }
            } catch (error) {
              console.error('绑定微信失败:', error);
              ElMessage.error('绑定失败，请重试');
            } finally {
              bindLoading.value = false;
            }
          }).catch(() => {
            // 用户取消绑定
            ElMessage.info('您可以稍后在个人信息页面绑定微信账号');
          });
        }
      } catch (error) {
        console.error('检查待绑定微信信息失败:', error);
      }
    };
    
    return {
      profileFormRef,
      avatarInputRef,
      profileForm,
      profileRules,
      loading,
      avatarFile,
      avatarUrl,
      bindLoading,
      unbindLoading,
      selectAvatar,
      handleFileSelect,
      updateProfile,
      resetForm,
      formatWechatTime,
      bindWechat,
      unbindWechat,
      updateWechatStatus
    };
  }
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.profile-form {
  margin-top: 20px;
}

/* 头像上传样式 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.avatar-uploader {
  border: none;
}

.avatar-container {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px dashed #d9d9d9;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-container:hover {
  border-color: #409EFF;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  text-align: center;
}

.avatar-uploader-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 50%;
  font-size: 12px;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.avatar-tips {
  margin-top: 10px;
  color: #909399;
  font-size: 12px;
}

.avatar-tips p {
  margin: 0;
}

/* 微信绑定样式 */
.wechat-binding {
  width: 100%;
}

.wechat-bound {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background-color: #f8f9fa;
}

/* 微信绑定二维码样式 - 个人信息页面专用设计 */
.wechat-bind-simple {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.qrcode-simple-container {
  position: relative;
  width: 240px;
  height: 240px;
  background: linear-gradient(135deg, #f8fffe 0%, #f0fdf4 100%);
  border-radius: 16px;
  border: 2px solid #07c160;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(7, 193, 96, 0.15);
  transition: all 0.3s ease;
}

.qrcode-simple-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(7, 193, 96, 0.2);
}

.wechat-qrcode-simple {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.wechat-qrcode-simple iframe {
  width: 100% !important;
  height: 100% !important;
  border: none;
  border-radius: 12px;
}

.qrcode-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 255, 254, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 14px;
}

.loading-icon {
  font-size: 32px;
  color: #07C160;
  margin-bottom: 12px;
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qrcode-loading-overlay::after {
  content: "正在生成绑定二维码...";
  color: #059669;
  font-size: 14px;
  font-weight: 500;
}

/* 微信绑定区域样式 */
.wechat-binding-area {
  background: linear-gradient(135deg, #fafffe 0%, #f0fdf4 100%);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #d1fae5;
  margin-top: 16px;
}

.binding-header {
  text-align: center;
  margin-bottom: 32px;
}

.header-icon {
  margin-bottom: 16px;
}

.wechat-bind-icon {
  font-size: 48px;
  color: #07c160;
  padding: 16px;
  background: rgba(7, 193, 96, 0.1);
  border-radius: 50%;
  display: inline-block;
}

.binding-header h4 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #065f46;
}

.binding-header p {
  margin: 0;
  color: #059669;
  font-size: 14px;
}

/* 绑定说明卡片 */
.bind-instructions {
  margin-top: 24px;
}

.instruction-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #d1fae5;
  box-shadow: 0 4px 16px rgba(7, 193, 96, 0.08);
}

.instruction-steps {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  text-align: center;
}

.step-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #07c160 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.step-item span {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.bind-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(7, 193, 96, 0.05);
  border-radius: 8px;
  border: 1px dashed #07c160;
}

.status-icon {
  font-size: 18px;
  color: #07c160;
  animation: pulse 2s infinite;
}

.status-text {
  color: #059669;
  font-size: 14px;
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 加载状态 */
.qrcode-loading-state {
  text-align: center;
  padding: 40px 20px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  font-size: 36px;
  color: #07c160;
  animation: spin 1.5s linear infinite;
}

.loading-content p {
  margin: 0;
  color: #059669;
  font-size: 14px;
  font-weight: 500;
}

/* 操作按钮 */
.binding-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.cancel-btn {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #4b5563;
}

.refresh-btn {
  background: linear-gradient(135deg, #07c160 0%, #059669 100%);
  border: none;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.wechat-info {
  display: flex;
  align-items: center;
}

.wechat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.wechat-details {
  display: flex;
  flex-direction: column;
}

.wechat-nickname {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.wechat-status {
  color: #67c23a;
  font-size: 12px;
  margin-bottom: 2px;
}

.wechat-time {
  color: #909399;
  font-size: 12px;
}

.wechat-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.wechat-unbound {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background-color: #fafafa;
}

.wechat-tips {
  display: flex;
  align-items: center;
  color: #909399;
  font-size: 14px;
}

.wechat-tips .el-icon {
  margin-right: 8px;
  font-size: 18px;
  color: #07c160;
}

/* 微信绑定区域样式 */
.wechat-binding-area {
  margin-top: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #f8fffe 0%, #f0fff4 100%);
  border-radius: 12px;
  border: 2px solid #b7eb8f;
}

.binding-header {
  text-align: center;
  margin-bottom: 24px;
}

.binding-header h4 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.binding-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.qrcode-section {
  text-align: center;
  margin-bottom: 20px;
}

.qrcode-container {
  display: inline-block;
  margin-bottom: 20px;
}

/* 微信SDK容器样式 */
.wechat-sdk-container {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Fallback容器样式 */
.fallback-container {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fallback-qrcode {
  text-align: center;
  padding: 16px;
}

.fallback-icon {
  font-size: 40px;
  color: #07c160;
  margin-bottom: 12px;
}

.fallback-qrcode p {
  margin: 0 0 12px;
  color: #606266;
  font-size: 12px;
}

.qrcode-tips {
  margin-bottom: 20px;
}

.tip-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 6px;
  color: #606266;
  font-size: 12px;
}

.step-number {
  width: 20px;
  height: 20px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.qrcode-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #1890ff;
  font-size: 12px;
}

.status-icon.loading {
  animation: rotate 2s linear infinite;
}

.qrcode-loading {
  padding: 40px 16px;
  color: #909399;
  text-align: center;
}

.loading-animation {
  margin-bottom: 16px;
}

.loading-icon {
  font-size: 32px;
  animation: rotate 2s linear infinite;
}

.binding-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 现代化微信绑定弹窗样式 */
:deep(.modern-wechat-dialog) {
  .el-message-box {
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.2);
    border: none;
    max-width: 520px;
    width: 95vw;
    background: transparent;
  }
  
  .el-message-box__header {
    display: none;
  }
  
  .el-message-box__content {
    padding: 0;
  }
  
  .el-message-box__btns {
    padding: 24px 32px 32px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    text-align: center;
  }
  
  .el-button {
    border-radius: 20px;
    padding: 12px 32px;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.3s ease;
    border: none;
  }
  
  .el-button--primary {
    background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
    color: white;
    box-shadow: 0 8px 24px rgba(7, 193, 96, 0.3);
  }
  
  .el-button--primary:hover {
    background: linear-gradient(135deg, #06ad56 0%, #00c199 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(7, 193, 96, 0.4);
  }
  
  .el-button--default {
    background: rgba(255, 255, 255, 0.8);
    color: #666;
    backdrop-filter: blur(10px);
  }
  
  .el-button--default:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }
}

/* 错误弹窗样式 */
:deep(.error-dialog) {
  .el-button--primary {
    background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
    box-shadow: 0 8px 24px rgba(245, 108, 108, 0.3);
  }
  
  .el-button--primary:hover {
    background: linear-gradient(135deg, #f45454 0%, #ff6b6b 100%);
    box-shadow: 0 12px 32px rgba(245, 108, 108, 0.4);
  }
}

/* 现代化微信绑定弹窗样式 */
:deep(.modern-wechat-bind-dialog) {
  .el-message-box {
    border-radius: 24px !important;
    overflow: hidden !important;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15) !important;
    border: none !important;
    max-width: 520px !important;
    width: 90vw !important;
    background: transparent !important;
  }
  
  .el-message-box__header {
    display: none !important;
  }
  
  .el-message-box__content {
    padding: 0 !important;
  }
  
  .el-message-box__btns {
    padding: 0 32px 32px !important;
    border-top: none !important;
    text-align: center !important;
    background: transparent !important;
  }
  
  .el-button--primary {
    background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%) !important;
    border: none !important;
    border-radius: 25px !important;
    padding: 14px 32px !important;
    font-weight: 600 !important;
    font-size: 16px !important;
    box-shadow: 0 8px 25px rgba(7, 193, 96, 0.3) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: white !important;
  }
  
  .el-button--primary:hover {
    background: linear-gradient(135deg, #06ad56 0%, #00c199 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 30px rgba(7, 193, 96, 0.4) !important;
  }
  
  .el-button--default {
    background: rgba(255, 255, 255, 0.9) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    border-radius: 25px !important;
    padding: 14px 32px !important;
    font-weight: 500 !important;
    font-size: 16px !important;
    color: #666 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    margin-left: 16px !important;
  }
  
  .el-button--default:hover {
    background: rgba(255, 255, 255, 1) !important;
    border-color: rgba(7, 193, 96, 0.3) !important;
    color: #07c160 !important;
    transform: translateY(-1px) !important;
  }
}

/* 现代化微信绑定弹窗内容 */
:deep(.modern-wechat-dialog) {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 600px;
}

/* 背景装饰 */
:deep(.dialog-bg-decoration) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

:deep(.bg-circle) {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: floatCircle 8s ease-in-out infinite;
}

:deep(.bg-circle-1) {
  width: 120px;
  height: 120px;
  top: -60px;
  right: -60px;
  animation-delay: 0s;
}

:deep(.bg-circle-2) {
  width: 80px;
  height: 80px;
  bottom: 100px;
  left: -40px;
  animation-delay: 2s;
}

:deep(.bg-circle-3) {
  width: 60px;
  height: 60px;
  top: 50%;
  right: 20px;
  animation-delay: 4s;
}

@keyframes floatCircle {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
}

:deep(.floating-dots) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:deep(.dot) {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: floatDot 6s ease-in-out infinite;
}

:deep(.dot-1) {
  top: 20%;
  left: 15%;
  animation-delay: 0s;
}

:deep(.dot-2) {
  top: 40%;
  right: 20%;
  animation-delay: 1.2s;
}

:deep(.dot-3) {
  bottom: 30%;
  left: 25%;
  animation-delay: 2.4s;
}

:deep(.dot-4) {
  top: 60%;
  right: 15%;
  animation-delay: 3.6s;
}

:deep(.dot-5) {
  bottom: 20%;
  right: 30%;
  animation-delay: 4.8s;
}

@keyframes floatDot {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
  50% { transform: translateY(-15px) scale(1.2); opacity: 0.8; }
}

:deep(.dialog-background.error-bg) {
  background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
}

:deep(.floating-particles) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

:deep(.particle) {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

:deep(.particle:nth-child(1)) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

:deep(.particle:nth-child(2)) {
  top: 60%;
  left: 80%;
  animation-delay: 2s;
}

:deep(.particle:nth-child(3)) {
  top: 80%;
  left: 40%;
  animation-delay: 4s;
}

:deep(.particle:nth-child(4)) {
  top: 30%;
  left: 70%;
  animation-delay: 1s;
}

:deep(.particle:nth-child(5)) {
  top: 70%;
  left: 10%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
}

:deep(.error-particles) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

:deep(.error-particle) {
  position: absolute;
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: errorFloat 4s ease-in-out infinite;
}

:deep(.error-particle:nth-child(1)) {
  top: 30%;
  left: 30%;
  animation-delay: 0s;
}

:deep(.error-particle:nth-child(2)) {
  top: 50%;
  left: 70%;
  animation-delay: 1.5s;
}

:deep(.error-particle:nth-child(3)) {
  top: 70%;
  left: 20%;
  animation-delay: 3s;
}

@keyframes errorFloat {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
  50% { transform: translateY(-15px) scale(1.2); opacity: 0.8; }
}

/* 主要内容区域 */
:deep(.dialog-main-content) {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  color: #333;
  text-align: center;
  padding: 48px 40px 40px;
  border-radius: 24px;
  margin: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 头部区域 */
:deep(.dialog-header-section) {
  margin-bottom: 40px;
}

:deep(.wechat-icon-container) {
  margin-bottom: 24px;
}

:deep(.wechat-icon-bg) {
  width: 88px;
  height: 88px;
  background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  box-shadow: 0 16px 40px rgba(7, 193, 96, 0.3);
  animation: pulseGlow 3s ease-in-out infinite;
  position: relative;
}

:deep(.wechat-icon-bg::before) {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
  border-radius: 50%;
  opacity: 0.3;
  animation: ripple 2s ease-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { transform: scale(1); box-shadow: 0 16px 40px rgba(7, 193, 96, 0.3); }
  50% { transform: scale(1.05); box-shadow: 0 20px 50px rgba(7, 193, 96, 0.4); }
}

@keyframes ripple {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.2); opacity: 0; }
}

:deep(.wechat-icon) {
  position: relative;
  z-index: 1;
}

:deep(.wechat-logo) {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #07c160 0%, #00d4aa 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  box-shadow: 0 12px 32px rgba(7, 193, 96, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

:deep(.error-icon) {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: white;
  box-shadow: 0 12px 32px rgba(245, 108, 108, 0.3);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

:deep(.dialog-title) {
  margin: 0 0 16px;
  font-size: 32px;
  font-weight: 800;
  color: #2c3e50;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

:deep(.dialog-subtitle) {
  margin: 0 0 40px;
  font-size: 18px;
  color: #64748b;
  line-height: 1.6;
  font-weight: 500;
}

/* 二维码区域 */
:deep(.qrcode-section) {
  margin-bottom: 40px;
}

:deep(.qrcode-wrapper) {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

:deep(.qrcode-container) {
  position: relative;
  display: inline-block;
}

:deep(.qrcode-frame) {
  position: relative;
  width: 260px;
  height: 260px;
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  border: 4px solid rgba(7, 193, 96, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.qrcode-frame:hover) {
  transform: translateY(-4px);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.2);
  border-color: rgba(7, 193, 96, 0.3);
}

:deep(.qrcode-image) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 16px;
}

:deep(.qrcode-overlay) {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
  border-radius: 16px;
  overflow: hidden;
  pointer-events: none;
}

:deep(.scan-line) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent 0%, #07c160 50%, transparent 100%);
  animation: scanAnimation 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(7, 193, 96, 0.6);
}

@keyframes scanAnimation {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(220px); opacity: 0; }
}

:deep(.qrcode-logo) {
  position: absolute;
  bottom: -12px;
  right: -12px;
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #07c160;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid rgba(7, 193, 96, 0.1);
}

/* 状态指示器 */
:deep(.status-section) {
  margin-bottom: 32px;
}

:deep(.status-indicator) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

:deep(.status-dot) {
  width: 12px;
  height: 12px;
  background: #07c160;
  border-radius: 50%;
  animation: statusPulse 2s ease-in-out infinite;
  position: relative;
}

:deep(.status-dot::before) {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: #07c160;
  border-radius: 50%;
  opacity: 0.3;
  animation: statusRipple 2s ease-out infinite;
}

@keyframes statusPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes statusRipple {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(2); opacity: 0; }
}

:deep(.status-text) {
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
}

/* 操作步骤 */
:deep(.steps-section) {
  display: flex;
  justify-content: space-around;
  margin-bottom: 32px;
  gap: 20px;
}

:deep(.step-item) {
  flex: 1;
  text-align: center;
  max-width: 120px;
}

:deep(.step-number) {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin: 0 auto 16px;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.step-number:hover) {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
}

:deep(.step-content h4) {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

:deep(.step-content p) {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.4;
}

/* 安全提示 */
:deep(.security-notice) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  background: rgba(7, 193, 96, 0.08);
  border-radius: 16px;
  border: 1px solid rgba(7, 193, 96, 0.15);
  color: #07c160;
  font-size: 15px;
  font-weight: 500;
  margin-top: 8px;
}

:deep(.security-icon) {
  color: #07c160;
  flex-shrink: 0;
}

/* 错误弹窗样式 */
:deep(.modern-error-bind-dialog) {
  .el-message-box {
    border-radius: 24px !important;
    overflow: hidden !important;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15) !important;
    border: none !important;
    max-width: 520px !important;
    width: 90vw !important;
    background: transparent !important;
  }
  
  .el-message-box__header {
    display: none !important;
  }
  
  .el-message-box__content {
    padding: 0 !important;
  }
  
  .el-message-box__btns {
    padding: 0 32px 32px !important;
    border-top: none !important;
    text-align: center !important;
    background: transparent !important;
  }
  
  .el-button--primary {
    background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%) !important;
    border: none !important;
    border-radius: 25px !important;
    padding: 14px 32px !important;
    font-weight: 600 !important;
    font-size: 16px !important;
    box-shadow: 0 8px 25px rgba(245, 108, 108, 0.3) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    color: white !important;
  }
  
  .el-button--primary:hover {
    background: linear-gradient(135deg, #f45454 0%, #ff6b6b 100%) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 30px rgba(245, 108, 108, 0.4) !important;
  }
}

/* 错误弹窗内容 */
:deep(.modern-error-dialog) {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  min-height: 500px;
}

/* 错误背景装饰 */
:deep(.error-bg-decoration) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  overflow: hidden;
}

:deep(.error-circle) {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: floatErrorCircle 8s ease-in-out infinite;
}

:deep(.error-circle-1) {
  width: 100px;
  height: 100px;
  top: -50px;
  right: -50px;
  animation-delay: 0s;
}

:deep(.error-circle-2) {
  width: 70px;
  height: 70px;
  bottom: 80px;
  left: -35px;
  animation-delay: 2s;
}

@keyframes floatErrorCircle {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-15px) rotate(180deg); opacity: 0.6; }
}

:deep(.error-particles) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:deep(.error-particle) {
  position: absolute;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  animation: floatErrorParticle 5s ease-in-out infinite;
}

:deep(.error-particle-1) {
  top: 25%;
  left: 20%;
  animation-delay: 0s;
}

:deep(.error-particle-2) {
  top: 45%;
  right: 25%;
  animation-delay: 1.5s;
}

:deep(.error-particle-3) {
  bottom: 35%;
  left: 30%;
  animation-delay: 3s;
}

@keyframes floatErrorParticle {
  0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
  50% { transform: translateY(-12px) scale(1.1); opacity: 0.8; }
}

/* 错误主要内容 */
:deep(.error-main-content) {
  position: relative;
  z-index: 2;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  color: #333;
  text-align: center;
  padding: 48px 40px 40px;
  border-radius: 24px;
  margin: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

:deep(.error-icon-container) {
  margin-bottom: 24px;
}

:deep(.error-icon-bg) {
  width: 88px;
  height: 88px;
  background: linear-gradient(135deg, #f56c6c 0%, #ff7875 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  box-shadow: 0 16px 40px rgba(245, 108, 108, 0.3);
  animation: errorPulse 3s ease-in-out infinite;
}

@keyframes errorPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 16px 40px rgba(245, 108, 108, 0.3); }
  50% { transform: scale(1.05); box-shadow: 0 20px 50px rgba(245, 108, 108, 0.4); }
}

:deep(.error-title) {
  margin: 0 0 16px;
  font-size: 28px;
  font-weight: 700;
  color: #e74c3c;
}

:deep(.error-subtitle) {
  margin: 0 0 32px;
  font-size: 16px;
  color: #64748b;
  line-height: 1.6;
}

/* 错误详情 */
:deep(.error-details) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  text-align: left;
}

:deep(.error-message-box) {
  background: rgba(245, 108, 108, 0.08);
  border: 1px solid rgba(245, 108, 108, 0.15);
  border-radius: 16px;
  padding: 24px;
}

:deep(.error-suggestions) {
  background: rgba(52, 152, 219, 0.08);
  border: 1px solid rgba(52, 152, 219, 0.15);
  border-radius: 16px;
  padding: 24px;
}

:deep(.error-message-box h4) {
  margin: 0 0 16px;
  color: #e74c3c;
  font-size: 16px;
  font-weight: 600;
}

:deep(.error-suggestions h4) {
  margin: 0 0 16px;
  color: #3498db;
  font-size: 16px;
  font-weight: 600;
}

:deep(.error-details ul) {
  margin: 0;
  padding-left: 20px;
}

:deep(.error-details li) {
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.modern-wechat-bind-dialog) {
    .el-message-box {
      width: 95vw !important;
      margin: 10px !important;
    }
  }
  
  :deep(.dialog-main-content) {
    padding: 32px 24px 24px !important;
  }
  
  :deep(.wechat-icon-bg) {
    width: 72px !important;
    height: 72px !important;
  }
  
  :deep(.dialog-title) {
    font-size: 24px !important;
  }
  
  :deep(.dialog-subtitle) {
    font-size: 16px !important;
  }
  
  :deep(.qrcode-frame) {
    width: 220px !important;
    height: 220px !important;
    padding: 16px !important;
  }
  
  :deep(.steps-section) {
    flex-direction: column !important;
    gap: 16px !important;
  }
  
  :deep(.step-item) {
    max-width: none !important;
    display: flex !important;
    align-items: center !important;
    text-align: left !important;
    gap: 16px !important;
  }
  
  :deep(.step-number) {
    width: 40px !important;
    height: 40px !important;
    font-size: 16px !important;
    margin: 0 !important;
    flex-shrink: 0 !important;
  }
  
  :deep(.error-details) {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  
  :deep(.error-message-box),
  :deep(.error-suggestions) {
    padding: 16px !important;
  }
}

@media (max-width: 480px) {
  :deep(.dialog-main-content) {
    padding: 24px 16px 16px !important;
  }
  
  :deep(.qrcode-frame) {
    width: 180px !important;
    height: 180px !important;
    padding: 12px !important;
  }
  
  :deep(.dialog-title) {
    font-size: 20px !important;
  }
  
  :deep(.dialog-subtitle) {
    font-size: 14px !important;
  }
  
  :deep(.step-content h4) {
    font-size: 14px !important;
  }
  
  :deep(.step-content p) {
    font-size: 12px !important;
  }
  
  :deep(.security-notice) {
    padding: 16px !important;
    font-size: 13px !important;
  }
}
</style>
