# 分支机构微信公众号管理模块

## 概述

本模块为点点够系统分支机构提供完整的微信公众号管理功能，包含五个核心模块：

1. **自定义菜单** - 微信公众号菜单配置和管理
2. **自动回复** - 关键字回复、关注回复、默认回复设置
3. **粉丝管理** - 粉丝列表、分组管理、数据统计
4. **素材管理** - 图文、图片、语音、视频素材管理
5. **消息群发** - 群发消息创建、发送、统计

## 技术架构

### 前端技术栈
- **Vue 3** - 使用 Composition API
- **Element Plus** - UI 组件库
- **Vue Router** - 路由管理
- **Axios** - HTTP 请求封装

### 后端API
- **Laravel RESTful API** - 统一的API接口规范
- **路径格式**: `/api/admin/v1/branches/{branch_id}/wechat/`
- **认证方式**: Laravel Sanctum

## 模块详情

### 1. 自定义菜单 (Menu.vue)
**功能特性:**
- 菜单组管理（创建、编辑、删除）
- 菜单项配置（点击事件、跳转链接、小程序等）
- 菜单发布到微信公众号
- 菜单同步和预览
- 发布历史记录

**主要API:**
- `GET /api/admin/v1/branches/{id}/wechat/menu` - 获取菜单列表
- `POST /api/admin/v1/branches/{id}/wechat/menu` - 保存菜单
- `POST /api/admin/v1/branches/{id}/wechat/menu/publish` - 发布菜单

### 2. 自动回复 (AutoReply.vue)
**功能特性:**
- 关键字回复规则管理
- 关注回复设置
- 默认回复配置
- 支持文本、图片、图文三种回复类型
- 素材选择器集成

**主要API:**
- `GET /api/admin/v1/branches/{id}/wechat/keywords` - 获取关键字回复
- `POST /api/admin/v1/branches/{id}/wechat/keywords` - 创建关键字回复
- `PUT /api/admin/v1/branches/{id}/wechat/keywords/{id}` - 更新关键字回复

### 3. 粉丝管理 (FansManagement.vue)
**功能特性:**
- 粉丝列表展示和搜索
- 粉丝分组管理
- 粉丝标签管理
- 粉丝数据统计
- 批量操作和导出

**主要API:**
- `GET /api/admin/v1/branches/{id}/wechat/fans` - 获取粉丝列表
- `GET /api/admin/v1/branches/{id}/wechat/fans/{openid}` - 获取粉丝详情
- `POST /api/admin/v1/branches/{id}/wechat/fans/sync` - 同步粉丝数据

### 4. 素材管理 (MaterialManagement.vue)
**功能特性:**
- 按类型管理素材（图文、图片、语音、视频）
- 素材上传和预览
- 图文消息创建和编辑
- 素材同步和删除

**主要API:**
- `GET /api/admin/v1/branches/{id}/wechat/materials/{type}` - 获取素材列表
- `POST /api/admin/v1/branches/{id}/wechat/materials/{type}/upload` - 上传素材
- `DELETE /api/admin/v1/branches/{id}/wechat/materials/{type}/{media_id}` - 删除素材

### 5. 消息群发 (MassMessage.vue)
**功能特性:**
- 群发消息创建和编辑
- 支持多种消息类型（文本、图文、图片、语音、视频）
- 发送对象选择（全部粉丝、按分组、按标签）
- 立即发送和定时发送
- 发送统计和历史记录

**主要API:**
- `GET /api/admin/v1/branches/{id}/wechat/mass-messages` - 获取群发消息
- `POST /api/admin/v1/branches/{id}/wechat/mass-messages` - 创建群发消息
- `POST /api/admin/v1/branches/{id}/wechat/mass-messages/{id}/send` - 发送消息

## 公共组件

### MaterialSelector.vue
**用途:** 通用的素材选择器组件
**特性:**
- 支持多种素材类型选择
- 分页加载和搜索
- 响应式设计
- 可配置允许的素材类型

**使用方法:**
```vue
<MaterialSelector
  v-model="showSelector"
  :branch-id="branchId"
  :default-type="'news'"
  @select="handleMaterialSelect"
/>
```

## 路由配置

```javascript
// 分支机构微信管理路由
{
  path: 'wechat/menu',
  name: 'BranchWechatMenu',
  component: () => import('../views/branch/wechat/Menu.vue'),
  meta: { title: '自定义菜单', icon: 'menu' }
},
{
  path: 'wechat/auto-reply',
  name: 'BranchWechatAutoReply',
  component: () => import('../views/branch/wechat/AutoReply.vue'),
  meta: { title: '自动回复', icon: 'chat-line-round' }
},
{
  path: 'wechat/fans',
  name: 'BranchWechatFans',
  component: () => import('../views/branch/wechat/FansManagement.vue'),
  meta: { title: '粉丝管理', icon: 'user' }
},
{
  path: 'wechat/materials',
  name: 'BranchWechatMaterials',
  component: () => import('../views/branch/wechat/MaterialManagement.vue'),
  meta: { title: '素材管理', icon: 'folder' }
},
{
  path: 'wechat/mass-message',
  name: 'BranchWechatMassMessage',
  component: () => import('../views/branch/wechat/MassMessage.vue'),
  meta: { title: '消息群发', icon: 'promotion' }
}
```

## API 封装

所有API调用统一通过 `@/api/branchWechatMenu.js` 进行封装：

```javascript
import { branchWechatMenuApi } from '@/api/branchWechatMenu'

// 示例用法
const response = await branchWechatMenuApi.getWechatFans(branchId, params)
```

## 开发规范

### 1. 组件命名
- 使用 PascalCase 命名组件文件
- 组件名称要有明确的业务含义

### 2. API 调用
- 统一使用封装的API方法
- 错误处理要完整，用户友好
- 加载状态要明确显示

### 3. 样式规范
- 使用 scoped 样式避免污染
- 遵循 Element Plus 设计规范
- 响应式设计考虑

### 4. 数据流管理
- 使用 Vue 3 Composition API
- 合理使用 reactive 和 ref
- 避免直接修改 props

## 部署说明

### 前端构建
```bash
# 在 admin 目录下执行
npm run build
# 或使用构建脚本
./build.sh
```

### 后端API
确保以下API路由已正确配置：
- 分支机构微信管理相关控制器
- 认证中间件配置
- 数据库迁移文件

## 注意事项

1. **权限控制**: 所有API都需要通过 `auth:sanctum` 中间件认证
2. **分支机构隔离**: 确保数据按分支机构正确隔离
3. **微信API限制**: 注意微信公众号API的调用频率限制
4. **文件上传**: 素材上传需要配置正确的存储路径和权限
5. **错误处理**: 完善的错误提示和日志记录

## 维护和扩展

### 添加新功能
1. 在对应的Vue组件中添加功能
2. 在API文件中添加相应的接口方法
3. 更新路由配置（如需要）
4. 添加相应的后端API接口

### 问题排查
1. 检查浏览器开发者工具的网络请求
2. 查看Laravel日志文件
3. 确认数据库数据是否正确
4. 验证微信公众号配置

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 完成自定义菜单模块
- ✅ 完成自动回复模块
- ✅ 完成粉丝管理模块
- ✅ 完成素材管理模块
- ✅ 完成消息群发模块
- ✅ 创建公共素材选择器组件
- ✅ 完善API接口封装
- ✅ 添加路由配置 