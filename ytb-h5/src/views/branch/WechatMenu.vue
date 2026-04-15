<template>
  <div id="wechat_menu">
    <!-- 菜单状态控制区域 -->
    <div class="platform-menu-status" id="menuStatus">
      <div class="icon">
        <i class="wi wi-custommenu color-default"></i>
      </div>
      <div class="desc">
        <div class="item">自定义菜单</div>
        <div class="item color-gray">该功能{{ menuDisplay === 1 ? '已开启' : '未启用' }}</div>
      </div>
      <div class="action">
        <a class="btn btn-primary" @click="setMenu(menuDisplay)">
          {{ menuDisplay === 1 ? '停用' : '启用' }}
        </a>
      </div>
    </div>

    <!-- 功能未开启提示 -->
    <div v-if="menuDisplay !== 1" class="platform-menu-close color-gray">
      <i class="wi wi-info"></i>该功能未开启，如需使用请先点击启用
    </div>

    <!-- 菜单管理主体 -->
    <div v-else>
      <!-- 标签页 -->
      <ul class="we7-page-tab">
        <li :class="{ active: activeTab === 'post' }">
          <a href="#" @click.prevent="activeTab = 'post'">当前菜单</a>
        </li>
        <li :class="{ active: activeTab === 'display' }">
          <a href="#" @click.prevent="activeTab = 'display'">历史菜单</a>
        </li>
      </ul>

      <!-- 历史菜单列表 -->
      <div v-if="activeTab === 'display'" class="clearfix" id="menuDisplay">
        <div class="we7-margin-bottom clearfix">
          <ul class="btn-group-sub" style="margin-bottom: 0;">
            <a href="#" @click.prevent="activeTab = 'post'" class="btn">当前菜单</a>
            <a href="#" class="btn active">历史菜单</a>
          </ul>
          <div class="pull-right">
            <a href="#" @click.prevent="addNewMenu" class="btn btn-primary we7-padding-horizontal">
              +添加新菜单
            </a>
          </div>
        </div>

        <table class="table we7-table table-hover vertical-middle we7-form">
          <col width="200px"/>
          <col />
          <col width="180px"/>
          <col width="220px"/>
          <tr>
            <th class="text-left">菜单组名</th>
            <th class="text-left">显示对象</th>
            <th>是否在微信生效<div class="color-gray">(只能生效一个默认菜单)</div></th>
            <th class="text-right">操作</th>
          </tr>
          <tr v-for="menu in menuList" :key="menu.id">
            <td class="text-left">
              {{ menu.title || '默认菜单' }}
            </td>
            <td class="text-left">
              <span v-if="menu.type === 'conditional'">
                <span v-if="menu.sex > 0">性别:{{ getSexName(menu.sex) }};</span>
                <span v-if="menu.group_id !== -1">粉丝标签:{{ getGroupName(menu.group_id) }};</span>
                <span v-if="menu.client_platform_type > 0">客户端:{{ getClientTypeName(menu.client_platform_type) }};</span>
                <span v-if="menu.area">地区:{{ menu.area }}</span>
              </span>
              <span v-else>所有粉丝</span>
            </td>
            <td>
              <label v-if="menu.type !== 'currentself'" style="margin: 0; vertical-align: middle;">
                <input 
                  type="checkbox" 
                  style="display: none;" 
                  :checked="menu.status === 1"
                  @change="changeStatus(menu.id, menu.status, menu.type)"
                >
                <div class="switch" :class="{ switchOn: menu.status === 1 }"></div>
              </label>
              <a v-else-if="menu.status === 0" 
                 href="javascript:;" 
                 class="color-default" 
                 @click="changeStatus(menu.id, menu.status, menu.type)">
                点击生效
              </a>
            </td>
            <td>
              <div class="link-group">
                <a href="#" @click.prevent="editMenu(menu)">
                  {{ menu.type === 'currentself' ? '编辑' : '查看' }}
                </a>
                <a v-if="menu.type === 'conditional'" 
                   href="#" 
                   @click.prevent="copyMenu(menu.id)">
                  复制
                </a>
                <a v-if="menu.type !== 'currentself' || (menu.type === 'currentself' && menu.status === 0)" 
                   href="javascript:void(0);" 
                   class="del" 
                   @click="deleteMenu(menu.id)">
                  删除
                </a>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- 菜单编辑区域 -->
      <div v-if="activeTab === 'post'" class="conditionMenu menu-post-page" id="conditionMenuDesigner">
        <div class="new">
          <!-- 面包屑导航 -->
          <ol v-if="!isDefaultMenu" class="breadcrumb we7-breadcrumb">
            <a href="#" @click.prevent="goBack"><i class="wi wi-back-circle"></i></a>
            <li><a href="#" @click.prevent="goBack">自定义菜单</a></li>
            <li>{{ currentMenuId ? '编辑菜单' : '新建菜单' }}</li>
          </ol>

          <div class="we7-form">
            <!-- 菜单组名称 -->
            <div class="form-group">
              <label class="control-label col-sm-2">菜单组名称</label>
              <div class="form-controls col-sm-8">
                <input 
                  type="text" 
                  style="width: 600px" 
                  class="form-control"
                  v-model="currentGroup.title" 
                  :disabled="currentGroup.disabled"
                >
                <span class="help-block">给菜单组起个名字吧！以便查找</span>
              </div>
            </div>

            <!-- 菜单显示对象（个性化菜单） -->
            <div v-if="menuType !== 1" class="form-group">
              <label class="control-label col-sm-2">菜单显示对象</label>
              <div class="form-controls col-sm-8" style="z-index: 2">
                <select class="pull-left we7-margin-right" v-model="currentGroup.matchrule.sex" :disabled="currentGroup.disabled">
                  <option value="0">性别不限</option>
                  <option value="1">男</option>
                  <option value="2">女</option>
                </select>
                <select class="pull-left we7-margin-right" v-model="currentGroup.matchrule.group_id" :disabled="currentGroup.disabled">
                  <option value="-1">粉丝标签不限</option>
                  <option v-for="group in fanGroups" :key="group.id" :value="group.id">{{ group.name }}</option>
                </select>
                <select class="pull-left we7-margin-right" v-model="currentGroup.matchrule.client_platform_type" :disabled="currentGroup.disabled">
                  <option value="0">手机系统不限</option>
                  <option value="1">IOS(苹果)</option>
                  <option value="2">Android(安卓)</option>
                  <option value="3">Others(其他)</option>
                </select>
              </div>
            </div>

            <!-- 菜单设置区域 -->
            <div class="menu-setting-area">
              <!-- 左侧手机预览区域 -->
              <div class="menu-preview-area">
                <div class="mobile-menu-preview">
                  <div class="mobile-hd">{{ menuType === 3 ? "个性化菜单" : "默认菜单" }}</div>
                  <div class="mobile-bd">
                    <div class="js-quickmenu nav-menu-wx clearfix" :class="getMenuClass()">
                      <ul class="designer-x pre-menu-list">
                        <li 
                          v-for="(button, index) in currentGroup.button" 
                          :key="index"
                          class="js-sortable pre-menu-item" 
                          :class="{ active: activeItem === button }"
                        >
                          <input type="hidden" data-role="parent" :data-hash="button.$$hashKey"/>
                          <a 
                            href="javascript:void(0);" 
                            title="拖动排序" 
                            class="pre-menu-link" 
                            @click="editButton('', button)"
                          >
                            <i v-if="button.sub_button && button.sub_button.length > 0" class="icon-menu-dot"></i>
                            {{ button.name }}
                          </a>
                          <div class="sub-pre-menu-box">
                            <ul class="sub-pre-menu-list sub-designer-y">
                              <li v-for="(subButton, subIndex) in button.sub_button" :key="subIndex" class="sub-js-sortable">
                                <input type="hidden" data-role="sub" :data-hash="subButton.$$hashKey"/>
                                <span class="sub-pre-menu-inner" @click="editButton(subButton, button)">
                                  <span>{{ subButton.name }}</span>
                                </span>
                              </li>
                              <li v-if="button.sub_button.length < 5" @click="addSubButton(button)" class="sub-js-not-sortable">
                                <i class="fa fa-plus"></i>
                              </li>
                            </ul>
                          </div>
                        </li>
                        <li v-if="currentGroup.button.length < 3 && !currentGroup.disabled" class="pre-menu-item grid-item js-not-sortable">
                          <a href="javascript:void(0);" @click="addButton" class="pre-menu-link">
                            <i class="icon14-menu-add"></i>
                            <span>添加菜单</span>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧菜单配置区域 -->
              <div class="menu-form-area">
                <div v-if="!activeItem" class="menu-initial-tips tips-global">
                  👆 请点击左侧菜单进行配置
                </div>
                
                <div v-else class="portable-editor to-left">
                  <div class="editor-inner">
                    <!-- 菜单表单头部 -->
                    <div class="menu-form-hd">
                      <span class="pull-left font-defalut">当前菜单</span>
                      <div class="text-right">
                        <a href="javascript:void(0);" class="color-default" @click="removeButton(activeItem, activeType)">
                          删除该菜单
                        </a>
                      </div>
                    </div>

                    <!-- 菜单配置表单 -->
                    <div class="we7-form we7-padding-top">
                      <!-- 菜单名称 -->
                      <div class="form-group">
                        <label class="control-label col-sm-2">菜单名称</label>
                        <div class="form-controls col-sm-8">
                          <div class="input-group">
                            <input 
                              type="text" 
                              class="form-control" 
                              placeholder="字数不超过5个汉字或8个字母"
                              v-model="activeItem.name" 
                              :disabled="currentGroup.disabled"
                            >
                            <span v-if="!currentGroup.disabled" class="input-group-btn bg-default color-default">
                              <a href="javascript:;" class="btn btn-default" @click="selectEmoji">添加表情</a>
                            </span>
                          </div>
                          <span class="help-block">字数不超过5个汉字或8个字母</span>
                        </div>
                      </div>

                      <!-- 菜单类型选择 -->
                      <div v-if="activeItem.forceHide !== 1" class="form-group">
                        <label class="control-label col-sm-2">菜单内容</label>
                        <div class="form-controls col-sm-10">
                          <input id="radio-1" type="radio" name="menuType" value="click" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-1">发送消息</label>
                          
                          <input id="radio-2" type="radio" name="menuType" value="view" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-2">跳转网页</label>
                          
                          <input id="radio-3" type="radio" name="menuType" value="scancode_push" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-3">扫码</label>
                          
                          <input id="radio-4" type="radio" name="menuType" value="scancode_waitmsg" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-4">扫码（等待信息）</label>
                          
                          <input id="radio-5" type="radio" name="menuType" value="location_select" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-5">地理位置</label>
                          
                          <input id="radio-6" type="radio" name="menuType" value="pic_sysphoto" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-6">拍照发图</label>
                          
                          <input id="radio-7" type="radio" name="menuType" value="pic_photo_or_album" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-7">拍照相册</label>
                          
                          <input id="radio-8" type="radio" name="menuType" value="pic_weixin" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-8">相册发图</label>
                          
                          <input id="radio-9" type="radio" name="menuType" value="miniprogram" v-model="activeItem.type" :disabled="currentGroup.disabled">
                          <label for="radio-9">关联小程序</label>
                        </div>
                      </div>

                      <!-- 跳转网页/小程序配置 -->
                      <div v-if="(activeItem.type === 'view' || activeItem.type === 'miniprogram') && activeItem.forceHide !== 1" class="menu-content">
                        <div class="panel we7-panel panel-new">
                          <div class="panel-heading">
                            <span v-if="activeItem.type === 'view'">跳转网页</span>
                            <span v-if="activeItem.type === 'miniprogram'">关联小程序</span>
                            <span class="color-gray" v-if="activeItem.type === 'view'">订阅者点击该子菜单会跳转到以下链接</span>
                            <span class="color-gray" v-if="activeItem.type === 'miniprogram'">点击该菜单跳转到关联的小程序</span>
                          </div>
                          <div class="panel-body">
                            <!-- 网页地址 -->
                            <div v-if="activeItem.type === 'view'" class="form-group">
                              <label class="control-label col-sm-2">页面地址</label>
                              <div class="form-controls col-sm-8">
                                <div class="input-group">
                                  <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="activeItem.url" 
                                    :disabled="currentGroup.disabled"
                                    placeholder="请输入完整的URL地址，需包含http://"
                                  >
                                  <span v-if="!currentGroup.disabled" class="input-group-btn color-default">
                                    <a class="btn btn-default" @click="selectLink">选择地址</a>
                                  </span>
                                </div>
                                <span class="help-block">指定点击此菜单时要跳转的链接（注：链接需加http://）</span>
                              </div>
                            </div>
                            
                            <!-- 小程序配置 -->
                            <template v-if="activeItem.type === 'miniprogram'">
                              <div class="form-group col-sm-12">
                                <label class="control-label col-sm-2">APPID</label>
                                <div class="form-controls col-sm-7">
                                  <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="activeItem.appid" 
                                    :disabled="currentGroup.disabled" 
                                    placeholder="请确保小程序与公众号已关联，填写小程序的APPID"
                                  >
                                </div>
                              </div>
                              <div class="form-group col-sm-12">
                                <label class="control-label col-sm-2">页面</label>
                                <div class="form-controls col-sm-7">
                                  <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="activeItem.pagepath" 
                                    :disabled="currentGroup.disabled" 
                                    placeholder="请填写跳转页面的小程序访问路径"
                                  >
                                </div>
                              </div>
                              <div class="form-group col-sm-12">
                                <label class="control-label col-sm-2">备用网页</label>
                                <div class="form-controls col-sm-10">
                                  <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="activeItem.url" 
                                    :disabled="currentGroup.disabled" 
                                    placeholder="写入要跳转的链接"
                                  >
                                  <span class="help-block">旧版微信客户端不支持小程序，用户点击菜单时会打开该网页</span>
                                </div>
                              </div>
                            </template>
                          </div>
                        </div>
                      </div>

                      <!-- 发送消息配置 -->
                      <div v-if="activeItem.type === 'click' && activeItem.forceHide !== 1" class="panel we7-panel panel-new">
                        <div class="panel-heading">回复内容</div>
                        <div class="panel-body we7-padding">
                          <!-- 已选择的回复内容显示 -->
                          <ul v-if="activeItem.material && activeItem.material.length > 0" class="keywords-list">
                            <li v-for="(material, index) in activeItem.material" :key="index">
                              <div class="desc">
                                <div class="media-content">
                                  <a class="title-wrp" href="javascript:;">
                                    <span class="title">[关键字]{{ material.content || activeItem.key }}</span>
                                  </a>
                                </div>
                              </div>
                            </li>
                          </ul>
                          
                          <!-- 选择回复类型 -->
                          <div class="we7-padding-vertical-max">
                            <ul class="tab-reply-list">
                                                             <li class="tab-reply-item tab-appmsg" @click="selectMediaId('news', 'wx')">
                                 <div>
                                   <div class="reply-icon">📰</div>
                                   <p class="msg-tab-title">图文</p>
                                 </div>
                               </li>
                               <li class="tab-reply-item tab-img" @click="selectMediaId('image')">
                                 <div>
                                   <div class="reply-icon">🖼️</div>
                                   <p class="msg-tab-title">图片</p>
                                 </div>
                               </li>
                               <li class="tab-reply-item tab-cardmsg" @click="selectMediaId('keyword', '1')">
                                 <div>
                                   <div class="reply-icon">🔤</div>
                                   <p class="msg-tab-title">触发关键字</p>
                                 </div>
                               </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <!-- 其他类型菜单配置 -->
                      <div v-if="['scancode_push', 'scancode_waitmsg', 'location_select', 'pic_sysphoto', 'pic_photo_or_album', 'pic_weixin'].includes(activeItem.type) && activeItem.forceHide !== 1" 
                           class="panel we7-panel panel-new">
                        <div class="panel-heading">
                          <span v-if="activeItem.type === 'location_select'">地理位置</span>
                          <span v-if="activeItem.type === 'pic_sysphoto'">拍照发图</span>
                          <span v-if="activeItem.type === 'pic_photo_or_album'">拍照相册</span>
                          <span v-if="activeItem.type === 'pic_weixin'">相册发图</span>
                          <span v-if="activeItem.type === 'scancode_push'">扫码</span>
                          <span v-if="activeItem.type === 'scancode_waitmsg'">扫码（等待信息）</span>
                          
                          <span class="color-gray" v-if="activeItem.type === 'location_select'">
                            菜单内容为地理位置，那么点击这个菜单时，系统发送当前地理位置
                          </span>
                          <span class="color-gray" v-if="['pic_sysphoto', 'pic_photo_or_album'].includes(activeItem.type)">
                            菜单内容为系统拍照发图/拍照或者相册发图，那么点击这个菜单是，系统拍照
                          </span>
                          <span class="color-gray" v-if="activeItem.type === 'pic_weixin'">
                            菜单内容为微信相册发图，那么点击这个菜单是，选择图片发送
                          </span>
                          <span class="color-gray" v-if="['scancode_push', 'scancode_waitmsg'].includes(activeItem.type)">
                            菜单内容为扫码，那么点击这个菜单是，手机扫描二维码
                          </span>
                        </div>
                        <div class="panel-body we7-padding">
                          <div class="we7-padding-vertical-max">
                                                         <ul class="tab-reply-list">
                               <li class="tab-reply-item tab-cardmsg" @click="selectMediaId('keyword', '1')">
                                 <div>
                                   <div class="reply-icon">🔤</div>
                                   <p class="msg-tab-title">触发关键字</p>
                                 </div>
                               </li>
                             </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 底部操作按钮 -->
            <div class="menu-submit">
              <input 
                type="submit" 
                value="完成" 
                class="btn btn-primary" 
                @click="submit('publish')"
              />
              <input 
                v-if="!isDefaultMenu && menuType === 1" 
                type="submit" 
                value="仅保存" 
                class="btn btn-default" 
                @click="submit('save')"
              />
              <input 
                type="button" 
                value="预览" 
                class="btn btn-default" 
                @click="showPreview = true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="showPreview" class="modal fade show" style="display: block;">
      <div class="mobile-preview">
        <div class="mobile-preview-hd">
          <strong class="nickname">{{ menuType === 3 ? "个性化菜单" : "默认菜单" }}</strong>
        </div>
        <div class="mobile-preview-bd">
          <ul id="viewShow" class="show-list"></ul>
        </div>
        <div class="mobile-preview-ft">
          <ul class="pre-menu-list grid-line">
            <li v-for="(button, index) in currentGroup.button" :key="index" class="pre-menu-item grid-item">
              <a href="javascript:void(0);" class="pre-menu-link" :title="button.name">
                <i v-if="button.sub_button && button.sub_button.length > 0" class="icon-menu-dot"></i>
                {{ button.name }}
              </a>
              <div v-if="button.sub_button && button.sub_button.length > 0" class="sub-pre-menu-box" style="display: block;">
                <ul class="sub-pre-menu-list">
                  <li v-for="(subButton, subIndex) in button.sub_button" :key="subIndex">
                    <a href="javascript:void(0);" :title="subButton.name">{{ subButton.name }}</a>
                  </li>
                </ul>
                <i class="arrow arrow-out"></i>
                <i class="arrow arrow-in"></i>
              </div>
            </li>
          </ul>
        </div>
        <a href="javascript:void(0);" class="mobile-preview-closed btn btn-default" @click="showPreview = false">
          退出预览
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { wechatMenuApi } from '@/api/wechatMenu'
import { showToast, showConfirmDialog } from 'vant'

