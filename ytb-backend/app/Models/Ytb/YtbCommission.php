<?php

namespace App\Models\Ytb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbCommission extends Model
{
    use HasFactory;

    protected $table = 'ytb_commissions';

    protected $fillable = [
        'user_id',
        'from_user_id',
        'application_id',
        'amount',
        'status',
        'remark',
        'settled_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'settled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // 状态常量
    const STATUS_PENDING = 'pending';
    const STATUS_SETTLED = 'settled';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * 状态名称映射
     */
    public static function statusNames(): array
    {
        return [
            self::STATUS_PENDING => '待结算',
            self::STATUS_SETTLED => '已结算',
            self::STATUS_CANCELLED => '已取消',
        ];
    }

    /**
     * 获得分佣的用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 产生分佣的下级用户
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'from_user_id');
    }

    /**
     * 关联的升级申请
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(YtbUpgradeApplication::class, 'application_id');
    }

    /**
     * 获取状态名称
     */
    public function getStatusNameAttribute(): string
    {
        return self::statusNames()[$this->status] ?? '未知';
    }

    /**
     * 是否待结算
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * 是否已结算
     */
    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    /**
     * 结算分佣
     */
    public function settle(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        $this->status = self::STATUS_SETTLED;
        $this->settled_at = now();
        return $this->save();
    }

    /**
     * 取消分佣
     */
    public function cancel(string $remark = null): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }

        $this->status = self::STATUS_CANCELLED;
        if ($remark) {
            $this->remark = $remark;
        }
        return $this->save();
    }
}
