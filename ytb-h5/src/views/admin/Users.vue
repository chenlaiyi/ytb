<template>
  <div class="users-page">
    <van-nav-bar
      title="用户管理"
      left-arrow
      @click-left="onClickLeft"
      fixed
      placeholder
    />
    
    <div class="content">
      <Tabs
        v-model:active="activeMainTab"
        class="main-tabs"
        color="#1989fa"
        title-active-color="#1989fa"
        swipeable
      >
        <Tab title="用户管理" name="users">
          <div class="tab-section tab-section--users">
            <!-- 搜索和筛选 -->
            <div class="search-filter">
              <div class="action-buttons action-buttons--top action-buttons--left">
                <Button type="primary" size="small" round @click="handleAddUser">
                  <Icon name="plus" size="14" />
                  添加用户
                </Button>
                <Button type="success" size="small" round @click="handleRefresh">
                  <Icon name="refresh" size="14" />
                  刷新
                </Button>
              </div>
              <Search
                v-model="searchValue"
                placeholder="搜索用户名/手机号"
                show-action
                @search="onSearch"
                @cancel="onCancelSearch"
              >
                <template #action>
                  <Button type="primary" size="small" round @click="triggerSearch">
                    搜索
                  </Button>
                </template>
              </Search>
            </div>
            
            <!-- 用户列表 -->
            <div class="user-list" v-if="!loading && userList.length > 0">
              <PullRefresh v-model="refreshing" @refresh="onRefresh">
                <div class="user-list-inner">
                  <div class="user-card" v-for="(user, index) in userList" :key="user.id || index">
                    <div class="user-header">
                      <div class="user-avatar">
                        <VanImage
                          round
                          width="50"
                          height="50"
                          :src="user.display_avatar || user.avatar || user.wechat_avatar || '/app/images/profile/default-avatar.png'"
                          fit="cover"
                        />
                      </div>
                      <div class="user-info">
                        <div class="user-name-row">
                          <span class="user-name">{{ user.name || user.wechat_nickname || user.nickname || '未设置姓名' }}</span>
                          <Tag plain type="warning" size="small" v-if="user.status === 'pending'">待审核</Tag>
                          <Tag type="primary" size="small" v-if="user.is_admin">管理员</Tag>
                          <Tag type="success" size="small" v-if="user.is_salesman">业务员</Tag>
                          <Tag type="warning" size="small" v-if="user.is_merchant">商户</Tag>
                          <Tag type="danger" size="small" v-if="user.is_vip">VIP</Tag>
                        </div>
                        <div class="user-detail">
                          <span>{{ user.phone || '未绑定手机' }}</span>
                          <span v-if="user.id" class="user-id">ID: {{ user.id }}</span>
                        </div>
                        <div class="user-meta">
                          <span>注册时间: {{ formatDate(user.created_at) }}</span>
                          <span class="user-status" :class="getStatusClass(user.status)">
                            {{ getStatusText(user.status) }}
                          </span>
                        </div>
                      </div>
                      <div class="user-actions">
                        <Icon name="arrow-down" :class="{'rotate': expandedUsers[user.id]}" @click="toggleUserDetail(user.id)" />
                      </div>
                    </div>
                    
                    <!-- 展开的用户详情 -->
                    <div class="user-details" v-show="expandedUsers[user.id]">
                      <Cell title="用户ID" :value="user.id" />
                      <Cell title="真实姓名" :value="user.name || '未设置'" />
                      <Cell title="微信昵称" :value="user.wechat_nickname || '未绑定'" />
                      <Cell title="显示名称" :value="user.name || user.wechat_nickname || user.nickname || '未设置'" />
                      <Cell title="邮箱" :value="user.email || '未设置'" />
                      <Cell title="余额" :value="user.balance ? `¥${user.balance}` : '¥0.00'" />
                      <Cell title="VIP状态" :value="user.is_vip ? '是' : '否'" />
                      <Cell title="VIP时间" :value="user.vip_at ? formatDate(user.vip_at) : '未开通'" />
                      <Cell title="推荐人" :value="user.referrer_name || '点点够'" />
                      <Cell title="最后登录" :value="formatDate(user.last_login_time) || '未登录'" />
                      <Cell title="角色">
                        <template #value>
                          <div class="role-list">
                            <Tag type="primary" plain v-if="user.is_admin">管理员</Tag>
                            <Tag type="success" plain v-if="user.is_salesman">业务员</Tag>
                            <Tag type="warning" plain v-if="user.is_merchant">商户</Tag>
                            <Tag type="default" plain v-if="user.is_engineer">工程师</Tag>
                            <Tag type="danger" plain v-if="user.is_vip">VIP会员</Tag>
                            <Tag v-if="!user.is_admin && !user.is_salesman && !user.is_merchant && !user.is_engineer && !user.is_vip">普通用户</Tag>
                          </div>
                        </template>
                      </Cell>
                      
                      <!-- 操作按钮 -->
                      <div class="user-action-buttons">
                        <Button size="small" type="primary" @click="handleEdit(user)" round>
                          <Icon name="edit" size="12" />
                          编辑
                        </Button>
                        <Button
                          size="small"
                          :type="user.status === 'active' ? 'warning' : 'success'"
                          @click="changeUserStatus(user)"
                          round
                        >
                          <Icon :name="user.status === 'active' ? 'pause-circle-o' : 'play-circle-o'" size="12" />
                          {{ user.status === 'active' ? '禁用' : '启用' }}
                        </Button>
                        <Button size="small" type="default" @click="resetPassword(user)" round>
                          <Icon name="lock" size="12" />
                          重置
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </PullRefresh>

              <div class="pagination-bar" v-if="shouldShowPagination">
                <span class="pagination-info">
                  共 {{ pagination.total }} 名用户 · 第 {{ pagination.page }} / {{ pagination.lastPage }} 页
                </span>
                <Pagination
                  v-model="pagination.page"
                  :page-count="pagination.lastPage"
                  :total-items="pagination.total"
                  :items-per-page="pagination.perPage"
                  mode="simple"
                  prev-text="上一页"
                  next-text="下一页"
                  @change="handlePageChange"
                />
              </div>
            </div>
            
            <!-- 加载状态 -->
            <div class="loading-state" v-if="loading">
              <Loading size="24px">加载中...</Loading>
            </div>
            
            <!-- 空状态 -->
            <div class="empty-state" v-if="!loading && userList.length === 0">
              <Empty description="暂无用户数据">
                <template #image>
                  <Icon name="friends-o" size="80" color="#dcdee0" />
                </template>
                <Button round type="primary" size="small" @click="onRefresh">刷新</Button>
              </Empty>
            </div>
          </div>
        </Tab>

        <Tab title="机构管理" name="institutions">
          <div class="tab-section institution-tab">
            <div class="search-filter institution-filter">
              <div class="action-buttons action-buttons--top action-buttons--right">
                <Button type="warning" size="small" round @click="openCreateInstitution">
                  <Icon name="add" size="14" />
                  新增机构
                </Button>
                <Button type="success" size="small" round @click="refreshInstitutions">
                  <Icon name="refresh" size="14" />
                  刷新
                </Button>
              </div>
              <Search
                v-model="institutionFilters.keyword"
                placeholder="搜索机构名称/编号/手机号/邀请码"
                show-action
                @search="onInstitutionSearch"
                @cancel="onInstitutionReset"
              >
                <template #action>
                  <Button type="primary" size="small" plain round @click="onInstitutionSearch">
                    搜索
                  </Button>
                </template>
              </Search>
            </div>

            <PullRefresh v-model="institutionRefreshing" @refresh="refreshInstitutions">
              <div class="institution-list" v-if="!institutionLoading && institutionList.length">
                <div class="institution-card" v-for="institution in institutionList" :key="institution.id">
                  <div class="institution-card__header">
                    <div class="institution-card__title">
                      <VanImage
                        round
                        width="48"
                        height="48"
                        :src="institution.responsible_avatar || '/app/images/profile/default-avatar.png'"
                        fit="cover"
                      />
                      <div class="institution-card__info">
                        <div class="institution-card__name">
                          {{ institution.nickname || institution.name || `机构 #${institution.id}` }}
                        </div>
                        <div class="institution-card__meta">
                          <span v-if="institution.number">编号：{{ institution.number }}</span>
                          <span v-if="institution.phone"> · 电话：{{ institution.phone }}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="small" type="primary" plain @click="openInstitutionDetail(institution)">
                      详情
                    </Button>
                  </div>

                  <div class="institution-card__footer">
                    <div class="salesman-toggle">
                      <span>美团渠道</span>
                      <Switch
                        size="20px"
                        :loading="institutionMeituanSwitching[institution.id]"
                        v-model="institution.is_meituan"
                        active-color="#1989fa"
                        inactive-color="#ccc"
                        @change="(value) => toggleMeituan(institution, value)"
                      />
                    </div>
                    <div class="salesman-toggle">
                      <span>展业权限</span>
                      <Switch
                        size="20px"
                        :loading="institutionSalesmanSwitching[institution.id]"
                        v-model="institution.salesman_enabled"
                        active-color="#07c160"
                        inactive-color="#ccc"
                        @change="(value) => toggleSalesmanPermission(institution, value)"
                      />
                      <span class="invite-code">邀请码：{{ institution.salesman_invite_code || '—' }}</span>
                    </div>
                    <span class="institution-card__region" v-if="institution.region?.text">
                      {{ institution.region.text }}
                    </span>
                    <span class="institution-card__updated" v-if="institution.balance?.updated_at">
                      余额更新：{{ institution.balance.updated_at }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="institution-empty" v-else-if="!institutionLoading">
                <Empty description="暂无机构数据">
                  <template #image>
                    <Icon name="shop-collect-o" size="80" color="#dcdee0" />
                  </template>
                </Empty>
              </div>
            </PullRefresh>

            <div class="loading-state" v-if="institutionLoading">
              <Loading size="24px">加载机构数据...</Loading>
            </div>

            <div class="pagination-bar" v-if="showInstitutionPagination">
              <span class="pagination-info">
                共 {{ institutionPagination.total }} 家机构 · 第 {{ institutionPagination.page }} / {{ institutionPagination.lastPage }} 页
              </span>
              <Pagination
                v-model="institutionPagination.page"
                :page-count="institutionPagination.lastPage"
                :total-items="institutionPagination.total"
                :items-per-page="institutionPagination.perPage"
                mode="simple"
                prev-text="上一页"
                next-text="下一页"
                @change="handleInstitutionPageChange"
              />
            </div>
          </div>
        </Tab>

        <Tab title="准客户" name="prospects">
          <div class="tab-section prospects-tab">
            <!-- 统计卡片 -->
            <div class="prospect-stats-cards">
              <div class="stat-card" @click="onProspectStatusChange('')">
                <div class="stat-value">{{ prospectStats.total }}</div>
                <div class="stat-label">总数</div>
              </div>
              <div class="stat-card stat-card--primary" @click="onProspectStatusChange('')">
                <div class="stat-value">{{ prospectStats.today_new }}</div>
                <div class="stat-label">今日新增</div>
              </div>
              <div class="stat-card stat-card--warning" @click="onProspectStatusChange('unassigned')">
                <div class="stat-value">{{ prospectStats.unassigned }}</div>
                <div class="stat-label">未分配</div>
              </div>
              <div class="stat-card stat-card--info" @click="onProspectStatusChange('pending')">
                <div class="stat-value">{{ prospectStats.pending }}</div>
                <div class="stat-label">待跟进</div>
              </div>
              <div class="stat-card stat-card--primary" @click="onProspectStatusChange('following')">
                <div class="stat-value">{{ prospectStats.following }}</div>
                <div class="stat-label">跟进中</div>
              </div>
              <div class="stat-card stat-card--success" @click="onProspectStatusChange('converted')">
                <div class="stat-value">{{ prospectStats.converted }}</div>
                <div class="stat-label">已转化</div>
              </div>
            </div>

            <div class="search-filter prospects-filter">
              <div class="action-buttons action-buttons--top action-buttons--right">
                <Button type="success" size="small" round @click="refreshProspects">
                  <Icon name="refresh" size="14" />
                  刷新
                </Button>
              </div>
              <Search
                v-model="prospectFilters.keyword"
                placeholder="搜索姓名/手机号"
                show-action
                @search="onProspectSearch"
                @cancel="onProspectReset"
              >
                <template #action>
                  <Button type="primary" size="small" plain round @click="onProspectSearch">
                    搜索
                  </Button>
                </template>
              </Search>
              <!-- 状态筛选 -->
              <div class="prospect-status-filter">
                <div 
                  class="status-tab" 
                  :class="{ active: prospectFilters.status === '' }"
                  @click="onProspectStatusChange('')"
                >全部</div>
                <div 
                  class="status-tab" 
                  :class="{ active: prospectFilters.status === 'unassigned' }"
                  @click="onProspectStatusChange('unassigned')"
                >未分配</div>
                <div 
                  class="status-tab" 
                  :class="{ active: prospectFilters.status === 'pending' }"
                  @click="onProspectStatusChange('pending')"
                >待跟进</div>
                <div 
                  class="status-tab" 
                  :class="{ active: prospectFilters.status === 'following' }"
                  @click="onProspectStatusChange('following')"
                >跟进中</div>
                <div 
                  class="status-tab" 
                  :class="{ active: prospectFilters.status === 'converted' }"
                  @click="onProspectStatusChange('converted')"
                >已转化</div>
              </div>
            </div>

            <PullRefresh v-model="prospectRefreshing" @refresh="refreshProspects">
              <div class="prospect-list" v-if="!prospectLoading && prospectList.length">
                <div class="prospect-card" v-for="prospect in prospectList" :key="prospect.id">
                  <div class="prospect-card__header">
                    <div class="prospect-card__title">
                      <VanImage
                        round
                        width="48"
                        height="48"
                        :src="prospect.avatar || '/app/images/profile/default-avatar.png'"
                        fit="cover"
                      />
                      <div class="prospect-card__info">
                        <div class="prospect-card__name">
                          {{ prospect.display_name || prospect.name || prospect.wechat_nickname || '未设置姓名' }}
                        </div>
                        <div class="prospect-card__meta">
                          <span v-if="prospect.phone">{{ prospect.phone }}</span>
                          <span v-if="prospect.register_date"> · 注册于 {{ prospect.register_date }}</span>
                        </div>
                      </div>
                    </div>
                    <Tag 
                      :type="getProspectStatusType(prospect)" 
                      size="medium"
                    >{{ getProspectStatusText(prospect) }}</Tag>
                  </div>

                  <div class="prospect-card__body" v-if="prospect.is_assigned">
                    <div class="prospect-info-row">
                      <span class="label">分配机构：</span>
                      <span class="value">{{ prospect.assigned_institution_name || '—' }}</span>
                    </div>
                    <div class="prospect-info-row">
                      <span class="label">分配时间：</span>
                      <span class="value">{{ prospect.assigned_date || '—' }}</span>
                    </div>
                  </div>

                  <div class="prospect-card__footer">
                    <Button 
                      v-if="!prospect.is_assigned"
                      size="small" 
                      type="primary" 
                      plain 
                      @click="openProspectAssignPopup(prospect)"
                    >分配</Button>
                    <Button 
                      v-else-if="prospect.assignment_status === 'pending'"
                      size="small" 
                      type="danger" 
                      plain 
                      @click="cancelProspectAssign(prospect)"
                    >取消分配</Button>
                    <Button 
                      size="small" 
                      type="default" 
                      @click="viewProspectDetail(prospect)"
                    >详情</Button>
                  </div>
                </div>
              </div>

              <div class="prospect-empty" v-else-if="!prospectLoading">
                <Empty description="暂无准客户数据">
                  <template #image>
                    <Icon name="friends-o" size="80" color="#dcdee0" />
                  </template>
                </Empty>
              </div>
            </PullRefresh>

            <div class="loading-state" v-if="prospectLoading">
              <Loading size="24px">加载准客户数据...</Loading>
            </div>

            <div class="pagination-bar" v-if="showProspectPagination">
              <span class="pagination-info">
                共 {{ prospectPagination.total }} 位准客户 · 第 {{ prospectPagination.page }} / {{ prospectPagination.lastPage }} 页
              </span>
              <Pagination
                v-model="prospectPagination.page"
                :page-count="prospectPagination.lastPage"
                :total-items="prospectPagination.total"
                :items-per-page="prospectPagination.perPage"
                mode="simple"
                prev-text="上一页"
                next-text="下一页"
                @change="handleProspectPageChange"
              />
            </div>
          </div>
        </Tab>
      </Tabs>

      <!-- 准客户分配弹窗 -->
      <Popup
        v-model:show="showProspectAssignPopup"
        position="bottom"
        :style="{ height: '60%' }"
        round
        closeable
        close-icon-position="top-right"
      >
        <div class="prospect-assign-popup">
          <div class="popup-header">
            <h3>分配准客户</h3>
            <p>为 {{ currentProspect?.display_name || currentProspect?.name || '准客户' }} 选择分配机构</p>
          </div>
          
          <div class="popup-content">
            <Search
              v-model="prospectInstitutionKeyword"
              placeholder="搜索机构名称/编号"
              @search="searchProspectInstitutions"
              @input="onProspectInstitutionInput"
            />
            
            <div class="institution-list" v-if="!prospectInstitutionLoading && prospectInstitutionList.length">
              <Cell
                v-for="inst in prospectInstitutionList"
                :key="inst.institution_number"
                :title="inst.name"
                :label="inst.phone ? `电话：${inst.phone}` : ''"
                clickable
                @click="selectProspectInstitution(inst)"
                :class="{ selected: selectedProspectInstitution?.institution_number === inst.institution_number }"
              >
                <template #right-icon>
                  <Icon 
                    v-if="selectedProspectInstitution?.institution_number === inst.institution_number" 
                    name="success" 
                    color="#1989fa" 
                  />
                </template>
              </Cell>
            </div>
            
            <div class="loading-state" v-if="prospectInstitutionLoading">
              <Loading size="20px">搜索中...</Loading>
            </div>
            
            <Empty v-if="!prospectInstitutionLoading && !prospectInstitutionList.length && prospectInstitutionKeyword" description="未找到匹配的机构" />
          </div>
          
          <div class="popup-footer">
            <Button 
              block 
              type="primary" 
              :disabled="!selectedProspectInstitution" 
              :loading="prospectAssigning"
              @click="confirmProspectAssign"
            >确认分配</Button>
          </div>
        </div>
      </Popup>

      <!-- 准客户详情弹窗 -->
      <Popup
        v-model:show="showProspectDetailPopup"
        position="bottom"
        :style="{ height: '70%' }"
        round
        closeable
        close-icon-position="top-right"
      >
        <div class="prospect-detail-popup" v-if="prospectDetail">
          <div class="detail-header">
            <VanImage
              round
              width="60"
              height="60"
              :src="prospectDetail.avatar || '/app/images/profile/default-avatar.png'"
              fit="cover"
            />
            <div class="detail-info">
              <div class="detail-name">{{ prospectDetail.name || prospectDetail.wechat_nickname || '未设置姓名' }}</div>
              <div class="detail-phone">{{ prospectDetail.phone || '未绑定手机' }}</div>
              <Tag :type="getProspectStatusType(prospectDetail)" size="medium">
                {{ prospectDetail.assignment_status_text || '未分配' }}
              </Tag>
            </div>
          </div>
          
          <CellGroup title="基本信息">
            <Cell title="微信昵称" :value="prospectDetail.wechat_nickname || '—'" />
            <Cell title="推荐人" :value="prospectDetail.referrer_name || '点点够'" />
            <Cell title="注册时间" :value="prospectDetail.register_date || '—'" />
            <Cell title="注册天数" :value="prospectDetail.register_days ? `${prospectDetail.register_days}天` : '—'" />
          </CellGroup>
          
          <CellGroup title="分配信息" v-if="prospectDetail.is_assigned">
            <Cell title="分配机构" :value="prospectDetail.assigned_institution_name || '—'" />
            <Cell title="分配时间" :value="prospectDetail.assigned_date || '—'" />
            <Cell title="跟进次数" :value="prospectDetail.follow_count ? `${prospectDetail.follow_count}次` : '0次'" />
            <Cell title="最近跟进" :value="prospectDetail.last_follow_at || '—'" />
          </CellGroup>
          
          <div class="detail-actions" v-if="prospectDetail.is_assigned && prospectDetail.assignment_status === 'pending'">
            <Button 
              block 
              type="danger" 
              plain
              @click="cancelProspectAssign(prospectDetail)"
            >取消分配</Button>
          </div>
        </div>
      </Popup>
      <Popup
        v-model:show="showCreateInstitution"
        position="bottom"
        :style="{ height: '90%' }"
        round
        closeable
        close-icon-position="top-right"
        :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }"
      >
        <div class="create-institution-wizard">
          <!-- 步骤指示器 -->
          <div class="wizard-header">
            <div class="header-content">
              <div class="header-title">
                <Icon name="shop" size="24" color="#ee0a24" />
                <h3>新增机构</h3>
              </div>
              <div class="wizard-steps">
                <div class="step-item" :class="{ 'active': currentStep === 1, 'completed': currentStep > 1 }">
                  <div class="step-number">1</div>
                  <span class="step-label">基本信息</span>
                </div>
                <div class="step-line"></div>
                <div class="step-item" :class="{ 'active': currentStep === 2, 'completed': currentStep > 2 }">
                  <div class="step-number">2</div>
                  <span class="step-label">机构设置</span>
                </div>
                <div class="step-line"></div>
                <div class="step-item" :class="{ 'active': currentStep === 3, 'completed': currentStep > 3 }">
                  <div class="step-number">3</div>
                  <span class="step-label">地区权限</span>
                </div>
              </div>
            </div>
          </div>

          <div class="wizard-content">
            <!-- 步骤1：基本信息 -->
            <div v-show="currentStep === 1" class="wizard-step">
              <div class="step-header">
                <Icon name="user-o" size="20" color="#1989fa" />
                <h4>基本信息</h4>
                <p>请填写机构负责人的基本信息</p>
              </div>
              
              <div class="form-section">
                <div class="form-group-enhanced">
                  <div class="form-field-wrapper">
                    <Field
                      v-model="createInstitutionForm.name"
                      label="负责人姓名"
                      placeholder="请输入真实姓名"
                      :rules="[{ required: true, message: '请输入负责人姓名' }]"
                      left-icon="user-o"
                      class="enhanced-field"
                    />
                  </div>
                  
                  <div class="form-field-wrapper">
                    <Field
                      v-model="createInstitutionForm.institution_name"
                      label="机构名称"
                      placeholder="请输入机构名称"
                      :rules="[{ required: true, message: '请输入机构名称' }]"
                      left-icon="contact"
                      class="enhanced-field"
                    />
                  </div>
                  
                  <div class="form-field-wrapper">
                    <Field
                      v-model="createInstitutionForm.phone"
                      label="手机号"
                      placeholder="请输入11位手机号"
                      type="tel"
                      maxlength="11"
                      :rules="[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }
                      ]"
                      left-icon="phone-o"
                      @update:model-value="onCreateInstitutionPhoneChange"
                      class="enhanced-field"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤2：机构设置 -->
            <div v-show="currentStep === 2" class="wizard-step">
              <div class="step-header">
                <Icon name="setting-o" size="20" color="#07c160" />
                <h4>机构设置</h4>
                <p>配置机构相关设置信息</p>
              </div>
              
              <div class="form-section">
                <div class="form-group-enhanced">
                  <div class="form-field-wrapper">
                    <Field
                      v-model="createInstitutionForm.number"
                      label="机构编号"
                      placeholder="默认同步手机号"
                      readonly
                      left-icon="certificate"
                      class="enhanced-field"
                      input-align="right"
                    >
                      <template #right-icon>
                        <span class="auto-sync-hint">自动同步</span>
                      </template>
                    </Field>
                  </div>
                  
                  <div class="form-field-wrapper">
                    <Field
                      v-model="createInstitutionForm.xs_number"
                      label="新生机构号"
                      placeholder="默认同步手机号"
                      readonly
                      left-icon="idcard"
                      class="enhanced-field"
                      input-align="right"
                    >
                      <template #right-icon>
                        <span class="auto-sync-hint">自动同步</span>
                      </template>
                    </Field>
                  </div>
                  
                  <div class="form-field-wrapper parent-institution-field">
                    <div class="field-header">
                      <Icon name="friends" size="16" color="#ff976a" />
                      <span>上级机构</span>
                      <span class="field-tip">可选项，留空则为顶级机构</span>
                    </div>
                    <div class="institution-selector" @click="openParentInstitutionPicker">
                      <div class="selector-display">
                        <div class="selector-placeholder" v-if="!selectedParentInstitution.id">
                          <Icon name="plus" size="16" color="#c8c9cc" />
                          <span>选择上级机构</span>
                        </div>
                        <div class="selector-value" v-else>
                          <div class="institution-info">
                            <div class="institution-name">{{ selectedParentInstitution.name }}</div>
                            <div class="institution-detail">编号：{{ selectedParentInstitution.number || '—' }}</div>
                          </div>
                          <Button size="mini" type="default" @click.stop="clearParentInstitution">
                            <Icon name="close" size="14" />
                          </Button>
                        </div>
                      </div>
                      <Icon name="arrow" size="16" color="#c8c9cc" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 步骤3：地区权限 -->
            <div v-show="currentStep === 3" class="wizard-step">
              <div class="step-header">
                <Icon name="location-o" size="20" color="#ee0a24" />
                <h4>地区权限</h4>
                <p>选择机构所在地区和权限设置</p>
              </div>
              
              <div class="form-section">
                <div class="region-selector-enhanced">
                  <div class="region-header">
                    <Icon name="location-o" size="16" color="#1989fa" />
                    <span>地区选择</span>
                    <span class="required-mark">*</span>
                  </div>
                  <div class="region-grid">
                    <div class="region-item" @click="openProvincePicker">
                      <div class="region-label">省份</div>
                      <div class="region-value">
                        <span v-if="createInstitutionForm.province_name">{{ createInstitutionForm.province_name }}</span>
                        <span v-else class="region-placeholder">请选择省份</span>
                        <Icon name="arrow" size="14" />
                      </div>
                    </div>
                    <div class="region-item" @click="openCityPicker" :class="{ disabled: !createInstitutionForm.province_id }">
                      <div class="region-label">城市</div>
                      <div class="region-value">
                        <span v-if="createInstitutionForm.city_name">{{ createInstitutionForm.city_name }}</span>
                        <span v-else class="region-placeholder">请选择城市</span>
                        <Icon name="arrow" size="14" />
                      </div>
                    </div>
                    <div class="region-item" @click="openDistrictPicker" :class="{ disabled: !createInstitutionForm.city_id }">
                      <div class="region-label">区县</div>
                      <div class="region-value">
                        <span v-if="createInstitutionForm.district_name">{{ createInstitutionForm.district_name }}</span>
                        <span v-else class="region-placeholder">请选择区县</span>
                        <Icon name="arrow" size="14" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="permissions-section">
                  <div class="permissions-header">
                    <Icon name="setting-o" size="16" color="#07c160" />
                    <span>权限设置</span>
                  </div>
                  <CellGroup inset class="enhanced-switch-group">
                    <Cell center title="业务员权限" label="允许机构开展业务员相关业务">
                      <template #right-icon>
                        <Switch 
                          v-model="createInstitutionForm.salesman_enabled" 
                          size="22px"
                          active-color="#07c160"
                          inactive-color="#ebedf0"
                        />
                      </template>
                    </Cell>
                  </CellGroup>
                </div>
              </div>
            </div>
          </div>

          <div class="wizard-footer">
            <div class="step-navigation">
              <div class="step-actions-inline">
                <Button 
                  v-if="currentStep > 1" 
                  type="default" 
                  round 
                  @click="previousStep"
                  class="prev-btn"
                >
                  <Icon name="arrow-left" size="16" />
                  上一步
                </Button>
                <Button 
                  v-if="currentStep < 3" 
                  type="primary" 
                  round 
                  @click="nextStep"
                  class="next-btn"
                >
                  下一步
                  <Icon name="arrow" size="16" />
                </Button>
                <Button 
                  v-if="currentStep === 3" 
                  type="primary" 
                  round 
                  @click="submitCreateInstitution"
                  class="submit-btn"
                  :loading="formSubmitting"
                >
                  <Icon name="success" size="16" />
                  完成创建
                </Button>
              </div>
            </div>
            <Button block round plain @click="showCreateInstitution = false" class="cancel-btn">
              取消
            </Button>
          </div>
        </div>
      </Popup>

      <!-- 机构详情 -->
      <Popup
        v-model:show="institutionDetail.show"
        position="bottom"
        :style="{ height: '78%' }"
        round
        closeable
        close-icon-position="top-right"
      >
        <div class="institution-detail" v-if="institutionDetail.data">
          <div class="detail-sheet">
            <section class="sheet-header">
              <div class="sheet-header__left">
                <VanImage
                  class="sheet-header__avatar"
                  round
                  width="52"
                  height="52"
                  :src="institutionDetail.data.responsible_avatar || '/app/images/profile/default-avatar.png'"
                  fit="cover"
                />
                <div>
                  <div class="name">{{ institutionDetail.data.nickname || institutionDetail.data.name || '未命名机构' }}</div>
                  <div class="meta">
                    <span>编号：{{ institutionDetail.data.number || '—' }}</span>
                    <span v-if="institutionRegionLine">地区：{{ institutionRegionLine }}</span>
                  </div>
                  <div class="tags">
                    <Tag size="small" type="primary">{{ institutionDetail.data.status_text || '—' }}</Tag>
                    <Tag v-if="institutionDetail.data.is_meituan" size="small" plain type="success">美团渠道</Tag>
                    <Tag v-if="institutionDetail.data.salesman_enabled" size="small" plain type="warning">展业权限</Tag>
                  </div>
                </div>
              </div>
              <div class="sheet-header__right">
                <div>
                  <div class="label">邀请码</div>
                  <div class="value">{{ institutionDetail.data.salesman_invite_code || '—' }}</div>
                </div>
                <div>
                  <div class="label">联系电话</div>
                  <div class="value">{{ institutionDetail.data.phone || '—' }}</div>
                </div>
              </div>
            </section>

            <section class="sheet-metrics" v-if="detailStatBlocks.length">
              <div class="metric" v-for="stat in detailStatBlocks" :key="stat.label">
                <div class="metric-label">{{ stat.label }}</div>
                <div class="metric-value">{{ stat.value }}</div>
                <div class="metric-desc">{{ stat.desc }}</div>
              </div>
            </section>

            <section class="sheet-info">
              <div class="info-block">
                <div class="info-title">层级关系</div>
                <div class="info-row no-border">
                  <span>层级链路</span>
                  <div class="value-actions hierarchy-row">
                    <div class="hierarchy-text">
                      <Loading v-if="institutionDetail.hierarchyLoading" size="16px" type="spinner">加载中</Loading>
                      <span v-else>{{ institutionHierarchyText }}</span>
                    </div>
                    <Button size="mini" type="primary" plain @click="handleEditParentInstitution" :loading="parentChangeLoading">
                      {{ parentChangeLoading ? '处理中' : '更换' }}
                    </Button>
                  </div>
                </div>
              </div>

              <div class="info-block">
                <div class="info-title">基本信息</div>
                <div class="info-row">
                  <span>负责人</span>
                  <span>{{ institutionDetail.data.responsible_name || institutionDetail.data.responsible || '—' }}</span>
                </div>
                <div class="info-row">
                  <span>创建时间</span>
                  <span>{{ formatDate(institutionDetail.data.created_at) || '—' }}</span>
                </div>
              </div>

              <div class="info-block">
                <div class="info-title">渠道与权限</div>
                <div class="tag-grid">
                  <span :class="['chip', { active: institutionDetail.data.is_meituan }]">美团：{{ institutionDetail.data.is_meituan ? '已开通' : '未开通' }}</span>
                  <span :class="['chip', { active: institutionDetail.data.salesman_enabled }]">展业：{{ institutionDetail.data.salesman_enabled ? '已开启' : '未开启' }}</span>
                  <span class="chip muted">直属商户 {{ formatNumber(institutionDetail.data.merchant_stats?.direct || 0) }}</span>
                  <span class="chip muted">团队商户 {{ formatNumber(institutionDetail.data.merchant_stats?.team || institutionDetail.data.merchant_stats?.total || 0) }}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Popup>
      
      <!-- 编辑用户弹窗 -->
      <Popup
        v-model:show="showEditDialog"
        position="bottom"
        :style="{ height: '90%' }"
        round
        closeable
        close-icon-position="top-right"
        :overlay-style="{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }"
      >
        <div class="edit-popup">
          <div class="popup-header">
            <div class="header-content">
              <div class="header-title">
                <Icon :name="isEditing ? 'edit' : 'plus'" size="20" color="#1989fa" />
                <h3>{{ isEditing ? '编辑用户' : '添加用户' }}</h3>
              </div>
              <div class="header-subtitle">
                {{ isEditing ? `用户ID: ${editForm.id}` : '创建新用户账号' }}
              </div>
            </div>
          </div>

          <div class="popup-content">
            <Tabs v-model:active="activeTab" sticky color="#1989fa" title-active-color="#1989fa">
              <!-- 基本信息 -->
              <Tab title="基本信息" name="basic">
                <div class="form-section">
                  <Form ref="basicFormRef" :label-width="80">
                    <!-- 用户头像预览 -->
                    <div class="avatar-section" v-if="isEditing">
                      <div class="avatar-container">
                        <VanImage
                          round
                          width="80"
                          height="80"
                          :src="editForm.wechat_avatar || editForm.avatar || '/app/images/profile/default-avatar.png'"
                          fit="cover"
                          class="user-avatar-large"
                        />
                        <div class="avatar-info">
                          <div class="avatar-name">{{ editForm.name || editForm.wechat_nickname || '未设置姓名' }}</div>
                          <div class="avatar-id">ID: {{ editForm.id }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- 基本信息表单 -->
                    <div class="form-group">
                      <div class="group-title">
                        <Icon name="contact" size="16" color="#1989fa" />
                        <span>基本信息</span>
                      </div>
                      <Field
                        v-model="editForm.name"
                        label="真实姓名"
                        placeholder="请输入真实姓名"
                        :rules="[{ required: true, message: '请输入真实姓名' }]"
                        left-icon="user-o"
                      />
                      <Field
                        v-model="editForm.phone"
                        label="手机号"
                        placeholder="请输入手机号"
                        :rules="[
                          { required: true, message: '请输入手机号' },
                          { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                        ]"
                        left-icon="phone-o"
                      />
                      <Field
                        v-model="editForm.email"
                        label="登录名"
                        placeholder="默认为手机号"
                        left-icon="envelop-o"
                      />
                      <Field
                        v-model="editForm.password"
                        label="密码"
                        type="password"
                        placeholder="默认为123456，不修改请留空"
                        left-icon="lock"
                      />
                      <Field
                        v-model="editForm.gender"
                        label="性别"
                        is-link
                        readonly
                        @click="showGenderPicker = true"
                        :value="getGenderText(editForm.gender)"
                        left-icon="friends-o"
                      />
                      <Field
                        v-model="editForm.birthday"
                        label="生日"
                        placeholder="请选择生日"
                        is-link
                        readonly
                        @click="showDatePicker = true"
                        left-icon="calendar-o"
                      />
                      <Field
                        v-model="editForm.status"
                        label="状态"
                        is-link
                        readonly
                        @click="showStatusPicker = true"
                        :value="getStatusText(editForm.status)"
                        left-icon="setting-o"
                      />
                    </div>

                    <!-- 推荐人信息 -->
                    <div class="form-group">
                      <div class="group-title">
                        <Icon name="friends" size="16" color="#1989fa" />
                        <span>推荐人信息</span>
                      </div>

                      <div
                        class="referrer-card"
                        :class="[
                          `referrer-card--${referrerMeta.status}`,
                          { 'referrer-card--error': !!referrerError }
                        ]"
                        @click="openReferrerPicker"
                      >
                        <div class="referrer-card__header">
                          <div class="referrer-card__title">
                            <Icon name="user-circle-o" size="16" color="#1989fa" />
                            <span>推荐人</span>
                          </div>
                          <span class="referrer-card__status" :class="referrerStatusClass">
                            {{ referrerStatusText }}
                          </span>
                        </div>
                        <div class="referrer-card__body">
                          <VanImage
                            round
                            width="48"
                            height="48"
                            :src="referrerMeta.avatar"
                            fit="cover"
                          />
                          <div class="referrer-card__info">
                            <div class="referrer-card__name">{{ referrerMeta.primary }}</div>
                            <div class="referrer-card__detail">{{ referrerMeta.secondary }}</div>
                          </div>
                          <div class="referrer-card__actions">
                            <span
                              v-if="referrerMeta.tag"
                              class="referrer-card__tag"
                              :class="referrerMeta.tagClass"
                            >
                              {{ referrerMeta.tag }}
                            </span>
                            <Icon name="arrow" size="16" color="#c8c9cc" />
                          </div>
                        </div>
                      </div>
                      <div v-if="referrerError" class="referrer-error-text">{{ referrerError }}</div>
                    </div>
                  </Form>
                </div>
              </Tab>

              <!-- 角色信息 -->
              <Tab title="角色信息" name="roles">
                <Form>
                  <Cell title="用户角色">
                    <template #value>
                      <div class="role-checkboxes">
                        <Checkbox v-model="editForm.is_pay_institution">支付机构</Checkbox>
                        <Checkbox v-model="editForm.is_water_purifier_user">净水器用户</Checkbox>
                        <Checkbox v-model="editForm.is_engineer">工程师</Checkbox>
                        <Checkbox v-model="editForm.is_water_purifier_agent">净水器渠道商</Checkbox>
                        <Checkbox v-model="editForm.is_pay_merchant">支付商户</Checkbox>
                        <Checkbox v-model="editForm.is_vip">VIP会员</Checkbox>
                        <Checkbox v-model="editForm.is_admin">管理员</Checkbox>
                      </div>
                    </template>
                  </Cell>

                  <!-- VIP会员信息 -->
                  <div v-if="editForm.is_vip" class="vip-section">
                    <Divider>VIP会员信息</Divider>
                    <Field
                      v-model="editForm.vip_at"
                      label="VIP开通时间"
                      placeholder="请选择VIP开通时间"
                      is-link
                      readonly
                      @click="showVipDatePicker = true"
                    />
                    <Field
                      v-model="editForm.is_vip_paid"
                      label="VIP付款状态"
                      is-link
                      readonly
                      @click="showVipPaidPicker = true"
                      :value="editForm.is_vip_paid ? '已完款' : '未完款'"
                    />
                    <Field
                      v-if="editForm.is_vip_paid"
                      v-model="editForm.vip_paid_at"
                      label="VIP完款时间"
                      placeholder="请选择VIP完款时间"
                      is-link
                      readonly
                      @click="showVipPaidDatePicker = true"
                    />
                  </div>

                  <!-- 支付机构信息 -->
                  <div v-if="editForm.is_pay_institution" class="institution-section">
                    <Divider>支付机构信息</Divider>
                    <Field v-model="editForm.institution_name" label="机构名称" placeholder="请输入机构名称" />
                    <Field v-model="editForm.institution_number" label="机构号" placeholder="请输入机构号" />
                    <Field v-model="editForm.institution_xs_number" label="新机构号" placeholder="请输入新机构号" />
                    <Field v-model="editForm.institution_lv" label="分润等级" placeholder="请输入分润等级" />
                  </div>

                  <!-- 工程师信息 -->
                  <div v-if="editForm.is_engineer" class="engineer-section">
                    <Divider>工程师信息</Divider>
                    <Field v-model="editForm.engineer_id" label="工程师ID" placeholder="请输入工程师ID" />
                  </div>
                </Form>
              </Tab>

              <!-- 微信信息 -->
              <Tab title="微信信息" name="wechat">
                <Form>
                  <Field v-model="editForm.wechat_nickname" label="微信昵称" placeholder="微信昵称" readonly />
                  <Field v-model="editForm.wechat_gender" label="微信性别" readonly :value="getGenderText(editForm.wechat_gender)" />
                  <Field v-model="editForm.wechat_country" label="微信国家" placeholder="微信国家" readonly />
                  <Field v-model="editForm.wechat_province" label="微信省份" placeholder="微信省份" readonly />
                  <Field v-model="editForm.wechat_city" label="微信城市" placeholder="微信城市" readonly />
                  <Cell title="微信头像">
                    <template #value>
                      <div v-if="editForm.wechat_avatar" class="avatar-preview">
                        <img :src="editForm.wechat_avatar" alt="微信头像" class="wechat-avatar" />
                      </div>
                      <span v-else class="no-avatar">无头像</span>
                    </template>
                  </Cell>
                </Form>
              </Tab>
            </Tabs>
          </div>

          <div class="popup-footer">
            <Button block type="primary" @click="confirmEdit" :loading="submitting">
              {{ isEditing ? '保存修改' : '创建用户' }}
            </Button>
          </div>
        </div>
      </Popup>

      <!-- 推荐人选择弹窗 -->
      <Popup
        v-model:show="showReferrerPicker"
        position="bottom"
        :style="{ height: '70%' }"
        round
        closeable
        close-icon-position="top-right"
      >
        <div class="referrer-picker">
          <div class="picker-header">
            <h3>选择推荐人</h3>
            <div class="picker-subtitle">为用户选择推荐人</div>
          </div>

          <div class="picker-search">
            <Search
              v-model="referrerSearchValue"
              placeholder="搜索推荐人姓名/手机号/ID"
              @search="searchReferrersFunc"
              @update:model-value="onReferrerSearchInput"
              show-action
            >
              <template #action>
                <Button size="small" type="primary" plain round @click="handleReferrerSearchClick">
                  搜索
                </Button>
              </template>
            </Search>
            <div class="picker-meta">
              <span>{{ referrerResultSummary }}</span>
              <span v-if="referrerMeta.status !== 'empty'" class="picker-meta__current">
                当前：{{ referrerMeta.primary }}
              </span>
            </div>
          </div>

          <div class="picker-content">
            <!-- 官方推荐选项 -->
            <div class="official-option">
              <Cell
                center
                clickable
                @click="selectReferrer({ id: 0, name: '点点够官方', phone: '', avatar: '/app/images/logo.png' })"
                :class="{ 'selected': editForm.referrer_id === 0 }"
              >
                <template #icon>
                  <div class="official-avatar">
                    <VanImage
                      round
                      width="40"
                      height="40"
                      src="/app/images/logo.png"
                      fit="cover"
                    />
                  </div>
                </template>
                <template #title>
                  <div class="referrer-name">点点够官方</div>
                  <div class="referrer-detail">官方推荐</div>
                </template>
                <template #right-icon>
                  <Icon v-if="editForm.referrer_id === 0" name="success" color="#1989fa" />
                </template>
              </Cell>
            </div>

            <!-- 推荐人列表 -->
            <div class="referrer-list">
              <div v-if="referrerListLoading" class="loading-container">
                <Loading type="spinner" color="#1989fa">加载中...</Loading>
              </div>

              <div v-else-if="referrerList.length === 0" class="empty-container">
                <Empty description="暂无推荐人数据" />
              </div>

              <div v-else>
                <Cell
                  v-for="referrer in referrerList"
                  :key="referrer.id"
                  center
                  clickable
                  @click="selectReferrer(referrer)"
                  :class="{ 'selected': editForm.referrer_id === referrer.id }"
                >
                  <template #icon>
                    <VanImage
                      round
                      width="40"
                      height="40"
                      :src="referrer.wechat_avatar || referrer.avatar || '/app/images/profile/default-avatar.png'"
                      fit="cover"
                    />
                  </template>
                  <template #title>
                    <div class="referrer-name">{{ referrer.name || referrer.wechat_nickname || '未设置姓名' }}</div>
                    <div class="referrer-detail">
                      <span class="referrer-phone">{{ referrer.phone || '未绑定手机' }}</span>
                      <span class="referrer-id">ID: {{ referrer.id }}</span>
                    </div>
                  </template>
                  <template #right-icon>
                    <Icon v-if="editForm.referrer_id === referrer.id" name="success" color="#1989fa" />
                  </template>
                </Cell>
              </div>
            </div>
          </div>

          <div class="picker-footer">
            <Button block type="primary" @click="confirmReferrerSelection">
              确认选择
            </Button>
          </div>
        </div>
      </Popup>

      <!-- 性别选择器 -->
      <Popup v-model:show="showGenderPicker" position="bottom">
        <Picker
          :columns="genderColumns"
          @confirm="onGenderConfirm"
          @cancel="showGenderPicker = false"
        />
      </Popup>

      <!-- 状态选择器 -->
      <Popup v-model:show="showStatusPicker" position="bottom">
        <Picker
          :columns="statusColumns"
          @confirm="onStatusConfirm"
          @cancel="showStatusPicker = false"
        />
      </Popup>

      <!-- 日期选择器 -->
      <Popup v-model:show="showDatePicker" position="bottom">
        <DatePicker
          v-model="birthdayPickerValue"
          title="选择生日"
          :min-date="birthdayMinDate"
          :max-date="birthdayMaxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </Popup>

      <!-- VIP开通时间选择器 -->
      <Popup v-model:show="showVipDatePicker" position="bottom">
        <DatePicker
          type="datetime"
          @confirm="onVipDateConfirm"
          @cancel="showVipDatePicker = false"
        />
      </Popup>

      <!-- VIP付款状态选择器 -->
      <Popup v-model:show="showVipPaidPicker" position="bottom">
        <Picker
          :columns="vipPaidColumns"
          @confirm="onVipPaidConfirm"
          @cancel="showVipPaidPicker = false"
        />
      </Popup>

      <!-- VIP完款时间选择器 -->
      <Popup v-model:show="showVipPaidDatePicker" position="bottom">
        <DatePicker
          type="datetime"
          @confirm="onVipPaidDateConfirm"
          @cancel="showVipPaidDatePicker = false"
        />
      </Popup>

      <Popup v-model:show="showProvincePicker" position="bottom">
        <Picker
          :columns="provinceColumns"
          :loading="regionLoading.provinces"
          @confirm="onProvinceConfirm"
          @cancel="showProvincePicker = false"
        />
      </Popup>
      <Popup v-model:show="showCityPicker" position="bottom">
        <Picker
          :columns="cityColumns"
          :loading="regionLoading.cities"
          @confirm="onCityConfirm"
          @cancel="showCityPicker = false"
        />
      </Popup>
      <Popup v-model:show="showDistrictPicker" position="bottom">
        <Picker
          :columns="districtColumns"
          :loading="regionLoading.districts"
          @confirm="onDistrictConfirm"
          @cancel="showDistrictPicker = false"
        />
      </Popup>
      
      <!-- 上级机构选择弹窗 -->
      <Popup
        v-model:show="showParentInstitutionPicker"
        position="bottom"
        :style="{ height: '70%' }"
        round
        closeable
        close-icon-position="top-right"
      >
        <div class="parent-institution-picker">
          <div class="picker-header">
            <h3>选择上级机构</h3>
            <div class="picker-subtitle">为机构选择上级机构</div>
          </div>

          <div class="picker-search">
            <Search
              v-model="parentInstitutionSearchValue"
              placeholder="搜索机构名称"
              @search="onParentInstitutionSearch"
              @input="onParentInstitutionInput"
              show-action
            >
              <template #action>
                <Button 
                  v-if="parentInstitutionSearchValue" 
                  size="mini" 
                  type="default" 
                  @click="clearParentInstitutionSearch"
                  style="margin-right: 8px;"
                >
                  清除
                </Button>
                <Button size="small" type="primary" plain round @click="onParentInstitutionSearch">
                  搜索
                </Button>
              </template>
            </Search>
            <div class="picker-meta">
              <span v-if="parentInstitutionSearchValue">
                搜索“{{ parentInstitutionSearchValue }}”找到 {{ parentInstitutionList.length }} 个结果
              </span>
              <span v-else>
                共 {{ parentInstitutionList.length }} 个可选机构
              </span>
              <span v-if="selectedParentInstitution.name" class="picker-meta__current">
                已选择：{{ selectedParentInstitution.name }}
              </span>
            </div>
          </div>

          <div class="picker-content">
            <!-- 无上级机构选项 -->
            <div class="no-parent-option">
              <Cell
                center
                clickable
                @click="clearParentInstitution"
                :class="{ 'selected': !pickerSelectedId }"
              >
                <template #icon>
                  <div class="no-parent-avatar">
                    <Icon name="shop-o" size="24" color="#969799" />
                  </div>
                </template>
                <template #title>
                  <div class="institution-name">无上级机构</div>
                  <div class="institution-detail">顶级机构</div>
                </template>
                <template #right-icon>
                  <Icon v-if="!pickerSelectedId" name="success" color="#1989fa" />
                </template>
              </Cell>
            </div>

            <!-- 上级机构列表 -->
            <div class="parent-institution-list">
              <div v-if="parentInstitutionLoading" class="loading-container">
                <Loading type="spinner" color="#1989fa">加载中...</Loading>
              </div>

              <div v-else-if="parentInstitutionList.length === 0" class="empty-container">
                <Empty description="暂无机构数据" />
              </div>

              <div v-else>
                <Cell
                  v-for="institution in parentInstitutionList"
                  :key="institution.id"
                  center
                  clickable
                  @click="selectParentInstitution(institution)"
                  :class="{ 'selected': pickerSelectedId === institution.id }"
                >
                  <template #icon>
                    <div class="institution-avatar">
                      <VanImage
                        round
                        width="40"
                        height="40"
                        :src="institution.avatar"
                        fit="cover"
                        @error="$event.target.src = '/app/images/profile/default-avatar.png'"
                      />
                    </div>
                  </template>
                  <template #title>
                    <div class="institution-name">
                      <span class="institution-name__text">
                        {{ institution.name || institution.nickname || '未命名机构' }}
                      </span>
                    </div>
                    <div class="institution-brief">
                      <span v-if="institution.number" class="institution-number">
                        编号：{{ institution.number }}
                      </span>
                      <span v-if="institution.phone" class="institution-phone">
                        手机号：{{ institution.phone }}
                      </span>
                    </div>
                  </template>
                  <template #right-icon>
                    <Icon v-if="selectedParentInstitution.id === institution.id" name="success" color="#1989fa" />
                  </template>
                </Cell>
              </div>
            </div>
          </div>

          <div class="picker-footer">
            <Button block type="primary" @click="showParentInstitutionPicker = false">
              确认选择
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  NavBar,
  Search,
  Loading,
  Empty,
  Tag,
  Dialog,
  Form,
  Field,
  Cell,
  CellGroup,
  Button,
  Icon,
  DropdownMenu,
  DropdownItem,
  PullRefresh,
  Pagination,
  Image as VanImage,
  Checkbox,
  Popup,
  Tabs,
  Tab,
  Switch,
  Picker,
  DatePicker,
  Divider,
  showToast,
  showSuccessToast,
  showConfirmDialog,
  showFailToast
} from 'vant'
import dayjs from 'dayjs'
import request from '@/utils/request'
import {
  getUserList as getAdminUserList,
  createUser as createAdminUser,
  updateUser as updateAdminUser,
  deleteUser as deleteAdminUser,
  updateUserStatus as updateAdminUserStatus,
  resetUserPassword as resetAdminUserPassword,
  getUserOrders as getAdminUserOrders,
  getUserDevices as getAdminUserDevices,
  validateReferrer,
  getReferrerInfo,
  searchReferrers
} from '@/api/user'
import {
  searchInstitutions,
  createInstitution,
  updateInstitution,
  getInstitutionDetail,
  toggleInstitutionSalesman,
  toggleInstitutionMeituan,
  getInstitutionProvinces,
  getInstitutionCities,
  getInstitutionDistricts
} from '@/api/institution'

