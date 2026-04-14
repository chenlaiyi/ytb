<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 净水器安装分佣记录模型
 * 
 * 记录每一台净水器安装的分佣情况：
 * - 推广者奖励（普通用户200元，CP/VIPCP 300元，BossCP 360元）
 * - 一级上级分佣
 * - 二级上级分佣（仅普通用户推广时有效）
 * - BossCP回款（全系统轮询分配）
 */
class YtbWaterInstallation extends Model
{
    use UsesYtbConnection, HasFactory;

    protected $table = 'ytb_water_installations';

    protected $fillable = [
        'work_order_id',
        'device_number',
        'device_id',
        'promoter_id',
        'promoter_role',
        'promoter_reward',
        'promoter_reward_settled',
        'level1_user_id',
        'level1_role',
        'level1_reward',
        'level1_reward_settled',
        'level2_user_id',
        'level2_role',
        'level2_reward',
        'level2_reward_settled',
        'boss_investment_id',
        'boss_user_id',
        'boss_refund_amount',
        'boss_refund_settled',
        'client_name',
        'client_phone',
        'province',
        'city',
        'area',
        'status',
        'installed_at',
        'calculated_at',
        'settled_at',
        'remark',
    ];

    protected $casts = [
        'promoter_reward' => 'decimal:2',
        'level1_reward' => 'decimal:2',
        'level2_reward' => 'decimal:2',
        'boss_refund_amount' => 'decimal:2',
        'promoter_reward_settled' => 'boolean',
        'level1_reward_settled' => 'boolean',
        'level2_reward_settled' => 'boolean',
        'boss_refund_settled' => 'boolean',
        'installed_at' => 'datetime',
        'calculated_at' => 'datetime',
        'settled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 状态常量
     */
    const STATUS_PENDING = 'pending';       // 待处理
    const STATUS_CALCULATED = 'calculated'; // 已计算（分佣已计算但未结算）
    const STATUS_SETTLED = 'settled';       // 已结算
    const STATUS_CANCELLED = 'cancelled';   // 已取消

    /**
     * 状态名称映射
     */
    const STATUS_NAMES = [
        self::STATUS_PENDING => '待处理',
        self::STATUS_CALCULATED => '已计算',
        self::STATUS_SETTLED => '已结算',
        self::STATUS_CANCELLED => '已取消',
    ];

    /**
     * 关联推广者
     */
    public function promoter(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'promoter_id');
    }

    /**
     * 关联一级上级
     */
    public function level1User(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'level1_user_id');
    }

    /**
     * 关联二级上级
     */
    public function level2User(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'level2_user_id');
    }

    /**
     * 关联BossCP投资记录
     */
    public function bossInvestment(): BelongsTo
    {
        return $this->belongsTo(YtbBossInvestment::class, 'boss_investment_id');
    }

    /**
     * 关联获得回款的BossCP用户
     */
    public function bossUser(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'boss_user_id');
    }

    /**
     * 是否待处理
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * 是否已计算
     */
    public function isCalculated(): bool
    {
        return $this->status === self::STATUS_CALCULATED;
    }

    /**
     * 是否已结算
     */
    public function isSettled(): bool
    {
        return $this->status === self::STATUS_SETTLED;
    }

    /**
     * 获取状态名称
     */
    public function getStatusNameAttribute(): string
    {
        return self::STATUS_NAMES[$this->status] ?? '未知';
    }

    /**
     * 获取总分佣金额
     */
    public function getTotalRewardAttribute(): float
    {
        return $this->promoter_reward + $this->level1_reward + $this->level2_reward;
    }

    /**
     * 获取总支出（含BossCP回款）
     */
    public function getTotalCostAttribute(): float
    {
        return $this->promoter_reward + $this->level1_reward + $this->level2_reward + $this->boss_refund_amount;
    }

    /**
     * 标记为已计算
     */
    public function markAsCalculated(): bool
    {
        $this->status = self::STATUS_CALCULATED;
        $this->calculated_at = now();
        return $this->save();
    }

    /**
     * 标记为已结算
     */
    public function markAsSettled(): bool
    {
        $this->status = self::STATUS_SETTLED;
        $this->settled_at = now();
        return $this->save();
    }

    /**
     * 检查工单是否已处理
     */
    public static function isWorkOrderProcessed(string $workOrderId): bool
    {
        return self::where('work_order_id', $workOrderId)->exists();
    }

    /**
     * 根据角色获取推广奖励金额
     */
    public static function getPromoterRewardByRole(string $role): float
    {
        $config = [
            YtbUser::ROLE_NORMAL => YtbConfig::getValue('install_reward_normal', 200),
            YtbUser::ROLE_SCP => YtbConfig::getValue('install_reward_scp', 300),
            YtbUser::ROLE_TEAM_CP => YtbConfig::getValue('install_reward_team_cp', 300),
            YtbUser::ROLE_BOSS_CP => YtbConfig::getValue('install_reward_boss_cp', 360),
        ];
        return floatval($config[$role] ?? 0);
    }
}
