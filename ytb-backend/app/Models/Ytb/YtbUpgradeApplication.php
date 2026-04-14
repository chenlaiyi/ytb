<?php

namespace App\Models\Ytb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbUpgradeApplication extends Model
{
    use HasFactory;

    protected $table = 'ytb_upgrade_applications';

    protected $fillable = [
        'user_id',
        'from_role',
        'to_role',
        'upgrade_type',
        'invite_code_used',
        'inviter_id',
        'amount',
        'payment_method',
        'payment_status',
        'order_no',
        'transaction_id',
        'admin_status',
        'admin_id',
        'admin_remark',
        'achievement_count',
        'paid_at',
        'approved_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // 升级类型常量
    const TYPE_INVITE_CODE = 'invite_code';
    const TYPE_DIRECT_PAY = 'direct_pay';
    const TYPE_ACHIEVEMENT = 'achievement';

    // 支付方式常量
    const PAYMENT_WECHAT = 'wechat';
    const PAYMENT_OFFLINE = 'offline';
    const PAYMENT_FREE = 'free';

    // 支付状态常量
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    // 审批状态常量
    const ADMIN_PENDING = 'pending';
    const ADMIN_APPROVED = 'approved';
    const ADMIN_REJECTED = 'rejected';

    /**
     * 升级类型名称映射
     */
    public static function upgradeTypeNames(): array
    {
        return [
            self::TYPE_INVITE_CODE => '邀请码升级',
            self::TYPE_DIRECT_PAY => '直接付费',
            self::TYPE_ACHIEVEMENT => '业绩达标',
        ];
    }

    /**
     * 支付方式名称映射
     */
    public static function paymentMethodNames(): array
    {
        return [
            self::PAYMENT_WECHAT => '微信支付',
            self::PAYMENT_OFFLINE => '线下支付',
            self::PAYMENT_FREE => '免费',
        ];
    }

    /**
     * 审批状态名称映射
     */
    public static function adminStatusNames(): array
    {
        return [
            self::ADMIN_PENDING => '待审批',
            self::ADMIN_APPROVED => '已通过',
            self::ADMIN_REJECTED => '已拒绝',
        ];
    }

    /**
     * 申请用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 邀请人
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'inviter_id');
    }

    /**
     * 审批管理员
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Admin::class, 'admin_id');
    }

    /**
     * 获取升级类型名称
     */
    public function getUpgradeTypeNameAttribute(): string
    {
        return self::upgradeTypeNames()[$this->upgrade_type] ?? '未知';
    }

    /**
     * 获取支付方式名称
     */
    public function getPaymentMethodNameAttribute(): string
    {
        return self::paymentMethodNames()[$this->payment_method] ?? '未知';
    }

    /**
     * 获取审批状态名称
     */
    public function getAdminStatusNameAttribute(): string
    {
        return self::adminStatusNames()[$this->admin_status] ?? '未知';
    }

    /**
     * 是否待审批
     */
    public function isPending(): bool
    {
        return $this->admin_status === self::ADMIN_PENDING;
    }

    /**
     * 是否已通过
     */
    public function isApproved(): bool
    {
        return $this->admin_status === self::ADMIN_APPROVED;
    }

    /**
     * 是否已拒绝
     */
    public function isRejected(): bool
    {
        return $this->admin_status === self::ADMIN_REJECTED;
    }

    /**
     * 是否已支付
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    /**
     * 生成订单号
     */
    public static function generateOrderNo(): string
    {
        return 'YTB' . date('YmdHis') . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
    }
}
