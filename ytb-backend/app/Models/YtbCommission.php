<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbCommission extends Model
{
    use UsesYtbConnection, HasFactory;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_commissions';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'from_user_id',
        'application_id',
        'amount',
        'status',
        'remark',
        'settled_at',
    ];

    /**
     * 应该转换的属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'settled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 状态常量
     */
    const STATUS_PENDING = 'pending';
    const STATUS_SETTLED = 'settled';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * 状态名称映射
     */
    const STATUS_NAMES = [
        self::STATUS_PENDING => '待结算',
        self::STATUS_SETTLED => '已结算',
        self::STATUS_CANCELLED => '已取消',
    ];

    /**
     * 获取分佣获得者
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 获取分佣来源用户
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'from_user_id');
    }

    /**
     * 获取关联的升级申请
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(YtbUpgradeApplication::class, 'application_id');
    }

    /**
     * 判断是否待结算
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * 判断是否已结算
     */
    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    /**
     * 判断是否已取消
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * 获取状态名称
     */
    public function getStatusName(): string
    {
        return self::STATUS_NAMES[$this->status] ?? '未知';
    }

    /**
     * 状态名称访问器
     */
    public function getStatusNameAttribute(): string
    {
        return $this->getStatusName();
    }

    /**
     * 结算分佣（同时更新用户可提现余额）
     */
    public function settle(?string $remark = null): bool
    {
        $this->status = self::STATUS_SETTLED;
        $this->settled_at = now();
        if ($remark) {
            $this->remark = $remark;
        }
        
        $saved = $this->save();
        
        // 结算成功后，更新用户可提现余额
        if ($saved && $this->user) {
            $this->user->increment('available_balance', $this->amount);
        }
        
        return $saved;
    }

    /**
     * 取消分佣
     */
    public function cancel(?string $remark = null): bool
    {
        $this->status = self::STATUS_CANCELLED;
        if ($remark) {
            $this->remark = $remark;
        }
        return $this->save();
    }

    /**
     * 创建分佣记录
     */
    public static function createCommission(
        int $userId,
        int $fromUserId,
        int $applicationId,
        float $amount,
        ?string $remark = null
    ): self {
        return self::create([
            'user_id' => $userId,
            'from_user_id' => $fromUserId,
            'application_id' => $applicationId,
            'amount' => $amount,
            'status' => self::STATUS_PENDING,
            'remark' => $remark,
        ]);
    }

    /**
     * 获取用户待结算分佣总额
     */
    public static function getPendingAmount(int $userId): float
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_PENDING)
            ->sum('amount');
    }

    /**
     * 获取用户已结算分佣总额
     */
    public static function getSettledAmount(int $userId): float
    {
        return self::where('user_id', $userId)
            ->where('status', self::STATUS_SETTLED)
            ->sum('amount');
    }

    /**
     * 获取用户分佣总额
     */
    public static function getTotalAmount(int $userId): float
    {
        return self::where('user_id', $userId)
            ->whereIn('status', [self::STATUS_PENDING, self::STATUS_SETTLED])
            ->sum('amount');
    }
}
