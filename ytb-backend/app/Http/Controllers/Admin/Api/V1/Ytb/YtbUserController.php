<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbUser;
use App\Models\YtbCommission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class YtbUserController extends Controller
{
    /**
     * 获取用户列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbUser::with(['parent:id,nickname,phone,role']);

        // 关键词搜索
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('nickname', 'like', "%{$keyword}%")
                    ->orWhere('phone', 'like', "%{$keyword}%")
                    ->orWhere('real_name', 'like', "%{$keyword}%")
                    ->orWhere('invite_code', 'like', "%{$keyword}%");
            });
        }

        // 角色筛选
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // 状态筛选
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // 排序
        $orderBy = $request->input('order_by', 'created_at');
        $orderDir = $request->input('order_dir', 'desc');
        $query->orderBy($orderBy, $orderDir);

        // 分页
        $perPage = $request->input('per_page', 15);
        $users = $query->paginate($perPage);

        // 添加额外字段
        $users->getCollection()->transform(function ($user) {
            $user->role_name = $user->getRoleName();
            $user->can_invite = $user->canInvite();
            $user->total_commission = YtbCommission::getTotalAmount($user->id);
            $user->pending_commission = YtbCommission::getPendingAmount($user->id);
            $user->settled_commission = YtbCommission::getSettledAmount($user->id);
            return $user;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $users->items(),
                'total' => $users->total(),
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'last_page' => $users->lastPage(),
            ]
        ]);
    }

    /**
     * 获取用户详情
     */
    public function show($id): JsonResponse
    {
        $user = YtbUser::with([
            'parent:id,nickname,phone,role',
            'children:id,parent_id,nickname,phone,role,created_at',
            'upgradeApplications' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            },
            'commissions' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            }
        ])->find($id);

        if (!$user) {
            return response()->json([
                'code' => 404,
                'message' => '用户不存在'
            ]);
        }

        $user->role_name = $user->getRoleName();
        $user->can_invite = $user->canInvite();
        $user->total_commission = YtbCommission::getTotalAmount($user->id);
        $user->pending_commission = YtbCommission::getPendingAmount($user->id);
        $user->settled_commission = YtbCommission::getSettledAmount($user->id);

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $user
        ]);
    }

    /**
     * 更新用户角色
     */
    public function updateRole(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|in:normal,scp,team_cp,boss_cp',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '参数验证失败',
                'errors' => $validator->errors()
            ]);
        }

        $user = YtbUser::find($id);
        if (!$user) {
            return response()->json([
                'code' => 404,
                'message' => '用户不存在'
            ]);
        }

        $oldRole = $user->role;
        $newRole = $request->role;

        DB::beginTransaction();
        try {
            $user->role = $newRole;
            
            // 如果升级为SCP、TeamCP或BossCP，生成邀请码
            if (in_array($newRole, [YtbUser::ROLE_SCP, YtbUser::ROLE_TEAM_CP, YtbUser::ROLE_BOSS_CP]) && !$user->invite_code) {
                $user->invite_code = YtbUser::generateInviteCode();
            }
            
            // 记录升级时间
            if ($oldRole !== $newRole) {
                $user->role_upgraded_at = now();
            }
            
            $user->save();

            // 如果用户有上级，更新上级的直推SCP计数
            if ($user->parent_id) {
                $user->parent->updateDirectScpCount();
            }

            DB::commit();

            return response()->json([
                'code' => 0,
                'message' => '角色更新成功',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'code' => 500,
                'message' => '更新失败：' . $e->getMessage()
            ]);
        }
    }

    /**
     * 更新用户状态
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,disabled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '参数验证失败',
                'errors' => $validator->errors()
            ]);
        }

        $user = YtbUser::find($id);
        if (!$user) {
            return response()->json([
                'code' => 404,
                'message' => '用户不存在'
            ]);
        }

        $user->status = $request->status;
        $user->save();

        return response()->json([
            'code' => 0,
            'message' => '状态更新成功',
            'data' => $user
        ]);
    }

    /**
     * 获取用户统计数据
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_users' => YtbUser::count(),
            'normal_users' => YtbUser::where('role', YtbUser::ROLE_NORMAL)->count(),
            'scp_users' => YtbUser::where('role', YtbUser::ROLE_SCP)->count(),
            'team_cp_users' => YtbUser::where('role', YtbUser::ROLE_TEAM_CP)->count(),
            'boss_cp_users' => YtbUser::where('role', YtbUser::ROLE_BOSS_CP)->count(),
            'active_users' => YtbUser::where('status', YtbUser::STATUS_ACTIVE)->count(),
            'disabled_users' => YtbUser::where('status', YtbUser::STATUS_DISABLED)->count(),
            'today_new_users' => YtbUser::whereDate('created_at', today())->count(),
            'this_month_new_users' => YtbUser::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $stats
        ]);
    }

    /**
     * 获取用户团队成员
     */
    public function teamMembers(Request $request, $id): JsonResponse
    {
        $user = YtbUser::find($id);
        if (!$user) {
            return response()->json([
                'code' => 404,
                'message' => '用户不存在'
            ]);
        }

        $query = YtbUser::where('parent_id', $id);

        // 角色筛选
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $perPage = $request->input('per_page', 15);
        $members = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $members->getCollection()->transform(function ($member) {
            $member->role_name = $member->getRoleName();
            return $member;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $members->items(),
                'total' => $members->total(),
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'last_page' => $members->lastPage(),
            ]
        ]);
    }
}