export default {
  name: 'WechatMenu',
  setup() {
    // 响应式数据
    const menuDisplay = ref(1)
    const activeTab = ref('post')
    const showPreview = ref(false)
    const menuType = ref(1)
    const currentMenuId = ref('')
    const isDefaultMenu = ref(true)
    
    // 菜单列表
    const menuList = ref([])
    
    // 粉丝分组
    const fanGroups = ref([])
    
    // 当前菜单组
    const currentGroup = reactive({
      title: '',
      disabled: false,
      type: 1,
      button: [],
      matchrule: {
        sex: '0',
        group_id: '-1',
        client_platform_type: '0',
        language: '',
        province: '',
        city: ''
      }
    })
    
    // 当前选中的菜单项
    const activeItem = ref(null)
    const activeType = ref('')
    
    // 计算属性
    const getMenuClass = computed(() => {
      const length = currentGroup.button.length
      return {
        'has-nav-0': length === 0,
        'has-nav-1': length === 1,
        'has-nav-2': length === 2,
        'has-nav-3': length >= 3
      }
    })
    
    // 方法
    const setMenu = async (status) => {
      try {
        const newStatus = status === 1 ? 0 : 1
        // 调用API设置菜单状态
        menuDisplay.value = newStatus
        showToast(newStatus === 1 ? '菜单已启用' : '菜单已停用')
      } catch (error) {
        showToast('操作失败')
      }
    }
    
    const addNewMenu = () => {
      activeTab.value = 'post'
      currentMenuId.value = ''
      isDefaultMenu.value = false
      resetCurrentGroup()
    }
    
    const resetCurrentGroup = () => {
      currentGroup.title = ''
      currentGroup.disabled = false
      currentGroup.type = 1
      currentGroup.button = []
      currentGroup.matchrule = {
        sex: '0',
        group_id: '-1',
        client_platform_type: '0',
        language: '',
        province: '',
        city: ''
      }
      activeItem.value = null
    }
    
    const editMenu = (menu) => {
      activeTab.value = 'post'
      currentMenuId.value = menu.id
      // 加载菜单数据
      loadMenuData(menu.id)
    }
    
    const loadMenuData = async (id) => {
      try {
        const response = await wechatMenuApi.getMenu(id)
        if (response.data) {
          Object.assign(currentGroup, response.data)
        }
      } catch (error) {
        showToast('加载菜单失败')
      }
    }
    
    const copyMenu = async (id) => {
      try {
        await wechatMenuApi.copyMenu(id)
        showToast('复制成功')
        loadMenuList()
      } catch (error) {
        showToast('复制失败')
      }
    }
    
    const deleteMenu = async (id) => {
      const confirmed = await showConfirmDialog({
        title: '确认删除',
        message: '删除默认菜单会清空所有菜单记录，确定吗？'
      })
      
      if (confirmed) {
        try {
          await wechatMenuApi.deleteMenu(id)
          showToast('删除成功')
          loadMenuList()
        } catch (error) {
          showToast('删除失败')
        }
      }
    }
    
    const changeStatus = async (id, status, type) => {
      try {
        await wechatMenuApi.toggleStatus(id)
        showToast('状态更新成功')
        loadMenuList()
      } catch (error) {
        showToast('状态更新失败')
      }
    }
    
    const addButton = () => {
      if (currentGroup.button.length >= 3) {
        showToast('最多只能添加3个一级菜单')
        return
      }
      
      const newButton = {
        name: '菜单名称',
        type: 'click',
        sub_button: [],
        material: [],
        forceHide: 0,
        $$hashKey: 'button_' + Date.now()
      }
      
      currentGroup.button.push(newButton)
      editButton('', newButton)
    }
    
    const addSubButton = (parentButton) => {
      if (parentButton.sub_button.length >= 5) {
        showToast('最多只能添加5个子菜单')
        return
      }
      
      const newSubButton = {
        name: '子菜单',
        type: 'click',
        material: [],
        forceHide: 0,
        $$hashKey: 'sub_' + Date.now()
      }
      
      parentButton.sub_button.push(newSubButton)
      editButton(newSubButton, parentButton)
    }
    
    const editButton = (subButton, parentButton) => {
      if (subButton) {
        activeItem.value = subButton
        activeType.value = 'sub'
      } else {
        activeItem.value = parentButton
        activeType.value = 'parent'
      }
    }
    
    const removeButton = (item, type) => {
      if (type === 'sub') {
        // 删除子菜单
        const parentIndex = currentGroup.button.findIndex(btn => 
          btn.sub_button && btn.sub_button.includes(item)
        )
        if (parentIndex !== -1) {
          const subIndex = currentGroup.button[parentIndex].sub_button.indexOf(item)
          currentGroup.button[parentIndex].sub_button.splice(subIndex, 1)
        }
      } else {
        // 删除主菜单
        const index = currentGroup.button.indexOf(item)
        if (index !== -1) {
          currentGroup.button.splice(index, 1)
        }
      }
      activeItem.value = null
    }
    
    const selectEmoji = () => {
      // 表情选择功能
      showToast('表情选择功能待实现')
    }
    
    const selectLink = () => {
      // 链接选择功能
      showToast('链接选择功能待实现')
    }
    
    const selectMediaId = (type, source) => {
      // 素材选择功能
      showToast(`选择${type}素材功能待实现`)
    }
    
    const submit = async (action) => {
      try {
        const data = {
          ...currentGroup,
          action
        }
        
        if (currentMenuId.value) {
          await wechatMenuApi.updateMenu(currentMenuId.value, data)
        } else {
          await wechatMenuApi.createMenu(data)
        }
        
        showToast(action === 'publish' ? '发布成功' : '保存成功')
        
        if (action === 'publish') {
          goBack()
        }
      } catch (error) {
        showToast('操作失败')
      }
    }
    
    const goBack = () => {
      activeTab.value = 'display'
      loadMenuList()
    }
    
    const loadMenuList = async () => {
      try {
        const response = await wechatMenuApi.getMenuList()
        menuList.value = response.data || []
      } catch (error) {
        showToast('加载菜单列表失败')
      }
    }
    
    // 辅助方法
    const getSexName = (sex) => {
      const names = { 1: '男', 2: '女' }
      return names[sex] || '不限'
    }
    
    const getGroupName = (groupId) => {
      const group = fanGroups.value.find(g => g.id === groupId)
      return group ? group.name : '不限'
    }
    
    const getClientTypeName = (type) => {
      const names = { 1: 'IOS(苹果)', 2: 'Android(安卓)', 3: 'Others(其他)' }
      return names[type] || '不限'
    }
    
    // 生命周期
    onMounted(() => {
      loadMenuList()
    })
    
    return {
      // 响应式数据
      menuDisplay,
      activeTab,
      showPreview,
      menuType,
      currentMenuId,
      isDefaultMenu,
      menuList,
      fanGroups,
      currentGroup,
      activeItem,
      activeType,
      
      // 计算属性
      getMenuClass,
      
      // 方法
      setMenu,
      addNewMenu,
      editMenu,
      copyMenu,
      deleteMenu,
      changeStatus,
      addButton,
      addSubButton,
      editButton,
      removeButton,
      selectEmoji,
      selectLink,
      selectMediaId,
      submit,
      goBack,
      getSexName,
      getGroupName,
      getClientTypeName
    }
  }
}
</script>

<style scoped>
@import '@/assets/css/wechat-menu.css';
</style>