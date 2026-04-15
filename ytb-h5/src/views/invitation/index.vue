<template>
  <div class="invitation-container" :style="containerStyle">
    <!-- 背景音乐 -->
    <audio ref="bgMusic" :src="invitation.background_music" loop class="hidden"></audio>
    
    <!-- 顶部音乐控制 -->
    <div class="music-control" @click="toggleMusic">
      <van-icon :name="isPlaying ? 'music-o' : 'play-circle-o'" :class="{'rotate': isPlaying}" />
    </div>
    
    <!-- 头部区域 -->
    <div class="header">
      <div class="title-animated">
        <h1 class="invitation-title">{{ invitation.title || '点点够运营中心开业庆典' }}</h1>
      </div>
      
      <div class="sparkle-container">
        <div class="sparkle-1"></div>
        <div class="sparkle-2"></div>
        <div class="sparkle-3"></div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="content">
      <div class="invitation-card">
        <div class="card-inner" :class="{'card-flipped': showForm}">
          <!-- 卡片正面 - 邀请函内容 -->
          <div class="card-front">
            <div class="invitation-content" v-html="contentHtml"></div>
            
            <div class="event-info">
              <div class="event-time">
                <van-icon name="clock-o" />
                <span>{{ formatDate(invitation.event_time) }}</span>
              </div>
              
              <div class="event-location" @click="navigateToMap">
                <van-icon name="location-o" />
                <span>{{ invitation.map_address || '点点够武夷山运营中心' }}</span>
              </div>
            </div>
            
            <div class="action-buttons">
              <van-button type="primary" block round class="btn-register" @click="flipCard">我要参加</van-button>
              <van-button plain type="primary" block round class="btn-navigate" @click="navigateToMap">导航前往</van-button>
            </div>
            
            <div class="footer-text">期待您的光临！</div>
          </div>
          
          <!-- 卡片背面 - 报名表单 -->
          <div class="card-back">
            <div class="form-header">
              <van-icon name="arrow-left" class="back-icon" @click="flipCard" />
              <h3>填写信息</h3>
            </div>
            
            <van-form @submit="onSubmit">
              <van-cell-group inset>
                <van-field
                  v-model="form.name"
                  name="name"
                  label="姓名"
                  placeholder="请输入您的姓名"
                  :rules="[{ required: true, message: '请输入姓名' }]"
                />
                
                <van-field
                  v-model="form.phone"
                  name="phone"
                  label="手机号"
                  placeholder="请输入您的手机号"
                  :rules="[
                    { required: true, message: '请输入手机号' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                  ]"
                />
              </van-cell-group>
              
              <div style="margin: 16px;">
                <van-button round block type="primary" native-type="submit" :loading="submitting">
                  确认参加
                </van-button>
              </div>
            </van-form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部装饰 -->
    <div class="decoration-bottom">
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
    </div>
    
    <!-- 加载中 -->
    <div class="loading-container" v-if="loading">
      <van-loading color="#1989fa" size="24px">加载中...</van-loading>
    </div>
    
    <!-- 注册成功弹窗 -->
    <van-dialog v-model:show="showSuccessDialog" title="报名成功" :showConfirmButton="true">
      <div class="success-content">
        <van-icon name="success" size="40" color="#07c160" />
        <p>恭喜您，报名成功！</p>
        <p>我们期待在开业庆典上与您相见！</p>
      </div>
    </van-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast, showDialog } from 'vant';
import request from '@/utils/request';
import { getWechatInfo } from '@/utils/wechat';

