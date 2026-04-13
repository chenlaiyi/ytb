<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Api\V1\YtbAuthController;
use App\Http\Controllers\Admin\Api\V1\YtbMenuController;
use App\Http\Controllers\Admin\Api\V1\YtbNotificationController;
use App\Http\Controllers\Admin\Api\V1\YtbDashboardController;
use App\Http\Middleware\YtbAuthenticate;

/*
|--------------------------------------------------------------------------
| YTB 独立 API 路由
| 前端请求路径: /api/admin/v1/*
| 路由实际路径: /api/admin/v1/*
*/

Route::prefix("admin/v1")->middleware(YtbAuthenticate::class)->group(function () {
    // 认证
    Route::post("/auth/login", [YtbAuthController::class, "login"]);
    Route::post("/auth/logout", [YtbAuthController::class, "logout"]);
    Route::get("/auth/me", [YtbAuthController::class, "me"]);
    
    // 菜单
    Route::get("/menus", [YtbMenuController::class, "index"]);
    
    // 通知
    Route::get("/notifications/unread-count", [YtbNotificationController::class, "unreadCount"]);
    Route::get("/notifications/latest", [YtbNotificationController::class, "latest"]);
    
    // 仪表盘
    Route::get("/dashboard/cockpit", [YtbDashboardController::class, "cockpit"]);
    Route::get("/meituan/dashboard/summary", [YtbDashboardController::class, "meituanSummary"]);
    Route::get("/starpay/summary", [YtbDashboardController::class, "starpaySummary"]);
});