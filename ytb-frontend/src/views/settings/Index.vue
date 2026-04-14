<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="基本设置" name="basic">
          <div v-if="statusError" class="mb-4">
            <el-alert
              :title="statusError"
              type="error"
              :closable="false"
              show-icon
            />
          </div>

          <el-form
            ref="basicFormRef"
            :model="basicForm"
            label-width="120px"
            class="setting-form"
            v-loading="loading"
          >
            <el-card class="mb-4">
              <template #header>
                <div class="flex justify-between items-center">
                  <span>基本信息</span>
                  <el-button type="primary" size="small" @click="saveBasicSettings" :loading="saveLoading">保存设置</el-button>
                </div>
              </template>
              <el-form-item label="网站名称">
                <el-input
                  v-model="basicForm.siteName"
                  placeholder="请输入网站名称"
                  @change="updateDomElements"
                />
              </el-form-item>
              <el-form-item label="网站logo">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :http-request="uploadLogo"
                  :show-file-list="false"
                  :before-upload="beforeLogoUpload"
                >
                  <img v-if="logoUrl" :src="logoUrl" class="avatar" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
              <el-form-item label="网站图标">
                <el-upload
                  class="favicon-uploader"
                  action="#"
                  :http-request="uploadFavicon"
                  :show-file-list="false"
                  :before-upload="beforeFaviconUpload"
                >
                  <img v-if="faviconUrl" :src="faviconUrl" class="favicon" />
                  <el-icon v-else class="favicon-uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div class="favicon-tip">
                  <el-text size="small" type="info">推荐尺寸：32x32像素，支持.ico、.png格式</el-text>
                </div>
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="basicForm.contactPhone" placeholder="请输入联系电话" />
              </el-form-item>
              <el-form-item label="联系邮箱">
                <el-input v-model="basicForm.contactEmail" placeholder="请输入联系邮箱" />
              </el-form-item>
              <el-form-item label="版权信息">
                <el-input v-model="basicForm.copyright" placeholder="请输入版权信息" />
              </el-form-item>
              <el-form-item label="备案号">
                <el-input v-model="basicForm.icp" placeholder="请输入备案号" />
              </el-form-item>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="微信登录" name="wechat">
          <wechat-config />
        </el-tab-pane>

        <el-tab-pane label="短信设置" name="sms">
          <sms-config />
        </el-tab-pane>

        <el-tab-pane label="导航菜单" name="nav">
          <nav-config />
        </el-tab-pane>

        <el-tab-pane label="支付设置" name="payment">
          <div v-if="statusError" class="mb-4">
            <el-alert
              :title="statusError"
              type="error"
              :closable="false"
              show-icon
            />
          </div>

          <el-form
            ref="paymentFormRef"
            :model="paymentForm"
            label-width="120px"
            class="setting-form"
          >
            <el-card class="mb-4">
              <template #header>
                <div class="flex justify-between items-center">
                  <span>支付方式设置</span>
                  <el-button type="primary" size="small" @click="savePaymentSettings" :loading="saveLoading">保存设置</el-button>
                </div>
              </template>
              <el-form-item label="微信支付商户号">
                <el-input v-model="paymentForm.wxpayMchId" placeholder="请输入微信支付商户号" />
              </el-form-item>
              <el-form-item label="微信支付密钥">
                <el-input v-model="paymentForm.wxpayKey" placeholder="请输入微信支付密钥" show-password />
              </el-form-item>
              <el-form-item label="微信支付证书">
                <el-upload
                  class="upload-demo"
                  action="/api/upload/cert"
                  :on-success="handleWxCertSuccess"
                  :limit="1"
                >
                  <el-button type="primary">上传证书</el-button>
                </el-upload>
              </el-form-item>
              <el-divider />
              <el-form-item label="支付宝商户号">
                <el-input v-model="paymentForm.alipayMchId" placeholder="请输入支付宝商户号" />
              </el-form-item>
              <el-form-item label="支付宝应用ID">
                <el-input v-model="paymentForm.alipayAppId" placeholder="请输入支付宝应用ID" />
              </el-form-item>
              <el-form-item label="支付宝私钥">
                <el-input
                  v-model="paymentForm.alipayPrivateKey"
                  type="textarea"
                  placeholder="请输入支付宝私钥"
                  :rows="4"
                />
              </el-form-item>
              <el-form-item label="支付宝公钥">
                <el-input
                  v-model="paymentForm.alipayPublicKey"
                  type="textarea"
                  placeholder="请输入支付宝公钥"
                  :rows="4"
                />
              </el-form-item>
            </el-card>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="其他设置" name="other">
          <el-form
            ref="otherFormRef"
            :model="otherForm"
            label-width="120px"
            class="setting-form"
          >
            <el-form-item label="用户默认积分">
              <el-input-number v-model="otherForm.defaultPoints" :min="0" />
            </el-form-item>
            <el-form-item label="注册是否需要邀请码">
              <el-switch v-model="otherForm.needInviteCode" />
            </el-form-item>
            <el-form-item label="提现最低金额">
              <el-input-number v-model="otherForm.minWithdraw" :min="0" :precision="2" />
            </el-form-item>
            <el-form-item label="平台服务费率(%)">
              <el-input-number v-model="otherForm.serviceFeeRate" :min="0" :max="100" :precision="2" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveOtherSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="清理缓存" name="cache">
          <div class="cache-container">
            <p class="tip-text">您可以清理系统缓存，包括应用缓存、配置缓存和路由缓存等。</p>
            <div class="cache-actions">
              <el-button type="primary" :loading="clearing" @click="clearCache('application')">清理应用缓存</el-button>
              <el-button type="primary" :loading="clearing" @click="clearCache('config')">清理配置缓存</el-button>
              <el-button type="primary" :loading="clearing" @click="clearCache('route')">清理路由缓存</el-button>
              <el-button type="danger" :loading="clearing" @click="clearCache('all')">清理所有缓存</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import WechatConfig from './app/WechatConfig.vue';
