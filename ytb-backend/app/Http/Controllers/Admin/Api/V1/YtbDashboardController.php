<?php

namespace App\Http\Controllers\Admin\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\YtbUser;
use App\Models\YtbUpgradeApplication;
use App\Models\YtbCommission;
use App\Models\YtbWaterInstallation;
use App\Models\YtbDevice;

class YtbDashboardController extends Controller
{
    public function cockpit(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");

        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        // 用户统计
        $totalUsers = YtbUser::count();
        $todayUsers = YtbUser::whereDate('created_at', today())->count();
        $vipCount = YtbUser::where('role', YtbUser::ROLE_SCP)->count() + YtbUser::where('role', YtbUser::ROLE_TEAM_CP)->count();
        $vipRate = $totalUsers > 0 ? round($vipCount / $totalUsers * 100, 1) : 0;

        // 收入统计
        $totalRevenue = YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)->sum('amount');
        $todayRevenue = YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)
            ->whereDate('paid_at', today())
            ->sum('amount');

        // 设备统计（使用ytb_devices设备表，与StockIn页面数据一致）
        $deviceStats = YtbDevice::getStatistics();
        $totalDevices = $deviceStats['total_devices'];
        $onlineDevices = $deviceStats['online_devices'];
        $onlineRate = $deviceStats['online_rate'];

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => [
                "overview" => [
                    "users" => [
                        "total" => $totalUsers,
                        "today" => $todayUsers,
                        "vip_rate" => $vipRate,
                    ],
                    "revenue" => [
                        "total" => $totalRevenue,
                        "today" => $todayRevenue,
                    ],
                    "devices" => [
                        "total" => $totalDevices,
                        "online" => $onlineDevices,
                        "online_rate" => $onlineRate,
                    ],
                ],
            ]
        ]);
    }

    public function meituanSummary(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");

        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => ["total" => 0, "today" => 0]
        ]);
    }

    public function starpaySummary(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");

        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => ["total" => 0, "today" => 0]
        ]);
    }
}
