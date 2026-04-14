<?php

namespace App\Models\Ytb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class YtbUser extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'ytb_users';

    protected $fillable = [
        'openid',
        'unionid',
        'nickname',
        'avatar',
        'phone',
        'real_name',
        'role',
        'invite_code',
        'parent_id',
        'direct_scp_count',
        'direct_user_count',
        'status',
        'role_upgraded_at',
    ];

    protected $casts = [
        'role_upgraded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // 角色常量
    const ROLE_NORMAL = 'normal';
    const ROLE_SCP = 'scp';
    const ROLE_TEAM_CP = 'team_cp';

    // 状态常量
    const STATUS_ACTIVE = 'active';
    const STATUS_DISABLED = 'disabled';

    /**
     * 角色名称映射
     */
    public static function roleNames(): array
    {
        return [
            self::ROLE_NORMAL => '普通用户',
            self::ROLE_SCP => 'CP伙伴',
            self::ROLE_TEAM_CP => 'VIPCP伙伴',
        ];
    }

    /**
     * 获取角色名称
     */
    public function getRoleNameAttribute(): string
    {
        return self::roleNames()[$this->role] ?? '未知';
    }

    /**
     * 上级用户
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(YtbUser::class, 'parent_id');
    }

    /**
     * 直接下级用户
     */
    public function children(): HasMany
    {
        return $this->hasMany(YtbUser::class, 'parent_id');
    }

    /**
     * 直接下级SCP
     */
    public function directScps(): HasMany
    {
        return $this->hasMany(YtbUser::class, 'parent_id')->where('role', self::ROLE_SCP);
    }

    /**
     * 升级申请记录
     */
    public function upgradeApplications(): HasMany
    {
        return $this->hasMany(YtbUpgradeApplication::class, 'user_id');
    }

    /**
     * 获得的分佣记录
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(YtbCommission::class, 'user_id');
    }

    /**
     * 产生的分佣记录（给上级的）
     */
    public function generatedCommissions(): HasMany
    {
        return $this->hasMany(YtbCommission::class, 'from_user_id');
    }

    /**
     * 邀请码
     */
    public function inviteCodes(): HasMany
    {
        return $this->hasMany(YtbInviteCode::class, 'user_id');
    }

    /**
     * 是否为普通用户
     */
    public function isNormal(): bool
    {
        return $this->role === self::ROLE_NORMAL;
    }

    /**
     * 是否为SCP
     */
    public function isScp(): bool
    {
        return $this->role === self::ROLE_SCP;
    }

    /**
     * 是否为TeamCP
     */
    public function isTeamCp(): bool
    {
        return $this->role === self::ROLE_TEAM_CP;
    }

    /**
     * 是否可以邀请他人
     */
    public function canInvite(): bool
    {
        return in_array($this->role, [self::ROLE_SCP, self::ROLE_TEAM_CP]);
    }

    /**
     * 是否满足升级TeamCP的业绩条件
     */
    public function meetsTeamCpRequirement(): bool
    {
        $requirement = YtbConfig::getValue('team_cp_requirement', 9);
        return $this->direct_scp_count >= $requirement;
    }

    /**
     * 生成唯一的6位邀请码
     */
    public static function generateInviteCode(): string
    {
        do {
            $code = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (self::where('invite_code', $code)->exists());
        
        return $code;
    }

    /**
     * 更新直推SCP计数
     */
    public function updateDirectScpCount(): void
    {
        $this->direct_scp_count = $this->children()
            ->where('role', self::ROLE_SCP)
            ->orWhere('role', self::ROLE_TEAM_CP)
            ->count();
        $this->save();
    }

    /**
     * 更新直推用户总数
     */
    public function updateDirectUserCount(): void
    {
        $this->direct_user_count = $this->children()->count();
        $this->save();
    }

    /**
     * 获取累计分佣金额
     */
    public function getTotalCommissionAttribute(): float
    {
        return $this->commissions()->where('status', 'settled')->sum('amount');
    }

    /**
     * 获取待结算分佣金额
     */
    public function getPendingCommissionAttribute(): float
    {
        return $this->commissions()->where('status', 'pending')->sum('amount');
    }
}
