<?php

namespace App\Models\Ytb;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class YtbConfig extends Model
{
    use HasFactory;

    protected $table = 'ytb_configs';

    protected $fillable = [
        'key',
        'value',
        'description',
    ];

    /**
     * 获取配置值
     */
    public static function getValue(string $key, $default = null)
    {
        $cacheKey = 'ytb_config_' . $key;
        
        return Cache::remember($cacheKey, 3600, function () use ($key, $default) {
            $config = self::where('key', $key)->first();
            return $config ? $config->value : $default;
        });
    }

    /**
     * 设置配置值
     */
    public static function setValue(string $key, $value, string $description = null): bool
    {
        $config = self::updateOrCreate(
            ['key' => $key],
            ['value' => $value, 'description' => $description]
        );

        // 清除缓存
        Cache::forget('ytb_config_' . $key);

        return $config->wasRecentlyCreated || $config->wasChanged();
    }

    /**
     * 获取所有配置
     */
    public static function getAllConfigs(): array
    {
        return self::all()->pluck('value', 'key')->toArray();
    }

    /**
     * 清除所有配置缓存
     */
    public static function clearCache(): void
    {
        $configs = self::all();
        foreach ($configs as $config) {
            Cache::forget('ytb_config_' . $config->key);
        }
    }

    /**
     * 获取SCP升级费用
     */
    public static function getScpUpgradeFee(): float
    {
        return (float) self::getValue('scp_upgrade_fee', 980);
    }

    /**
     * 获取TeamCP升级费用
     */
    public static function getTeamCpUpgradeFee(): float
    {
        return (float) self::getValue('team_cp_upgrade_fee', 980);
    }

    /**
     * 获取SCP分佣金额
     */
    public static function getScpCommission(): float
    {
        return (float) self::getValue('scp_commission', 360);
    }

    /**
     * 获取升级TeamCP需要的直推SCP数量
     */
    public static function getTeamCpRequirement(): int
    {
        return (int) self::getValue('team_cp_requirement', 9);
    }

    /**
     * 微信支付是否开通
     */
    public static function isWechatPayEnabled(): bool
    {
        return (bool) self::getValue('wechat_pay_enabled', false);
    }
}