const router = useRouter()
const activeMainTab = ref('users')
const searchValue = ref('')
const loading = ref(true)
const refreshing = ref(false)
const userList = ref([])
const expandedUsers = reactive({})
const pagination = reactive({
  page: 1,
  perPage: 10,
  lastPage: 1,
  total: 0
})
const showEditDialog = ref(false)
const isEditing = ref(false)
const activeTab = ref('basic')
const submitting = ref(false)

const institutionList = ref([])
const institutionLoading = ref(false)
const institutionRefreshing = ref(false)
const institutionLoaded = ref(false)
const institutionSalesmanSwitching = reactive({})
const institutionMeituanSwitching = reactive({})
const institutionFilters = reactive({
  keyword: '',
  status: 'all',
  type: 'all',
  sortBy: 'created_at_desc'
})
const institutionPagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
  lastPage: 1
})

const showCreateInstitution = ref(false)
const currentStep = ref(1)
const formSubmitting = ref(false)
const createInstitutionForm = reactive({
  name: '',
  institution_name: '',
  phone: '',
  number: '',
  xs_number: '',
  province_id: '',
  province_name: '',
  city_id: '',
  city_name: '',
  district_id: '',
  district_name: '',
  salesman_enabled: true,
  parent_institution_id: '',
  parent_institution_name: ''
})
const regionOptions = reactive({
  provinces: [],
  cities: [],
  districts: []
})
const regionLoading = reactive({
  provinces: false,
  cities: false,
  districts: false
})
const showProvincePicker = ref(false)
const showCityPicker = ref(false)
const showDistrictPicker = ref(false)
const showParentInstitutionPicker = ref(false)
const parentInstitutionSearchValue = ref('')
const parentInstitutionList = ref([])
const parentInstitutionLoading = ref(false)
const selectedParentInstitution = reactive({
  id: '',
  name: '',
  number: ''
})
const parentPickerMode = ref('create')
const parentPickerTarget = ref(null)
const detailParentSelection = reactive({
  id: '',
  name: '',
  number: ''
})
const parentChangeLoading = ref(false)
const pickerSelectedId = computed(() => {
  return parentPickerMode.value === 'detail'
    ? detailParentSelection.id
    : selectedParentInstitution.id
})
let searchTimeout = null
const normalizeRegionId = (value) => {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const officialReferrer = {
  id: 0,
  name: '点点够官方',
  phone: '',
  avatar: '/app/images/logo.png'
}

// 推荐人验证状态
const referrerValidating = ref(false)
const referrerError = ref('')
const referrerInfo = ref(null)

// 推荐人选择器状态
const showReferrerPicker = ref(false)
const referrerSearchValue = ref('')
const referrerList = ref([])
const referrerListLoading = ref(false)
const currentReferrerInfo = ref(null)
const handleReferrerSearchClick = () => {
  searchReferrersFunc(referrerSearchValue.value)
}
const referrerResultSummary = computed(() => {
  if (referrerListLoading.value) {
    return '正在加载推荐人列表...'
  }
  const keyword = referrerSearchValue.value.trim()
  const count = referrerList.value.length
  if (keyword) {
    return `找到 ${count} 条与 "${keyword}" 匹配的结果`
  }
  return `可选推荐人 ${count} 人`
})


const showInstitutionPagination = computed(() => {
  return institutionPagination.lastPage > 1 && institutionPagination.total > institutionPagination.perPage
})

// ========== 准客户管理相关状态 ==========
const prospectList = ref([])
const prospectLoading = ref(false)
const prospectRefreshing = ref(false)
const prospectLoaded = ref(false)
const prospectFilters = reactive({
  keyword: '',
  status: ''
})
// 准客户统计数据
const prospectStats = reactive({
  total: 0,
  today_new: 0,
  unassigned: 0,
  assigned: 0,
  pending: 0,
  following: 0,
  converted: 0
})
const prospectPagination = reactive({
  page: 1,
  perPage: 10,
  total: 0,
  lastPage: 1
})
const showProspectPagination = computed(() => {
  return prospectPagination.lastPage > 1 && prospectPagination.total > prospectPagination.perPage
})

// 准客户分配弹窗
const showProspectAssignPopup = ref(false)
const currentProspect = ref(null)
const prospectInstitutionKeyword = ref('')
const prospectInstitutionList = ref([])
const prospectInstitutionLoading = ref(false)
const selectedProspectInstitution = ref(null)
const prospectAssigning = ref(false)

// 准客户详情弹窗
const showProspectDetailPopup = ref(false)
const prospectDetail = ref(null)

let prospectSearchTimeout = null

const normalizeKeywordInput = (input) => {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string' || typeof input === 'number') {
    return String(input).trim()
  }
  if (typeof input === 'object') {
    if (typeof input.target?.value === 'string') {
      return input.target.value.trim()
    }
    if (typeof input.detail === 'string') {
      return input.detail.trim()
    }
    if (typeof input.value === 'string') {
      return input.value.trim()
    }
  }
  return ''
}

