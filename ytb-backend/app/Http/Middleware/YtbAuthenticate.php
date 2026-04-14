<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use DB;
use Log;

class YtbAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->headers->get("X-Site-Domain") ?: $request->getHost();
        
        if (!in_array($host, ["ytb.ddg.org.cn", "www.ytb.ddg.org.cn"])) {
            return response()->json(["code" => 403, "message" => "非法站点"], 403);
        }

        $token = $request->bearerToken();
        
        if (!$token) {
            return response()->json(["code" => 401, "message" => "未提供认证令牌"], 401);
        }

        try {
            $tokenData = json_decode(base64_decode($token), true);
            
            if (!$tokenData || !isset($tokenData["admin_id"]) || !isset($tokenData["exp"])) {
                return response()->json(["code" => 401, "message" => "无效的令牌格式"], 401);
            }

            if ($tokenData["exp"] < time()) {
                return response()->json(["code" => 401, "message" => "令牌已过期"], 401);
            }

            $ytbAdmin = DB::table("ytb_admin_users")
                ->where("id", $tokenData["admin_id"])
                ->where("status", "active")
                ->first();

            if (!$ytbAdmin) {
                return response()->json(["code" => 401, "message" => "用户不存在或已禁用"], 401);
            }

            $user = new \stdClass();
            $user->id = $ytbAdmin->id;
            $user->username = $ytbAdmin->username;
            $user->name = $ytbAdmin->name;
            $user->email = $ytbAdmin->email;
            $user->permissions = json_decode($ytbAdmin->permissions ?? "[]", true) ?: [];
            $user->ytb_admin = true;

            $request->attributes->set("ytb_user", $user);

            return $next($request);

        } catch (\Exception $e) {
            Log::error("YTB令牌解析失败", ["error" => $e->getMessage()]);
            return response()->json(["code" => 401, "message" => "令牌解析失败"], 401);
        }
    }
}
