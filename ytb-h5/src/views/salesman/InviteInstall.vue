<template>
  <div>
    <div class="page-simple-wrapper">
      <div id="simpleHeader" class="simple-header">
        <div class="back-btn" @click="$router.back()">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M672 172c-12.8-12.8-32-12.8-44.8 0L352 448c-12.8 12.8-12.8 32 0 44.8l272 272c12.8 12.8 35.2 12.8 48 0 12.8-12.8 12.8-32 0-44.8L419.2 480l252.8-252.8c12.8-16 12.8-38.4 0-55.2z" fill="currentColor"></path>
          </svg>
        </div>
        <div class="title">邀请安装</div>
        <div class="placeholder"></div>
      </div>
      
      <div class="simple-content">
        <div class="section user-info">
          <div class="user-info-content">
            <div class="avatar">
              <img :src="userAvatar" alt="用户头像">
            </div>
            <div class="user-details">
              <div class="name">{{ userName }}</div>
              <div class="user-id">业务员ID: {{ userId }}</div>
            </div>
          </div>
        </div>
        
        <div class="section qrcode-section">
          <div class="section-header">
            <div class="section-title">净水器预约安装</div>
            <div class="tag">永久有效</div>
          </div>
          <div class="qrcode-container">
            <div id="qrcodeEl" class="qrcode">
              <!-- 这里将由QRCode.js生成二维码 -->
            </div>
            <div class="qrcode-note">扫描二维码预约安装净水器</div>
            <div class="qrcode-buttons">
              <button 
                class="save-button"
                @click="shareQRCode"
              >
                <i class="save-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </i>
                保存到相册
              </button>
              <button 
                class="share-button"
                @click="showShareTip"
              >
                <i class="share-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </i>
                分享给好友
              </button>
            </div>
          </div>
        </div>
        
        <div class="section package-section">
          <div class="section-header">
            <div class="section-title">净水器套餐信息</div>
          </div>
          <div class="package-list">
            <div class="package-group">
              <div class="group-title">家用净水套餐</div>
              <div class="package-item">
                <div>个人/企业套餐</div>
                <div class="price">980元</div>
              </div>
              <div class="package-item">
                <div>无限畅饮套餐</div>
                <div class="price">1200元</div>
              </div>
            </div>
            <div class="package-group">
              <div class="group-title">商用净水套餐</div>
              <div class="package-item">
                <div>商务机包年套餐</div>
                <div class="price">2400元</div>
              </div>
              <div class="package-item">
                <div>商务机流量套餐</div>
                <div class="price">3700元</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section info-section">
          <div class="section-header">
            <div class="section-title">安装服务说明</div>
          </div>
          <div class="info-list">
            <div class="info-item">标准安装费：120元</div>
            <div class="info-item">专业工程师上门安装</div>
            <div class="info-item">安装完成后三方签字确认</div>
            <div class="info-item">提供完善售后服务</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 自定义分享图片对话框 -->
    <div v-if="showShareImage" class="share-dialog-overlay" @click="closeShareDialog">
      <div class="share-dialog-content" @click.stop>
        <div class="share-dialog-header">
          <span class="share-dialog-title">分享图片</span>
        </div>
        <div class="share-dialog-body">
          <img :src="shareImageUrl" alt="分享图片" class="share-image" ref="shareImage">
          <div class="share-image-tip">长按图片可保存到相册</div>
        </div>
        <div class="share-dialog-footer">
          <button class="share-dialog-button" @click="closeShareDialog">关闭</button>
        </div>
      </div>
    </div>
    
    <!-- 简单提示 -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import { setShareMetadata } from '@/utils/share'; // 引入分享工具