// 选择器显示状态
const showGenderPicker = ref(false)
const showStatusPicker = ref(false)
const showDatePicker = ref(false)
const showVipDatePicker = ref(false)
const showVipPaidPicker = ref(false)
const showVipPaidDatePicker = ref(false)

const birthdayMinDate = dayjs('1900-01-01').toDate()
const birthdayMaxDate = dayjs().endOf('day').toDate()
const birthdayPickerValue = ref([])

// 完整的编辑表单数据
const editForm = reactive({
  id: null,
  name: '',
  phone: '',
  email: '',
  password: '',
  gender: 0,
  birthday: '',
  status: 'active',
  referrer_id: 0,
  referrer_name: '点点够',
  // 微信信息
  wechat_nickname: '',
  wechat_avatar: '',
  wechat_gender: '0',
  wechat_country: '',
  wechat_province: '',
  wechat_city: '',
  // 角色信息
  is_pay_institution: false,
  is_water_purifier_user: false,
  is_engineer: false,
  is_water_purifier_agent: false,
  is_pay_merchant: false,
  is_vip: false,
  is_admin: false,
  is_salesman: true, // 默认都是业务员
  // 支付机构信息
  institution_name: '',
  institution_number: '',
  institution_xs_number: '',
  institution_lv: '',
  institution_core_type: 1,
  // 工程师信息
  engineer_id: '',
  // VIP信息
  vip_at: '',
  is_vip_paid: false,
  vip_paid_at: '',
  // 时间信息
  last_login_time: '',
  created_at: ''
})

