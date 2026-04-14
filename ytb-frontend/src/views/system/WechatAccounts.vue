<template>
  <div class="wechat-accounts">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>微信公众号管理</h1>
      <p>管理系统中的微信公众号配置</p>
      <div class="header-actions">
        <el-button @click="$router.push('/system/wechat-third-party-platform')">
          第三方平台配置
        </el-button>
        <el-button 
          type="success" 
          @click="updateAllSubscriberCounts"
          :loading="updatingAllSubscribers"
        >
          <el-icon><Refresh /></el-icon>
          更新所有粉丝数
        </el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          扫码授权公众号
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-filters">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="公众号名称/AppID"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column label="编号" width="80" align="center" fixed="left">
          <template #default="{ row }">
            <span class="row-number">{{ getDatabaseId(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="公众号信息" min-width="280" fixed="left">
          <template #default="{ row }">
            <div class="account-info">
              <div class="avatar-section">
                <template v-if="getAvatarSrc(row)">
                  <img 
                    :src="getAvatarSrc(row)" 
                    class="account-avatar"
                    @error="handleAvatarError"
                    @load="handleAvatarLoad"
                    :alt="row.name + '的头像'"
                  />
                </template>
                <template v-else>
                  <el-avatar :size="50" shape="square" class="account-avatar">
                    <el-icon><User /></el-icon>
                  </el-avatar>
                </template>
              </div>
              <div class="info-section">
                <div class="name-line">
                  <span class="account-name">{{ row.name || '未命名公众号' }}</span>
                  <el-tag 
                    :type="row.auth_type === 'third_party' ? 'success' : 'primary'" 
                    size="small"
                    class="auth-type-tag"
                  >
                    {{ row.auth_type === 'third_party' ? '第三方授权' : '直接配置' }}
                  </el-tag>
                </div>
                <div class="appid-line">
                  <span class="app-id">AppID: {{ row.app_id || '未配置' }}</span>
                </div>
                <div class="desc-line" v-if="row.description">
                  <span class="description">{{ row.description }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="粉丝数" width="150" align="center">
          <template #default="{ row }">
            <div class="subscriber-info">
              <div class="subscriber-count" v-if="row.subscriber_count !== null && row.subscriber_count !== undefined">
                <el-icon class="subscriber-icon"><User /></el-icon>
                <span class="count-text">{{ formatSubscriberCount(row.subscriber_count) }}</span>
              </div>
              <div class="no-data" v-else>
                <el-icon class="subscriber-icon"><User /></el-icon>
                <span class="count-text">0</span>
              </div>
              <div class="update-time" v-if="row.subscriber_count_updated_at">
                <small class="text-gray">{{ formatUpdateTime(row.subscriber_count_updated_at) }}</small>
              </div>
              <div class="no-update" v-else-if="row.subscriber_count !== null && row.subscriber_count !== undefined">
                <small class="text-gray">未更新</small>
              </div>
              <div class="update-action" v-if="row.auth_type === 'third_party'">
                <el-button 
                  size="small" 
                  type="primary" 
                  link
                  @click="updateSingleSubscriberCount(row)"
                  :loading="updatingSubscriber[row.app_id]"
                >
                  <el-icon><Refresh /></el-icon>
                  更新
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="配置信息" width="250">
          <template #default="{ row }">
            <div class="config-info">
              <div class="config-item">
                <span class="config-label">AppSecret:</span>
                <div class="secret-display" v-if="row.app_secret">
                  <span v-if="showSecrets[row.id]" class="secret-text">{{ row.app_secret }}</span>
                  <span v-else class="secret-masked">{{ maskSecret(row.app_secret) }}</span>
                  <el-button
                    size="small"
                    text
                    @click="toggleSecret(row.id)"
                    class="secret-toggle"
                  >
                    <el-icon>
                      <View v-if="!showSecrets[row.id]" />
                      <Hide v-else />
                    </el-icon>
                  </el-button>
                </div>
                <div v-else class="secret-config">
                  <el-button 
                    size="small" 
                    type="primary" 
                    link
                    @click="showAppSecretDialog(row)"
                    v-if="row.auth_type === 'third_party'"
                  >
                    <el-icon><Tools /></el-icon>
                    配置AppSecret
                  </el-button>
                  <span v-else class="text-gray">未配置</span>
                </div>
              </div>
              <div class="config-item" v-if="row.auth_type === 'third_party'">
                <el-tag type="info" size="small">
                  <el-icon><Lock /></el-icon>
                  第三方平台授权
                </el-tag>
              </div>
              <div class="config-item" v-if="row.token && row.auth_type !== 'third_party'">
                <span class="config-label">Token:</span>
                <span class="config-value">{{ row.token.substring(0, 8) }}...</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="权限集" width="150" v-if="hasThirdPartyAccounts">
          <template #default="{ row }">
            <div class="permissions-info">
              <div v-if="row.auth_type === 'third_party'">
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="showPermissions(row)"
                  :loading="loadingPermissions[row.app_id]"
                >
                  <el-icon><Key /></el-icon>
                  查看权限
                </el-button>
                <div v-if="accountPermissions[row.app_id]" class="permission-count">
                  <small class="text-gray">
                    {{ accountPermissions[row.app_id].total_permissions || 0 }} 项权限
                  </small>
                </div>
              </div>
              <div v-else class="no-permissions">
                <span class="text-gray">手动配置</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态信息" width="150">
          <template #default="{ row }">
            <div class="status-info">
              <div class="status-item">
                <el-tag 
                  :type="row.status === 'active' ? 'success' : 'danger'"
                  size="small"
                  class="status-tag"
                >
                  <el-icon>
                    <Check v-if="row.status === 'active'" />
                    <Close v-else />
                  </el-icon>
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </div>
              <div class="qrcode-item" v-if="row.qr_code">
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="showQrCode(row)"
                >
                  <el-icon><Grid /></el-icon>
                  查看二维码
                </el-button>
              </div>
              <div class="time-item">
                <span class="create-time">{{ formatDateTime(row.created_at) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button-group size="small">
                <el-button @click="showDetail(row)" title="查看详情">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button type="primary" @click="showEditDialog(row)" title="编辑">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  :type="row.status === 'active' ? 'warning' : 'success'"
                  @click="toggleStatus(row)"
                  :title="row.status === 'active' ? '禁用' : '启用'"
                >
                  <el-icon>
                    <SwitchButton v-if="row.status === 'active'" />
                    <Switch v-else />
                  </el-icon>
                </el-button>
              </el-button-group>

            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="resetForm"
    >
      <div class="auth-intro">
        <el-alert
          title="公众号授权说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>通过微信开放平台第三方应用进行公众号授权，支持以下功能：</p>
            <ul style="margin: 10px 0 0 20px;">
              <li>安全的OAuth2.0授权机制</li>
              <li>自动获取公众号基本信息</li>
              <li>支持PC端和H5端扫码授权</li>
              <li>无需手动配置AppID和AppSecret</li>
            </ul>
          </template>
        </el-alert>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        style="margin-top: 20px;"
      >
        <el-form-item label="公众号名称" prop="name">
          <el-input
            v-model="form.name" 
            placeholder="请输入公众号名称（授权后可自动获取）" 
          />
          <div class="form-tip">
            <small class="text-gray">授权成功后将自动更新为公众号实际名称</small>
          </div>
        </el-form-item>
        
        <el-form-item label="第三方平台" v-if="thirdPartyPlatforms.length === 0">
          <el-alert
            title="未找到第三方平台配置"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>请先配置第三方平台，然后再进行公众号授权。</p>
              <el-button 
                type="primary" 
                size="small"
                @click="$router.push('/system/wechat-third-party-platform')"
                style="margin-top: 10px;"
              >
                立即配置第三方平台
              </el-button>
            </template>
          </el-alert>
        </el-form-item>

        <el-form-item label="第三方平台" v-else-if="thirdPartyPlatforms.length > 0">
          <div class="platform-info">
            <el-tag type="success" size="large">
              <el-icon><Check /></el-icon>
              {{ currentPlatform?.name || '系统第三方平台' }}
            </el-tag>
            <span class="text-gray" style="margin-left: 10px;">
              AppID: {{ currentPlatform?.app_id || '未配置' }}
            </span>
          </div>
          <div class="form-tip">
            <small class="text-gray">
              系统将使用此第三方平台进行公众号授权，如需修改请前往
              <el-button 
                type="primary" 
                text 
                size="small"
                @click="$router.push('/system/wechat-third-party-platform')"
              >
                第三方平台配置
              </el-button>
            </small>
          </div>
        </el-form-item>

        <el-form-item label="票据状态" v-if="thirdPartyPlatforms.length > 0">
          <div class="ticket-status">
            <el-button 
              size="small"
              @click="checkTicketStatus"
              :loading="checkingTicket"
            >
              <el-icon><Refresh /></el-icon>
              检查验证票据状态
            </el-button>
            <div v-if="ticketStatusInfo" class="ticket-info" style="margin-top: 10px;">
              <el-tag 
                :type="ticketStatusInfo.status === 'good' ? 'success' : 'warning'"
                size="small"
              >
                {{ ticketStatusInfo.status === 'good' ? '票据正常' : '票据异常' }}
              </el-tag>
              <span v-if="ticketStatusInfo.last_updated" class="text-gray" style="margin-left: 10px; font-size: 12px;">
                更新时间: {{ ticketStatusInfo.last_updated }}
              </span>
            </div>
          </div>
          <div class="form-tip">
            <small class="text-gray">
              微信验证票据每10分钟更新一次，票据正常才能生成授权链接
            </small>
          </div>
        </el-form-item>

        <el-form-item label="授权操作" v-if="thirdPartyPlatforms.length > 0">
          <div class="auth-actions">
            <el-button 
              type="primary" 
              size="large"
              @click="generateAuthUrl()"
              :loading="generatingAuth"
            >
              <el-icon><Grid /></el-icon>
              生成授权二维码
            </el-button>
            <el-button 
              type="success" 
              size="large"
              @click="generateAuthUrl('h5')"
              :loading="generatingAuth"
            >
              <el-icon><Phone /></el-icon>
              H5授权链接
            </el-button>
            <el-button 
              type="warning" 
              size="large"
              @click="forceRefreshAndRetry"
              :loading="forceRefreshing"
              style="margin-left: 10px;"
            >
              <el-icon><Tools /></el-icon>
              紧急修复
            </el-button>
          </div>
          <div class="form-tip">
            <small class="text-gray">
              点击生成授权链接，公众号管理员扫码或访问链接完成授权。如果失败，请点击"紧急修复"
            </small>
          </div>
        </el-form-item>
        
        <el-form-item label="授权状态" v-if="form.authorized_account_id">
          <el-tag type="success" size="large">
            <el-icon><Check /></el-icon>
            已授权
          </el-tag>
          <span class="text-gray" style="margin-left: 10px;">
            授权账号ID: {{ form.authorized_account_id }}
          </span>
        </el-form-item>

        <el-form-item label="二维码URL" prop="qr_code">
          <el-input v-model="form.qr_code" placeholder="请输入公众号二维码URL（可选）" />
          <div class="form-tip">
            <small class="text-gray">用于展示公众号关注二维码</small>
          </div>
        </el-form-item>

        <el-form-item label="粉丝数量" prop="subscriber_count">
          <el-input-number 
            v-model="form.subscriber_count" 
            :min="0" 
            :max="99999999"
            placeholder="请输入粉丝数量"
            style="width: 100%"
          />
          <div class="form-tip">
            <small class="text-gray">可手动输入或通过API自动同步</small>
          </div>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入公众号描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="公众号详情"
      width="600px"
    >
      <div v-if="currentAccount" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="公众号名称">{{ currentAccount.name }}</el-descriptions-item>
          <el-descriptions-item label="AppID">{{ currentAccount.app_id }}</el-descriptions-item>
          <el-descriptions-item label="AppSecret">
            <span v-if="showDetailSecret">{{ currentAccount.app_secret }}</span>
            <span v-else>{{ maskSecret(currentAccount.app_secret) }}</span>
            <el-button
              size="small"
              text
              @click="showDetailSecret = !showDetailSecret"
              style="margin-left: 5px;"
            >
              <el-icon>
                <View v-if="!showDetailSecret" />
                <Hide v-else />
              </el-icon>
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="Token">{{ currentAccount.token || '-' }}</el-descriptions-item>
          <el-descriptions-item label="AES密钥">{{ currentAccount.aes_key || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentAccount.status === 'active' ? 'success' : 'danger'">
              {{ currentAccount.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="粉丝数量">
            <div class="subscriber-detail">
              <el-tag type="primary" size="large">
                <el-icon><User /></el-icon>
                {{ formatSubscriberCount(currentAccount.subscriber_count) }}
              </el-tag>
              <div v-if="currentAccount.subscriber_count_updated_at" class="update-info">
                <small class="text-gray">
                  更新时间: {{ formatDateTime(currentAccount.subscriber_count_updated_at) }}
                </small>
              </div>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="二维码" :span="2">
            <div v-if="currentAccount.qr_code">
              <img 
                :src="`/admin/api/wechat/qrcode_proxy.php?url=${encodeURIComponent(currentAccount.qr_code)}`" 
                alt="公众号二维码" 
                style="max-width: 200px;" 
                @error="handleQrCodeError"
              />
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentAccount.description || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAccount.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentAccount.updated_at }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 二维码查看对话框 -->
    <el-dialog
      v-model="qrCodeVisible"
      title="公众号二维码"
      width="400px"
    >
      <div v-if="currentQrCode" class="qr-code-container">
        <img :src="currentQrCode" alt="公众号二维码" style="width: 100%;" />
      </div>
    </el-dialog>

    <!-- AppSecret配置对话框 -->
    <el-dialog
      v-model="appSecretDialogVisible"
      title="配置公众号AppSecret"
      width="500px"
      @close="resetAppSecretForm"
    >
      <div v-if="currentAppSecretAccount" class="app-secret-config">
        <el-alert 
          title="配置说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        >
          <template #default>
            <p>为第三方平台授权的公众号配置AppSecret，用于直接OAuth授权，避免第三方平台token过期问题。</p>
          </template>
        </el-alert>
        
        <el-form
          ref="appSecretFormRef"
          :model="appSecretForm"
          :rules="appSecretFormRules"
          label-width="120px"
        >
          <el-form-item label="公众号名称">
            <el-input v-model="currentAppSecretAccount.name" readonly />
          </el-form-item>
          
          <el-form-item label="AppID">
            <el-input v-model="currentAppSecretAccount.app_id" readonly />
          </el-form-item>
          
          <el-form-item label="AppSecret" prop="app_secret">
            <el-input
              v-model="appSecretForm.app_secret"
              placeholder="请输入公众号的AppSecret"
              type="password"
              show-password
              clearable
            />
            <div class="form-tip">
              <small class="text-gray">
                请确保输入正确的AppSecret，错误的配置会导致授权失败
              </small>
            </div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="appSecretDialogVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="saveAppSecret"
            :loading="savingAppSecret"
          >
            保存配置
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 授权链接对话框 -->
    <el-dialog
      v-model="authUrlDialogVisible"
      title="公众号授权链接"
      width="600px"
      destroy-on-close
    >
      <div v-if="authUrlData.auth_url" class="auth-url-container">
        <el-alert 
          title="请使用微信扫描二维码或点击链接进行授权"
          type="info"
          :closable="false"
          style="margin-bottom: 20px;"
        />
        
        <el-tabs v-model="authUrlActiveTab" type="border-card" @tab-change="onTabChange">
          <el-tab-pane label="PC端授权" name="pc">
            <div class="auth-content">
              <div class="qr-code-section">
                <div id="auth-qrcode" style="text-align: center; margin: 20px 0;"></div>
                <p class="text-center text-gray">使用微信扫描上方二维码进行授权</p>
              </div>
              <div class="url-section">
                <el-input
                  v-model="authUrlData.auth_url"
                  readonly
                  type="textarea"
                  :rows="3"
                  class="auth-url-input"
                />
                <div class="url-actions" style="margin-top: 10px;">
                  <el-button type="primary" @click="copyAuthUrl">复制链接</el-button>
                  <el-button @click="openAuthUrl">打开链接</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="H5端授权" name="h5">
            <div class="auth-content">
              <div class="qr-code-section">
                <div id="auth-h5-qrcode" style="text-align: center; margin: 20px 0;"></div>
                <p class="text-center text-gray">使用微信扫描上方二维码进行H5授权</p>
              </div>
              <div class="url-section">
                <el-input
                  v-model="authUrlData.h5_auth_url"
                  readonly
                  type="textarea"
                  :rows="3"
                  class="auth-url-input"
                />
                <div class="url-actions" style="margin-top: 10px;">
                  <el-button type="primary" @click="copyH5AuthUrl">复制H5链接</el-button>
                  <el-button @click="openH5AuthUrl">打开H5链接</el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        
        <el-alert 
          title="授权完成后，请刷新页面查看授权结果"
          type="warning"
          :closable="false"
          style="margin-top: 20px;"
        />
      </div>
    </el-dialog>

    <!-- 权限详情对话框 -->
    <el-dialog
      v-model="permissionsDialogVisible"
      :title="`${currentPermissionsAccount?.name || '公众号'} - 权限详情`"
      width="600px"
      @close="closePermissionsDialog"
    >
      <div v-if="currentPermissionsAccount" class="permissions-container">
        <div class="account-info" style="margin-bottom: 20px;">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="公众号名称">
              {{ currentPermissionsAccount.name }}
            </el-descriptions-item>
            <el-descriptions-item label="AppID">
              {{ currentPermissionsAccount.app_id }}
            </el-descriptions-item>
            <el-descriptions-item label="授权类型">
              <el-tag type="info">第三方平台授权</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="权限数量">
              <el-tag type="success">{{ currentPermissions.length }} 项权限</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="permissions-list">
          <h4 style="margin-bottom: 15px; color: #409EFF;">
            <el-icon><Key /></el-icon>
            授权权限列表
          </h4>
          
          <div v-if="currentPermissions.length > 0" class="permission-grid">
            <div 
              v-for="permission in currentPermissions" 
              :key="permission.id"
              class="permission-item"
            >
              <el-tag type="success" size="small" class="permission-tag">
                <el-icon><Check /></el-icon>
                {{ permission.name }}
              </el-tag>
            </div>
          </div>
          
          <el-empty 
            v-else 
            description="暂无权限信息"
            :image-size="100"
          />
        </div>

        <div class="permission-tips" style="margin-top: 20px;">
          <el-alert
            title="权限说明"
            type="info"
            :closable="false"
          >
            <template #default>
              <p style="margin: 0 0 10px 0;">此权限集是公众号在授权时勾选的权限项目。</p>
              <p style="margin: 0;">如需修改权限，请重新进行公众号授权并勾选相应权限。</p>
            </template>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closePermissionsDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, 
  View, 
  Hide, 
  Grid, 
  Phone, 
  Check, 
  Tools, 
  User,
  Edit,
  Close,
  Lock,
  Switch,
  SwitchButton,
  Refresh,
  Key
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
// QRCode库引用
let QRCode = null

// 动态加载QRCode库
const loadQRCode = async () => {
  return new Promise(async (resolve) => {
    try {
      // 方法1：尝试动态import
      try {
        const QRCodeModule = await import('qrcodejs2')
        QRCode = QRCodeModule.default || QRCodeModule
        if (typeof QRCode === 'function') {
          console.log('QRCode library loaded via dynamic import:', QRCode)
          resolve(true)
          return
        }
      } catch (e) {
        console.warn('Dynamic import failed:', e.message)
      }
      
      // 方法2：尝试从window对象获取（如果有CDN加载）
      if (window.QRCode && typeof window.QRCode === 'function') {
        QRCode = window.QRCode
        console.log('QRCode library loaded from window:', QRCode)
        resolve(true)
        return
      }
      
      // 方法3：尝试require方式（兼容性处理）
      if (typeof require !== 'undefined') {
        try {
          QRCode = require('qrcodejs2')
          if (typeof QRCode === 'function') {
            console.log('QRCode library loaded via require:', QRCode)
            resolve(true)
            return
          }
        } catch (e) {
          console.warn('Require import failed:', e.message)
        }
      }
      
      // 所有方法都失败
      console.warn('QRCode library not available through any method')
      resolve(false)
      
    } catch (error) {
      console.error('Error loading QRCode library:', error)
      resolve(false)
    }
  })
}
import { 
  getWechatThirdPartyPlatformConfig,
  generateWechatAuthUrl
} from '../../api/wechatThirdPartyPlatforms'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const qrCodeVisible = ref(false)
const authUrlDialogVisible = ref(false)
const currentAccount = ref(null)
const currentQrCode = ref('')
const isEdit = ref(false)
const formRef = ref()
const showSecrets = ref({})
const showDetailSecret = ref(false)
const thirdPartyPlatforms = ref([])
const authUrlData = ref({})
const authUrlActiveTab = ref('pc')
const generatingAuth = ref(false)
const currentPlatform = ref(null)
const checkingTicket = ref(false)
const ticketStatusInfo = ref(null)
const forceRefreshing = ref(false)

// AppSecret配置相关
const appSecretDialogVisible = ref(false)
const currentAppSecretAccount = ref(null)
const appSecretFormRef = ref()
const savingAppSecret = ref(false)
const appSecretForm = reactive({
  app_secret: ''
})

// 权限集相关
const accountPermissions = ref({}) // 存储各个公众号的权限信息
const loadingPermissions = ref({}) // 加载权限的状态
const permissionsDialogVisible = ref(false) // 权限详情对话框
const currentPermissionsAccount = ref(null) // 当前查看权限的账号
const currentPermissions = ref([]) // 当前权限列表

// 粉丝数更新相关
const updatingSubscriber = ref({}) // 单个公众号更新粉丝数的状态
const updatingAllSubscribers = ref(false) // 更新所有粉丝数的状态

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页信息
const pagination = reactive({
  current_page: 1,
  per_page: 15,
  total: 0
})

// 表单数据
const form = reactive({
  name: '',
  qr_code: '',
  status: 'active',
  description: '',
  third_party_platform_id: null, // 第三方平台ID
  authorized_account_id: null // 授权账号ID
})

// 表单验证规则
const formRules = computed(() => {
  return {
  name: [
    { required: true, message: '请输入公众号名称', trigger: 'blur' }
  ]
}
})

// AppSecret表单验证规则
const appSecretFormRules = computed(() => {
  return {
    app_secret: [
      { required: true, message: '请输入AppSecret', trigger: 'blur' },
      { min: 32, max: 32, message: 'AppSecret长度必须为32位', trigger: 'blur' }
    ]
  }
})

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑公众号' : '新增公众号'
})

const hasThirdPartyAccounts = computed(() => {
  return tableData.value.some(account => account.auth_type === 'third_party')
})

// 方法
const fetchData = async () => {
  loading.value = true
  try {
    console.log('开始获取微信公众号数据...')
    
    // 同时获取手动配置的公众号和第三方授权的公众号
    const [manualResponse, authorizedResponse] = await Promise.all([
      request.get('/api/admin/v1/wechat-accounts', { 
        params: {
          page: 1,
          per_page: 100 // 获取所有手动配置的公众号
          // 注意：不传递searchForm参数到API，在前端进行过滤
        }
      }),
      request.get('/api/admin/v1/wechat-third-party-platform/authorized-accounts')
    ])
    
    console.log('手动配置公众号API响应:', manualResponse)
    console.log('第三方授权公众号API响应:', authorizedResponse)
    
    let combinedData = []
    
    // 处理手动配置的公众号
    if (manualResponse.code === 0 && manualResponse.data && manualResponse.data.data) {
      const manualAccounts = manualResponse.data.data.map(account => ({
        id: account.id,
        name: account.name || '未命名公众号',
        app_id: account.app_id || '',
        app_secret: account.app_secret,
        token: account.token,
        qr_code: account.qr_code,
        status: account.status || 'active',
        auth_type: 'manual',
        created_at: account.created_at,
        authorized_at: account.created_at,
        service_type_info: null,
        verify_type_info: null,
        head_img: null,
        avatar: account.avatar || null,
        description: account.description || ''
      }))
      combinedData = [...combinedData, ...manualAccounts]
      console.log('手动配置公众号数据:', manualAccounts)
    }
    
    // 处理第三方授权的公众号
    if (authorizedResponse.code === 0 && authorizedResponse.data) {
      const authorizedAccounts = authorizedResponse.data.map(account => {
        return {
          id: `auth_${account.id}`, // 添加前缀避免ID冲突
          name: account.nick_name || '未命名公众号',
          app_id: account.authorizer_appid || '',
          app_secret: account.app_secret || null, // 从数据库读取配置的AppSecret
          token: null,
          qr_code: account.qrcode_url || null,
          status: 'active',
          auth_type: 'third_party',
          created_at: account.authorized_at,
          authorized_at: account.authorized_at,
          service_type_info: account.service_type_info,
          verify_type_info: account.verify_type_info,
          head_img: account.head_img,
          authorizer_id: account.id, // 保存原始ID用于操作
          subscriber_count: account.subscriber_count || 0, // 添加粉丝数字段
          subscriber_count_updated_at: account.subscriber_count_updated_at || null, // 添加更新时间字段
          description: account.description || ''
        }
      })
      combinedData = [...combinedData, ...authorizedAccounts]
      console.log('第三方授权公众号数据:', authorizedAccounts)
    }
    
    console.log('合并前的数据:', combinedData)
    
    // 应用搜索过滤
    if (searchForm.keyword && searchForm.keyword.trim()) {
      const keyword = searchForm.keyword.toLowerCase().trim()
      combinedData = combinedData.filter(account => {
        const nameMatch = account.name && account.name.toLowerCase().includes(keyword)
        const appIdMatch = account.app_id && account.app_id.toLowerCase().includes(keyword)
        return nameMatch || appIdMatch
      })
      console.log('关键词过滤后的数据:', combinedData, '关键词:', keyword)
    }
    
    if (searchForm.status && searchForm.status.trim()) {
      combinedData = combinedData.filter(account => account.status === searchForm.status)
      console.log('状态过滤后的数据:', combinedData, '状态:', searchForm.status)
    }
    
    // 手动分页
    const total = combinedData.length
    const start = (pagination.current_page - 1) * pagination.per_page
    const end = start + pagination.per_page
    const paginatedData = combinedData.slice(start, end)
    
    console.log('分页处理:', {
      total,
      current_page: pagination.current_page,
      per_page: pagination.per_page,
      start,
      end,
      paginatedData
    })
    
    // 使用nextTick确保数据更新
    await nextTick()
    
    tableData.value = paginatedData
    pagination.total = total
    
    console.log('最终设置的tableData:', tableData.value)
    console.log('最终设置的pagination.total:', pagination.total)
    
  } catch (error) {
    console.error('获取微信公众号列表失败:', error)
    ElMessage.error('获取数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const maskSecret = (secret) => {
  if (!secret) return ''
  if (secret.length <= 8) return '*'.repeat(secret.length)
  return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4)
}

// 格式化日期时间
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// 格式化粉丝数
const formatSubscriberCount = (count) => {
  // 处理null、undefined或0的情况
  if (count === null || count === undefined) return '0'
  if (count === 0) return '0'
  
  const num = parseInt(count)
  if (isNaN(num)) return '0'
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  
  return num.toString()
}

// 格式化更新时间
const formatUpdateTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return '刚刚更新'
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}天前`
    }
  } catch (error) {
    return dateString
  }
}

const toggleSecret = (id) => {
  showSecrets.value[id] = !showSecrets.value[id]
}

const showQrCode = (row) => {
  console.log('显示二维码:', row.name, row.qr_code, row.auth_type)
  
  if (!row.qr_code) {
    ElMessage.warning('该公众号没有二维码')
    return
  }
  
  // 使用代理API来避免微信防盗链问题
  const proxyUrl = `/admin/api/wechat/qrcode_proxy.php?url=${encodeURIComponent(row.qr_code)}`
  console.log('使用代理二维码URL:', proxyUrl)
  currentQrCode.value = proxyUrl
  qrCodeVisible.value = true
}

// 获取头像URL
const getAvatarSrc = (row) => {
  console.log('获取头像URL:', row.name, row.head_img, row.avatar, row.auth_type)
  
  // 第三方授权公众号直接使用微信头像URL（转换为HTTPS）
  if (row.auth_type === 'third_party' && row.head_img) {
    const httpsUrl = row.head_img.replace(/^http:\/\//, 'https://')
    console.log('第三方授权公众号使用HTTPS头像URL:', httpsUrl)
    return httpsUrl
  }
  
  // 手动配置的公众号可能有自定义头像字段
  if (row.avatar) {
    const httpsAvatar = row.avatar.replace(/^http:\/\//, 'https://')
    console.log('手动配置公众号使用HTTPS自定义头像:', httpsAvatar)
    return httpsAvatar
  }
  
  console.log('无头像URL，显示默认头像')
  return null
}

// 头像加载成功处理
const handleAvatarLoad = (e) => {
  console.log('头像加载成功:', e.target.src)
}

// 头像加载错误处理
const handleAvatarError = (e) => {
  console.log('头像加载失败:', e.target.src, e)
  // 错误时会显示默认的User图标
}

// 二维码加载错误处理
const handleQrCodeError = (e) => {
  console.log('二维码加载失败:', e.target.src, e)
  e.target.style.display = 'none'
  const parent = e.target.parentNode
  if (parent && !parent.querySelector('.qr-error-msg')) {
    const errorMsg = document.createElement('div')
    errorMsg.className = 'qr-error-msg'
    errorMsg.style.cssText = 'color: #999; font-size: 12px; text-align: center; padding: 20px;'
    errorMsg.textContent = '二维码加载失败'
    parent.appendChild(errorMsg)
  }
}

const handleSearch = () => {
  pagination.current_page = 1
  fetchData()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: ''
  })
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.per_page = size
  pagination.current_page = 1
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.current_page = page
  fetchData()
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const showEditDialog = (row) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    qr_code: row.qr_code,
    status: row.status,
    description: row.description,
    third_party_platform_id: row.third_party_platform_id,
    authorized_account_id: row.authorized_account_id
  })
}

const showDetail = (row) => {
  currentAccount.value = row
  showDetailSecret.value = false
  detailVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const url = isEdit.value 
      ? `/api/admin/v1/wechat-accounts/${form.id}`
      : '/api/admin/v1/wechat-accounts'
    
    const method = isEdit.value ? 'put' : 'post'
    const response = await axios[method](url, form)
    
    if (response.data.code === 0) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      console.error('提交失败:', error)
      ElMessage.error('操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const toggleStatus = async (row) => {
  try {
    const newStatus = row.status === 'active' ? 'inactive' : 'active'
    const response = await request.put(`/api/admin/v1/wechat-accounts/${row.id}/status`, {
      status: newStatus
    })
    
    if (response.code === 0) {
      ElMessage.success('状态更新成功')
      fetchData()
    } else {
      ElMessage.error(response.message || '状态更新失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('状态更新失败')
  }
}



const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    name: '',
    qr_code: '',
    subscriber_count: null,
    status: 'active',
    description: '',
    third_party_platform_id: null,
    authorized_account_id: null
  })
}

// AppSecret配置相关方法
const showAppSecretDialog = (row) => {
  currentAppSecretAccount.value = row
  appSecretForm.app_secret = row.app_secret || ''
  appSecretDialogVisible.value = true
}

const resetAppSecretForm = () => {
  if (appSecretFormRef.value) {
    appSecretFormRef.value.resetFields()
  }
  appSecretForm.app_secret = ''
  currentAppSecretAccount.value = null
}

const saveAppSecret = async () => {
  if (!appSecretFormRef.value || !currentAppSecretAccount.value) return
  
  try {
    await appSecretFormRef.value.validate()
    savingAppSecret.value = true
    
    const response = await request.put(
      `/api/admin/v1/wechat-third-party-platform/authorized-accounts/${currentAppSecretAccount.value.authorizer_id}/app-secret`,
      {
        app_secret: appSecretForm.app_secret
      }
    )
    
    if (response.code === 0) {
      ElMessage.success('AppSecret配置成功')
      appSecretDialogVisible.value = false
      fetchData() // 刷新列表
    } else {
      ElMessage.error(response.message || 'AppSecret配置失败')
    }
  } catch (error) {
    if (error.name !== 'ValidationError') {
      console.error('AppSecret配置失败:', error)
      ElMessage.error('AppSecret配置失败')
    }
  } finally {
    savingAppSecret.value = false
  }
}

// 权限集相关方法
const showPermissions = async (row) => {
  if (!row.app_id || row.auth_type !== 'third_party') {
    ElMessage.warning('只有第三方授权的公众号才能查看权限集')
    return
  }
  
  try {
    loadingPermissions.value[row.app_id] = true
    
    const response = await request.get(`/api/admin/v1/wechat-third-party-platform/account-permissions/${row.app_id}`)
    
    if (response.code === 0) {
      currentPermissionsAccount.value = row
      currentPermissions.value = response.data.permissions || []
      accountPermissions.value[row.app_id] = response.data
      permissionsDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取权限信息失败')
    }
  } catch (error) {
    console.error('获取权限信息失败:', error)
    ElMessage.error('获取权限信息失败')
  } finally {
    loadingPermissions.value[row.app_id] = false
  }
}

const closePermissionsDialog = () => {
  permissionsDialogVisible.value = false
  currentPermissionsAccount.value = null
  currentPermissions.value = []
}



// 第三方平台相关方法
const fetchThirdPartyPlatforms = async () => {
  try {
    // 使用新的单一配置API检查第三方平台配置
    const response = await getWechatThirdPartyPlatformConfig()
    if (response.code === 0 && response.data) {
      // 模拟旧的平台列表格式
      const platformData = {
        id: response.data.id,
        name: '点点够第三方平台',
        component_app_id: response.data.app_id,
        app_id: response.data.app_id, // 添加这个字段用于显示
        status: response.data.is_active ? 'active' : 'inactive'
      }
      
      thirdPartyPlatforms.value = [platformData]
      currentPlatform.value = platformData
      form.third_party_platform_id = platformData.id
    } else {
      // 没有配置或配置无效
      thirdPartyPlatforms.value = []
      currentPlatform.value = null
      form.third_party_platform_id = null
    }
  } catch (error) {
    console.error('获取第三方平台配置失败:', error)
    // 如果是404错误，说明还没有配置
    if (error.response?.status === 404) {
      thirdPartyPlatforms.value = []
      currentPlatform.value = null
      form.third_party_platform_id = null
    }
  }
}

const generateAuthUrl = async (type = 'pc') => {
  try {
    loading.value = true
    
    const response = await generateWechatAuthUrl(type)
    
    if (response.code === 0) {
      authUrlData.value = {
        auth_url: response.data.auth_url,
        h5_auth_url: response.data.auth_url, // 使用同一个URL
        type: response.data.type || type
      }
      authUrlDialogVisible.value = true
      authUrlActiveTab.value = type === 'h5' ? 'h5' : 'pc'
      
      // 等待对话框和DOM完全渲染后再生成二维码
      await nextTick()
      setTimeout(async () => {
        const url = response.data.auth_url
        if (url) {
          const qrElementId = type === 'h5' ? 'auth-h5-qrcode' : 'auth-qrcode'
          console.log('Attempting to generate QR code for element:', qrElementId)
          await generateQRCode(qrElementId, url)
        }
      }, 300) // 延迟300ms确保DOM完全渲染
      
      ElMessage.success('授权链接生成成功，请使用微信扫码或访问链接完成授权')
      
      // 显示票据状态信息（如果有）
      if (response.data.ticket_info) {
        const ticketInfo = response.data.ticket_info
        console.log('票据状态信息:', ticketInfo)
      }
      
    } else {
      // 处理详细的错误信息
      const errorData = response.data || {}
      const ticketInfo = errorData.ticket_info || {}
      const solutions = errorData.solution || []
      
      let errorMessage = response.message || '生成授权链接失败'
      
      // 根据不同类型的错误显示不同的处理建议
      if (ticketInfo.is_test_ticket) {
        errorMessage = '当前使用的是测试票据，微信官方不接受测试票据'
        
        ElMessageBox.alert(
          h('div', [
            h('p', { style: 'margin-bottom: 15px; font-weight: bold; color: #e6a23c;' }, '⚠️ 测试票据问题'),
            h('p', { style: 'margin-bottom: 10px;' }, `错误原因：${errorMessage}`),
            h('p', { style: 'margin-bottom: 10px;' }, `票据年龄：${ticketInfo.ticket_age_minutes || 0} 分钟`),
            h('p', { style: 'margin-bottom: 15px;' }, `最后更新：${ticketInfo.last_updated || '未知'}`),
            h('div', { style: 'margin-bottom: 10px; font-weight: bold;' }, '解决方案：'),
            h('ol', { style: 'margin: 0; padding-left: 20px;' }, 
              solutions.map(solution => h('li', { style: 'margin-bottom: 8px;' }, solution))
            ),
            h('p', { style: 'margin-top: 15px; color: #909399; font-size: 14px;' }, 
              '提示：微信通常每10分钟推送一次真实票据，请耐心等待。'
            )
          ]),
          '测试票据无效',
          {
            confirmButtonText: '我知道了',
            type: 'warning',
            dangerouslyUseHTMLString: false
          }
        )
      } else if (ticketInfo.likely_expired) {
        errorMessage = '验证票据可能已过期'
        
        ElMessageBox.alert(
          h('div', [
            h('p', { style: 'margin-bottom: 15px; font-weight: bold; color: #f56c6c;' }, '❌ 票据过期问题'),
            h('p', { style: 'margin-bottom: 10px;' }, `错误原因：${errorMessage}`),
            h('p', { style: 'margin-bottom: 10px;' }, `票据年龄：${ticketInfo.ticket_age_minutes || 0} 分钟`),
            h('p', { style: 'margin-bottom: 15px;' }, `最后更新：${ticketInfo.last_updated || '未知'}`),
            h('div', { style: 'margin-bottom: 10px; font-weight: bold;' }, '解决方案：'),
            h('ol', { style: 'margin: 0; padding-left: 20px;' }, 
              solutions.map(solution => h('li', { style: 'margin-bottom: 8px;' }, solution))
            ),
            h('p', { style: 'margin-top: 15px; color: #909399; font-size: 14px;' }, 
              '提示：请等待5-10分钟，微信会自动推送新的验证票据。'
            )
          ]),
          '验证票据过期',
          {
            confirmButtonText: '我知道了',
            type: 'error',
            dangerouslyUseHTMLString: false
          }
        )
      } else {
        // 通用错误处理
        const detailMessage = errorData.error_detail || '请检查配置和网络连接'
        
        ElMessageBox.alert(
          h('div', [
            h('p', { style: 'margin-bottom: 15px; font-weight: bold; color: #f56c6c;' }, '❌ 生成授权链接失败'),
            h('p', { style: 'margin-bottom: 10px;' }, `错误原因：${errorMessage}`),
            h('p', { style: 'margin-bottom: 15px;' }, `详细信息：${detailMessage}`),
            ...(solutions.length > 0 ? [
              h('div', { style: 'margin-bottom: 10px; font-weight: bold;' }, '建议：'),
              h('ul', { style: 'margin: 0; padding-left: 20px;' }, 
                solutions.map(solution => h('li', { style: 'margin-bottom: 8px;' }, solution))
              )
            ] : []),
            h('p', { style: 'margin-top: 15px; color: #909399; font-size: 14px;' }, 
              '如果问题持续存在，请联系技术支持。'
            )
          ]),
          '授权链接生成失败',
          {
            confirmButtonText: '我知道了',
            type: 'error',
            dangerouslyUseHTMLString: false
          }
        )
      }
      
      ElMessage.error(errorMessage)
    }
  } catch (error) {
    console.error('生成授权链接失败:', error)
    ElMessage.error('生成授权链接失败: ' + (error.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

const generateQRCode = async (elementId, url) => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.warn(`Element with id ${elementId} not found`)
      return
    }

    console.log('Generating QR code for:', url)
    console.log('QRCode library:', QRCode)
    console.log('QRCode type:', typeof QRCode)
    
    if (QRCode && typeof QRCode === 'function') {
      element.innerHTML = ''
      try {
        const qrcode = new QRCode(element, {
          text: url,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 2
        })
        console.log('QR code generated successfully:', qrcode)
      } catch (qrError) {
        console.error('QRCode constructor error:', qrError)
        // 尝试使用更简单的配置
        try {
          element.innerHTML = ''
          const qrcode = new QRCode(element, url)
          console.log('QR code generated with simple config:', qrcode)
        } catch (simpleError) {
          console.error('Simple QRCode generation failed:', simpleError)
          showQRCodeFallback(element, url, '二维码生成失败')
        }
      }
    } else {
      console.warn('QRCode library not available or not a function')
      showQRCodeFallback(element, url, '二维码库未加载')
    }
  } catch (error) {
    console.error('生成二维码失败:', error)
    const element = document.getElementById(elementId)
    if (element) {
      showQRCodeFallback(element, url, '二维码生成错误')
    }
  }
}

// 显示二维码生成失败时的备用界面
const showQRCodeFallback = (element, url, title) => {
  const colorMap = {
    '二维码库未加载': { border: '#E6A23C', bg: '#fdf6ec', color: '#E6A23C' },
    '二维码生成失败': { border: '#409EFF', bg: '#f0f9ff', color: '#409EFF' },
    '二维码生成错误': { border: '#F56C6C', bg: '#fef0f0', color: '#F56C6C' }
  }
  
  const colors = colorMap[title] || colorMap['二维码生成错误']
  
  element.innerHTML = `
    <div style="padding: 20px; text-align: center; border: 1px dashed ${colors.border}; border-radius: 4px; background: ${colors.bg};">
      <p style="margin: 0 0 10px 0; color: ${colors.color}; font-weight: bold;">${title}</p>
      <p style="margin: 0 0 10px 0; color: #666;">请复制下方链接手动访问：</p>
      <div style="word-break: break-all; font-size: 12px; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #ddd; cursor: pointer;" onclick="navigator.clipboard.writeText('${url}').then(() => alert('链接已复制到剪贴板')).catch(() => alert('复制失败，请手动复制'))">${url}</div>
      <p style="margin: 10px 0 0 0; color: #999; font-size: 11px;">点击链接可复制到剪贴板</p>
    </div>
  `
}

const copyAuthUrl = async () => {
  try {
    await navigator.clipboard.writeText(authUrlData.value.auth_url)
    ElMessage.success('授权链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const copyH5AuthUrl = async () => {
  try {
    await navigator.clipboard.writeText(authUrlData.value.h5_auth_url)
    ElMessage.success('H5授权链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

const openAuthUrl = () => {
  window.open(authUrlData.value.auth_url, '_blank')
}

const openH5AuthUrl = () => {
  window.open(authUrlData.value.h5_auth_url, '_blank')
}

// 监听标签页切换，重新生成二维码
const onTabChange = async (tabName) => {
  if (authUrlData.value.auth_url) {
    await nextTick()
    setTimeout(async () => {
      const qrElementId = tabName === 'h5' ? 'auth-h5-qrcode' : 'auth-qrcode'
      const url = authUrlData.value.auth_url
      console.log('Tab changed to:', tabName, 'generating QR for:', qrElementId)
      await generateQRCode(qrElementId, url)
    }, 100)
  }
}

// 检查票据状态
const checkTicketStatus = async () => {
  checkingTicket.value = true
  try {
    const response = await request.get('/api/admin/v1/wechat-third-party-platform/check-ticket-status')
    
    if (response.data.code === 0) {
      ticketStatusInfo.value = response.data.data
      
      if (ticketStatusInfo.value.status === 'good') {
        ElMessage.success('验证票据状态正常')
      } else {
        ElMessage.warning('验证票据可能存在问题，请查看详细信息')
        
        // 显示详细建议
        const suggestions = ticketStatusInfo.value.suggestions.join('\n')
        ElMessageBox.alert(
          `票据状态检查结果：\n\n${suggestions}`,
          '票据状态详情',
          {
            confirmButtonText: '我知道了',
            type: 'warning'
          }
        )
      }
    } else {
      ElMessage.error(response.data.message || '检查票据状态失败')
    }
  } catch (error) {
    console.error('检查票据状态失败:', error)
    ElMessage.error('检查票据状态失败')
  } finally {
    checkingTicket.value = false
  }
}

// 紧急修复并重试生成授权链接
const forceRefreshAndRetry = async () => {
  forceRefreshing.value = true
  try {
    // 先显示确认对话框
    await ElMessageBox.confirm(
      '此功能将强制刷新微信验证票据并立即尝试生成授权链接。\n\n' +
      '注意：这是临时解决方案，适用于紧急情况。\n' +
      '生产环境建议等待微信自动推送真实票据。\n\n' +
      '是否继续？',
      '紧急修复确认',
      {
        confirmButtonText: '确认修复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 第一步：强制刷新票据
    ElMessage.info('正在强制刷新验证票据...')
    const refreshResponse = await request.post('/api/admin/v1/wechat-third-party-platform/force-refresh-component-access-token')
    
    if (refreshResponse.data.code === 0) {
      ElMessage.success('票据刷新成功，正在生成授权链接...')
      
      // 等待1秒让票据生效
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 第二步：尝试生成授权链接
      const authResponse = await generateWechatAuthUrl('pc')
      
      if (authResponse.code === 0) {
        authUrlData.value = {
          auth_url: authResponse.data.auth_url,
          h5_auth_url: authResponse.data.auth_url,
          type: authResponse.data.type || 'pc'
        }
        authUrlDialogVisible.value = true
        authUrlActiveTab.value = 'pc'
        
        // 生成二维码
        await nextTick()
        setTimeout(async () => {
          if (authResponse.data.auth_url) {
            await generateQRCode('auth-qrcode', authResponse.data.auth_url)
          }
        }, 300)
        
        ElMessage.success('紧急修复成功！授权链接已生成')
      } else {
        throw new Error(authResponse.message || '生成授权链接仍然失败')
      }
    } else {
      throw new Error(refreshResponse.data.message || '票据刷新失败')
    }
    
  } catch (error) {
    console.error('紧急修复失败:', error)
    
    let errorMessage = '紧急修复失败'
    if (error.message && !error.message.includes('用户取消')) {
      errorMessage += '：' + error.message
    }
    
    if (!error.message || !error.message.includes('用户取消')) {
      ElMessageBox.alert(
        '紧急修复失败，可能的原因：\n\n' +
        '1. 微信第三方平台配置有误\n' +
        '2. 网络连接问题\n' +
        '3. 微信API服务异常\n\n' +
        '建议：\n' +
        '• 检查第三方平台配置\n' +
        '• 等待微信自动推送真实票据\n' +
        '• 联系技术支持',
        '修复失败',
        {
          confirmButtonText: '我知道了',
          type: 'error'
        }
      )
    }
  } finally {
    forceRefreshing.value = false
  }
}

// 更新单个公众号粉丝数
const updateSingleSubscriberCount = async (account) => {
  if (!account.app_id || account.auth_type !== 'third_party') {
    ElMessage.warning('只能更新第三方授权的公众号粉丝数')
    return
  }
  
  updatingSubscriber.value[account.app_id] = true
  
  try {
    const response = await request.post('/api/admin/v1/wechat-third-party-platform/update-subscriber-counts', {
      app_id: account.app_id // 只更新指定的公众号
    })
    
    if (response.code === 0) {
      ElMessage.success('粉丝数更新成功')
      // 更新表格中的数据
      const index = tableData.value.findIndex(item => item.app_id === account.app_id)
      if (index !== -1 && response.data && response.data.results) {
        const result = response.data.results.find(r => r.app_id === account.app_id)
        if (result) {
          tableData.value[index].subscriber_count = result.subscriber_count
          tableData.value[index].subscriber_count_updated_at = new Date().toISOString()
        }
      }
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新粉丝数失败:', error)
    ElMessage.error('更新失败: ' + (error.message || '网络错误'))
  } finally {
    updatingSubscriber.value[account.app_id] = false
  }
}

// 更新所有公众号粉丝数
const updateAllSubscriberCounts = async () => {
  updatingAllSubscribers.value = true
  
  try {
    const response = await request.post('/api/admin/v1/wechat-third-party-platform/update-subscriber-counts')
    
    if (response.code === 0) {
      ElMessage.success('所有粉丝数更新成功')
      // 刷新表格数据
      await fetchData()
    } else {
      ElMessage.error(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新所有粉丝数失败:', error)
    ElMessage.error('更新失败: ' + (error.message || '网络错误'))
  } finally {
    updatingAllSubscribers.value = false
  }
}

// 获取与app_users表的wechat_account_id对应的数据库ID
const getDatabaseId = (row) => {
  // 根据AppUser模型: app_users.wechat_account_id 指向 wechat_authorized_accounts 表的 id
  
  if (row.auth_type === 'third_party' && row.authorizer_id) {
    // 第三方授权公众号：显示 wechat_authorized_accounts 表的真实ID
    return row.authorizer_id
  }
  
  if (row.auth_type === 'manual') {
    // 手动配置公众号：不在 wechat_authorized_accounts 表中
    // 官方总部H5登录使用的是 ID=1 的默认记录（已创建）
    // 显示 "N/A" 表示不适用于app_users.wechat_account_id字段
    return 'N/A'
  }
  
  return row.id || '-'
}

// 生命周期
onMounted(async () => {
  await loadQRCode() // 先加载QRCode库
  fetchData()
  fetchThirdPartyPlatforms()
})
</script>

<style scoped>
.wechat-accounts {
  padding: 20px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 10px;
  margin-bottom: 20px;
  position: relative;
}

.page-header h1 {
  color: white;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  color: white;
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.header-actions {
  position: absolute;
  top: 30px;
  right: 30px;
}

.header-actions .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.header-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.search-filters {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.text-gray {
  color: #909399;
}

.detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.qr-code-container {
  text-align: center;
}

.dialog-footer {
  text-align: right;
}

/* 第三方平台授权相关样式 */
.auth-intro {
  margin-bottom: 20px;
}

.form-tip {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.auth-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.auth-actions .el-button {
  padding: 12px 24px;
  font-size: 14px;
  border-radius: 6px;
}

.auth-actions .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  border: none;
}

.auth-actions .el-button--success {
  background: linear-gradient(135deg, #67c23a 0%, #52c41a 100%);
  border: none;
}

.auth-url-container {
  padding: 10px 0;
}

.auth-content {
  padding: 20px 0;
}

.qr-code-section {
  text-align: center;
  margin-bottom: 20px;
}

.url-section {
  margin-top: 20px;
}

.auth-url-input {
  margin-bottom: 10px;
}

.url-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.text-center {
  text-align: center;
}

.text-green {
  color: #67c23a;
}

.platform-info {
  margin-bottom: 20px;
}

/* 公众号信息样式 */
.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.avatar-section {
  flex-shrink: 0;
}

.account-avatar {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
  border: 2px solid #f0f0f0;
  transition: all 0.3s ease;
}

.account-avatar:hover {
  border-color: #409eff;
  transform: scale(1.05);
}

.info-section {
  flex: 1;
  min-width: 0;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.account-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.auth-type-tag {
  flex-shrink: 0;
}

.appid-line {
  margin-bottom: 2px;
}

.app-id {
  font-size: 12px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

.desc-line {
  margin-top: 2px;
}

.description {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 配置信息样式 */
.config-info {
  padding: 8px 0;
}

.config-item {
  margin-bottom: 8px;
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 2px;
}

.secret-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.secret-text, .secret-masked {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #606266;
  word-break: break-all;
  line-height: 1.2;
}

.secret-toggle {
  padding: 2px 4px;
  margin-left: 4px;
}

.config-value {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #606266;
}

/* 状态信息样式 */
.status-info {
  padding: 8px 0;
}

.status-item {
  margin-bottom: 8px;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qrcode-item {
  margin-bottom: 8px;
}

.time-item {
  margin-top: 4px;
}

.create-time {
  font-size: 11px;
  color: #909399;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.action-buttons .el-button-group {
  display: flex;
  gap: 0;
}

.action-buttons .el-button {
  padding: 6px 8px;
  font-size: 12px;
}

.action-buttons .el-button:not(.el-button-group .el-button) {
  margin-top: 4px;
}

/* 粉丝数信息样式 */
.subscriber-info {
  text-align: center;
  padding: 8px 0;
}

.subscriber-count {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.subscriber-icon {
  color: #409eff;
  font-size: 14px;
}

.count-text {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.update-time {
  font-size: 11px;
  color: #909399;
}

.no-data {
  font-size: 11px;
  color: #c0c4cc;
}

/* 详情页面粉丝数样式 */
.subscriber-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subscriber-detail .el-tag {
  width: fit-content;
}

.subscriber-detail .update-info {
  margin-top: 4px;
}

/* 编号列样式 */
.row-number {
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
  background: linear-gradient(135deg, #409eff 0%, #1890ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  display: inline-block;
  min-width: 24px;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #f5f7fa;
  -webkit-text-fill-color: #409eff;
}

/* 权限信息样式 */
.permissions-info {
  text-align: center;
  padding: 8px 0;
}

.permission-count {
  margin-top: 4px;
}

.no-permissions {
  font-size: 11px;
  color: #c0c4cc;
}

/* 权限详情对话框样式 */
.permissions-container {
  padding: 10px 0;
}

.permission-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.permission-item {
  flex: 0 0 auto;
}

.permission-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式优化 */
@media (max-width: 1200px) {
  .account-name {
    max-width: 120px;
  }
  
  .description {
    max-width: 150px;
  }
  
  .permission-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
}
</style> 