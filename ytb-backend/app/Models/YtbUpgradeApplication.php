<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbUpgradeApplication extends Model
{
    use UsesYtbConnection, HasFactory;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_upgrade_applications';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
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

    /**
     * 应该转换的属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'achievement_count' => 'integer',
        'paid_at' => 'datetime',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 升级方式常量
     */
    const TYPE_INVITE_CODE = 'invite_code';      // 邀请码升级
    const TYPE_DIRECT_PAY = 'direct_pay';        // 直接付费升级
    const TYPE_ACHIEVEMENT = 'achievement';       // 业绩达标升级

    /**
     * 支付方式常量
     */
    const PAYMENT_WECHAT = 'wechat';
    const PAYMENT_OFFLINE = 'offline';
    const PAYMENT_FREE = 'free';

    /**
     * 支付状态常量
     */
    const PAYMENT_STATUS_PENDING = 'pending';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_REFUNDED = 'refunded';

    // 别名常量（兼容 Service 层使用）
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    /**
     * 审批状态常量
     */
    const ADMIN_STATUS_PENDING = 'pending';
    const ADMIN_STATUS_APPROVED = 'approved';
    const ADMIN_STATUS_REJECTED = 'rejected';

    // 别名常量（兼容 Service 层使用）
    const ADMIN_PENDING = 'pending';
    const ADMIN_APPROVED = 'approved';
    const ADMIN_REJECTED = 'rejected';

    /**
     * 升级方式名称映射
     */
    const TYPE_NAMES = [
        self::TYPE_INVITE_CODE => '邀请码升级',
        self::TYPE_DIRECT_PAY => '直接付费升级',
        self::TYPE_ACHIEVEMENT => '业绩达标升级',
    ];

    /**
     * 支付方式名称映射
     */
    const PAYMENT_NAMES = [
        self::PAYMENT_WECHAT => '微信支付',
        self::PAYMENT_OFFLINE => '线下支付',
        self::PAYMENT_FREE => '免费',
    ];

    /**
     * 支付状态名称映射
     */
    const PAYMENT_STATUS_NAMES = [
        self::PAYMENT_STATUS_PENDING => '待支付',
        self::PAYMENT_STATUS_PAID => '已支付',
        self::PAYMENT_STATUS_REFUNDED => '已退款',
    ];

    /**
     * 审批状态名称映射
     */
    const ADMIN_STATUS_NAMES = [
        self::ADMIN_STATUS_PENDING => '待审批',
        self::ADMIN_STATUS_APPROVED => '已通过',
        self::ADMIN_STATUS_REJECTED => '已拒绝',
    ];

    /**
     * 获取申请用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 获取邀请人
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'inviter_id');
    }

    /**
     * 获取审批管理员
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * 获取关联的分佣记录
     */
    public function commission()
    {
        return $this->hasOne(YtbCommission::class, 'application_id');
    }

    /**
     * 判断是否待支付
     */
    public function isPendingPayment(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PENDING;
    }

    /**
     * 判断是否已支付
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PAID;
    }

    /**
     * 判断是否待审批
     */
    public function isPendingApproval(): bool
    {
        return $this->admin_status === self::ADMIN_STATUS_PENDING;
    }

    /**
     * 判断是否已通过
     */
    public function isApproved(): bool
    {
        return $this->admin_status === self::ADMIN_STATUS_APPROVED;
    }

    /**
     * 判断是否已拒绝
     */
    public function isRejected(): bool
    {
        return $this->admin_status === self::ADMIN_STATUS_REJECTED;
    }

    /**
     * 判断是否需要审批
     * 邀请码升级需要审批，直接付费升级不需要审批
     */
    public function needsApproval(): bool
    {
        // 邀请码升级SCP需要审批
        if ($this->upgrade_type === self::TYPE_INVITE_CODE) {
            return true;
        }
        // TeamCP升级都需要审批
        if ($this->to_role === YtbUser::ROLE_TEAM_CP) {
            return true;
        }
        // 直接付费升级SCP不需要审批
        return false;
    }

    /**
     * 获取升级方式名称
     */
    public function getTypeName(): string
    {
        return self::TYPE_NAMES[$this->upgrade_type] ?? '未知';
    }

    /**
     * 获取支付方式名称
     */
    public function getPaymentName(): string
    {
        return self::PAYMENT_NAMES[$this->payment_method] ?? '未知';
    }

    /**
     * 获取支付状态名称
     */
    public function getPaymentStatusName(): string
    {
        return self::PAYMENT_STATUS_NAMES[$this->payment_status] ?? '未知';
    }

    /**
     * 获取审批状态名称
     */
    public function getAdminStatusName(): string
    {
        return self::ADMIN_STATUS_NAMES[$this->admin_status] ?? '未知';
    }

    /**
     * 判断是否待处理（待审批）
     */
    public function isPending(): bool
    {
        return $this->admin_status === self::ADMIN_STATUS_PENDING;
    }

    /**
     * 升级方式名称访问器
     */
    public function getUpgradeTypeNameAttribute(): string
    {
        return $this->getTypeName();
    }

    /**
     * 支付方式名称访问器
     */
    public function getPaymentMethodNameAttribute(): string
    {
        return $this->getPaymentName();
    }

    /**
     * 审批状态名称访问器
     */
    public function getAdminStatusNameAttribute(): string
    {
        return $this->getAdminStatusName();
    }

    /**
     * 生成订单号
     */
    public static function generateOrderNo(): string
    {
        return 'YTB' . date('YmdHis') . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * 标记为已支付
     */
    public function markAsPaid(?string $transactionId = null): bool
    {
        $this->payment_status = self::PAYMENT_STATUS_PAID;
        $this->paid_at = now();
        if ($transactionId) {
            $this->transaction_id = $transactionId;
        }
        return $this->save();
    }

    /**
     * 审批通过
     */
    public function approve(int $adminId, ?string $remark = null): bool
    {
        $this->admin_status = self::ADMIN_STATUS_APPROVED;
        $this->admin_id = $adminId;
        $this->admin_remark = $remark;
        $this->approved_at = now();
        return $this->save();
    }

    /**
     * 审批拒绝
     */
    public function reject(int $adminId, ?string $remark = null): bool
    {
        $this->admin_status = self::ADMIN_STATUS_REJECTED;
        $this->admin_id = $adminId;
        $this->admin_remark = $remark;
        $this->approved_at = now();
        return $this->save();
    }
}
