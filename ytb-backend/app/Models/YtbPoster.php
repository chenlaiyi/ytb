<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YtbPoster extends Model
{
    use UsesYtbConnection, HasFactory;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_posters';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'type',
        'image_url',
        'description',
        'sort_order',
        'status',
    ];

    /**
     * 属性类型转换
     *
     * @var array<string, string>
     */
    protected $casts = [
        'status' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * 海报类型常量
     */
    public const TYPE_PARTNER = 'partner';
    public const TYPE_CUSTOMER = 'customer';

    public const TYPE_LABELS = [
        self::TYPE_PARTNER => '拓展伙伴',
        self::TYPE_CUSTOMER => '发展客户',
    ];
}
