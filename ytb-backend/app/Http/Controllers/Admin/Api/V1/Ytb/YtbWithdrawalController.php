<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbWithdrawal;
use App\Models\YtbUser;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class YtbWithdrawalController extends Controller
{
    /**
     * 获取提现记录列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbWithdrawal::with([
            'user:id,nickname,phone,real_name,role,avatar'
        ]);

        // 关键词搜索（用户昵称、手机号、订单号）
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('order_no', 'like', "%{$keyword}%")
                    ->orWhere('account_name', 'like', "%{$keyword}%")
                    ->orWhere('account_no', 'like', "%{$keyword}%")
                    ->orWhereHas('user', function ($subQ) use ($keyword) {
                        $subQ->where('nickname', 'like', "%{$keyword}%")
                            ->orWhere('phone', 'like', "%{$keyword}%")
                            ->orWhere('real_name', 'like', "%{$keyword}%");
                    });
            });
        }

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 提现方式筛选
        if ($request->filled('withdraw_type')) {
            $query->where('withdraw_type', $request->withdraw_type);
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

        // 金额范围筛选
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        // 排序
        $orderBy = $request->input('order_by', 'created_at');
        $orderDir = $request->input('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        // 分页
        $perPage = $request->input('per_page', 15);
        $withdrawals = $query->paginate($perPage);

        // 添加额外字段
        $withdrawals->getCollection()->transform(function ($withdrawal) {
            $withdrawal->status_name = $withdrawal->status_name;
            $withdrawal->withdraw_type_name = $withdrawal->withdraw_type_name;
            if ($withdrawal->user) {
                $withdrawal->user->role_name = YtbUser::ROLE_NAMES[$withdrawal->user->role] ?? '未知';
            }
            return $withdrawal;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $withdrawals->items(),
                'total' => $withdrawals->total(),
                'current_page' => $withdrawals->currentPage(),
                'per_page' => $withdrawals->perPage(),
                'last_page' => $withdrawals->lastPage(),
            ]
        ]);
    }

    /**
     * 获取提现详情
     */
    public function show($id): JsonResponse
    {
        $withdrawal = YtbWithdrawal::with([
            'user',
            'admin:id,name'
        ])->find($id);

        if (!$withdrawal) {
            return response()->json([
                'code' => 404,
                'message' => '提现记录不存在'
            ]);
        }

        $withdrawal->status_name = $withdrawal->status_name;
        $withdrawal->withdraw_type_name = $withdrawal->withdraw_type_name;
        if ($withdrawal->user) {
            $withdrawal->user->role_name = YtbUser::ROLE_NAMES[$withdrawal->user->role] ?? '未知';
        }

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $withdrawal
        ]);
    }

    /**
     * 开始处理提现（标记为处理中）
     */
    public function process(Request $request, $id): JsonResponse
    {
        $withdrawal = YtbWithdrawal::find($id);

        if (!$withdrawal) {
            return response()->json([
                'code' => 404,
                'message' => '提现记录不存在'
            ]);
        }

        if (!$withdrawal->isPending()) {
            return response()->json([
                'code' => 400,
                'message' => '该提现记录不是待处理状态'
            ]);
        }

        DB::beginTransaction();
        try {
            $withdrawal->status = YtbWithdrawal::STATUS_PROCESSING;
            $withdrawal->admin_id = $request->input('admin_id', 0);
            $withdrawal->processed_at = now();
            $withdrawal->save();

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '已开始处理',
                'data' => $withdrawal
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
     * 完成提现
     */
    public function complete(Request $request, $id): JsonResponse
    {
        $request->validate([
            'transaction_id' => 'nullable|string|max:100',
            'remark' => 'nullable|string|max:500',
        ]);

        $withdrawal = YtbWithdrawal::find($id);

        if (!$withdrawal) {
            return response()->json([
                'code' => 404,
                'message' => '提现记录不存在'
            ]);
        }

        if (!$withdrawal->isPending() && !$withdrawal->isProcessing()) {
            return response()->json([
                'code' => 400,
                'message' => '该提现记录状态不允许完成操作'
            ]);
        }

        DB::beginTransaction();
        try {
            $withdrawal->status = YtbWithdrawal::STATUS_COMPLETED;
            $withdrawal->admin_id = $request->input('admin_id', 0);
            $withdrawal->transaction_id = $request->input('transaction_id');
            $withdrawal->admin_remark = $request->input('remark');
            $withdrawal->completed_at = now();
            if (!$withdrawal->processed_at) {
                $withdrawal->processed_at = now();
            }
            $withdrawal->save();

            // 更新用户已提现金额
            $user = $withdrawal->user;
            if ($user) {
                $user->withdrawn_balance = bcadd($user->withdrawn_balance, $withdrawal->amount, 2);
                $user->save();
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '提现已完成',
                'data' => $withdrawal
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
     * 拒绝提现
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $request->validate([
            'remark' => 'required|string|max:500',
        ]);

        $withdrawal = YtbWithdrawal::find($id);

        if (!$withdrawal) {
            return response()->json([
                'code' => 404,
                'message' => '提现记录不存在'
            ]);
        }

        if (!$withdrawal->isPending() && !$withdrawal->isProcessing()) {
            return response()->json([
                'code' => 400,
                'message' => '该提现记录状态不允许拒绝操作'
            ]);
        }

        DB::beginTransaction();
        try {
            $withdrawal->status = YtbWithdrawal::STATUS_REJECTED;
            $withdrawal->admin_id = $request->input('admin_id', 0);
            $withdrawal->admin_remark = $request->input('remark');
            $withdrawal->processed_at = now();
            $withdrawal->save();

            // 退还用户余额
            $user = $withdrawal->user;
            if ($user) {
                // 将冻结金额退回可提现余额
                $user->frozen_balance = bcsub($user->frozen_balance, $withdrawal->amount, 2);
                $user->available_balance = bcadd($user->available_balance, $withdrawal->amount, 2);
                $user->save();
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '已拒绝提现',
                'data' => $withdrawal
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
     * 批量完成提现
     */
    public function batchComplete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            return response()->json([
                'code' => 400,
                'message' => '请选择要处理的记录'
            ]);
        }

        DB::beginTransaction();
        try {
            $count = 0;
            foreach ($ids as $id) {
                $withdrawal = YtbWithdrawal::find($id);
                if ($withdrawal && ($withdrawal->isPending() || $withdrawal->isProcessing())) {
                    $withdrawal->status = YtbWithdrawal::STATUS_COMPLETED;
                    $withdrawal->admin_id = $request->input('admin_id', 0);
                    $withdrawal->admin_remark = '批量处理完成';
                    $withdrawal->completed_at = now();
                    if (!$withdrawal->processed_at) {
                        $withdrawal->processed_at = now();
                    }
                    $withdrawal->save();

                    // 更新用户已提现金额
                    $user = $withdrawal->user;
                    if ($user) {
                        $user->withdrawn_balance = bcadd($user->withdrawn_balance, $withdrawal->amount, 2);
                        $user->save();
                    }

                    $count++;
                }
            }
            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => "成功处理 {$count} 条记录"
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '批量处理失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 获取提现统计
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_withdrawals' => YtbWithdrawal::count(),
            'pending_withdrawals' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_PENDING)->count(),
            'processing_withdrawals' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_PROCESSING)->count(),
            'completed_withdrawals' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)->count(),
            'rejected_withdrawals' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_REJECTED)->count(),
            
            'total_amount' => YtbWithdrawal::whereIn('status', [
                YtbWithdrawal::STATUS_PENDING,
                YtbWithdrawal::STATUS_PROCESSING,
                YtbWithdrawal::STATUS_COMPLETED
            ])->sum('amount'),
            'pending_amount' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_PENDING)->sum('amount'),
            'processing_amount' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_PROCESSING)->sum('amount'),
            'completed_amount' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)->sum('amount'),
            'completed_actual_amount' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)->sum('actual_amount'),
            
            'total_tax_fee' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)->sum('tax_fee'),
            'total_service_fee' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)->sum('service_fee'),
            
            'today_withdrawals' => YtbWithdrawal::whereDate('created_at', today())->count(),
            'today_amount' => YtbWithdrawal::whereDate('created_at', today())->sum('amount'),
            'today_completed' => YtbWithdrawal::whereDate('completed_at', today())->count(),
            'today_completed_amount' => YtbWithdrawal::whereDate('completed_at', today())->sum('amount'),
            
            'this_month_withdrawals' => YtbWithdrawal::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'this_month_amount' => YtbWithdrawal::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount'),
            'this_month_completed' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->count(),
            'this_month_completed_amount' => YtbWithdrawal::where('status', YtbWithdrawal::STATUS_COMPLETED)
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->sum('amount'),
        ];

        // 按提现方式统计
        $byType = YtbWithdrawal::select('withdraw_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total_amount'))
            ->groupBy('withdraw_type')
            ->get()
            ->keyBy('withdraw_type');

        $stats['by_type'] = [
            'bank_card' => [
                'count' => $byType->get('bank_card')->count ?? 0,
                'amount' => $byType->get('bank_card')->total_amount ?? 0,
            ],
            'wechat' => [
                'count' => $byType->get('wechat')->count ?? 0,
                'amount' => $byType->get('wechat')->total_amount ?? 0,
            ],
            'alipay' => [
                'count' => $byType->get('alipay')->count ?? 0,
                'amount' => $byType->get('alipay')->total_amount ?? 0,
            ],
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 导出提现记录
     */
    public function export(Request $request): JsonResponse
    {
        $query = YtbWithdrawal::with(['user:id,nickname,phone,real_name,role']);

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 日期范围筛选
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $withdrawals = $query->orderBy('created_at', 'desc')->get();

        $exportData = $withdrawals->map(function ($withdrawal) {
            return [
                '订单号' => $withdrawal->order_no,
                '用户昵称' => $withdrawal->user->nickname ?? '-',
                '用户手机' => $withdrawal->user->phone ?? '-',
                '真实姓名' => $withdrawal->user->real_name ?? '-',
                '提现金额' => $withdrawal->amount,
                '税费' => $withdrawal->tax_fee,
                '手续费' => $withdrawal->service_fee,
                '实际到账' => $withdrawal->actual_amount,
                '提现方式' => $withdrawal->withdraw_type_name,
                '收款账户' => $withdrawal->account_name,
                '账号' => $withdrawal->account_no,
                '开户行' => $withdrawal->bank_name ?? '-',
                '状态' => $withdrawal->status_name,
                '申请时间' => $withdrawal->created_at->format('Y-m-d H:i:s'),
                '处理时间' => $withdrawal->processed_at ? $withdrawal->processed_at->format('Y-m-d H:i:s') : '-',
                '完成时间' => $withdrawal->completed_at ? $withdrawal->completed_at->format('Y-m-d H:i:s') : '-',
                '备注' => $withdrawal->admin_remark ?? '-',
            ];
        });

        return response()->json([
            'code' => 0,
            'message' => '导出成功',
            'data' => $exportData
        ]);
    }
}
