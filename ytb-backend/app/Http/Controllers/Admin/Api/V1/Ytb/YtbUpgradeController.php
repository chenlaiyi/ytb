<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbUpgradeApplication;
use App\Models\YtbUser;
use App\Models\YtbCommission;
use App\Models\YtbConfig;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class YtbUpgradeController extends Controller
{
    /**
     * 获取升级申请列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbUpgradeApplication::with([
            'user:id,nickname,phone,real_name,role,avatar',
            'inviter:id,nickname,phone,role'
        ]);

        // 关键词搜索（用户昵称、手机号）
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->whereHas('user', function ($q) use ($keyword) {
                $q->where('nickname', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('real_name', 'like', "%{$keyword}%");
            });
        }

        // 目标角色筛选
        if ($request->filled('to_role')) {
            $query->where('to_role', $request->to_role);
        }

        // 升级方式筛选
        if ($request->filled('upgrade_type')) {
            $query->where('upgrade_type', $request->upgrade_type);
        }

        // 审批状态筛选
        if ($request->filled('admin_status')) {
            $query->where('admin_status', $request->admin_status);
        }

        // 支付状态筛选
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
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
        $applications = $query->paginate($perPage);

        // 添加额外字段
        $applications->getCollection()->transform(function ($app) {
            $app->upgrade_type_name = $app->getTypeName();
            $app->payment_method_name = $app->getPaymentName();
            $app->payment_status_name = $app->getPaymentStatusName();
            $app->admin_status_name = $app->getAdminStatusName();
            $app->to_role_name = YtbUser::ROLE_NAMES[$app->to_role] ?? '未知';
            $app->from_role_name = YtbUser::ROLE_NAMES[$app->from_role] ?? '未知';
            return $app;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $applications->items(),
                'total' => $applications->total(),
                'current_page' => $applications->currentPage(),
                'per_page' => $applications->perPage(),
                'last_page' => $applications->lastPage(),
            ]
        ]);
    }

    /**
     * 获取申请详情
     */
    public function show($id): JsonResponse
    {
        $application = YtbUpgradeApplication::with([
            'user',
            'inviter',
            'admin:id,name',
            'commission'
        ])->find($id);

        if (!$application) {
            return response()->json([
                'code' => 404,
                'message' => '申请不存在'
            ]);
        }

        $application->upgrade_type_name = $application->getTypeName();
        $application->payment_method_name = $application->getPaymentName();
        $application->payment_status_name = $application->getPaymentStatusName();
        $application->admin_status_name = $application->getAdminStatusName();
        $application->to_role_name = YtbUser::ROLE_NAMES[$application->to_role] ?? '未知';
        $application->from_role_name = YtbUser::ROLE_NAMES[$application->from_role] ?? '未知';

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $application
        ]);
    }

    /**
     * 审批通过
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $application = YtbUpgradeApplication::with('user')->find($id);

        if (!$application) {
            return response()->json([
                'code' => 404,
                'message' => '申请不存在'
            ]);
        }

        if (!$application->isPending()) {
            return response()->json([
                'code' => 400,
                'message' => '该申请已处理，无法重复审批'
            ]);
        }

        DB::beginTransaction();
        try {
            // 获取管理员ID
            $adminId = Auth::guard('admin-api')->id() ?? 1;

            // 更新申请状态
            $application->approve($adminId, $request->input('remark'));

            // 更新用户角色
            $user = $application->user;
            $user->role = $application->to_role;
            
            // 生成邀请码（如果没有）
            if (!$user->invite_code && in_array($application->to_role, [YtbUser::ROLE_SCP, YtbUser::ROLE_TEAM_CP])) {
                $user->invite_code = YtbUser::generateInviteCode();
            }
            
            $user->role_upgraded_at = now();
            $user->save();

            // 如果是SCP升级且有上级，创建分佣记录
            if ($application->to_role === YtbUser::ROLE_SCP && $user->parent_id) {
                // 检查是否需要创建分佣（付费升级才有分佣）
                if ($application->payment_status === YtbUpgradeApplication::PAYMENT_PAID && 
                    $application->amount > 0) {
                    $commissionAmount = YtbConfig::getValue('scp_commission', 360);
                    YtbCommission::createCommission(
                        $user->parent_id,
                        $user->id,
                        $application->id,
                        $commissionAmount,
                        '下级升级CP伙伴分佣'
                    );
                }

                // 更新上级的直推SCP计数
                $user->parent->updateDirectScpCount();
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '审批通过成功',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '审批失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 审批拒绝
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'remark' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '请填写拒绝原因',
                'errors' => $validator->errors()
            ]);
        }

        $application = YtbUpgradeApplication::find($id);

        if (!$application) {
            return response()->json([
                'code' => 404,
                'message' => '申请不存在'
            ]);
        }

        if (!$application->isPending()) {
            return response()->json([
                'code' => 400,
                'message' => '该申请已处理，无法重复审批'
            ]);
        }

        // 获取管理员ID
        $adminId = Auth::guard('admin-api')->id() ?? 1;

        $application->reject($adminId, $request->remark);

        return response()->json([
            'code' => 0,
            'message' => '已拒绝该申请',
            'data' => $application
        ]);
    }

    /**
     * 确认线下支付
     */
    public function confirmPayment(Request $request, $id): JsonResponse
    {
        $application = YtbUpgradeApplication::find($id);

        if (!$application) {
            return response()->json([
                'code' => 404,
                'message' => '申请不存在'
            ]);
        }

        if ($application->payment_status !== YtbUpgradeApplication::PAYMENT_PENDING) {
            return response()->json([
                'code' => 400,
                'message' => '该申请支付状态不是待支付'
            ]);
        }

        if ($application->payment_method !== YtbUpgradeApplication::PAYMENT_OFFLINE) {
            return response()->json([
                'code' => 400,
                'message' => '该申请不是线下支付方式'
            ]);
        }

        $application->markAsPaid($request->input('transaction_id'));

        return response()->json([
            'code' => 0,
            'message' => '支付确认成功',
            'data' => $application
        ]);
    }

    /**
     * 获取升级申请统计
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_applications' => YtbUpgradeApplication::count(),
            'pending_applications' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_PENDING)->count(),
            'approved_applications' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_APPROVED)->count(),
            'rejected_applications' => YtbUpgradeApplication::where('admin_status', YtbUpgradeApplication::ADMIN_REJECTED)->count(),
            'scp_applications' => YtbUpgradeApplication::where('to_role', YtbUser::ROLE_SCP)->count(),
            'team_cp_applications' => YtbUpgradeApplication::where('to_role', YtbUser::ROLE_TEAM_CP)->count(),
            'total_revenue' => YtbUpgradeApplication::where('payment_status', YtbUpgradeApplication::PAYMENT_PAID)->sum('amount'),
            'today_applications' => YtbUpgradeApplication::whereDate('created_at', today())->count(),
            'this_month_applications' => YtbUpgradeApplication::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }
}