import SmsConfig from './app/SmsConfig.vue';
import NavConfig from './app/NavConfig.vue';
import adminApi from '@/api/admin';

export default defineComponent({
  name: 'SystemSettings',
  components: {
    Plus,
    WechatConfig,
    SmsConfig,
    NavConfig
  },
  setup() {
    const activeTab = ref('basic');
    const clearing = ref(false);
    const loading = ref(false);
    const submitting = ref(false);
    const saveLoading = ref(false);
    const statusError = ref('');

    // 基本设置表单
    const basicFormRef = ref(null);
    const basicForm = reactive({
      siteName: '',
      logo: '',
      favicon: '',
      contactPhone: '',
      contactEmail: '',
      copyright: '',
      icp: ''
    });

    // 短信设置表单
    const smsFormRef = ref(null);
    const smsForm = reactive({
      provider: 'aliyun',
      accessKeyId: '',
      accessKeySecret: '',
      signName: '点点够',
      templateCode: ''
    });

    // 支付设置表单
    const paymentFormRef = ref(null);
    const paymentForm = reactive({
      wxpayMchId: '',
      wxpayKey: '',
      wxpayCertPath: '',
      alipayMchId: '',
      alipayAppId: '',
      alipayPrivateKey: '',
      alipayPublicKey: ''
    });

    // 其他设置表单
    const otherFormRef = ref(null);
    const otherForm = reactive({
      defaultPoints: 100,
      needInviteCode: false,
      minWithdraw: 10,
      serviceFeeRate: 5
    });

    const logoUrl = computed(() => {
      return basicForm.logo;
    });

    const faviconUrl = computed(() => {
      return basicForm.favicon;
    });

    // 获取设置
    const fetchSettings = async () => {
      loading.value = true;
      statusError.value = '';

      try {

        const result = await adminApi.getModuleConfigs('basic');

        if (result && (result.code === 0 || result.code === 200) && result.data) {
          const data = result.data;

          
          basicForm.siteName = data.site_name || '';
          basicForm.logo = data.site_logo || '';
          basicForm.favicon = data.site_favicon || '';
          basicForm.contactPhone = data.contact_phone || '';
          basicForm.contactEmail = data.contact_email || '';
          basicForm.copyright = data.copyright || '';
          basicForm.icp = data.site_icp || '';

          smsForm.provider = data.sms_provider || 'aliyun';
          smsForm.accessKeyId = data.sms_access_key_id || '';
          smsForm.accessKeySecret = data.sms_access_key_secret || '';
          smsForm.signName = data.sms_sign_name || '点点够';
          smsForm.templateCode = data.sms_template_code || '';

          paymentForm.wxpayMchId = data.wechat_pay_mchid || '';
          paymentForm.wxpayKey = data.wechat_pay_key || '';
          paymentForm.wxpayCertPath = data.wechat_pay_cert_path || '';
          paymentForm.alipayMchId = data.alipay_mch_id || '';
          paymentForm.alipayAppId = data.alipay_appid || '';
          paymentForm.alipayPrivateKey = data.alipay_private_key || '';
          paymentForm.alipayPublicKey = data.alipay_public_key || '';

          otherForm.defaultPoints = data.default_points || 100;
          otherForm.needInviteCode = data.need_invite_code === '1';
          otherForm.minWithdraw = data.min_withdraw || 10;
          otherForm.serviceFeeRate = data.service_fee_rate || 5;
          

          ElMessage.success('设置数据加载成功');
        } else {
          const errorMsg = result?.message || '数据格式错误';
          console.error('API响应错误:', result);
          statusError.value = '获取系统设置失败: ' + errorMsg;
          ElMessage.error('获取系统设置失败: ' + errorMsg);
        }
      } catch (error) {
        console.error('获取系统设置异常:', error);
        const errorMsg = error.response?.data?.message || error.message || '网络错误';
        statusError.value = '获取系统设置失败: ' + errorMsg;
        ElMessage.error('获取系统设置失败: ' + errorMsg);
      } finally {
        loading.value = false;
      }
    };

    // 保存基本设置
    const saveBasicSettings = async () => {
      saveLoading.value = true;

      try {
        const result = await adminApi.saveModuleConfig('basic', {
          site_name: basicForm.siteName,
          site_logo: basicForm.logo,
          site_favicon: basicForm.favicon,
          contact_phone: basicForm.contactPhone,
          contact_email: basicForm.contactEmail,
          copyright: basicForm.copyright,
          site_icp: basicForm.icp,
          sms_provider: smsForm.provider,
          sms_access_key_id: smsForm.accessKeyId,
          sms_access_key_secret: smsForm.accessKeySecret,
          sms_sign_name: smsForm.signName,
          sms_template_code: smsForm.templateCode,
          wechat_pay_mchid: paymentForm.wxpayMchId,
          wechat_pay_key: paymentForm.wxpayKey,
          wechat_pay_cert_path: paymentForm.wxpayCertPath,
          alipay_mch_id: paymentForm.alipayMchId,
          alipay_appid: paymentForm.alipayAppId,
          alipay_private_key: paymentForm.alipayPrivateKey,
          alipay_public_key: paymentForm.alipayPublicKey,
          default_points: otherForm.defaultPoints,
          need_invite_code: otherForm.needInviteCode ? '1' : '0',
          min_withdraw: otherForm.minWithdraw,
          service_fee_rate: otherForm.serviceFeeRate
        });

        if (result && result.code === 0) {
          ElMessage.success('基本设置保存成功');

          // 更新全局配置
          if (window.Laravel && window.Laravel.siteConfig) {
            window.Laravel.siteConfig.siteName = basicForm.siteName;
            window.Laravel.siteConfig.siteLogo = basicForm.logo;
            window.Laravel.siteConfig.copyright = basicForm.copyright;

          }

          // 立即更新标题
          document.title = basicForm.siteName;

          // 立即更新DOM元素
          updateDomElements();

          // 触发全局事件，通知其他组件更新 - 多次触发确保接收
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('system-settings-updated', {
                detail: {
                  siteName: basicForm.siteName,
                  siteLogo: basicForm.logo,
                  copyright: basicForm.copyright
                }
              }));

            }, i * 300); // 每300毫秒触发一次
          }

          // 延迟再次更新DOM，确保变更生效
          setTimeout(() => {
            updateDomElements();
          }, 1000);
        } else {
          ElMessage.error(result?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存基本设置异常:', error);
        ElMessage.error('保存失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };

    // 保存短信设置
    const saveSmsSettings = () => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage({
          type: 'success',
          message: '短信设置已保存！'
        });
      }, 300);
    };

    // 测试发送短信
    const testSms = () => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage({
          type: 'success',
          message: '测试短信已发送！'
        });
      }, 300);
    };

    // 保存支付设置
    const savePaymentSettings = async () => {
      saveLoading.value = true;

      try {
        const result = await adminApi.saveModuleConfig('payment', {
          enable_wechat_pay: paymentForm.wxpayMchId !== '' ? '1' : '0',
          enable_alipay: paymentForm.alipayMchId !== '' ? '1' : '0',
          wechat_pay_mchid: paymentForm.wxpayMchId,
          wechat_pay_key: paymentForm.wxpayKey,
          wechat_pay_cert_path: paymentForm.wxpayCertPath,
          alipay_mch_id: paymentForm.alipayMchId,
          alipay_appid: paymentForm.alipayAppId,
          alipay_private_key: paymentForm.alipayPrivateKey,
          alipay_public_key: paymentForm.alipayPublicKey
        });

        if (result && result.code === 0) {
          ElMessage.success('支付设置保存成功');
        } else {
          ElMessage.error(result?.message || '保存失败');
        }
      } catch (error) {
        console.error('保存支付设置异常:', error);
        ElMessage.error('保存失败: ' + (error.message || '未知错误'));
      } finally {
        saveLoading.value = false;
      }
    };

    // 保存其他设置
    const saveOtherSettings = () => {
      // 模拟API调用
      setTimeout(() => {
        ElMessage({
          type: 'success',
          message: '其他设置已保存！'
        });
      }, 300);
    };

    // 清理缓存
    const clearCache = async (type) => {
      clearing.value = true;
      try {
        const result = await adminApi.saveModuleConfig('cache', { cache_type: type });

        if (result && result.code === 0) {
          ElMessage.success('缓存清理成功');
        } else {
          ElMessage.error(result?.message || '缓存清理失败');
          console.error('缓存清理接口返回错误:', result);
        }
      } catch (error) {
        console.error('清理缓存出错:', error);
        ElMessage.error('缓存清理异常: ' + (error.message || '未知错误'));
      } finally {
        clearing.value = false;
      }
    };

    // 微信证书上传成功
    const handleWxCertSuccess = (res) => {
      paymentForm.wxpayCertPath = res.path;
      ElMessage({
        type: 'success',
        message: '证书上传成功！'
      });
    };

    // Logo上传前检查
    const beforeLogoUpload = (file) => {
      const isImage = file.type.startsWith('image/');
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        ElMessage.error('上传Logo图片只能是图片格式!');
        return false;
      }
      if (!isLt2M) {
        ElMessage.error('上传Logo图片大小不能超过 2MB!');
        return false;
      }
      return isImage && isLt2M;
    };

    // Favicon上传前检查
    const beforeFaviconUpload = (file) => {
      const isValidFormat = file.type === 'image/x-icon' || file.type === 'image/vnd.microsoft.icon' || file.type === 'image/png' || file.type === 'image/jpeg';
      const isLt1M = file.size / 1024 / 1024 < 1;

      if (!isValidFormat) {
        ElMessage.error('网站图标只能是 ICO/PNG/JPG 格式!');
      }
      if (!isLt1M) {
        ElMessage.error('网站图标大小不能超过 1MB!');
      }
      return isValidFormat && isLt1M;
    };

    // 上传logo处理
    const uploadLogo = async (options) => {
      const { file } = options;
      const formData = new FormData();
      formData.append('logo', file);

      try {
        loading.value = true;
        const response = await adminApi.uploadLogo(formData);
        loading.value = false;

        if (response && response.code === 0) {
          ElMessage.success('Logo上传成功');
          basicForm.logo = response.data.url;


          // 更新全局配置
          if (window.Laravel && window.Laravel.siteConfig) {
            window.Laravel.siteConfig.siteLogo = basicForm.logo;

          }

          // 立即更新DOM元素
          updateDomElements();

          // 强制刷新页面上的所有图片
          document.querySelectorAll('img').forEach(img => {
            const src = img.src;
            if (src.includes('logo')) {
              // 添加时间戳参数强制刷新
              const newSrc = src.split('?')[0] + '?t=' + new Date().getTime();
              img.src = newSrc;

            }
          });

          // 触发全局事件，通知其他组件更新 - 多次触发确保接收
          for (let i = 0; i < 5; i++) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('system-settings-updated', {
                detail: {
                  siteName: basicForm.siteName,
                  siteLogo: basicForm.logo,
                  copyright: basicForm.copyright
                }
              }));


              // 每次事件触发后也强制更新DOM
              updateDomElements();
            }, i * 500); // 每500毫秒触发一次，持续更长时间
          }

          // 最后一次尝试，延迟3秒后再次更新
          setTimeout(() => {
            updateDomElements();

            // 强制重载页面上的所有logo图片
            document.querySelectorAll('.logo img').forEach(img => {
              const originalSrc = img.getAttribute('src');
              img.setAttribute('src', '');
              setTimeout(() => {
                img.setAttribute('src', originalSrc + '?t=' + new Date().getTime());
              }, 50);
            });
          }, 3000);
        } else {
          ElMessage.error(response?.message || 'Logo上传失败');
        }
      } catch (error) {
        loading.value = false;
        console.error('Logo上传失败:', error);
        ElMessage.error('Logo上传失败: ' + (error?.message || '未知错误'));
      }
    };

    // 上传favicon处理
    const uploadFavicon = async (options) => {
      const { file } = options;
      const formData = new FormData();
      formData.append('favicon', file);

      try {
        loading.value = true;
        const response = await adminApi.uploadFavicon(formData);
        loading.value = false;

        if (response && response.code === 0) {
          ElMessage.success('网站图标上传成功');
          basicForm.favicon = response.data.url;

          // 立即更新favicon
          updateFavicon();

          // 触发全局事件，通知其他组件更新
          window.dispatchEvent(new CustomEvent('system-settings-updated', {
            detail: {
              siteName: basicForm.siteName,
              siteLogo: basicForm.logo,
              siteFavicon: basicForm.favicon,
              copyright: basicForm.copyright
            }
          }));
        } else {
          ElMessage.error(response?.message || '网站图标上传失败');
        }
      } catch (error) {
        loading.value = false;
        console.error('网站图标上传失败:', error);
        ElMessage.error('网站图标上传失败: ' + (error?.message || '未知错误'));
      }
    };

    // 切换标签页时加载相应的设置
    const handleTabChange = (tab) => {
      // 重置错误状态
      statusError.value = '';

      if (tab === 'basic') {
        fetchSettings();
      } else if (tab === 'payment') {
        fetchSettings();
      }
      // 微信、短信和导航标签页会自动加载其组件中的数据
    };

    // 自动更新DOM元素
    const updateDomElements = () => {


      // 立即更新标题
      document.title = basicForm.siteName;

      // 更新左上角标题 - 使用更精确的选择器
      const headerLogos = document.querySelectorAll('.logo span');
      headerLogos.forEach(span => {
        span.textContent = basicForm.siteName;

      });



      // 更新左侧导航栏的logo - 使用多种选择器和强制更新
      const logoSelectors = ['.logo img', '.aside .logo img', '.el-aside .logo img'];
      logoSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(img => {
          const logoSrc = basicForm.logo;
          // 添加时间戳参数强制刷新
          const timestamp = new Date().getTime();
          const newSrc = (logoSrc.startsWith('http') || logoSrc.startsWith('/'))
            ? `${logoSrc}?t=${timestamp}`
            : `${(window.BASE_URL || '/')}${logoSrc}?t=${timestamp}`;

          // 强制更新图片
          img.setAttribute('src', newSrc);


          // 创建新图片元素替换旧元素
          const newImg = document.createElement('img');
          newImg.src = newSrc;
          newImg.alt = 'Logo';
          newImg.style.width = '32px';
          newImg.style.height = '32px';
          newImg.style.marginRight = '8px';

          // 替换旧图片
          if (img.parentNode) {
            img.parentNode.replaceChild(newImg, img);

          }
        });
      });

      // 如果没有找到logo图片，尝试直接插入
      const logoContainers = document.querySelectorAll('.logo');
      logoContainers.forEach(container => {
        if (!container.querySelector('img')) {
          const logoSrc = basicForm.logo;
          const timestamp = new Date().getTime();
          const newSrc = (logoSrc.startsWith('http') || logoSrc.startsWith('/'))
            ? `${logoSrc}?t=${timestamp}`
            : `${(window.BASE_URL || '/')}${logoSrc}?t=${timestamp}`;

          const newImg = document.createElement('img');
          newImg.src = newSrc;
          newImg.alt = 'Logo';
          newImg.style.width = '32px';
          newImg.style.height = '32px';
          newImg.style.marginRight = '8px';

          // 插入到容器的最前面
          container.insertBefore(newImg, container.firstChild);

        }
      });

      // 更新页脚版权信息
      const footerElement = document.querySelector('.app-footer');
      if (footerElement) {
        footerElement.textContent = basicForm.copyright || '©2025 点点够 版权所有';

      }

      // 更新favicon
      updateFavicon();

      // 触发全局事件，通知其他组件更新
      window.dispatchEvent(new CustomEvent('system-settings-updated', {
        detail: {
          siteName: basicForm.siteName,
          siteLogo: basicForm.logo + '?t=' + new Date().getTime(),
          copyright: basicForm.copyright
        }
      }));



      // 强制重绘侧边栏
      const aside = document.querySelector('.el-aside');
      if (aside) {
        const originalDisplay = aside.style.display;
        aside.style.display = 'none';
        setTimeout(() => {
          aside.style.display = originalDisplay;

        }, 50);
      }
    };

    // 更新favicon
    const updateFavicon = () => {
      if (basicForm.favicon) {
        // 移除现有的favicon链接
        const existingFavicons = document.querySelectorAll("link[rel*='icon']");
        existingFavicons.forEach(favicon => favicon.remove());

        // 创建新的favicon链接
        const favicon = document.createElement('link');
        favicon.type = 'image/x-icon';
        favicon.rel = 'shortcut icon';
        favicon.href = basicForm.favicon + '?t=' + new Date().getTime();
        document.getElementsByTagName('head')[0].appendChild(favicon);

        // 同时创建apple-touch-icon
        const appleFavicon = document.createElement('link');
        appleFavicon.rel = 'apple-touch-icon';
        appleFavicon.href = basicForm.favicon + '?t=' + new Date().getTime();
        document.getElementsByTagName('head')[0].appendChild(appleFavicon);
      }
    };

    onMounted(() => {
      // 加载初始标签页的设置
      handleTabChange(activeTab.value);
    });

    return {
      activeTab,
      clearing,
      loading,
      saveLoading,
      statusError,
      basicFormRef,
      basicForm,
      smsFormRef,
      smsForm,
      paymentFormRef,
      paymentForm,
      otherFormRef,
      otherForm,
      logoUrl,
      faviconUrl,
      saveBasicSettings,
      saveSmsSettings,
      testSms,
      savePaymentSettings,
      saveOtherSettings,
      clearCache,
      handleWxCertSuccess,
      uploadLogo,
      uploadFavicon,
      beforeFaviconUpload,
      handleTabChange,
      updateDomElements,
      updateFavicon
    };
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-form {
  max-width: 800px;
  margin-top: 20px;
  position: relative;
  z-index: 10;
}

.setting-form::before,
.setting-form::after {
  display: none;
}

.avatar-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
  object-fit: cover;
}

.cache-container {
  padding: 20px 0;
}

.tip-text {
  margin-bottom: 20px;
  color: #666;
}

.cache-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.favicon-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.favicon-uploader:hover {
  border-color: #409eff;
}

.favicon-uploader-icon {
  font-size: 24px;
  color: #8c939d;
  width: 64px;
  height: 64px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
}

.favicon {
  width: 64px;
  height: 64px;
  display: block;
  object-fit: cover;
}

.favicon-tip {
  margin-top: 8px;
}
</style>