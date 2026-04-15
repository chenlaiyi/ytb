<template>
  <div class="admin-merchant-detail">
    <div v-show="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>正在加载详情，请稍候...</p>
    </div>
    <div v-show="error" class="status status-error">{{ error }}</div>
    <div v-show="!loading && !error && !detail" class="status status-empty">未找到商户信息</div>
    
    <div v-show="!loading && !error && detail" class="content">
      <!-- 商户基本信息卡片 -->
      <section class="info-card merchant-basic">
        <div class="card-header">
          <div class="merchant-compact-info">
            <h3 class="merchant-name">{{ summary.name }}</h3>
            <div class="merchant-meta">
              <div class="merchant-id">
                <svg class="id-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 11H3v10h6V11z"/>
                  <path d="M21 11h-6v10h6V11z"/>
                  <path d="M15 3H9v6h6V3z"/>
                </svg>
                <span>ID: {{ summary.merchantId }}</span>
              </div>
              <div class="status-badge" :class="getStatusClass()">
                {{ summary.statusText }}
              </div>
              <div class="source-tag" :class="getSourceClass()">{{ summary.source }}</div>
            </div>
          </div>
          <div class="card-actions">
            <button class="action-btn" @click="refreshData">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>
        </div>
        
        <!-- 商户基本信息区域 -->
        <div class="merchant-info-section">
          
          <!-- 信息分组区域 -->
          <div class="info-groups-container">
            <!-- 联系信息卡片 -->
            <div class="info-group-card">
              <div class="info-group-header">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                </svg>
                <h4 class="info-group-title">联系信息</h4>
              </div>
              <div class="info-group-content">
                <div class="info-item">
                  <div class="info-label">负责人</div>
                  <div class="info-value">{{ summary.contact || '—' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">联系电话</div>
                  <div class="info-value phone">{{ summary.phone || '—' }}</div>
                </div>
                <div class="info-item full-width address-item">
                  <div class="info-label">联系地址</div>
                  <div class="info-value address">{{ summary.address || '—' }}</div>
                </div>
              </div>
            </div>
            
            <!-- 进件信息卡片 -->
            <div class="info-group-card">
              <div class="info-group-header">
                <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                <h4 class="info-group-title">进件信息</h4>
              </div>
              <div class="info-group-content">
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">{{ summary.submittedAt || '—' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">渠道信息</div>
                  <div class="info-value">{{ summary.channel || '—' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 资质信息卡片 -->
      <section v-if="hasQualificationInfo" class="info-card qualification-info">
        <div class="card-header">
          <h2 class="card-title">资质信息</h2>
        </div>
        <div class="qualification-grid">
          <div v-if="detail.license_no" class="qual-item">
            <label>营业执照号</label>
            <div class="value">{{ detail.license_no }}</div>
          </div>
          <div v-if="detail.legal_name" class="qual-item">
            <label>法人姓名</label>
            <div class="value">{{ detail.legal_name }}</div>
          </div>
          <div v-if="detail.legal_id_card" class="qual-item">
            <label>法人身份证</label>
            <div class="value">{{ detail.legal_id_card }}</div>
          </div>
          <div v-if="detail.business_scope" class="qual-item full-width">
            <label>经营范围</label>
            <div class="value">{{ detail.business_scope }}</div>
          </div>
        </div>
      </section>

      <!-- 资料图片卡片 -->
      <section v-if="hasMediaAssets" class="info-card media-assets">
        <div class="card-header">
          <h2 class="card-title">资料图片</h2>
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'grid' }" 
              @click="viewMode = 'grid'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button 
              class="toggle-btn" 
              :class="{ active: viewMode === 'list' }" 
              @click="viewMode = 'list'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 身份证照片 -->
        <div v-if="mediaAssets.identity && mediaAssets.identity.length > 0" class="media-section">
          <h3 class="media-section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            身份证件
          </h3>
          <div class="media-grid" :class="viewMode">
            <div 
              v-for="(image, index) in mediaAssets.identity" 
              :key="`identity-${index}`"
              class="media-item"
              @click="openImagePreview(image, '身份证件')"
            >
              <div class="media-thumbnail">
                <img :src="getImageUrl(image)" :alt="`身份证件${index + 1}`" @error="handleImageError">
                <div class="media-overlay">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <div class="media-info">
                <div class="media-title">身份证件{{ index === 0 ? '(正面)' : '(反面)' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 营业执照照片 -->
        <div v-if="mediaAssets.license && mediaAssets.license.length > 0" class="media-section">
          <h3 class="media-section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            营业执照
          </h3>
          <div class="media-grid" :class="viewMode">
            <div 
              v-for="(image, index) in mediaAssets.license" 
              :key="`license-${index}`"
              class="media-item"
              @click="openImagePreview(image, '营业执照')"
            >
              <div class="media-thumbnail">
                <img :src="getImageUrl(image)" :alt="`营业执照${index + 1}`" @error="handleImageError">
                <div class="media-overlay">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <div class="media-info">
                <div class="media-title">营业执照{{ index > 0 ? ` (${index + 1})` : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 门头照片 -->
        <div v-if="mediaAssets.storefront && mediaAssets.storefront.length > 0" class="media-section">
          <h3 class="media-section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            门头照片
          </h3>
          <div class="media-grid" :class="viewMode">
            <div 
              v-for="(image, index) in mediaAssets.storefront" 
              :key="`storefront-${index}`"
              class="media-item"
              @click="openImagePreview(image, '门头照片')"
            >
              <div class="media-thumbnail">
                <img :src="getImageUrl(image)" :alt="`门头照片${index + 1}`" @error="handleImageError">
                <div class="media-overlay">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <div class="media-info">
                <div class="media-title">门头照片{{ index > 0 ? ` (${index + 1})` : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 协议照片 -->
        <div v-if="mediaAssets.protocol && mediaAssets.protocol.length > 0" class="media-section">
          <h3 class="media-section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>
            协议照片
          </h3>
          <div class="media-grid" :class="viewMode">
            <div 
              v-for="(image, index) in mediaAssets.protocol" 
              :key="`protocol-${index}`"
              class="media-item"
              @click="openImagePreview(image, '协议照片')"
            >
              <div class="media-thumbnail">
                <img :src="getImageUrl(image)" :alt="`协议照片${index + 1}`" @error="handleImageError">
                <div class="media-overlay">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <div class="media-info">
                <div class="media-title">协议照片{{ index > 0 ? ` (${index + 1})` : '' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 其他资料照片 -->
        <div v-if="mediaAssets.other && mediaAssets.other.length > 0" class="media-section">
          <h3 class="media-section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13,2 13,9 20,9"/>
            </svg>
            其他资料
          </h3>
          <div class="media-grid" :class="viewMode">
            <div 
              v-for="(image, index) in mediaAssets.other" 
              :key="`other-${index}`"
              class="media-item"
              @click="openImagePreview(image, '其他资料')"
            >
              <div class="media-thumbnail">
                <img :src="getImageUrl(image)" :alt="`其他资料${index + 1}`" @error="handleImageError">
                <div class="media-overlay">
                  <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
              </div>
              <div class="media-info">
                <div class="media-title">其他资料{{ index > 0 ? ` (${index + 1})` : '' }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 图片预览弹窗 -->
      <div v-if="showImagePreview" class="image-preview-modal" @click.self="closeImagePreview">
        <div class="preview-container">
          <div class="preview-header">
            <h3 class="preview-title">{{ currentPreviewTitle }}</h3>
            <button class="close-btn" @click="closeImagePreview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="preview-content">
            <img :src="getImageUrl(currentPreviewImage)" :alt="currentPreviewTitle" @error="handleImageError" :style="{ transform: `rotate(${imageRotation}deg)` }">
          </div>
          <div class="preview-actions">
            <button class="action-btn" @click="downloadImage(currentPreviewImage)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              下载
            </button>
            <button class="action-btn" @click="rotateImage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23,4 23,10 17,10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              旋转
            </button>
          </div>
        </div>
      </div>

      <!-- 银行信息卡片 -->
      <section v-if="hasBankInfo" class="info-card bank-info">
        <div class="card-header">
          <h2 class="card-title">银行信息</h2>
        </div>
        <div class="bank-grid">
          <div v-if="detail.bank_name" class="bank-item">
            <label>开户银行</label>
            <div class="value">{{ detail.bank_name }}</div>
          </div>
          <div v-if="detail.bank_account_name" class="bank-item">
            <label>账户名称</label>
            <div class="value">{{ detail.bank_account_name }}</div>
          </div>
          <div v-if="detail.bank_account_no" class="bank-item">
            <label>银行账号</label>
            <div class="value bank-account">{{ detail.bank_account_no }}</div>
          </div>
        </div>
      </section>

      <!-- 费率信息卡片 -->
      <section v-if="hasRateInfo" class="info-card rate-info">
        <div class="card-header">
          <h2 class="card-title">费率信息</h2>
        </div>
        <div class="rate-grid">
          <div v-if="detail.credit_rate" class="rate-item">
            <label>信用卡费率</label>
            <div class="value rate">{{ detail.credit_rate }}%</div>
          </div>
          <div v-if="detail.debit_rate" class="rate-item">
            <label>借记卡费率</label>
            <div class="value rate">{{ detail.debit_rate }}%</div>
          </div>
          <div v-if="detail.scan_rate" class="rate-item">
            <label>扫码费率</label>
            <div class="value rate">{{ detail.scan_rate }}%</div>
          </div>
          <div v-if="detail.single_limit" class="rate-item">
            <label>单笔限额</label>
            <div class="value">¥{{ detail.single_limit }}</div>
          </div>
        </div>
      </section>

      <!-- 审核记录卡片 -->
      <section v-if="hasAuditInfo" class="info-card audit-info">
        <div class="card-header">
          <h2 class="card-title">审核记录</h2>
        </div>
        <div class="audit-timeline">
          <div v-for="(record, index) in auditRecords" :key="index" class="timeline-item">
            <div class="timeline-dot" :class="getAuditStatusClass(record.status)"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-title">{{ record.title }}</span>
                <span class="timeline-time">{{ record.time }}</span>
              </div>
              <div v-if="record.comment" class="timeline-comment">{{ record.comment }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 原始数据卡片（可折叠） -->
      <section class="info-card raw-data">
        <div class="card-header" @click="toggleRawData">
          <h2 class="card-title">原始数据</h2>
          <div class="expand-icon" :class="{ expanded: showRawData }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div v-show="showRawData" class="json-container">
          <pre class="json-block">{{ formattedDetail }}</pre>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getAdminMerchantDetails } from '@/api/merchant';
import { getMerchantCenterDetail } from '@/api/admin-merchant';
import { oneClickAdminLogin } from '@/api/admin';
import { getAdminToken, setAdminAuthData } from '@/utils/auth';

export default defineComponent({
  name: 'AdminMerchantDetail',
  setup() {
    const route = useRoute();

    // 初始化时确保所有响应式变量都有默认值
    const loading = ref(true);
    const error = ref('');
    const detail = ref(null);
    const activeSource = ref('');
    const showRawData = ref(false);
    const viewMode = ref('grid');
    const showImagePreview = ref(false);
    const currentPreviewImage = ref('');
    const currentPreviewTitle = ref('');
    const imageRotation = ref(0);
    let retryHandle = null;
    let pendingLoginPromise = null;
    let latestFetchToken = 0;
    let reloadSessionKey = '';

    // 立即初始化调试信息
    console.info('[AdminMerchantDetail] component setup started');

    const MAX_RETRY = 4;
    const RETRY_DELAY = 800;
    const TOKEN_WAIT_STEP = 200;
    const TOKEN_WAIT_TIMEOUT = 4000;

    const clearRetry = () => {
      if (retryHandle) {
        clearTimeout(retryHandle);
        retryHandle = null;
      }
    };

    const sanitizeSource = (value) => {
      if (typeof value !== 'string') return '';
      const normalized = value.trim().toLowerCase();
      if (!normalized) return '';
      if (normalized.startsWith('draft')) return 'draft';
      if (normalized.startsWith('final')) return 'final';
      if (normalized.startsWith('legacy')) return 'legacy';
      if (normalized.startsWith('center')) return 'center';
      return normalized;
    };

    const unwrapResponse = (payload) => {
      if (!payload) {
        return payload;
      }
      if (payload && typeof payload === 'object') {
        if ('data' in payload && 'status' in payload) {
          return unwrapResponse(payload.data);
        }
        if ('code' in payload && 'data' in payload) {
          if (Number(payload.code) !== 0 && payload.code !== 'SUCCESS') {
            const error = new Error(payload.message || '请求失败');
            error.code = payload.code;
            throw error;
          }
          return unwrapResponse(payload.data);
        }
        if ('data' in payload) {
          return unwrapResponse(payload.data);
        }
      }
      return payload;
    };

    const getRouteMerchantId = () => {
      const paramId = route.params.id ?? route.query.id ?? '';
      return String(paramId || '').trim();
    };

    const getRouteRecordId = () => {
      const record = route.query.record_id ?? route.query.recordId ?? '';
      return String(record || '').trim();
    };

    const ensureAdminSession = async () => {
      const existing = getAdminToken();
      if (existing) {
        return existing;
      }

      if (pendingLoginPromise) {
        return pendingLoginPromise;
      }

      pendingLoginPromise = (async () => {
        try {
          const response = await oneClickAdminLogin({});
          if (response && response.code === 0 && response.data?.token) {
            setAdminAuthData(response.data.token, response.data.user || {});
            return response.data.token;
          }
        } catch (err) {
          console.warn('自动登录管理员失败:', err);
        } finally {
          pendingLoginPromise = null;
        }
        return '';
      })();

      return pendingLoginPromise;
    };

    const waitForAdminToken = async () => {
      const deadline = Date.now() + TOKEN_WAIT_TIMEOUT;
      while (Date.now() < deadline) {
        const token = getAdminToken();
        if (token) {
          return token;
        }
        await new Promise(resolve => setTimeout(resolve, TOKEN_WAIT_STEP));
      }
      return getAdminToken() || '';
    };

    const scheduleRetry = (nextAttempt) => {
      clearRetry();
      retryHandle = setTimeout(() => {
        fetchDetail(nextAttempt);
      }, RETRY_DELAY);
    };

    const fetchDetail = async (attempt = 1) => {
      console.info('[AdminMerchantDetail] fetchDetail called', { attempt });
      
      const merchantId = getRouteMerchantId();
      const recordId = getRouteRecordId();
      const requestedSource = sanitizeSource(route.query.source || '');
      const fetchToken = ++latestFetchToken;

      clearRetry();

      console.info('[AdminMerchantDetail] fetchDetail begin', { 
        attempt, 
        merchantId, 
        recordId, 
        requestedSource, 
        fetchToken,
        initialLoading: loading.value,
        initialError: error.value,
        initialDetail: !!detail.value
      });

      if (!merchantId && !recordId) {
        loading.value = false;
        detail.value = null;
        error.value = '缺少商户ID或进件记录ID';
        console.warn('[AdminMerchantDetail] missing id parameters');
        return;
      }

      // 始终显示加载状态，确保UI响应
      loading.value = true;
      error.value = '';
      if (attempt === 1) {
        detail.value = null;
      }
      activeSource.value = requestedSource;
      
      console.info('[AdminMerchantDetail] state after initialization', {
        loading: loading.value,
        error: error.value,
        detail: !!detail.value,
        activeSource: activeSource.value
      });

      const params = {};
      if (requestedSource) {
        params.source = requestedSource;
      }
      if (recordId) {
        params.record_id = recordId;
      }

      const centerId = requestedSource === 'draft' && recordId ? recordId : merchantId || recordId;

      let lastError = null;
      let fetched = false;

      const tryFetch = async (fn) => {
        try {
          const response = await fn();
          if (fetchToken !== latestFetchToken) {
            return true;
          }
          const data = unwrapResponse(response);
          if (data) {
            detail.value = data;
            activeSource.value = sanitizeSource(data.record_source || requestedSource);
            fetched = true;
            return true;
          }
        } catch (err) {
          lastError = err;
          console.warn('[AdminMerchantDetail] fetch attempt failed', err);
        }
        return false;
      };

      // 确保管理员token可用
      let tokenAvailable = getAdminToken();
      if (!tokenAvailable) {
        console.info('[AdminMerchantDetail] no admin token, trying to login');
        try {
          await ensureAdminSession();
          tokenAvailable = await waitForAdminToken();
        } catch (err) {
          console.error('[AdminMerchantDetail] admin login failed', err);
          lastError = err;
        }
      }

      // 如果获取token失败，直接返回错误
      if (!tokenAvailable) {
        error.value = '管理员登录失败，请刷新页面重试';
        loading.value = false;
        console.error('[AdminMerchantDetail] cannot get admin token');
        return;
      }

      // 优先尝试获取中心API数据
      if (centerId && tokenAvailable) {
        console.info('[AdminMerchantDetail] request center detail', { centerId, params });
        await tryFetch(async () => {
          const resp = await getMerchantCenterDetail(centerId, params);
          return resp;
        });
      }

      // 如果中心API失败，尝试legacy API
      if (!fetched && merchantId) {
        console.info('[AdminMerchantDetail] request legacy detail');
        await tryFetch(async () => {
          const resp = await getAdminMerchantDetails(merchantId);
          return resp;
        });
      }

      // 处理错误情况
      if (!fetched && fetchToken === latestFetchToken) {
        const status = Number(lastError?.response?.status ?? lastError?.code ?? 0);
        console.warn('[AdminMerchantDetail] fetch failed', { status, attempt, MAX_RETRY });
        
        if (status === 401 && attempt < MAX_RETRY) {
          scheduleRetry(attempt + 1);
          return;
        }
        if (attempt < MAX_RETRY) {
          scheduleRetry(attempt + 1);
          return;
        }
        
        const messageText = lastError?.message || `未能加载商户详情（状态 ${status || '未知'}）`;
        error.value = messageText;
        message.error(`加载商户详情失败：${messageText}`);
        if (reloadSessionKey) {
          sessionStorage.removeItem(reloadSessionKey);
          debugIds.value.reloadMarker = '';
        }
        console.error('[AdminMerchantDetail] fetchDetail failed after all retries', lastError);
        loading.value = false;
        return;
      }

      if (fetchToken === latestFetchToken) {
        loading.value = false;
        if (reloadSessionKey) {
          sessionStorage.setItem(reloadSessionKey, 'done');
        }
        console.info('[AdminMerchantDetail] fetchDetail success', { source: activeSource.value, id: detail.value?.id });
      }
    };

    watch(
      () => [route.params.id, route.query.source, route.query.record_id],
      () => {
        fetchDetail();
      },
      { immediate: false }
    );

    const buildReloadHref = () => {
      const current = window.location.href;
      const hashIndex = current.indexOf('#');
      if (hashIndex === -1) {
        return current;
      }
      const prefix = current.slice(0, hashIndex + 1);
      const hash = current.slice(hashIndex + 1);
      const token = `_reload=${Date.now().toString(36)}`;
      if (hash.includes('_reload=')) {
        return prefix + hash.replace(/_reload=[^&]*/i, token);
      }
      if (hash.includes('?')) {
        return prefix + hash + '&' + token;
      }
      return prefix + hash + '?' + token;
    };

    onMounted(async () => {
      console.info('[AdminMerchantDetail] onMounted started');
      
      // 确保初始状态正确
      loading.value = true;
      error.value = '';
      detail.value = null;
      
      const mid = getRouteMerchantId();
      const rid = getRouteRecordId();
      const baseKey = mid || rid || 'unknown';
      reloadSessionKey = `admin_merchant_detail_reload_${baseKey}`;

      const marker = sessionStorage.getItem(reloadSessionKey) || '';

      // 直接加载数据，不再强制刷新页面
      if (!marker) {
        sessionStorage.setItem(reloadSessionKey, 'done');
      }

      console.info('[AdminMerchantDetail] initial state', { 
        loading: loading.value, 
        error: error.value, 
        detail: detail.value,
        merchantId: mid,
        recordId: rid
      });

      // 确保有管理员token后再加载数据
      try {
        let token = getAdminToken();
        if (!token) {
          console.info('[AdminMerchantDetail] no admin token, trying to login');
          await ensureAdminSession();
          token = await waitForAdminToken();
          if (!token) {
            console.error('[AdminMerchantDetail] failed to get admin token');
            error.value = '管理员登录失败，请刷新页面重试';
            loading.value = false;
            return;
          }
        }
        
        // 使用nextTick确保DOM完全渲染后再加载数据
        nextTick(() => {
          console.info('[AdminMerchantDetail] calling fetchDetail');
          fetchDetail();
        });
      } catch (err) {
        console.error('[AdminMerchantDetail] initialization error:', err);
        error.value = '初始化失败，请刷新页面重试';
        loading.value = false;
      }
    });

    onBeforeUnmount(() => {
      clearRetry();
    });

    const summary = computed(() => {
      const data = detail.value || {};
      // 格式化来源显示
      const formatSource = (source) => {
        if (!source) return '未设置';
        const normalized = source.toLowerCase();
        switch (normalized) {
          case 'draft': return '草稿';
          case 'final': return '正式';
          case 'legacy': return '旧版';
          case 'center': return '商户中心';
          default: return source;
        }
      };
      
      // 格式化状态显示
      const formatStatus = (status) => {
        if (!status) return '未入驻';
        const normalized = status.toLowerCase();
        switch (normalized) {
          case 'draft': return '草稿';
          case 'pending': return '待审核';
          case 'approved': 
          case 'success': 
          case '通过': return '已通过';
          case 'rejected': 
          case 'failed': 
          case '拒绝': return '已拒绝';
          default: return status;
        }
      };
      
      return {
        name: data.mch_name || data.mch_short_name || data.name || '未设置',
        merchantId: data.merchant_id || data.id || '未设置',
        source: formatSource(activeSource.value || data.record_source),
        statusText: formatStatus(data.status_text || data.audit_status_text || data.status),
        contact: data.contact_name || data.principal_name || '未设置',
        phone: data.contact_phone || data.principal_mobile || '未设置',
        submittedAt: data.submitted_at || data.create_time || data.created_at || '未设置',
        recordNo: data.record_no || '未设置',
        channel: data.channel_name || data.invite_owner_name || '未设置',
        address: data.full_address || data.address || data.contact_address || '未设置'
      };
    });

    const formattedDetail = computed(() => {
      if (!detail.value) {
        return '';
      }
      try {
        return JSON.stringify(detail.value, null, 2);
      } catch (err) {
        return String(detail.value);
      }
    });

    // 计算属性：检查是否有资质信息
    const hasQualificationInfo = computed(() => {
      if (!detail.value) return false;
      const fields = ['license_no', 'legal_name', 'legal_id_card', 'business_scope'];
      return fields.some(field => detail.value[field]);
    });

    // 计算属性：检查是否有银行信息
    const hasBankInfo = computed(() => {
      if (!detail.value) return false;
      const fields = ['bank_name', 'bank_account_name', 'bank_account_no'];
      return fields.some(field => detail.value[field]);
    });

    // 计算属性：检查是否有费率信息
    const hasRateInfo = computed(() => {
      if (!detail.value) return false;
      const fields = ['credit_rate', 'debit_rate', 'scan_rate', 'single_limit'];
      return fields.some(field => detail.value[field]);
    });

    // 计算属性：检查是否有审核信息
    const hasAuditInfo = computed(() => {
      if (!detail.value) return false;
      return detail.value.audit_records && Array.isArray(detail.value.audit_records) && detail.value.audit_records.length > 0;
    });

    // 计算属性：检查是否有媒体资源
    const hasMediaAssets = computed(() => {
      if (!detail.value || !detail.value.media_assets) return false;
      const assets = detail.value.media_assets;
      return (
        (assets.identity && assets.identity.length > 0) ||
        (assets.license && assets.license.length > 0) ||
        (assets.storefront && assets.storefront.length > 0) ||
        (assets.protocol && assets.protocol.length > 0) ||
        (assets.other && assets.other.length > 0)
      );
    });

    // 计算属性：获取媒体资源
    const mediaAssets = computed(() => {
      if (!detail.value || !detail.value.media_assets) {
        return {
          identity: [],
          license: [],
          storefront: [],
          protocol: [],
          other: []
        };
      }
      return detail.value.media_assets;
    });

    // 计算属性：审核记录
    const auditRecords = computed(() => {
      if (!detail.value || !detail.value.audit_records) return [];
      return detail.value.audit_records.map(record => ({
        title: record.audit_user || '系统',
        time: record.audit_time || record.created_at || '',
        status: record.audit_status || record.status,
        comment: record.audit_comment || record.comment || ''
      }));
    });

    // 方法：获取状态样式类
    const getStatusClass = () => {
      if (!detail.value) return '';
      const status = detail.value.audit_status || detail.value.status;
      switch (status) {
        case 'approved':
        case 'success':
        case '通过':
          return 'status-success';
        case 'rejected':
        case 'failed':
        case '拒绝':
          return 'status-error';
        case 'pending':
        case '待审核':
          return 'status-pending';
        default:
          return 'status-default';
      }
    };

    // 方法：获取来源样式类
    const getSourceClass = () => {
      const source = activeSource.value || '';
      switch (source) {
        case 'draft':
          return 'source-draft';
        case 'final':
          return 'source-final';
        case 'legacy':
          return 'source-legacy';
        case 'center':
          return 'source-center';
        default:
          return 'source-default';
      }
    };

    // 方法：获取审核状态样式类
    const getAuditStatusClass = (status) => {
      switch (status) {
        case 'approved':
        case 'success':
        case '通过':
          return 'audit-success';
        case 'rejected':
        case 'failed':
        case '拒绝':
          return 'audit-error';
        case 'pending':
        case '待审核':
          return 'audit-pending';
        default:
          return 'audit-default';
      }
    };

    // 方法：切换原始数据显示
    const toggleRawData = () => {
      showRawData.value = !showRawData.value;
    };

    // 方法：刷新数据
    const refreshData = () => {
      fetchDetail();
    };

    // 方法：获取图片URL
    const getImageUrl = (imagePath) => {
      if (!imagePath) return '';
      // 如果是完整URL，直接返回
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      // 否则拼接基础URL
      const baseUrl = 'https://pay.itapgo.com';
      // 确保路径以/开头
      const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${baseUrl}${normalizedPath}`;
    };

    // 方法：处理图片加载错误
    const handleImageError = (event) => {
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik03NSA3NUgxMjVWMTI1SDc1Vjc1WiIgZmlsbD0iI0M2QzZDNiIvPgo8cGF0aCBkPSJNODcuNSA5My43NUw5My43NSA4Ny41TDEwNi4yNSAxMDBMMTMxLjI1IDc1TDEzNy41IDgxLjI1TDEwNi4yNSAxMTIuNUw4Ny41IDkzLjc1WiIgZmlsbD0iI0M2QzZDNiIvPgo8L3N2Zz4K';
    };

    // 方法：打开图片预览
    const openImagePreview = (image, title) => {
      currentPreviewImage.value = image;
      currentPreviewTitle.value = title;
      imageRotation.value = 0;
      showImagePreview.value = true;
      // 禁止背景滚动
      document.body.style.overflow = 'hidden';
    };

    // 方法：关闭图片预览
    const closeImagePreview = () => {
      showImagePreview.value = false;
      currentPreviewImage.value = '';
      currentPreviewTitle.value = '';
      imageRotation.value = 0;
      // 恢复背景滚动
      document.body.style.overflow = '';
    };

    // 方法：旋转图片
    const rotateImage = () => {
      imageRotation.value = (imageRotation.value + 90) % 360;
    };

    // 方法：下载图片
    const downloadImage = async (imagePath) => {
      try {
        // 检查图片路径是否有效
        if (!imagePath) {
          message.error('图片路径无效，无法下载');
          return;
        }
        
        const imageUrl = getImageUrl(imagePath);
        const fileName = imagePath.split('/').pop() || 'image.jpg';
        
        // 检测是否为移动设备
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // 移动设备使用新窗口打开图片，用户可以长按保存
          const newWindow = window.open(imageUrl, '_blank');
          if (!newWindow) {
            // 如果弹窗被阻止，则尝试其他方法
            await downloadImageAsync(imageUrl, fileName);
          } else {
            // 显示提示信息
            message.info('请长按图片选择"保存到相册"');
          }
        } else {
          // 桌面设备使用传统下载方法
          await downloadImageAsync(imageUrl, fileName);
        }
      } catch (error) {
        console.error('下载图片失败:', error);
        message.error('下载失败，请重试');
      }
    };
    
    // 异步下载图片的辅助方法
    const downloadImageAsync = async (url, fileName) => {
      try {
        // 检查URL是否有效
        if (!url || typeof url !== 'string') {
          throw new Error('图片URL无效');
        }
        
        // 获取图片数据
        const response = await fetch(url);
        if (!response.ok) throw new Error('网络请求失败');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.style.display = 'none';
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        
        // 清理资源
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        message.success('开始下载');
      } catch (error) {
        console.error('下载图片失败:', error);
        
        // 如果下载失败，尝试在新窗口打开
        if (url && typeof url === 'string') {
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            message.info('请长按图片选择"保存到相册"');
          } else {
            message.error('下载失败，请重试');
          }
        } else {
          message.error('图片URL无效，无法下载');
        }
      }
    };

    return {
      loading,
      error,
      detail,
      summary,
      formattedDetail,
      activeSource,
      showRawData,
      viewMode,
      showImagePreview,
      currentPreviewImage,
      currentPreviewTitle,
      imageRotation,
      hasQualificationInfo,
      hasBankInfo,
      hasRateInfo,
      hasAuditInfo,
      hasMediaAssets,
      mediaAssets,
      auditRecords,
      getStatusClass,
      getSourceClass,
      getAuditStatusClass,
      toggleRawData,
      refreshData,
      getImageUrl,
      handleImageError,
      openImagePreview,
      closeImagePreview,
      rotateImage,
      downloadImage
    };
  }
});
</script>

<style scoped>
.admin-merchant-detail {
  padding: 16px;
  background-color: #f6f7fb;
  min-height: 100vh;
  box-sizing: border-box;
}

.page-title {
  font-size: 20px;
  margin-bottom: 16px;
  color: #1f1f1f;
}

.status {
  padding: 12px 16px;
  border-radius: 6px;
  background: #ffffff;
  color: #595959;
  border: 1px solid #d9d9d9;
}

.status-error {
  border-color: #ff7875;
  color: #d4380d;
  background: #fff2f0;
}

/* 视觉焕新样式 */
.admin-merchant-detail {
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 100vh;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 商户紧凑信息 */
.merchant-compact-info {
  flex: 1;
}

.merchant-name {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.merchant-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.merchant-id {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.merchant-id:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  border-color: #1890ff;
}

.id-icon {
  width: 14px;
  height: 14px;
  opacity: 0.8;
  color: #1890ff;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.status-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-badge:hover::before {
  opacity: 1;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.status-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border: 1px solid #86efac;
}

.status-success::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  background: #22c55e;
  border-radius: 0 0 0 6px;
  opacity: 0.6;
}

.status-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.status-error::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 0 0 0 6px;
  opacity: 0.6;
}

.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-pending::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 0 0 0 6px;
  opacity: 0.6;
}

.status-default {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-default::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 6px;
  background: #64748b;
  border-radius: 0 0 0 6px;
  opacity: 0.6;
}

.source-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.source-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.8s ease;
}

.source-tag:hover::before {
  left: 100%;
}

.source-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.status-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.status-badge:hover::before {
  opacity: 1;
}

.status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.status-success {
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  color: #15803d;
  border: 1px solid #86efac;
}

.status-success::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 0 0 0 8px;
  opacity: 0.6;
}

.status-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #b91c1c;
  border: 1px solid #fca5a5;
}

.status-error::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 0 0 0 8px;
  opacity: 0.6;
}

.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #b45309;
  border: 1px solid #fcd34d;
}

.status-pending::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 0 0 0 8px;
  opacity: 0.6;
}

.status-default {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
}

.status-default::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #64748b;
  border-radius: 0 0 0 8px;
  opacity: 0.6;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #8c8c8c;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 状态提示 */
.status {
  padding: 12px 16px;
  border-radius: 6px;
  background: #ffffff;
  color: #595959;
  border: 1px solid #d9d9d9;
  margin-bottom: 16px;
}

.status-error {
  border-color: #ff7875;
  color: #d4380d;
  background: #fff2f0;
}

.status-empty {
  background: #fff;
  color: #8c8c8c;
}

/* 内容区域 */
.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 信息卡片 */
.info-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(148, 163, 184, 0.08);
}

.info-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  width: 18px;
  height: 18px;
  color: #3b82f6;
  padding: 4px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #595959;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.icon {
  width: 14px;
  height: 14px;
}

/* 商户基本信息样式 */
.merchant-basic {
  margin-bottom: 20px;
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.merchant-info-section {
  padding: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.status-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.8s ease;
}

.status-badge:hover::before {
  left: 100%;
}

.status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.status-icon {
  width: 16px;
  height: 16px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 信息分组容器 */
.info-groups-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 8px;
}

.info-group-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.info-group-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6);
  background-size: 200% 100%;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-group-card:hover::before {
  transform: scaleX(1);
}

.info-group-card:hover {
  border-color: rgba(59, 130, 246, 0.2);
  box-shadow: 0 8px 30px rgba(59, 130, 246, 0.1);
  transform: translateY(-4px);
}

.info-group-card:nth-child(1) {
  animation: slideInLeft 0.6s ease-out 0.1s both;
}

.info-group-card:nth-child(2) {
  animation: slideInRight 0.6s ease-out 0.2s both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.info-group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.info-group-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #1890ff, #36cfc9);
  transition: width 0.4s ease;
}

.info-group-card:hover .info-group-header::after {
  width: 100%;
}

.info-icon {
  width: 20px;
  height: 20px;
  color: #1890ff;
  padding: 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-group-card:hover .info-icon {
  background: #1890ff;
  color: white;
  transform: scale(1.1) rotate(5deg);
}

.info-group-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  position: relative;
}

.info-group-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  padding-left: 20px;
  transition: all 0.3s ease;
}

.info-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.info-item:hover::before {
  width: 8px;
  height: 8px;
  opacity: 1;
}

.info-item:hover {
  padding-left: 24px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-item.address-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  color: #7c7c7c;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  min-width: 70px;
  flex-shrink: 0;
}

.info-value {
  font-size: 15px;
  color: #1a1a1a;
  font-weight: 500;
  word-break: break-all;
  line-height: 1.6;
  padding: 4px 0;
  position: relative;
  transition: all 0.3s ease;
  flex: 1;
}

.info-value::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #1890ff, #36cfc9);
  transition: width 0.3s ease;
}

.info-item:hover .info-value::after {
  width: 40px;
}

.info-value.phone {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%);
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid #1890ff;
  position: relative;
  overflow: hidden;
}

.info-value.phone::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(24, 144, 255, 0.1), transparent);
  transition: left 0.6s ease;
}

.info-value.phone:hover::before {
  left: 100%;
}

.info-value.address {
  line-height: 1.7;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f9f0 100%);
  border-radius: 8px;
  border-left: 4px solid #52c41a;
  position: relative;
}

.info-value.address::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(82, 196, 26, 0.1), transparent);
  transition: left 0.6s ease;
}

.info-value.address:hover::before {
  left: 100%;
}

.source-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.source-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.8s ease;
}

.source-tag:hover::before {
  left: 100%;
}

.source-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.title-icon {
  width: 20px;
  height: 20px;
  color: #1890ff;
  margin-right: 10px;
  padding: 4px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.source-draft {
  background: linear-gradient(135deg, #e6f7ff 0%, #d6f3ff 100%);
  color: #0050b3;
  border: 1px solid #91d5ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.source-draft:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

.source-final {
  background: linear-gradient(135deg, #f6ffed 0%, #e6f7e6 100%);
  color: #237804;
  border: 1px solid #b7eb8f;
  box-shadow: 0 2px 4px rgba(82, 196, 26, 0.1);
}

.source-final:hover {
  border-color: #52c41a;
  box-shadow: 0 4px 8px rgba(82, 196, 26, 0.2);
}

.source-legacy {
  background: linear-gradient(135deg, #f9f0ff 0%, #f3e6ff 100%);
  color: #531dab;
  border: 1px solid #d3adf7;
  box-shadow: 0 2px 4px rgba(114, 46, 209, 0.1);
}

.source-legacy:hover {
  border-color: #722ed1;
  box-shadow: 0 4px 8px rgba(114, 46, 209, 0.2);
}

.source-center {
  background: linear-gradient(135deg, #fff0f6 0%, #ffe6f0 100%);
  color: #c41d7f;
  border: 1px solid #ffadd2;
  box-shadow: 0 2px 4px rgba(235, 47, 150, 0.1);
}

.source-center:hover {
  border-color: #eb2f96;
  box-shadow: 0 4px 8px rgba(235, 47, 150, 0.2);
}

.source-default {
  background: linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%);
  color: #595959;
  border: 1px solid #d9d9d9;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.source-default:hover {
  border-color: #8c8c8c;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 资质信息 */
.qualification-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.qual-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qual-item.full-width {
  grid-column: 1 / -1;
}

.qual-item label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.qual-item .value {
  font-size: 14px;
  color: #1f1f1f;
  word-break: break-all;
}

/* 银行信息 */
.bank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.bank-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bank-item label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.bank-item .value {
  font-size: 14px;
  color: #1f1f1f;
  word-break: break-all;
}

.bank-item .value.bank-account {
  font-family: monospace;
  letter-spacing: 1px;
}

/* 费率信息 */
.rate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
}

.rate-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rate-item label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.rate-item .value {
  font-size: 16px;
  color: #1f1f1f;
  font-weight: 600;
}

.rate-item .value.rate {
  color: #52c41a;
}

/* 审核记录 */
.audit-timeline {
  padding: 20px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 24px;
  bottom: -20px;
  width: 1px;
  background-color: #f0f0f0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-dot.audit-success {
  background-color: #52c41a;
}

.timeline-dot.audit-error {
  background-color: #ff4d4f;
}

.timeline-dot.audit-pending {
  background-color: #faad14;
}

.timeline-dot.audit-default {
  background-color: #d9d9d9;
}

.timeline-content {
  flex: 1;
  padding-top: 2px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
}

.timeline-time {
  font-size: 12px;
  color: #8c8c8c;
}

.timeline-comment {
  font-size: 13px;
  color: #595959;
  line-height: 1.5;
  background-color: #fafafa;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #d9d9d9;
}

/* 媒体资源区域 */
.media-assets {
  margin-bottom: 24px;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 8px;
  padding: 3px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-btn svg {
  width: 14px;
  height: 14px;
}

.toggle-btn.active {
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.media-section {
  margin-bottom: 24px;
}

.media-section:last-child {
  margin-bottom: 0;
}

.media-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  letter-spacing: -0.01em;
}

.section-icon {
  width: 16px;
  height: 16px;
  color: #3b82f6;
  padding: 4px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
}

.media-grid {
  display: grid;
  gap: 16px;
}

.media-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.media-grid.list {
  grid-template-columns: 1fr;
  gap: 12px;
}

.media-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.media-item:hover {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.12);
  transform: translateY(-4px);
}

.media-grid.list .media-item {
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
}

.media-thumbnail {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.media-grid.list .media-thumbnail {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 8px;
}

.media-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.media-item:hover .media-thumbnail img {
  transform: scale(1.08);
}

.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(6, 182, 212, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.preview-icon {
  width: 24px;
  height: 24px;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.media-info {
  padding: 14px;
}

.media-grid.list .media-info {
  padding: 0;
  flex: 1;
}

.media-title {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  text-align: center;
  letter-spacing: -0.01em;
}

.media-grid.list .media-title {
  text-align: left;
}

/* 图片预览弹窗 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.preview-container {
  background: #fff;
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: #64748b;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(148, 163, 184, 0.1);
  color: #334155;
  transform: scale(1.05);
}

.close-btn svg {
  width: 16px;
  height: 16px;
}

.preview-content {
  flex: 1;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.preview-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: rotate(0deg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
}

.preview-actions .action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 8px;
  background: #fff;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.preview-actions .action-btn:hover {
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.preview-actions .action-btn svg {
  width: 16px;
  height: 16px;
}

/* 原始数据 */
.raw-data .card-header {
  cursor: pointer;
  user-select: none;
}

.expand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-icon svg {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.json-container {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

.json-block {
  max-height: 320px;
  overflow: auto;
  padding: 16px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  border-radius: 0 0 12px 12px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .admin-merchant-detail {
    padding: 6px;
  }

  .merchant-info-section {
    padding: 16px;
  }

  .merchant-name {
    font-size: 18px;
    margin-bottom: 6px;
  }

  .merchant-meta {
    gap: 6px;
  }

  .status-badge {
    padding: 3px 8px;
    font-size: 11px;
  }

  .source-tag {
    padding: 3px 8px;
    font-size: 11px;
  }

  .merchant-id {
    padding: 3px 8px;
    font-size: 11px;
  }

  .id-icon {
    width: 12px;
    height: 12px;
  }

  .info-groups-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-group-header {
    padding: 14px 16px;
  }

  .info-group-content {
    padding: 16px;
    gap: 14px;
  }

  .info-icon {
    width: 16px;
    height: 16px;
    padding: 4px;
  }

  .info-group-title {
    font-size: 14px;
  }

  .info-value {
    font-size: 13px;
  }

  .qualification-grid,
  .bank-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }

  .rate-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .card-header {
    padding: 14px 16px;
  }

  .audit-timeline {
    padding: 16px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .json-block {
    max-height: 220px;
    font-size: 12px;
    padding: 12px;
  }

  /* 媒体资源响应式 */
  .media-grid.grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  .media-thumbnail {
    height: 120px;
  }

  .media-grid.list .media-thumbnail {
    width: 60px;
    height: 60px;
  }

  .preview-container {
    width: 95vw;
    max-height: 95vh;
  }

  .preview-header,
  .preview-actions {
    padding: 12px 16px;
  }

  .preview-content {
    padding: 16px;
  }
}

@media screen and (max-width: 480px) {
  .admin-merchant-detail {
    padding: 4px;
  }

  .merchant-info-section {
    padding: 14px;
  }

  .merchant-name {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .merchant-meta {
    gap: 4px;
  }

  .merchant-id {
    font-size: 10px;
    padding: 2px 6px;
  }

  .status-badge {
    padding: 2px 6px;
    font-size: 10px;
  }

  .source-tag {
    padding: 2px 6px;
    font-size: 10px;
  }

  .id-icon {
    width: 10px;
    height: 10px;
  }

  .info-groups-container {
    gap: 12px;
  }

  .info-group-header {
    padding: 12px 14px;
  }

  .info-group-title {
    font-size: 13px;
  }

  .info-group-content {
    padding: 14px;
    gap: 12px;
  }

  .info-value {
    font-size: 12px;
  }

  .info-icon {
    width: 14px;
    height: 14px;
    padding: 3px;
  }

  .info-item {
    padding-left: 14px;
  }

  .info-item:hover {
    padding-left: 16px;
  }

  .rate-grid {
    grid-template-columns: 1fr;
  }

  .card-header {
    padding: 12px 14px;
  }

  /* 媒体资源小屏幕响应式 */
  .media-grid.grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .media-section-title {
    font-size: 13px;
  }

  .media-title {
    font-size: 12px;
  }

  .media-info {
    padding: 8px;
  }

  .preview-actions {
    flex-direction: column;
    gap: 8px;
  }

  .preview-actions .action-btn {
    justify-content: center;
  }
}
</style>



.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(15, 35, 95, 0.08);
}

.info-card h2 {
  margin: 0 0 12px;
  font-size: 16px;
  color: #1f1f1f;
}

