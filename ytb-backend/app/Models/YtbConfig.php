<?php

namespace App\Models;

use App\Models\Concerns\UsesYtbConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class YtbConfig extends Model
{
    use UsesYtbConnection, HasFactory;

    /**
     * 与模型关联的表名
     *
     * @var string
     */
    protected $table = 'ytb_configs';

    /**
     * 可批量赋值的属性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * 应该转换的属性
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 配置键常量
     */
    const KEY_SCP_UPGRADE_FEE = 'scp_upgrade_fee';
    const KEY_TEAM_CP_UPGRADE_FEE = 'team_cp_upgrade_fee';
    const KEY_SCP_COMMISSION = 'scp_commission';
    const KEY_TEAM_CP_REQUIREMENT = 'team_cp_requirement';
    const KEY_WECHAT_PAY_ENABLED = 'wechat_pay_enabled';

    /**
     * 默认配置值
     */
    const DEFAULTS = [
        self::KEY_SCP_UPGRADE_FEE => 980,
        self::KEY_TEAM_CP_UPGRADE_FEE => 980,
        self::KEY_SCP_COMMISSION => 360,
        self::KEY_TEAM_CP_REQUIREMENT => 9,
        self::KEY_WECHAT_PAY_ENABLED => 0,
    ];

    /**
     * 配置说明
     */
    const DESCRIPTIONS = [
        self::KEY_SCP_UPGRADE_FEE => 'CP伙伴升级费用（元）',
        self::KEY_TEAM_CP_UPGRADE_FEE => 'VIPCP伙伴升级费用（元）',
        self::KEY_SCP_COMMISSION => '下级升级CP伙伴时上级获得的分佣（元）',
        self::KEY_TEAM_CP_REQUIREMENT => '升级VIPCP伙伴需要的直推CP伙伴数量',
        self::KEY_WECHAT_PAY_ENABLED => '微信支付是否开通：0未开通/1已开通',
    ];

    /**
     * 缓存前缀
     */
    const CACHE_PREFIX = 'ytb_config_';

    /**
     * 缓存时间（秒）
     */
    const CACHE_TTL = 3600;

    /**
     * 获取配置值
     *
     * @param string $key 配置键
     * @param mixed $default 默认值
     * @return mixed
     */
    public static function getValue(string $key, $default = null)
    {
        $cacheKey = self::CACHE_PREFIX . $key;
        
        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($key, $default) {
            $config = self::where('key', $key)->first();
            
            if ($config) {
                return $config->value;
            }
            
            // 返回默认值
            return $default ?? (self::DEFAULTS[$key] ?? null);
        });
    }

    /**
     * 设置配置值
     *
     * @param string $key 配置键
     * @param mixed $value 配置值
     * @param string|null $description 配置说明
     * @return self
     */
    public static function setValue(string $key, $value, ?string $description = null): self
    {
        $config = self::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'description' => $description ?? (self::DESCRIPTIONS[$key] ?? null),
            ]
        );
        
        // 清除缓存
        Cache::forget(self::CACHE_PREFIX . $key);
        
        return $config;
    }

    /**
     * 获取SCP升级费用
     */
    public static function getScpUpgradeFee(): float
    {
        return (float) self::getValue(self::KEY_SCP_UPGRADE_FEE, self::DEFAULTS[self::KEY_SCP_UPGRADE_FEE]);
    }

    /**
     * 获取TeamCP升级费用
     */
    public static function getTeamCpUpgradeFee(): float
    {
        return (float) self::getValue(self::KEY_TEAM_CP_UPGRADE_FEE, self::DEFAULTS[self::KEY_TEAM_CP_UPGRADE_FEE]);
    }

    /**
     * 获取SCP分佣金额
     */
    public static function getScpCommission(): float
    {
        return (float) self::getValue(self::KEY_SCP_COMMISSION, self::DEFAULTS[self::KEY_SCP_COMMISSION]);
    }

    /**
     * 获取TeamCP业绩要求
     */
    public static function getTeamCpRequirement(): int
    {
        return (int) self::getValue(self::KEY_TEAM_CP_REQUIREMENT, self::DEFAULTS[self::KEY_TEAM_CP_REQUIREMENT]);
    }

    /**
     * 判断微信支付是否开通
     */
    public static function isWechatPayEnabled(): bool
    {
        return (bool) self::getValue(self::KEY_WECHAT_PAY_ENABLED, self::DEFAULTS[self::KEY_WECHAT_PAY_ENABLED]);
    }

    /**
     * 获取所有配置
     */
    public static function getAllConfigs(): array
    {
        $configs = self::all()->pluck('value', 'key')->toArray();
        
        // 合并默认值
        foreach (self::DEFAULTS as $key => $default) {
            if (!isset($configs[$key])) {
                $configs[$key] = $default;
            }
        }
        
        return $configs;
    }

    /**
     * 批量更新配置
     */
    public static function updateConfigs(array $configs): void
    {
        foreach ($configs as $key => $value) {
            self::setValue($key, $value);
        }
    }

    /**
     * 清除所有配置缓存
     */
    public static function clearCache(): void
    {
        foreach (array_keys(self::DEFAULTS) as $key) {
            Cache::forget(self::CACHE_PREFIX . $key);
        }
    }
}
