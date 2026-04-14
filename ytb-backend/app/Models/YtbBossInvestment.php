<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * BossCP投资记录模型
 * 
 * 用户缴纳29800元成为BossCP，获得300台净水器额度
 * 全系统每安装一台，按顺序回款100元，直到300台完成
 */
class YtbBossInvestment extends Model
{
    use UsesYtbConnection, HasFactory;

    protected $table = 'ytb_boss_investments';

    protected $fillable = [
        'user_id',
        'amount',
        'quota',
        'remaining_quota',
        'refunded_amount',
        'status',
        'referrer_reward_paid',
        'referrer_reward_amount',
        'referrer_id',
        'order_no',
        'transaction_id',
        'payment_method',
        'payment_status',
        'paid_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'referrer_reward_amount' => 'decimal:2',
        'quota' => 'integer',
        'remaining_quota' => 'integer',
        'referrer_reward_paid' => 'boolean',
        'paid_at' => 'datetime',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 状态常量
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * 支付状态常量
     */
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    /**
     * 支付方式常量
     */
    const PAYMENT_WECHAT = 'wechat';
    const PAYMENT_OFFLINE = 'offline';

    /**
     * 状态名称映射
     */
    const STATUS_NAMES = [
        self::STATUS_ACTIVE => '进行中',
        self::STATUS_COMPLETED => '已完成',
        self::STATUS_CANCELLED => '已取消',
    ];

    /**
     * 关联投资用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 关联上级用户（获得拓展奖励的人）
     */
    public function referrer(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'referrer_id');
    }

    /**
     * 关联安装记录（分配到此投资的安装）
     */
    public function installations(): HasMany
    {
        return $this->hasMany(YtbWaterInstallation::class, 'boss_investment_id');
    }

    /**
     * 是否已支付
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    /**
     * 是否进行中
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * 是否已完成（额度用完）
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * 是否还有剩余额度
     */
    public function hasRemainingQuota(): bool
    {
        return $this->remaining_quota > 0;
    }

    /**
     * 消耗一个额度并增加回款
     */
    public function consumeQuota(float $refundAmount = 100): bool
    {
        if (!$this->hasRemainingQuota()) {
            return false;
        }

        $this->remaining_quota--;
        $this->refunded_amount += $refundAmount;

        // 如果额度用完，标记为已完成
        if ($this->remaining_quota <= 0) {
            $this->status = self::STATUS_COMPLETED;
            $this->completed_at = now();
        }

        return $this->save();
    }

    /**
     * 获取状态名称
     */
    public function getStatusNameAttribute(): string
    {
        return self::STATUS_NAMES[$this->status] ?? '未知';
    }

    /**
     * 获取回款进度百分比
     */
    public function getRefundProgressAttribute(): float
    {
        if ($this->quota <= 0) {
            return 0;
        }
        return round(($this->quota - $this->remaining_quota) / $this->quota * 100, 2);
    }

    /**
     * 获取已分配台数
     */
    public function getAllocatedCountAttribute(): int
    {
        return $this->quota - $this->remaining_quota;
    }

    /**
     * 生成订单号
     */
    public static function generateOrderNo(): string
    {
        return 'BOSS' . date('YmdHis') . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * 获取下一个待分配的投资记录（全系统轮询）
     * 按照创建时间排序，找到第一个有剩余额度的投资
     */
    public static function getNextForRefund(): ?self
    {
        return self::where('status', self::STATUS_ACTIVE)
            ->where('payment_status', self::PAYMENT_PAID)
            ->where('remaining_quota', '>', 0)
            ->orderBy('created_at', 'asc')
            ->first();
    }
}