export default {
  name: 'InvitationPage',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const bgMusic = ref(null);
    const isPlaying = ref(false);
    const loading = ref(true);
    const showForm = ref(false);
    const submitting = ref(false);
    const showSuccessDialog = ref(false);
    
    // 邀请函数据
    const invitation = reactive({
      id: route.params.id,
      title: '点点够武夷山运营中心开业庆典',
      content: '<p>诚挚邀请您参加点点够武夷山运营中心的开业庆典！</p><p>我们将为您呈现一场精彩的活动，有丰富的礼品和惊喜等着您！</p>',
      background_image: '',
      background_music: '',
      map_location: '点点够武夷山运营中心',
      map_address: '福建省武夷山市xxxx路xx号',
      map_longitude: '',
      map_latitude: '',
      event_time: new Date(),
    });
    
    // 用户信息
    const userInfo = reactive({
      open_id: '',
      nickname: '',
      avatar: '',
      app_user_id: null,
      guest_id: null,
      referrer_id: null,
    });
    
    // 表单数据
    const form = reactive({
      name: '',
      phone: '',
    });
    
    // 背景样式
    const containerStyle = computed(() => {
      return {
        backgroundImage: invitation.background_image ? `url(${invitation.background_image})` : 'linear-gradient(to bottom, #ff9a9e, #fad0c4)',
      };
    });
    
    // 内容HTML
    const contentHtml = computed(() => {
      return invitation.content || '<p>诚挚邀请您参加点点够武夷山运营中心的开业庆典！</p><p>我们将为您呈现一场精彩的活动，有丰富的礼品和惊喜等着您！</p>';
    });
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '敬请期待';
      const date = new Date(dateString);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    };
    
    // 播放/暂停背景音乐
    const toggleMusic = () => {
      if (bgMusic.value) {
        if (isPlaying.value) {
          bgMusic.value.pause();
        } else {
          bgMusic.value.play().catch(err => {
            console.error('无法播放音乐:', err);
          });
        }
        isPlaying.value = !isPlaying.value;
      }
    };
    
    // 翻转卡片
    const flipCard = () => {
      showForm.value = !showForm.value;
    };
    
    // 导航到地图
    const navigateToMap = () => {
      if (invitation.map_longitude && invitation.map_latitude) {
        window.location.href = `https://uri.amap.com/marker?position=${invitation.map_longitude},${invitation.map_latitude}&name=${encodeURIComponent(invitation.map_location)}&callnative=1`;
      } else {
        window.location.href = `https://uri.amap.com/search?keyword=${encodeURIComponent(invitation.map_address || '点点够武夷山运营中心')}&callnative=1`;
      }
    };
    
    // 提交表单
    const onSubmit = async () => {
      submitting.value = true;
      try {
        const response = await request.post(`/api/invitation/${invitation.id}/register`, {
          name: form.name,
          phone: form.phone,
          open_id: userInfo.open_id,
          guest_id: userInfo.guest_id,
          app_user_id: userInfo.app_user_id,
        });
        
        if (response.data.code === 0) {
          showSuccessDialog.value = true;
        } else {
          showToast(response.data.message || '提交失败，请稍后重试');
        }
      } catch (error) {
        console.error('提交失败:', error);
        showToast('网络错误，请稍后重试');
      } finally {
        submitting.value = false;
      }
    };
    
    // 获取邀请函详情
    const getInvitationDetail = async () => {
      loading.value = true;
      try {
        const response = await request.get(`/api/invitation/${route.params.id}`);
        
        if (response.data.code === 0) {
          // 更新邀请函数据
          Object.assign(invitation, response.data.data);
          
          // 如果有背景音乐，自动播放
          if (invitation.background_music && bgMusic.value) {
            // 延迟一秒播放，避免浏览器策略限制
            setTimeout(() => {
              bgMusic.value.play().then(() => {
                isPlaying.value = true;
              }).catch(err => {
                console.error('无法自动播放音乐:', err);
              });
            }, 1000);
          }
        } else {
          showToast(response.data.message || '获取邀请函详情失败');
        }
      } catch (error) {
        console.error('获取邀请函详情失败:', error);
        showToast('网络错误，请稍后重试');
      } finally {
        loading.value = false;
      }
    };
    
    // 访问邀请函，记录信息
    const joinInvitation = async () => {
      try {
        // 获取URL参数
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('referrer_id');
        
        if (referrerId) {
          userInfo.referrer_id = referrerId;
        }
        
        // 获取微信授权信息
        const wechatInfo = await getWechatInfo();
        if (wechatInfo) {
          userInfo.open_id = wechatInfo.openId;
          userInfo.nickname = wechatInfo.nickname;
          userInfo.avatar = wechatInfo.headimgurl;
        }
        
        // 记录访问
        const response = await request.post(`/api/invitation/${route.params.id}/join`, {
          open_id: userInfo.open_id,
          nickname: userInfo.nickname,
          avatar: userInfo.avatar,
          referrer_id: userInfo.referrer_id,
        });
        
        if (response.data.code === 0) {
          userInfo.guest_id = response.data.data.guest_id;
          userInfo.app_user_id = response.data.data.app_user_id;
        }
      } catch (error) {
        console.error('记录访问信息失败:', error);
      }
    };
    
    onMounted(async () => {
      await getInvitationDetail();
      await joinInvitation();
      
      // 添加动画类
      setTimeout(() => {
        const titleEl = document.querySelector('.invitation-title');
        if (titleEl) {
          titleEl.classList.add('animated');
        }
      }, 500);
    });
    
    onUnmounted(() => {
      // 离开页面时停止音乐
      if (bgMusic.value && !bgMusic.value.paused) {
        bgMusic.value.pause();
      }
    });
    
    return {
      bgMusic,
      isPlaying,
      loading,
      invitation,
      containerStyle,
      contentHtml,
      showForm,
      form,
      submitting,
      showSuccessDialog,
      formatDate,
      toggleMusic,
      flipCard,
      navigateToMap,
      onSubmit,
    };
  }
};
</script>

