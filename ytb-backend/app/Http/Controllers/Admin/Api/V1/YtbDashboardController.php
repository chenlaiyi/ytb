<?php

namespace App\Http\Controllers\Admin\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class YtbDashboardController extends Controller
{
    public function cockpit(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");
        
        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => [
                "total_users" => 0,
                "today_users" => 0,
                "total_orders" => 0,
                "today_orders" => 0,
                "total_revenue" => 0,
                "today_revenue" => 0,
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
