<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class YtbWithdrawal extends Model
{
    use UsesYtbConnection, HasFactory, SoftDeletes;

    protected $table = 'ytb_withdrawals';

    protected $fillable = [
        'user_id',
        'order_no',
        'amount',
        'tax_fee',
        'service_fee',
        'actual_amount',
        'withdraw_type',
        'account_name',
        'account_no',
        'bank_name',
        'bank_branch',
        'status',
        'admin_id',
        'admin_remark',
        'transaction_id',
        'processed_at',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tax_fee' => 'decimal:2',
        'service_fee' => 'decimal:2',
        'actual_amount' => 'decimal:2',
        'processed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // 提现方式
    const TYPE_BANK_CARD = 'bank_card';
    const TYPE_WECHAT = 'wechat';
    const TYPE_ALIPAY = 'alipay';

    // 状态
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_REJECTED = 'rejected';

    // 提现方式名称
    const TYPE_NAMES = [
        self::TYPE_BANK_CARD => '银行卡',
        self::TYPE_WECHAT => '微信钱包',
        self::TYPE_ALIPAY => '支付宝',
    ];

    // 状态名称
    const STATUS_NAMES = [
        self::STATUS_PENDING => '待处理',
        self::STATUS_PROCESSING => '处理中',
        self::STATUS_COMPLETED => '已完成',
        self::STATUS_REJECTED => '已拒绝',
    ];

    // 提现规则
    const MIN_WITHDRAW_AMOUNT = 300;  // 最低提现金额
    const TAX_RATE = 0.08;            // 税费比例 8%
    const SERVICE_FEE = 3;            // 手续费 3元/笔

    /**
     * 关联用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'user_id');
    }

    /**
     * 关联管理员
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * 获取提现方式名称
     */
    public function getWithdrawTypeNameAttribute(): string
    {
        return self::TYPE_NAMES[$this->withdraw_type] ?? '未知';
    }

    /**
     * 获取状态名称
     */
    public function getStatusNameAttribute(): string
    {
        return self::STATUS_NAMES[$this->status] ?? '未知';
    }

    /**
     * 是否待处理
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * 是否处理中
     */
    public function isProcessing(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    /**
     * 是否已完成
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * 是否已拒绝
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * 生成提现单号
     */
    public static function generateOrderNo(): string
    {
        return 'W' . date('YmdHis') . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * 计算提现费用
     * @param float $amount 提现金额
     * @return array ['tax_fee' => 税费, 'service_fee' => 手续费, 'actual_amount' => 实际到账]
     */
    public static function calculateFees(float $amount): array
    {
        $taxFee = round($amount * self::TAX_RATE, 2);
        $serviceFee = self::SERVICE_FEE;
        $actualAmount = round($amount - $taxFee - $serviceFee, 2);

        return [
            'tax_fee' => $taxFee,
            'service_fee' => $serviceFee,
            'actual_amount' => max(0, $actualAmount),
        ];
    }
}