const buildBirthdayPickerValue = (value) => {
  if (!value || !String(value).trim()) {
    return []
  }
  const parsed = dayjs(value)
  if (!parsed.isValid()) {
    return []
  }
  return [
    parsed.format('YYYY'),
    parsed.format('MM'),
    parsed.format('DD')
  ]
}

const resolveBirthdayPickerValues = (values = []) => {
  if (!Array.isArray(values) || values.length < 3) {
    return ''
  }
  const [year, month, day] = values
  const normalizedYear = String(year).padStart(4, '0')
  const normalizedMonth = String(month).padStart(2, '0')
  const normalizedDay = String(day).padStart(2, '0')
  const candidate = `${normalizedYear}-${normalizedMonth}-${normalizedDay}`
  const parsed = dayjs(candidate)
  if (!parsed.isValid()) {
    return ''
  }
  return parsed.format('YYYY-MM-DD')
}

// 筛选器
const filter = reactive({
  role: 'all',
  status: 'all',
  sortBy: 'newest'
})

const institutionStatusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '待审核', value: 'pending' },
  { text: '审核通过', value: 'active' },
  { text: '审核拒绝', value: 'rejected' }
]

const institutionTypeOptions = [
  { text: '全部类型', value: 'all' },
  { text: '普通机构', value: 'normal' },
  { text: '核心机构', value: 'core' },
  { text: '美团机构', value: 'meituan' }
]

const institutionSortOptions = [
  { text: '最新创建', value: 'created_at_desc' },
  { text: '按等级', value: 'level_desc' },
  { text: '美团销售额', value: 'meituan_sales_amount_desc' }
]

const activeReferrer = computed(() => {
  if (currentReferrerInfo.value) {
    return currentReferrerInfo.value
  }
  if (editForm.referrer_id === 0) {
    return officialReferrer
  }
  return null
})

const referrerMeta = computed(() => {
  const info = activeReferrer.value
  if (!info) {
    return {
      primary: '未选择推荐人',
      secondary: '点击选择推荐人以便后续跟进',
      tag: '',
      tagClass: '',
      avatar: '/app/images/profile/default-avatar.png',
      status: 'empty'
    }
  }

  if (info.id === 0) {
    return {
      primary: info.name || '点点够官方',
      secondary: '默认官方推荐人',
      tag: '官方',
      tagClass: 'referrer-card__tag--official',
      avatar: info.avatar || '/app/images/logo.png',
      status: 'official'
    }
  }

  return {
    primary: info.name || info.display_name || info.wechat_nickname || '未设置姓名',
    secondary: info.phone ? `手机号 ${info.phone}` : '未绑定手机',
    tag: info.id ? `ID ${info.id}` : '',
    tagClass: 'referrer-card__tag--user',
    avatar: info.avatar || info.wechat_avatar || '/app/images/profile/default-avatar.png',
    status: 'custom'
  }
})

const referrerStatusText = computed(() => {
  switch (referrerMeta.value.status) {
    case 'official':
      return '默认推荐'
    case 'custom':
      return '已选择'
    default:
      return '未选择'
  }
})

const referrerStatusClass = computed(() => {
  switch (referrerMeta.value.status) {
    case 'official':
      return 'referrer-card__status--official'
    case 'custom':
      return 'referrer-card__status--active'
    default:
      return 'referrer-card__status--empty'
  }
})

// 角色选项
const roleOptions = [
  { text: '全部角色', value: 'all' },
  { text: '管理员', value: 'admin' },
  { text: '业务员', value: 'salesman' },
  { text: '商户', value: 'merchant' },
  { text: '普通用户', value: 'user' }
]

// 状态选项
const statusOptions = [
  { text: '全部状态', value: 'all' },
  { text: '待审核', value: 'pending' },
  { text: '正常', value: 'active' },
  { text: '禁用', value: 'disabled' }
]

// 排序选项
const sortOptions = [
  { text: '最新注册', value: 'newest' },
  { text: '最早注册', value: 'oldest' },
  { text: '最近登录', value: 'recent_login' }
]

// 性别选项
const genderColumns = [
  { text: '未知', value: 0 },
  { text: '男', value: 1 },
  { text: '女', value: 2 }
]

// 状态选项
const statusColumns = [
  { text: '待审核', value: 'pending' },
  { text: '正常', value: 'active' },
  { text: '禁用', value: 'disabled' }
]

// VIP付款状态选项
const vipPaidColumns = [
  { text: '未完款', value: false },
  { text: '已完款', value: true }
]

// 返回上一页
const onClickLeft = () => {
  router.back()
}

