<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class YtbUser extends Model
{
    use UsesYtbConnection, HasApiTokens, HasFactory, SoftDeletes;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_users';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
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
        'available_balance',
        'frozen_balance',
        'total_withdrawn',
        'total_install_reward',
        'total_referral_reward',
        'api_token',
        'token_expires_at',
        'status',
        'role_upgraded_at',
    ];

    /**
     * 应该隐藏的属性
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'openid',
        'unionid',
        'api_token',
    ];

    /**
     * 应该转换的属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'direct_scp_count' => 'integer',
        'direct_user_count' => 'integer',
        'available_balance' => 'decimal:2',
        'frozen_balance' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'total_install_reward' => 'decimal:2',
        'total_referral_reward' => 'decimal:2',
        'role_upgraded_at' => 'datetime',
        'token_expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * 角色常量
     */
    const ROLE_NORMAL = 'normal';
    const ROLE_SCP = 'scp';
    const ROLE_TEAM_CP = 'team_cp';
    const ROLE_BOSS_CP = 'boss_cp';

    /**
     * 状态常量
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_DISABLED = 'disabled';

    /**
     * 角色名称映射
     */
    const ROLE_NAMES = [
        self::ROLE_NORMAL => '普通用户',
        self::ROLE_SCP => 'CP伙伴',
        self::ROLE_TEAM_CP => 'VIPCP伙伴',
        self::ROLE_BOSS_CP => 'BossCP',
    ];

    /**
     * 角色等级（用于判断谁是更高级别）
     */
    const ROLE_LEVELS = [
        self::ROLE_NORMAL => 0,
        self::ROLE_SCP => 1,
        self::ROLE_TEAM_CP => 2,
        self::ROLE_BOSS_CP => 3,
    ];

    /**
     * 获取上级用户
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * 获取直接下级用户
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * 获取直接下级SCP用户
     */
    public function directScpChildren(): HasMany
    {
        return $this->children()->where('role', self::ROLE_SCP);
    }

    /**
     * 获取直接下级TeamCP用户
     */
    public function directTeamCpChildren(): HasMany
    {
        return $this->children()->where('role', self::ROLE_TEAM_CP);
    }

    /**
     * 获取直接下级BossCP用户
     */
    public function directBossCpChildren(): HasMany
    {
        return $this->children()->where('role', self::ROLE_BOSS_CP);
    }

    /**
     * 获取用户的BossCP投资记录
     */
    public function bossInvestments(): HasMany
    {
        return $this->hasMany(YtbBossInvestment::class, 'user_id');
    }

    /**
     * 获取用户推广的安装记录
     */
    public function promotedInstallations(): HasMany
    {
        return $this->hasMany(YtbWaterInstallation::class, 'promoter_id');
    }

    /**
     * 获取用户作为一级上级的安装记录
     */
    public function level1Installations(): HasMany
    {
        return $this->hasMany(YtbWaterInstallation::class, 'level1_user_id');
    }

    /**
     * 获取直接下级TeamCP用户（旧方法保留兼容）
     */
    public function directTeamCpChildrenOld(): HasMany
    {
        return $this->children()->where('role', self::ROLE_TEAM_CP);
    }

    /**
     * 获取用户的升级申请
     */
    public function upgradeApplications(): HasMany
    {
        return $this->hasMany(YtbUpgradeApplication::class, 'user_id');
    }

    /**
     * 获取用户的分佣记录（作为获得者）
     */
    public function commissions(): HasMany
    {
        return $this->hasMany(YtbCommission::class, 'user_id');
    }

    /**
     * 获取用户产生的分佣记录（作为来源）
     */
    public function generatedCommissions(): HasMany
    {
        return $this->hasMany(YtbCommission::class, 'from_user_id');
    }

    /**
     * 获取用户的邀请码记录
     */
    public function inviteCodes(): HasMany
    {
        return $this->hasMany(YtbInviteCode::class, 'user_id');
    }

    /**
     * 判断是否为普通用户
     */
    public function isNormal(): bool
    {
        return $this->role === self::ROLE_NORMAL;
    }

    /**
     * 判断是否为SCP
     */
    public function isScp(): bool
    {
        return $this->role === self::ROLE_SCP;
    }

    /**
     * 判断是否为TeamCP
     */
    public function isTeamCp(): bool
    {
        return $this->role === self::ROLE_TEAM_CP;
    }

    /**
     * 判断是否为BossCP
     */
    public function isBossCp(): bool
    {
        return $this->role === self::ROLE_BOSS_CP;
    }

    /**
     * 判断是否为CP级别以上（CP/VIPCP/BossCP）
     */
    public function isCpOrAbove(): bool
    {
        return in_array($this->role, [self::ROLE_SCP, self::ROLE_TEAM_CP, self::ROLE_BOSS_CP]);
    }

    /**
     * 判断是否可以邀请他人
     */
    /**
     * 判断是否可以邀请他人
     * 修改：所有用户（包括普通用户）都可以邀请，用于推广安装净水器
     */
    public function canInvite(): bool
    {
        return true; 
        // return $this->isScp() || $this->isTeamCp() || $this->isBossCp();
    }

    /**
     * 判断是否满足升级TeamCP的业绩条件
     */
    public function meetsTeamCpRequirement(): bool
    {
        $requirement = YtbConfig::getValue('team_cp_requirement', 9);
        return $this->direct_scp_count >= $requirement;
    }

    /**
     * 获取角色名称
     */
    public function getRoleName(): string
    {
        return self::ROLE_NAMES[$this->role] ?? '未知';
    }

    /**
     * 角色名称访问器
     */
    public function getRoleNameAttribute(): string
    {
        return $this->getRoleName();
    }

    /**
     * 生成唯一邀请码
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
            ->whereIn('role', [self::ROLE_SCP, self::ROLE_TEAM_CP])
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
     * 根据openid查找或创建用户
     */
    public static function findOrCreateByOpenid(string $openid, array $attributes = []): self
    {
        $user = self::where('openid', $openid)->first();
        
        if (!$user) {
            $user = self::create(array_merge([
                'openid' => $openid,
                'role' => self::ROLE_NORMAL,
                'status' => self::STATUS_ACTIVE,
            ], $attributes));
        }
        
        return $user;
    }

    /**
     * 根据邀请码查找用户
     */
    public static function findByInviteCode(string $code): ?self
    {
        return self::where('invite_code', $code)
            ->where('status', self::STATUS_ACTIVE)
            ->first();
    }
}