export default {
  name: 'InviteInstall',
  data() {
    return {
      userName: '业务员',
      userId: '-',
      userAvatar: '/app/images/profile/default-avatar.png',
      inviteUrl: '',
      qrcode: null,
      shareImageUrl: '',
      showShareImage: false,
      toast: {
        show: false,
        message: '',
        type: 'default',
        timer: null
      }
    }
  },
  mounted() {
    // 确保用户信息加载完成后再进行后续操作
    this.loadUserInfo().then(() => { 
      this.inviteUrl = this.getInviteUrl();
      this.setupShare(); // 设置分享信息
      // 等待DOM完全渲染后再加载二维码
      this.$nextTick(() => {
        this.loadQRCode();
      });
    }).catch(error => {
        console.error("加载用户信息或设置分享时出错:", error);
        // 即使出错，也尝试加载二维码
        this.inviteUrl = this.getInviteUrl(); 
        this.$nextTick(() => {
          this.loadQRCode();
        });
    });
  },
  methods: {
    // 自定义Toast显示
    showToast(message, type = 'default', duration = 2000) {
      // 清除之前的定时器
      if (this.toast.timer) {
        clearTimeout(this.toast.timer);
      }
      
      // 设置新消息
      this.toast.show = true;
      this.toast.message = message;
      this.toast.type = type;
      
      // 设置自动关闭
      this.toast.timer = setTimeout(() => {
        this.toast.show = false;
      }, duration);
    },
    
    // 修改 loadUserInfo 为 async 并返回 Promise, 增加健壮性
    async loadUserInfo() {
      return new Promise((resolve, reject) => { // 添加 reject
        try {
          const storageInfo = localStorage.getItem('userInfo');
          if (storageInfo) {
            const userInfo = JSON.parse(storageInfo);
            // 优先使用 name, 其次 nickname, 再次 wechat_nickname
            this.userName = userInfo.name || userInfo.nickname || userInfo.wechat_nickname || '业务员'; 
            this.userId = userInfo.id || userInfo.userId || '-';
            
            // 优先使用wechat_avatar，其次是avatar，然后是headimgurl
            let avatarFound = false;
            if (userInfo.wechat_avatar) {
              this.userAvatar = userInfo.wechat_avatar;
              avatarFound = true;
            } else if (userInfo.avatar) {
              this.userAvatar = userInfo.avatar;
               avatarFound = true;
            } else if (userInfo.headimgurl) {
              this.userAvatar = userInfo.headimgurl;
               avatarFound = true;
            }
            
            // 确保头像URL是绝对路径 (仅当找到头像时)
            if (avatarFound && this.userAvatar && !this.userAvatar.startsWith('http') && !this.userAvatar.startsWith('/')) {
              this.userAvatar = '/' + this.userAvatar;
            }
            
            // 如果用户头像以http开头，尝试转换为https (仅当找到头像时)
            if (avatarFound && this.userAvatar && this.userAvatar.startsWith('http:')) {
              this.userAvatar = this.userAvatar.replace('http:', 'https');
            }

            // 如果处理后头像无效或未找到头像，使用默认头像
            if (!avatarFound || !this.userAvatar || this.userAvatar === '/') {
              this.userAvatar = '/app/images/profile/default-avatar.png';
            }

          } else {
             // 如果没有用户信息，使用默认值
             this.userName = '业务员';
             this.userId = '-';
             this.userAvatar = '/app/images/profile/default-avatar.png';
          }
          resolve(); // 用户信息处理完成
        } catch (e) {
          console.error('加载或解析用户信息失败', e);
          // 出错时设置默认值
          this.userName = '业务员';
          this.userId = '-';
          this.userAvatar = '/app/images/profile/default-avatar.png';
          reject(new Error('加载用户信息失败')); // 传递错误
        }
      });
    },
    
    getInviteUrl() {
      // 从localStorage获取用户ID
      let id = '-';
      try {
        const storageInfo = localStorage.getItem('userInfo');
        if (storageInfo) {
          const userInfo = JSON.parse(storageInfo);
          id = userInfo.id || userInfo.userId || '-'; // 确保有 userId
        }
      } catch (e) {
        console.error("从localStorage获取用户ID失败", e);
      }
      // 确保协议是 https
      return `https://pay.itapgo.com/app/#/install-booking?referrer_id=${id}`;
    },
    
    closeShareDialog() {
      this.showShareImage = false;
      if (this.shareImageUrl) {
        URL.revokeObjectURL(this.shareImageUrl);
        this.shareImageUrl = '';
      }
    },

    // 新增设置分享方法
    setupShare() {
      try {
        const shareTitle = `${this.userName || '业务员'} 邀请您预约安装净水器`;
        const shareDesc = `点击提交预约安装，享受母婴级鲜活水服务！`; // 更新文字
        const shareLink = this.inviteUrl;
        // 使用默认 Logo，更稳定可靠
        const shareLogo = 'https://pay.itapgo.com/images/logo.png'; 
        // 也可以考虑使用用户头像，但需确URL保有效且可访问
                  // const shareLogo = this.userAvatar || 'https://pay.itapgo.com/images/logo.png';

        // --- 添加日志 ---
        console.log('[InviteInstall] setupShare - inviteUrl:', shareLink); 
        if (!shareLink || !shareLink.includes('install-booking')) {
            console.warn('[InviteInstall] setupShare - inviteUrl seems incorrect!', shareLink);
        }
        // --- 结束日志 ---

        console.log("[InviteInstall] Calling setShareMetadata with:", { shareTitle, shareDesc, shareLink, shareLogo });

        setShareMetadata({
          title: shareTitle,
          subtitle: shareDesc, // share.js 里用的是 subtitle, 会传递给 desc
          logo: shareLogo,
          url: shareLink
        });
      } catch (error) {
          console.error("设置分享元数据时出错:", error);
      }
    },
    
    loadQRCode() {
      // 动态加载QRCode库
      const loadScript = () => {
        return new Promise((resolve, reject) => {
          // 检查是否已经加载了QRCode库
          if (window.QRCode) {
            resolve(window.QRCode);
            return;
          }
          
          // 创建script标签加载本地QRCode库
          const script = document.createElement('script');
          // 使用本地文件，加载速度更快
          script.src = './js/qrcode.min.js';
          script.onload = () => resolve(window.QRCode);
          script.onerror = () => {
            console.warn('本地QRCode库加载失败，尝试备用CDN');
            // 备用国内CDN
            const backupScript = document.createElement('script');
            backupScript.src = 'https://lib.baomitu.com/qrcodejs/1.0.0/qrcode.min.js';
            backupScript.onload = () => resolve(window.QRCode);
            backupScript.onerror = () => {
              console.warn('备用CDN加载失败，尝试另一个CDN');
              // 最后尝试另一个CDN
              const fallbackScript = document.createElement('script');
              fallbackScript.src = 'https://cdn.staticfile.org/qrcodejs/1.0.0/qrcode.min.js';
              fallbackScript.onload = () => resolve(window.QRCode);
              fallbackScript.onerror = () => reject(new Error('所有来源加载失败'));
              document.body.appendChild(fallbackScript);
            };
            document.body.appendChild(backupScript);
          };
          document.body.appendChild(script);
        });
      };
      
      // 在加载库之前先显示加载中的提示
      const qrcodeEl = document.getElementById('qrcodeEl');
      if (qrcodeEl) {
        qrcodeEl.innerHTML = '<div style="text-align:center;padding:20px;">加载中...</div>';
      }
      
      // 加载库并生成二维码，设置超时处理
      const timeout = setTimeout(() => {
        // 如果3秒后还没有加载成功，直接使用静态图片
        const qrcodeEl = document.getElementById('qrcodeEl');
        if (qrcodeEl) {
          qrcodeEl.innerHTML = `<img src="/app/images/qrcode-example.png" alt="预约安装二维码" class="qrcode-img">`;
          console.log('二维码加载超时，使用静态图片');
        }
      }, 3000);
      
      loadScript()
        .then(QRCode => {
          clearTimeout(timeout); // 清除超时处理
          // 确保容器元素存在
          const qrcodeEl = document.getElementById('qrcodeEl');
          if (qrcodeEl) {
            // 清空容器
            qrcodeEl.innerHTML = '';
            
            // 创建二维码
            this.qrcode = new QRCode(qrcodeEl, {
              text: this.inviteUrl,
              width: 180,
              height: 180,
              colorDark: '#000000',
              colorLight: '#ffffff',
              correctLevel: QRCode.CorrectLevel.H
            });
            
            console.log('二维码生成成功');
          } else {
            console.error('找不到二维码容器元素');
          }
        })
        .catch(error => {
          clearTimeout(timeout); // 清除超时处理
          console.error('生成二维码失败:', error);
          // 如果生成失败，使用备用方案显示静态图片
          const qrcodeEl = document.getElementById('qrcodeEl');
          if (qrcodeEl) {
            qrcodeEl.innerHTML = `<img src="/app/images/qrcode-example.png" alt="预约安装二维码" class="qrcode-img">`;
          }
          this.showToast('生成二维码失败，已使用示例图片', 'error');
        });
    },
    
    shareQRCode() {
      this.showToast('正在生成分享图片...', 'loading', 10000);
      
      try {
        // 查找二维码的canvas元素
        const canvas = document.querySelector('#qrcodeEl canvas');
        if (!canvas) {
          this.showToast('无法找到二维码图片', 'error');
          return;
        }
        
        // 创建一个临时画布，用于合成带有业务员信息的完整图片
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 320;
        tempCanvas.height = 480;
        const ctx = tempCanvas.getContext('2d');
        
        // 绘制白色背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 绘制标题
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('净水器预约安装', tempCanvas.width / 2, 40);
        
        // 绘制分隔线
        ctx.fillStyle = '#f1f1f1';
        ctx.fillRect(20, 55, tempCanvas.width - 40, 2);
        
        // 绘制业务员信息
        ctx.textAlign = 'center';
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText(`业务员: ${this.userName}`, tempCanvas.width / 2, 85);
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(`ID: ${this.userId}`, tempCanvas.width / 2, 110);
        
        // 在中间位置绘制二维码
        const qrX = (tempCanvas.width - 220) / 2;
        ctx.drawImage(canvas, qrX, 130, 220, 220);
        
        // 绘制说明文字
        ctx.fillStyle = '#333333';
        ctx.font = '16px Arial, sans-serif';
        ctx.fillText('扫描上方二维码，预约净水器安装', tempCanvas.width / 2, 380);
        
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('长按图片可保存到相册', tempCanvas.width / 2, 410);
        ctx.fillText('分享给需要安装净水器的客户', tempCanvas.width / 2, 435);
        
        // 转为图片URL
        tempCanvas.toBlob(blob => {
          this.showToast('分享图片生成成功', 'success');
          
          // 创建图片预览弹窗
          this.shareImageUrl = URL.createObjectURL(blob);
          this.showShareImage = true;
        }, 'image/png');
      } catch (error) {
        console.error('生成分享图片失败:', error);
        this.showToast('生成图片失败，请尝试截图保存', 'error');
      }
    },

    // 新增分享提示方法
    showShareTip() {
      this.showToast('请点击右上角菜单，然后选择"发送给朋友"分享', 'success', 4000);
    }
  }
}
</script>

