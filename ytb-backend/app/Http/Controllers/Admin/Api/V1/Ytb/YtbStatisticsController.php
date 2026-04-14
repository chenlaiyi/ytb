<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbUser;
use App\Models\YtbUpgradeApplication;
use App\Models\YtbCommission;
use App\Models\YtbConfig;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class YtbStatisticsController extends Controller
{
    /**
     * 获取综合统计数据
     */
    public function index(): JsonResponse
    {
        $stats = [
            // 用户统计
            'users' => [
                'total' => YtbUser::count(),
                'normal' => YtbUser::where('role', YtbUser::ROLE_NORMAL)->count(),
                'scp' => YtbUser::where('role', YtbUser::ROLE_SCP)->count(),
                'team_cp' => YtbUser::where('role', YtbUser::ROLE_TEAM_CP)->count(),
                'active' => YtbUser::where('status', YtbUser::STATUS_ACTIVE)->count(),
                'disabled' => YtbUser::where('status', YtbUser::STATUS_DISABLED)->count(),
                'today_new' => YtbUser::whereDate('created_at', today())->count(),
                'this_month_new' => YtbUser::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
            // 升级申请统计
            'upgrades' => [
                'total' => YtbUpgradeApplication::count(),
                'pending' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_PENDING)->count(),
                'approved' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_APPROVED)->count(),
                'rejected' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_REJECTED)->count(),
                'today' => YtbUpgradeApplication::whereDate('created_at', today())->count(),
                'this_month' => YtbUpgradeApplication::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count(),
            ],
            // 收入统计
            'revenue' => [
                'total' => YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)->sum('amount'),
                'today' => YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)
                    ->whereDate('paid_at', today())
                    ->sum('amount'),
                'this_month' => YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)
                    ->whereMonth('paid_at', now()->month)
                    ->whereYear('paid_at', now()->year)
                    ->sum('amount'),
            ],
            // 分佣统计
            'commissions' => [
                'total' => YtbCommission::whereIn('status', [YtbCommission::STATUS_PENDING, YtbCommission::STATUS_SETTLED])->sum('amount'),
                'pending' => YtbCommission::where('status', YtbCommission::STATUS_PENDING)->sum('amount'),
                'settled' => YtbCommission::where('status', YtbCommission::STATUS_SETTLED)->sum('amount'),
                'pending_count' => YtbCommission::where('status', YtbCommission::STATUS_PENDING)->count(),
            ],
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 获取用户增长趋势
     */
    public function userTrend(Request $request): JsonResponse
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        $trend = YtbUser::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN role = 'normal' THEN 1 ELSE 0 END) as normal"),
            DB::raw("SUM(CASE WHEN role = 'scp' THEN 1 ELSE 0 END) as scp"),
            DB::raw("SUM(CASE WHEN role = 'team_cp' THEN 1 ELSE 0 END) as team_cp")
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // 填充缺失的日期
        $result = [];
        $currentDate = $startDate->copy();
        $endDate = Carbon::now()->endOfDay();
        $trendMap = $trend->keyBy('date');

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayData = $trendMap->get($dateStr);
            $result[] = [
                'date' => $dateStr,
                'total' => $dayData ? $dayData->total : 0,
                'normal' => $dayData ? $dayData->normal : 0,
                'scp' => $dayData ? $dayData->scp : 0,
                'team_cp' => $dayData ? $dayData->team_cp : 0,
            ];
            $currentDate->addDay();
        }

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $result
        ]);
    }

    /**
     * 获取收入趋势
     */
    public function revenueTrend(Request $request): JsonResponse
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        $trend = YtbUpgradeApplication::select(
            DB::raw('DATE(paid_at) as date'),
            DB::raw('SUM(amount) as revenue'),
            DB::raw('COUNT(*) as count')
        )
            ->where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)
            ->where('paid_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->orderBy('date')
            ->get();

        // 填充缺失的日期
        $result = [];
        $currentDate = $startDate->copy();
        $endDate = Carbon::now()->endOfDay();
        $trendMap = $trend->keyBy('date');

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayData = $trendMap->get($dateStr);
            $result[] = [
                'date' => $dateStr,
                'revenue' => $dayData ? floatval($dayData->revenue) : 0,
                'count' => $dayData ? $dayData->count : 0,
            ];
            $currentDate->addDay();
        }

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $result
        ]);
    }

    /**
     * 获取升级申请趋势
     */
    public function upgradeTrend(Request $request): JsonResponse
    {
        $days = $request->input('days', 30);
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();

        $trend = YtbUpgradeApplication::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN to_role = 'scp' THEN 1 ELSE 0 END) as scp"),
            DB::raw("SUM(CASE WHEN to_role = 'team_cp' THEN 1 ELSE 0 END) as team_cp"),
            DB::raw("SUM(CASE WHEN admin_status = 'approved' THEN 1 ELSE 0 END) as approved"),
            DB::raw("SUM(CASE WHEN admin_status = 'rejected' THEN 1 ELSE 0 END) as rejected")
        )
            ->where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // 填充缺失的日期
        $result = [];
        $currentDate = $startDate->copy();
        $endDate = Carbon::now()->endOfDay();
        $trendMap = $trend->keyBy('date');

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayData = $trendMap->get($dateStr);
            $result[] = [
                'date' => $dateStr,
                'total' => $dayData ? $dayData->total : 0,
                'scp' => $dayData ? $dayData->scp : 0,
                'team_cp' => $dayData ? $dayData->team_cp : 0,
                'approved' => $dayData ? $dayData->approved : 0,
                'rejected' => $dayData ? $dayData->rejected : 0,
            ];
            $currentDate->addDay();
        }

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $result
        ]);
    }

    /**
     * 获取配置信息
     */
    public function getConfigs(): JsonResponse
    {
        $configs = [
            'scp_upgrade_fee' => YtbConfig::getValue('scp_upgrade_fee', 980),
            'team_cp_upgrade_fee' => YtbConfig::getValue('team_cp_upgrade_fee', 980),
            'scp_commission' => YtbConfig::getValue('scp_commission', 360),
            'team_cp_requirement' => YtbConfig::getValue('team_cp_requirement', 9),
            'wechat_pay_enabled' => YtbConfig::getValue('wechat_pay_enabled', 0),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $configs
        ]);
    }

    /**
     * 更新配置信息
     */
    public function updateConfigs(Request $request): JsonResponse
    {
        $allowedKeys = [
            'scp_upgrade_fee',
            'team_cp_upgrade_fee',
            'scp_commission',
            'team_cp_requirement',
            'wechat_pay_enabled',
        ];

        $updated = [];
        foreach ($allowedKeys as $key) {
            if ($request->has($key)) {
                YtbConfig::setValue($key, $request->input($key));
                $updated[$key] = $request->input($key);
            }
        }

        return response()->json([
            'code' => 0,
            'message' => '配置更新成功',
            'data' => $updated
        ]);
    }

    /**
     * 获取团队长排行榜
     */
    public function teamCpRanking(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 10);

        $ranking = YtbUser::where('role', YtbUser::ROLE_TEAM_CP)
            ->orderBy('direct_scp_count', 'desc')
            ->limit($limit)
            ->get(['id', 'nickname', 'phone', 'avatar', 'direct_scp_count', 'direct_user_count', 'created_at']);

        $ranking->transform(function ($user) {
            $user->total_commission = YtbCommission::getTotalAmount($user->id);
            return $user;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $ranking
        ]);
    }

    /**
     * 获取SCP排行榜
     */
    public function scpRanking(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 10);

        $ranking = YtbUser::whereIn('role', [YtbUser::ROLE_SCP, YtbUser::ROLE_TEAM_CP])
            ->orderBy('direct_user_count', 'desc')
            ->limit($limit)
            ->get(['id', 'nickname', 'phone', 'avatar', 'role', 'direct_scp_count', 'direct_user_count', 'created_at']);

        $ranking->transform(function ($user) {
            $user->role_name = $user->getRoleName();
            $user->total_commission = YtbCommission::getTotalAmount($user->id);
            return $user;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $ranking
        ]);
    }
}
