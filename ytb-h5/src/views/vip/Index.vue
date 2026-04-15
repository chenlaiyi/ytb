<template>
  <div class="vip-container">
    <!-- VIP页面导航栏 -->
    <van-nav-bar
      title="VIP会员中心"
      left-text="返回"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    />
    
    <div class="content">
      <!-- 用户信息卡片 -->
      <div class="vip-card">
        <div class="vip-header">
          <div class="avatar-wrapper">
            <VanImage
              round
              width="60"
              height="60"
              :src="vipTimeInfo.avatar || vipInfo.avatar || userStore.userAvatar || '/app/images/profile/default-avatar.png'"
              :error-content="'头像'"
            />
            <div class="vip-badge">VIP</div>
          </div>
          <div class="vip-info">
            <div class="vip-name">{{ vipTimeInfo.name || vipInfo.name || userStore.userName || '尊贵会员' }}</div>

            <div class="vip-date">我的推荐人: {{ vipTimeInfo.referrer_id ? `${vipTimeInfo.referrer_id} ${vipTimeInfo.referrer_name || ''}` : '点点够' }}</div>
            <div class="vip-date">有效期: 永久</div>
          </div>
          <div class="vip-actions">
            <VanButton 
              type="primary" 
              size="small" 
              round
              @click="goToRecruit"
              class="recruit-btn"
            >
              招募VIP
            </VanButton>
          </div>
        </div>
      </div>

      <!-- 平台分红卡片 -->
      <div class="dividend-overview-card">
        <div class="card-title">
          <span>平台分红</span>
          <div class="card-more" @click="$router.push('/vip/dividend')">
            <span>查看明细</span>
            <Icon name="arrow" />
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'current',
              loading: isMonthSwitching && selectedMonth === 'current'
            }"
            @click="switchMonth('current')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'current'" class="loading-icon">
              <Icon name="loading" />
            </span>
            本月
          </div>
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'last',
              loading: isMonthSwitching && selectedMonth === 'last'
            }"
            @click="switchMonth('last')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'last'" class="loading-icon">
              <Icon name="loading" />
            </span>
            上月
          </div>
        </div>

        <div class="dividend-amounts" :class="{ 'loading-state': loadingStates.pool || loadingStates.dividend }">
          <template v-if="!loadingStates.pool && !loadingStates.dividend">
            <div class="amount-section">
              <div class="amount-label">{{ selectedMonth === 'current' ? '本' : '上' }}月总奖励池</div>
              <div class="amount-value total-amount">
                {{ ((poolInfo.vipCount * 300 * 3) + (poolInfo.rechargeCount * 15 * 3)).toFixed(2) }}元
              </div>
              <div class="amount-detail">
                <div class="detail-item">
                  <span>VIP分红池</span>
                  <span class="highlight">{{ (poolInfo.vipCount * 300 * 3).toFixed(2) }}元</span>
                </div>
                <div class="detail-item">
                  <span>充值分红池</span>
                  <span class="highlight">{{ (poolInfo.rechargeCount * 15 * 3).toFixed(2) }}元</span>
                </div>
                <div class="detail-item">
                  <span>{{ selectedMonth === 'current' ? '本' : '上' }}月完款VIP</span>
                  <span>{{ poolInfo.vipCount || 0 }}人</span>
                </div>
                <div class="detail-item">
                  <span>{{ selectedMonth === 'current' ? '本' : '上' }}月充值设备</span>
                  <span>{{ poolInfo.rechargeCount || 0 }}台</span>
                </div>
              </div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="amount-section skeleton">
              <div class="skeleton-amount-label"></div>
              <div class="skeleton-amount-value"></div>
              <div class="amount-detail">
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
                <div class="detail-item skeleton">
                  <div class="skeleton-detail-label"></div>
                  <div class="skeleton-detail-value"></div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 团队信息卡片 -->
      <div class="team-card">
        <div class="card-title">
          <span>我的团队</span>
          <div class="card-actions">
            <div class="card-action" @click="$router.push('/vip/recruit-ranking')">
              <span>招募排行</span>
            </div>
            <div class="card-action" @click="$router.push('/vip/team-devices')">
              <span>销售设备</span>
            </div>
            <div class="card-more" @click="$router.push('/vip/team')">
              <span>查看详情</span>
              <Icon name="arrow" />
            </div>
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'current',
              loading: isMonthSwitching && selectedMonth === 'current'
            }"
            @click="switchMonth('current')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'current'" class="loading-icon">
              <Icon name="loading" />
            </span>
            本月
          </div>
          <div
            class="month-option"
            :class="{ 
              active: selectedMonth === 'last',
              loading: isMonthSwitching && selectedMonth === 'last'
            }"
            @click="switchMonth('last')"
            :disabled="isMonthSwitching"
          >
            <span v-if="isMonthSwitching && selectedMonth === 'last'" class="loading-icon">
              <Icon name="loading" />
            </span>
            上月
          </div>
        </div>

        <!-- 团队统计数据 -->
        <div class="team-stats" :class="{ 'loading-state': loadingStates.team }">
          <template v-if="!loadingStates.team">
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.totalVipCount || 0 }}</div>
              <div class="stats-label">团队总VIP</div>
              <div class="stats-tip">(含自己)</div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.monthDirectVipCount || 0 }}</div>
              <div class="stats-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推VIP</div>
              <div class="stats-tip">(一级)</div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item">
              <div class="stats-value">{{ teamInfo.monthVipCount || 0 }}</div>
              <div class="stats-label">{{ selectedMonth === 'current' ? '本' : '上' }}月新增</div>
              <div class="stats-tip">(团队)</div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
            <div class="stats-divider"></div>
            <div class="stats-item skeleton">
              <div class="skeleton-value"></div>
              <div class="skeleton-label"></div>
              <div class="skeleton-tip"></div>
            </div>
          </template>
        </div>

        <div class="team-detail" :class="{ 'loading-state': loadingStates.team }">
          <template v-if="!loadingStates.team">
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月团队充值台数</div>
              <div class="detail-value highlight">{{ teamInfo.monthRechargeCount || 0 }}台</div>
            </div>
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推充值台数</div>
              <div class="detail-value">{{ teamInfo.monthDirectRechargeCount || 0 }}台</div>
            </div>
            <div class="team-detail-row">
              <div class="detail-label">{{ selectedMonth === 'current' ? '本' : '上' }}月直推VIP</div>
              <div class="detail-value">{{ teamInfo.monthDirectVipCount || 0 }}人</div>
            </div>
          </template>
          
          <!-- 骨架屏 -->
          <template v-else>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
            <div class="team-detail-row skeleton">
              <div class="skeleton-label"></div>
              <div class="skeleton-value"></div>
            </div>
          </template>
        </div>
      </div>


      <!-- 统一的分红资格卡片 -->
      <div class="qualification-card">
        <div class="card-title">
          <span>达标与预估</span>
          <div class="status-badge" :class="{'qualified': hasAnyQualifications}">
            {{ hasAnyQualifications ? '已达标' : '未达标' }}
          </div>
        </div>

        <!-- 月份选择器 -->
        <div class="month-selector">
          <div
            class="month-option"
            :class="{ active: selectedMonth === 'current' }"
            @click="switchMonth('current')"
          >
            本月
          </div>
          <div
            class="month-option"
            :class="{ active: selectedMonth === 'last' }"
            @click="switchMonth('last')"
          >
            上月
          </div>
        </div>

        <div class="qualification-content">
          <!-- VIP招募分红资格 -->
        <div class="qualification-section">
          <div class="section-header">
              <div class="section-title">
                <div class="section-icon vip-icon"></div>
                <span>VIP招募分红</span>
            </div>
              <div class="expected-amount">
                预估: <span class="amount-text">{{ getVipTotalDividend() }}元</span>
              </div>
            </div>

            <div class="level-progress">
              <div class="level-row" :class="{'active': vipQualifications?.value?.junior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.junior}"></div>
                  <div class="level-name">初级分红</div>
              </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.junior}">
                    {{ vipQualifications?.value?.junior ? '已达标' : '未达标' }}
              </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.junior">
                    +{{ getVipExpectedAmount('junior') }}元
                  </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / 3 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/3人</span>
                    </div>
                  </div>
          </div>
        </div>

              <div class="level-row" :class="{'active': vipQualifications?.value?.middle}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.middle}"></div>
                  <div class="level-name">中级分红</div>
            </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.middle}">
                    {{ vipQualifications?.value?.middle ? '已达标' : '未达标' }}
          </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.middle">
                    +{{ getVipExpectedAmount('middle') }}元
              </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / 10 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/10人</span>
                    </div>
                  </div>
              </div>
            </div>

              <div class="level-row" :class="{'active': vipQualifications?.value?.senior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': vipQualifications?.value?.senior}"></div>
                  <div class="level-name">高级分红</div>
              </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': vipQualifications?.value?.senior}">
                    {{ vipQualifications?.value?.senior ? '已达标' : '未达标' }}
              </div>
                  <div class="level-amount" v-if="vipQualifications?.value?.senior">
                    +{{ getVipExpectedAmount('senior') }}元
              </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthVipCount || 0) / 30 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthVipCount || 0 }}/30人，直推{{ teamInfo.monthDirectVipCount || 0 }}人</span>
                    </div>
                  </div>
            </div>
          </div>
        </div>
      </div>

          <div class="qualification-divider"></div>

          <!-- 充值分红资格 -->
        <div class="qualification-section">
            <div class="section-header">
          <div class="section-title">
                <div class="section-icon recharge-icon"></div>
                <span>充值激励分红</span>
          </div>
              <div class="expected-amount">
                预估: <span class="amount-text">{{ getRechargeTotalDividend() }}元</span>
        </div>
      </div>

            <div class="level-progress">
              <div class="level-row" :class="{'active': rechargeQualifications?.value?.junior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.junior}"></div>
                  <div class="level-name">初级分红</div>
          </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.junior}">
                    {{ rechargeQualifications?.value?.junior ? '已达标' : '未达标' }}
        </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.junior">
                    +{{ getRechargeExpectedAmount('junior') }}元
          </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / 10 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/10台</span>
                    </div>
                  </div>
          </div>
        </div>

              <div class="level-row" :class="{'active': rechargeQualifications?.value?.middle}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.middle}"></div>
                  <div class="level-name">中级分红</div>
          </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.middle}">
              {{ rechargeQualifications?.value?.middle ? '已达标' : '未达标' }}
            </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.middle">
                    +{{ getRechargeExpectedAmount('middle') }}元
          </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / 30 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/30台</span>
                    </div>
                  </div>
        </div>
      </div>

              <div class="level-row" :class="{'active': rechargeQualifications?.value?.senior}">
                <div class="level-left">
                  <div class="level-dot" :class="{'active': rechargeQualifications?.value?.senior}"></div>
                  <div class="level-name">高级分红</div>
          </div>
                <div class="level-right">
                  <div class="level-status" :class="{'qualified': rechargeQualifications?.value?.senior}">
                    {{ rechargeQualifications?.value?.senior ? '已达标' : '未达标' }}
          </div>
                  <div class="level-amount" v-if="rechargeQualifications?.value?.senior">
                    +{{ getRechargeExpectedAmount('senior') }}元
        </div>
                  <div class="progress-info" v-else>
                    <div class="progress-bar-container">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: Math.min((teamInfo.monthRechargeCount || 0) / 80 * 100, 100) + '%' }"></div>
                      </div>
                      <span class="progress-text">{{ teamInfo.monthRechargeCount || 0 }}/80台，直推{{ teamInfo.monthDirectRechargeCount || 0 }}台</span>
                    </div>
                  </div>
            </div>
                </div>
                </div>
              </div>

          <div class="qualification-total">
          <div class="total-label">最高可叠加获得</div>
            <div class="total-value">{{ getTotalStackedDividend() }}元</div>
        </div>
      </div>
          </div>
    </div>
  </div>