// 加载用户数据
const loadUserData = async (reset = false) => {
  if (reset) {
    userList.value = []
    pagination.page = 1
  }

  loading.value = true

  try {
    const params = {
      page: pagination.page,
      per_page: pagination.perPage,
      branch_id: 3 // 只获取官方用户
    }

    if (searchValue.value.trim()) {
      params.keyword = searchValue.value.trim()
    }

    if (filter.role && filter.role !== 'all') {
      params.role = filter.role
    }

    if (filter.status && filter.status !== 'all') {
      params.status = filter.status
    }

    console.log('🔍 [用户管理] 请求参数:', params)

    const response = await request({
      url: '/api/admin/v1/app-users',
      method: 'get',
      params
    })

    console.log('📊 [用户管理] API响应:', response)

    if (response.code === 0 && response.data) {
      const paginationData = response.data
      const rawUsers = paginationData.data || []
      const newUsers = rawUsers.map((user) => {
        const rawStatus = user.status_state ?? user.status
        const normalizedStatus = (() => {
          if (rawStatus === 'pending' || user.review_status === 'pending') return 'pending'
          if (rawStatus === 'disabled') return 'disabled'
          if (rawStatus === 'active') return 'active'
          const numericStatus = Number(rawStatus)
          if (!Number.isNaN(numericStatus)) {
            if (numericStatus === 0 && (user.review_status === 'pending' || user.register_source === 'institution_invite')) {
              return 'pending'
            }
            return numericStatus === 0 ? 'disabled' : 'active'
          }
          return 'active'
        })()
        return {
          ...user,
          status: normalizedStatus,
          gender: typeof user.gender === 'string' ? Number(user.gender) : (user.gender ?? 0),
          wechat_gender: typeof user.wechat_gender === 'string' ? Number(user.wechat_gender) : (user.wechat_gender ?? 0)
        }
      })

      userList.value = newUsers

      pagination.page = paginationData.current_page || pagination.page
      pagination.lastPage = paginationData.last_page || 1
      pagination.perPage = paginationData.per_page || pagination.perPage
      pagination.total = typeof paginationData.total === 'number' ? paginationData.total : newUsers.length

      // 如果当前页超过最大页，自动回退到最后一页
      if (pagination.page > pagination.lastPage) {
        pagination.page = pagination.lastPage || 1
      }

      console.log(`✅ [用户管理] 加载成功，当前页: ${pagination.page}/${pagination.lastPage}，用户数: ${newUsers.length}`)
    } else {
      showToast(response.message || '获取用户数据失败')
    }
  } catch (error) {
    console.error('❌ [用户管理] 加载用户数据失败:', error)
    showToast('加载失败，请重试')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const triggerSearch = () => {
  if (!searchValue.value.trim()) {
    showToast('请输入搜索内容')
    return
  }
  loadUserData(true)
}

const institutionDetail = reactive({
  show: false,
  data: null,
  hierarchy: [],
  hierarchyLoading: false
})
const institutionRegionLine = computed(() => {
  const detail = institutionDetail.data
  if (!detail) return ''
  const parts = [
    detail.province_name || detail.region?.province?.text || '',
    detail.city_name || detail.region?.city?.text || '',
    detail.district_name || detail.region?.district?.text || ''
  ].filter(Boolean)
  return parts.length ? parts.join(' / ') : ''
})

const institutionHierarchy = computed(() => {
  if (institutionDetail.hierarchy?.length) {
    return institutionDetail.hierarchy
  }
  if (!institutionDetail.data) return []
  const current = institutionDetail.data
  return [{
    id: current.id,
    name: current.nickname || current.name || `机构 #${current.id || ''}`,
    number: current.number || ''
  }]
})

const institutionHierarchyText = computed(() => {
  if (!institutionHierarchy.value.length) return '无上级机构'
  return institutionHierarchy.value.map(item => item.name || `机构 #${item.id || ''}`).join(' → ')
})

const detailStatBlocks = computed(() => {
  if (!institutionDetail.data) return []
  const inst = institutionDetail.data
  return [
    {
      label: '团队商户',
      value: formatNumber(inst.merchant_stats?.team || inst.merchant_stats?.total || 0),
      desc: `直营 ${formatNumber(inst.merchant_stats?.direct || 0)}`
    },
    {
      label: '团队销售额',
      value: formatCurrency(inst.meituan_total_sales_amount),
      desc: `本月 ${formatCurrency(inst.meituan_month_sales_amount)}`
    },
    {
      label: '团队分润',
      value: formatCurrency(inst.meituan_total_commission_amount),
      desc: `本月 ${formatCurrency(inst.meituan_month_commission_amount)}`
    }
  ]
})

const provinceColumns = computed(() => regionOptions.provinces)
const cityColumns = computed(() => regionOptions.cities)
const districtColumns = computed(() => regionOptions.districts)

const resetCreateInstitutionForm = () => {
  createInstitutionForm.name = ''
  createInstitutionForm.institution_name = ''
  createInstitutionForm.phone = ''
  createInstitutionForm.number = ''
  createInstitutionForm.xs_number = ''
  createInstitutionForm.province_id = ''
  createInstitutionForm.province_name = ''
  createInstitutionForm.city_id = ''
  createInstitutionForm.city_name = ''
  createInstitutionForm.district_id = ''
  createInstitutionForm.district_name = ''
  createInstitutionForm.salesman_enabled = true
  createInstitutionForm.parent_institution_id = ''
  createInstitutionForm.parent_institution_name = ''
  selectedParentInstitution.id = ''
  selectedParentInstitution.name = ''
  selectedParentInstitution.number = ''
  currentStep.value = 1
  formSubmitting.value = false
}

const openCreateInstitution = () => {
  resetCreateInstitutionForm()
  regionOptions.cities = []
  regionOptions.districts = []
  showProvincePicker.value = false
  showCityPicker.value = false
  showDistrictPicker.value = false
  currentStep.value = 1
  showCreateInstitution.value = true
}

// 步骤导航逻辑
const nextStep = async () => {
  const canProceed = await validateCurrentStep()
  if (canProceed && currentStep.value < 3) {
    currentStep.value++
    // 滚动到顶部
    await nextTick()
    const popup = document.querySelector('.create-institution-wizard')
    if (popup) {
      popup.scrollTop = 0
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
    // 滚动到顶部
    nextTick(() => {
      const popup = document.querySelector('.create-institution-wizard')
      if (popup) {
        popup.scrollTop = 0
      }
    })
  }
}

const validateCurrentStep = async () => {
  if (currentStep.value === 1) {
    // 验证第一步：基本信息
    const { name, institution_name, phone } = createInstitutionForm
    if (!name?.trim()) {
      showFailToast('请输入负责人姓名')
      return false
    }
    if (!institution_name?.trim()) {
      showFailToast('请输入机构名称')
      return false
    }
    if (!phone?.trim()) {
      showFailToast('请输入手机号')
      return false
    }
    if (!/^1\d{10}$/.test(phone)) {
      showFailToast('请输入正确的手机号')
      return false
    }
  }
  
  if (currentStep.value === 2) {
    // 第二步不需要特殊验证
  }
  
  if (currentStep.value === 3) {
    // 验证第三步：地区信息
    const { province_id, city_id, district_id } = createInstitutionForm
    if (!province_id) {
      showFailToast('请选择省份')
      return false
    }
    if (!city_id) {
      showFailToast('请选择城市')
      return false
    }
    if (!district_id) {
      showFailToast('请选择区县')
      return false
    }
  }
  
  return true
}

const onCreateInstitutionPhoneChange = (val, oldVal) => {
  if (!val) return
  const prev = oldVal || ''
  if (!createInstitutionForm.number || createInstitutionForm.number === prev) {
    createInstitutionForm.number = val
  }
  if (!createInstitutionForm.xs_number || createInstitutionForm.xs_number === prev) {
    createInstitutionForm.xs_number = val
  }
}

const ensureProvinces = async () => {
  if (regionOptions.provinces.length || regionLoading.provinces) return
  regionLoading.provinces = true
  try {
    const res = await getInstitutionProvinces()
    if (res?.code === 0 && Array.isArray(res.data)) {
      regionOptions.provinces = res.data
        .map(item => {
          const value = normalizeRegionId(item.id || item.code || item.value)
          if (!value) return null
          return {
            text: item.name || item.nickname || item.text || '未命名',
            value
          }
        })
        .filter(Boolean)
    }
  } catch (error) {
    console.error('加载省份失败', error)
    showFailToast('加载省份失败')
  } finally {
    regionLoading.provinces = false
  }
}

const loadCities = async (provinceId) => {
  const normalizedProvinceId = normalizeRegionId(provinceId)
  if (!normalizedProvinceId) return
  regionLoading.cities = true
  try {
    const res = await getInstitutionCities({ province_id: normalizedProvinceId })
    regionOptions.cities = Array.isArray(res?.data)
      ? res.data
          .map(item => {
            const value = normalizeRegionId(item.id || item.code || item.value)
            if (!value) return null
            return {
              text: item.name || item.text || '未命名',
              value
            }
          })
          .filter(Boolean)
      : []
  } catch (error) {
    console.error('加载城市失败', error)
    showFailToast('加载城市失败')
  } finally {
    regionLoading.cities = false
  }
}

const loadDistricts = async (cityId) => {
  const normalizedCityId = normalizeRegionId(cityId)
  if (!normalizedCityId) return
  regionLoading.districts = true
  try {
    const res = await getInstitutionDistricts({ city_id: normalizedCityId })
    regionOptions.districts = Array.isArray(res?.data)
      ? res.data
          .map(item => {
            const value = normalizeRegionId(item.id || item.code || item.value)
            if (!value) return null
            return {
              text: item.name || item.text || '未命名',
              value
            }
          })
          .filter(Boolean)
      : []
  } catch (error) {
    console.error('加载区县失败', error)
    showFailToast('加载区县失败')
  } finally {
    regionLoading.districts = false
  }
}

const openProvincePicker = async () => {
  await ensureProvinces()
  if (!regionOptions.provinces.length) return
  showProvincePicker.value = true
}

const openCityPicker = async () => {
  if (!createInstitutionForm.province_id) {
    showFailToast('请先选择省份')
    return
  }
  await loadCities(createInstitutionForm.province_id)
  if (!regionOptions.cities.length) return
  showCityPicker.value = true
}

const openDistrictPicker = async () => {
  if (!createInstitutionForm.city_id) {
    showFailToast('请先选择城市')
    return
  }
  await loadDistricts(createInstitutionForm.city_id)
  if (!regionOptions.districts.length) return
  showDistrictPicker.value = true
}

const onProvinceConfirm = ({ selectedOptions }) => {
  const option = Array.isArray(selectedOptions) ? selectedOptions[0] : null
  if (!option) return
  const normalizedValue = normalizeRegionId(option?.value)
  if (!normalizedValue) return
  createInstitutionForm.province_id = normalizedValue
  createInstitutionForm.province_name = option.text
  createInstitutionForm.city_id = ''
  createInstitutionForm.city_name = ''
  createInstitutionForm.district_id = ''
  createInstitutionForm.district_name = ''
  regionOptions.cities = []
  regionOptions.districts = []
  showProvincePicker.value = false
}

const onCityConfirm = ({ selectedOptions }) => {
  const option = Array.isArray(selectedOptions) ? selectedOptions[0] : null
  if (!option) return
  const normalizedValue = normalizeRegionId(option?.value)
  if (!normalizedValue) return
  createInstitutionForm.city_id = normalizedValue
  createInstitutionForm.city_name = option.text
  createInstitutionForm.district_id = ''
  createInstitutionForm.district_name = ''
  regionOptions.districts = []
  showCityPicker.value = false
}

const onDistrictConfirm = ({ selectedOptions }) => {
  const option = Array.isArray(selectedOptions) ? selectedOptions[0] : null
  if (!option) return
  const normalizedValue = normalizeRegionId(option?.value)
  if (!normalizedValue) return
  createInstitutionForm.district_id = normalizedValue
  createInstitutionForm.district_name = option.text
  showDistrictPicker.value = false
}

// 上级机构选择相关方法
const openParentInstitutionPicker = async (mode = 'create', targetInstitution = null) => {
  parentPickerMode.value = mode
  parentPickerTarget.value = targetInstitution

  showParentInstitutionPicker.value = true
  parentInstitutionSearchValue.value = ''

  if (mode === 'detail' && targetInstitution) {
    detailParentSelection.id = targetInstitution.parent?.id ||
      targetInstitution.parent_institution_id ||
      ''
    detailParentSelection.name = targetInstitution.parent?.name ||
      targetInstitution.parent_institution_name ||
      ''
    detailParentSelection.number = targetInstitution.parent?.number ||
      targetInstitution.parent_institution_number ||
      ''
  } else {
    detailParentSelection.id = ''
    detailParentSelection.name = ''
    detailParentSelection.number = ''
  }

  await searchParentInstitutions('')
}

const searchParentInstitutions = async (keyword) => {
  const normalizedKeyword = normalizeKeywordInput(keyword)
  parentInstitutionLoading.value = true
  try {
    const res = await searchInstitutions({
      keyword: normalizedKeyword,
      per_page: 50,
      page: 1
    })
    
    const successFlag = res && (
      res.code === 0 ||
      res.code === '0' ||
      res.success === true
    )
    
    if (successFlag && res.data) {
      // 正确的数据结构：res.data.items
      const data = res.data
      const institutions = data.items || []
      
      parentInstitutionList.value = institutions.map(item => {
        const name = item.name || item.nickname || `机构 #${item.id}`
        const institutionNumber = item.number || item.institution_number || item.xs_number || ''

        return {
          id: item.id,
          name,
          number: institutionNumber,
          phone: item.phone || '',
          avatar: item.responsible_avatar || '/app/images/profile/default-avatar.png'
        }
      })
    } else {
      parentInstitutionList.value = []
    }
  } catch (error) {
    console.error('搜索上级机构失败', error)
    parentInstitutionList.value = []
    showFailToast('搜索机构失败，请稍后重试')
  } finally {
    parentInstitutionLoading.value = false
  }
}

const onParentInstitutionSearch = () => {
  const keyword = normalizeKeywordInput(parentInstitutionSearchValue.value)
  parentInstitutionSearchValue.value = keyword
  searchParentInstitutions(keyword)
}

// 上级机构搜索（输入即搜，300ms 防抖）
const onParentInstitutionInput = (value) => {
  const keyword = normalizeKeywordInput(value)
  parentInstitutionSearchValue.value = keyword

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    searchParentInstitutions(keyword)
  }, 300)
}

const selectParentInstitution = async (institution) => {
  if (parentPickerMode.value === 'detail') {
    showParentInstitutionPicker.value = false
    await updateInstitutionParentRelation(parentPickerTarget.value, institution)
    return
  }

  selectedParentInstitution.id = institution.id
  selectedParentInstitution.name = institution.name
  selectedParentInstitution.number = institution.number
  createInstitutionForm.parent_institution_id = institution.id
  createInstitutionForm.parent_institution_name = institution.name
  showParentInstitutionPicker.value = false
}

const clearParentInstitution = async () => {
  if (parentPickerMode.value === 'detail') {
    showParentInstitutionPicker.value = false
    await updateInstitutionParentRelation(parentPickerTarget.value, null)
    return
  }

  selectedParentInstitution.id = ''
  selectedParentInstitution.name = ''
  selectedParentInstitution.number = ''
  createInstitutionForm.parent_institution_id = ''
  createInstitutionForm.parent_institution_name = ''
}

const clearParentInstitutionSearch = () => {
  parentInstitutionSearchValue.value = ''
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchParentInstitutions('')
}

const handleEditParentInstitution = () => {
  if (!institutionDetail.data) return
  openParentInstitutionPicker('detail', institutionDetail.data)
}

const updateInstitutionParentRelation = async (institution, newParent) => {
  if (!institution?.id) return
  if (parentChangeLoading.value) return

  parentChangeLoading.value = true
  try {
    const payload = {
      nickname: institution.nickname || institution.name || institution.responsible_name || '机构',
      name: institution.name || institution.nickname || institution.responsible_name || '机构',
      phone: institution.phone || '',
      number: institution.number || '',
      xs_number: institution.xs_number || '',
      parent_id: newParent?.id || null,
      parent_institution_id: newParent?.id || null,
      province_id: institution.province_id || institution.region?.province?.value || '',
      city_id: institution.city_id || institution.region?.city?.value || '',
      district_id: institution.district_id || institution.region?.district?.value || ''
    }

    await updateInstitution(institution.id, payload)
    showSuccessToast('上级机构已更新')

    if (institutionDetail.data && institutionDetail.data.id === institution.id) {
      institutionDetail.data.parent_institution_id = newParent?.id || null
      institutionDetail.data.parent_institution_name = newParent?.name || ''
      institutionDetail.data.parent_institution_number = newParent?.number || ''
      institutionDetail.data.parent = newParent
      detailParentSelection.id = newParent?.id || ''
      detailParentSelection.name = newParent?.name || ''
      detailParentSelection.number = newParent?.number || ''
      fetchInstitutionHierarchy(institutionDetail.data)
    }

    await refreshInstitutions()
  } catch (error) {
    console.error('更新上级机构失败', error)
    showFailToast(error?.message || '更新失败')
  } finally {
    parentChangeLoading.value = false
  }
}

const submitCreateInstitution = async () => {
  // 最终验证
  const { name, institution_name, phone, province_id, city_id, district_id } = createInstitutionForm
  
  if (!name?.trim() || !institution_name?.trim() || !phone?.trim()) {
    showFailToast('请完善必填信息')
    return
  }
  
  if (!province_id || !city_id || !district_id) {
    showFailToast('请选择完整的地区信息')
    return
  }
  
  if (!/^1\d{10}$/.test(phone)) {
    showFailToast('请输入正确的手机号')
    return
  }

  formSubmitting.value = true
  
  try {
    const payload = {
      responsible_name: name?.trim(),
      name: institution_name?.trim(),
      nickname: institution_name?.trim() || name?.trim(),
      phone: (phone || '').trim(),
      number: (createInstitutionForm.number || '').trim() || (phone || '').trim(),
      xs_number: (createInstitutionForm.xs_number || '').trim() || (phone || '').trim(),
      province_id: normalizeRegionId(province_id),
      city_id: normalizeRegionId(city_id),
      district_id: normalizeRegionId(district_id),
      salesman_enabled: createInstitutionForm.salesman_enabled ? 1 : 0,
      parent_institution_id: createInstitutionForm.parent_institution_id || null
    }

    const res = await createInstitution(payload)
    const successFlag = res && (res.code === 0 || res.code === '0' || res.success === true)
    
    if (!successFlag) {
      throw new Error(res?.message || '创建机构失败')
    }

    // 成功动画
    showSuccessToast('机构创建成功！')
    showCreateInstitution.value = false
    
    // 重置状态
    currentStep.value = 1
    formSubmitting.value = false
    
    refreshInstitutions()
  } catch (error) {
    console.error('创建机构失败', error)
    showFailToast(error?.message || '创建机构失败')
  } finally {
    formSubmitting.value = false
  }
}

const openInstitutionDetail = (institution) => {
  institutionDetail.data = institution
  detailParentSelection.id = institution?.parent?.id || institution?.parent_institution_id || ''
  detailParentSelection.name = institution?.parent?.name || institution?.parent_institution_name || ''
  detailParentSelection.number = institution?.parent?.number || institution?.parent_institution_number || ''
  institutionDetail.show = true
  fetchInstitutionHierarchy(institution)
}

// 递归拉取机构层级链路（总部 -> 当前）
const fetchInstitutionHierarchy = async (institution) => {
  const normalizeHierarchyItem = (item) => {
    if (!item) return null
    const id = Number(item.id || item.institution_id || item.parent_institution_id || 0)
    if (!id) return null
    const name = item.nickname || item.name || item.institution_name || `机构 #${id}`
    const number = item.number || item.institution_number || item.xs_number || ''
    return { id, name, number }
  }

  if (!institution?.id) {
    institutionDetail.hierarchy = []
    return
  }

  institutionDetail.hierarchyLoading = true
  const chain = []

  try {
    let detailPayload = { ...institution }

    // 优先使用后端返回的完整层级链路，避免逐级请求缺失
    const detailRes = await getInstitutionDetail(institution.id)
    const detailSuccess = detailRes && (detailRes.code === 0 || detailRes.code === '0' || detailRes.success === true)
    if (detailSuccess && detailRes.data) {
      detailPayload = { ...detailPayload, ...detailRes.data }
      institutionDetail.data = detailPayload

      const apiChain = Array.isArray(detailRes.data.hierarchy_chain) ? detailRes.data.hierarchy_chain : []
      // 如果后端返回的层级链路有效（多于1级，或只有1级且无上级），则使用
      // 否则（如只有1级但有上级ID），尝试前端递归补全
      const isValidChain = apiChain.length > 1 || (apiChain.length === 1 && !detailPayload.institution_id && !detailPayload.parent_id && !detailPayload.parent_institution_id)
      
      if (isValidChain) {
        apiChain
          .map(normalizeHierarchyItem)
          .filter(Boolean)
          .forEach(item => chain.push(item))
      }
    }

    if (!chain.length) {
      const manualChain = []
      const visited = new Set()
      let current = detailPayload
      let guard = 0

      while (current && guard < 25) {
        const normalized = normalizeHierarchyItem(current)
        if (normalized) {
          manualChain.push(normalized)
        }

        const parentId = current.institution_id ||
          current.parent_id ||
          current.parent?.id ||
          current.parent_institution_id ||
          null

        if (!parentId || visited.has(parentId)) break

        visited.add(parentId)
        guard += 1

        const res = await getInstitutionDetail(parentId)
        const successFlag = res && (res.code === 0 || res.code === '0' || res.success === true)
        if (!successFlag || !res.data) break

        current = res.data
      }

      chain.push(...manualChain.reverse())
    }
  } catch (error) {
    console.error('获取机构层级关系失败', error)
  } finally {
    if (!chain.length && institution) {
      const fallback = normalizeHierarchyItem(institution)
      if (fallback) chain.push(fallback)
    }
    institutionDetail.hierarchy = [...chain.filter(Boolean)]
    institutionDetail.hierarchyLoading = false
  }
}

const toggleSalesmanPermission = async (institution, enabled) => {
  if (!institution?.id) return
  institutionSalesmanSwitching[institution.id] = true
  try {
    const res = await toggleInstitutionSalesman(institution.id, { enabled: enabled ? 1 : 0 })
    const successFlag = res && (res.code === 0 || res.code === '0' || res.success === true)
    if (!successFlag) {
      throw new Error(res?.message || '更新失败')
    }
    showSuccessToast(`展业权限已${enabled ? '开启' : '关闭'}`)
  } catch (error) {
    institution.salesman_enabled = !enabled
    showFailToast(error?.message || '更新失败')
  } finally {
    institutionSalesmanSwitching[institution.id] = false
  }
}

const toggleMeituan = async (institution, enabled) => {
  if (!institution?.id) return
  institutionMeituanSwitching[institution.id] = true
  try {
    const res = await toggleInstitutionMeituan(institution.id, { enabled: enabled ? 1 : 0 })
    const successFlag = res && (res.code === 0 || res.code === '0' || res.success === true)
    if (!successFlag) {
      throw new Error(res?.message || '更新失败')
    }
    showSuccessToast(`美团渠道已${enabled ? '开通' : '关闭'}`)
  } catch (error) {
    institution.is_meituan = !enabled
    showFailToast(error?.message || '更新失败')
  } finally {
    institutionMeituanSwitching[institution.id] = false
  }
}

// 搜索用户（键盘回车触发）
const onSearch = () => {
  triggerSearch()
}

// 取消搜索
const onCancelSearch = () => {
  searchValue.value = ''
  loadUserData(true)
}

// 刷新
const onRefresh = () => {
  refreshing.value = true
  loadUserData(true)
}

const getInstitutionSortParams = () => {
  const rawValue = institutionFilters.sortBy || 'created_at_desc'
  const parts = rawValue.split('_')
  const orderPart = parts.pop() || 'desc'
  const fieldPart = parts.join('_') || 'created_at'
  const fieldMap = {
    created_at: 'created_at',
    created: 'created_at',
    level: 'level',
    meituan_sales_amount: 'meituan_sales_amount',
    id: 'id'
  }
  const sortField = fieldMap[fieldPart] || 'created_at'
  const sortOrder = orderPart === 'asc' ? 'asc' : 'desc'
  return { sortField, sortOrder }
}

const loadInstitutions = async (reset = false) => {
  if (reset) {
    institutionPagination.page = 1
  }

  institutionLoading.value = true

  try {
    const params = {
      page: institutionPagination.page,
      per_page: institutionPagination.perPage
    }

    const keyword = (institutionFilters.keyword || '').trim()
    if (keyword) {
      params.keyword = keyword
      // 同时尝试邀请码精确匹配，但不影响关键词模糊搜索
      const isPossibleInviteCode = /^[A-Za-z0-9]{4,12}$/.test(keyword) && !/^1\d{10}$/.test(keyword)
      if (isPossibleInviteCode) {
        params.invite_code = keyword
      }
    }
    if (institutionFilters.status !== 'all') {
      params.status = institutionFilters.status
    }

    switch (institutionFilters.type) {
      case 'normal':
        params.core_type = 1
        break
      case 'core':
        params.core_type = 2
        break
      case 'meituan':
        params.is_meituan = 1
        break
      default:
        break
    }

    const { sortField, sortOrder } = getInstitutionSortParams()
    params.sort_field = sortField
    params.sort_order = sortOrder

    console.log('🔍 [机构管理] 请求参数:', params)

    const response = await searchInstitutions(params)
    console.log('📊 [机构管理] API响应:', response)

    const successFlag = response && (
      response.code === 0 ||
      response.code === '0' ||
      response.success === true
    )

    if (successFlag && response.data) {
      const data = response.data
      institutionList.value = (data.items || []).map(item => ({
        ...item,
        salesman_enabled: item.salesman_enabled === true || item.salesman_enabled === 1 || item.salesman_enabled === '1'
      }))

      const pg = data.pagination || {}
      institutionPagination.page = Number(pg.page) || institutionPagination.page
      institutionPagination.perPage = Number(pg.per_page) || institutionPagination.perPage
      institutionPagination.total = Number(pg.total) || (institutionList.value.length ?? 0)
      institutionPagination.lastPage =
        Number(pg.last_page) || Math.max(1, Math.ceil(institutionPagination.total / institutionPagination.perPage || 1))

      institutionLoaded.value = true
    } else {
      showFailToast(response?.message || '获取机构数据失败')
    }
  } catch (error) {
    console.error('❌ [机构管理] 加载机构数据失败:', error)
    showFailToast(error?.message || '获取机构数据失败')
  } finally {
    institutionLoading.value = false
    institutionRefreshing.value = false
  }
}

const refreshInstitutions = async () => {
  if (activeMainTab.value !== 'institutions') {
    activeMainTab.value = 'institutions'
    await nextTick()
  }
  institutionRefreshing.value = true
  await loadInstitutions(true)
}

const onInstitutionSearch = () => {
  institutionFilters.keyword = (institutionFilters.keyword || '').trim()
  if (activeMainTab.value !== 'institutions') {
    activeMainTab.value = 'institutions'
    return
  }
  loadInstitutions(true)
}

const onInstitutionReset = () => {
  institutionFilters.keyword = ''
  if (activeMainTab.value !== 'institutions') {
    activeMainTab.value = 'institutions'
    return
  }
  loadInstitutions(true)
}

const onInstitutionFilterChange = () => {
  if (activeMainTab.value !== 'institutions') {
    activeMainTab.value = 'institutions'
    return
  }
  loadInstitutions(true)
}

const onInstitutionSortChange = () => {
  if (activeMainTab.value !== 'institutions') {
    activeMainTab.value = 'institutions'
    return
  }
  loadInstitutions(true)
}

const handleInstitutionPageChange = (page) => {
  if (page === institutionPagination.page) {
    loadInstitutions()
    return
  }
  institutionPagination.page = page
  loadInstitutions()
}

const shouldShowPagination = computed(() => pagination.lastPage > 1)

const handlePageChange = (page) => {
  if (page === pagination.page) {
    loadUserData()
    return
  }
  pagination.page = page
  loadUserData()
}

watch(activeMainTab, (value) => {
  if (value === 'institutions' && !institutionLoaded.value) {
    loadInstitutions(true)
  }
  if (value === 'prospects' && !prospectLoaded.value) {
    loadProspects(true)
    loadProspectStats()
  }
})

watch(
  () => createInstitutionForm.phone,
  (val, oldVal) => onCreateInstitutionPhoneChange(val, oldVal)
)

// 筛选改变
const onFilterChange = () => {
  loadUserData(true)
}

// 切换用户详情
const toggleUserDetail = (userId) => {
  expandedUsers[userId] = !expandedUsers[userId]
}

// 旧的editUser函数已删除，使用新的handleEdit函数

// 旧的confirmEdit函数已删除，使用新的confirmEdit函数

// 旧的添加用户函数已删除，使用新的handleAddUser和confirmEdit函数

// 修改用户状态
const changeUserStatus = (user) => {
  const action = user.status === 'active' ? '禁用' : '启用'
  
  showConfirmDialog({
    title: `${action}用户`,
    message: `确定要${action}用户 ${user.name} 吗？`,
  }).then(() => {
    // 用户点击确定按钮
    setTimeout(() => {
      // 更新本地状态
      const index = userList.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        userList.value[index].status = user.status === 'active' ? 'disabled' : 'active'
      }
      
      showSuccessToast(`${action}成功`)
    }, 500)
  }).catch(() => {
    // 用户点击取消按钮
  })
}

