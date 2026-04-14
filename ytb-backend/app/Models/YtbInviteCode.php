<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbInviteCode extends Model
{
    use UsesYtbConnection, HasFactory;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_invite_codes';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'code',
        'type',
        'status',
        'used_count',
    ];

    /**
     * 应该转换的属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'used_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 类型常量
     */
    const TYPE_SCP = 'scp';
    const TYPE_TEAM_CP = 'team_cp';

    /**
     * 状态常量
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_DISABLED = 'disabled';

    /**
     * 类型名称映射
     */
    const TYPE_NAMES = [
        self::TYPE_SCP => 'CP伙伴邀请码',
        self::TYPE_TEAM_CP => 'VIPCP伙伴邀请码',
    ];

    /**
     * 获取邀请码所属用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 判断是否有效
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * 获取类型名称
     */
    public function getTypeName(): string
    {
        return self::TYPE_NAMES[$this->type] ?? '未知';
    }

    /**
     * 增加使用次数
     */
    public function incrementUsedCount(): bool
    {
        $this->used_count++;
        return $this->save();
    }

    /**
     * 禁用邀请码
     */
    public function disable(): bool
    {
        $this->status = self::STATUS_DISABLED;
        return $this->save();
    }

    /**
     * 启用邀请码
     */
    public function enable(): bool
    {
        $this->status = self::STATUS_ACTIVE;
        return $this->save();
    }

    /**
     * 生成唯一邀请码
     */
    public static function generateCode(): string
    {
        do {
            $code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::where('code', $code)->exists() || YtbUser::where('invite_code', $code)->exists());
        
        return $code;
    }

    /**
     * 根据邀请码查找
     */
    public static function findByCode(string $code): ?self
    {
        return self::where('code', $code)
            ->where('status', self::STATUS_ACTIVE)
            ->first();
    }

    /**
     * 为用户创建邀请码
     */
    public static function createForUser(int $userId, string $type = self::TYPE_SCP): self
    {
        return self::create([
            'user_id' => $userId,
            'code' => self::generateCode(),
            'type' => $type,
            'status' => self::STATUS_ACTIVE,
            'used_count' => 0,
        ]);
    }
}