<style scoped>
/* 使用简单的CSS样式，避免复杂选择器 */
.page-simple-wrapper {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.simple-header {
  display: flex;
  align-items: center;
  height: 46px;
  background-color: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  padding: 0 16px;
}

.back-btn {
  width: 24px;
  height: 24px;
  color: #333;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  visibility: visible !important;
  opacity: 1 !important;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
}

.placeholder {
  width: 24px;
}

.simple-content {
  padding: 16px;
}

.section {
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 16px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* 优化用户信息为左右结构 */
.user-info {
  /* display: flex; */ /* 移除flex，让内容块状排列 */
  align-items: center; /* 保持内容垂直居中 */
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 15px;
}

.user-info-content {
  display: flex; /* 内部使用flex布局 */
  align-items: center;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #eee;
  flex-shrink: 0;
}

.avatar img {
  width: 50px; /* 头像大小 */
  height: 50px;
  border-radius: 50%; /* 圆形头像 */
  margin-right: 15px; /* 头像和文字间距 */
  object-fit: cover;
  border: 1px solid #eee; /* 添加细边框 */
}

.user-details {
  display: flex;
  flex-direction: column; /* 名字和ID垂直排列 */
}

.user-details .name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px; /* 名字和ID间距 */
}

.user-details .user-id {
  font-size: 13px;
  color: #888;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.tag {
  margin-left: 10px;
  font-size: 12px;
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.qrcode-container {
  text-align: center;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode {
  width: 180px;
  height: 180px;
  margin: 0 auto 15px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding: 8px;
  border: 1px solid #f0f0f0;
}

.qrcode-img {
  width: 180px;
  height: 180px;
  border-radius: 4px;
}

.qrcode-note {
  font-size: 14px;
  color: #666;
  margin-bottom: 18px;
  font-weight: 500;
}

/* 二维码按钮组样式 */
.qrcode-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  gap: 12px; /* 增加按钮间距 */
  width: 100%;
  max-width: 280px; /* 限制按钮组最大宽度 */
}

.save-button, .share-button {
  flex: 1;
  height: 40px; /* 增加高度 */
  border: none;
  border-radius: 20px; /* 更圆润的边角 */
  font-size: 14px; /* 增大字体 */
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); /* 添加阴影 */
}

.save-button {
  background-color: #f5f7fa; /* 更柔和的背景色 */
  color: #323233;
  border: 1px solid #e8e8e8; /* 添加边框 */
}

.save-button:active {
  background-color: #e8e8e8;
  transform: translateY(1px); /* 点击效果 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.share-button {
  background-color: #1989fa;
  color: white;
}

.share-button:active {
  background-color: #0d7eeb;
  transform: translateY(1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.save-icon, .share-icon {
  display: flex;
  align-items: center;
  margin-right: 6px; /* 增加图标与文字间距 */
}

.save-icon svg, .share-icon svg {
  width: 18px; /* 增大图标 */
  height: 18px;
}

.package-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #333;
}