// 重置密码
const resetPassword = (user) => {
  showConfirmDialog({
    title: '重置密码',
    message: `确定要重置用户 ${user.name} 的密码吗？`,
  }).then(() => {
    // 用户点击确定按钮
    setTimeout(() => {
      showSuccessToast('密码已重置为: 123456')
    }, 500)
  }).catch(() => {
    // 用户点击取消按钮
  })
}

// 查看用户订单
const viewUserOrders = (user) => {
  showToast(`查看用户 ${user.name} 的订单`)
  // 实际项目中跳转到订单页面并传入用户ID
  // router.push(`/admin/orders?userId=${user.id}`)
}

// 添加用户
const handleAddUser = () => {
  // 重置表单
  Object.keys(editForm).forEach(key => {
    if (typeof editForm[key] === 'boolean') {
      editForm[key] = key === 'is_salesman' // 默认是业务员
    } else if (typeof editForm[key] === 'number') {
      editForm[key] = key === 'gender' ? 0 : (key === 'referrer_id' ? 0 : 0)
    } else {
      editForm[key] = key === 'status' ? 'active' : (key === 'referrer_name' ? officialReferrer.name : (key === 'password' ? '123456' : ''))
    }
  })

  birthdayPickerValue.value = []

  // 重置推荐人验证状态
  referrerValidating.value = false
  referrerError.value = ''
  referrerInfo.value = null
  currentReferrerInfo.value = { ...officialReferrer }
  referrerSearchValue.value = ''

  isEditing.value = false
  activeTab.value = 'basic'
  showEditDialog.value = true
}

// 编辑用户
const handleEdit = (user) => {
  // 填充表单数据
  editForm.id = user.id
  editForm.name = user.name || ''
  editForm.phone = user.phone || ''
  editForm.email = user.email || user.phone || ''
  editForm.password = ''
  editForm.gender = typeof user.gender === 'string' ? Number(user.gender) : (user.gender ?? 0)
  const normalizedBirthday = user.birthday
    ? resolveBirthdayPickerValues(buildBirthdayPickerValue(user.birthday))
    : ''
  editForm.birthday = normalizedBirthday
  birthdayPickerValue.value = buildBirthdayPickerValue(normalizedBirthday)
  const normalizedStatus = (() => {
    if (user.status === 'disabled') return 'disabled'
    if (user.status === 'active') return 'active'
    return Number(user.status) === 0 ? 'disabled' : 'active'
  })()
  editForm.status = normalizedStatus
  editForm.referrer_id = user.referrer_id === null ? 0 : user.referrer_id
  editForm.referrer_name = user.referrer_name || '点点够'

  // 微信信息
  editForm.wechat_nickname = user.wechat_nickname || ''
  editForm.wechat_avatar = user.wechat_avatar || ''
  editForm.wechat_gender = typeof user.wechat_gender === 'string' ? Number(user.wechat_gender) : (user.wechat_gender ?? 0)
  editForm.wechat_country = user.wechat_country || ''
  editForm.wechat_province = user.wechat_province || ''
  editForm.wechat_city = user.wechat_city || ''

  // 角色信息
  editForm.is_pay_institution = user.is_pay_institution === 1
  editForm.is_water_purifier_user = user.is_water_purifier_user === 1
  editForm.is_engineer = user.is_engineer === 1
  editForm.is_water_purifier_agent = user.is_water_purifier_agent === 1
  editForm.is_pay_merchant = user.is_pay_merchant === 1
  editForm.is_vip = user.is_vip === 1
  editForm.is_admin = user.is_admin === 1
  editForm.is_salesman = user.is_salesman === 1

  // 支付机构信息
  editForm.institution_name = user.institution_name || ''
  editForm.institution_number = user.institution_number || ''
  editForm.institution_xs_number = user.institution_xs_number || ''
  editForm.institution_lv = user.institution_lv || ''
  editForm.institution_core_type = user.institution_core_type || 1

  // 工程师信息
  editForm.engineer_id = user.engineer_id || ''

  // VIP信息
  editForm.vip_at = user.vip_at || ''
  editForm.is_vip_paid = user.is_vip_paid === 1
  editForm.vip_paid_at = user.vip_paid_at || ''

  // 时间信息
  editForm.last_login_time = user.last_login_time || ''
  editForm.created_at = user.created_at || ''

  // 重置推荐人验证状态
  referrerValidating.value = false
  referrerError.value = ''
  referrerInfo.value = null

  // 设置当前推荐人信息
  if (editForm.referrer_id === 0) {
    currentReferrerInfo.value = { ...officialReferrer }
  } else if (editForm.referrer_id) {
    currentReferrerInfo.value = {
      id: editForm.referrer_id,
      name: user.referrer_name || editForm.referrer_name || '未设置姓名',
      phone: user.referrer_phone || user.referrer_mobile || '',
      avatar: user.referrer_avatar || user.referrer_wechat_avatar || ''
    }
  } else {
    currentReferrerInfo.value = null
  }
  referrerSearchValue.value = ''

  isEditing.value = true
  activeTab.value = 'basic'
  showEditDialog.value = true
}

// 获取性别文本
const getGenderText = (gender) => {
  switch (parseInt(gender)) {
    case 1: return '男'
    case 2: return '女'
    default: return '未知'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'pending': return '待审核'
    case 'active': return '正常'
    case 'disabled': return '已禁用'
    default: return '未知状态'
  }
}

// 获取状态CSS类
const getStatusClass = (status) => {
  switch (status) {
    case 'pending': return 'status-pending'
    case 'active': return 'status-active'
    case 'disabled': return 'status-disabled'
    default: return ''
  }
}

// 选择器确认处理函数
const onGenderConfirm = ({ selectedValues }) => {
  editForm.gender = Number(selectedValues[0])
  showGenderPicker.value = false
}

const onStatusConfirm = ({ selectedValues }) => {
  editForm.status = selectedValues[0]
  showStatusPicker.value = false
}

const onDateConfirm = (payload = {}) => {
  const values = Array.isArray(payload.selectedValues) && payload.selectedValues.length
    ? payload.selectedValues
    : birthdayPickerValue.value
  const birthday = resolveBirthdayPickerValues(values)
  if (!birthday) {
    showToast('请选择有效的生日日期')
    return
  }
  editForm.birthday = birthday
  birthdayPickerValue.value = buildBirthdayPickerValue(birthday)
  showDatePicker.value = false
}

const onVipDateConfirm = ({ selectedValues }) => {
  editForm.vip_at = selectedValues.join(' ')
  showVipDatePicker.value = false
}

const onVipPaidConfirm = ({ selectedValues }) => {
  editForm.is_vip_paid = Boolean(selectedValues[0])
  showVipPaidPicker.value = false
}

const onVipPaidDateConfirm = ({ selectedValues }) => {
  editForm.vip_paid_at = selectedValues.join(' ')
  showVipPaidDatePicker.value = false
}

// 验证推荐人
const validateReferrerFunc = async () => {
  if (!editForm.referrer_id && editForm.referrer_id !== 0) {
    referrerError.value = ''
    referrerInfo.value = null
    editForm.referrer_name = ''
    currentReferrerInfo.value = null
    return
  }

  if (editForm.referrer_id === 0) {
    referrerError.value = ''
    referrerInfo.value = null
    editForm.referrer_name = officialReferrer.name
    currentReferrerInfo.value = { ...officialReferrer }
    return
  }

  referrerValidating.value = true
  referrerError.value = ''
  referrerInfo.value = null

  try {
    const response = await getReferrerInfo({ referrer_id: editForm.referrer_id })

    if (response.code === 200 && response.data) {
      referrerInfo.value = response.data
      editForm.referrer_name = response.data.name
      referrerError.value = ''

      // 更新当前推荐人信息
      currentReferrerInfo.value = {
        id: response.data.id,
        name: response.data.name,
        phone: response.data.phone || '',
        avatar: response.data.wechat_avatar || ''
      }
    } else {
      referrerError.value = response.message || '推荐人不存在'
      editForm.referrer_name = ''
      currentReferrerInfo.value = null
    }
  } catch (error) {
    console.error('验证推荐人失败:', error)
    referrerError.value = '验证推荐人失败，请重试'
    editForm.referrer_name = ''
    currentReferrerInfo.value = null
  } finally {
    referrerValidating.value = false
  }
}

// 搜索推荐人
const searchReferrersFunc = async (searchText = '') => {
  const keyword = normalizeKeywordInput(searchText) || normalizeKeywordInput(referrerSearchValue.value)

  if (!keyword) {
    referrerSearchValue.value = ''
    await loadDefaultReferrers()
    return
  }

  referrerSearchValue.value = keyword
  referrerListLoading.value = true
  try {
    console.log('🔍 [推荐人搜索] 开始搜索:', keyword)

    const response = await searchReferrers({
      keyword,
      page: 1,
      per_page: 50
    })

    console.log('🔍 [推荐人搜索] API响应:', response)

    if (response && response.code === 200 && response.data) {
      referrerList.value = response.data.data || []
      console.log('🔍 [推荐人搜索] 搜索结果:', referrerList.value.length, '个用户')

      if (referrerList.value.length === 0) {
        showToast(`未找到包含"${keyword}"的推荐人`)
      }
    } else {
      referrerList.value = []
      console.warn('🔍 [推荐人搜索] API返回异常:', response)
      showToast('搜索推荐人失败，请重试')
    }
  } catch (error) {
    console.error('🔍 [推荐人搜索] 搜索失败:', error)
    showToast('搜索推荐人失败，请检查网络连接')
    referrerList.value = []
  } finally {
    referrerListLoading.value = false
  }
}

// 搜索防抖定时器
let searchTimer = null

// 推荐人搜索输入处理
const onReferrerSearchInput = (value) => {
  try {
    console.log('🔍 [推荐人搜索] 输入变化:', value, typeof value)

    // 清除之前的定时器
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    // 直接使用v-model绑定的值
    const searchValue = normalizeKeywordInput(value)
    referrerSearchValue.value = searchValue
    console.log('🔍 [推荐人搜索] 处理后的搜索值:', searchValue)

    // 设置防抖延迟
    searchTimer = setTimeout(() => {
      if (searchValue) {
        searchReferrersFunc(searchValue)
      } else {
        loadDefaultReferrers()
      }
    }, 300) // 300ms防抖延迟
  } catch (error) {
    console.error('🔍 [推荐人搜索] 输入处理失败:', error)
    // 发生错误时清空列表
    referrerList.value = []
  }
}

