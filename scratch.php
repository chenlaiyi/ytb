    // YTB 获取设备详情
    if (preg_match('#^ytb/devices/(\w+)$#', $path, $matches) && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $deviceId = $matches[1];
        $devices = [];

        // 尝试从 tapp_devices 查询单条
        $stmt = $tappDb->prepare("SELECT * FROM tapp_devices WHERE id = ? LIMIT 1");
        $stmt->execute([$deviceId]);
        $d = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($d) {
            $billing_mode = $d['billing_mode'] === '1' ? 'flow' : 'duration';
            
            // 查 qiyun_devices 获取实时状态、品牌、型号
            $deviceNumber = $d['device_number'] ?? '';
            $qd = [];
            if ($deviceNumber) {
                $qdStmt = $tappDb->prepare("SELECT board_code, brand, device_model, is_online FROM qiyun_devices WHERE board_code = ? LIMIT 1");
                $qdStmt->execute([$deviceNumber]);
                $qd = $qdStmt->fetch(PDO::FETCH_ASSOC) ?: [];
            }
            
            $is_online = isset($qd['is_online']) ? (bool)$qd['is_online'] : ($d['network_status'] === '1');

            $deviceData = [
                'id' => (int)$d['id'],
                'device_id' => $d['device_id'] ?? $d['device_number'] ?? '',
                'device_name' => '净水器-' . ($d['device_number'] ?? ''),
                'device_model' => $qd['device_model'] ?? $d['device_type'] ?? '',
                'brand' => $qd['brand'] ?? '净水器',
                'board_code' => $d['device_number'] ?? '',
                'sn' => $d['device_number'] ?? '',
                'install_location' => $d['client_address'] ?? $d['address'] ?? '',
                'address' => $d['client_address'] ?? $d['address'] ?? '',
                'is_primary' => (int)($d['is_self_use'] ?? 0),
                'billing_mode' => $billing_mode,
                'surplus_flow' => (float)($d['surplus_flow'] ?? 0),
                'remaining_days' => (int)($d['remaining_days'] ?? 0),
                'is_online' => $is_online,
                'network_status' => $is_online ? 'online' : 'offline',
                'is_power_on' => $is_online, // map to power status
                'bind_time' => $d['activate_date'] ?? $d['create_date'] ?? '',
                'activate_date' => $d['activate_date'] ?? '',
                'filter_life' => 100, // mock filter life
                'filters' => [
                   ['name' => 'PP棉滤芯', 'life' => 100],
                   ['name' => '前置活性炭', 'life' => 100],
                   ['name' => 'RO反渗透', 'life' => 100],
                   ['name' => '后置活性炭', 'life' => 100]
                ],
                'product_image' => '',
                'created_at' => $d['create_date'] ?? $d['created_at'] ?? '',
            ];
            
            echo json_encode([
                'code' => 0,
                'message' => 'ok',
                'data' => $deviceData
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 没找到或者出错了
        echo json_encode([
            'code' => 404,
            'message' => '设备不存在',
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
