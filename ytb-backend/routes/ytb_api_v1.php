<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\Api\V1\YtbAuthController;
use App\Http\Controllers\Admin\Api\V1\YtbMenuController;
use App\Http\Controllers\Admin\Api\V1\YtbNotificationController;
use App\Http\Controllers\Admin\Api\V1\YtbDashboardController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbUserController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbCommissionController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbWithdrawalController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbUpgradeController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbInvestmentController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbInstallationController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbPosterController;
use App\Http\Controllers\Admin\Api\V1\Ytb\YtbStatisticsController;
use App\Http\Middleware\YtbAuthenticate;

/*
|--------------------------------------------------------------------------
| YTB 独立 API 路由
| 专为 ytb.ddg.org.cn 设计，使用 YtbAuthenticate 中间件
| nginx rewrite: /admin/api/admin/v1/xxx -> /api/admin/v1/xxx
*/

Route::prefix("admin/v1")->middleware(YtbAuthenticate::class)->group(function () {
    // 认证相关
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
    
    // YTB 业务接口
    Route::get("/ytb/users", [YtbUserController::class, "index"]);
    Route::get("/ytb/users/{id}", [YtbUserController::class, "show"]);
    Route::put("/ytb/users/{id}", [YtbUserController::class, "update"]);
    
    Route::get("/ytb/commissions", [YtbCommissionController::class, "index"]);
    Route::post("/ytb/commissions/{id}/settle", [YtbCommissionController::class, "settle"]);
    
    Route::get("/ytb/withdrawals", [YtbWithdrawalController::class, "index"]);
    Route::put("/ytb/withdrawals/{id}/approve", [YtbWithdrawalController::class, "approve"]);
    Route::put("/ytb/withdrawals/{id}/reject", [YtbWithdrawalController::class, "reject"]);
    
    Route::get("/ytb/upgrades", [YtbUpgradeController::class, "index"]);
    Route::put("/ytb/upgrades/{id}/approve", [YtbUpgradeController::class, "approve"]);
    Route::put("/ytb/upgrades/{id}/reject", [YtbUpgradeController::class, "reject"]);
    
    Route::get("/ytb/investments", [YtbInvestmentController::class, "index"]);
    Route::get("/ytb/investments/{id}", [YtbInvestmentController::class, "show"]);
    
    Route::get("/ytb/installations", [YtbInstallationController::class, "index"]);
    Route::get("/ytb/installations/{id}", [YtbInstallationController::class, "show"]);
    Route::put("/ytb/installations/{id}/status", [YtbInstallationController::class, "updateStatus"]);
    
    Route::get("/ytb/posters", [YtbPosterController::class, "index"]);
    Route::post("/ytb/posters", [YtbPosterController::class, "store"]);
    Route::put("/ytb/posters/{id}", [YtbPosterController::class, "update"]);
    Route::delete("/ytb/posters/{id}", [YtbPosterController::class, "destroy"]);
    
    Route::get("/ytb/statistics", [YtbStatisticsController::class, "index"]);
    Route::get("/ytb/statistics/users", [YtbStatisticsController::class, "users"]);
    Route::get("/ytb/statistics/commissions", [YtbStatisticsController::class, "commissions"]);
    Route::get("/ytb/statistics/revenue", [YtbStatisticsController::class, "revenue"]);
});

// 登录接口不需要认证
Route::post("/admin/v1/auth/login", [YtbAuthController::class, "login"]);