// 加载默认推荐人列表
const loadDefaultReferrers = async () => {
  referrerListLoading.value = true
  try {
    console.log('📋 [推荐人列表] 加载默认推荐人列表')

    const response = await searchReferrers({
      page: 1,
      per_page: 20
    })

    console.log('📋 [推荐人列表] API响应:', response)

    if (response.code === 200 && response.data) {
      referrerList.value = response.data.data || []
      console.log('📋 [推荐人列表] 加载成功:', referrerList.value.length, '个用户')
    } else {
      referrerList.value = []
      console.warn('📋 [推荐人列表] API返回异常:', response)
    }
  } catch (error) {
    console.error('📋 [推荐人列表] 加载失败:', error)
    referrerList.value = []
  } finally {
    referrerListLoading.value = false
  }
}

// 选择推荐人
const selectReferrer = (referrer) => {
  try {
    console.log('👤 [推荐人选择] 选择推荐人:', referrer)

    // 确保referrer对象存在且有id（允许id为0，表示点点够官方）
    if (!referrer || (referrer.id !== 0 && !referrer.id)) {
      console.error('👤 [推荐人选择] 推荐人数据无效:', referrer)
      showToast('推荐人数据无效')
      return
    }

    editForm.referrer_id = referrer.id

    // 处理点点够官方的特殊情况
    if (referrer.id === 0) {
      editForm.referrer_name = officialReferrer.name
      currentReferrerInfo.value = { ...officialReferrer }
    } else {
      editForm.referrer_name = referrer.display_name || referrer.name || referrer.wechat_nickname || '未设置姓名'
      currentReferrerInfo.value = {
        id: referrer.id,
        name: referrer.display_name || referrer.name || referrer.wechat_nickname || '未设置姓名',
        phone: referrer.phone || '',
        avatar: referrer.wechat_avatar || referrer.avatar || ''
      }
    }

    referrerError.value = ''
    console.log('👤 [推荐人选择] 选择成功:', currentReferrerInfo.value)
  } catch (error) {
    console.error('👤 [推荐人选择] 选择失败:', error)
    showToast('选择推荐人失败')
  }
}

// 确认推荐人选择
const confirmReferrerSelection = () => {
  showReferrerPicker.value = false
}

// 打开推荐人选择器时加载数据
const openReferrerPicker = () => {
  showReferrerPicker.value = true
  if (referrerList.value.length === 0) {
    loadDefaultReferrers()
  }
}

// 确认编辑/添加
const normalizeStatusForSubmit = (value) => {
  if (value === 'pending') return 0
  if (value === 'disabled' || value === 0) return 0
  if (value === 'active' || value === 1) return 1
  return 1
}

const normalizeDateField = (value) => {
  if (!value || !String(value).trim()) return null
  return String(value).trim()
}