.package-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.package-item:last-child {
  border-bottom: none;
}

.price {
  font-weight: 600;
  color: #ff6b00;
}

.info-item {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  position: relative;
  padding-left: 12px;
}

.info-item:before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 4px;
  height: 4px;
  background-color: #999;
  border-radius: 50%;
}

/* 自定义弹窗样式 */
.share-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.share-dialog-content {
  width: 90%;
  max-width: 350px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.share-dialog-header {
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.share-dialog-title {
  font-size: 16px;
  font-weight: 600;
}

.share-dialog-body {
  padding: 20px;
  text-align: center;
}

.share-image {
  max-width: 100%;
  height: auto;
}

.share-image-tip {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.share-dialog-footer {
  padding: 12px 16px 16px;
  border-top: 1px solid #eee;
}

.share-dialog-button {
  width: 100%;
  height: 44px;
  background-color: #1989fa;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
}

/* 复制链接对话框 */
.copy-link-content {
  word-break: break-all;
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  text-align: left;
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
  user-select: text;
  -webkit-user-select: text;
}

/* 自定义Toast样式 */
.toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  z-index: 10000;
  max-width: 80%;
  text-align: center;
}

.toast.success {
  background-color: rgba(76, 175, 80, 0.9);
}

.toast.error {
  background-color: rgba(244, 67, 54, 0.9);
}

.toast.loading {
  background-color: rgba(33, 150, 243, 0.9);
}

/* 移除底部按钮区域 */
.action-buttons {
  display: none;
}

/* 移除分享提示 */
.share-tip {
  display: none;
}

/* 确保页面简单包装器有足够内边距 */
.page-simple-wrapper {
  padding-bottom: 20px; /* 增加底部内边距 */
}

/* 调整标题 */
.simple-header .title {
    font-size: 17px; /* 调整标题大小 */
    font-weight: 600; /* 加粗 */
}
</style> 