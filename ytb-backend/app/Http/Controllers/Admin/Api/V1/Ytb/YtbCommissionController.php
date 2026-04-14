<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbCommission;
use App\Models\YtbUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class YtbCommissionController extends Controller
{
    /**
     * 获取分佣记录列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbCommission::with([
            'user:id,nickname,phone,real_name,role',
            'fromUser:id,nickname,phone,real_name,role',
            'application:id,to_role,upgrade_type,amount'
        ]);

        // 关键词搜索（用户昵称、手机号）
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->whereHas('user', function ($subQ) use ($keyword) {
                    $subQ->where('nickname', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%");
                })->orWhereHas('fromUser', function ($subQ) use ($keyword) {
                    $subQ->where('nickname', 'like', "%{$keyword}%")
                        ->orWhere('phone', 'like', "%{$keyword}%");
                });
            });
        }

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 用户ID筛选
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // 日期范围筛选
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // 排序
        $orderBy = $request->input('order_by', 'created_at');
        $orderDir = $request->input('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        // 分页
        $perPage = $request->input('per_page', 15);
        $commissions = $query->paginate($perPage);

        // 添加额外字段
        $commissions->getCollection()->transform(function ($commission) {
            $commission->status_name = $commission->getStatusName();
            if ($commission->user) {
                $commission->user->role_name = YtbUser::ROLE_NAMES[$commission->user->role] ?? '未知';
            }
            if ($commission->fromUser) {
                $commission->fromUser->role_name = YtbUser::ROLE_NAMES[$commission->fromUser->role] ?? '未知';
            }
            return $commission;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $commissions->items(),
                'total' => $commissions->total(),
                'current_page' => $commissions->currentPage(),
                'per_page' => $commissions->perPage(),
                'last_page' => $commissions->lastPage(),
            ]
        ]);
    }

    /**
     * 获取分佣详情
     */
    public function show($id): JsonResponse
    {
        $commission = YtbCommission::with([
            'user',
            'fromUser',
            'application'
        ])->find($id);

        if (!$commission) {
            return response()->json([
                'code' => 404,
                'message' => '分佣记录不存在'
            ]);
        }

        $commission->status_name = $commission->getStatusName();

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $commission
        ]);
    }

    /**
     * 结算分佣
     */
    public function settle(Request $request, $id): JsonResponse
    {
        $commission = YtbCommission::find($id);

        if (!$commission) {
            return response()->json([
                'code' => 404,
                'message' => '分佣记录不存在'
            ]);
        }

        if (!$commission->isPending()) {
            return response()->json([
                'code' => 400,
                'message' => '该分佣记录不是待结算状态'
            ]);
        }

        $commission->settle($request->input('remark'));

        return response()->json([
            'code' => 0,
            'message' => '结算成功',
            'data' => $commission
        ]);
    }

    /**
     * 批量结算分佣
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

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($ids as $id) {
                $commission = YtbCommission::find($id);
                if ($commission && $commission->isPending()) {
                    $commission->settle('批量结算');
                    $count++;
                }
            }
            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => "成功结算 {$count} 条记录"
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
     * 取消分佣
     */
    public function cancel(Request $request, $id): JsonResponse
    {
        $commission = YtbCommission::find($id);

        if (!$commission) {
            return response()->json([
                'code' => 404,
                'message' => '分佣记录不存在'
            ]);
        }

        if (!$commission->isPending()) {
            return response()->json([
                'code' => 400,
                'message' => '该分佣记录不是待结算状态，无法取消'
            ]);
        }

        $commission->cancel($request->input('remark', '管理员取消'));

        return response()->json([
            'code' => 0,
            'message' => '取消成功',
            'data' => $commission
        ]);
    }

    /**
     * 获取分佣统计
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_commissions' => YtbCommission::count(),
            'pending_commissions' => YtbCommission::where('status', YtbCommission::STATUS_PENDING)->count(),
            'settled_commissions' => YtbCommission::where('status', YtbCommission::STATUS_SETTLED)->count(),
            'cancelled_commissions' => YtbCommission::where('status', YtbCommission::STATUS_CANCELLED)->count(),
            'total_amount' => YtbCommission::whereIn('status', [YtbCommission::STATUS_PENDING, YtbCommission::STATUS_SETTLED])->sum('amount'),
            'pending_amount' => YtbCommission::where('status', YtbCommission::STATUS_PENDING)->sum('amount'),
            'settled_amount' => YtbCommission::where('status', YtbCommission::STATUS_SETTLED)->sum('amount'),
            'today_commissions' => YtbCommission::whereDate('created_at', today())->count(),
            'today_amount' => YtbCommission::whereDate('created_at', today())->sum('amount'),
            'this_month_commissions' => YtbCommission::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'this_month_amount' => YtbCommission::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 获取分佣排行榜
     */
    public function ranking(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 10);
        $type = $request->input('type', 'total'); // total, settled, pending

        $statusCondition = match ($type) {
            'settled' => [YtbCommission::STATUS_SETTLED],
            'pending' => [YtbCommission::STATUS_PENDING],
            default => [YtbCommission::STATUS_PENDING, YtbCommission::STATUS_SETTLED],
        };

        $ranking = YtbCommission::select('user_id', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->whereIn('status', $statusCondition)
            ->groupBy('user_id')
            ->orderBy('total_amount', 'desc')
            ->limit($limit)
            ->get();

        // 加载用户信息
        $userIds = $ranking->pluck('user_id')->toArray();
        $users = YtbUser::whereIn('id', $userIds)->get()->keyBy('id');

        $ranking->transform(function ($item) use ($users) {
            $user = $users->get($item->user_id);
            $item->user = $user ? [
                'id' => $user->id,
                'nickname' => $user->nickname,
                'phone' => $user->phone,
                'role' => $user->role,
                'role_name' => $user->getRoleName(),
            ] : null;
            return $item;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $ranking
        ]);
    }
}
