<template>
  <div class="tea-farmer-container">
    <van-nav-bar
      title="茶农助手"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />

    <div class="page-content">
      <van-notice-bar
        left-icon="volume-o"
        text="欢迎使用茶农助手，这里可以帮助您管理茶园信息、查看茶叶行情、获取种植技术指导。"
        :scrollable="true"
      />

      <!-- 数据概览卡片 -->
      <div class="statistics-card">
        <div class="card-header">
          <div class="title">茶园概览</div>
          <div class="subtitle">更新时间: {{ formatDate(new Date()) }}</div>
        </div>
        
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">12.5</div>
            <div class="stat-label">茶园面积(亩)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">980</div>
            <div class="stat-label">年产量(kg)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">35</div>
            <div class="stat-label">茶树年龄(年)</div>
          </div>
        </div>
      </div>

      <!-- 功能入口区 -->
      <div class="features-grid">
        <div class="feature-item" @click="navigateTo('tea-garden')">
          <div class="feature-icon">
            <van-icon name="flower-o" />
          </div>
          <div class="feature-text">茶园管理</div>
        </div>
        <div class="feature-item" @click="navigateTo('tea-market')">
          <div class="feature-icon">
            <van-icon name="chart-trending-o" />
          </div>
          <div class="feature-text">茶叶行情</div>
        </div>
        <div class="feature-item" @click="navigateTo('tech-guide')">
          <div class="feature-icon">
            <van-icon name="notes-o" />
          </div>
          <div class="feature-text">种植技术</div>
        </div>
        <div class="feature-item" @click="navigateTo('weather')">
          <div class="feature-icon">
            <van-icon name="sunny-o" />
          </div>
          <div class="feature-text">天气预报</div>
        </div>
        <div class="feature-item" @click="navigateTo('pest-control')">
          <div class="feature-icon">
            <van-icon name="shield-o" />
          </div>
          <div class="feature-text">病虫防治</div>
        </div>
        <div class="feature-item" @click="navigateTo('harvest-record')">
          <div class="feature-icon">
            <van-icon name="calendar-o" />
          </div>
          <div class="feature-text">采收记录</div>
        </div>
        <div class="feature-item" @click="navigateTo('quality-test')">
          <div class="feature-icon">
            <van-icon name="certificate" />
          </div>
          <div class="feature-text">品质检测</div>
        </div>
        <div class="feature-item" @click="navigateTo('expert-consult')">
          <div class="feature-icon">
            <van-icon name="service-o" />
          </div>
          <div class="feature-text">专家咨询</div>
        </div>
      </div>

      <!-- 种植日历 -->
      <div class="calendar-section">
        <div class="section-header">
          <div class="section-title">茶农日历</div>
          <div class="section-more" @click="navigateTo('calendar')">
            查看更多 <van-icon name="arrow" />
          </div>
        </div>
        
        <div class="calendar-card">
          <div class="calendar-date">
            <div class="date-number">{{ getCurrentDay() }}</div>
            <div class="date-info">
              <div class="month">{{ getCurrentMonth() }}月</div>
              <div class="year">{{ getCurrentYear() }}年</div>
            </div>
          </div>
          
          <div class="calendar-content">
            <div class="calendar-title">白露茶采摘季</div>
            <div class="calendar-desc">
              白露时节（9月7日前后）茶叶采摘正当时，注意控制采摘标准，确保茶叶品质。
            </div>
          </div>
        </div>
      </div>

      <!-- 最新资讯 -->
      <div class="news-section">
        <div class="section-header">
          <div class="section-title">最新资讯</div>
          <div class="section-more" @click="navigateTo('news')">
            查看更多 <van-icon name="arrow" />
          </div>
        </div>
        
        <div class="news-list">
          <div class="news-item" v-for="(item, index) in newsList" :key="index" @click="navigateTo('news-detail', item)">
            <div class="news-content">
              <div class="news-title">{{ item.title }}</div>
              <div class="news-meta">
                <span class="news-source">{{ item.source }}</span>
                <span class="news-date">{{ item.date }}</span>
              </div>
            </div>
            <div class="news-image" v-if="item.image">
              <van-image :src="item.image" fit="cover" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

const router = useRouter();

// 模拟新闻数据
const newsList = ref([
  {
    id: 1,
    title: '2025年全国春茶产量预计增长15%，茶农收入有望提升',
    source: '农业资讯',
    date: '09-01',
    image: 'https://img01.yzcdn.cn/vant/cat.jpeg'
  },
  {
    id: 2,
    title: '茶叶有机种植技术推广会将于本月15日举行',
    source: '茶农之家',
    date: '09-01',
    image: null
  },
  {
    id: 3,
    title: '白茶市场需求持续增长，茶农应如何把握机遇？',
    source: '茶业日报',
    date: '08-30',
    image: 'https://img01.yzcdn.cn/vant/cat.jpeg'
  }
]);

// 导航方法
const onClickLeft = () => {
  router.back();
};

const navigateTo = (path, params) => {
  showToast({
    message: '功能开发中，敬请期待',
    position: 'bottom',
  });
  // 实际项目中应该跳转到对应页面
  // router.push({ path: `/tea-farmer/${path}`, query: params });
};

// 日期格式化
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentDay = () => {
  return new Date().getDate();
};

const getCurrentMonth = () => {
  return new Date().getMonth() + 1;
};

const getCurrentYear = () => {
  return new Date().getFullYear();
};

onMounted(() => {
  // 页面加载完成后的逻辑
});
</script>

<style scoped>
.tea-farmer-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 50px;
}

:deep(.van-nav-bar) {
  background-color: #10b981;
}

:deep(.van-nav-bar__title) {
  color: white;
  font-weight: bold;
}

:deep(.van-nav-bar .van-icon) {
  color: white;
}

:deep(.van-hairline--bottom::after) {
  border-bottom-width: 0;
}

.page-content {
  padding: 12px 16px;
}

/* 通知栏样式 */
:deep(.van-notice-bar) {
  margin-bottom: 16px;
  border-radius: 8px;
}

/* 统计卡片 */
.statistics-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 12px;
  color: #999;
}

.stats-row {
  display: flex;
  justify-content: space-between;
}

.stat-item {
  flex: 1;
  text-align: center;
  position: relative;
}

.stat-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 10%;
  height: 80%;
  width: 1px;
  background-color: #eee;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #10b981;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 功能入口 */
.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.feature-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background-color: #e8f7f1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.feature-icon :deep(.van-icon) {
  font-size: 24px;
  color: #10b981;
}

.feature-text {
  font-size: 12px;
  color: #333;
}

/* 日历部分 */
.calendar-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.section-more :deep(.van-icon) {
  font-size: 12px;
  margin-left: 2px;
}

.calendar-card {
  display: flex;
  align-items: center;
  background-color: #f7faf9;
  border-radius: 8px;
  padding: 16px;
}

.calendar-date {
  display: flex;
  margin-right: 16px;
}

.date-number {
  font-size: 32px;
  font-weight: bold;
  color: #10b981;
  margin-right: 8px;
}

.date-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.month, .year {
  font-size: 12px;
  color: #666;
}

.calendar-content {
  flex: 1;
}

.calendar-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.calendar-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

/* 新闻部分 */
.news-section {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.news-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.news-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.news-content {
  flex: 1;
  margin-right: 12px;
}

.news-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.news-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.news-source {
  margin-right: 8px;
}

.news-image {
  width: 80px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
}

.news-image :deep(.van-image) {
  width: 100%;
  height: 100%;
}
</style>