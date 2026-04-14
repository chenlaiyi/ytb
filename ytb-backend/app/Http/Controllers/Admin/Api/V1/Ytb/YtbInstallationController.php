<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbWaterInstallation;
use App\Models\YtbCommission;
use App\Services\Ytb\YtbWaterInstallationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class YtbInstallationController extends Controller
{
    protected YtbWaterInstallationService $installationService;

    public function __construct(YtbWaterInstallationService $installationService)
    {
        $this->installationService = $installationService;
    }

    /**
     * 获取安装记录列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbWaterInstallation::with([
            'promoter:id,nickname,phone,avatar,role',
            'level1User:id,nickname,phone,role',
            'level2User:id,nickname,phone,role',
            'bossUser:id,nickname,phone,role',
        ]);

        // 关键词搜索
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('device_number', 'like', "%{$keyword}%")
                    ->orWhere('client_name', 'like', "%{$keyword}%")
                    ->orWhere('client_phone', 'like', "%{$keyword}%")
                    ->orWhereHas('promoter', function ($pq) use ($keyword) {
                        $pq->where('nickname', 'like', "%{$keyword}%")
                            ->orWhere('phone', 'like', "%{$keyword}%");
                    });
            });
        }

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 日期范围
        if ($request->filled('start_date')) {
            $query->whereDate('installed_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('installed_at', '<=', $request->end_date);
        }

        // 排序
        $query->orderBy('installed_at', 'desc');

        // 分页
        $perPage = $request->input('per_page', 15);
        $installations = $query->paginate($perPage);

        // 添加额外字段
        $installations->getCollection()->transform(function ($installation) {
            $installation->status_name = $this->getStatusName($installation->status);
            if ($installation->promoter) {
                $installation->promoter->role_name = $installation->promoter->getRoleName();
            }
            return $installation;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $installations->items(),
                'total' => $installations->total(),
                'current_page' => $installations->currentPage(),
                'per_page' => $installations->perPage(),
                'last_page' => $installations->lastPage(),
            ]
        ]);
    }

    /**
     * 获取安装记录详情
     */
    public function show($id): JsonResponse
    {
        $installation = YtbWaterInstallation::with([
            'promoter:id,nickname,phone,avatar,role',
            'level1User:id,nickname,phone,role',
            'level2User:id,nickname,phone,role',
            'bossUser:id,nickname,phone,role',
        ])->find($id);

        if (!$installation) {
            return response()->json([
                'code' => 404,
                'message' => '安装记录不存在'
            ]);
        }

        $installation->status_name = $this->getStatusName($installation->status);

        // 添加角色名称
        foreach (['promoter', 'level1User', 'level2User', 'bossUser'] as $relation) {
            if ($installation->$relation) {
                $installation->$relation->role_name = $installation->$relation->getRoleName();
            }
        }

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $installation
        ]);
    }

    /**
     * 获取安装统计
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_installations' => YtbWaterInstallation::count(),
            'total_rewards' => YtbWaterInstallation::sum('promoter_reward') 
                + YtbWaterInstallation::sum('level1_reward') 
                + YtbWaterInstallation::sum('level2_reward'),
            'total_boss_refunds' => YtbWaterInstallation::sum('boss_refund'),
            'pending_count' => YtbWaterInstallation::where('status', 'pending')->count(),
            'activated_count' => YtbWaterInstallation::where('status', 'activated')->count(),
            'settled_count' => YtbWaterInstallation::where('status', 'settled')->count(),
            'this_month_count' => YtbWaterInstallation::whereMonth('installed_at', now()->month)
                ->whereYear('installed_at', now()->year)
                ->count(),
            'today_count' => YtbWaterInstallation::whereDate('installed_at', today())->count(),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 结算安装分佣
     */
    public function settle($id): JsonResponse
    {
        $installation = YtbWaterInstallation::find($id);

        if (!$installation) {
            return response()->json([
                'code' => 404,
                'message' => '安装记录不存在'
            ]);
        }

        if ($installation->status !== 'activated') {
            return response()->json([
                'code' => 400,
                'message' => '当前状态无法结算'
            ]);
        }

        DB::beginTransaction();
        try {
            // 调用服务结算
            $this->installationService->settleCommissions($installation);

            $installation->status = 'settled';
            $installation->settled_at = now();
            $installation->save();

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '结算成功'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '结算失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 批量结算
     */
    public function batchSettle(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json([
                'code' => 400,
                'message' => '请选择要结算的记录'
            ]);
        }

        $installations = YtbWaterInstallation::whereIn('id', $ids)
            ->where('status', 'activated')
            ->get();

        if ($installations->isEmpty()) {
            return response()->json([
                'code' => 400,
                'message' => '没有可结算的记录'
            ]);
        }

        DB::beginTransaction();
        try {
            $settledCount = 0;
            foreach ($installations as $installation) {
                $this->installationService->settleCommissions($installation);
                $installation->status = 'settled';
                $installation->settled_at = now();
                $installation->save();
                $settledCount++;
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '批量结算成功',
                'data' => [
                    'settled_count' => $settledCount
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '批量结算失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 获取状态名称
     */
    private function getStatusName(string $status): string
    {
        $names = [
            'pending' => '待激活',
            'activated' => '已激活',
            'settled' => '已结算',
        ];
        return $names[$status] ?? $status;
    }
}
