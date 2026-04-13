<?php

namespace App\Http\Controllers\Admin\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use DB;
use Log;
use Hash;

class YtbAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $host = $request->headers->get("X-Site-Domain") ?: $request->getHost();
        
        if (!in_array($host, ["ytb.ddg.org.cn", "www.ytb.ddg.org.cn"])) {
            return response()->json(["code" => 403, "message" => "非法站点"], 403);
        }

        $username = $request->input("username");
        $password = $request->input("password");

        if (!$username || !$password) {
            return response()->json(["code" => 400, "message" => "用户名和密码不能为空"], 400);
        }

        $admin = DB::connection("ytb_mysql")
            ->table("ytb_admin_users")
            ->where("username", $username)
            ->where("status", "active")
            ->first();

        if (!$admin) {
            return response()->json(["code" => 401, "message" => "用户名或密码错误"], 401);
        }

        if (!Hash::check($password, $admin->password)) {
            return response()->json(["code" => 401, "message" => "用户名或密码错误"], 401);
        }

        $tokenData = [
            "admin_id" => $admin->id,
            "username" => $admin->username,
            "iat" => time(),
            "exp" => time() + (7 * 24 * 60 * 60),
        ];

        $token = base64_encode(json_encode($tokenData));

        Log::info("YTB登录成功", ["admin_id" => $admin->id]);

        return response()->json([
            "code" => 0,
            "message" => "登录成功",
            "data" => [
                "token" => $token,
                "token_type" => "Bearer",
                "expires_in" => 7 * 24 * 60 * 60,
                "user" => [
                    "id" => $admin->id,
                    "username" => $admin->username,
                    "name" => $admin->name,
                    "email" => $admin->email,
                    "avatar" => $admin->avatar,
                ]
            ]
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->attributes->get("ytb_user");
        
        if (!$user) {
            return response()->json(["code" => 401, "message" => "用户未认证"], 401);
        }

        return response()->json([
            "code" => 0,
            "message" => "操作成功",
            "data" => [
                "id" => $user->id,
                "username" => $user->username,
                "name" => $user->name,
                "email" => $user->email,
                "avatar" => $user->avatar ?? "",
                "avatarText" => mb_substr($user->name, 0, 1, "utf-8"),
                "permissions" => $user->permissions,
            ]
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        return response()->json([
            "code" => 0,
            "message" => "退出成功",
        ]);
    }
}