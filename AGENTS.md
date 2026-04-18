# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

亿拓宝(YTB)是一个 Vue3 + Laravel 的全栈项目，包含管理后台(ytb-frontend)、H5移动端(ytb-h5)和PHP后端(ytb-backend)。部署域名: ytb.ddg.org.cn。

## 常用命令

### ytb-frontend (管理后台)
```bash
cd ytb-frontend
npm run dev    # 开发服务器 (localhost:3000，代理 /api 到 localhost:8000)
npm run build  # 生产构建
```

### ytb-h5 (移动端)
```bash
cd ytb-h5
npm run dev              # 开发服务器
npm run build:ytb        # 亿拓宝H5构建
npm run build:force      # 强制构建
```

### ytb-backend (Laravel API)
```bash
cd ytb-backend
php artisan serve --port=8000  # 启动开发服务器
php artisan migrate            # 数据库迁移
php artisan db:seed            # 数据库填充
```

### 部署脚本
```bash
./deploy.sh      # 部署管理后台到 ytb.ddg.org.cn/admin/
./deploy-h5.sh   # 部署H5到 ytb.ddg.org.cn/app/
```

## 架构概览

### 三项目结构
- **ytb-frontend**: Vue 3 管理后台，Element Plus UI，路由 `/admin/`，Vite + Vue Router (hash模式)
- **ytb-h5**: Vue 3 移动端应用，Vant UI，路由 `/app/`，Vite 构建
- **ytb-backend**: Laravel PHP API，所有 `/api/` 请求 rewrite 到 api.php 处理

### Nginx URL 重写规则
- `/admin/` → 前端 Vue SPA (try_files)
- `/app/` → H5 Vue SPA
- `/api/xxx` → `api.php?_path=xxx` (FastCGI 传给 PHP)
- `/Tapp/admin/api/xxx` → 兼容旧路径，rewrite 到 api.php

### API 路由结构
- 主路由文件: `ytb-backend/routes/ytb_api_v1.php`
- 前缀: `/api/admin/v1/`
- 认证: `YtbAuthenticate` 中间件
- 主要业务模块: YtbUser, YtbCommission, YtbWithdrawal, YtbUpgrade, YtbInvestment, YtbInstallation, YtbPoster, YtbStatistics

### 前端路由 (ytb-h5)
- 使用 `createWebHashHistory()` (hash 模式)
- 亿拓宝独立模块(standalone): 根路径路由（如 `/login`, `/home`, `/devices`）
- 兼容旧入口: `/ytb/*` 在 standalone 下做兼容重定向到根路径
- 管理员路由前缀: `/admin/`
- 分支机构路由前缀: `/branch/`

### 数据模型 (ytb-backend/app/Models/Ytb/)
- YtbUser - 用户
- YtbCommission - 分佣记录
- YtbWithdrawal - 提现申请
- YtbUpgradeApplication - 升级申请
- YtbBossInvestment - Boss投资
- YtbWaterInstallation - 装机记录
- YtbPoster - 海报

### 前端状态管理
- ytb-frontend: Pinia stores
- ytb-h5: Pinia + pinia-plugin-persistedstate (localStorage 持久化)
- 用户认证 token 存在 localStorage/sessionStorage

### 关键 polyfill (ytb-h5)
H5 针对旧版微信 WebView 做了 polyfill 处理:
- `src/polyfills/` 目录下有 fetch/Request/Response 构造器补丁
- `scripts/` 目录下有 vant-globalThis 修复和 axios-fetch 补丁
- 微信 JS-SDK 签名等能力通过 `main.js` 初始化
