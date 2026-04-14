<?php

namespace App\Http\Controllers\Admin\Api\V1\Ytb;

use App\Http\Controllers\Controller;
use App\Models\YtbPoster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class YtbPosterController extends Controller
{
    /**
     * 获取海报列表
     */
    public function index(Request $request): JsonResponse
    {
        $query = YtbPoster::query();

        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where('title', 'like', "%{$keyword}%");
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status') || $request->status === '0' || $request->status === 0) {
            $query->where('status', $request->status);
        }

        $query->orderByDesc('sort_order')->orderByDesc('id');

        $perPage = (int) $request->input('per_page', 15);
        $posters = $query->paginate($perPage);

        $posters->getCollection()->transform(function (YtbPoster $poster) {
            $poster->type_label = YtbPoster::TYPE_LABELS[$poster->type] ?? $poster->type;
            return $poster;
        });

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $posters->items(),
                'total' => $posters->total(),
                'current_page' => $posters->currentPage(),
                'per_page' => $posters->perPage(),
                'last_page' => $posters->lastPage(),
            ],
        ]);
    }

    /**
     * 创建海报
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:100',
            'type' => 'required|string|in:partner,customer',
            'image_url' => 'required|string|max:500',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'status' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '参数验证失败',
                'data' => $validator->errors(),
            ], 422);
        }

        $poster = YtbPoster::create($request->only([
            'title',
            'type',
            'image_url',
            'description',
            'sort_order',
            'status',
        ]));

        $poster->type_label = YtbPoster::TYPE_LABELS[$poster->type] ?? $poster->type;

        return response()->json([
            'code' => 0,
            'message' => '创建成功',
            'data' => $poster,
        ]);
    }

    /**
     * 获取海报详情
     */
    public function show($id): JsonResponse
    {
        $poster = YtbPoster::find($id);

        if (!$poster) {
            return response()->json([
                'code' => 404,
                'message' => '海报不存在',
            ], 404);
        }

        $poster->type_label = YtbPoster::TYPE_LABELS[$poster->type] ?? $poster->type;

        return response()->json([
            'code' => 0,
            'message' => '获取成功',
            'data' => $poster,
        ]);
    }

    /**
     * 更新海报
     */
    public function update(Request $request, $id): JsonResponse
    {
        $poster = YtbPoster::find($id);

        if (!$poster) {
            return response()->json([
                'code' => 404,
                'message' => '海报不存在',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:100',
            'type' => 'required|string|in:partner,customer',
            'image_url' => 'required|string|max:500',
            'description' => 'nullable|string|max:1000',
            'sort_order' => 'nullable|integer|min:0',
            'status' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '参数验证失败',
                'data' => $validator->errors(),
            ], 422);
        }

        $poster->update($request->only([
            'title',
            'type',
            'image_url',
            'description',
            'sort_order',
            'status',
        ]));

        $poster->type_label = YtbPoster::TYPE_LABELS[$poster->type] ?? $poster->type;

        return response()->json([
            'code' => 0,
            'message' => '更新成功',
            'data' => $poster,
        ]);
    }

    /**
     * 更新海报状态
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $poster = YtbPoster::find($id);

        if (!$poster) {
            return response()->json([
                'code' => 404,
                'message' => '海报不存在',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|integer|in:0,1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'code' => 422,
                'message' => '参数验证失败',
                'data' => $validator->errors(),
            ], 422);
        }

        $poster->status = $request->status;
        $poster->save();

        return response()->json([
            'code' => 0,
            'message' => '状态更新成功',
            'data' => $poster,
        ]);
    }

    /**
     * 删除海报
     */
    public function destroy($id): JsonResponse
    {
        $poster = YtbPoster::find($id);

        if (!$poster) {
            return response()->json([
                'code' => 404,
                'message' => '海报不存在',
            ], 404);
        }

        $poster->delete();

        return response()->json([
            'code' => 0,
            'message' => '删除成功',
        ]);
    }
}
