<?php

namespace App\Http\Controllers\Admin\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use DB;

class YtbMenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $host = $request->headers->get("X-Site-Domain") ?: $request->getHost();

        if (!in_array($host, ["ytb.ddg.org.cn", "www.ytb.ddg.org.cn"])) {
            return response()->json(["code" => 403, "message" => "非法站点"], 403);
        }

        $menus = DB::table("ytb_admin_menus")
            ->where("is_enabled", 1)
            ->orderBy("sort_order", "asc")
            ->get();

        $menuTree = $this->buildMenuTree($menus->toArray());

        return response()->json([
            "code" => 0,
            "message" => "成功获取YTB菜单",
            "data" => $menuTree,
        ]);
    }

    private function buildMenuTree(array $menus, $parentId = 0): array
    {
        $tree = [];
        foreach ($menus as $menu) {
            if ($menu->parent_id == $parentId) {
                $children = $this->buildMenuTree($menus, $menu->id);
                $item = [
                    "id" => $menu->id,
                    "name" => $menu->title,
                    "path" => $menu->path,
                    "meta" => [
                        "title" => $menu->title,
                        "icon" => $menu->icon ?: 'Menu',
                    ],
                    "component" => $menu->component,
                    "sort" => $menu->sort_order,
                    "children" => $children,
                ];
                if (empty($children)) {
                    unset($item["children"]);
                }
                $tree[] = $item;
            }
        }
        return $tree;
    }
}
