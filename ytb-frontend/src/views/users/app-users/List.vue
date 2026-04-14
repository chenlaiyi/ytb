<template>
  <div class="app-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><User /></el-icon>
            APP用户管理
          </h1>
          <p class="page-description">管理和查看所有APP用户信息</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" size="large" @click="handleAddUser">
            <el-icon><Plus /></el-icon>
            添加用户
          </el-button>
          <el-button type="success" size="large" @click="handleSyncRoles">
            <el-icon><Refresh /></el-icon>
            同步角色数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 智能筛选卡片 -->
    <el-card class="filter-card" shadow="hover">
      <template #header>
        <div class="filter-header">
          <el-icon class="filter-icon"><Search /></el-icon>
          <span class="filter-title">智能筛选</span>
        </div>
      </template>
      <el-form :inline="true" :model="queryParams" class="filter-form">
        <el-form-item>
          <el-input 
            v-model="queryParams.keyword" 
            placeholder="搜索姓名/手机/邮箱/微信昵称" 
            clearable 
            style="width: 280px;"
            prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select 
            v-model="queryParams.role" 
            placeholder="选择角色" 
            clearable 
            style="width: 160px;"
          >
            <template #prefix>
              <el-icon><UserFilled /></el-icon>
            </template>
            <el-option label="支付机构" value="pay_institution">
              <el-tag type="success" size="small">支付机构</el-tag>
            </el-option>
            <el-option label="净水器用户" value="water_purifier_user">
              <el-tag type="warning" size="small">净水器用户</el-tag>
            </el-option>
            <el-option label="工程师" value="engineer">
              <el-tag type="info" size="small">工程师</el-tag>
            </el-option>
            <el-option label="净水器渠道商" value="water_purifier_agent">
              <el-tag type="danger" size="small">净水器渠道商</el-tag>
            </el-option>
            <el-option label="支付商户" value="pay_merchant">
              <el-tag type="primary" size="small">支付商户</el-tag>
            </el-option>
            <el-option label="VIP会员" value="vip">
              <el-tag type="success" size="small" effect="dark">VIP会员</el-tag>
            </el-option>
            <el-option label="业务员" value="sales">
              <el-tag type="warning" size="small" effect="dark">业务员</el-tag>
            </el-option>
            <el-option label="管理员" value="admin">
              <el-tag type="info" size="small">管理员</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select 
            v-model="queryParams.status" 
            placeholder="选择状态" 
            clearable 
            style="width: 120px;"
          >
            <template #prefix>
              <el-icon><CircleCheck /></el-icon>
            </template>
            <el-option label="正常" value="active">
              <el-tag type="success" size="small">正常</el-tag>
            </el-option>
            <el-option label="禁用" value="disabled">
              <el-tag type="danger" size="small">禁用</el-tag>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select 
            v-model="queryParams.branch_id" 
            placeholder="选择分支机构" 
            clearable 
            style="width: 180px;"
            @change="handleBranchChange"
          >
            <template #prefix>
              <el-icon><OfficeBuilding /></el-icon>
            </template>
            <el-option 
              v-for="branch in branchOptions" 
              :key="branch.id" 
              :label="branch.name" 
              :value="branch.id"
            >
              <el-tag :type="(branch.id == 3 || String(branch.id) === '3') ? 'primary' : 'warning'" size="small">{{ branch.code }}</el-tag>
              <span style="margin-left: 8px;">{{ branch.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery" :disabled="loading">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计仪表板 -->
    <div class="stats-dashboard">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card total-users" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ total }}</div>
                <div class="stats-label">总用户数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card vip-users" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ getVipCount() }}</div>
                <div class="stats-label">VIP总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card monthly-vip" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ getMonthlyVipCount() }}</div>
                <div class="stats-label">本月新增VIP</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card today-users" shadow="hover">
            <div class="stats-content">
              <div class="stats-icon">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-number">{{ getTodayCount() }}</div>
                <div class="stats-label">今日新增</div>
                <div class="stats-sub">昨日: {{ getYesterdayCount() }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        :key="tableKey"
        v-loading="loading"
        element-loading-text="加载中，请稍候..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="rgba(255, 255, 255, 0.8)"
        :data="userList"
        border
        stripe
        style="width: 100%;"
        :header-cell-style="{ background: '#f8f9fa', color: '#495057' }"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-content">
              <el-descriptions title="用户详细信息" :column="2" border>
                <el-descriptions-item label="用户ID">{{ props.row.id }}</el-descriptions-item>
                <el-descriptions-item label="姓名">{{ props.row.name }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ props.row.phone }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{ props.row.email }}</el-descriptions-item>
                <el-descriptions-item label="微信昵称">{{ props.row.wechat_nickname }}</el-descriptions-item>
                <el-descriptions-item label="微信头像">
                  <img
                    v-if="props.row.wechat_avatar"
                    :src="props.row.wechat_avatar"
                    referrerpolicy="no-referrer"
                    style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"
                  />
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item label="推荐人ID">{{ props.row.referrer_id === 0 ? 0 : (props.row.referrer_id || 0) }}</el-descriptions-item>
                <el-descriptions-item label="推荐人姓名">{{ props.row.referrer_id === 0 ? '点点够' : (props.row.referrer_name || '点点够') }}</el-descriptions-item>
                <el-descriptions-item label="注册时间">{{ props.row.created_at }}</el-descriptions-item>
                <el-descriptions-item label="最后登录">
                  <span v-if="props.row.last_login_time" class="last-login-detail">
                    {{ formatDate(props.row.last_login_time) }}
                    <small class="last-login-relative-detail">({{ getRelativeTime(props.row.last_login_time) }})</small>
                  </span>
                  <span v-else class="no-login-detail">从未登录</span>
                </el-descriptions-item>
                <el-descriptions-item label="状态">
                  <el-tag :type="props.row.status === 'active' ? 'success' : 'danger'">
                    {{ props.row.status === 'active' ? '正常' : '禁用' }}
                  </el-tag>
                </el-descriptions-item>

                <!-- 支付机构信息 -->
                <template v-if="props.row.is_pay_institution">
                  <el-descriptions-item label="机构名称" :span="2">
                    {{ props.row.institution_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="机构号">
                    {{ props.row.institution_number }}
                  </el-descriptions-item>
                  <el-descriptions-item label="新机构号">
                    {{ props.row.institution_xs_number }}
                  </el-descriptions-item>
                  <el-descriptions-item label="分润等级">
                    {{ props.row.institution_lv }}
                  </el-descriptions-item>
                  <el-descriptions-item label="机构类型">
                    {{ props.row.institution_core_type === 1 ? '普通机构' : props.row.institution_core_type === 2 ? '核心机构' : '-' }}
                  </el-descriptions-item>
                </template>

                <!-- 净水器用户信息 -->
                <template v-if="props.row.is_water_purifier_user">
                  <el-descriptions-item label="净水器设备ID" :span="2">
                    {{ props.row.purifier_client_device_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="净水器设备UUID" :span="2">
                    {{ props.row.purifier_client_device_id }}
                  </el-descriptions-item>
                </template>

                <!-- 工程师信息 -->
                <template v-if="props.row.is_engineer">
                  <el-descriptions-item label="工程师ID" :span="2">
                    {{ props.row.engineer_id }}
                  </el-descriptions-item>
                </template>

                <!-- VIP会员信息 -->
                <template v-if="props.row.is_vip">
                  <el-descriptions-item label="VIP会员开通时间" :span="1">
                    {{ props.row.vip_at || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="VIP付款状态" :span="1">
                    <el-tag type="success" v-if="props.row.is_vip_paid == 1">已完款</el-tag>
                    <el-tag type="warning" v-else>未完款</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="props.row.is_vip_paid == 1" label="VIP完款时间" :span="2">
                    {{ props.row.vip_paid_at || '-' }}
                  </el-descriptions-item>
                </template>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="id" label="ID" width="80" />
        
        <el-table-column label="用户信息" width="200">
          <template #default="scope">
            <div class="user-info">
              <el-avatar 
                :size="40" 
                :src="scope.row.display_avatar || scope.row.avatar || scope.row.wechat_avatar"
                style="margin-right: 10px;"
              >
                <img 
                  v-if="scope.row.display_avatar || scope.row.avatar || scope.row.wechat_avatar" 
                  :src="scope.row.display_avatar || scope.row.avatar || scope.row.wechat_avatar"
                  referrerpolicy="no-referrer"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <span v-else>{{ scope.row.name ? scope.row.name.substring(0, 1) : '?' }}</span>
              </el-avatar>
              <div class="user-details">
                <div class="user-name">
                  {{ scope.row.name || '未设置' }}
                </div>
                <div class="user-phone">{{ scope.row.phone || '无手机号' }}</div>
                <div class="user-nickname" v-if="(scope.row.avatar || scope.row.nickname || scope.row.last_login_at || scope.row.last_login_time) && scope.row.nickname">
                  <el-icon><User /></el-icon>
                  {{ scope.row.nickname }}
                </div>
                <div class="user-wechat" v-else-if="scope.row.wechat_nickname">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ scope.row.wechat_nickname }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="推荐人信息" width="150">
          <template #default="scope">
            <div class="referrer-info">
              <el-tag v-if="scope.row.referrer_id === 0" type="primary" size="small">
                系统推荐
              </el-tag>
              <div v-else-if="scope.row.referrer_id" class="referrer-details">
                <div class="referrer-id">ID: {{ scope.row.referrer_id }}</div>
                <div class="referrer-name">{{ scope.row.referrer_name || '未知' }}</div>
              </div>
              <el-tag v-else type="primary" size="small">
                系统推荐
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="角色标签" width="200">
          <template #default="scope">
            <div class="role-tags">
              <div v-for="(role, index) in scope.row.role_names" :key="index" class="role-tag-item">
                <el-tag v-if="role === '支付机构'" type="success" size="small">{{ role }}</el-tag>
                <el-tag v-else-if="role === '净水器用户'" type="warning" size="small">{{ role }}</el-tag>
                <el-tag v-else-if="role === '工程师'" type="info" size="small">{{ role }}</el-tag>
                <el-tag v-else-if="role === '净水器渠道商'" type="danger" size="small">{{ role }}</el-tag>
                <el-tag v-else-if="role === '支付商户'" type="primary" size="small">{{ role }}</el-tag>
                <el-tag v-else-if="role === 'VIP会员'" type="success" size="small" effect="dark">
                  {{ role }}
                  <span v-if="scope.row.is_vip_paid == 1" class="vip-status">
                    (已完款)
                  </span>
                  <span v-else class="vip-status">
                    (未完款)
                  </span>
                </el-tag>
                <el-tag v-else-if="role === '业务员'" type="warning" size="small" effect="dark">{{ role }}</el-tag>
                <el-tag v-else type="info" size="small">{{ role }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="分支机构" width="120">
          <template #default="scope">
            <div class="branch-info">
              <el-tag 
                v-if="scope.row.branch && scope.row.branch.name" 
                :type="scope.row.branch.id == 3 ? 'primary' : 'warning'" 
                size="small"
                effect="dark"
              >
                {{ scope.row.branch.name }}
              </el-tag>
              <el-tag 
                v-else-if="scope.row.branch_id == 3" 
                type="primary" 
                size="small"
                effect="dark"
              >
                点点够
              </el-tag>
              <el-tag 
                v-else-if="scope.row.branch_id && scope.row.branch_id != 3" 
                type="warning" 
                size="small"
                effect="dark"
              >
                {{ getBranchNameById(scope.row.branch_id) }}
              </el-tag>
              <el-tag 
                v-else 
                type="info" 
                size="small"
                effect="plain"
              >
                未分配
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="时间信息" width="200">
          <template #default="scope">
            <div class="time-info">
              <div class="register-time">
                <el-icon><Calendar /></el-icon>
                <span class="time-label">注册:</span>
                <span class="time-value">{{ formatDate(scope.row.created_at) }}</span>
                <small class="relative-time">{{ getRelativeTime(scope.row.created_at) }}</small>
              </div>
              <div class="login-time" v-if="scope.row.last_login_time || scope.row.last_login_at">
                <el-icon><Clock /></el-icon>
                <span class="time-label">登录:</span>
                <span class="time-value last-login">{{ formatDate(scope.row.last_login_time || scope.row.last_login_at) }}</span>
                <small class="relative-time last-login-relative">{{ getRelativeTime(scope.row.last_login_time || scope.row.last_login_at) }}</small>
              </div>
              <div class="no-login-time" v-else>
                <el-icon><Clock /></el-icon>
                <span class="time-label">登录:</span>
                <span class="no-login-text">从未登录</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="scope">
            <div class="action-buttons">
              <el-tooltip content="编辑用户" placement="top">
                <el-button 
                  type="primary" 
                  :icon="Edit" 
                  circle 
                  size="small"
                  @click="handleEdit(scope.row)"
                />
              </el-tooltip>
              <el-tooltip :content="scope.row.status === 'active' ? '禁用用户' : '启用用户'" placement="top">
                <el-button 
                  :type="scope.row.status === 'active' ? 'danger' : 'success'"
                  :icon="scope.row.status === 'active' ? Lock : Unlock"
                  circle 
                  size="small"
                  @click="handleStatusChange(scope.row)"
                />
              </el-tooltip>
              <el-tooltip content="同步角色" placement="top">
                <el-button 
                  type="warning" 
                  :icon="Refresh" 
                  circle 
                  size="small"
                  @click="handleSyncUserRole(scope.row)"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="queryParams.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.per_page"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="800px" append-to-body>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基本信息" name="basic">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="form.name" placeholder="请输入姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="form.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="登录名" prop="email">
                  <el-input v-model="form.email" placeholder="默认为手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="密码" prop="password">
                  <el-input v-model="form.password" type="password" placeholder="默认为123456，不修改请留空" show-password />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="性别" prop="gender">
                  <el-select v-model="form.gender" placeholder="请选择性别">
                    <el-option label="男" :value="1" />
                    <el-option label="女" :value="2" />
                    <el-option label="未知" :value="0" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="生日" prop="birthday">
                  <el-date-picker
                    v-model="form.birthday"
                    type="date"
                    placeholder="请选择生日"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    popper-class="date-picker-higher-z-index" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="form.status" placeholder="请选择状态">
                    <el-option label="正常" value="active" />
                    <el-option label="禁用" value="disabled" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="推荐人" prop="referrer_id">
                  <el-select
                    v-model="form.referrer_id"
                    filterable
                    remote
                    placeholder="请选择推荐人 (可输入ID或名称搜索)"
                    :remote-method="searchUsers"
                    :loading="userSelectLoading"
                    clearable
                    @focus="handleReferrerFocus"
                    @change="handleReferrerChange"
                    popper-class="select-dropdown-higher-z-index referrer-select-dropdown"
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="item in userOptions"
                      :key="item.id"
                      :label="`ID:${item.id} - ${item.name || item.wechat_nickname || '未知用户'} ${item.phone ? `(${item.phone})` : ''}`"
                      :value="item.id"
                    >
                      <div class="referrer-option-container">
                        <div class="referrer-avatar">
                          <el-image
                            v-if="item.wechat_avatar"
                            :src="item.wechat_avatar"
                            style="width: 34px; height: 34px; border-radius: 50%;"
                            fit="cover">
                          </el-image>
                          <div v-else class="referrer-default-avatar" :style="{ '--avatar-color': item.id === 0 ? '#409EFF' : getAvatarColor(item.id) }">
                            <span>{{ item.name ? item.name.substring(0, 1) : (item.id === 0 ? '系' : '?') }}</span>
                          </div>
                        </div>
                        <div class="referrer-info">
                          <div class="referrer-name-row">
                            <strong class="referrer-id">ID: {{ item.id }}</strong>
                            <span class="referrer-name">{{ item.name || item.wechat_nickname || '未知用户' }}</span>
                            <div class="referrer-tags">
                              <el-tag v-if="item.id === form.id" size="mini" type="danger">当前</el-tag>
                              <el-tag v-if="item.id === 0" size="mini" type="primary">系统</el-tag>
                              <el-tag v-if="item.is_vip" size="mini" type="success" effect="dark">VIP</el-tag>
                              <el-tag v-if="item.is_vip_paid == 1" size="mini" type="warning">已完款</el-tag>
                            </div>
                          </div>
                          <div class="referrer-contact">
                            <span v-if="item.phone" class="referrer-phone">{{ item.phone }}</span>
                            <span v-else class="referrer-no-phone">无手机号</span>
                            <span v-if="item.wechat_nickname" class="referrer-wechat"><i class="el-icon-chat-dot-round"></i> {{ item.wechat_nickname }}</span>
                          </div>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  <div v-if="form.referrer_name && (form.referrer_id || form.referrer_id === 0)" class="current-referrer">
                    <span>当前推荐人:</span>
                    <strong>{{ form.referrer_name }}</strong>
                    <span class="referrer-id-badge">ID: {{ form.referrer_id }}</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="微信信息" name="wechat">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="微信昵称" prop="wechat_nickname">
                  <el-input v-model="form.wechat_nickname" placeholder="微信昵称" readonly />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="微信性别" prop="wechat_gender">
                  <el-select v-model="form.wechat_gender" placeholder="微信性别" disabled>
                    <el-option label="男" value="1" />
                    <el-option label="女" value="2" />
                    <el-option label="未知" value="0" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="微信国家" prop="wechat_country">
                  <el-input v-model="form.wechat_country" placeholder="微信国家" readonly />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="微信省份" prop="wechat_province">
                  <el-input v-model="form.wechat_province" placeholder="微信省份" readonly />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="微信城市" prop="wechat_city">
                  <el-input v-model="form.wechat_city" placeholder="微信城市" readonly />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="24">
                <el-form-item label="微信头像" prop="wechat_avatar">
                  <div style="display: flex; align-items: center;">
                    <el-image
                      v-if="form.wechat_avatar"
                      :src="form.wechat_avatar"
                      style="width: 80px; height: 80px; border-radius: 50%;"
                      fit="cover">
                    </el-image>
                    <span v-else style="color: #999;">无头像</span>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="角色信息" name="roles">
            <el-row>
              <el-col :span="24">
                <el-form-item label="用户角色">
                  <el-checkbox-group v-model="form.roles">
                    <el-checkbox label="pay_institution">支付机构</el-checkbox>
                    <el-checkbox label="water_purifier_user">净水器用户</el-checkbox>
                    <el-checkbox label="engineer">工程师</el-checkbox>
                    <el-checkbox label="water_purifier_agent">净水器渠道商</el-checkbox>
                    <el-checkbox label="pay_merchant">支付商户</el-checkbox>
                    <el-checkbox label="vip">VIP会员</el-checkbox>
                    <el-checkbox label="salesman">业务员</el-checkbox>
                    <el-checkbox label="admin">管理员</el-checkbox>
                    <el-checkbox label="ytb_alliance_member" @change="handleAllianceChange">联盟CP</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 联盟CP等级选择（仅当选择联盟CP时显示） -->
            <el-row v-if="form.roles.includes('ytb_alliance_member')">
              <el-col :span="12">
                <el-form-item label="联盟CP等级" prop="alliance_cp_level">
                  <el-select v-model="form.alliance_cp_level" placeholder="请选择联盟CP等级" style="width: 100%;">
                    <el-option label="CP" value="cp" />
                    <el-option label="VIP CP" value="vip_cp" />
                    <el-option label="企业CP" value="enterprise_cp" />
                    <el-option label="企业VIP CP" value="enterprise_vip_cp" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 支付机构信息 -->
            <template v-if="form.roles.includes('pay_institution')">
              <el-divider content-position="left">支付机构信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="机构名称" prop="institution_name">
                    <el-input v-model="form.institution_name" placeholder="请输入机构名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="机构号" prop="institution_number">
                    <el-input v-model="form.institution_number" placeholder="请输入机构号" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="新机构号" prop="institution_xs_number">
                    <el-input v-model="form.institution_xs_number" placeholder="请输入新机构号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="分润等级" prop="institution_lv">
                    <el-input v-model="form.institution_lv" placeholder="请输入分润等级" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="机构类型" prop="institution_core_type">
                    <el-select v-model="form.institution_core_type" placeholder="请选择机构类型">
                      <el-option label="普通机构" :value="1" />
                      <el-option label="核心机构" :value="2" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="身份证号" prop="institution_sfz">
                    <el-input v-model="form.institution_sfz" placeholder="请输入身份证号" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="银行账户" prop="institution_account">
                    <el-input v-model="form.institution_account" placeholder="请输入银行账户" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="开户名" prop="institution_card_name">
                    <el-input v-model="form.institution_card_name" placeholder="请输入开户名" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="卡号" prop="institution_card_number">
                    <el-input v-model="form.institution_card_number" placeholder="请输入卡号" />
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <!-- 净水器用户信息 -->
            <template v-if="form.roles.includes('water_purifier_user')">
              <el-divider content-position="left">净水器用户信息</el-divider>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="设备列表">
                    <div v-if="userDevicesLoading" class="device-loading">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>加载设备中...</span>
                    </div>
                    <div v-else>
                      <div v-if="userDevices.length === 0" class="device-empty">
                        <el-empty description="暂无绑定设备" />
                        <div class="device-actions">
                          <el-button type="primary" size="small" @click="handleAddDevice">添加设备</el-button>
                        </div>
                      </div>
                      <div v-else class="device-list">
                        <div class="device-stats">
                          <span class="device-count">
                            共 {{ userDevices.length }} 台设备
                            <el-tag v-if="userDevices.length > 1" type="warning" size="small" effect="plain" style="margin-left: 5px;">多设备</el-tag>
                          </span>
                        </div>
                        <el-table :data="userDevices" border style="width: 100%">
                          <el-table-column prop="id" label="ID" width="70">
                            <template #default="scope">
                              <span v-if="scope.row.id > 0">{{ scope.row.id }}</span>
                              <el-tag v-else type="info" size="small">主表</el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="device_name" label="设备编号" min-width="140">
                            <template #default="scope">
                              <div class="device-name-cell">
                                {{ scope.row.device_name || '未命名设备' }}
                                <el-tag v-if="scope.row.is_multi_device" type="warning" size="small" effect="plain" style="margin-left: 5px;">多设备</el-tag>
                              </div>
                            </template>
                          </el-table-column>
                          <el-table-column prop="device_id" label="设备ID" min-width="180" />
                          <el-table-column prop="status" label="状态" width="80">
                            <template #default="scope">
                              <el-tag
                                :type="scope.row.status === 'active' ? 'success' : 'danger'"
                              >
                                {{ scope.row.status === 'active' ? '正常' : '禁用' }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="source" label="来源" width="100">
                            <template #default="scope">
                              <el-tag size="small" :type="scope.row.source === 'app_users_table' ? 'info' : 'primary'">
                                {{ scope.row.source === 'app_users_table' ? '主表' : '设备表' }}
                              </el-tag>
                            </template>
                          </el-table-column>
                          <el-table-column prop="bind_time" label="绑定时间" width="160" />
                          <el-table-column label="操作" width="200">
                            <template #default="scope">
                              <div class="operation-buttons">
                                <el-button
                                  size="small"
                                  type="primary"
                                  :disabled="form.purifier_client_device_id === scope.row.device_id"
                                  @click="handleSetMainDevice(scope.row)"
                                >设为主设备</el-button>
                                <el-button
                                  size="small"
                                  type="danger"
                                  @click="handleRemoveDevice(scope.row)"
                                >解绑</el-button>
                              </div>
                            </template>
                          </el-table-column>
                        </el-table>
                        <div class="device-actions">
                          <el-button type="primary" size="small" @click="handleAddDevice">添加设备</el-button>
                        </div>
                      </div>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <!-- 工程师信息 -->
            <template v-if="form.roles.includes('engineer')">
              <el-divider content-position="left">工程师信息</el-divider>
              <el-row>
                <el-col :span="24">
                  <el-form-item label="工程师ID" prop="engineer_id">
                    <el-input v-model="form.engineer_id" placeholder="请输入工程师ID" />
                  </el-form-item>
                </el-col>
              </el-row>
            </template>

            <!-- VIP会员信息 -->
            <template v-if="form.roles.includes('vip')">
              <el-divider content-position="left">VIP会员信息</el-divider>
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="VIP开通时间" prop="vip_at">
                    <el-date-picker
                      v-model="form.vip_at"
                      type="datetime"
                      placeholder="选择VIP开通时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="VIP付款状态" prop="is_vip_paid">
                    <el-select v-model="form.is_vip_paid" placeholder="请选择付款状态">
                      <el-option :label="'未完款'" :value="0" />
                      <el-option :label="'已完款'" :value="1" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="20" v-if="form.is_vip_paid == 1">
                <el-col :span="12">
                  <el-form-item label="VIP完款时间" prop="vip_paid_at">
                    <el-date-picker
                      v-model="form.vip_paid_at"
                      type="datetime"
                      placeholder="选择VIP完款时间"
                      format="YYYY-MM-DD HH:mm:ss"
                      value-format="YYYY-MM-DD HH:mm:ss"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </template>
          </el-tab-pane>

          <el-tab-pane label="登录信息" name="login">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="最后登录时间">
                  <el-input v-model="form.last_login_time" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最后登录IP">
                  <el-input v-model="form.last_login_ip" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="最后活动时间">
                  <el-input v-model="form.last_active_time" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="24">
                <el-form-item label="注册时间">
                  <el-input v-model="form.created_at" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 同步进度对话框 -->
    <el-dialog title="同步用户角色数据" v-model="syncDialogVisible" width="500px">
      <div class="sync-progress">
        <p>正在同步用户角色数据，请稍候...</p>
        <el-progress :percentage="syncProgress" :format="syncProgressFormat" />
        <p v-if="syncStatus">{{ syncStatus }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="syncDialogVisible = false" :disabled="syncing">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加设备对话框 -->
    <el-dialog title="添加设备" v-model="showAddDeviceDialog" width="500px">
      <el-form :model="newDevice" :rules="rules" ref="newDeviceFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备ID" prop="deviceId">
              <el-input v-model="newDevice.deviceId" placeholder="请输入设备ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编号" prop="deviceName">
              <el-input v-model="newDevice.deviceName" placeholder="请输入设备编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="newDevice.remark" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDeviceDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmAddDevice">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus';
import { 
  User, Plus, Refresh, Search, UserFilled, CircleCheck, RefreshLeft, 
  Calendar, ChatDotRound, Clock, Edit, Lock, Unlock, Loading, OfficeBuilding, TrendCharts 
} from '@element-plus/icons-vue';
import { getUsers, getUserDetail, createUser, updateUser, deleteUser, syncAllUserRoles, syncUserRoles, getUserDevices, addUserDevice, removeUserDevice, resetUserPassword, updateUserStatus, getUserStatistics } from '@/api/v1/appUser';
import { getBranchOrganizationOptions } from '@/api/branchOrganization';
import { getAdminToken } from '@/utils/admin-token-bridge'

export default {
  name: 'AppUsersList',
  setup() {
    // 表格数据
    const loading = ref(false);
    const userList = ref([]);
    const total = ref(0);
    const tableKey = ref(0); // 用于强制刷新表格

    // 推荐人选择相关
    const userSelectLoading = ref(false);
    const userOptions = ref([]);

    // 日期范围
    const dateRange = ref([]);

    // 查询参数
    const queryParams = reactive({
      page: 1,
      per_page: 10,
      keyword: '',
      role: '',
      status: '',
      branch_id: '', // 分支机构ID - 空值时后端默认显示branch_id=3(点点够)用户
      date_start: '',
      date_end: ''
    });

    // 分支机构选项
    const branchOptions = ref([]);

    // 统计数据
    const statisticsData = ref({
      total_users: 0,
      vip_total: 0,
      monthly_vip: 0,
      today_users: 0,
      yesterday_users: 0
    });

    // 表单相关
    const dialogVisible = ref(false);
    const dialogTitle = ref('编辑用户');
    const formRef = ref(null);
    const activeTab = ref('basic'); // 当前激活的tab
    const form = reactive({
      id: undefined,
      name: '',
      phone: '',
      email: '',
      status: 'active',
      password: '',
      institution_id: null,
      institution_name: '',
      referrer_id: null,
      referrer_name: '',
      // 基本信息新增字段
      gender: 0,
      birthday: '',
      // 微信相关字段
      wechat_nickname: '',
      wechat_avatar: '',
      wechat_gender: '0',
      wechat_country: '',
      wechat_province: '',
      wechat_city: '',
      // 角色信息字段
      roles: [],
      alliance_cp_level: 'cp',
      // 支付机构相关字段
      institution_number: '',
      institution_xs_number: '',
      institution_lv: '',
      institution_core_type: 1,
      institution_sfz: '',
      institution_account: '',
      institution_card_name: '',
      institution_card_number: '',
      // 净水器用户相关字段
      purifier_client_device_name: '',
      purifier_client_device_id: '',
      // 工程师相关字段
      engineer_id: '',
      // 登录信息字段
      last_login_time: '',
      last_login_ip: '',
      last_active_time: '',
      created_at: '',
      // VIP会员相关字段
      vip_at: '',
      is_vip_paid: 0,
      vip_paid_at: ''
    });

    // 监听手机号变化，自动同步到登录名
    watch(() => form.phone, (newPhone) => {
      if (newPhone && newPhone.trim()) {
        // 如果登录名为空或者等于旧的手机号，则自动设置为新手机号
        if (!form.email || form.email === form.phone || /^1[3-9]\d{9}$/.test(form.email)) {
          form.email = newPhone;
        }
      }
    });

    // 同步进度相关
    const syncDialogVisible = ref(false);
    const syncing = ref(false);
    const syncProgress = ref(0);
    const syncStatus = ref('');

    // 表单验证规则
    const rules = {
      name: [
        { required: true, message: '请输入姓名', trigger: 'blur' }
      ],
      phone: [
        { required: true, message: '请输入手机号', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
      ],
      email: [
        { required: false, message: '请输入登录名', trigger: 'blur' }
      ],
      password: [
        { 
          validator: (rule, value, callback) => {
            // 如果是新用户（没有ID）且密码为空，则使用默认密码123456
            if (!form.id && (!value || value.trim() === '')) {
              form.password = '123456';
            }
            callback();
          }, 
          trigger: 'blur' 
        }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    };

    // 设备管理相关
    const userDevices = ref([]);
    const userDevicesLoading = ref(false);
    const showAddDeviceDialog = ref(false);
    const newDevice = reactive({
      deviceId: '',
      deviceName: '',
      remark: ''
    });

    // 获取用户的设备列表
    const fetchUserDevices = async (userId) => {
      if (!userId) return;

      userDevicesLoading.value = true;
      try {
        // 使用V1版本API获取用户设备列表
        const response = await getUserDevices(userId);

        if (response.code === 200) {
          userDevices.value = response.data || [];
        } else {
          console.error('获取设备列表失败:', response.message);
          ElMessage.warning(response.message || '获取设备列表失败');
          userDevices.value = [];
        }
      } catch (error) {
        console.error('获取用户设备列表失败:', error);
        // 不显示错误消息，避免用户体验不佳
        // ElMessage.error('获取用户设备列表失败: ' + (error.message || '未知错误'));

        // 使用默认空数据
        userDevices.value = [];

        // 如果是认证错误，尝试刷新token
        if (error.message && error.message.includes('401')) {
          // 不自动刷新页面，避免用户体验不佳
          // setTimeout(() => { window.location.reload(); }, 1000);
        }
      } finally {
        userDevicesLoading.value = false;
      }
    };

    // 添加设备弹窗
    const handleAddDevice = () => {
      newDevice.deviceId = '';
      newDevice.deviceName = '';
      newDevice.remark = '';
      showAddDeviceDialog.value = true;
    };

    // 确认添加设备
    const confirmAddDevice = async () => {
      if (!newDevice.deviceId) {
        ElMessage.warning('请输入设备ID');
        return;
      }

      try {
        loading.value = true;

        // 使用V1版本API添加设备
        const response = await addUserDevice(form.id, newDevice.deviceId);

        if (response.code === 200) {
          ElMessage.success('设备添加成功');
          showAddDeviceDialog.value = false;
          // 刷新设备列表
          await fetchUserDevices(form.id);

          // 如果用户没有设备，则设置为净水器用户
          if (!form.roles.includes('water_purifier_user')) {
            form.roles.push('water_purifier_user');
          }
        } else {
          ElMessage.error(response.message || '设备添加失败');
        }
      } catch (error) {
        console.error('设备添加失败:', error);
        ElMessage.error('设备添加失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };

    // 设置主设备
    const handleSetMainDevice = async (device) => {
      try {
        loading.value = true;

        // 获取当前登录用户的token
        const token = getAdminToken();

        // 调用API设置主设备
        const response = await fetch(`/api/user-devices/${device.id}/main`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        });

        const result = await response.json();

        if (result.code === 0) {
          ElMessage.success('主设备设置成功');
          // 更新表单中的主设备信息
          form.purifier_client_device_id = device.device_id;
          form.purifier_client_device_name = device.device_name;
        } else {
          ElMessage.error(result.message || '主设备设置失败');
        }
      } catch (error) {
        console.error('主设备设置失败:', error);
        ElMessage.error('主设备设置失败: ' + (error.message || '未知错误'));
      } finally {
        loading.value = false;
      }
    };

    // 解绑设备
    const handleRemoveDevice = async (device) => {
      ElMessageBox.confirm(
        `确定要解绑设备"${device.device_name || device.device_id}"吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          loading.value = true;

          // 使用V1版本API解绑设备
          const response = await removeUserDevice(form.id, device.device_id);

          if (response.code === 200) {
            ElMessage.success('设备解绑成功');
            // 刷新设备列表
            await fetchUserDevices(form.id);

            // 如果是主设备，清空主设备信息
            if (form.purifier_client_device_id === device.device_id) {
              form.purifier_client_device_id = '';
              form.purifier_client_device_name = '';
            }

            // 如果没有设备了，更新设备计数
            if (userDevices.value.length === 0) {
              form.devices_count = 0;
            }
          } else {
            ElMessage.error(response.message || '设备解绑失败');
          }
        } catch (error) {
          console.error('设备解绑失败:', error);
          ElMessage.error('设备解绑失败: ' + (error.message || '未知错误'));
        } finally {
          loading.value = false;
        }
      }).catch(() => {});
    };

    // 获取APP用户列表
    const getList = () => {
      fetchData();
    };

    // 获取数据的核心方法 - 最终修复版本
    const fetchData = async () => {
      loading.value = true;
      
      try {
        // 使用getUsers API方法
        const params = {
          page: queryParams.page || 1,
          per_page: queryParams.per_page || 10
        };
        
        // 只添加非空参数
        if (queryParams.keyword && queryParams.keyword.trim()) {
          params.keyword = queryParams.keyword;
        }
        if (queryParams.role && queryParams.role.trim()) {
          params.role = queryParams.role;
        }
        if (queryParams.status && queryParams.status.trim()) {
          params.status = queryParams.status;
        }
        if (queryParams.branch_id !== '' && queryParams.branch_id !== undefined) {
          params.branch_id = queryParams.branch_id;
        }
        if (queryParams.date_start && queryParams.date_start.trim()) {
          params.date_start = queryParams.date_start;
        }
        if (queryParams.date_end && queryParams.date_end.trim()) {
          params.date_end = queryParams.date_end;
        }
        
        const response = await getUsers(params);
        
        // 检查响应格式 - 兼容code为0或200的情况
        if (response && (response.code === 0 || response.code === 200)) {
          
          // 处理数据
          let users = [];
          let totalCount = 0;
          
          if (response.data && Array.isArray(response.data.data)) {
            // 标准分页格式: {code: 0, data: {data: [...], total: 90}}
            users = response.data.data;
            totalCount = response.data.total || 0;
          } else if (Array.isArray(response.data)) {
            // 直接数组格式: {code: 0, data: [...], total: 90}
            users = response.data;
            totalCount = response.total || response.data.length;
          } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            // 对象格式，可能包含其他字段
            users = [];
            totalCount = 0;
          } else {
            console.warn('⚠️ 未知的数据格式:', response.data);
            users = [];
            totalCount = 0;
          }
          
          // 设置数据
          userList.value = users;
          total.value = totalCount;
          
          // 同时获取统计数据
          await fetchStatistics();
          
          // 强制触发Vue响应式更新
          await nextTick();
          
          // 强制重新渲染表格
          tableKey.value += 1;
          
          // 移除成功提醒，只在失败时提醒
          // if (users.length > 0) {
          //   ElMessage.success(`✅ 成功加载 ${users.length} 条用户数据（总计${totalCount}条）`);
          // } else {
          //   ElMessage.info('ℹ️ 数据为空，但API调用成功');
          // }
        } else {
          console.error('❌ API返回错误:', response);
          userList.value = [];
          total.value = 0;
          ElMessage.error(`API错误: ${response?.message || '响应格式不正确'}`);
        }
      } catch (error) {
        console.error('❌ API调用发生异常:', error);
        console.error('❌ 错误堆栈:', error.stack);
        userList.value = [];
        total.value = 0;
        ElMessage.error(`❌ 请求失败: ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    // 重置搜索
    const resetQuery = () => {
      queryParams.keyword = '';
      queryParams.role = '';
      queryParams.status = '';
      queryParams.branch_id = '';
      queryParams.date_start = '';
      queryParams.date_end = '';
      dateRange.value = [];
      queryParams.page = 1;
      fetchData();
    };

    // 获取分支机构选项
    const fetchBranchOptions = async () => {
      try {
        const response = await getBranchOrganizationOptions();
        branchOptions.value = response.data || [];
        
        // 默认选择分支机构3（点点够）
        if (queryParams.branch_id === '' && branchOptions.value.length > 0) {
          const branch3 = branchOptions.value.find(branch => branch.id == 3 || String(branch.id) === '3');
          if (branch3) {
            queryParams.branch_id = branch3.id; // 使用实际的ID值，保持类型一致
            console.log('自动选择默认分支机构：点点够（ID=' + branch3.id + '）');
            // 设置了branch_id后立即加载用户列表
            getList();
          } else {
            console.log('未找到分支机构3，可用分支：', branchOptions.value.map(b => ({id: b.id, name: b.name})));
            // 未找到分支机构3时，仍然加载列表（使用后端默认逻辑）
            getList();
          }
        } else {
          // 如果已经有branch_id或没有分支机构数据，直接加载列表
          getList();
        }
      } catch (error) {
        console.error('获取分支机构选项失败:', error);
        // 即使获取分支机构失败，也要加载用户列表
        getList();
      }
    };

    // 分支机构变化处理
    const handleBranchChange = () => {
      queryParams.page = 1;
      fetchData();
    };

    // 分页相关
    const handleSizeChange = (size) => {
      queryParams.per_page = size;
      queryParams.page = 1; // 切换每页条数时重置为第一页
      fetchData();
    };

    const handleCurrentChange = (page) => {
      queryParams.page = page;
      fetchData();
    };

    // 编辑
    const handleEdit = async (row) => {
      // 设置弹窗标题
      dialogTitle.value = '编辑用户';
      
      // 重置表单数据
      Object.keys(form).forEach(key => {
        form[key] = '';
      });

      // 基本信息
      form.id = row.id;
      form.name = row.name || '';
      form.phone = row.phone || '';
      form.email = row.email || row.phone || ''; // 登录名默认为手机号
      form.status = row.status || 'active';
      form.password = '';

      // 将数字性别值转换为字符串显示形式
      if (row.gender === 1) {
        form.gender = 1;
      } else if (row.gender === 2) {
        form.gender = 2;
      } else {
        form.gender = 0;
      }

      form.birthday = row.birthday || '';

      // 推荐人信息 - 使用referrer_id和referrer_name
      form.referrer_id = row.referrer_id === undefined || row.referrer_id === null ? 0 : row.referrer_id;
      form.referrer_name = (row.referrer_id === null || row.referrer_id === 0) ? '点点够' : (row.referrer_name || '');

      // 上级机构信息 - 仍然保留institution_id和institution_name用于支付机构
      form.institution_id = row.institution_id === undefined || row.institution_id === null ? null : row.institution_id;
      form.institution_name = row.institution_name || '';

      // 微信信息
      form.wechat_nickname = row.wechat_nickname || '';
      form.wechat_avatar = row.wechat_avatar || '';
      form.wechat_gender = row.wechat_gender || '0';
      form.wechat_country = row.wechat_country || '';
      form.wechat_province = row.wechat_province || '';
      form.wechat_city = row.wechat_city || '';

      // 角色信息 - 每个用户默认都是业务员
      form.roles = ['salesman']; // 默认添加业务员角色
      if (row.is_pay_institution === 1) form.roles.push('pay_institution');
      if (row.is_water_purifier_user === 1) form.roles.push('water_purifier_user');
      if (row.is_engineer === 1) form.roles.push('engineer');
      if (row.is_water_purifier_agent === 1) form.roles.push('water_purifier_agent');
      if (row.is_pay_merchant === 1) form.roles.push('pay_merchant');
      if (row.is_vip === 1) form.roles.push('vip');
      if (row.is_admin === 1) form.roles.push('admin');
      if (row.is_ytb_alliance_member === 1) form.roles.push('ytb_alliance_member');

      // 联盟CP等级
      form.alliance_cp_level = row.alliance_cp_level || 'cp';

      // 防止重复添加salesman角色
      form.roles = [...new Set(form.roles)];

      // 支付机构信息
      form.institution_number = row.institution_number || '';
      form.institution_xs_number = row.institution_xs_number || '';
      form.institution_lv = row.institution_lv || '';
      form.institution_core_type = row.institution_core_type || 1;
      form.institution_sfz = row.institution_sfz || '';
      form.institution_account = row.institution_account || '';
      form.institution_card_name = row.institution_card_name || '';
      form.institution_card_number = row.institution_card_number || '';

      // 净水器用户信息
      form.purifier_client_device_name = row.purifier_client_device_name || '';
      form.purifier_client_device_id = row.purifier_client_device_id || '';

      // 工程师信息
      form.engineer_id = row.engineer_id || '';

      // 登录信息
      form.last_login_time = row.last_login_time || '';
      form.last_login_ip = row.last_login_ip || '';
      form.last_active_time = row.last_active_time || '';
      form.created_at = row.created_at || '';

      // VIP会员相关信息
      form.vip_at = row.vip_at || '';
      form.is_vip_paid = row.is_vip_paid === 1 ? 1 : 0;
      form.vip_paid_at = row.vip_paid_at || '';

      // 加载推荐人下拉选项
      handleReferrerFocus();

      // 获取用户设备列表 - 临时禁用以修复编辑问题
      // await fetchUserDevices(row.id);
      userDevices.value = []; // 临时设为空数组

      // 显示对话框
      activeTab.value = 'basic'; // 默认显示基本信息选项卡
      dialogVisible.value = true;
    };

    // 删除
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        '确定要删除该用户吗？',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async() => {
        try {
          const response = await deleteUser(row.id);
          if (response.code === 200) {
            ElMessage.success('删除成功');
            getList();
          } else {
            ElMessage.error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {});
    };

    // 添加更精确的日期时间格式化函数
    const formatDateTime = (date) => {
      const pad = (num) => (num < 10 ? '0' + num : num);
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      const seconds = pad(date.getSeconds());

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    // 提交表单
    const submitForm = () => {
      formRef.value.validate(valid => {
        if (!valid) return;

        loading.value = true;

        // 深拷贝表单数据
        const submitData = JSON.parse(JSON.stringify(form));

        // 转换性别为数字
        if (submitData.gender !== undefined && submitData.gender !== null) {
          submitData.gender = parseInt(submitData.gender, 10);
        }

        // 确保status是数字
        if (submitData.status !== undefined) {
          // 保持字符串状态值
        }

        // 处理referrer_id，如果是0或点点够，在数据库中存储为NULL
        if (submitData.referrer_id === 0 || submitData.referrer_id === '0') {
          submitData.referrer_id = null;
          submitData.referrer_name = '点点够';
        } else if (submitData.referrer_id === null || submitData.referrer_id === '') {
          // 如果是null或空字符串，设为null和点点够
          submitData.referrer_id = null;
          submitData.referrer_name = '点点够';
        } else if (submitData.referrer_id) {
          // 确保referrer_id是数字
          submitData.referrer_id = parseInt(submitData.referrer_id, 10);
        }

        // 处理institution_id (专门用于支付机构)
        if (submitData.institution_id === 0 || submitData.institution_id === '0') {
          submitData.institution_id = null;
        } else if (submitData.institution_id) {
          // 确保institution_id是数字
          submitData.institution_id = parseInt(submitData.institution_id, 10);
        }

        // 确保roles数组存在
        if (!submitData.roles || !Array.isArray(submitData.roles)) {
          submitData.roles = [];
        }

        // 确保roles包含sales角色
        if (!submitData.roles.includes('sales')) {
          submitData.roles.push('sales');
        }

        // 处理角色数据 - 确保都是数字类型
        submitData.is_pay_institution = submitData.roles.includes('pay_institution') ? 1 : 0;
        submitData.is_water_purifier_user = submitData.roles.includes('water_purifier_user') ? 1 : 0;
        submitData.is_engineer = submitData.roles.includes('engineer') ? 1 : 0;
        submitData.is_water_purifier_agent = submitData.roles.includes('water_purifier_agent') ? 1 : 0;
        submitData.is_pay_merchant = submitData.roles.includes('pay_merchant') ? 1 : 0;
        submitData.is_vip = submitData.roles.includes('vip') ? 1 : 0;
        submitData.is_salesman = 1; // 确保每个用户都是业务员
        submitData.is_admin = submitData.roles.includes('admin') ? 1 : 0;

        // 处理VIP会员时间格式，确保使用正确的日期时间格式
        if (submitData.is_vip === 1) {
          // 如果是VIP会员
          if (!submitData.vip_at) {
            // 如果未设置VIP开通时间，使用当前时间
            submitData.vip_at = formatDateTime(new Date());
          } else if (typeof submitData.vip_at !== 'string' || !submitData.vip_at.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            // 如果不是标准格式，尝试格式化
            try {
              const vipDate = new Date(submitData.vip_at);
              if (!isNaN(vipDate.getTime())) {
                submitData.vip_at = formatDateTime(vipDate);
              }
            } catch (error) {
              console.error('VIP开通时间格式转换错误:', error);
              // 如果转换失败，使用当前时间
              submitData.vip_at = formatDateTime(new Date());
            }
          }

          // 确保is_vip_paid是数字
          submitData.is_vip_paid = parseInt(submitData.is_vip_paid, 10) || 0;

          // 处理支付状态
          if (submitData.is_vip_paid === 1) {
            if (!submitData.vip_paid_at) {
              // 如果未设置VIP完款时间，使用当前时间
              submitData.vip_paid_at = formatDateTime(new Date());
            } else if (typeof submitData.vip_paid_at !== 'string' || !submitData.vip_paid_at.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
              // 如果不是标准格式，尝试格式化
              try {
                const vipPaidDate = new Date(submitData.vip_paid_at);
                if (!isNaN(vipPaidDate.getTime())) {
                  submitData.vip_paid_at = formatDateTime(vipPaidDate);
                }
              } catch (error) {
                console.error('VIP完款时间格式转换错误:', error);
                // 如果转换失败，使用当前时间
                submitData.vip_paid_at = formatDateTime(new Date());
              }
            }
          } else {
            // 如果设置为未付款，确保付款时间为空
            submitData.vip_paid_at = null;
          }
        } else {
          // 如果不是VIP会员，清除相关字段
          submitData.is_vip_paid = 0;
          submitData.vip_at = null;
          submitData.vip_paid_at = null;
        }

        // 删除不应该提交的字段
        delete submitData.created_at;
        delete submitData.updated_at;
        delete submitData.roles; // 角色已转换为is_xxx字段，不需要再提交



        // 根据ID判断是创建还是更新
        const isCreate = !submitData.id;
        let apiRequest;

        if (isCreate) {
          // 创建新用户
          apiRequest = createUser(submitData);
        } else {
          // 更新现有用户
          apiRequest = updateUser(submitData.id, submitData);
        }

        // 提交数据
        apiRequest.then(response => {

            // 检查响应状态码，支持V1 API的code: 0和传统API的code: 200
            if (response && (response.code === 0 || response.code === 200)) {
              ElMessage.success(isCreate ? '创建成功' : '更新成功');
              dialogVisible.value = false;
              // 刷新数据
              getList();
            } else {
              // 捕获非成功状态码，显示错误信息
              console.error('保存返回非成功状态码:', response);
              const errorMsg = response?.message || '保存失败';
              ElMessage.error(errorMsg);
            }
          })
          .catch(error => {
            console.error('保存失败:', error);
            if (error.response) {
              console.error('错误响应数据:', error.response.data);
              // 显示详细错误
              if (error.response.data && error.response.data.errors) {
                const errors = error.response.data.errors;
                const errorMessages = Object.keys(errors).map(key => {
                  return `${key}: ${errors[key].join(', ')}`;
                }).join('\n');
                ElMessage.error('验证失败:\n' + errorMessages);
                return;
              }
            }

            // 确保错误信息正确显示
            const errorMsg = error.response?.data?.message || error.message || '未知错误';
            ElMessage.error('保存失败: ' + errorMsg);
          })
          .finally(() => {
            loading.value = false;
          });
      });
    };

    // 搜索用户作为推荐人
    const searchUsers = async (query) => {
      if (query) {
        userSelectLoading.value = true;
        try {
          const response = await getUsers({
            keyword: query,
            page: 1,
            per_page: 20,
            role: 'vip', // 优先搜索VIP用户
            status: 'active',
            branch_id: 3 // 指定点点够分支机构，确保搜索到正确用户
          });

          if ((response.code === 0 || response.code === 200) && response.data) {
            // 保留点点够选项
            const defaultOption = userOptions.value.find(user => user.id === 0);

            // 初始化选项列表，确保点点够始终存在
            userOptions.value = defaultOption ? [defaultOption] : [{
              id: 0,
              name: '点点够',
              phone: '系统默认推荐人',
              wechat_avatar: '',
              is_vip: 0
            }];

            // 添加搜索到的用户
            const items = Array.isArray(response.data) ? response.data : (response.data.data || response.data.items || []);

            // 过滤当前用户
            const filteredUsers = items.filter(user => user.id !== form.id);

            // 添加到选项中
            filteredUsers.forEach(user => {
              if (!userOptions.value.some(option => option.id === user.id)) {
                // 创建一个新对象，确保不修改原始对象
                const newUser = {
                  ...user,
                  is_vip: user.is_vip || (user.role_names?.includes('VIP会员') ? 1 : 0)
                };
                userOptions.value.push(newUser);
              }
            });
          }
        } catch (error) {
          console.error('搜索用户失败:', error);
        } finally {
          userSelectLoading.value = false;
        }
      } else {
        // 如果查询为空，重新加载所有VIP用户
        handleReferrerFocus();
      }
    };

    // 推荐人选择框获得焦点时，加载用户列表
    const handleReferrerFocus = async () => {
      userSelectLoading.value = true;
      // 首先重置选项列表，保留点点够
      userOptions.value = [{
        id: 0,
        name: '点点够',
        phone: '系统默认推荐人',
        wechat_avatar: '',
        is_vip: 0
      }];

      try {
        // 加载所有VIP用户作为推荐人选项
        const response = await getUsers({
          per_page: 100, // 加载更多用户
          page: 1,
          role: 'vip', // 只加载VIP用户
          status: 'active', // 只加载正常状态的用户
          branch_id: 3 // 指定点点够分支机构，确保能获取到VIP用户
        });

        if ((response.code === 0 || response.code === 200) && response.data) {
          const items = Array.isArray(response.data) ? response.data : (response.data.data || response.data.items || []);

          // 过滤结果中不包含当前编辑的用户
          const filteredUsers = items.filter(user => user.id !== form.id);

          // 将用户添加到选项中，避免重复
          filteredUsers.forEach(user => {
            if (!userOptions.value.some(option => option.id === user.id)) {
              // 创建一个新对象，确保不修改原始对象
              const newUser = {
                ...user,
                is_vip: 1 // 标记为VIP用户
              };
              userOptions.value.push(newUser);
            }
          });
        }
      } catch (error) {
        console.error('加载VIP用户列表失败:', error);
        ElMessage.error('加载VIP用户列表失败，请重试');
      } finally {
        userSelectLoading.value = false;
      }

      // 如果当前选择的推荐人不为空，但不在选项列表中，尝试加载它
      if (form.referrer_id && form.referrer_id !== 0 &&
          !userOptions.value.some(option => option.id === form.referrer_id)) {
        userSelectLoading.value = true;
        try {
          const response = await getUsers({
            keyword: form.referrer_id.toString(),
            per_page: 1
          });

          if ((response.code === 0 || response.code === 200) && response.data) {
            const items = Array.isArray(response.data) ? response.data : (response.data.data || response.data.items || []);
            if (items.length > 0 && items[0].id === form.referrer_id) {
              userOptions.value.push(items[0]);
            }
          }
        } catch (error) {
          console.error('加载当前推荐人失败:', error);
        } finally {
          userSelectLoading.value = false;
        }
      }
    };

    // 当选择推荐人时，保存推荐人名称
    const handleReferrerChange = (value) => {
      if (value === 0 || value === "0") {
        form.referrer_id = 0; // 前端显示为0，但提交时会转换为null
        form.referrer_name = '点点够';
      } else if (value) {
        const selectedUser = userOptions.value.find(user => user.id === value);
        if (selectedUser) {
          form.referrer_id = selectedUser.id; // 确保是数字类型
          form.referrer_name = selectedUser.name || selectedUser.wechat_nickname || `用户${selectedUser.id}`;
        }
      } else {
        // 如果值为null或未定义，默认为0
        form.referrer_id = 0;
        form.referrer_name = '点点够';
      }
    };

    // 同步所有用户角色数据
    const handleSyncRoles = () => {
      ElMessageBox.confirm(
        '确定要同步用户角色数据吗？这将从支付系统和净水器系统获取最新数据。',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(() => {
        // 开始同步并显示进度对话框
        syncDialogVisible.value = true;
        syncing.value = true;
        syncProgress.value = 0;
        syncStatus.value = '正在准备同步...';

        // 使用模拟进度
        let timer = null;
        let currentProgress = 0;
        const totalTime = 30000; // 30秒模拟时间
        const interval = 300; // 每300ms更新一次
        const steps = totalTime / interval;
        const increment = 95 / steps; // 最多到95%，留5%给完成阶段

        timer = setInterval(() => {
          if (currentProgress < 95) {
            currentProgress += increment;
            syncProgress.value = Math.min(Math.floor(currentProgress), 95);

            // 更新状态消息
            if (syncProgress.value < 20) {
              syncStatus.value = '正在连接支付系统...';
            } else if (syncProgress.value < 40) {
              syncStatus.value = '正在同步支付机构信息...';
            } else if (syncProgress.value < 60) {
              syncStatus.value = '正在同步净水器用户信息...';
            } else if (syncProgress.value < 80) {
              syncStatus.value = '正在同步工程师信息...';
            } else {
              syncStatus.value = '正在完成同步...';
            }
          }
        }, interval);

        // 执行同步
        syncAllUserRoles()
          .then((response) => {
            if (response.code === 200 || response.code === 0) {
              // 同步成功，显示100%进度
              syncProgress.value = 100;

              const stats = response.data;
              const total = parseInt(stats.total || 0);
              const success = stats.success;
              const failed = parseInt(stats.failed || 0);
              // 确保所有字段都是数字类型
              const payInstitution = typeof stats.pay_institution === 'boolean' ?
                (stats.pay_institution ? 1 : 0) : parseInt(stats.pay_institution || 0);
              const waterPurifier = typeof stats.water_purifier_user === 'boolean' ?
                (stats.water_purifier_user ? 1 : 0) : parseInt(stats.water_purifier_user || 0);
              const engineer = typeof stats.engineer === 'boolean' ?
                (stats.engineer ? 1 : 0) : parseInt(stats.engineer || 0);
              const withParent = parseInt(stats.with_parent || 0);
              const salesman = parseInt(stats.salesman || 0);
              const duration = parseInt(stats.duration || 0);

              // 确保成功数量是数字
              const successCount = typeof success === 'boolean' ? (success ? total : 0) : parseInt(success || 0);

              // 构建详细结果消息
              const resultMessage = `
                <div style="text-align:left; padding:5px;">
                  <p><strong>同步详情：</strong></p>
                  <ul>
                    <li>共处理：${total} 个用户</li>
                    <li>成功：${successCount} 个</li>
                    <li>失败：${failed} 个</li>
                    <li>新增支付机构：${payInstitution} 个</li>
                    <li>新增净水器用户：${waterPurifier} 个</li>
                    <li>新增工程师：${engineer} 个</li>
                    <li>同步上级关系：${withParent} 个</li>
                    <li>新增业务员：${salesman} 个</li>
                    <li>耗时：${duration} 秒</li>
                  </ul>
                  ${stats.errors && stats.errors.length > 0 ? `
                    <p><strong>部分错误详情:</strong></p>
                    <ul>
                      ${stats.errors.map(err => `<li>用户ID: ${err.user_id}, 错误: ${err.message}</li>`).join('')}
                    </ul>
                    ${stats.errors_truncated ? '<p>显示部分错误信息，更多错误已省略...</p>' : ''}
                  ` : ''}
                </div>
              `;

              // 更新同步状态
              syncStatus.value = `同步完成！共同步 ${total} 个用户，成功 ${successCount} 个，失败 ${failed} 个。`;

              // 显示通知
              ElNotification({
                title: '同步完成',
                message: resultMessage,
                type: successCount === total ? 'success' : (failed > successCount ? 'error' : 'warning'),
                duration: 8000,
                dangerouslyUseHTMLString: true
              });

              // 同步完成
              syncing.value = false;
              clearInterval(timer);

              // 刷新用户列表
              getList();
            } else {
              throw new Error(response.message || '同步失败');
            }
          })
          .catch(error => {
            console.error('同步失败:', error);
            syncProgress.value = 100;
            syncStatus.value = `同步失败: ${error.message || '未知错误'}`;
            ElMessage.error('同步失败: ' + (error.message || '未知错误'));
            syncing.value = false;
            clearInterval(timer);
          });
      }).catch(() => {});
    };

    // 添加用户
    const handleAddUser = () => {
      // 设置弹窗标题
      dialogTitle.value = '添加用户';
      
      // 重置表单数据
      Object.keys(form).forEach(key => {
        form[key] = '';
      });

      // 设置默认值
      form.id = ''; // 空字符串表示新用户
      form.status = 'active'; // 默认激活状态
      form.gender = 0; // 默认性别为未知
      form.referrer_id = 0; // 默认推荐人为点点够
      form.referrer_name = '点点够';
      form.roles = ['sales']; // 默认角色为业务员
      form.password = '123456'; // 默认密码为123456

      // 显示对话框
      activeTab.value = 'basic'; // 默认显示基本信息选项卡
      dialogVisible.value = true;
    };

    // 同步进度格式化
    const syncProgressFormat = (percentage) => {
      return percentage + '%';
    };

    // 处理状态切换
    const handleStatusChange = async (row) => {
      const newStatus = row.status === 'active' ? 'disabled' : 'active';
      const statusText = newStatus === 'active' ? '启用' : '禁用';
      
      try {
        ElMessageBox.confirm(
          `确定要${statusText}用户 "${row.name || row.phone}" 吗？`,
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: newStatus === 'active' ? 'success' : 'warning'
          }
        ).then(async () => {
          loading.value = true;
          const response = await updateUserStatus(row.id, newStatus);
          
          if (response.code === 200) {
            ElMessage.success(`用户${statusText}成功`);
            // 更新本地数据
            row.status = newStatus;
          } else {
            ElMessage.error(response.message || `用户${statusText}失败`);
          }
          loading.value = false;
        }).catch(() => {});
      } catch (error) {
        console.error(`用户${statusText}失败:`, error);
        ElMessage.error(`用户${statusText}失败: ` + (error.message || '未知错误'));
        loading.value = false;
      }
    };
    
    // 处理日期范围变化
    const handleDateRangeChange = (val) => {
      if (val) {
        queryParams.date_start = val[0];
        queryParams.date_end = val[1];
      } else {
        queryParams.date_start = '';
        queryParams.date_end = '';
      }
    };

    // 搜索
    const handleSearch = () => {
      // 重置到第一页
      queryParams.page = 1;
      fetchData();
    };

    // 同步单个用户角色数据
    const handleSyncUserRole = (row) => {
      ElMessageBox.confirm(
        `确定要同步用户"${row.name || row.phone || row.id}"的角色数据吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info'
        }
      ).then(async() => {
        try {
          const loadingInstance = ElMessage({
            type: 'info',
            message: '正在同步用户角色数据...',
            duration: 0
          });

          const response = await syncUserRoles(row.id);

          loadingInstance.close();

          if (response.code === 0) {
            const syncDetails = response.data.sync_details || {};
            const changes = syncDetails.changes || {};
            const results = syncDetails.results || {};

            // 构建详细的成功消息
            let detailedMessage = '用户角色同步成功';
            const changeDetails = [];

            if (changes.pay_institution) {
              changeDetails.push('• 支付机构角色已添加');
            }
            if (changes.water_purifier_user) {
              changeDetails.push('• 净水器用户角色已添加');
            }
            if (changes.engineer) {
              changeDetails.push('• 工程师角色已添加');
            }
            if (changes.parent_institution) {
              changeDetails.push('• 上级机构关系已更新');
            }
            if (syncDetails.results && syncDetails.results.salesman && syncDetails.results.salesman.changed) {
              const action = syncDetails.results.salesman.action;
              if (action === 'created') {
                changeDetails.push('• 业务员记录已创建');
              } else if (action === 'updated_flag') {
                changeDetails.push('• 业务员标识已更新');
              }
            }

            // 如果有变化，显示详细信息
            if (changeDetails.length > 0) {
              detailedMessage += ':\n' + changeDetails.join('\n');

              ElNotification({
                title: '同步成功',
                message: detailedMessage,
                type: 'success',
                duration: 5000,
                dangerouslyUseHTMLString: true
              });
            } else {
              ElMessage.success('用户角色同步完成，无变化');
            }

            // 更新列表数据
            getList();
          } else {
            // 处理错误情况
            const errorMsg = response.message || '用户角色同步失败';
            const errorDetails = response.data?.error ? `\n错误详情: ${response.data.error}` : '';

            ElNotification({
              title: '同步失败',
              message: errorMsg + errorDetails,
              type: 'error',
              duration: 8000
            });
          }
        } catch (error) {
          console.error('同步用户角色失败:', error);
          ElMessage.error('同步用户角色失败: ' + (error.message || '未知错误'));
        }
      }).catch(() => {});
    };

    // 初始化时自动加载数据
    onMounted(() => {
      fetchBranchOptions(); // 获取分支机构选项，完成后会自动调用getList()
    });

    // 根据用户ID生成随机颜色
    const getAvatarColor = (id) => {
      const colors = [
        '#409EFF', // 蓝色
        '#67C23A', // 绿色
        '#E6A23C', // 黄色
        '#F56C6C', // 红色
        '#909399', // 灰色
        '#9B59B6', // 紫色
        '#3498DB', // 蓝色
        '#1ABC9C', // 青绿色
        '#F39C12', // 橙色
        '#95A5A6'  // 灰色
      ];

      // 使用ID作为随机种子
      const colorIndex = typeof id === 'number' ? id % colors.length : 0;
      return colors[colorIndex];
    };

    // VIP状态变化处理
    const handleVipStatusChange = (value) => {
      form.is_vip = value;
      // 当设置为VIP时，自动设置开通时间
      if (value === 1 && !form.vip_at) {
        form.vip_at = formatDateTime(new Date());
      } else if (value === 0) {
        // 当取消VIP时，清除相关字段
        form.is_vip_paid = 0;
        form.vip_at = null;
        form.vip_paid_at = null;
      }
    };

    // 联盟CP状态变化处理
    const handleAllianceChange = (checked) => {
      if (checked && !form.alliance_cp_level) {
        form.alliance_cp_level = 'cp'; // 默认设置为CP
      }
    };

    // VIP付款状态变化处理
    const handleVipPaidStatusChange = (value) => {
      form.is_vip_paid = value;

      // 当设置为已付款时，自动设置付款时间
      if (value === 1 && !form.vip_paid_at) {
        form.vip_paid_at = formatDateTime(new Date());
      } else if (value === 0) {
        // 当设置为未付款时，清除付款时间
        form.vip_paid_at = null;
      }
    };

    // 获取统计数据
    const fetchStatistics = async () => {
      try {
        console.log('开始获取统计数据，参数:', { branch_id: queryParams.branch_id });
        const response = await getUserStatistics({
          branch_id: queryParams.branch_id
        });
        
        console.log('统计API响应:', response);
        
        if (response.code === 0) {
          statisticsData.value = response.data;
          console.log('统计数据已更新:', statisticsData.value);
        } else {
          console.error('获取统计数据失败:', response.message);
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };

    // 统计函数 - 使用API数据
    const getVipCount = () => {
      return statisticsData.value?.vip_total || 0;
    };

    const getMonthlyVipCount = () => {
      return statisticsData.value?.monthly_vip || 0;
    };

    const getTodayCount = () => {
      return statisticsData.value?.today_users || 0;
    };

    const getYesterdayCount = () => {
      return statisticsData.value?.yesterday_users || 0;
    };

    // 时间格式化函数 - 精确到时分秒
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };

    const getRelativeTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '今天';
      if (diffDays === 2) return '昨天';
      if (diffDays <= 7) return `${diffDays - 1}天前`;
      if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;
      if (diffDays <= 365) return `${Math.floor(diffDays / 30)}月前`;
      return `${Math.floor(diffDays / 365)}年前`;
    };

    // 判断是否为APP用户
    const isAppUser = (user) => {
      // 如果有avatar、nickname、last_login_at三个字段中的任意一个有数据，判定为app用户
      return !!(user.avatar || user.nickname || user.last_login_at);
    };

    // 获取最后登录时间（优先使用last_login_at，其次使用last_login_time）
    const getLastLoginTime = (user) => {
      return user.last_login_at || user.last_login_time;
    };

    // 根据分支机构ID获取分支机构名称
    const getBranchNameById = (branchId) => {
      if (!branchId) return '未知分支';
      
      // 从分支机构选项中查找对应的分支机构
      const branch = branchOptions.value.find(b => b.id == branchId || String(b.id) === String(branchId));
      if (branch && branch.name) {
        return branch.name;
      }
      
      // 如果找不到，返回默认格式
      return `分支机构${branchId}`;
    };

    return {
      loading,
      userList,
      total,
      tableKey,
      queryParams,
      dateRange,
      dialogVisible,
      dialogTitle,
      formRef,
      activeTab,
      form,
      rules,
      userSelectLoading,
      userOptions,
      userDevices,
      userDevicesLoading,
      showAddDeviceDialog,
      newDevice,
      syncDialogVisible,
      syncing,
      syncProgress,
      syncStatus,
      branchOptions,
      
      // 方法
      fetchData,
      getList,
      resetQuery,
      fetchBranchOptions,
      handleBranchChange,
      handleSizeChange,
      handleCurrentChange,
      handleEdit,
      handleDelete,
      submitForm,
      handleStatusChange,
      handleDateRangeChange,
      handleSearch,
      handleAddUser,
      handleSyncRoles,
      handleAllianceChange,
      handleSyncUserRole,
      searchUsers,
      handleReferrerFocus,
      handleReferrerChange,
      getAvatarColor,
      fetchUserDevices,
      handleAddDevice,
      confirmAddDevice,
      handleSetMainDevice,
      handleRemoveDevice,
      
      // 统计函数
      fetchStatistics,
      getVipCount,
      getMonthlyVipCount,
      getTodayCount,
      getYesterdayCount,
      
      // 时间格式化函数
      formatDate,
      formatDateTime,
      getRelativeTime,
      isAppUser,
      getLastLoginTime,
      getBranchNameById,
      
      // 图标
      User,
      Plus,
      Refresh,
      Search,
      UserFilled,
      CircleCheck,
      RefreshLeft,
      Calendar,
      ChatDotRound,
      Clock,
      Edit,
      Lock,
      Unlock,
      Loading,
      OfficeBuilding,
      
      // 同步进度格式化
      syncProgressFormat
    };
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}

/* 页面头部样式 */
.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex-grow: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 28px;
}

.page-description {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 筛选卡片样式 */
.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.filter-icon {
  font-size: 16px;
  color: #409eff;
}

.filter-title {
  font-size: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}

/* 统计仪表板样式 */
.stats-dashboard {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stats-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.total-users .stats-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.active-users .stats-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.vip-users .stats-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.monthly-vip .stats-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.today-users .stats-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.stats-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 表格卡片样式 */
.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

/* 用户信息样式 */
.user-info {
  display: flex;
  align-items: center;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.user-phone {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.user-wechat {
  font-size: 12px;
  color: #07c160;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* 推荐人信息样式 */
.referrer-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.referrer-details {
  font-size: 12px;
}

.referrer-id {
  color: #409eff;
  font-weight: 600;
}

.referrer-name {
  color: #303133;
  margin-top: 2px;
}

/* 角色标签样式 */
.role-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-tag-item {
  display: flex;
  align-items: center;
}

.vip-status {
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.8;
}

/* 时间信息样式 */
.time-info {
  font-size: 12px;
  line-height: 1.4;
}

.register-time,
.login-time,
.no-login-time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.register-time .el-icon,
.login-time .el-icon,
.no-login-time .el-icon {
  font-size: 14px;
  color: #909399;
  flex-shrink: 0;
}

.time-label {
  color: #606266;
  font-weight: 500;
  min-width: 32px;
  flex-shrink: 0;
}

.time-value {
  color: #303133;
  font-weight: 400;
}

.time-value.last-login {
  color: #67C23A;
  font-weight: 500;
}

.relative-time {
  color: #c0c4cc;
  margin-left: 4px;
  font-size: 10px;
}

.relative-time.last-login-relative {
  color: #85ce61;
  font-weight: 500;
}

.no-login-text {
  color: #F56C6C;
  font-style: italic;
  font-size: 11px;
}

/* 展开详情中的最后登录时间样式 */
.last-login-detail {
  color: #67C23A;
  font-weight: 500;
}

.last-login-relative-detail {
  color: #85ce61;
  margin-left: 8px;
  font-size: 12px;
}

.no-login-detail {
  color: #F56C6C;
  font-style: italic;
  font-weight: 500;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 展开内容样式 */
.expand-content {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  margin: 10px;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }

  .stats-dashboard .el-row {
    flex-direction: column;
  }

  .stats-card {
    margin-bottom: 10px;
  }
}

/* 日期选择器弹出层的z-index问题修复 */
.date-picker-higher-z-index {
  z-index: 3000 !important;
}

.select-dropdown-higher-z-index {
  z-index: 3000 !important;
}

/* 表格内的小图标样式 */
.table-icon {
  font-size: 16px;
  margin-right: 5px;
  cursor: pointer;
}

/* 状态tag的样式 */
.el-tag {
  margin: 2px;
}

/* 操作按钮区域样式 */
.operation-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

/* 设备管理样式 */
.device-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
}

.device-empty {
  padding: 10px 0;
}

.device-actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

.device-list {
  margin-top: 10px;
}

.device-stats {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.device-count {
  font-size: 14px;
  color: #606266;
}

.device-name-cell {
  display: flex;
  align-items: center;
}

.menu-badge {
  margin-left: 4px;
}

.action-column {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.role-tag {
  margin: 2px;
}

/* 推荐人选择器相关样式 - 美化版本 */
.referrer-option-container {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  width: 100%;
  border-radius: 6px;
  transition: all 0.2s ease;
  margin: 2px 0;
}

.referrer-option-container:hover {
  background-color: #f5f7fa;
}

.referrer-avatar {
  margin-right: 12px;
  flex-shrink: 0;
  position: relative;
}

.referrer-avatar .el-image {
  border: 2px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.referrer-avatar .el-image:hover {
  border-color: #409eff;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.2);
}

.referrer-default-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
  background: linear-gradient(135deg, var(--avatar-color, #409EFF), var(--avatar-color-light, #66b1ff));
  border: 2px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.referrer-default-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.referrer-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
  gap: 4px;
}

.referrer-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  line-height: 1.4;
}

.referrer-id {
  color: #606266;
  font-size: 12px;
  font-weight: 600;
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: fit-content;
}

.referrer-name {
  color: #303133;
  font-weight: 600;
  font-size: 14px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referrer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-left: auto;
}

.referrer-tags .el-tag {
  font-size: 10px;
  height: 18px;
  line-height: 16px;
  border-radius: 9px;
  font-weight: 500;
}

.referrer-contact {
  color: #909399;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  line-height: 1.3;
}

.referrer-phone {
  display: flex;
  align-items: center;
  color: #67c23a;
  font-weight: 500;
}

.referrer-phone::before {
  content: "📱";
  margin-right: 4px;
  font-size: 11px;
}

.referrer-wechat {
  display: flex;
  align-items: center;
  color: #07C160;
  font-weight: 500;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.referrer-wechat .el-icon-chat-dot-round {
  margin-right: 4px;
  font-size: 12px;
}

.referrer-no-phone {
  color: #C0C4CC;
  font-style: italic;
  font-size: 11px;
}

/* 推荐人下拉框整体样式优化 */
.referrer-select-dropdown {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.referrer-select-dropdown .el-select-dropdown__item {
  padding: 0;
  height: auto;
  line-height: normal;
}

.referrer-select-dropdown .el-select-dropdown__item:hover {
  background-color: transparent;
}

.referrer-select-dropdown .el-select-dropdown__item.selected {
  background-color: #f0f9ff;
}

.referrer-select-dropdown .el-select-dropdown__item.selected .referrer-option-container {
  background-color: #e1f5fe;
  border-left: 3px solid #409eff;
}

.current-referrer {
  margin-top: 6px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #ECF5FF;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #409EFF;
}

/* 分支机构列样式 */
.branch-info {
  display: flex;
  justify-content: center;
  align-items: center;
}

.branch-info .el-tag {
  font-weight: 600;
  border-radius: 12px;
  font-size: 11px;
  min-width: 60px;
  text-align: center;
}

.referrer-id-badge {
  background-color: #409EFF;
  color: white;
  padding: 1px 4px;
  border-radius: 10px;
  font-size: 11px;
  margin-left: 3px;
}
</style>
