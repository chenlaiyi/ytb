<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class YtbDevice extends Model
{
    protected $table = 'ytb_devices';

    protected $fillable = [
        'device_number',
        'board_code',
        'imei',
        'iccid',
        'module_code',
        'device_type',
        'brand',
        'device_model',
        'dealer_id',
        'billing_mode',
        'status',
        'network_status',
        'client_name',
        'client_phone',
        'client_address',
        'create_date',
    ];

    // 状态常量
    const STATUS_PENDING = 'pending';
    const STATUS_ASSIGNED = 'assigned';
    const STATUS_INSTALLED = 'installed';
    const STATUS_ACTIVATED = 'activated';
    const STATUS_DISABLED = 'disabled';

    // 在线状态
    const NETWORK_ONLINE = '1';
    const NETWORK_OFFLINE = '0';

    /**
     * 获取设备统计
     */
    public static function getStatistics()
    {
        $total = self::count();
        $stats = self::selectRaw("
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
            SUM(CASE WHEN status = 'installed' THEN 1 ELSE 0 END) as installed,
            SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as activated,
            SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) as disabled,
            SUM(CASE WHEN LENGTH(imei) >= 10 THEN 1 ELSE 0 END) as iot_registered,
            SUM(CASE WHEN create_date >= CURDATE() THEN 1 ELSE 0 END) as today,
            SUM(CASE WHEN create_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 ELSE 0 END) as this_month
        ")->first();

        // 通过心跳时间判断在线设备数（5分钟内有心跳视为在线）
        $onlineCount = 0;
        try {
            $deviceNumbers = self::pluck('device_number')->toArray();
            if (!empty($deviceNumbers)) {
                $placeholders = implode(',', array_fill(0, count($deviceNumbers), '?'));
                $onlineCount = (int) \DB::connection('ddg_app')
                    ->selectOne("SELECT COUNT(*) as cnt FROM qiyun_devices WHERE board_code IN ($placeholders) AND last_sync_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)", $deviceNumbers)
                    ->cnt ?? 0;
            }
        } catch (\Exception $e) {
            // 如果跨库连接失败，回退到 network_status
            $onlineCount = intval($stats->online ?? self::where('network_status', '1')->count());
        }

        return [
            'total_devices' => $total,
            'pending_devices' => intval($stats->pending ?? 0),
            'assigned_devices' => intval($stats->assigned ?? 0),
            'installed_devices' => intval($stats->installed ?? 0),
            'activated_devices' => intval($stats->activated ?? 0),
            'disabled_devices' => intval($stats->disabled ?? 0),
            'online_devices' => $onlineCount,
            'offline_devices' => $total - $onlineCount,
            'iot_registered_devices' => intval($stats->iot_registered ?? 0),
            'online_rate' => $total > 0 ? round($onlineCount / $total * 100, 1) : 0,
            'today_devices' => intval($stats->today ?? 0),
            'this_month_devices' => intval($stats->this_month ?? 0),
        ];
    }
}
