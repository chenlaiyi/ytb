<?php

namespace App\Http\Controllers\Admin\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class YtbNotificationController extends Controller
{
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");
        
        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => ["count" => 0]
        ]);
    }

    public function latest(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");
        
        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => []
        ]);
    }
}