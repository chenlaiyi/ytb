<?php
$qiyunDb = new PDO('mysql:host=127.0.0.1;dbname=ddg.app', 'ddg.app', '8GmWPjwbwY4waXcT');
$ytbDb = new PDO('mysql:host=127.0.0.1;dbname=ytb_ddg_org_cn', 'ytb_ddg_org_cn', 'XYKHzy1DTzR1w1sT');

// 找到陈来意 (app_user_id = 32) 在 ddg.app 中的 8 台机器
$stmt = $qiyunDb->query("SELECT * FROM tapp_devices WHERE app_user_id = 32");
$devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($devices as $d) {
    if (!$d['device_number']) continue;
    
    // 检查 ytb_devices 中是否已存在
    $check = $ytbDb->prepare("SELECT id FROM ytb_devices WHERE device_number = ?");
    $check->execute([$d['device_number']]);
    if ($check->fetch()) {
        continue;
    }
    
    // 插入 ytb_devices
    $ins = $ytbDb->prepare("
        INSERT INTO ytb_devices (
            device_number, board_code, status, network_status, billing_mode, 
            surplus_flow, cumulative_flow, raw_water_tds, pure_water_tds, signal_strength,
            client_name, client_phone, client_address, activate_date, create_date, update_date, source_from
        ) VALUES (
            ?, ?, 'activated', ?, ?,
            ?, ?, ?, ?, ?,
            '陈来意', '18060928988', ?, ?, ?, ?, 'qiyun'
        )
    ");
    
    $ins->execute([
        $d['device_number'],
        $d['device_number'], // board_code
        $d['network_status'] ?? '1',
        $d['billing_mode'] === '1' ? 'flow' : 'time',
        $d['surplus_flow'] ?? 0,
        $d['cumulative_filtration_flow'] ?? 0,
        $d['raw_water_value'] ?? 0,
        $d['purification_water_value'] ?? 0,
        $d['signal_intensity'] ?? 0,
        $d['client_address'] ?? $d['address'] ?? '',
        $d['activate_date'] ?? null,
        $d['create_date'] ?? date('Y-m-d H:i:s'),
        $d['update_date'] ?? date('Y-m-d H:i:s')
    ]);
}
echo "Migrated 8 devices successfully.\n";
