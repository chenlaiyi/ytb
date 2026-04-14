<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbBossInvestment;
use App\Models\YtbUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class YtbInvestmentController extends Controller
{
    /**
     * 获取投资列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbBossInvestment::with(['user:id,nickname,phone,avatar,role']);

        // 关键词搜索
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->whereHas('user', function ($q) use ($keyword) {
                $q->where('nickname', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%");
            });
        }

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 日期范围
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // 排序
        $query->orderBy('created_at', 'desc');

        // 分页
        $perPage = $request->input('per_page', 15);
        $investments = $query->paginate($perPage);

        // 添加额外字段
        $investments->getCollection()->transform(function ($investment) {
            $investment->status_name = $this->getStatusName($investment->status);
            $investment->refund_progress = $investment->target_amount > 0 
                ? round(($investment->refunded_amount / $investment->target_amount) * 100, 1) 
                : 0;
            return $investment;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $investments->items(),
                'total' => $investments->total(),
                'current_page' => $investments->currentPage(),
                'per_page' => $investments->perPage(),
                'last_page' => $investments->lastPage(),
            ]
        ]);
    }

    /**
     * 获取投资详情
     */
    public function show($id): JsonResponse
    {
        $investment = YtbBossInvestment::with([
            'user:id,nickname,phone,avatar,role',
            'refundRecords' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(50);
            }
        ])->find($id);

        if (!$investment) {
            return response()->json([
                'code' => 404,
                'message' => '投资记录不存在'
            ]);
        }

        $investment->status_name = $this->getStatusName($investment->status);
        $investment->refund_progress = $investment->target_amount > 0 
            ? round(($investment->refunded_amount / $investment->target_amount) * 100, 1) 
            : 0;

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $investment
        ]);
    }

    /**
     * 获取投资统计
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_investments' => YtbBossInvestment::count(),
            'total_amount' => YtbBossInvestment::whereIn('status', ['paid', 'active', 'completed'])->sum('amount'),
            'total_refunded' => YtbBossInvestment::sum('refunded_amount'),
            'total_quota' => YtbBossInvestment::whereIn('status', ['paid', 'active', 'completed'])->sum('quota'),
            'pending_count' => YtbBossInvestment::where('status', 'pending')->count(),
            'active_count' => YtbBossInvestment::where('status', 'active')->count(),
            'completed_count' => YtbBossInvestment::where('status', 'completed')->count(),
            'this_month_amount' => YtbBossInvestment::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->whereIn('status', ['paid', 'active', 'completed'])
                ->sum('amount'),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 确认投资支付
     */
    public function confirmPayment(Request $request, $id): JsonResponse
    {
        $investment = YtbBossInvestment::find($id);

        if (!$investment) {
            return response()->json([
                'code' => 404,
                'message' => '投资记录不存在'
            ]);
        }

        if ($investment->status !== 'pending') {
            return response()->json([
                'code' => 400,
                'message' => '当前状态无法确认支付'
            ]);
        }

        DB::beginTransaction();
        try {
            $investment->status = 'active';
            $investment->paid_at = now();
            $investment->transaction_id = $request->input('transaction_id');
            $investment->save();

            // 更新用户角色为 BossCP
            $user = YtbUser::find($investment->user_id);
            if ($user && $user->role !== YtbUser::ROLE_BOSS_CP) {
                $user->role = YtbUser::ROLE_BOSS_CP;
                $user->role_upgraded_at = now();
                if (!$user->invite_code) {
                    $user->invite_code = YtbUser::generateInviteCode();
                }
                $user->save();
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '确认支付成功'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '操作失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 取消投资
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $investment = YtbBossInvestment::find($id);

        if (!$investment) {
            return response()->json([
                'code' => 404,
                'message' => '投资记录不存在'
            ]);
        }

        if (!in_array($investment->status, ['pending', 'paid'])) {
            return response()->json([
                'code' => 400,
                'message' => '当前状态无法取消'
            ]);
        }

        $investment->status = 'cancelled';
        $investment->remark = $request->input('remark');
        $investment->save();

        return response()->json([
            'code' => 0,
            'message' => '取消成功'
        ]);
    }

    /**
     * 获取状态名称
     */
    private function getStatusName(string $status): string
    {
        $names = [
            'pending' => '待支付',
            'paid' => '已支付',
            'active' => '进行中',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];
        return $names[$status] ?? $status;
    }
}