const confirmEdit = async () => {
  if (submitting.value) return

  // 基本验证
  if (!editForm.name.trim()) {
    showToast('请输入真实姓名')
    return
  }

  if (!editForm.phone.trim()) {
    showToast('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(editForm.phone)) {
    showToast('手机号格式不正确')
    return
  }

  submitting.value = true

  try {
    // 准备提交数据
    const submitData = {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim() || editForm.phone.trim(),
      gender: Number(editForm.gender ?? 0),
      birthday: normalizeDateField(editForm.birthday),
      status: normalizeStatusForSubmit(editForm.status),
      referrer_id: editForm.referrer_id,
      // 角色信息
      is_pay_institution: editForm.is_pay_institution ? 1 : 0,
      is_water_purifier_user: editForm.is_water_purifier_user ? 1 : 0,
      is_engineer: editForm.is_engineer ? 1 : 0,
      is_water_purifier_agent: editForm.is_water_purifier_agent ? 1 : 0,
      is_pay_merchant: editForm.is_pay_merchant ? 1 : 0,
      is_vip: editForm.is_vip ? 1 : 0,
      is_admin: editForm.is_admin ? 1 : 0,
      is_salesman: editForm.is_salesman ? 1 : 0,
      // 支付机构信息
      institution_name: editForm.institution_name,
      institution_number: editForm.institution_number,
      institution_xs_number: editForm.institution_xs_number,
      institution_lv: editForm.institution_lv,
      institution_core_type: editForm.institution_core_type,
      // 工程师信息
      engineer_id: editForm.engineer_id,
      // VIP信息
      vip_at: normalizeDateField(editForm.vip_at),
      is_vip_paid: editForm.is_vip_paid ? 1 : 0,
      vip_paid_at: normalizeDateField(editForm.vip_paid_at),
      // 分支机构ID
      branch_id: 3 // 默认为点点够官方
    }

    if (submitData.wechat_gender !== undefined) {
      submitData.wechat_gender = Number(editForm.wechat_gender ?? 0)
    }

    // 如果有密码，添加密码字段
    if (editForm.password.trim()) {
      submitData.password = editForm.password.trim()
    }

    let response
    if (isEditing.value) {
      // 编辑用户
      response = await updateAdminUser(editForm.id, submitData)
    } else {
      // 添加用户
      response = await createAdminUser(submitData)
    }

    console.log('[admin/users] 提交结果:', response)
    if (response.success) {
      showSuccessToast(isEditing.value ? '用户更新成功' : '用户创建成功')
      showEditDialog.value = false
      loadUserData() // 重新加载用户列表
    } else {
      showToast(response.message || '操作失败')
    }
  } catch (error) {
    console.error('提交用户数据失败:', error)
    const message =
      error?.response?.data?.message ||
      error?.message ||
      '操作失败，请重试'
    showToast(message)
  } finally {
    submitting.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'

  const date = new Date(dateString)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const formatNumber = (value) => {
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return '0'
  return num.toLocaleString('zh-CN')
}

const formatCurrency = (value) => {
  const num = Number(value || 0)
  if (!Number.isFinite(num)) return '¥0.00'
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 生成模拟用户数据
const generateMockUsers = (count) => {
  const users = []
  const roles = [
    { is_admin: true, is_salesman: false, is_merchant: false },
    { is_admin: false, is_salesman: true, is_merchant: false },
    { is_admin: false, is_salesman: false, is_merchant: true },
    { is_admin: false, is_salesman: false, is_merchant: false }
  ]
  
  for (let i = 0; i < count; i++) {
    const randomRole = roles[Math.floor(Math.random() * roles.length)]
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)) // 过去90天内随机时间
    
    users.push({
      id: Date.now() + i,
      name: `用户${Math.floor(Math.random() * 10000)}`,
      phone: `1${Math.floor(Math.random() * 9) + 3}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`,
      email: `user${Math.floor(Math.random() * 10000)}@example.com`,
      avatar: `/app/images/profile/default-avatar.png`,
      created_at: randomDate.toISOString(),
      last_login_at: new Date(randomDate.getTime() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      login_count: Math.floor(Math.random() * 100),
      status: Math.random() > 0.8 ? 'disabled' : 'active',
      ...randomRole
    })
  }
  
  return users
}

// ========== 准客户管理方法 ==========

// 加载准客户列表
const loadProspects = async (reset = false) => {
  if (reset) {
    prospectList.value = []
    prospectPagination.page = 1
  }

  prospectLoading.value = true

  try {
    const params = {
      page: prospectPagination.page,
      per_page: prospectPagination.perPage
    }

    if (prospectFilters.keyword) {
      params.keyword = prospectFilters.keyword.trim()
    }

    if (prospectFilters.status) {
      params.status = prospectFilters.status
    }

    console.log('🔍 [准客户管理] 请求参数:', params)

    const response = await request({
      url: '/api/mini/v1/admin/prospects',
      method: 'get',
      params
    })

    console.log('📊 [准客户管理] API响应:', response)

    if (response.code === 0 && response.data) {
      const paginationData = response.data.pagination || {}
      prospectList.value = response.data.list || []
      
      prospectPagination.page = paginationData.current_page || 1
      prospectPagination.lastPage = paginationData.last_page || 1
      prospectPagination.perPage = paginationData.per_page || 10
      prospectPagination.total = paginationData.total || 0

      prospectLoaded.value = true
      console.log(`✅ [准客户管理] 加载成功，共 ${prospectPagination.total} 条`)
    } else {
      showToast(response.message || '获取准客户数据失败')
    }
  } catch (error) {
    console.error('❌ [准客户管理] 加载失败:', error)
    showToast('加载失败，请重试')
  } finally {
    prospectLoading.value = false
    prospectRefreshing.value = false
  }
}

// 加载准客户统计数据
const loadProspectStats = async () => {
  try {
    const response = await request({
      url: '/api/mini/v1/admin/prospects/statistics',
      method: 'get'
    })
    if (response.code === 0 && response.data) {
      Object.assign(prospectStats, {
        total: response.data.total || 0,
        today_new: response.data.today_new || 0,
        unassigned: response.data.unassigned || 0,
        assigned: response.data.assigned || 0,
        pending: response.data.pending || 0,
        following: response.data.following || 0,
        converted: response.data.converted || 0
      })
    }
  } catch (error) {
    console.error('加载准客户统计失败:', error)
  }
}

// 刷新准客户列表
const refreshProspects = async () => {
  prospectRefreshing.value = true
  await Promise.all([loadProspects(true), loadProspectStats()])
}

// 准客户搜索
const onProspectSearch = () => {
  prospectFilters.keyword = (prospectFilters.keyword || '').trim()
  loadProspects(true)
}

// 重置准客户搜索
const onProspectReset = () => {
  prospectFilters.keyword = ''
  loadProspects(true)
}

// 准客户状态筛选
const onProspectStatusChange = (status) => {
  prospectFilters.status = status
  loadProspects(true)
}

// 准客户分页
const handleProspectPageChange = (page) => {
  if (page === prospectPagination.page) {
    loadProspects()
    return
  }
  prospectPagination.page = page
  loadProspects()
}

// 获取准客户状态类型
const getProspectStatusType = (prospect) => {
  if (!prospect.is_assigned) return 'default'
  switch (prospect.assignment_status) {
    case 'pending': return 'warning'
    case 'following': return 'primary'
    case 'converted': return 'success'
    case 'invalid': return 'danger'
    default: return 'default'
  }
}

// 获取准客户状态文本
const getProspectStatusText = (prospect) => {
  if (!prospect.is_assigned) return '未分配'
  return prospect.assignment_status_label || prospect.assignment_status_text || '—'
}

// 打开准客户分配弹窗
const openProspectAssignPopup = (prospect) => {
  currentProspect.value = prospect
  selectedProspectInstitution.value = null
  prospectInstitutionKeyword.value = ''
  prospectInstitutionList.value = []
  showProspectAssignPopup.value = true
}

// 搜索可分配的机构
const searchProspectInstitutions = async (keyword) => {
  const searchKeyword = typeof keyword === 'string' ? keyword : prospectInstitutionKeyword.value
  
  if (!searchKeyword || searchKeyword.length < 1) {
    prospectInstitutionList.value = []
    return
  }

  prospectInstitutionLoading.value = true
  try {
    const response = await request({
      url: '/api/mini/v1/admin/prospects/institutions',
      method: 'get',
      params: { keyword: searchKeyword }
    })

    if (response.code === 0) {
      prospectInstitutionList.value = response.data || []
    }
  } catch (error) {
    console.error('搜索机构失败:', error)
    prospectInstitutionList.value = []
  } finally {
    prospectInstitutionLoading.value = false
  }
}

// 机构搜索输入
const onProspectInstitutionInput = (value) => {
  if (prospectSearchTimeout) {
    clearTimeout(prospectSearchTimeout)
  }
  prospectSearchTimeout = setTimeout(() => {
    searchProspectInstitutions(value)
  }, 300)
}

// 选择机构
const selectProspectInstitution = (inst) => {
  selectedProspectInstitution.value = inst
}

// 确认分配准客户
const confirmProspectAssign = async () => {
  if (!selectedProspectInstitution.value || !currentProspect.value) {
    showToast('请选择要分配的机构')
    return
  }

  prospectAssigning.value = true
  try {
    const response = await request({
      url: '/api/mini/v1/admin/prospects/batch-assign',
      method: 'post',
      data: {
        prospect_ids: [currentProspect.value.id],
        institution_number: selectedProspectInstitution.value.institution_number
      }
    })

    if (response.code === 0) {
      showSuccessToast('分配成功')
      showProspectAssignPopup.value = false
      loadProspects(true)
    } else {
      showFailToast(response.message || '分配失败')
    }
  } catch (error) {
    console.error('分配准客户失败:', error)
    showFailToast('分配失败')
  } finally {
    prospectAssigning.value = false
  }
}

// 取消分配准客户
const cancelProspectAssign = async (prospect) => {
  if (!prospect || !prospect.id) return
  
  if (prospect.assignment_status !== 'pending') {
    showToast('仅待跟进状态可取消分配')
    return
  }

  showConfirmDialog({
    title: '确认取消分配',
    message: '取消后该准客户将变为未分配状态，确定要取消吗？'
  }).then(async () => {
    try {
      const response = await request({
        url: `/api/mini/v1/admin/prospects/${prospect.id}/cancel-assign`,
        method: 'delete'
      })

      if (response.code === 0) {
        showSuccessToast('已取消分配')
        showProspectDetailPopup.value = false
        loadProspects(true)
      } else {
        showFailToast(response.message || '取消失败')
      }
    } catch (error) {
      console.error('取消分配失败:', error)
      showFailToast('取消失败')
    }
  }).catch(() => {})
}

// 查看准客户详情
const viewProspectDetail = async (prospect) => {
  try {
    const response = await request({
      url: `/api/mini/v1/admin/prospects/${prospect.id}`,
      method: 'get'
    })

    if (response.code === 0 && response.data) {
      prospectDetail.value = response.data.customer
      showProspectDetailPopup.value = true
    } else {
      showFailToast(response.message || '获取详情失败')
    }
  } catch (error) {
    console.error('获取准客户详情失败:', error)
    showFailToast('获取详情失败')
  }
}

// 初始化组件
onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
.users-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding: 16px;
  padding-bottom: 80px;
}

.main-tabs {
  background: transparent;
}

:deep(.main-tabs .van-tabs__wrap) {
  background: transparent;
}

:deep(.main-tabs .van-tabs__nav) {
  margin-bottom: 8px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

:deep(.main-tabs .van-tab__text) {
  font-weight: 600;
}

:deep(.main-tabs .van-tabs__content) {
  padding-top: 0;
}

.tab-section {
  padding-bottom: 24px;
}

.tab-section--users {
  padding-bottom: 120px;
}

.institution-tab {
  margin-top: 0;
  padding-top: 0;
}

/* 准客户Tab样式 */
.prospects-tab {
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 100px;
}

/* 准客户统计卡片 */
.prospect-stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px;
  background: #f7f8fa;
}

.prospect-stats-cards .stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.prospect-stats-cards .stat-card:active {
  transform: scale(0.98);
}

.prospect-stats-cards .stat-card .stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  line-height: 1.2;
}

.prospect-stats-cards .stat-card .stat-label {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.prospect-stats-cards .stat-card--primary .stat-value {
  color: #1989fa;
}

.prospect-stats-cards .stat-card--success .stat-value {
  color: #07c160;
}

.prospect-stats-cards .stat-card--warning .stat-value {
  color: #ff976a;
}

.prospect-stats-cards .stat-card--info .stat-value {
  color: #909399;
}

.prospects-filter {
  margin-top: 0;
}

.prospect-status-filter {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  overflow-x: auto;
}

.prospect-status-filter .status-tab {
  padding: 6px 16px;
  font-size: 13px;
  color: #646566;
  background: #f5f5f5;
  border-radius: 16px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.prospect-status-filter .status-tab.active {
  color: #fff;
  background: #1989fa;
}

.prospect-list {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prospect-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.prospect-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.prospect-card__title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.prospect-card__info {
  flex: 1;
}

.prospect-card__name {
  font-size: 15px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.prospect-card__meta {
  font-size: 12px;
  color: #969799;
}

.prospect-card__body {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.prospect-info-row {
  display: flex;
  font-size: 13px;
  margin-bottom: 6px;
}

.prospect-info-row:last-child {
  margin-bottom: 0;
}

.prospect-info-row .label {
  color: #969799;
  min-width: 80px;
}

.prospect-info-row .value {
  color: #323233;
}

.prospect-card__footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.prospect-empty {
  padding: 60px 0;
}

/* 准客户分配弹窗 */
.prospect-assign-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.prospect-assign-popup .popup-header {
  padding: 20px 16px;
  border-bottom: 1px solid #ebedf0;
}

.prospect-assign-popup .popup-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.prospect-assign-popup .popup-header p {
  margin: 0;
  font-size: 13px;
  color: #969799;
}

.prospect-assign-popup .popup-content {
  flex: 1;
  overflow-y: auto;
}

.prospect-assign-popup .institution-list {
  padding: 0;
}

.prospect-assign-popup .institution-list .selected {
  background: #f0f9ff;
}

.prospect-assign-popup .popup-footer {
  padding: 12px 16px;
  border-top: 1px solid #ebedf0;
}

/* 准客户详情弹窗 */
.prospect-detail-popup {
  height: 100%;
  overflow-y: auto;
  background: #f7f8fa;
}

.prospect-detail-popup .detail-header {
  display: flex;
  gap: 16px;
  padding: 24px 16px;
  background: #fff;
  align-items: center;
}

.prospect-detail-popup .detail-info {
  flex: 1;
}

.prospect-detail-popup .detail-name {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.prospect-detail-popup .detail-phone {
  font-size: 14px;
  color: #969799;
  margin-bottom: 8px;
}

.prospect-detail-popup .detail-actions {
  padding: 16px;
}

.search-filter {
  margin: 0;
  position: static;
  background-color: transparent;
  padding-bottom: 0;
}

.institution-filter {
  margin-top: 0;
}

.action-buttons {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.action-buttons--top {
  margin-top: 0;
  margin-bottom: 8px;
}
.action-buttons--left {
  justify-content: flex-start;
}
.action-buttons--right {
  justify-content: flex-end;
}

.institution-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.detail-sheet {
  flex: 1;
  padding: 18px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f0f2f5;
}

.sheet-header__left {
  display: flex;
  gap: 12px;
}

.sheet-header__avatar {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.sheet-header__left .name {
  font-size: 17px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 4px;
}

.sheet-header__left .meta {
  font-size: 12px;
  color: #979da7;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.sheet-header__left .tags {
  margin-top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sheet-header__right {
  display: flex;
  gap: 12px;
  min-width: 150px;
  justify-content: flex-end;
}

.sheet-header__right .label {
  font-size: 11px;
  color: #a0a4ab;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.sheet-header__right .value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-top: 2px;
}

.sheet-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.metric {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #f0f2f5;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2d3d;
  margin-top: 4px;
}

.metric-desc {
  font-size: 11px;
  color: #1989fa;
  margin-top: 2px;
}

.sheet-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-block {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f2f5;
  padding: 12px 14px;
}

.info-title {
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #4e5969;
  padding: 6px 0;
  border-bottom: 1px dashed #f0f2f5;
}

.info-row:last-child {
  border-bottom: none;
}
.info-row.no-border {
  border-bottom: none;
}

.value-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2d3d;
}

.hierarchy-row {
  align-items: flex-start;
}

.hierarchy-text {
  max-width: 220px;
  line-height: 1.5;
  color: #303133;
  word-break: break-all;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.chip {
  padding: 8px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: #4e5969;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  text-align: center;
}

.chip.active {
  color: #1989fa;
  border-color: rgba(25, 137, 250, 0.3);
  background: rgba(25, 137, 250, 0.05);
}

.chip.muted {
  color: #a0a4ab;
}
.user-list-inner {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}

.institution-summary {
  display: flex;
  gap: 12px;
  margin: 12px 0;
  overflow-x: auto;
  padding-bottom: 4px;
}

.summary-card {
  min-width: 140px;
  background: linear-gradient(135deg, #eef2ff 0%, #fdf2ff 100%);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(116, 144, 255, 0.16);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  color: #6366f1;
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.summary-desc {
  font-size: 12px;
  color: #6b7280;
}

.institution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.institution-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.institution-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.institution-card__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.institution-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.institution-card__name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.institution-card__meta {
  font-size: 12px;
  color: #909399;
}

.institution-card__stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-block {
  flex: 1;
  min-width: 30%;
  background: #f7f8fa;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.stat-desc {
  font-size: 12px;
  color: #1989fa;
}

.institution-card__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.institution-card__region {
  color: #323233;
}

.institution-card__updated {
  color: #c8c9cc;
}

.institution-empty {
  padding: 40px 0;
}

.create-institution-popup .popup-header {
  padding: 16px 20px 8px;
  border-bottom: 1px solid #f5f5f5;
}

.create-institution-popup .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-institution-popup .header-title h3 {
  margin: 0;
  font-size: 18px;
}

.create-institution-popup .header-subtitle {
  color: #888;
  font-size: 13px;
  margin-top: 4px;
}

.create-institution-popup .popup-content {
  padding: 12px 16px 4px;
}

.create-institution-popup .popup-footer {
  padding: 12px 16px 20px;
}

.region-row {
  display: flex;
  gap: 8px;
  margin: 8px 0 4px;
}

.region-item {
  flex: 1;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  padding: 4px 8px;
  background: #fff;
}

.region-item :deep(.van-cell__title) {
  flex: none;
  margin-right: 6px;
  color: #646566;
}

.region-item :deep(.van-cell__value) {
  color: #323233;
  font-weight: 500;
}

.region-item--disabled {
  opacity: 0.5;
}

.salesman-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.salesman-toggle .invite-code {
  color: #07c160;
  font-weight: 600;
  font-size: 12px;
}


.pagination-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 16px 0 8px;
  padding: 16px 0 12px;
  border-top: 1px solid #f0f2f5;
  text-align: center;
}

.pagination-info {
  font-size: 13px;
  color: #323233;
}

.pagination-bar :deep(.van-pagination) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.pagination-bar :deep(.van-pagination button) {
  min-width: 68px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #d7d8db;
  font-size: 13px;
  color: #1989fa;
  background: #fff;
}

.pagination-bar :deep(.van-pagination button:disabled) {
  color: #c8c9cc;
  border-color: #f0f0f0;
  background: #f7f8fa;
}

.pagination-bar :deep(.van-pagination__page-desc) {
  min-width: 72px;
  text-align: center;
  font-size: 12px;
  color: #646566;
}

.user-card {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.user-header {
  padding: 16px;
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: bold;
  margin-right: 8px;
}

.user-detail {
  font-size: 14px;
  color: #646566;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-id {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
}

.user-meta {
  font-size: 12px;
  color: #969799;
  display: flex;
  justify-content: space-between;
}

.user-status {
  font-weight: bold;
}

.status-active {
  color: #07c160;
}

.status-pending {
  color: #ff976a;
}

.status-disabled {
  color: #ee0a24;
}

.user-actions {
  padding: 8px;
}

.user-actions .van-icon {
  font-size: 20px;
  color: #969799;
  transition: transform 0.3s;
}

.rotate {
  transform: rotate(180deg);
}

.user-details {
  border-top: 1px solid #f2f3f5;
  padding: 12px 16px;
  background-color: #fafafa;
}

.role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.user-action-buttons {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.loading-state, .empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.fab-button {
  position: fixed;
  right: 16px;
  bottom: 24px;
  z-index: 9999;
}

.van-floating-bubble {
  width: 56px;
  height: 56px;
  background-color: #1989fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
}

/* 对话框样式 */
:deep(.van-dialog__content) {
  padding: 16px;
}

:deep(.van-cell) {
  padding: 10px 0;
}

:deep(.van-checkbox) {
  margin-right: 12px;
}

/* 编辑弹窗样式 */
.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
  background: #fff;
}

.popup-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
  background: #f7f8fa;
}

.popup-footer {
  padding: 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
}

.role-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-checkboxes .van-checkbox {
  margin-bottom: 8px;
}

.vip-section,
.institution-section,
.engineer-section {
  margin-top: 16px;
}

.avatar-preview {
  display: flex;
  align-items: center;
}

.wechat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.no-avatar {
  color: #969799;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 0 16px;
}

@media (max-width: 420px) {
  .stat-block {
    min-width: 45%;
  }
}

.user-operations {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 0 16px;
}

.user-operations .van-button {
  flex: 1;
}

.user-action-buttons {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.user-action-buttons .van-button {
  font-size: 12px;
  padding: 4px 8px;
  min-width: auto;
}

.user-action-buttons .van-button .van-icon {
  margin-right: 2px;
}

/* 推荐人信息样式 */
/* 美化的编辑弹窗样式 */
.edit-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.popup-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-content {
  text-align: center;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 400;
}

.popup-content {
  flex: 1;
  overflow-y: auto;
  background: white;
  margin: 0 8px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.popup-footer {
  padding: 16px 20px;
  background: white;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

/* 表单区域样式 */
.form-section {
  padding: 16px;
}

.avatar-section {
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(252, 182, 159, 0.3);
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar-large {
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.avatar-info {
  flex: 1;
}

.avatar-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.avatar-id {
  font-size: 14px;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.form-group {
  margin-bottom: 24px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

/* 推荐人展示样式 */
.referrer-card {
  margin: 12px 16px 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e6ebf1;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(247, 248, 252, 1) 100%);
  box-shadow: 0 6px 20px rgba(15, 69, 120, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.referrer-card--empty {
  background: linear-gradient(135deg, #fafafa 0%, #f3f6f9 100%);
  border: 1px dashed #d9dfe6;
  box-shadow: none;
}

.referrer-card--official {
  background: linear-gradient(135deg, #f0f7ff 0%, #fff5f8 100%);
  border-color: rgba(76, 132, 255, 0.35);
}

.referrer-card--custom {
  background: linear-gradient(135deg, #ecfff8 0%, #ffffff 100%);
  border-color: rgba(26, 188, 156, 0.35);
}

.referrer-card--error {
  border-color: #ee0a24;
  box-shadow: 0 0 0 2px rgba(238, 10, 36, 0.12);
}

.referrer-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.referrer-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.referrer-card__status {
  font-size: 12px;
  border-radius: 999px;
  padding: 4px 10px;
  line-height: 1;
  font-weight: 500;
}

.referrer-card__status--empty {
  color: #909399;
  background: rgba(144, 147, 153, 0.12);
}

.referrer-card__status--official {
  color: #3f6ae4;
  background: rgba(63, 106, 228, 0.15);
}

.referrer-card__status--active {
  color: #16a085;
  background: rgba(22, 160, 133, 0.15);
}

.referrer-card__body {
  display: flex;
  align-items: center;
  gap: 14px;
}

.referrer-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.referrer-card__name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
}

.referrer-card__detail {
  font-size: 13px;
  color: #606266;
}

.referrer-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.referrer-card__tag {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 500;
  border: 1px solid transparent;
}

.referrer-card__tag--official {
  color: #4a6cf7;
  border-color: rgba(74, 108, 247, 0.4);
  background: rgba(74, 108, 247, 0.08);
}

.referrer-card__tag--user {
  color: #16a085;
  border-color: rgba(22, 160, 133, 0.4);
  background: rgba(22, 160, 133, 0.08);
}

.referrer-error-text {
  margin: 8px 16px 0;
  font-size: 12px;
  color: #ee0a24;
}

/* 推荐人选择器样式 */
.referrer-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.picker-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.picker-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.picker-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.picker-search {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.picker-meta {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.picker-meta__current {
  color: #1989fa;
}

.picker-content {
  flex: 1;
  overflow-y: auto;
}

.official-option {
  background: #f0f9ff;
  border-bottom: 1px solid #e0f2fe;
}

.referrer-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.referrer-detail {
  margin-top: 4px;
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.referrer-phone {
  color: #1989fa;
}

.referrer-id {
  background: rgba(25, 137, 250, 0.08);
  color: #1989fa;
  padding: 2px 6px;
  border-radius: 999px;
}

.official-avatar {
  border-radius: 50%;
  background: white;
  padding: 4px;
  box-shadow: 0 4px 10px rgba(35, 129, 255, 0.15);
}

.referrer-list {
  background: white;
}

.loading-container,
.empty-container {
  padding: 40px 20px;
  text-align: center;
}

.picker-footer {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #eee;
}

/* 选中状态样式 */
.van-cell.selected {
  background: #e8f4fd;
  border-left: 4px solid #1989fa;
}

.van-cell.selected .referrer-name {
  color: #1989fa;
  font-weight: 600;
}

/* Tab样式优化 */
:deep(.van-tabs__nav) {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.van-tab) {
  font-weight: 500;
}

:deep(.van-tab--active) {
  font-weight: 600;
}

/* Field样式优化 */
:deep(.van-field) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.van-field:last-child) {
  border-bottom: none;
}

:deep(.van-field__left-icon) {
  color: #1989fa;
  margin-right: 8px;
}

/* Button样式优化 */
:deep(.van-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.van-button--primary:active) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* 上级机构选择器样式 */
.parent-institution-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.no-parent-option {
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.no-parent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebedf0;
}

.institution-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}
.parent-institution-list .institution-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.institution-name__text {
  font-weight: 600;
  color: #2c3e50;
}
.institution-brief {
  margin-top: 6px;
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
  flex-wrap: wrap;
  align-items: center;
}

.institution-number {
  color: #1989fa;
  font-weight: 500;
}

.parent-institution-list {
  background: white;
}

.institution-avatar {
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.institution-phone {
  color: #1989fa;
  font-size: 12px;
  margin-left: 4px;
}

.picker-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 0 4px;
  font-size: 12px;
  color: #666;
}

.picker-meta__current {
  color: #1989fa;
  font-weight: 500;
}

.no-parent-option {
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.no-parent-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebedf0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.institution-name {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
}

.institution-detail {
  margin-top: 4px;
  display: flex;
  gap: 6px;
  font-size: 12px;
  color: #909399;
  align-items: center;
}

/* 选中状态的增强效果 */
.van-cell.selected {
  background: linear-gradient(135deg, rgba(25, 137, 250, 0.08) 0%, rgba(25, 137, 250, 0.04) 100%);
  border-left: 4px solid #1989fa;
}

.van-cell.selected .institution-name {
  color: #1989fa;
  font-weight: 700;
}

/* 新增机构表单美化样式 */
.create-institution-wizard {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow: hidden;
}

/* 步骤指示器 */
.wizard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.header-content {
  text-align: center;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
}

.header-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.wizard-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
  transform: scale(1.1);
}

.step-item.completed .step-number {
  background: #07c160;
  color: white;
}

.step-label {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 500;
}

.step-item.active .step-label {
  opacity: 1;
  font-weight: 600;
}

.step-line {
  width: 40px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

.step-item.completed + .step-line {
  background: #07c160;
}

/* 表单内容区域 */
.wizard-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  margin: 0 8px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
}

.wizard-step {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.step-header {
  text-align: center;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 248, 252, 1) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.step-header h4 {
  margin: 8px 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.step-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.step-header .van-icon {
  margin-bottom: 8px;
}

/* 增强的表单字段 */
.form-group-enhanced {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.2s ease;
}

.form-field-wrapper:focus-within {
  border-color: #1989fa;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.15);
  transform: translateY(-1px);
}

.enhanced-field {
  padding: 0;
  border-radius: 12px;
}

.enhanced-field .van-field__input {
  padding: 16px 20px;
  font-size: 16px;
  border-radius: 12px;
}

.enhanced-field .van-field__label {
  padding: 12px 20px 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.enhanced-field .van-field__left-icon {
  color: #1989fa;
  margin-left: 16px;
}

.auto-sync-hint {
  font-size: 12px;
  color: #07c160;
  background: rgba(7, 193, 96, 0.1);
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

/* 上级机构选择器 */
.parent-institution-field {
  margin-top: 8px;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px 8px;
  font-weight: 600;
  color: #2c3e50;
}

.field-tip {
  font-size: 12px;
  color: #969799;
  font-weight: 400;
}

.institution-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s ease;
}

.institution-selector:hover {
  background: rgba(25, 137, 250, 0.05);
}

.selector-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c8c9cc;
  font-size: 16px;
}

.selector-value {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.institution-info {
  flex: 1;
}

.institution-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.institution-detail {
  font-size: 12px;
  color: #969799;
}

/* 地区选择器 */
.region-selector-enhanced {
  margin-bottom: 24px;
}

.region-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
  font-weight: 600;
  color: #2c3e50;
}

.required-mark {
  color: #ee0a24;
  font-weight: bold;
}

.region-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.region-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.region-item:hover:not(.disabled) {
  border-color: #1989fa;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.15);
  transform: translateY(-1px);
}

.region-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.region-label {
  font-weight: 600;
  color: #2c3e50;
}

.region-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.region-placeholder {
  color: #c8c9cc;
}

/* 权限设置 */
.permissions-section {
  margin-top: 20px;
}

.permissions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
  font-weight: 600;
  color: #2c3e50;
}

.enhanced-switch-group {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.enhanced-switch-group .van-cell {
  padding: 20px;
}

.enhanced-switch-group .van-cell__title {
  font-weight: 600;
  color: #2c3e50;
}

.enhanced-switch-group .van-cell__label {
  color: #969799;
  margin-top: 4px;
}

/* 步骤导航 */
.wizard-footer {
  padding: 20px;
  background: white;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.step-navigation {
  margin-bottom: 12px;
}
.step-actions-inline {
  display: flex;
  gap: 12px;
  align-items: center;
}
.step-actions-inline .van-button {
  flex: 1;
}

.prev-btn,
.next-btn,
.submit-btn {
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.prev-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  color: #2c3e50;
  border: 1px solid #e6ebf1;
}

.next-btn,
.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.cancel-btn {
  color: #969799;
  border: 1px solid #e6ebf1;
  font-weight: 500;
}

/* 响应式设计 */
@media (min-width: 420px) {
  .region-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .form-group-enhanced {
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .form-field-wrapper {
    flex: 1;
    min-width: calc(50% - 8px);
  }
}
</style>