</template>

<style scoped>
.vip-container {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
  padding-top: 20px; /* 添加顶部内边距替代导航条空间 */
}

.content {
  padding: 16px;
}

.refresh-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* VIP卡片样式 - 升级渐变与阴影效果 */
.vip-card {
  background: linear-gradient(135deg, #b89255 0%, #e6c070 100%);
  border-radius: 16px;
  padding: 22px;
  color: #fff;
  margin-bottom: 18px;
  box-shadow: 0 8px 24px rgba(184, 146, 85, 0.25);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.vip-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  opacity: 0.5;
  transform: rotate(30deg);
  z-index: 0;
}

.vip-card:active {
  transform: translateY(2px);
  box-shadow: 0 4px 12px rgba(184, 146, 85, 0.15);
}

.vip-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
  z-index: 1;
}

.avatar-wrapper {
  position: relative;
  margin-right: 15px;
}

.vip-badge {
  position: absolute;
  right: -5px;
  bottom: -2px;
  background: linear-gradient(135deg, #ff9500, #ff6200);
  color: #fff;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
  letter-spacing: 0.5px;
}

.vip-info {
  flex: 1;
}

.vip-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.vip-level {
  font-size: 14px;
  margin-bottom: 5px;
  opacity: 0.9;
  font-weight: 500;
}

.vip-date {
  font-size: 12px;
  opacity: 0.8;
}



/* 通用卡片样式升级 */
.team-card,
.dividend-overview-card,
.qualification-card {
  background: #ffffff;
  border-radius: 16px;
  margin-bottom: 18px;
  padding: 18px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: all 0.3s ease;
}

.team-card:active,
.dividend-overview-card:active,
.qualification-card:active {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
  position: relative;
}

.card-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 30px;
  height: 3px;
  background: linear-gradient(90deg, #ff9500, #ffb700);
  border-radius: 3px;
}

.card-actions {
  display: flex;
  align-items: center;
}

.card-action {
  font-size: 12px;
  font-weight: normal;
  color: #ff9500;
  margin-right: 12px;
  padding: 2px 8px;
  background-color: rgba(255, 149, 0, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.card-action:hover {
  background-color: rgba(255, 149, 0, 0.2);
}

.card-more {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: normal;
  color: #999;
  transition: color 0.3s ease;
}

.card-more:hover {
  color: #ff9500;
}

.card-more .van-icon {
  font-size: 12px;
  margin-left: 3px;
}

/* 团队卡片样式优化 */
.team-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
  border-radius: 12px;
  padding: 12px 8px;
}

.stats-item {
  flex: 1;
  text-align: center;
  transition: transform 0.2s ease;
}

.stats-item:hover {
  transform: translateY(-2px);
}

.stats-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #ff9500, #ff6200);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.stats-tip {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.stats-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.02), rgba(0,0,0,0.05));
  margin: 0 10px;
}

.team-detail {
  background: linear-gradient(to bottom, #f8f8f8, #f5f5f5);
  border-radius: 12px;
  padding: 14px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
}

.team-detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
}

.team-detail-row:last-child {
  margin-bottom: 0;
}

.detail-value.highlight {
  color: #ff6b5d;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6b5d, #ff4a47);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 分红收益卡片样式优化 */
.dividend-amounts {
  background: linear-gradient(to bottom, #f9f9f9, #f5f5f5);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
}

.amount-section {
  padding: 16px;
}

.amount-label {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-bottom: 6px;
  font-weight: 500;
}

.amount-value {
  font-size: 26px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 12px;
}

.total-amount {
  background: linear-gradient(135deg, #ff4a47, #ff6b5d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 1px 1px rgba(0,0,0,0.05);
}

.amount-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255,255,255,0.6);
  padding: 10px;
  border-radius: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.detail-item .highlight {
  background: linear-gradient(135deg, #ff6b5d, #ff4a47);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.amount-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.05), transparent);
}

.three-columns {
  display: flex;
  justify-content: space-between;
}

.column-item {
  flex: 1;
  text-align: center;
  transition: transform 0.2s ease;
}

.column-item:hover {
  transform: translateY(-2px);
}

.column-value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.column-label {
  font-size: 12px;
  color: #999;
}

/* 分红资格卡片样式优化 */
.qualification-card .card-title {
  margin-bottom: 18px;
}

.status-badge {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  background: #c0c0c0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.status-badge.qualified {
  background: linear-gradient(135deg, #3ad57a, #4cd964);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 217, 100, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(76, 217, 100, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 217, 100, 0);
  }
}

.qualification-content {
  background: linear-gradient(to bottom, #f9f9f9, #f6f6f6);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
}

.qualification-section {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
}

.section-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.section-icon::before {
  content: "V";
  font-weight: bold;
}

.vip-icon {
  background: linear-gradient(135deg, #ff9500, #ff8000);
}

.section-icon.recharge-icon::before {
  content: "R";
}

.recharge-icon {
  background: linear-gradient(135deg, #3f45ff, #2c31b4);
}

.expected-amount {
  font-size: 13px;
  color: #666;
  background: rgba(255,255,255,0.6);
  padding: 4px 8px;
  border-radius: 10px;
}

.amount-text {
  background: linear-gradient(135deg, #ff4a47, #ff6b5d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.level-progress {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.level-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.3s ease;
  background: rgba(255,255,255,0.6);
}

.level-row.active {
  background: rgba(255, 149, 0, 0.08);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

.qualification-section:last-child .level-row.active {
  background: rgba(63, 69, 255, 0.08);
}

.level-left {
  display: flex;
  align-items: center;
}

.level-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  margin-right: 10px;
  transition: all 0.3s ease;
  position: relative;
}

.level-dot.active {
  background: linear-gradient(135deg, #ff9500, #ff8000);
  box-shadow: 0 0 0 3px rgba(255, 149, 0, 0.1);
}

.qualification-section:last-child .level-dot.active {
  background: linear-gradient(135deg, #3f45ff, #2c31b4);
  box-shadow: 0 0 0 3px rgba(63, 69, 255, 0.1);
}

.level-dot.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: white;
}

.level-name {
  font-size: 14px;
  margin-right: 5px;
  font-weight: 500;
}

.level-requirement {
  font-size: 12px;
  color: #999;
}

.level-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.level-status {
  font-size: 12px;
  color: #999;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0,0,0,0.05);
}

.level-status.qualified {
  color: #fff;
  background: linear-gradient(135deg, #3ad57a, #4cd964);
}

.level-amount {
  font-size: 14px;
  color: #ff4a47;
  font-weight: bold;
  margin-top: 3px;
  background: linear-gradient(135deg, #ff4a47, #ff6b5d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.qualification-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(0,0,0,0.05), transparent);
}

.qualification-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255,255,255,0.8);
  border-top: 1px solid rgba(0,0,0,0.05);
}

.total-label {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.total-value {
  font-size: 20px;
  font-weight: bold;
  color: #ff4a47;
  background: linear-gradient(135deg, #ff4a47, #ff6b5d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

.total-value::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #ff4a47, #ff6b5d);
  border-radius: 2px;
}

/* 添加一些动画和细节优化 */
.vip-card,
.team-card,
.dividend-overview-card,
.qualification-card {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.vip-info {
  animation-delay: 0.1s;
}

.team-stats {
  animation-delay: 0.2s;
}

.dividend-amounts {
  animation-delay: 0.3s;
}

.qualification-content {
  animation-delay: 0.4s;
}

.loading-state {
  opacity: 0.5;
  pointer-events: none;
}

.loading-icon {
  margin-right: 5px;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s linear infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.skeleton-value,
.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-amount-value,
.skeleton-detail-label,
.skeleton-detail-value {
  height: 16px;
  border-radius: 4px;
}

.skeleton-value,
.skeleton-amount-value,
.skeleton-detail-value {
  width: 80%;
}

.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-detail-label {
  width: 60%;
}

.skeleton-tip {
  margin-top: 5px;
}

.skeleton-amount-label,
.skeleton-amount-value {
  margin-bottom: 10px;
}

.skeleton-detail-label,
.skeleton-detail-value {
  margin-top: 5px;
}

.month-selector {
  display: flex;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.month-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.month-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.month-option.loading {
  pointer-events: none;
}

.month-option.loading .loading-icon {
  margin-right: 5px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.month-option:not(.active):hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.loading-state {
  opacity: 0.5;
  pointer-events: none;
}

.loading-icon {
  margin-right: 5px;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s linear infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.skeleton-value,
.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-amount-value,
.skeleton-detail-label,
.skeleton-detail-value {
  height: 16px;
  border-radius: 4px;
}

.skeleton-value,
.skeleton-amount-value,
.skeleton-detail-value {
  width: 80%;
}

.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-detail-label {
  width: 60%;
}

.skeleton-tip {
  margin-top: 5px;
}

.skeleton-amount-label,
.skeleton-amount-value {
  margin-bottom: 10px;
}

.skeleton-detail-label,
.skeleton-detail-value {
  margin-top: 5px;
}

.month-selector {
  display: flex;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.month-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.month-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.month-option.loading {
  pointer-events: none;
}

.month-option.loading .loading-icon {
  margin-right: 5px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.month-option:not(.active):hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}
</style>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar as VanNavBar, Image as VanImage, Icon as VanIcon, Tag as VanTag, Loading as VanLoading, Dialog as VanDialog, Overlay as VanOverlay, Button as VanButton } from 'vant'
import { useUserStore } from '@/stores/user'
import Toast from '@/utils/toast-fix'
import { getVipWorkspace } from '@/api/vip'
import { getVipPoolInfo } from '@/api/vip'
import { getVipTimeInfo } from '@/api/vip'
import { getVipTeamInfo } from '@/api/vip'
import { getVipDividendInfo } from '@/api/vip'
// V1版本API
import { getVipTeamInfoV1, getVipPoolInfoV1, getVipDividendInfoV1 } from '@/api/v1/vip'
import { parseDate, formatDate as formatDateUtil } from '@/utils/date'
// 在script setup部分添加性能监控
import { perf } from '@/utils/performance'

// 获取router实例
const router = useRouter()

// 获取用户信息存储
const userStore = useUserStore()

// 刷新状态标记
const isRefreshing = ref(false)
const isTeamLoading = ref(false)

// 月份选择状态 - 'current'表示本月，'last'表示上月
const selectedMonth = ref('current')

// VIP会员信息
const vipInfo = ref({})

// VIP时间信息
const vipTimeInfo = ref({
  join_date: '',
  vip_join_date: '',
  vip_expire_date: null,
  vip_status: '有效',
  vip_payment_status: '已完款'
})

// 分红信息
const dividendInfo = ref({
  totalAmount: '0.00',
  monthAmount: '0.00',
  pendingAmount: '0.00'
})

// 奖金池信息
const poolInfo = ref({
  vipCount: 0,              // 月新增VIP人数
  rechargeCount: 0,         // 月新增充值台数
  juniorVipTeams: 0,        // 初级VIP分红达标团队数
  middleVipTeams: 0,        // 中级VIP分红达标团队数
  seniorVipTeams: 0,        // 高级VIP分红达标团队数
  juniorRechargeTeams: 0,   // 初级充值分红达标团队数
  middleRechargeTeams: 0,   // 中级充值分红达标团队数
  seniorRechargeTeams: 0    // 高级充值分红达标团队数
})

// 团队信息
const teamInfo = ref({
  totalVipCount: 0,          // 团队VIP总人数（包括自己）
  directVipCount: 0,         // 直推VIP人数
  monthDirectVipCount: 0,    // 本月新增VIP人数
  monthVipCount: 0,          // 本月新增VIP人数
  totalRechargeCount: 0,     // 团队充值总台数
  directRechargeCount: 0,    // 直推充值台数
  monthDirectRechargeCount: 0 // 本月直推充值台数
})

// 移除未使用的计算属性

// VIP招募达标状态计算
const vipQualifications = computed(() => {
  return getVipQualificationStatus()
})

// 充值达标状态计算
const rechargeQualifications = computed(() => {
  return getRechargeQualificationStatus()
})

// 当前选择的月份文本显示
const monthText = computed(() => {
  return selectedMonth.value === 'current' ? '本月' : '上月'
})

// 添加加载状态管理
const isMonthSwitching = ref(false)
const loadingStates = reactive({
  team: false,
  pool: false,
  dividend: false
})

// 数据缓存
const dataCache = reactive({
  current: {
    team: null,
    pool: null,
    dividend: null,
    timestamp: 0
  },
  last: {
    team: null,
    pool: null,
    dividend: null,
    timestamp: 0
  }
})

// 缓存有效期（5分钟）
const CACHE_DURATION = 5 * 60 * 1000

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 检查缓存是否有效
const isCacheValid = (month) => {
  const cache = dataCache[month]
  return cache.timestamp && (Date.now() - cache.timestamp < CACHE_DURATION)
}

// 从缓存获取数据
const getFromCache = (month) => {
  const cache = dataCache[month]
  if (isCacheValid(month)) {
    return {
      team: cache.team,
      pool: cache.pool,
      dividend: cache.dividend
    }
  }
  return null
}

// 保存到缓存
const saveToCache = (month, data) => {
  dataCache[month] = {
    ...data,
    timestamp: Date.now()
  }
}

// 优化后的数据获取函数
const fetchDataWithCache = async (month, forceRefresh = false) => {
  const timer = perf.start('fetchDataWithCache')
  
      // 检查缓存
    if (!forceRefresh) {
      const cachedData = getFromCache(month)
      if (cachedData) {
        console.log(`🔍 [缓存] 使用${month === 'current' ? '本月' : '上月'}缓存数据`)
        perf.cacheHit()
        
        // 立即更新UI
        if (cachedData.team) teamInfo.value = cachedData.team
        if (cachedData.pool) poolInfo.value = cachedData.pool
        if (cachedData.dividend) dividendInfo.value = cachedData.dividend
        
        perf.recordInteraction('cacheDataLoad', timer.end())
        return cachedData
      } else {
        perf.cacheMiss()
      }
    } else {
      perf.cacheMiss()
    }

  // 获取用户ID
  let userId = userStore.userId
  if (!userId) {
    await userStore.fetchUserInfo()
    userId = userStore.userId
  }

  if (!userId) {
    throw new Error('用户ID不能为空，请重新登录')
  }

  const params = {
    user_id: userId,
    month: month,
    _t: Date.now(),
    _r: Math.floor(Math.random() * 10000)
  }

  // 设置加载状态
  loadingStates.team = true
  loadingStates.pool = true
  loadingStates.dividend = true

      try {
      console.log(`🔍 [API] 获取${month === 'current' ? '本月' : '上月'}数据`)
      
      // 记录API调用性能
      const teamTimer = perf.start('teamAPI')
      const poolTimer = perf.start('poolAPI')
      const dividendTimer = perf.start('dividendAPI')
      
      // 并行请求所有API
      const [teamRes, poolRes, dividendRes] = await Promise.all([
        getVipTeamInfoV1(params).finally(() => { 
          loadingStates.team = false
          perf.recordApiCall('getVipTeamInfoV1', teamTimer.end(), true)
        }),
        getVipPoolInfoV1({ month: month }).finally(() => { 
          loadingStates.pool = false
          perf.recordApiCall('getVipPoolInfoV1', poolTimer.end(), true)
        }),
        getVipDividendInfoV1(params).finally(() => { 
          loadingStates.dividend = false
          perf.recordApiCall('getVipDividendInfoV1', dividendTimer.end(), true)
        })
      ])

    const result = {
      team: null,
      pool: null,
      dividend: null
    }

    // 处理团队信息
    if (teamRes.code === 0 && teamRes.data) {
      result.team = {
        ...teamRes.data,
        queryMonth: teamRes.data.queryMonth || (month === 'current' ? '本月' : '上月')
      }
      teamInfo.value = result.team
    }

    // 处理奖金池信息
    if (poolRes.code === 0 && poolRes.data) {
      result.pool = {
        ...poolRes.data,
        month: poolRes.data.month || (month === 'current' ? '本月' : '上月')
      }
      poolInfo.value = result.pool
    }

    // 处理分红信息
    if (dividendRes.code === 0 && dividendRes.data) {
      result.dividend = {
        totalAmount: dividendRes.data.totalAmount || '0.00',
        monthAmount: dividendRes.data.totalAmount || '0.00',
        pendingAmount: '0.00',
        dividendCount: dividendRes.data.dividendCount || 0,
        dividends: dividendRes.data.dividends || []
      }
      dividendInfo.value = result.dividend
    }

          // 保存到缓存
      saveToCache(month, result)
      
      perf.recordInteraction('apiDataLoad', timer.end())
      return result
    } catch (error) {
      // 重置加载状态
      loadingStates.team = false
      loadingStates.pool = false
      loadingStates.dividend = false
      
      // 记录API错误
      perf.recordApiCall('getVipTeamInfoV1', teamTimer?.end() || 0, false)
      perf.recordApiCall('getVipPoolInfoV1', poolTimer?.end() || 0, false)
      perf.recordApiCall('getVipDividendInfoV1', dividendTimer?.end() || 0, false)
      
      throw error
    }
}

  // 优化后的切换月份函数
  const switchMonth = debounce(async (month) => {
    if (selectedMonth.value === month || isMonthSwitching.value) return

    const timer = perf.start('monthSwitch')
    const prevMonth = selectedMonth.value
    selectedMonth.value = month
    isMonthSwitching.value = true

    console.log(`🔍 [切换] 从${prevMonth === 'current' ? '本月' : '上月'}切换到${month === 'current' ? '本月' : '上月'}`)

    try {
      // 显示切换动画
      Toast.loading({
        message: `切换到${month === 'current' ? '本月' : '上月'}数据...`,
        duration: 0,
        forbidClick: true
      })

      await fetchDataWithCache(month)
      
      Toast.clear()
      // 显示成功提示
      Toast.success({
        message: `已切换到${month === 'current' ? '本月' : '上月'}数据`,
        duration: 1000
      })
      
      perf.recordInteraction('monthSwitch', timer.end())
    } catch (error) {
      console.error('切换月份失败:', error)
      Toast.clear()
      Toast({ type: 'fail', message: '切换失败，请重试' })
      
      // 回滚到之前的月份
      selectedMonth.value = prevMonth
      
      perf.recordInteraction('monthSwitchError', timer.end())
    } finally {
      isMonthSwitching.value = false
    }
  }, 300) // 300ms防抖

// 优化后的刷新函数
const refreshData = async (showToast = true) => {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  
  if (showToast) {
    Toast.loading({
      message: '刷新数据中...',
      forbidClick: true,
    })
  }

  try {
    // 强制刷新当前月份数据（忽略缓存）
    await fetchDataWithCache(selectedMonth.value, true)
    
    if (showToast) {
      Toast.success('数据已更新')
    }
  } catch (error) {
    console.error('刷新数据失败:', error)
    if (showToast) {
      Toast({ type: 'fail', message: '数据更新失败' })
    }
  } finally {
    isRefreshing.value = false
    if (!showToast) {
      Toast.clear()
    }
  }
}

// 预加载另一个月份的数据
const preloadOtherMonth = async () => {
  const otherMonth = selectedMonth.value === 'current' ? 'last' : 'current'
  
  // 如果另一个月份没有缓存，则预加载
  if (!isCacheValid(otherMonth)) {
    try {
      console.log(`🔍 [预加载] 预加载${otherMonth === 'current' ? '本月' : '上月'}数据`)
      await fetchDataWithCache(otherMonth)
    } catch (error) {
      console.log('预加载失败，忽略错误:', error)
    }
  }
}

// 修改原有的fetchVipData函数
const fetchVipData = async (showFullLoading = true) => {
  if (isRefreshing.value) return

  isRefreshing.value = true
  
  try {
    if (showFullLoading) {
      Toast.loading({
        message: '加载中...',
        forbidClick: true,
      })
    }

    await fetchDataWithCache(selectedMonth.value)
    
    // 设置VIP基本信息
    vipInfo.value = {
      name: userStore.userName || '尊贵会员',
      avatar: userStore.userAvatar || '/app/images/profile/default-avatar.png',
      level: 'VIP会员',
      expireDate: '永久'
    }

    if (showFullLoading) {
      Toast.clear()
    }

    // 预加载另一个月份的数据
    setTimeout(() => {
      preloadOtherMonth()
    }, 1000)
    
  } catch (error) {
    console.error('获取VIP会员数据失败', error)
    if (showFullLoading) {
      Toast.clear()
    }
    
    // 错误处理逻辑保持不变...
    let errorMessage = '网络连接异常，无法获取最新数据'
    
    if (error.message && error.message.includes('用户ID不能为空')) {
      errorMessage = '用户信息异常，请重新登录'
      setTimeout(() => {
        userStore.clearUserInfo()
        router.push('/login')
      }, 1500)
    } else if (error.response) {
      const status = error.response.status
      if (status === 403) {
        errorMessage = '访问权限不足，请确认您的账号权限'
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (status === 401) {
        errorMessage = '登录状态已过期，请重新登录'
        setTimeout(() => {
          userStore.clearUserInfo()
          router.push('/login')
        }, 1500)
      } else if (status >= 500) {
        errorMessage = '服务器暂时不可用，请稍后再试'
      }
    } else if (error.request) {
      errorMessage = '服务器未响应，请检查网络连接'
    }

    Dialog.confirm({
      title: '数据加载失败',
      message: `${errorMessage}，是否重试？`,
      confirmButtonText: '重试',
      cancelButtonText: '确定'
    })
      .then(() => {
        fetchVipData()
      })
      .catch(() => {
        setDefaultData()
      })
  } finally {
    isRefreshing.value = false
  }
}

// 设置默认数据
const setDefaultData = () => {
        // 只有在完全无法获取数据时才使用这些保守的默认值
        if (!poolInfo.value?.vipCount && !poolInfo.value?.rechargeCount) {
          poolInfo.value = {
            vipCount: 0,
            rechargeCount: 0
          }
        }

        // 使用用户存储中的实际用户信息
        vipInfo.value = {
          name: userStore.userName || '尊贵会员',
          avatar: userStore.userAvatar || '/app/images/profile/default-avatar.png',
          level: 'VIP会员',
          expireDate: '永久'
        }

        // 设置默认分红数据为0.00
        dividendInfo.value = {
          totalAmount: '0.00',
    monthAmount: '0.00',
    pendingAmount: '0.00'
        }

        // 设置团队数据为0，等待API返回真实数据
        teamInfo.value = teamInfo.value || {};
        teamInfo.value.monthDirectVipCount = 0;
}

// 计算VIP达标状态函数 - 正确逻辑：基于本月团队新增VIP数量
const getVipQualificationStatus = () => {
  // 使用本月团队新增VIP人数进行达标判断（这是正确的分红达标条件）
  const monthVipCount = teamInfo.value.monthVipCount || 0;
  // 当前选择月份的直推VIP人数（高级分红需要本月有直推）
  const monthDirectVipCount = teamInfo.value.monthDirectVipCount || 0;

  // 计算结果对象 - 正确：使用本月团队新增数量
  const result = {
    junior: monthVipCount >= 3, // 初级: 本月团队新增VIP≥3人
    middle: monthVipCount >= 10 && monthDirectVipCount > 0, // 中级: 本月团队新增VIP≥10人且本月直推>0
    senior: monthVipCount >= 30 && monthDirectVipCount > 0, // 高级: 本月团队新增VIP≥30人且本月直推>0
    value: {
      junior: monthVipCount >= 3,
      middle: monthVipCount >= 10 && monthDirectVipCount > 0,
      senior: monthVipCount >= 30 && monthDirectVipCount > 0
    },
    // 添加月份信息
    monthText: selectedMonth.value === 'current' ? '本月' : '上月'
  }

  console.log('VIP达标状态计算（修复后）:', {
    monthVipCount,
    monthDirectVipCount,
    junior: result.junior,
    middle: result.middle,
    senior: result.senior
  });

  return result;
}

// 计算充值达标状态函数 - 正确逻辑：基于本月团队新增充值数量
const getRechargeQualificationStatus = () => {
  // 使用本月团队新增充值台数进行达标判断（这是正确的分红达标条件）
  const monthRechargeCount = teamInfo.value.monthTeamRechargeCount || 0;
  // 当前选择月份直推充值台数（高级分红需要本月有直推）
  const monthDirectRechargeCount = teamInfo.value.monthDirectRechargeCount || 0;

  // 判断是否达到各个等级的标准 - 正确：使用本月团队新增数量
  const result = {
    junior: monthRechargeCount >= 10, // 初级: 本月团队新增充值≥10台
    middle: monthRechargeCount >= 30 && monthDirectRechargeCount > 0, // 中级: 本月团队新增充值≥30台且本月直推>0
    senior: monthRechargeCount >= 80 && monthDirectRechargeCount > 0, // 高级: 本月团队新增充值≥80台且本月直推>0
    value: {
      junior: monthRechargeCount >= 10,
      middle: monthRechargeCount >= 30 && monthDirectRechargeCount > 0,
      senior: monthRechargeCount >= 80 && monthDirectRechargeCount > 0
    },
    // 添加月份信息
    monthText: selectedMonth.value === 'current' ? '本月' : '上月'
  }

  console.log('充值达标状态计算（修复后）:', {
    monthRechargeCount,
    monthDirectRechargeCount,
    junior: result.junior,
    middle: result.middle,
    senior: result.senior
  });

  return result;
}

// 计算VIP总分红
const getVipTotalDividend = () => {
  // 获取本月完款VIP总人数
  const vipCount = poolInfo.value.vipCount || 0
  // 计算总奖金池金额 - vipCount*300*3
  const totalPool = vipCount * 300 * 3
  // 计算单个等级的奖金池金额 - 每个等级独立拥有总奖金池的1/3
  const levelAmount = totalPool / 3

  // 获取各等级达标人数
  const juniorCount = poolInfo.value.juniorVipTeams || 0
  const middleCount = poolInfo.value.middleVipTeams || 0
  const seniorCount = poolInfo.value.seniorVipTeams || 0

  // 计算各等级分红金额
  const juniorAmount = juniorCount > 0 ? (levelAmount / juniorCount) : 0
  const middleAmount = middleCount > 0 ? (levelAmount / middleCount) : 0
  const seniorAmount = seniorCount > 0 ? levelAmount : 0 // 简化计算，实际应考虑直推占比

  // 根据用户达标情况计算总分红 - 直接使用各等级的预估金额
  let total = 0;
  if (vipQualifications.value.junior) {
    total += parseFloat(getVipExpectedAmount('junior'));
  }
  if (vipQualifications.value.middle) {
    total += parseFloat(getVipExpectedAmount('middle'));
  }
  if (vipQualifications.value.senior) {
    total += parseFloat(getVipExpectedAmount('senior'));
  }

  console.log('VIP总分红计算:', {
    vipCount,
    totalPool,
    levelAmount,
    juniorCount,
    middleCount,
    seniorCount,
    juniorAmount,
    middleAmount,
    seniorAmount,
    junior: vipQualifications.value.junior ? parseFloat(getVipExpectedAmount('junior')) : 0,
    middle: vipQualifications.value.middle ? parseFloat(getVipExpectedAmount('middle')) : 0,
    senior: vipQualifications.value.senior ? parseFloat(getVipExpectedAmount('senior')) : 0,
    total: total
  });

  return total.toFixed(2);
}

// 计算充值总分红
const getRechargeTotalDividend = () => {
  // 获取本月充值设备总数
  const rechargeCount = poolInfo.value.rechargeCount || 0
  // 计算总奖金池金额 - rechargeCount*15*3
  const totalPool = rechargeCount * 15 * 3
  // 计算单个等级的奖金池金额 - 每个等级独立拥有总奖金池的1/3
  const levelAmount = totalPool / 3

  // 获取各等级达标人数
  const juniorCount = poolInfo.value.juniorRechargeTeams || 0
  const middleCount = poolInfo.value.middleRechargeTeams || 0
  const seniorCount = poolInfo.value.seniorRechargeTeams || 0

  // 计算各等级分红金额
  const juniorAmount = juniorCount > 0 ? (levelAmount / juniorCount) : 0
  const middleAmount = middleCount > 0 ? (levelAmount / middleCount) : 0
  const seniorAmount = seniorCount > 0 ? levelAmount : 0 // 简化计算，实际应考虑直推占比

  // 根据用户达标情况计算总分红 - 直接使用各等级的预估金额
  let total = 0;
  if (rechargeQualifications.value.junior) {
    total += parseFloat(getRechargeExpectedAmount('junior'));
  }
  if (rechargeQualifications.value.middle) {
    total += parseFloat(getRechargeExpectedAmount('middle'));
  }
  if (rechargeQualifications.value.senior) {
    total += parseFloat(getRechargeExpectedAmount('senior'));
  }

  console.log('充值总分红计算:', {
    rechargeCount,
    totalPool,
    levelAmount,
    juniorCount,
    middleCount,
    seniorCount,
    juniorAmount,
    middleAmount,
    seniorAmount,
    junior: rechargeQualifications.value.junior ? parseFloat(getRechargeExpectedAmount('junior')) : 0,
    middle: rechargeQualifications.value.middle ? parseFloat(getRechargeExpectedAmount('middle')) : 0,
    senior: rechargeQualifications.value.senior ? parseFloat(getRechargeExpectedAmount('senior')) : 0,
    total: total
  });

  return total.toFixed(2);
}

// 计算叠加总分红
const getTotalStackedDividend = () => {
  // 获取各个分红金额
  const vipJuniorAmount = vipQualifications.value.junior ? parseFloat(getVipExpectedAmount('junior')) : 0;
  const vipMiddleAmount = vipQualifications.value.middle ? parseFloat(getVipExpectedAmount('middle')) : 0;
  const vipSeniorAmount = vipQualifications.value.senior ? parseFloat(getVipExpectedAmount('senior')) : 0;

  const rechargeJuniorAmount = rechargeQualifications.value.junior ? parseFloat(getRechargeExpectedAmount('junior')) : 0;
  const rechargeMiddleAmount = rechargeQualifications.value.middle ? parseFloat(getRechargeExpectedAmount('middle')) : 0;
  const rechargeSeniorAmount = rechargeQualifications.value.senior ? parseFloat(getRechargeExpectedAmount('senior')) : 0;

  // 计算总和
  const total = vipJuniorAmount + vipMiddleAmount + vipSeniorAmount +
                rechargeJuniorAmount + rechargeMiddleAmount + rechargeSeniorAmount;

  console.log('叠加总分红计算:', {
    vipJuniorAmount,
    vipMiddleAmount,
    vipSeniorAmount,
    rechargeJuniorAmount,
    rechargeMiddleAmount,
    rechargeSeniorAmount,
    total
  });

  return total.toFixed(2);
}

// 计算VIP招募奖励预估金额
const getVipExpectedAmount = (level) => {
  // 获取本月完款VIP总人数
  const vipCount = poolInfo.value.vipCount || 0
  // 计算单个等级的奖金池金额 - 每个等级独立拥有相同金额：vipCount*300
  const levelAmount = vipCount * 300

  // 重要说明：VIP分红不扣除任何税费，用户获得的是100%的分红金额
  // 根据等级和达标人数计算预期金额（无税费扣除）
  switch (level) {
    case 'junior':
      // 初级分红：按达标人数平均分配（无税费扣除）
      const juniorCount = poolInfo.value.juniorVipTeams || 0
      const juniorAmount = juniorCount > 0 ? (levelAmount / juniorCount) : 0
      // 确保返回完整金额，不扣除任何税费
      return juniorAmount.toFixed(2)

    case 'middle':
      // 中级分红：按达标人数平均分配（无税费扣除）
      const middleCount = poolInfo.value.middleVipTeams || 0
      const middleAmount = middleCount > 0 ? (levelAmount / middleCount) : 0
      // 确保返回完整金额，不扣除任何税费
      return middleAmount.toFixed(2)

    case 'senior':
      // 高级分红：按达标用户的直推占比分配（无税费扣除）
      if (vipQualifications?.value?.senior && teamInfo.value.directVipCount > 0) {
        const seniorCount = poolInfo.value.seniorVipTeams || 0
        const totalDirectCount = poolInfo.value.totalSeniorDirectVips || 1 // 防止除以0

        // 只有在达标且有直推的情况下才能获得高级分红
        if (seniorCount > 0 && totalDirectCount > 0) {
          // 使用直推人数计算占比
          const directRatio = teamInfo.value.directVipCount / totalDirectCount
          // 确保计算金额不超过奖金池总额，且不扣除任何税费
          const calculatedAmount = Math.min(levelAmount * directRatio, levelAmount);
          return calculatedAmount.toFixed(2);
        }
      }

      // 如果只有一个人达标高级分红，则获得全部高级分红池金额（无税费扣除）
      const seniorCount = poolInfo.value.seniorVipTeams || 0
      if (seniorCount === 1 && vipQualifications?.value?.senior) {
        return levelAmount.toFixed(2);
      }

      return '0.00'
    default:
      return '0.00'
  }
}

// 计算充值奖励预估金额
const getRechargeExpectedAmount = (level) => {
  // 获取本月充值设备总数
  const rechargeCount = poolInfo.value.rechargeCount || 0
  // 计算单个等级的奖金池金额 - 每个等级独立拥有相同金额：rechargeCount*15
  const levelAmount = rechargeCount * 15

  // 重要说明：充值分红不扣除任何税费，用户获得的是100%的分红金额
  // 根据等级和达标人数计算预期金额（无税费扣除）
  switch (level) {
    case 'junior':
      // 初级分红：按达标人数平均分配（无税费扣除）
      const juniorCount = poolInfo.value.juniorRechargeTeams || 0
      const juniorAmount = juniorCount > 0 ? (levelAmount / juniorCount) : 0
      // 确保返回完整金额，不扣除任何税费
      return juniorAmount.toFixed(2)

    case 'middle':
      // 中级分红：按达标人数平均分配（无税费扣除）
      const middleCount = poolInfo.value.middleRechargeTeams || 0
      const middleAmount = middleCount > 0 ? (levelAmount / middleCount) : 0
      // 确保返回完整金额，不扣除任何税费
      return middleAmount.toFixed(2)

    case 'senior':
      // 高级分红：按达标用户的直推占比分配（无税费扣除）
      if (rechargeQualifications?.value?.senior && teamInfo.value.directTeamRecharge > 0) {
        const seniorCount = poolInfo.value.seniorRechargeTeams || 0
        const totalDirectCount = poolInfo.value.totalSeniorDirectRecharges || 1 // 防止除以0

        // 只有在达标且有直推充值的情况下才能获得高级分红
        if (seniorCount > 0 && totalDirectCount > 0) {
          // 计算直推占比
          const directRatio = teamInfo.value.directTeamRecharge / totalDirectCount
          // 确保计算金额不超过奖金池总额，且不扣除任何税费
          const calculatedAmount = Math.min(levelAmount * directRatio, levelAmount);
          return calculatedAmount.toFixed(2);
        }
      }

      // 如果只有一个人达标高级分红，则获得全部高级分红池金额（无税费扣除）
      const seniorCount = poolInfo.value.seniorRechargeTeams || 0
      if (seniorCount === 1 && rechargeQualifications?.value?.senior) {
        return levelAmount.toFixed(2);
      }

      return '0.00'
    default:
      return '0.00'
  }
}

// 检查是否有任何资格
const hasAnyQualifications = computed(() => {
  return vipQualifications.value.junior ||
         vipQualifications.value.middle ||
         vipQualifications.value.senior ||
         rechargeQualifications.value.junior ||
         rechargeQualifications.value.middle ||
         rechargeQualifications.value.senior;
});

// 获取奖金池信息
const fetchPoolInfo = async () => {
  try {
    // 添加月份参数和时间戳，确保不使用缓存
    const params = {
      month: selectedMonth.value,
      _t: Date.now(),
      _r: Math.floor(Math.random() * 10000)
    };
    console.log(`🔍 [奖金池] 获取${selectedMonth.value === 'current' ? '本月' : '上月'}奖金池信息，参数:`, params);

    // 使用V1版本API获取奖金池数据
    const params_v1 = {
      month: selectedMonth.value,
      silentError: true // 静默处理初始化错误
    };
    console.log(`🔍 [V1 API] 调用奖金池信息V1接口，参数:`, params_v1);
    const res = await getVipPoolInfoV1(params_v1);
    console.log(`🔍 [奖金池] API响应:`, res);
    
    if (res.code === 0 && res.data) {
      // 记录API返回的原始数据，便于调试
      console.log(`🔍 [奖金池] API返回的原始数据:`, res.data);

      // 直接使用API返回的数据，不做任何过滤或保护
      poolInfo.value = {
        ...res.data,
        // 确保数字类型正确
        vipCount: parseInt(res.data.vipCount) || 0,
        rechargeCount: parseInt(res.data.rechargeCount) || 0,
        juniorVipTeams: parseInt(res.data.juniorVipTeams) || 0,
        middleVipTeams: parseInt(res.data.middleVipTeams) || 0,
        seniorVipTeams: parseInt(res.data.seniorVipTeams) || 0,
        totalSeniorDirectVips: parseInt(res.data.totalSeniorDirectVips) || 0,
        juniorRechargeTeams: parseInt(res.data.juniorRechargeTeams) || 0,
        middleRechargeTeams: parseInt(res.data.middleRechargeTeams) || 0,
        seniorRechargeTeams: parseInt(res.data.seniorRechargeTeams) || 0,
        totalSeniorDirectRecharges: parseInt(res.data.totalSeniorDirectRecharges) || 0,
        // 记录当前月份
        currentMonth: res.data.month || (selectedMonth.value === 'current' ? '本月' : '上月'),
        // 记录查询的月份值
        monthValue: res.data.monthValue || ''
      };

      console.log(`🔍 [奖金池] 更新后的奖金池数据:`, poolInfo.value);
      console.log(`🔍 [奖金池] 总奖励池计算: VIP=${poolInfo.value.vipCount}*300*3 + 充值=${poolInfo.value.rechargeCount}*15*3 = ${(poolInfo.value.vipCount * 300 * 3) + (poolInfo.value.rechargeCount * 15 * 3)}元`);
    } else {
      console.error(`🔍 [奖金池] 获取${selectedMonth.value === 'current' ? '本月' : '上月'}奖金池信息失败:`, res);
      // API失败时设置默认值
      poolInfo.value = {
        vipCount: 0,
        rechargeCount: 0,
        juniorVipTeams: 0,
        middleVipTeams: 0,
        seniorVipTeams: 0,
        totalSeniorDirectVips: 0,
        juniorRechargeTeams: 0,
        middleRechargeTeams: 0,
        seniorRechargeTeams: 0,
        totalSeniorDirectRecharges: 0,
        currentMonth: selectedMonth.value === 'current' ? '本月' : '上月',
        monthValue: ''
      };
    }
  } catch (error) {
    console.error(`🔍 [奖金池] 获取${selectedMonth.value === 'current' ? '本月' : '上月'}奖金池信息错误:`, error);
    // 网络错误时设置默认值
    poolInfo.value = {
      vipCount: 0,
      rechargeCount: 0,
      juniorVipTeams: 0,
      middleVipTeams: 0,
      seniorVipTeams: 0,
      totalSeniorDirectVips: 0,
      juniorRechargeTeams: 0,
      middleRechargeTeams: 0,
      seniorRechargeTeams: 0,
      totalSeniorDirectRecharges: 0,
      currentMonth: selectedMonth.value === 'current' ? '本月' : '上月',
      monthValue: ''
    };
  }
};

// 获取团队信息
const fetchTeamInfo = async () => {
  try {
    // 检查用户登录状态和token
    if (!userStore.isLoggedIn || !userStore.token) {
      console.warn('用户未登录或token无效，无法获取团队信息');
      teamInfo.value = {
        totalVipCount: 0,
        directVipCount: 0,
        monthVipCount: 0,
        monthDirectVipCount: 0,
        totalRechargeCount: 0,
        directRechargeCount: 0,
        monthRechargeCount: 0,
        monthDirectRechargeCount: 0,
        currentMonthTeamRecharge: 0,
        currentMonthDirectRecharge: 0,
        allTimeTeamRecharge: 0,
        directTeamRecharge: 0,
        queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
        queryMonthValue: ''
      };
      return;
    }

    // 添加月份参数和时间戳，确保不使用缓存
    const params = {
      month: selectedMonth.value,
      _t: Date.now(),
      _r: Math.floor(Math.random() * 10000)
    };
    console.log(`获取${selectedMonth.value === 'current' ? '本月' : '上月'}团队信息，参数:`, params);
    console.log('当前用户token:', userStore.token ? userStore.token.substring(0, 20) + '...' : '无token');
    
    // 设置加载中状态
    isTeamLoading.value = true;
    
    // 使用V1版本API获取团队数据
    const params_v1 = {
      user_id: userStore.userId,
      month: selectedMonth.value,
      silentError: true // 静默处理初始化错误
    };
    console.log(`🔍 [V1 API] 调用团队信息V1接口，参数:`, params_v1);
    const res = await getVipTeamInfoV1(params_v1);
    
    console.log(`API返回的团队数据响应:`, res);
    
    if (res && res.code === 0 && res.data) {
      // 记录API返回的原始数据，便于调试
      console.log(`API返回的原始团队数据:`, res.data);

      // 直接使用API返回的数据，不添加任何默认值
      const rawData = res.data;

      // 更新团队信息状态 - 完全依赖API返回的真实数据
      teamInfo.value = {
        // 使用API返回的原始数据
        ...rawData,
        // 记录当前查询的月份
        queryMonth: rawData.queryMonth || (selectedMonth.value === 'current' ? '本月' : '上月'),
        // 记录查询的月份值
        queryMonthValue: rawData.queryMonthValue || ''
      };

      console.log(`处理后的${selectedMonth.value === 'current' ? '本' : '上'}月团队信息:`, teamInfo.value);
    } else {
      console.error(`获取${selectedMonth.value === 'current' ? '本' : '上'}月团队信息失败:`, res);
      
      // 检查是否是认证错误
      if (res && (res.code === 401 || res.code === 1)) {
        console.warn('团队信息API认证失败，可能需要重新登录');
        // 不显示错误提示，静默处理认证失败
      } else {
        // 只在非初始化时显示错误提示
        // Toast({ type: 'fail', message: `获取${selectedMonth.value === 'current' ? '本月' : '上月'}团队数据失败` });
      }
      
      // API调用失败时，清空数据而不是使用默认值
      teamInfo.value = {
        totalVipCount: 0,
        directVipCount: 0,
        monthVipCount: 0,
        monthDirectVipCount: 0,
        totalRechargeCount: 0,
        directRechargeCount: 0,
        monthRechargeCount: 0,
        monthDirectRechargeCount: 0,
        currentMonthTeamRecharge: 0,
        currentMonthDirectRecharge: 0,
        allTimeTeamRecharge: 0,
        directTeamRecharge: 0,
        queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
        queryMonthValue: ''
      };
    }
  } catch (error) {
    console.error(`获取${selectedMonth.value === 'current' ? '本' : '上'}月团队信息错误:`, error);
    
    // 检查是否是认证相关错误
    if (error.message && (error.message.includes('401') || error.message.includes('无效的访问令牌'))) {
      console.warn('团队信息API认证错误，可能需要重新登录');
      // 不显示错误提示，静默处理认证失败
    } else {
      // 只在非初始化时显示错误提示
      // Toast({ type: 'fail', message: `网络错误，无法获取${selectedMonth.value === 'current' ? '本月' : '上月'}团队数据` });
    }
    
    // API调用失败时，清空数据而不是使用默认值
    teamInfo.value = {
      totalVipCount: 0,
      directVipCount: 0,
      monthVipCount: 0,
      monthDirectVipCount: 0,
      totalRechargeCount: 0,
      directRechargeCount: 0,
      monthRechargeCount: 0,
      monthDirectRechargeCount: 0,
      currentMonthTeamRecharge: 0,
      currentMonthDirectRecharge: 0,
      allTimeTeamRecharge: 0,
      directTeamRecharge: 0,
      queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
      queryMonthValue: ''
    };
  } finally {
    // 关闭加载状态
    isTeamLoading.value = false;
  }
};



// 获取分红信息
const fetchDividendInfo = async () => {
  try {
    // 添加月份参数和时间戳，确保不使用缓存
    const params = {
      month: selectedMonth.value,
      _t: Date.now(),
      _r: Math.floor(Math.random() * 10000)
    };
    console.log(`获取${selectedMonth.value === 'current' ? '本月' : '上月'}分红信息，参数:`, params);

    // 使用V1版本API获取分红数据
    const params_v1 = {
      user_id: userStore.userId,
      month: selectedMonth.value,
      silentError: true // 静默处理初始化错误
    };
    console.log(`🔍 [V1 API] 调用分红信息V1接口，参数:`, params_v1);
    const res = await getVipDividendInfoV1(params_v1);
    if (res.code === 0 && res.data) {
      // 记录API返回的原始数据，便于调试
      console.log(`API返回的原始分红数据:`, res.data);

      dividendInfo.value = {
        ...dividendInfo.value,
        ...res.data,
        // 确保关键字段有值，但优先使用API返回的真实数据
        totalAmount: res.data.totalAmount || '0.00',
        monthAmount: res.data.monthAmount || '0.00',
        pendingAmount: res.data.pendingAmount || '0.00',
        // 记录当前查询的月份
        queryMonth: res.data.month || (selectedMonth.value === 'current' ? '本月' : '上月'),
        // 记录查询的月份值
        monthValue: res.data.monthValue || ''
      };

      console.log(`处理后的${selectedMonth.value === 'current' ? '本' : '上'}月分红信息:`, dividendInfo.value);
    } else {
      console.error(`获取${selectedMonth.value === 'current' ? '本月' : '上月'}分红信息失败:`, res);
      // API失败时设置默认值
      dividendInfo.value = {
        totalAmount: '0.00',
        monthAmount: '0.00',
        pendingAmount: '0.00',
        queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
        monthValue: ''
      };
    }
  } catch (error) {
    console.error(`获取${selectedMonth.value === 'current' ? '本月' : '上月'}分红信息错误:`, error);
    // 网络错误时设置默认值
    dividendInfo.value = {
      totalAmount: '0.00',
      monthAmount: '0.00',
      pendingAmount: '0.00',
      queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
      monthValue: ''
    };
  }
};

// 获取VIP时间信息
const fetchVipTimeInfo = async () => {
  try {
    console.log('开始获取VIP时间信息');
    const res = await getVipTimeInfo();
    console.log('VIP时间信息API响应结果:', res);

    if (res.code === 0 && res.data) {
      console.log('成功获取VIP时间信息:', res.data);
      
      // 确保加入时间字段存在
      const joinDate = res.data.join_date || res.data.vip_join_date || userStore.userJoinDate || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
      
      vipTimeInfo.value = {
        ...vipTimeInfo.value,
        ...res.data,
        join_date: joinDate,
        vip_join_date: res.data.vip_join_date || joinDate
      };

      // 更新VIP信息中的到期时间和用户信息
      vipInfo.value = {
        ...vipInfo.value,
        name: res.data.name || vipInfo.value.name || userStore.userName || '尊贵会员',
        avatar: res.data.avatar || vipInfo.value.avatar || userStore.userAvatar || '/app/images/profile/default-avatar.png',
        expireDate: res.data.vip_expire_date || '永久'
      };

      console.log('获取VIP时间信息成功:', vipTimeInfo.value);
    } else {
      console.error('获取VIP时间信息失败:', res);
      // 设置默认时间，避免显示"未知"
      vipTimeInfo.value.join_date = vipTimeInfo.value.join_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
      vipTimeInfo.value.vip_join_date = vipTimeInfo.value.vip_join_date || vipTimeInfo.value.join_date;
    }
  } catch (error) {
    console.error('获取VIP时间信息错误:', error);
    // 设置默认时间，避免显示"未知"
    vipTimeInfo.value.join_date = vipTimeInfo.value.join_date || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0];
    vipTimeInfo.value.vip_join_date = vipTimeInfo.value.vip_join_date || vipTimeInfo.value.join_date;
  }
};

// 格式化日期函数
const formatDate = (dateString) => {
  if (!dateString) return '';

  try {
    // 使用安全的日期解析和格式化函数
    return formatDateUtil(dateString);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString; // 出错时返回原始字符串
  }
};

  // 在页面卸载时打印性能报告
  onBeforeUnmount(() => {
    // 打印性能报告
    perf.printReport()
    
    // 如果是开发环境，可以将性能数据发送到服务器
    if (import.meta.env.DEV) {
      const performanceData = perf.export()
      console.log('📊 导出性能数据:', performanceData)
    }
  })

  // 初始化页面数据
  onMounted(async () => {
    const pageLoadTimer = perf.start('pageLoad')
    console.log('🔍 [初始化] 开始初始化VIP页面数据');
    
    // 初始化为空数据，等待API返回真实数据
    poolInfo.value = {
      vipCount: 0,
      rechargeCount: 0,
      juniorVipTeams: 0,
      middleVipTeams: 0,
      seniorVipTeams: 0,
      totalSeniorDirectVips: 0,
      juniorRechargeTeams: 0,
      middleRechargeTeams: 0,
      seniorRechargeTeams: 0,
      totalSeniorDirectRecharges: 0
    };

    teamInfo.value = {
      totalVipCount: 0,
      directVipCount: 0,
      monthVipCount: 0,
      monthDirectVipCount: 0,
      totalRechargeCount: 0,
      directRechargeCount: 0,
      monthRechargeCount: 0,
    monthDirectRechargeCount: 0,
    currentMonthTeamRecharge: 0,
    currentMonthDirectRecharge: 0,
    allTimeTeamRecharge: 0,
    directTeamRecharge: 0,
    queryMonth: selectedMonth.value === 'current' ? '本月' : '上月',
    queryMonthValue: ''
  };

  dividendInfo.value = {
    totalAmount: '0.00',
    monthAmount: '0.00',
    pendingAmount: '0.00'
  };

  // 加载数据
  Toast.loading({
    message: '加载中...',
    forbidClick: true,
  });

  try {
    // 并行获取所有数据
    await Promise.all([
      fetchPoolInfo(),
      fetchTeamInfo(),
      fetchDividendInfo(),
      fetchVipTimeInfo()
    ]);

    console.log('🔍 [初始化] 所有数据加载完毕');
    Toast.clear();
    
    // 记录页面加载性能
    perf.recordPageLoad('VIP页面', pageLoadTimer.end())
  } catch (error) {
    console.error('🔍 [初始化] 初始化数据失败:', error);
    Toast({ type: 'fail', message: '数据加载失败，请下拉刷新重试' });
    
    // 记录页面加载失败
    perf.recordPageLoad('VIP页面(失败)', pageLoadTimer.end())
  }
});

// 跳转到招募VIP页面
const goToRecruit = () => {
  router.push('/vip/recruit')
}

// 返回按钮处理
const goBack = () => {
  router.back()
}
</script>

<style scoped>
.progress-info {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  font-weight: 500;
}

/* 进度条样式 */
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9500, #ffb700);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  min-width: fit-content;
}

/* 月份选择器样式 */
.month-selector {
  display: flex;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.month-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.month-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.month-option.loading {
  pointer-events: none;
}

.month-option.loading .loading-icon {
  margin-right: 5px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.month-option:not(.active):hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.loading-state {
  opacity: 0.5;
  pointer-events: none;
}

.loading-icon {
  margin-right: 5px;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s linear infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.skeleton-value,
.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-amount-value,
.skeleton-detail-label,
.skeleton-detail-value {
  height: 16px;
  border-radius: 4px;
}

.skeleton-value,
.skeleton-amount-value,
.skeleton-detail-value {
  width: 80%;
}

.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-detail-label {
  width: 60%;
}

.skeleton-tip {
  margin-top: 5px;
}

.skeleton-amount-label,
.skeleton-amount-value {
  margin-bottom: 10px;
}

.skeleton-detail-label,
.skeleton-detail-value {
  margin-top: 5px;
}

.month-selector {
  display: flex;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.month-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.month-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.month-option.loading {
  pointer-events: none;
}

.month-option.loading .loading-icon {
  margin-right: 5px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.month-option:not(.active):hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.loading-state {
  opacity: 0.5;
  pointer-events: none;
}

.loading-icon {
  margin-right: 5px;
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s linear infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

.skeleton-value,
.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-amount-value,
.skeleton-detail-label,
.skeleton-detail-value {
  height: 16px;
  border-radius: 4px;
}

.skeleton-value,
.skeleton-amount-value,
.skeleton-detail-value {
  width: 80%;
}

.skeleton-label,
.skeleton-tip,
.skeleton-amount-label,
.skeleton-detail-label {
  width: 60%;
}

.skeleton-tip {
  margin-top: 5px;
}

.skeleton-amount-label,
.skeleton-amount-value {
  margin-bottom: 10px;
}

.skeleton-detail-label,
.skeleton-detail-value {
  margin-top: 5px;
}

.month-selector {
  display: flex;
  background: #f8f9fa;
  border-radius: 20px;
  padding: 4px;
  margin-bottom: 20px;
  position: relative;
}

.month-option {
  flex: 1;
  text-align: center;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
}

.month-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.month-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.month-option.loading {
  pointer-events: none;
}

.month-option.loading .loading-icon {
  margin-right: 5px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.month-option:not(.active):hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}
</style>