<style scoped>
.invitation-container {
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.music-control {
  position: fixed;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rotate {
  animation: rotation 3s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.header {
  padding: 30px 20px;
  text-align: center;
  position: relative;
}

.title-animated {
  position: relative;
  overflow: hidden;
  padding: 10px 0;
}

.invitation-title {
  color: #ae0001;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  padding: 10px 0;
  position: relative;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1s, transform 1s;
}

.invitation-title.animated {
  opacity: 1;
  transform: translateY(0);
}

.sparkle-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sparkle-1, .sparkle-2, .sparkle-3 {
  position: absolute;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFD700' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'%3E%3C/polygon%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.8;
}

.sparkle-1 {
  top: 20%;
  left: 10%;
  width: 20px;
  height: 20px;
  animation: sparkle 3s infinite linear;
}

.sparkle-2 {
  top: 15%;
  right: 15%;
  width: 16px;
  height: 16px;
  animation: sparkle 4s infinite linear;
}

.sparkle-3 {
  bottom: 10%;
  left: 40%;
  width: 24px;
  height: 24px;
  animation: sparkle 5s infinite linear;
}

@keyframes sparkle {
  0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50% { transform: scale(1.3) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}

.invitation-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s;
}

.card-flipped {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 16px;
  padding: 24px;
}

.card-back {
  transform: rotateY(180deg);
  background: white;
}

.invitation-content {
  text-align: center;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
}

.event-info {
  margin: 20px 0;
}

.event-time, .event-location {
  display: flex;
  align-items: center;
  margin: 10px 0;
  font-size: 14px;
  color: #666;
}

.event-time .van-icon, .event-location .van-icon {
  margin-right: 8px;
  color: #ee0a24;
}

.event-location {
  cursor: pointer;
  text-decoration: underline;
}

.action-buttons {
  margin: 24px 0;
}

.btn-register {
  margin-bottom: 12px;
}

.footer-text {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

.form-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-icon {
  margin-right: 10px;
  font-size: 20px;
}

.form-header h3 {
  margin: 0;
  font-size: 18px;
}

.decoration-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 150px;
  overflow: hidden;
  z-index: 1;
}

.wave {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23ff9a9e' fill-opacity='0.8' d='M0,96L48,112C96,128,192,160,288,170.7C384,181,480,171,576,144C672,117,768,75,864,69.3C960,64,1056,96,1152,106.7C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E");
  background-size: cover;
  background-position: center;
}

.wave1 {
  animation: wave 20s -3s linear infinite;
  opacity: 0.4;
  height: 60px;
}

.wave2 {
  animation: wave 15s linear reverse infinite;
  opacity: 0.2;
  bottom: 10px;
  height: 40px;
}

@keyframes wave {
  0% { transform: translateX(0); }
  50% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.success-content .van-icon {
  margin-bottom: 16px;
}

.success-content p {
  margin: 5px 0;
  text-align: center;
}

.hidden {
  display: none;
}
</style> 