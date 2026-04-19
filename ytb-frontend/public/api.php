<?php
/**
 * YTB 独立管理后台 API 入口
 * 独立部署，不依赖 pay.itapgo.com
 */
ini_set('display_errors', '1');
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Site-Domain');

// 预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 获取站点域名
$host = $_SERVER['HTTP_X_SITE_DOMAIN'] ?? $_SERVER['HTTP_HOST'] ?? '';
if (!in_array($host, ['ytb.ddg.org.cn', 'www.ytb.ddg.org.cn'])) {
    http_response_code(403);
    echo json_encode(['code' => 403, 'message' => '非法站点']);
    exit;
}

// 数据库配置
$dbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'ytb_ddg_org_cn',
    'username' => 'ytb_ddg_org_cn',
    'password' => 'XYKHzy1DTzR1w1sT',
];

// Tapp数据库配置（用于设备等数据）
$tappDbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'ddg.app',
    'username' => 'ddg.app',
    'password' => '8GmWPjwbwY4waXcT',
];

// 简单的数据库连接
function getDB() {
    global $dbConfig;
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset=utf8mb4";
            $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password']);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['code' => 500, 'message' => '数据库连接失败']);
            exit;
        }
    }
    return $pdo;
}

// 获取Tapp数据库连接
function getTappDB() {
    global $tappDbConfig;
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host={$tappDbConfig['host']};port={$tappDbConfig['port']};dbname={$tappDbConfig['database']};charset=utf8mb4";
            $pdo = new PDO($dsn, $tappDbConfig['username'], $tappDbConfig['password']);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            return null;
        }
    }
    return $pdo;
}

// 获取请求路径
$path = $_GET['_path'] ?? '';
if (!$path) {
    $requestUri = $_SERVER['REQUEST_URI'];
    $path = parse_url($requestUri, PHP_URL_PATH);
    $path = str_replace('/api/', '', $path);
}
$path = trim($path, '/');

// 获取请求方法
$method = $_SERVER['REQUEST_METHOD'];

// 获取 Authorization 头
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = '';
if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = $matches[1];
}

// 获取请求体
$input = json_decode(file_get_contents('php://input'), true) ?? [];

function getCurrentOrigin() {
    $forwardedProto = $_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '';
    if (strtolower($forwardedProto) === 'https') {
        $scheme = 'https';
    } else {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    }

    $host = $_SERVER['HTTP_HOST'] ?? 'ytb.ddg.org.cn';
    return $scheme . '://' . $host;
}

function forwardJsonRequest($url, $method = 'GET', $payload = null, $timeout = 15) {
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];

    $options = [
        'http' => [
            'method' => strtoupper($method),
            'timeout' => $timeout,
            'ignore_errors' => true,
            'header' => implode("\r\n", $headers),
        ],
    ];

    if ($payload !== null) {
        $options['http']['content'] = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    $context = stream_context_create($options);
    $rawBody = @file_get_contents($url, false, $context);
    if ($rawBody === false) {
        return null;
    }

    $status = 200;
    if (isset($http_response_header) && is_array($http_response_header) && isset($http_response_header[0])) {
        if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $matches)) {
            $status = (int)$matches[1];
        }
    }

    $decoded = json_decode($rawBody, true);
    if (!is_array($decoded)) {
        return null;
    }

    return [
        'status' => $status,
        'data' => $decoded,
    ];
}

function buildWechatOauthUrl($appId, $redirectUri, $state = '/home', $componentAppId = '') {
    $query = http_build_query([
        'appid' => $appId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'snsapi_base',
        'state' => $state,
    ]);

    if (!empty($componentAppId)) {
        $query .= '&component_appid=' . urlencode($componentAppId);
    }

    return 'https://open.weixin.qq.com/connect/oauth2/authorize?' . $query . '#wechat_redirect';
}

function getTableColumns($db, $table) {
    static $cache = [];
    $key = $table;
    if (isset($cache[$key])) {
        return $cache[$key];
    }

    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}`");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $columns = [];
    foreach ($rows as $row) {
        if (!empty($row['Field'])) {
            $columns[$row['Field']] = true;
        }
    }

    $cache[$key] = $columns;
    return $columns;
}

function getWechatAccountConfig($db, $preferredAppId) {
    try {
        $columns = getTableColumns($db, 'wechat_authorized_accounts');

        $selectFields = [];
        $appIdField = isset($columns['authorizer_appid']) ? 'authorizer_appid' : (isset($columns['app_id']) ? 'app_id' : null);
        $appSecretField = isset($columns['app_secret']) ? 'app_secret' : (isset($columns['authorizer_appsecret']) ? 'authorizer_appsecret' : null);
        $tokenField = isset($columns['authorizer_access_token']) ? 'authorizer_access_token' : null;

        if (!$appIdField) {
            return null;
        }

        $selectFields[] = $appIdField;
        if ($appSecretField) {
            $selectFields[] = $appSecretField;
        }
        if ($tokenField) {
            $selectFields[] = $tokenField;
        }

        $sql = 'SELECT ' . implode(', ', array_unique($selectFields)) . ' FROM wechat_authorized_accounts';
        $params = [];

        if (isset($columns['status'])) {
            $sql .= " WHERE status = 'active'";
            if (!empty($preferredAppId)) {
                $sql .= " AND {$appIdField} = ?";
                $params[] = $preferredAppId;
            }
        } else if (!empty($preferredAppId)) {
            $sql .= " WHERE {$appIdField} = ?";
            $params[] = $preferredAppId;
        }

        if (isset($columns['updated_at'])) {
            $sql .= ' ORDER BY updated_at DESC';
        } else if (isset($columns['id'])) {
            $sql .= ' ORDER BY id DESC';
        }
        $sql .= ' LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        return [
            'app_id' => $row[$appIdField] ?? '',
            'app_secret' => $appSecretField ? ($row[$appSecretField] ?? '') : '',
            'authorizer_access_token' => $tokenField ? ($row[$tokenField] ?? '') : '',
        ];
    } catch (Exception $e) {
        return null;
    }
}

function getWechatComponentConfig($db) {
    $candidateTables = [
        'wechat_third_party_platform_configs',
        'wechat_third_party_platforms',
        'wechat_third_party_configs',
    ];

    foreach ($candidateTables as $table) {
        try {
            $columns = getTableColumns($db, $table);
            if (!$columns) {
                continue;
            }

            $appIdField = isset($columns['component_appid']) ? 'component_appid' : (isset($columns['app_id']) ? 'app_id' : null);
            if (!$appIdField) {
                continue;
            }

            $tokenField = isset($columns['component_access_token'])
                ? 'component_access_token'
                : (isset($columns['access_token']) ? 'access_token' : null);

            $selectFields = [$appIdField];
            if ($tokenField) {
                $selectFields[] = $tokenField;
            }

            $sql = 'SELECT ' . implode(', ', array_unique($selectFields)) . ' FROM ' . $table;
            if (isset($columns['is_active'])) {
                $sql .= ' WHERE is_active = 1';
            } else if (isset($columns['status'])) {
                $sql .= " WHERE status IN ('active', 'enabled', '1', 1)";
            }

            if (isset($columns['updated_at'])) {
                $sql .= ' ORDER BY updated_at DESC';
            } else if (isset($columns['id'])) {
                $sql .= ' ORDER BY id DESC';
            }
            $sql .= ' LIMIT 1';

            $stmt = $db->prepare($sql);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                continue;
            }

            $componentAppId = $row[$appIdField] ?? '';
            if (empty($componentAppId)) {
                continue;
            }

            return [
                'component_appid' => $componentAppId,
                'component_access_token' => $tokenField ? ($row[$tokenField] ?? '') : '',
            ];
        } catch (Exception $e) {
            continue;
        }
    }

    return null;
}

function getWechatComponentAppIdFallback() {
    // 当前系统第三方平台固定AppID（从后台配置页同步）
    return 'wx542eec58a75fe9e2';
}

function wechatApiGetJson($url, $timeout = 10) {
    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'ignore_errors' => true,
        ],
    ]);

    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        return null;
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function saveYtbUserByWechat($db, $wechatUser) {
    $openid = $wechatUser['openid'] ?? '';
    if (!$openid) {
        return null;
    }

    $unionid = $wechatUser['unionid'] ?? null;
    $nickname = $wechatUser['nickname'] ?? ('微信用户' . substr(md5($openid), 0, 6));
    $avatar = $wechatUser['headimgurl'] ?? '';

    // 尝试通过 unionid 或者 openid 查找存量用户
    if ($unionid) {
        $stmt = $db->prepare('SELECT * FROM ytb_users WHERE unionid = ? OR openid = ? ORDER BY id ASC LIMIT 1');
        $stmt->execute([$unionid, $openid]);
    } else {
        $stmt = $db->prepare('SELECT * FROM ytb_users WHERE openid = ? LIMIT 1');
        $stmt->execute([$openid]);
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $updateStmt = $db->prepare('UPDATE ytb_users SET unionid = ?, nickname = ?, avatar = ?, updated_at = NOW() WHERE id = ?');
        $updateStmt->execute([$unionid, $nickname, $avatar, $user['id']]);
    } else {
        $insertStmt = $db->prepare(
            "INSERT INTO ytb_users (openid, unionid, nickname, avatar, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'normal', 'active', NOW(), NOW())"
        );
        $insertStmt->execute([$openid, $unionid, $nickname, $avatar]);

        $stmt = $db->prepare('SELECT * FROM ytb_users WHERE id = ? LIMIT 1');
        $stmt->execute([$db->lastInsertId()]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$user) {
        return null;
    }

    $apiToken = bin2hex(random_bytes(24));
    $tokenExpiresAt = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);

    $tokenStmt = $db->prepare('UPDATE ytb_users SET api_token = ?, token_expires_at = ?, updated_at = NOW() WHERE id = ?');
    $tokenStmt->execute([$apiToken, $tokenExpiresAt, $user['id']]);

    $user['api_token'] = $apiToken;
    $user['token_expires_at'] = $tokenExpiresAt;
    return $user;
}

// 简单路由
try {
    $db = getDB();

    // ==================== YTB 普通用户 API 路由 ====================
    
    // YTB用户Token认证函数
    function authenticateYtbUser($db, $token) {
        if (empty($token)) return null;
        $stmt = $db->prepare('SELECT * FROM ytb_users WHERE api_token = ? AND status = "active" LIMIT 1');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) return null;
        // 检查token是否过期
        if (!empty($user['token_expires_at']) && strtotime($user['token_expires_at']) < time()) return null;
        return $user;
    }

    // YTB 系统配置
    if ($path === 'ytb/config' && $method === 'GET') {
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'app_name' => '亿拓宝联盟',
                'version' => '1.0.0',
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取当前用户信息
    if ($path === 'ytb/user/me' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'id' => (int)$user['id'],
                'userId' => (int)$user['id'],
                'openid' => $user['openid'] ?? '',
                'unionid' => $user['unionid'] ?? '',
                'nickname' => $user['nickname'] ?? '',
                'name' => $user['nickname'] ?? '',
                'avatar' => $user['avatar'] ?? '',
                'phone' => $user['phone'] ?? '',
                'real_name' => $user['real_name'] ?? '',
                'role' => $user['role'] ?? 'normal',
                'is_engineer' => (bool)($user['is_engineer'] ?? false),
                'invite_code' => $user['invite_code'] ?? '',
                'available_balance' => $user['available_balance'] ?? '0.00',
                'frozen_balance' => $user['frozen_balance'] ?? '0.00',
                'direct_scp_count' => (int)($user['direct_scp_count'] ?? 0),
                'direct_user_count' => (int)($user['direct_user_count'] ?? 0),
                'created_at' => $user['created_at'] ?? '',
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 更新用户信息
    if ($path === 'ytb/user/update' && $method === 'POST') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $updates = [];
        $params = [];
        foreach (['nickname', 'real_name', 'phone', 'avatar'] as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        if (!empty($updates)) {
            $updates[] = 'updated_at = NOW()';
            $params[] = $user['id'];
            $sql = 'UPDATE ytb_users SET ' . implode(', ', $updates) . ' WHERE id = ?';
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }
        echo json_encode(['code' => 0, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 头像上传
    if ($path === 'ytb/upload-avatar' && $method === 'POST') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['code' => 400, 'message' => '上传失败'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = mime_content_type($_FILES['file']['tmp_name']);
        if (!in_array($fileType, $allowedTypes)) {
            echo json_encode(['code' => 400, 'message' => '不支持的图片格式'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION) ?: 'jpg';
        $filename = 'avatar_' . $user['id'] . '_' . time() . '.' . $ext;
        $uploadDir = __DIR__ . '/uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $targetPath = $uploadDir . $filename;
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            $avatarUrl = 'https://ytb.ddg.org.cn/uploads/avatars/' . $filename;
            // 同时更新数据库
            $stmt = $db->prepare('UPDATE ytb_users SET avatar = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$avatarUrl, $user['id']]);

            echo json_encode([
                'code' => 0,
                'message' => '上传成功',
                'data' => ['url' => $avatarUrl]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(['code' => 500, 'message' => '文件保存失败'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // 格式化设备含有18位省市县行政区划代码的地址
    function formatDeviceAddress($rawAddress) {
        if (!$rawAddress) return '';
        if (preg_match('/^(\d{6})(\d{6})(\d{6})(.*)$/', $rawAddress, $matches)) {
            static $areaMap = null;
            if ($areaMap === null) {
                $jsonFile = __DIR__ . '/area_map.json';
                if (file_exists($jsonFile)) {
                    $areaMap = json_decode(file_get_contents($jsonFile), true) ?: [];
                } else {
                    $areaMap = [];
                }
            }
            $p = $areaMap[$matches[1]] ?? '';
            $c = $areaMap[$matches[2]] ?? '';
            $a = $areaMap[$matches[3]] ?? '';
            return trim($p . $c . $a . $matches[4]);
        }
        return $rawAddress;
    }

    // YTB 获取设备详情
    if (preg_match('#^ytb/devices/(\w+)$#', $path, $matches) && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $deviceId = $matches[1];

        try {
            // 从 ytb_devices 查询（唯一数据源）
            $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ? LIMIT 1");
            $stmt->execute([$deviceId]);
            $d = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($d) {
                $billing_mode = strtolower($d['billing_mode'] ?? '') === 'flow' ? 'flow' : 'duration';
                
                // 从 qiyun_devices 获取实时在线状态，从 tapp_devices 获取滤芯数据
                $deviceNumber = $d['device_number'] ?? '';
                $qd = [];
                $td = [];
                if ($deviceNumber) {
                    try {
                        $tappDb = getTappDB();
                        // 从 qiyun_devices 获取在线状态、品牌、流量、滤芯等完整数据
                        $qdStmt = $tappDb->prepare("SELECT board_code, brand, device_model, last_sync_at, cumulative_flow, surplus_flow, total_recharged_flow, f1_flux, f1_flux_max, f2_flux, f2_flux_max, f3_flux, f3_flux_max, f4_flux, f4_flux_max FROM qiyun_devices WHERE board_code = ? LIMIT 1");
                        $qdStmt->execute([$deviceNumber]);
                        $qd = $qdStmt->fetch(PDO::FETCH_ASSOC) ?: [];
                        
                        // tapp_devices 作为补充数据源
                        $tdStmt = $tappDb->prepare("SELECT * FROM tapp_devices WHERE device_number = ? LIMIT 1");
                        $tdStmt->execute([$deviceNumber]);
                        $td = $tdStmt->fetch(PDO::FETCH_ASSOC) ?: [];
                    } catch (Exception $e) {}
                }
                
                // 通过心跳时间判断在线：last_sync_at 在5分钟内视为在线
                $is_online = false;
                if (!empty($qd['last_sync_at'])) {
                    $is_online = (time() - strtotime($qd['last_sync_at'])) < 300;
                }

                // 滤芯寿命：优先 qiyun_devices，fallback tapp_devices
                $f1flux = $qd['f1_flux'] ?? $td['f1_flux'] ?? 0;
                $f1max  = $qd['f1_flux_max'] ?? $td['f1_flux_max'] ?? 0;
                $f2flux = $qd['f2_flux'] ?? $td['f2_flux'] ?? 0;
                $f2max  = $qd['f2_flux_max'] ?? $td['f2_flux_max'] ?? 0;
                $f3flux = $qd['f3_flux'] ?? $td['f3_flux'] ?? 0;
                $f3max  = $qd['f3_flux_max'] ?? $td['f3_flux_max'] ?? 0;
                $f4flux = $qd['f4_flux'] ?? $td['f4_flux'] ?? 0;
                $f4max  = $qd['f4_flux_max'] ?? $td['f4_flux_max'] ?? 0;

                $fl1 = !empty($f1max) && $f1max > 0 ? max(0, min(100, round((1 - $f1flux / $f1max) * 100))) : 100;
                $fl2 = !empty($f2max) && $f2max > 0 ? max(0, min(100, round((1 - $f2flux / $f2max) * 100))) : 100;
                $fl3 = !empty($f3max) && $f3max > 0 ? max(0, min(100, round((1 - $f3flux / $f3max) * 100))) : 100;
                $fl4 = !empty($f4max) && $f4max > 0 ? max(0, min(100, round((1 - $f4flux / $f4max) * 100))) : 100;

                $remaining_days = 0;
                if (!empty($d['service_end_date'])) {
                    $days = floor((strtotime($d['service_end_date']) - time()) / 86400);
                    $remaining_days = $days > 0 ? $days : 0;
                }

                // 剩余流量：优先 qiyun > tapp > ytb
                $realSurplusFlow = (float)($qd['surplus_flow'] ?? $td['surplus_flow'] ?? $d['surplus_flow'] ?? 0);

                // 累计用水量计算（多级 fallback）：
                // 1. qiyun cumulative_flow（如果 > 0）
                // 2. tapp cumulative_filtration_flow（如果 > 0）
                // 3. qiyun total_recharged_flow - surplus_flow（计算得出）
                // 4. ytb cumulative_flow（最后 fallback）
                $totalWater = 0;
                $qdCumFlow = (float)($qd['cumulative_flow'] ?? 0);
                $tdCumFlow = (float)($td['cumulative_filtration_flow'] ?? 0);
                $qdTotalRecharged = (float)($qd['total_recharged_flow'] ?? 0);
                $qdSurplus = (float)($qd['surplus_flow'] ?? 0);

                if ($qdCumFlow > 0) {
                    $totalWater = $qdCumFlow;
                } elseif ($tdCumFlow > 0) {
                    $totalWater = $tdCumFlow;
                } elseif ($qdTotalRecharged > 0 && $qdSurplus >= 0) {
                    $totalWater = max(0, $qdTotalRecharged - $qdSurplus);
                } else {
                    $totalWater = (float)($d['cumulative_flow'] ?? 0);
                }

                $deviceData = [
                    'id' => (int)$d['id'],
                    'device_id' => $d['device_number'] ?? '',
                    'device_name' => '净水器-' . ($d['device_number'] ?? ''),
                    'device_model' => $d['device_model'] ?? $qd['device_model'] ?? '',
                    'brand' => $d['brand'] ?? $qd['brand'] ?? '净水器',
                    'board_code' => $d['device_number'] ?? '',
                    'sn' => $d['device_number'] ?? '',
                    'install_location' => formatDeviceAddress($d['client_address'] ?? ''),
                    'address' => formatDeviceAddress($d['client_address'] ?? ''),
                    'contact_name' => $d['client_name'] ?? '',
                    'contact_phone' => $d['client_phone'] ?? '',
                    'imei' => $d['imei'] ?? '',
                    'iccid' => $d['iccid'] ?? '',
                    'is_primary' => 1,
                    'billing_mode' => $billing_mode,
                    'surplus_flow' => $realSurplusFlow,
                    'remaining_days' => $remaining_days,
                    'total_water' => round($totalWater, 1),
                    'today_water' => 0,
                    'month_water' => 0,
                    'is_online' => $is_online,
                    'network_status' => $is_online ? 'online' : 'offline',
                    'is_power_on' => $is_online,
                    'has_fault' => false,
                    'is_activated' => !empty($d['activate_date']) || !empty($d['service_end_date']),
                    'raw_water_value' => (float)($qd['raw_water_tds'] ?? $d['raw_water_tds'] ?? 0),
                    'purification_water_value' => (float)($qd['pure_water_tds'] ?? $d['pure_water_tds'] ?? 0),
                    'signal_intensity' => $d['signal_strength'] ?? 0,
                    'service_end_date' => $d['service_end_date'] ?? '',
                    'last_online_at' => $qd['last_sync_at'] ?? $td['last_sync_time'] ?? '',
                    'used_days' => (function() use ($d) {
                        // 优先用 activate_date 计算使用天数
                        $startDate = $d['activate_date'] ?: $d['create_date'] ?? null;
                        if (!empty($startDate)) {
                            $days = floor((time() - strtotime($startDate)) / 86400);
                            return max(0, $days);
                        }
                        // 如果都为空，从 service_end_date 反推（包年模式一般365天）
                        if (!empty($d['service_end_date'])) {
                            $endTs = strtotime($d['service_end_date']);
                            $totalServiceDays = 365; // 默认包年365天
                            $remaining = floor(($endTs - time()) / 86400);
                            return max(0, $totalServiceDays - max(0, $remaining));
                        }
                        return 0;
                    })(),
                    'bind_time' => $d['activate_date'] ?: ($d['create_date'] ?? ''),
                    'activate_date' => $d['activate_date'] ?: ($d['create_date'] ?? ''),
                    'filters' => [
                       ['name' => 'PP棉滤芯', 'life' => $fl1],
                       ['name' => '前置活性炭', 'life' => $fl2],
                       ['name' => 'RO反渗透', 'life' => $fl3],
                       ['name' => '后置活性炭', 'life' => $fl4]
                    ],
                    'product_image' => '',
                    'created_at' => $d['create_date'] ?? '',
                ];
                
                echo json_encode([
                    'code' => 0,
                    'message' => 'ok',
                    'data' => $deviceData
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        } catch (Exception $e) {}

        // 设备找不到或 fallback 没匹配
        echo json_encode([
            'code' => 404,
            'message' => '设备不存在',
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取设备列表
    if ($path === 'ytb/devices' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $devices = [];
        $total = 0;

        try {
            // 直接从 ytb_devices 查询当前用户绑定的设备
            $userId = (int)$user['id'];
            $countStmt = $db->prepare('SELECT COUNT(*) FROM ytb_devices WHERE ytb_user_id = ?');
            $countStmt->execute([$userId]);
            $total = (int)$countStmt->fetchColumn();

            $offsetInt = (int)$offset;
            $perPageInt = (int)$perPage;
            $listStmt = $db->prepare("SELECT * FROM ytb_devices WHERE ytb_user_id = ? ORDER BY create_date DESC LIMIT {$perPageInt} OFFSET {$offsetInt}");
            $listStmt->execute([$userId]);
            $rawDevices = $listStmt->fetchAll(PDO::FETCH_ASSOC);

            // 从 qiyun_devices 获取实时在线状态和套餐数据
            $qiyunDeviceMap = [];
            if (!empty($rawDevices)) {
                $deviceNumbers = array_filter(array_column($rawDevices, 'device_number'));
                if (!empty($deviceNumbers)) {
                    try {
                        $tappDb = getTappDB();
                        $dp = implode(',', array_fill(0, count($deviceNumbers), '?'));
                        $qdStmt = $tappDb->prepare("SELECT board_code, brand, device_model, last_sync_at, surplus_flow, service_start_date, service_end_date, billing_mode FROM qiyun_devices WHERE board_code IN ($dp)");
                        $qdStmt->execute(array_values($deviceNumbers));
                        while ($qd = $qdStmt->fetch(PDO::FETCH_ASSOC)) {
                            $qiyunDeviceMap[$qd['board_code']] = $qd;
                        }
                    } catch (Exception $e) {}
                }
            }

            foreach ($rawDevices as $d) {
                $boardCode = $d['device_number'] ?? '';
                $qd = $qiyunDeviceMap[$boardCode] ?? [];
                // 优先使用qiyun的计费模式，否则用ytb的
                $billing_mode = !empty($qd['billing_mode']) ? $qd['billing_mode'] : (strtolower($d['billing_mode'] ?? '') === 'flow' ? 'flow' : 'duration');
                // 通过心跳时间判断在线：last_sync_at 在5分钟内视为在线
                $is_online = false;
                if (!empty($qd['last_sync_at'])) {
                    $is_online = (time() - strtotime($qd['last_sync_at'])) < 300;
                }

                // 剩余天数优先从qiyun的service_end_date计算，其次用ytb的
                $remaining_days = 0;
                $service_end_date = $d['service_end_date'] ?? '';
                if (!empty($qd['service_end_date'])) {
                    $service_end_date = $qd['service_end_date'];
                }
                if (!empty($service_end_date)) {
                    $days = floor((strtotime($service_end_date) - time()) / 86400);
                    $remaining_days = $days > 0 ? $days : 0;
                }

                // 剩余流量优先从qiyun获取
                $surplus_flow = (float)($d['surplus_flow'] ?? 0);
                if (isset($qd['surplus_flow'])) {
                    $surplus_flow = (float)$qd['surplus_flow'];
                }

                $devices[] = [
                    'id' => (int)$d['id'],
                    'device_id' => $boardCode,
                    'device_name' => '净水器-' . ($boardCode),
                    'device_model' => $d['device_model'] ?? $qd['device_model'] ?? '',
                    'brand' => $d['brand'] ?? $qd['brand'] ?? '净水器',
                    'board_code' => $boardCode,
                    'sn' => $boardCode,
                    'install_location' => formatDeviceAddress($d['client_address'] ?? ''),
                    'address' => formatDeviceAddress($d['client_address'] ?? ''),
                    'is_primary' => 1,
                    'billing_mode' => $billing_mode,
                    'surplus_flow' => $surplus_flow,
                    'remaining_days' => $remaining_days,
                    'is_online' => $is_online,
                    'network_status' => $is_online ? 'online' : 'offline',
                    'bind_time' => $d['activate_date'] ?? $d['create_date'] ?? '',
                    'activate_date' => $d['activate_date'] ?? '',
                    'service_end_date' => $service_end_date,
                    'filter_life' => 100,
                    'product_image' => '',
                    'raw_water_value' => (float)($d['raw_water_tds'] ?? 0),
                    'purification_water_value' => (float)($d['pure_water_tds'] ?? 0),
                    'created_at' => $d['create_date'] ?? '',
                ];
            }
        } catch (Exception $e) {
            $total = 0;
            $devices = [];
        }

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'list' => $devices,
                'total' => $total > 0 ? $total : count($devices),
                'page' => $page,
                'per_page' => $perPage,
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 设备心跳列表
    if ($path === 'admin/v1/ytb/devices/heartbeats' && $method === 'GET') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;
        $keyword = trim($_GET['keyword'] ?? '');

        $heartbeats = [];
        $total = 0;

        try {
            $ytbDevices = [];
            $ytbStmt = $db->query("SELECT id, device_number FROM ytb_devices WHERE device_number IS NOT NULL AND device_number != ''");
            while ($row = $ytbStmt->fetch(PDO::FETCH_ASSOC)) {
                $ytbDevices[$row['device_number']] = $row['id'];
            }

            if (empty($ytbDevices)) {
                echo json_encode([
                    'code' => 0,
                    'message' => 'ok',
                    'data' => ['list' => [], 'total' => 0, 'page' => $page, 'per_page' => $perPage]
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $tappDb = getTappDB();

            $deviceNumbers = array_keys($ytbDevices);
            $placeholders = implode(", ", array_fill(0, count($deviceNumbers), "?"));

            $keywordCondition = '';
            $params = $deviceNumbers;
            if (!empty($keyword)) {
                $keywordCondition = " AND board_code LIKE ?";
                $params[] = '%' . $keyword . '%';
            }

            $countSql = "SELECT COUNT(*) FROM qiyun_device_heartbeats WHERE board_code IN ($placeholders)$keywordCondition";
            $countStmt = $tappDb->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            $offsetInt = (int)$offset;
            $perPageInt = (int)$perPage;
            $listSql = "SELECT * FROM qiyun_device_heartbeats WHERE board_code IN ($placeholders)$keywordCondition ORDER BY received_at DESC LIMIT $perPageInt OFFSET $offsetInt";
            $listStmt = $tappDb->prepare($listSql);
            $listStmt->execute($params);
            $rawHeartbeats = $listStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rawHeartbeats as $hb) {
                $heartbeats[] = [
                    'id' => (int)$hb['id'],
                    'ytb_device_id' => $ytbDevices[$hb['board_code']] ?? 0,
                    'board_code' => $hb['board_code'],
                    'f1_flux' => (int)$hb['f1_flux'],
                    'f1_flux_max' => (int)$hb['f1_flux_max'],
                    'f2_flux' => (int)$hb['f2_flux'],
                    'f2_flux_max' => (int)$hb['f2_flux_max'],
                    'f3_flux' => (int)$hb['f3_flux'],
                    'f3_flux_max' => (int)$hb['f3_flux_max'],
                    'f4_flux' => (int)$hb['f4_flux'],
                    'f4_flux_max' => (int)$hb['f4_flux_max'],
                    'f5_flux' => (int)$hb['f5_flux'],
                    'f5_flux_max' => (int)$hb['f5_flux_max'],
                    'cumulative_filtration_flow' => (float)$hb['cumulative_filtration_flow'],
                    'surplus_flow' => (float)$hb['surplus_flow'],
                    'raw_water_tds' => (int)$hb['raw_water_tds'],
                    'pure_water_tds' => (int)$hb['pure_water_tds'],
                    'signal_strength' => (int)$hb['signal_strength'],
                    'is_online' => (bool)$hb['is_online'],
                    'active_status' => $hb['active_status'],
                    'service_status' => $hb['service_status'],
                    'locking_status' => $hb['locking_status'],
                    'received_at' => $hb['received_at'],
                ];
            }
            $stats = [
                'total_devices' => 0,
                'online_devices' => 0,
                'offline_devices' => 0,
                'today_heartbeats' => 0,
            ];

            try {
                $totalDevicesSql = "SELECT COUNT(DISTINCT board_code) FROM qiyun_device_heartbeats WHERE board_code IN ($placeholders)$keywordCondition";
                $totalStmt = $tappDb->prepare($totalDevicesSql);
                $totalStmt->execute($params);
                $stats['total_devices'] = (int)$totalStmt->fetchColumn();

                $latestSql = "SELECT h.board_code, h.is_online FROM qiyun_device_heartbeats h
                    INNER JOIN (
                        SELECT board_code, MAX(id) as max_id
                        FROM qiyun_device_heartbeats
                        WHERE board_code IN ($placeholders)$keywordCondition
                        GROUP BY board_code
                    ) l ON h.id = l.max_id";
                $latestStmt = $tappDb->prepare($latestSql);
                $latestStmt->execute($params);
                $latestRows = $latestStmt->fetchAll(PDO::FETCH_ASSOC);

                $onlineCount = 0;
                $offlineCount = 0;
                foreach ($latestRows as $row) {
                    if ($row['is_online'] == 1) {
                        $onlineCount++;
                    } else {
                        $offlineCount++;
                    }
                }
                $stats['online_devices'] = $onlineCount;
                $stats['offline_devices'] = $offlineCount;

                $todaySql = "SELECT COUNT(*) FROM qiyun_device_heartbeats WHERE board_code IN ($placeholders)$keywordCondition AND DATE(received_at) = CURDATE()";
                $todayStmt = $tappDb->prepare($todaySql);
                $todayStmt->execute($params);
                $stats['today_heartbeats'] = (int)$todayStmt->fetchColumn();
            } catch (Exception $e) {
            }

            $responseData = [
                'list' => $heartbeats,
                'total' => $total > 0 ? $total : count($heartbeats),
                'page' => $page,
                'per_page' => $perPage,
                'stats' => $stats,
            ];

            echo json_encode([
                'code' => 0,
                'message' => 'ok',
                'data' => $responseData,
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            $total = 0;
            $heartbeats = [];
            echo json_encode([
                'code' => 0,
                'message' => 'ok',
                'data' => [
                    'list' => [],
                    'total' => 0,
                    'page' => $page,
                    'per_page' => $perPage,
                    'stats' => [
                        'total_devices' => 0,
                        'online_devices' => 0,
                        'offline_devices' => 0,
                        'today_heartbeats' => 0,
                    ],
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

        // YTB 获取邀请码
    if ($path === 'ytb/user/invite-code' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        // 如果用户还没有邀请码，生成一个
        if (empty($user['invite_code'])) {
            $inviteCode = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $stmt = $db->prepare('UPDATE ytb_users SET invite_code = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$inviteCode, $user['id']]);
            $user['invite_code'] = $inviteCode;
        }
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => ['invite_code' => $user['invite_code']]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取团队成员
    if ($path === 'ytb/user/team' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $countStmt = $db->prepare('SELECT COUNT(*) FROM ytb_users WHERE parent_id = ?');
        $countStmt->execute([$user['id']]);
        $total = (int)$countStmt->fetchColumn();

        $listStmt = $db->prepare('SELECT id, nickname, avatar, phone, role, created_at FROM ytb_users WHERE parent_id = ? ORDER BY created_at DESC LIMIT ' . (int)$perPage . ' OFFSET ' . (int)$offset);
        $listStmt->execute([$user['id']]);
        $members = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => ['list' => $members, 'total' => $total, 'page' => $page, 'per_page' => $perPage]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取分佣记录
    if ($path === 'ytb/user/commissions' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        try {
            $countStmt = $db->prepare('SELECT COUNT(*) FROM ytb_commissions WHERE user_id = ?');
            $countStmt->execute([$user['id']]);
            $total = (int)$countStmt->fetchColumn();

            $listStmt = $db->prepare('SELECT * FROM ytb_commissions WHERE user_id = ? ORDER BY created_at DESC LIMIT ' . (int)$perPage . ' OFFSET ' . (int)$offset);
            $listStmt->execute([$user['id']]);
            $commissions = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $total = 0;
            $commissions = [];
        }

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => ['list' => $commissions, 'total' => $total, 'page' => $page, 'per_page' => $perPage]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取升级信息
    if ($path === 'ytb/upgrade/info' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'current_role' => $user['role'] ?? 'normal',
                'can_upgrade_scp' => ($user['role'] === 'normal'),
                'can_upgrade_team_cp' => ($user['role'] === 'scp'),
                'can_upgrade_boss_cp' => ($user['role'] === 'team_cp'),
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 提现信息
    if ($path === 'ytb/withdraw/info' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'available_balance' => $user['available_balance'] ?? '0.00',
                'frozen_balance' => $user['frozen_balance'] ?? '0.00',
                'min_withdraw' => '10.00',
                'fee_rate' => '0.006',
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 退出登录
    if ($path === 'ytb/auth/logout' && $method === 'POST') {
        $user = authenticateYtbUser($db, $token);
        if ($user) {
            $stmt = $db->prepare('UPDATE ytb_users SET api_token = NULL, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);
        }
        echo json_encode(['code' => 0, 'message' => '退出成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 获取海报列表（用户端）
    if ($path === 'ytb/posters' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $type = $_GET['type'] ?? '';
        try {
            $where = 'WHERE status = 1';
            $params = [];
            if ($type) {
                $where .= ' AND type = ?';
                $params[] = $type;
            }
            $stmt = $db->prepare("SELECT id, title, type, image_url, description, sort_order, created_at FROM ytb_posters $where ORDER BY sort_order ASC, created_at DESC");
            $stmt->execute($params);
            $posters = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($posters as &$p) {
                $p['id'] = (int)$p['id'];
                $p['sort_order'] = (int)$p['sort_order'];
            }
        } catch (Exception $e) {
            $posters = [];
        }
        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => ['items' => $posters, 'total' => count($posters)]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 验证邀请码
    if ($path === 'ytb/invite-code/validate' && $method === 'POST') {
        $inviteCode = $input['invite_code'] ?? '';
        if (empty($inviteCode) || strlen($inviteCode) !== 6) {
            echo json_encode(['code' => 400, 'message' => '请输入6位邀请码'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $stmt = $db->prepare('SELECT id, nickname, role FROM ytb_users WHERE invite_code = ? AND status = "active" LIMIT 1');
        $stmt->execute([$inviteCode]);
        $inviter = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$inviter) {
            echo json_encode(['code' => 404, 'message' => '邀请码无效'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $roleNames = ['normal' => '普通用户', 'scp' => 'SCP', 'team_cp' => 'VIPCP', 'boss_cp' => 'BossCP'];
        $inviter['role_name'] = $roleNames[$inviter['role']] ?? $inviter['role'];
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['inviter' => $inviter]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 用户绑定上级
    if ($path === 'ytb/user/bind-parent' && $method === 'POST') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (!empty($user['parent_id'])) {
            echo json_encode(['code' => 400, 'message' => '已有上级，无法重复绑定'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $inviteCode = $input['invite_code'] ?? '';
        $stmt = $db->prepare('SELECT id FROM ytb_users WHERE invite_code = ? AND status = "active" LIMIT 1');
        $stmt->execute([$inviteCode]);
        $parent = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$parent) {
            echo json_encode(['code' => 404, 'message' => '邀请码无效'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if ((int)$parent['id'] === (int)$user['id']) {
            echo json_encode(['code' => 400, 'message' => '不能绑定自己为上级'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $stmt = $db->prepare('UPDATE ytb_users SET parent_id = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$parent['id'], $user['id']]);
        // 更新上级的直推计数
        $stmt = $db->prepare('UPDATE ytb_users SET direct_user_count = direct_user_count + 1, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$parent['id']]);
        echo json_encode(['code' => 0, 'message' => '绑定成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 提现列表
    if ($path === 'ytb/withdraw/list' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;
        try {
            $countStmt = $db->prepare('SELECT COUNT(*) FROM ytb_withdrawals WHERE user_id = ?');
            $countStmt->execute([$user['id']]);
            $total = (int)$countStmt->fetchColumn();
            $listStmt = $db->prepare('SELECT * FROM ytb_withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT ' . (int)$perPage . ' OFFSET ' . (int)$offset);
            $listStmt->execute([$user['id']]);
            $list = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $total = 0;
            $list = [];
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['list' => $list, 'total' => $total]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 升级申请列表
    if ($path === 'ytb/upgrade/applications' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        try {
            $stmt = $db->prepare('SELECT * FROM ytb_upgrade_applications WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
            $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $list = [];
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['list' => $list]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 投资列表
    if ($path === 'ytb/investments' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        try {
            $stmt = $db->prepare('SELECT * FROM ytb_boss_investments WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
            $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $list = [];
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['list' => $list]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 投资统计
    if ($path === 'ytb/investments/stats' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['total_invested' => '0.00', 'total_return' => '0.00']], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 安装记录
    if ($path === 'ytb/installations' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        try {
            $stmt = $db->prepare('SELECT * FROM ytb_water_installations WHERE promoter_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
            $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $list = [];
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['list' => $list]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // YTB 安装统计
    if ($path === 'ytb/installations/stats' && $method === 'GET') {
        $user = authenticateYtbUser($db, $token);
        if (!$user) {
            http_response_code(401);
            echo json_encode(['code' => 401, 'message' => '未登录或登录已过期'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => ['total_installations' => 0, 'pending' => 0, 'completed' => 0]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ==================== 微信登录URL（YTB域名独立入口，后端网关转发）====================
    if (($path === 'ytb/auth/login-url' || $path === 'mobile/v1/wechat/login-url' || $path === 'mobile/v1/auth/wechat-url') && $method === 'GET') {
        $state = $_GET['state'] ?? $_GET['redirect_url'] ?? '/home';
        $redirectUri = $_GET['redirect_uri'] ?? (getCurrentOrigin() . '/app/#/wechat-callback');

        // 通过 pay.itapgo.com 代理OAuth（因为ytb域名不在第三方平台的授权域名内）
        $authUrl = 'https://pay.itapgo.com/ytb-oauth-init.php?redirect_url=' . urlencode($state);
        echo json_encode([
            'code' => 0,
            'message' => '获取微信登录地址成功',
            'data' => [
                'url' => $authUrl,
                'auth_url' => $authUrl,
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;

        // 明确关闭 pay 上游回退，避免 ytb 登录链路影响 pay 站点。
        http_response_code(503);
        echo json_encode([
            'code' => 503,
            'message' => 'YTB微信登录配置不完整，请联系管理员完成公众号配置',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // 微信登录回调（YTB域名独立入口，后端网关转发）
    if ($path === 'mobile/v1/auth/wechat-callback' && $method === 'POST') {
        $code = $input['code'] ?? '';
        if (!$code) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '缺少微信授权码']);
            exit;
        }

        // 使用第三方平台代授权OAuth回调
        $tappDb = getTappDB();
        if ($tappDb) {
            $config = getWechatAccountConfig($tappDb, 'wx644418e60bf1f7a2');
            $appId = $config['app_id'] ?? '';
            $appSecret = $config['app_secret'] ?? '';
            $componentConfig = getWechatComponentConfig($tappDb);
            $componentAppId = $componentConfig['component_appid'] ?? '';
            $componentAccessToken = $componentConfig['component_access_token'] ?? '';
            if (empty($componentAppId)) {
                $componentAppId = getWechatComponentAppIdFallback();
            }

            if ($appId) {
                $oauthToken = null;

                // 使用第三方平台组件代授权换取token
                if ($componentAppId && $componentAccessToken) {
                    $componentTokenUrl = 'https://api.weixin.qq.com/sns/oauth2/component/access_token?' . http_build_query([
                        'appid' => $appId,
                        'code' => $code,
                        'grant_type' => 'authorization_code',
                        'component_appid' => $componentAppId,
                        'component_access_token' => $componentAccessToken,
                    ]);
                    $oauthToken = wechatApiGetJson($componentTokenUrl);
                }

                // 回退直接公众号授权（需要app_secret）
                if ((!$oauthToken || (!empty($oauthToken['errcode']) && (int)$oauthToken['errcode'] !== 0)) && $appSecret) {
                    $tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?' . http_build_query([
                        'appid' => $appId,
                        'secret' => $appSecret,
                        'code' => $code,
                        'grant_type' => 'authorization_code',
                    ]);
                    $oauthToken = wechatApiGetJson($tokenUrl);
                }

                if ($oauthToken && !empty($oauthToken['errcode'])) {
                    http_response_code(400);
                    echo json_encode([
                        'code' => 400,
                        'message' => '微信授权码无效或已过期',
                        'wechat_error' => [
                            'errcode' => $oauthToken['errcode'],
                            'errmsg' => $oauthToken['errmsg'] ?? '',
                        ],
                    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    exit;
                }

                if ($oauthToken && empty($oauthToken['errcode']) && !empty($oauthToken['openid'])) {
                    $snsToken = $oauthToken['access_token'] ?? '';
                    $openid = $oauthToken['openid'] ?? '';

                    $wechatUser = [
                        'openid' => $openid,
                        'unionid' => $oauthToken['unionid'] ?? null,
                        'nickname' => '微信用户',
                        'headimgurl' => '',
                    ];

                    if ($snsToken && $openid) {
                        $userInfoUrl = 'https://api.weixin.qq.com/sns/userinfo?' . http_build_query([
                            'access_token' => $snsToken,
                            'openid' => $openid,
                            'lang' => 'zh_CN',
                        ]);
                        $userInfo = wechatApiGetJson($userInfoUrl);
                        if ($userInfo && empty($userInfo['errcode'])) {
                            $wechatUser = array_merge($wechatUser, $userInfo);
                        }
                    }

                    $user = saveYtbUserByWechat($db, $wechatUser);
                    if ($user && !empty($user['api_token'])) {
                        $payloadUser = [
                            'id' => (int)($user['id'] ?? 0),
                            'userId' => (int)($user['id'] ?? 0),
                            'nickname' => $user['nickname'] ?? '',
                            'name' => $user['nickname'] ?? '',
                            'phone' => $user['phone'] ?? '',
                            'wechat_nickname' => $wechatUser['nickname'] ?? ($user['nickname'] ?? ''),
                            'wechat_avatar' => $wechatUser['headimgurl'] ?? ($user['avatar'] ?? ''),
                            'avatar' => $wechatUser['headimgurl'] ?? ($user['avatar'] ?? ''),
                            'openid' => $wechatUser['openid'] ?? '',
                            'unionid' => $wechatUser['unionid'] ?? '',
                        ];

                        echo json_encode([
                            'code' => 0,
                            'message' => '微信登录成功',
                            'data' => [
                                'token' => $user['api_token'],
                                'user' => $payloadUser,
                                'openid' => $wechatUser['openid'] ?? '',
                                'unionid' => $wechatUser['unionid'] ?? '',
                                'nickname' => $wechatUser['nickname'] ?? '',
                                'headimgurl' => $wechatUser['headimgurl'] ?? '',
                            ],
                        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                        exit;
                    }
                }

                http_response_code(500);
                echo json_encode([
                    'code' => 500,
                    'message' => '微信登录服务异常，请稍后重试',
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                exit;
            }
        }

        // 明确关闭 pay 上游回退，避免 ytb 登录链路影响 pay 站点。
        http_response_code(503);
        echo json_encode([
            'code' => 503,
            'message' => 'YTB微信回调配置不完整，请联系管理员完成公众号配置',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    // 小程序微信登录
    if ($path === 'ytb/miniapp-login' && $method === 'POST') {
        $code = $input['code'] ?? '';
        if (!$code) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '缺少微信授权码']);
            exit;
        }

        $appId = 'wx5643a45f1e914b29';
        $appSecret = 'd43623e961bd5459f6b3eb1f5130cc30';
        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appId}&secret={$appSecret}&js_code={$code}&grant_type=authorization_code";
        
        $res = wechatApiGetJson($url);
        if (!$res || !empty($res['errcode']) || empty($res['openid'])) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '微信授权失败']);
            exit;
        }

        $wechatUser = [
            'openid' => $res['openid'],
            'unionid' => $res['unionid'] ?? null,
            'nickname' => '微信用户',
            'headimgurl' => '',
        ];

        $user = saveYtbUserByWechat($db, $wechatUser);
        if ($user && !empty($user['api_token'])) {
            $payloadUser = [
                'id' => (int)($user['id'] ?? 0),
                'userId' => (int)($user['id'] ?? 0),
                'nickname' => $user['nickname'] ?? '',
                'name' => $user['nickname'] ?? '',
                'phone' => $user['phone'] ?? '',
                'role' => $user['role'] ?? 'user',
                'avatar' => $user['avatar'] ?? '',
                'openid' => $user['openid'] ?? '',
                'unionid' => $user['unionid'] ?? '',
            ];

            echo json_encode([
                'code' => 0,
                'message' => '登录成功',
                'data' => [
                    'token' => $user['api_token'],
                    'user' => $payloadUser,
                ],
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }

        http_response_code(500);
        echo json_encode(['code' => 500, 'message' => '登录异常']);
        exit;
    }

    // 小程序手机号快捷登录
    if ($path === 'ytb/miniapp-phone-login' && $method === 'POST') {
        $code = $input['code'] ?? '';
        $encryptedData = $input['encryptedData'] ?? '';
        $iv = $input['iv'] ?? '';
        
        if (!$code || !$encryptedData || !$iv) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '缺少必要参数']);
            exit;
        }

        $appId = 'wx5643a45f1e914b29';
        $appSecret = 'd43623e961bd5459f6b3eb1f5130cc30';
        $url = "https://api.weixin.qq.com/sns/jscode2session?appid={$appId}&secret={$appSecret}&js_code={$code}&grant_type=authorization_code";
        
        $res = wechatApiGetJson($url);
        if (!$res || !empty($res['errcode']) || empty($res['session_key'])) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '获取会话密钥失败']);
            exit;
        }

        // 解密手机号
        $sessionKey = $res['session_key'];
        $aesKey = base64_decode($sessionKey);
        $aesIV = base64_decode($iv);
        $aesCipher = base64_decode($encryptedData);
        $decrypted = openssl_decrypt($aesCipher, 'AES-128-CBC', $aesKey, OPENSSL_RAW_DATA, $aesIV);
        $data = json_decode($decrypted, true);
        
        $phone = $data['phoneNumber'] ?? '';
        if (!$phone) {
            http_response_code(400);
            echo json_encode(['code' => 400, 'message' => '手机号解密失败']);
            exit;
        }

        $openid = $res['openid'];
        $unionid = $res['unionid'] ?? null;

        // 尝试通过手机号找回用户
        $stmt = $db->prepare('SELECT * FROM ytb_users WHERE phone = ? LIMIT 1');
        $stmt->execute([$phone]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // 在更新此用户的 openid 之前，检查是否有其他用户占用了此 openid
            $checkStmt = $db->prepare('SELECT id FROM ytb_users WHERE openid = ? AND id != ?');
            $checkStmt->execute([$openid, $user['id']]);
            $existingOpenidUser = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingOpenidUser) {
                // 删除那个刚创建或者无数据的占位新号，以确保能成功绑定到当前手机号的正式账号上
                $delStmt = $db->prepare('DELETE FROM ytb_users WHERE id = ?');
                $delStmt->execute([$existingOpenidUser['id']]);
            }

            // 更新该用户的 openid
            $updateStmt = $db->prepare('UPDATE ytb_users SET openid = ?, unionid = COALESCE(unionid, ?), updated_at = NOW() WHERE id = ?');
            $updateStmt->execute([$openid, $unionid, $user['id']]);
        } else {
            // 这个手机号完全没有记录，但是也要考虑到刚才他走普通的登录是否创建了一个只有 openid 的小号
            $chkStmt = $db->prepare('SELECT * FROM ytb_users WHERE openid = ? LIMIT 1');
            $chkStmt->execute([$openid]);
            $userByOpenid = $chkStmt->fetch(PDO::FETCH_ASSOC);

            if ($userByOpenid) {
                // 他已经有个小号了，直接给这个小号补充手机号即可
                $updateStmt = $db->prepare('UPDATE ytb_users SET phone = ?, unionid = COALESCE(unionid, ?), updated_at = NOW() WHERE id = ?');
                $updateStmt->execute([$phone, $unionid, $userByOpenid['id']]);
                $user = $userByOpenid;
                $user['phone'] = $phone;
            } else {
                // 创建全新用户
                $nickname = '用户' . substr($phone, -4);
                $insertStmt = $db->prepare(
                    "INSERT INTO ytb_users (openid, unionid, phone, nickname, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'normal', 'active', NOW(), NOW())"
                );
                $insertStmt->execute([$openid, $unionid, $phone, $nickname]);
                
                $stmt = $db->prepare('SELECT * FROM ytb_users WHERE id = ? LIMIT 1');
                $stmt->execute([$db->lastInsertId()]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
            }
        }

        // 生成Token
        $apiToken = bin2hex(random_bytes(24));
        $tokenExpiresAt = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);

        $tokenStmt = $db->prepare('UPDATE ytb_users SET api_token = ?, token_expires_at = ?, updated_at = NOW() WHERE id = ?');
        $tokenStmt->execute([$apiToken, $tokenExpiresAt, $user['id']]);

        $payloadUser = [
            'id' => (int)($user['id'] ?? 0),
            'userId' => (int)($user['id'] ?? 0),
            'nickname' => $user['nickname'] ?? '',
            'name' => $user['nickname'] ?? '',
            'phone' => $user['phone'] ?? '',
            'role' => $user['role'] ?? 'user',
            'avatar' => $user['avatar'] ?? '',
            'openid' => $openid,
        ];

        echo json_encode([
            'code' => 0,
            'message' => '手机号登录成功',
            'data' => [
                'token' => $apiToken,
                'user' => $payloadUser,
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    // 登录
    if ($path === 'admin/v1/auth/login' && $method === 'POST') {
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        
        if (!$username || !$password) {
            echo json_encode(['code' => 400, 'message' => '用户名和密码不能为空']);
            exit;
        }
        
        $stmt = $db->prepare("SELECT * FROM ytb_admin_users WHERE username = ? AND status = 'active'");
        $stmt->execute([$username]);
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin || !password_verify($password, $admin['password'])) {
            echo json_encode(['code' => 401, 'message' => '用户名或密码错误']);
            exit;
        }
        
        $tokenData = [
            'admin_id' => $admin['id'],
            'username' => $admin['username'],
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60),
        ];
        
        $token = base64_encode(json_encode($tokenData));
        
        echo json_encode([
            'code' => 0,
            'message' => '登录成功',
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 7 * 24 * 60 * 60,
                'user' => [
                    'id' => $admin['id'],
                    'username' => $admin['username'],
                    'name' => $admin['name'],
                    'email' => $admin['email'],
                    'avatar' => $admin['avatar'] ?? '',
                ]
            ]
        ]);
        exit;
    }

    // 菜单（不需要认证）
    if ($path === 'admin/v1/menus' && $method === 'GET') {
        $stmt = $db->query("SELECT * FROM ytb_admin_menus WHERE is_enabled = 1 ORDER BY sort_order ASC");
        $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $menuTree = buildMenuTree($menus);
        echo json_encode(['code' => 0, 'message' => '成功获取YTB菜单', 'data' => $menuTree]);
        exit;
    }

    // H5 App 底部导航菜单（公开API，无需认证）
    if ($path === 'app/public/tabbar' && $method === 'GET') {
        $defaultTabbar = [
            ['nav_id' => 'home', 'nav_name' => '首页', 'icon' => 'home-o', 'path' => '/', 'status' => 1, 'sort_order' => 10],
            ['nav_id' => 'device', 'nav_name' => '设备', 'icon' => 'cluster-o', 'path' => '/device', 'status' => 1, 'sort_order' => 20],
            ['nav_id' => 'water', 'nav_name' => '取水点', 'icon' => 'location-o', 'path' => '/water-point', 'status' => 1, 'sort_order' => 30],
            ['nav_id' => 'merchant', 'nav_name' => '商家', 'icon' => 'shop-o', 'path' => '/merchant', 'status' => 1, 'sort_order' => 40],
            ['nav_id' => 'forum', 'nav_name' => '社区', 'icon' => 'chat-o', 'path' => '/forum', 'status' => 1, 'sort_order' => 45],
            ['nav_id' => 'user', 'nav_name' => '我的', 'icon' => 'user-o', 'path' => '/user', 'status' => 1, 'sort_order' => 50],
        ];
        echo json_encode(['code' => 0, 'message' => 'success', 'data' => $defaultTabbar]);
        exit;
    }

    // H5 App 首页导航菜单（公开API，无需认证）
    if ($path === 'app/public/home/nav' && $method === 'GET') {
        $defaultHomeNav = [
            ['nav_id' => 'training', 'nav_name' => '培训', 'icon' => 'cluster-o', 'path' => '/training', 'status' => 1, 'sort_order' => 10],
            ['nav_id' => 'device', 'nav_name' => '设备', 'icon' => 'cluster-o', 'path' => '/device', 'status' => 1, 'sort_order' => 20],
            ['nav_id' => 'water', 'nav_name' => '取水点', 'icon' => 'location-o', 'path' => '/water-point', 'status' => 1, 'sort_order' => 30],
        ];
        echo json_encode(['code' => 0, 'message' => 'success', 'data' => $defaultHomeNav]);
        exit;
    }

    $publicPathPatterns = [
        '#^admin/v1/auth/login$#',
        '#^admin/v1/menus$#',
        '#^app/public/tabbar$#',
        '#^app/public/home/nav$#',
        '#^ytb/auth/login-url$#',
        '#^mobile/v1/wechat/login-url$#',
        '#^mobile/v1/auth/wechat-url$#',
        '#^mobile/v1/auth/wechat-callback$#',
        '#^Tapp/admin/api/wechat/jsconfig\.php$#',
        '#^ytb/miniapp-login$#',
        '#^ytb/miniapp-phone-login$#',
        '#^ytb/packages$#',
        '#^ytb/install/.*$#',
        '#^ytb/engineer/.*$#',
        '#^Tapp/admin/api/user/vip_list\.php$#',
    ];

    $isPublicPath = false;
    foreach ($publicPathPatterns as $pattern) {
        if (preg_match($pattern, $path)) {
            $isPublicPath = true;
            break;
        }
    }

    // 需要认证的接口
    if (!$isPublicPath && !$token) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '未提供认证令牌']);
        exit;
    }
    
    // 验证 token
    $tokenData = json_decode(base64_decode($token), true);
    if (!$isPublicPath && (!$tokenData || !isset($tokenData['admin_id']) || !isset($tokenData['exp']))) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '无效的令牌格式']);
        exit;
    }
    
    if (!$isPublicPath && $tokenData['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '令牌已过期']);
        exit;
    }
    
    $user = null;
    if (!$isPublicPath) {
        $stmt = $db->prepare("SELECT * FROM ytb_admin_users WHERE id = ? AND status = 'active'");
        $stmt->execute([$tokenData['admin_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    if (!$isPublicPath && !$user) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '用户不存在或已禁用']);
        exit;
    }
    
    // 获取当前用户信息
    if ($path === 'admin/v1/auth/me' && $method === 'GET') {
        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['name'],
                'email' => $user['email'],
                'avatar' => $user['avatar'] ?? '',
                'avatarText' => mb_substr($user['name'], 0, 1, 'utf-8'),
                'permissions' => json_decode($user['permissions'] ?? '[]', true) ?: [],
            ]
        ]);
        exit;
    }
    
    // 登出
    if ($path === 'admin/v1/auth/logout' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '退出成功']);
        exit;
    }

    // 通知未读数
    if ($path === 'admin/v1/notifications/unread-count' && $method === 'GET') {
        echo json_encode(['code' => 0, 'message' => '操作成功', 'data' => ['count' => 0]]);
        exit;
    }
    
    // 最新通知
    if ($path === 'admin/v1/notifications/latest' && $method === 'GET') {
        echo json_encode(['code' => 0, 'message' => '操作成功', 'data' => []]);
        exit;
    }
    
    // 仪表盘
    if ($path === 'admin/v1/dashboard/cockpit' && $method === 'GET') {
        // 获取今日开始时间（格式化为日期时间字符串）
        $todayStart = date('Y-m-d 00:00:00');

        // 查询总用户数和今日新增用户
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users");
        $totalUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as today FROM ytb_users WHERE created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        // 查询CP总数
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users WHERE role IN ('scp', 'team_cp', 'boss_cp')");
        $totalCp = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 查询总订单数和今日订单数（ytb_boss_investments）
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $totalOrders = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as today FROM ytb_boss_investments WHERE payment_status = 'paid' AND created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayOrders = (int)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        // 查询总营收和今日营收
        $stmt = $db->query("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $totalRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as today FROM ytb_boss_investments WHERE payment_status = 'paid' AND created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        $totalDevices = (int)$db->query("SELECT COUNT(*) FROM ytb_devices")->fetchColumn();
        // 通过心跳时间判断在线设备数（5分钟内有心跳视为在线）
        $onlineDevices = 0;
        try {
            $tappDb = getTappDB();
            $allDevNums = $db->query("SELECT device_number FROM ytb_devices")->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($allDevNums)) {
                $dp = implode(',', array_fill(0, count($allDevNums), '?'));
                $qdStmt = $tappDb->prepare("SELECT COUNT(*) FROM qiyun_devices WHERE board_code IN ($dp) AND last_sync_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
                $qdStmt->execute($allDevNums);
                $onlineDevices = (int)$qdStmt->fetchColumn();
            }
        } catch (Exception $e) {}
        $onlineRate = $totalDevices > 0 ? round($onlineDevices / $totalDevices * 100, 1) : 0;

        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => [
                'overview' => [
                    'users' => [
                        'total' => $totalUsers,
                        'today' => $todayUsers,
                        'vip_count' => $totalCp,
                        'vip_rate' => $totalUsers > 0 ? round($totalCp / $totalUsers * 100, 1) : 0
                    ],
                    'revenue' => [
                        'total' => $totalRevenue,
                        'today' => $todayRevenue
                    ],
                    'devices' => [
                        'total' => $totalDevices,
                        'active' => (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'installed'")->fetchColumn(),
                        'online' => $onlineDevices,
                        'online_rate' => $onlineRate
                    ]
                ],
                'orders' => [
                    'total' => $totalOrders,
                    'today' => $todayOrders
                ]
            ]
        ]);
        exit;
    }
    
    // 美团汇总
    if ($path === 'admin/v1/meituan/dashboard/summary' && $method === 'GET') {
        echo json_encode(['code' => 0, 'message' => '操作成功', 'data' => ['total' => 0, 'today' => 0]]);
        exit;
    }

    // YTB 仪表盘统计 (兼容两种路径)
    if (($path === 'admin/v1/ytb/dashboard/stats' || $path === 'admin/v1/dashboard/stats') && $method === 'GET') {
        $todayStart = date('Y-m-d 00:00:00');

        // 用户统计
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users");
        $totalUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as today FROM ytb_users WHERE created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        // 订单统计（ytb_boss_investments）
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $totalOrders = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as today FROM ytb_boss_investments WHERE payment_status = 'paid' AND created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayOrders = (int)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        // 营收统计
        $stmt = $db->query("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $totalRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as today FROM ytb_boss_investments WHERE payment_status = 'paid' AND created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => [
                'total_users' => $totalUsers,
                'today_users' => $todayUsers,
                'total_orders' => $totalOrders,
                'today_orders' => $todayOrders,
                'total_revenue' => $totalRevenue,
                'today_revenue' => $todayRevenue,
            ]
        ]);
        exit;
    }

    // YTB 仪表盘图表数据 (兼容两种路径)
    if (($path === 'admin/v1/ytb/dashboard/charts' || $path === 'admin/v1/dashboard/charts') && $method === 'GET') {
        // 返回最近7天的用户和订单数据
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $nextDate = date('Y-m-d', strtotime("-{$i} days") + 86400);

            $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_users WHERE created_at >= ? AND created_at < ?");
            $stmt->execute([$date, $nextDate]);
            $userCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

            $stmt = $db->prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as amount FROM ytb_boss_investments WHERE payment_status = 'paid' AND created_at >= ? AND created_at < ?");
            $stmt->execute([$date, $nextDate]);
            $orderRow = $stmt->fetch(PDO::FETCH_ASSOC);

            $chartData[] = [
                'date' => $date,
                'users' => $userCount,
                'orders' => (int)$orderRow['count'] ?? 0,
                'revenue' => (float)$orderRow['amount'] ?? 0,
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => $chartData
        ]);
        exit;
    }

    // YTB 升级申请列表
    if ($path === 'admin/v1/ytb/upgrades' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        // 关键词搜索（用户昵称、手机号、真实姓名）
        if (!empty($_GET['keyword'])) {
            $keyword = $_GET['keyword'];
            $where[] = "(u.nickname LIKE ? OR u.phone LIKE ? OR u.real_name LIKE ?)";
            $params[] = "%{$keyword}%";
            $params[] = "%{$keyword}%";
            $params[] = "%{$keyword}%";
        }

        // 目标角色筛选
        if (!empty($_GET['to_role'])) {
            $where[] = "a.to_role = ?";
            $params[] = $_GET['to_role'];
        }

        // 升级方式筛选
        if (!empty($_GET['upgrade_type'])) {
            $where[] = "a.upgrade_type = ?";
            $params[] = $_GET['upgrade_type'];
        }

        // 审批状态筛选
        if (!empty($_GET['admin_status'])) {
            $where[] = "a.admin_status = ?";
            $params[] = $_GET['admin_status'];
        }

        // 支付状态筛选
        if (!empty($_GET['payment_status'])) {
            $where[] = "a.payment_status = ?";
            $params[] = $_GET['payment_status'];
        }

        // 日期范围筛选
        if (!empty($_GET['start_date'])) {
            $where[] = "a.created_at >= ?";
            $params[] = $_GET['start_date'] . ' 00:00:00';
        }
        if (!empty($_GET['end_date'])) {
            $where[] = "a.created_at <= ?";
            $params[] = $_GET['end_date'] . ' 23:59:59';
        }

        $whereSql = implode(' AND ', $where);

        // 总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_upgrade_applications a LEFT JOIN ytb_users u ON a.user_id = u.id WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 排序
        $orderBy = $_GET['order_by'] ?? 'created_at';
        $orderDir = $_GET['order_dir'] ?? 'desc';
        $orderBy = in_array($orderBy, ['created_at', 'updated_at', 'amount']) ? $orderBy : 'created_at';
        $orderDir = in_array(strtolower($orderDir), ['asc', 'desc']) ? strtoupper($orderDir) : 'DESC';

        // 列表
        $listSql = "SELECT a.*,
            u.nickname as user_nickname, u.phone as user_phone, u.real_name as user_real_name, u.role as user_role, u.avatar as user_avatar,
            i.nickname as inviter_nickname, i.phone as inviter_phone
            FROM ytb_upgrade_applications a
            LEFT JOIN ytb_users u ON a.user_id = u.id
            LEFT JOIN ytb_users i ON a.inviter_id = i.id
            WHERE {$whereSql}
            ORDER BY a.{$orderBy} {$orderDir}
            LIMIT {$offset}, {$perPage}";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $applications = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 角色名称映射
        $roleNames = [
            'normal' => '普通用户',
            'scp' => 'CP伙伴',
            'team_cp' => 'CP会员',
            'boss_cp' => 'Boss合伙人',
        ];

        // 升级方式名称映射
        $typeNames = [
            'invite_code' => '邀请码升级',
            'direct_pay' => '直接付费升级',
            'achievement' => '业绩达标升级',
        ];

        // 支付方式名称映射
        $paymentNames = [
            'wechat' => '微信支付',
            'offline' => '线下支付',
            'free' => '免费',
        ];

        // 支付状态名称映射
        $paymentStatusNames = [
            'pending' => '待支付',
            'paid' => '已支付',
            'refunded' => '已退款',
        ];

        // 审批状态名称映射
        $adminStatusNames = [
            'pending' => '待审批',
            'approved' => '已通过',
            'rejected' => '已拒绝',
        ];

        // 处理数据
        $items = [];
        foreach ($applications as $app) {
            $items[] = [
                'id' => $app['id'],
                'user_id' => $app['user_id'],
                'from_role' => $app['from_role'],
                'to_role' => $app['to_role'],
                'upgrade_type' => $app['upgrade_type'],
                'invite_code_used' => $app['invite_code_used'],
                'inviter_id' => $app['inviter_id'],
                'amount' => $app['amount'],
                'payment_method' => $app['payment_method'],
                'payment_status' => $app['payment_status'],
                'order_no' => $app['order_no'],
                'transaction_id' => $app['transaction_id'],
                'admin_status' => $app['admin_status'],
                'admin_id' => $app['admin_id'],
                'admin_remark' => $app['admin_remark'],
                'achievement_count' => $app['achievement_count'],
                'paid_at' => $app['paid_at'],
                'approved_at' => $app['approved_at'],
                'created_at' => $app['created_at'],
                'updated_at' => $app['updated_at'],
                // 关联用户信息
                'user' => [
                    'id' => $app['user_id'],
                    'nickname' => $app['user_nickname'] ?? '',
                    'phone' => $app['user_phone'] ?? '',
                    'real_name' => $app['user_real_name'] ?? '',
                    'role' => $app['user_role'] ?? 'normal',
                    'avatar' => $app['user_avatar'] ?? '',
                ],
                // 邀请人信息
                'inviter' => $app['inviter_id'] ? [
                    'id' => $app['inviter_id'],
                    'nickname' => $app['inviter_nickname'] ?? '',
                    'phone' => $app['inviter_phone'] ?? '',
                ] : null,
                // 名称字段
                'upgrade_type_name' => $typeNames[$app['upgrade_type']] ?? '未知',
                'payment_method_name' => $paymentNames[$app['payment_method']] ?? '未知',
                'payment_status_name' => $paymentStatusNames[$app['payment_status']] ?? '未知',
                'admin_status_name' => $adminStatusNames[$app['admin_status']] ?? '未知',
                'to_role_name' => $roleNames[$app['to_role']] ?? '未知',
                'from_role_name' => $roleNames[$app['from_role']] ?? '未知',
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $items,
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]
        ]);
        exit;
    }

    // YTB 升级申请统计
    if ($path === 'admin/v1/ytb/upgrades/statistics' && $method === 'GET') {
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_upgrade_applications");
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE admin_status = 'pending'");
        $stmt->execute();
        $pending = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE admin_status = 'approved'");
        $stmt->execute();
        $approved = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE admin_status = 'rejected'");
        $stmt->execute();
        $rejected = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE to_role = 'scp'");
        $stmt->execute();
        $scpCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE to_role = 'team_cp'");
        $stmt->execute();
        $teamCpCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_upgrade_applications WHERE payment_status = 'paid'");
        $stmt->execute();
        $totalRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE DATE(created_at) = CURDATE()");
        $stmt->execute();
        $todayCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'total_applications' => $total,
                'pending_applications' => $pending,
                'approved_applications' => $approved,
                'rejected_applications' => $rejected,
                'scp_applications' => $scpCount,
                'team_cp_applications' => $teamCpCount,
                'total_revenue' => $totalRevenue,
                'today_applications' => $todayCount,
            ]
        ]);
        exit;
    }

    // YTB 分佣记录列表
    if ($path === 'admin/v1/ytb/commissions' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        // 关键词搜索（用户昵称、手机号）
        if (!empty($_GET['keyword'])) {
            $keyword = $_GET['keyword'];
            $where[] = "(u.nickname LIKE ? OR u.phone LIKE ?)";
            $params[] = "%{$keyword}%";
            $params[] = "%{$keyword}%";
        }

        // 分佣状态筛选
        if (!empty($_GET['status'])) {
            $where[] = "c.status = ?";
            $params[] = $_GET['status'];
        }

        // 分佣类型筛选
        if (!empty($_GET['commission_type'])) {
            $where[] = "c.commission_type = ?";
            $params[] = $_GET['commission_type'];
        }

        // 日期范围筛选
        if (!empty($_GET['start_date'])) {
            $where[] = "c.created_at >= ?";
            $params[] = $_GET['start_date'] . ' 00:00:00';
        }
        if (!empty($_GET['end_date'])) {
            $where[] = "c.created_at <= ?";
            $params[] = $_GET['end_date'] . ' 23:59:59';
        }

        $whereSql = implode(' AND ', $where);

        // 总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_commissions c LEFT JOIN ytb_users u ON c.user_id = u.id WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 排序
        $orderBy = $_GET['order_by'] ?? 'created_at';
        $orderDir = $_GET['order_dir'] ?? 'desc';
        $orderBy = in_array($orderBy, ['created_at', 'updated_at', 'amount']) ? $orderBy : 'created_at';
        $orderDir = in_array(strtolower($orderDir), ['asc', 'desc']) ? strtoupper($orderDir) : 'DESC';

        // 列表
        $listSql = "SELECT c.*,
            u.nickname as user_nickname, u.phone as user_phone, u.real_name as user_real_name,
            f.nickname as from_user_nickname, f.phone as from_user_phone
            FROM ytb_commissions c
            LEFT JOIN ytb_users u ON c.user_id = u.id
            LEFT JOIN ytb_users f ON c.from_user_id = f.id
            WHERE {$whereSql}
            ORDER BY c.{$orderBy} {$orderDir}
            LIMIT {$offset}, {$perPage}";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $commissions = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 分佣类型名称映射
        $typeNames = [
            'upgrade' => '升级分佣',
            'install' => '装机分佣',
            'referral' => '推荐分佣',
            'boss_refund' => 'Boss退款分佣',
        ];

        // 状态名称映射
        $statusNames = [
            'pending' => '待结算',
            'settled' => '已结算',
            'cancelled' => '已取消',
        ];

        // 处理数据
        $items = [];
        foreach ($commissions as $com) {
            $items[] = [
                'id' => $com['id'],
                'user_id' => $com['user_id'],
                'from_user_id' => $com['from_user_id'],
                'application_id' => $com['application_id'],
                'installation_id' => $com['installation_id'],
                'investment_id' => $com['investment_id'],
                'amount' => $com['amount'],
                'commission_type' => $com['commission_type'],
                'status' => $com['status'],
                'remark' => $com['remark'],
                'settled_at' => $com['settled_at'],
                'created_at' => $com['created_at'],
                'updated_at' => $com['updated_at'],
                // 用户信息
                'user' => [
                    'id' => $com['user_id'],
                    'nickname' => $com['user_nickname'] ?? '',
                    'phone' => $com['user_phone'] ?? '',
                    'real_name' => $com['user_real_name'] ?? '',
                ],
                // 来源用户信息
                'from_user' => [
                    'id' => $com['from_user_id'],
                    'nickname' => $com['from_user_nickname'] ?? '',
                    'phone' => $com['from_user_phone'] ?? '',
                ],
                // 名称字段
                'commission_type_name' => $typeNames[$com['commission_type']] ?? '未知',
                'status_name' => $statusNames[$com['status']] ?? '未知',
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $items,
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]
        ]);
        exit;
    }

    // YTB 分佣统计
    if ($path === 'admin/v1/ytb/commissions/statistics' && $method === 'GET') {
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_commissions");
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_commissions WHERE status = 'pending'");
        $stmt->execute();
        $pending = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_commissions WHERE status = 'settled'");
        $stmt->execute();
        $settled = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_commissions");
        $stmt->execute();
        $totalAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_commissions WHERE status = 'settled'");
        $stmt->execute();
        $settledAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_commissions WHERE status = 'pending'");
        $stmt->execute();
        $pendingAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'total_commissions' => $total,
                'pending_commissions' => $pending,
                'settled_commissions' => $settled,
                'total_amount' => $totalAmount,
                'settled_amount' => $settledAmount,
                'pending_amount' => $pendingAmount,
            ]
        ]);
        exit;
    }

    // YTB 分佣排行榜
    if ($path === 'admin/v1/ytb/commissions/ranking' && $method === 'GET') {
        $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));

        $listSql = "SELECT c.user_id, u.nickname, u.phone,
            COUNT(*) as commission_count,
            COALESCE(SUM(c.amount), 0) as total_amount,
            COALESCE(SUM(CASE WHEN c.status = 'settled' THEN c.amount ELSE 0 END), 0) as settled_amount,
            COALESCE(SUM(CASE WHEN c.status = 'pending' THEN c.amount ELSE 0 END), 0) as pending_amount
            FROM ytb_commissions c
            LEFT JOIN ytb_users u ON c.user_id = u.id
            GROUP BY c.user_id, u.nickname, u.phone
            ORDER BY total_amount DESC
            LIMIT {$limit}";
        $listStmt = $db->query($listSql);
        $ranking = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($ranking as $index => $item) {
            $items[] = [
                'rank' => $index + 1,
                'user_id' => $item['user_id'],
                'nickname' => $item['nickname'] ?? '',
                'phone' => $item['phone'] ?? '',
                'commission_count' => (int)$item['commission_count'],
                'total_amount' => (float)$item['total_amount'],
                'settled_amount' => (float)$item['settled_amount'],
                'pending_amount' => (float)$item['pending_amount'],
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $items
        ]);
        exit;
    }

    // YTB BossCP投资列表
    if ($path === 'admin/v1/ytb/investments' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $perPage;

        $where = ['1=1'];
        $params = [];

        // 关键词搜索（用户昵称、手机号、订单号）
        if (!empty($_GET['keyword'])) {
            $keyword = $_GET['keyword'];
            $where[] = "(u.nickname LIKE ? OR u.phone LIKE ? OR i.order_no LIKE ?)";
            $params[] = "%{$keyword}%";
            $params[] = "%{$keyword}%";
            $params[] = "%{$keyword}%";
        }

        // 支付状态筛选
        if (!empty($_GET['payment_status'])) {
            $where[] = "i.payment_status = ?";
            $params[] = $_GET['payment_status'];
        }

        // 状态筛选
        if (!empty($_GET['status'])) {
            $where[] = "i.status = ?";
            $params[] = $_GET['status'];
        }

        // 日期范围筛选
        if (!empty($_GET['start_date'])) {
            $where[] = "i.created_at >= ?";
            $params[] = $_GET['start_date'] . ' 00:00:00';
        }
        if (!empty($_GET['end_date'])) {
            $where[] = "i.created_at <= ?";
            $params[] = $_GET['end_date'] . ' 23:59:59';
        }

        $whereSql = implode(' AND ', $where);

        // 总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_boss_investments i LEFT JOIN ytb_users u ON i.user_id = u.id WHERE {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 排序
        $orderBy = $_GET['order_by'] ?? 'created_at';
        $orderDir = $_GET['order_dir'] ?? 'desc';
        $orderBy = in_array($orderBy, ['created_at', 'updated_at', 'amount']) ? $orderBy : 'created_at';
        $orderDir = in_array(strtolower($orderDir), ['asc', 'desc']) ? strtoupper($orderDir) : 'DESC';

        // 列表
        $listSql = "SELECT i.*,
            u.nickname as user_nickname, u.phone as user_phone, u.real_name as user_real_name,
            r.nickname as referrer_nickname, r.phone as referrer_phone
            FROM ytb_boss_investments i
            LEFT JOIN ytb_users u ON i.user_id = u.id
            LEFT JOIN ytb_users r ON i.referrer_id = r.id
            WHERE {$whereSql}
            ORDER BY i.{$orderBy} {$orderDir}
            LIMIT {$offset}, {$perPage}";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $investments = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 状态名称映射
        $statusNames = [
            'active' => '进行中',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];

        // 支付状态名称映射
        $paymentStatusNames = [
            'pending' => '待支付',
            'paid' => '已支付',
            'refunded' => '已退款',
        ];

        // 支付方式名称映射
        $paymentMethodNames = [
            'wechat' => '微信支付',
            'offline' => '线下支付',
        ];

        // 处理数据
        $items = [];
        foreach ($investments as $inv) {
            $items[] = [
                'id' => $inv['id'],
                'user_id' => $inv['user_id'],
                'amount' => $inv['amount'],
                'quota' => $inv['quota'],
                'remaining_quota' => $inv['remaining_quota'],
                'refunded_amount' => $inv['refunded_amount'],
                'status' => $inv['status'],
                'referrer_reward_paid' => $inv['referrer_reward_paid'],
                'referrer_reward_amount' => $inv['referrer_reward_amount'],
                'referrer_id' => $inv['referrer_id'],
                'order_no' => $inv['order_no'],
                'transaction_id' => $inv['transaction_id'],
                'payment_method' => $inv['payment_method'],
                'payment_status' => $inv['payment_status'],
                'paid_at' => $inv['paid_at'],
                'completed_at' => $inv['completed_at'],
                'created_at' => $inv['created_at'],
                'updated_at' => $inv['updated_at'],
                // 用户信息
                'user' => [
                    'id' => $inv['user_id'],
                    'nickname' => $inv['user_nickname'] ?? '',
                    'phone' => $inv['user_phone'] ?? '',
                    'real_name' => $inv['user_real_name'] ?? '',
                ],
                // 推荐人信息
                'referrer' => $inv['referrer_id'] ? [
                    'id' => $inv['referrer_id'],
                    'nickname' => $inv['referrer_nickname'] ?? '',
                    'phone' => $inv['referrer_phone'] ?? '',
                ] : null,
                // 名称字段
                'status_name' => $statusNames[$inv['status']] ?? '未知',
                'payment_status_name' => $paymentStatusNames[$inv['payment_status']] ?? '未知',
                'payment_method_name' => $paymentMethodNames[$inv['payment_method']] ?? '未知',
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'items' => $items,
                'total' => $total,
                'current_page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage),
            ]
        ]);
        exit;
    }

    // YTB BossCP投资统计
    if ($path === 'admin/v1/ytb/investments/statistics' && $method === 'GET') {
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_boss_investments");
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $stmt->execute();
        $paidCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_boss_investments WHERE payment_status = 'pending'");
        $stmt->execute();
        $pendingCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_boss_investments WHERE status = 'active'");
        $stmt->execute();
        $activeCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_boss_investments WHERE status = 'completed'");
        $stmt->execute();
        $completedCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $stmt->execute();
        $totalAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid' AND DATE(created_at) = CURDATE()");
        $stmt->execute();
        $todayAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'total_investments' => $total,
                'paid_investments' => $paidCount,
                'pending_investments' => $pendingCount,
                'active_investments' => $activeCount,
                'completed_investments' => $completedCount,
                'total_amount' => $totalAmount,
                'today_amount' => $todayAmount,
            ]
        ]);
        exit;
    }

    // YTB 综合统计数据
    if ($path === 'admin/v1/ytb/statistics' && $method === 'GET') {
        // 用户统计
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users");
        $totalUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users WHERE role = 'scp'");
        $scpUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users WHERE role IN ('team_cp', 'boss_cp')");
        $teamCpUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users WHERE role IN ('scp', 'team_cp', 'boss_cp')");
        $vipUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 升级统计
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_upgrade_applications");
        $totalUpgrades = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE admin_status = 'pending'");
        $stmt->execute();
        $pendingUpgrades = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

        // 收入统计
        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_upgrade_applications WHERE payment_status = 'paid'");
        $stmt->execute();
        $upgradeRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid'");
        $stmt->execute();
        $investmentRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $totalRevenue = $upgradeRevenue + $investmentRevenue;

        // 本月收入
        $monthStart = date('Y-m-01 00:00:00');
        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_upgrade_applications WHERE payment_status = 'paid' AND paid_at >= ?");
        $stmt->execute([$monthStart]);
        $monthUpgradeRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_boss_investments WHERE payment_status = 'paid' AND paid_at >= ?");
        $stmt->execute([$monthStart]);
        $monthInvestmentRevenue = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $totalMonthRevenue = $monthUpgradeRevenue + $monthInvestmentRevenue;

        // 投资统计
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_boss_investments");
        $totalInvestments = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 分佣统计
        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_commissions WHERE status = 'settled'");
        $stmt->execute();
        $settledCommission = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as total FROM ytb_commissions WHERE status = 'pending'");
        $stmt->execute();
        $pendingCommission = (float)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => [
                'users' => [
                    'total' => $totalUsers,
                    'vip' => $vipUsers,
                    'scp' => $scpUsers,
                    'team_cp' => $teamCpUsers,
                ],
                'revenue' => [
                    'total' => $totalRevenue,
                    'this_month' => $totalMonthRevenue,
                    'upgrade' => $upgradeRevenue,
                    'investment' => $investmentRevenue,
                ],
                'commissions' => [
                    'settled' => $settledCommission,
                    'pending' => $pendingCommission,
                ],
                'upgrades' => [
                    'total' => $totalUpgrades,
                    'pending' => $pendingUpgrades,
                ],
                'investments' => [
                    'total' => $totalInvestments,
                ],
            ]
        ]);
        exit;
    }

    // YTB 用户增长趋势
    if ($path === 'admin/v1/ytb/statistics/user-trend' && $method === 'GET') {
        $days = min(90, max(1, intval($_GET['days'] ?? 30)));

        $chartData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $nextDate = date('Y-m-d', strtotime("-{$i} days") + 86400);

            $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_users WHERE created_at >= ? AND created_at < ?");
            $stmt->execute([$date, $nextDate]);
            $userCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

            $chartData[] = [
                'date' => $date,
                'users' => $userCount,
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $chartData
        ]);
        exit;
    }

    // YTB 收入趋势
    if ($path === 'admin/v1/ytb/statistics/revenue-trend' && $method === 'GET') {
        $days = min(90, max(1, intval($_GET['days'] ?? 30)));

        $chartData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $nextDate = date('Y-m-d', strtotime("-{$i} days") + 86400);

            // 升级收入
            $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as amount FROM ytb_upgrade_applications WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at < ?");
            $stmt->execute([$date, $nextDate]);
            $upgradeAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['amount'] ?? 0;

            // 投资收入
            $stmt = $db->prepare("SELECT COALESCE(SUM(amount), 0) as amount FROM ytb_boss_investments WHERE payment_status = 'paid' AND paid_at >= ? AND paid_at < ?");
            $stmt->execute([$date, $nextDate]);
            $investmentAmount = (float)$stmt->fetch(PDO::FETCH_ASSOC)['amount'] ?? 0;

            $chartData[] = [
                'date' => $date,
                'upgrade' => $upgradeAmount,
                'investment' => $investmentAmount,
                'total' => $upgradeAmount + $investmentAmount,
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $chartData
        ]);
        exit;
    }

    // YTB 升级趋势
    if ($path === 'admin/v1/ytb/statistics/upgrade-trend' && $method === 'GET') {
        $days = min(90, max(1, intval($_GET['days'] ?? 30)));

        $chartData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-{$i} days"));
            $nextDate = date('Y-m-d', strtotime("-{$i} days") + 86400);

            $stmt = $db->prepare("SELECT COUNT(*) as count FROM ytb_upgrade_applications WHERE created_at >= ? AND created_at < ?");
            $stmt->execute([$date, $nextDate]);
            $upgradeCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['count'] ?? 0;

            $chartData[] = [
                'date' => $date,
                'upgrades' => $upgradeCount,
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $chartData
        ]);
        exit;
    }

    // YTB TeamCP排行榜（按分佣金额排序，显示所有有分佣的用户）
    if ($path === 'admin/v1/ytb/statistics/team-cp-ranking' && $method === 'GET') {
        $limit = min(50, max(1, intval($_GET['limit'] ?? 10)));

        // 查询所有有分佣记录的用户，按分佣金额排序
        $listSql = "SELECT u.id, u.nickname, u.phone, u.avatar, u.role, u.created_at,
            (SELECT COUNT(*) FROM ytb_users WHERE parent_id = u.id AND role = 'scp') as direct_scp_count,
            COALESCE((SELECT SUM(c.amount) FROM ytb_commissions c WHERE c.user_id = u.id AND c.status = 'settled'), 0) as total_commission
            FROM ytb_users u
            WHERE u.id IN (SELECT DISTINCT user_id FROM ytb_commissions)
            ORDER BY total_commission DESC
            LIMIT {$limit}";
        $listStmt = $db->query($listSql);
        $ranking = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($ranking as $index => $item) {
            $items[] = [
                'rank' => $index + 1,
                'user_id' => $item['id'],
                'nickname' => $item['nickname'] ?? '',
                'phone' => $item['phone'] ?? '',
                'avatar' => $item['avatar'] ?? '',
                'role' => $item['role'] ?? 'scp',
                'role_name' => $item['role'] === 'team_cp' ? 'CP会员' : ($item['role'] === 'boss_cp' ? 'Boss合伙人' : 'CP伙伴'),
                'direct_scp_count' => (int)$item['direct_scp_count'],
                'total_commission' => (float)$item['total_commission'],
                'created_at' => $item['created_at'],
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $items
        ]);
        exit;
    }

    // YTB SCP排行榜
    if ($path === 'admin/v1/ytb/statistics/scp-ranking' && $method === 'GET') {
        $limit = min(50, max(1, intval($_GET['limit'] ?? 10)));

        $listSql = "SELECT u.id, u.nickname, u.phone, u.avatar, u.role, u.created_at,
            (SELECT COUNT(*) FROM ytb_users WHERE parent_id = u.id AND role = 'scp') as direct_scp_count,
            COALESCE((SELECT SUM(c.amount) FROM ytb_commissions c WHERE c.user_id = u.id AND c.status = 'settled'), 0) as total_commission
            FROM ytb_users u
            WHERE u.role = 'scp'
            ORDER BY direct_scp_count DESC
            LIMIT {$limit}";
        $listStmt = $db->query($listSql);
        $ranking = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($ranking as $index => $item) {
            $items[] = [
                'rank' => $index + 1,
                'user_id' => $item['id'],
                'nickname' => $item['nickname'] ?? '',
                'phone' => $item['phone'] ?? '',
                'avatar' => $item['avatar'] ?? '',
                'role' => $item['role'] ?? 'scp',
                'role_name' => 'CP伙伴',
                'direct_scp_count' => (int)$item['direct_scp_count'],
                'total_commission' => (float)$item['total_commission'],
                'created_at' => $item['created_at'],
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $items
        ]);
        exit;
    }

    // YTB 配置
    if ($path === 'admin/v1/ytb/configs' && $method === 'GET') {
        $stmt = $db->query("SELECT `key`, value FROM ytb_configs");
        $configs = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $configs[$row['key']] = $row['value'];
        }

        echo json_encode([
            'code' => 0,
            'message' => '获取成功',
            'data' => $configs
        ]);
        exit;
    }

    // ===== 管理后台 - 海报管理 CRUD =====

    // 获取海报列表
    if (($path === 'admin/api/v1/posters' || $path === 'admin/v1/ytb/posters') && $method === 'GET') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;
        $search = trim($_GET['search'] ?? '');
        $status = $_GET['status'] ?? '';
        $type = $_GET['type'] ?? '';

        $where = [];
        $params = [];
        if ($search) {
            $where[] = 'title LIKE ?';
            $params[] = "%{$search}%";
        }
        if ($status !== '') {
            $where[] = 'status = ?';
            $params[] = (int)$status;
        }
        if ($type) {
            $where[] = 'type = ?';
            $params[] = $type;
        }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM ytb_posters $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listStmt = $db->prepare("SELECT * FROM ytb_posters $whereClause ORDER BY sort_order ASC, created_at DESC LIMIT $offset, $perPage");
        $listStmt->execute($params);
        $list = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 格式化
        foreach ($list as &$item) {
            $item['id'] = (int)$item['id'];
            $item['sort_order'] = (int)$item['sort_order'];
            $item['status'] = (int)$item['status'];
        }

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'list' => $list,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'last_page' => ceil($total / $perPage)
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 获取海报详情
    if (preg_match('#^(admin/api/v1|admin/v1/ytb)/posters/(\d+)$#', $path, $matches) && $method === 'GET') {
        $posterId = (int)$matches[2];
        $stmt = $db->prepare("SELECT * FROM ytb_posters WHERE id = ?");
        $stmt->execute([$posterId]);
        $poster = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$poster) {
            echo json_encode(['code' => 404, 'message' => '海报不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $poster['id'] = (int)$poster['id'];
        $poster['sort_order'] = (int)$poster['sort_order'];
        $poster['status'] = (int)$poster['status'];
        echo json_encode(['code' => 0, 'message' => 'ok', 'data' => $poster], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 创建海报
    if (($path === 'admin/api/v1/posters' || $path === 'admin/v1/ytb/posters') && $method === 'POST') {
        $title = trim($input['title'] ?? '');
        $type = trim($input['type'] ?? 'promotion');
        $imageUrl = trim($input['image_url'] ?? '');
        $description = trim($input['description'] ?? '');
        $sortOrder = (int)($input['sort_order'] ?? 0);
        $status = (int)($input['status'] ?? 1);

        if (!$title) {
            echo json_encode(['code' => 400, 'message' => '标题不能为空'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (!$imageUrl) {
            echo json_encode(['code' => 400, 'message' => '图片不能为空'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $db->prepare("INSERT INTO ytb_posters (title, type, image_url, description, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())");
        $stmt->execute([$title, $type, $imageUrl, $description, $sortOrder, $status]);
        $newId = $db->lastInsertId();

        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => (int)$newId]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 更新海报
    if (preg_match('#^(admin/api/v1|admin/v1/ytb)/posters/(\d+)$#', $path, $matches) && $method === 'PUT') {
        $posterId = (int)$matches[2];
        $fields = [];
        $params = [];
        foreach (['title', 'type', 'image_url', 'description'] as $f) {
            if (isset($input[$f])) { $fields[] = "$f = ?"; $params[] = $input[$f]; }
        }
        if (isset($input['sort_order'])) { $fields[] = "sort_order = ?"; $params[] = (int)$input['sort_order']; }
        if (isset($input['status'])) { $fields[] = "status = ?"; $params[] = (int)$input['status']; }

        if (empty($fields)) {
            echo json_encode(['code' => 400, 'message' => '没有要更新的字段'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $fields[] = "updated_at = NOW()";
        $params[] = $posterId;
        $stmt = $db->prepare("UPDATE ytb_posters SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);

        echo json_encode(['code' => 0, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 删除海报
    if (preg_match('#^(admin/api/v1|admin/v1/ytb)/posters/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $posterId = (int)$matches[2];
        $stmt = $db->prepare("DELETE FROM ytb_posters WHERE id = ?");
        $stmt->execute([$posterId]);
        echo json_encode(['code' => 0, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 切换海报状态
    if (preg_match('#^(admin/api/v1|admin/v1/ytb)/posters/(\d+)/status$#', $path, $matches) && $method === 'PATCH') {
        $posterId = (int)$matches[2];
        $status = (int)($input['status'] ?? 0);
        $stmt = $db->prepare("UPDATE ytb_posters SET status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $posterId]);
        echo json_encode(['code' => 0, 'message' => '状态更新成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 批量删除海报
    if (($path === 'admin/api/v1/posters/batch' || $path === 'admin/v1/ytb/posters/batch') && $method === 'DELETE') {
        $ids = $input['ids'] ?? [];
        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare("DELETE FROM ytb_posters WHERE id IN ($placeholders)");
            $stmt->execute(array_values($ids));
        }
        echo json_encode(['code' => 0, 'message' => '批量删除成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 批量更新状态
    if (($path === 'admin/api/v1/posters/batch/status' || $path === 'admin/v1/ytb/posters/batch/status') && $method === 'PATCH') {
        $ids = $input['ids'] ?? [];
        $status = (int)($input['status'] ?? 0);
        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $params = array_merge([$status], array_values($ids));
            $stmt = $db->prepare("UPDATE ytb_posters SET status = ?, updated_at = NOW() WHERE id IN ($placeholders)");
            $stmt->execute($params);
        }
        echo json_encode(['code' => 0, 'message' => '批量更新成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // CP会员列表 (vip_list.php) - 兼容旧API路径
    if ($path === 'Tapp/admin/api/user/vip_list.php' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';

        // 演示数据
        $demoUsers = [
            [
                'id' => 1,
                'name' => '张三',
                'nickname' => '张三微信',
                'mobile' => '13800138001',
                'phone' => '13800138001',
                'avatar' => '',
                'wechat_avatar' => '',
                'balance' => '1000.50',
                'referrer_id' => 0,
                'referrer_name' => '',
                'role' => 'team_cp',
                'cp_level' => 'VIPCP',
                'is_vip' => 1,
                'is_vip_paid' => 1,
                'direct_vip_count' => 2,
                'team_vip_count' => 5,
                'month_direct_vip' => 1,
                'month_team_vip' => 2,
                'last_month_direct_vip' => 1,
                'last_month_team_vip' => 3,
                'vip_at' => '2026-01-15 10:30:00',
                'vip_paid_at' => '2026-01-15 10:30:00',
                'created_at' => '2026-01-15 10:30:00',
            ],
            [
                'id' => 2,
                'name' => '李四',
                'nickname' => '李四微信',
                'mobile' => '13800138002',
                'phone' => '13800138002',
                'avatar' => '',
                'wechat_avatar' => '',
                'balance' => '2500.00',
                'referrer_id' => 1,
                'referrer_name' => '张三',
                'role' => 'boss_cp',
                'cp_level' => 'BossCP',
                'is_vip' => 1,
                'is_vip_paid' => 1,
                'direct_vip_count' => 3,
                'team_vip_count' => 8,
                'month_direct_vip' => 2,
                'month_team_vip' => 4,
                'last_month_direct_vip' => 1,
                'last_month_team_vip' => 4,
                'vip_at' => '2026-02-20 14:20:00',
                'vip_paid_at' => '2026-02-20 14:20:00',
                'created_at' => '2026-02-20 14:20:00',
            ],
        ];

        $filtered = $demoUsers;
        if (!empty($search)) {
            $filtered = array_filter($demoUsers, function($u) use ($search) {
                return stripos($u['name'], $search) !== false
                    || stripos($u['nickname'], $search) !== false
                    || stripos($u['mobile'], $search) !== false
                    || stripos((string)$u['id'], $search) !== false;
            });
        }

        $total = count($filtered);
        $list = array_slice(array_values($filtered), $offset, $limit);

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'list' => $list,
                'total' => $total,
                'stats' => [
                    'total_vip' => count($demoUsers),
                    'month_new_vip' => 1,
                    'last_month_new_vip' => 1,
                    'total_balance' => '3500.50',
                ]
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 分支机构选项列表
    if ($path === 'admin/v1/branch-organizations/options' && $method === 'GET') {
        // 表可能不存在，返回空数组
        try {
            $stmt = $db->query("SELECT id, name, code FROM ytb_branch_organizations WHERE status = 'active' ORDER BY id ASC");
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $items = [];
        }
        echo json_encode(['code' => 0, 'message' => '操作成功', 'data' => $items]);
        exit;
    }

    // APP用户列表
    if ($path === 'admin/v1/app-users' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;

        $where = [];
        $params = [];

        if (!empty($_GET['keyword'])) {
            $where[] = "(real_name LIKE ? OR nickname LIKE ? OR phone LIKE ?)";
            $params[] = "%{$_GET['keyword']}%";
            $params[] = "%{$_GET['keyword']}%";
            $params[] = "%{$_GET['keyword']}%";
        }
        if (!empty($_GET['role'])) {
            $where[] = "role = ?";
            $params[] = $_GET['role'];
        }
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['date_start'])) {
            $where[] = "created_at >= ?";
            $params[] = $_GET['date_start'] . ' 00:00:00';
        }
        if (!empty($_GET['date_end'])) {
            $where[] = "created_at <= ?";
            $params[] = $_GET['date_end'] . ' 23:59:59';
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // 总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_users {$whereSql}";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 列表
        $listSql = "SELECT * FROM ytb_users {$whereSql} ORDER BY created_at DESC LIMIT {$offset}, {$perPage}";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $users = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 获取推荐人信息
        $parentIds = array_filter(array_column($users, 'parent_id'));
        $referrers = [];
        if (!empty($parentIds)) {
            $placeholders = implode(',', array_fill(0, count($parentIds), '?'));
            $refStmt = $db->prepare("SELECT id, real_name, nickname FROM ytb_users WHERE id IN ({$placeholders})");
            $refStmt->execute(array_values($parentIds));
            foreach ($refStmt->fetchAll(PDO::FETCH_ASSOC) as $ref) {
                $referrers[$ref['id']] = $ref;
            }
        }

        // 处理用户数据
        $processedUsers = [];
        foreach ($users as $u) {
            $parentId = $u['parent_id'] ?? 0;
            $referrerName = null;
            if ($parentId && isset($referrers[$parentId])) {
                $referrerName = $referrers[$parentId]['real_name'] ?: $referrers[$parentId]['nickname'] ?: '未知';
            }

            // 角色标签
            $roleNames = [];
            if ($u['role'] === 'normal') $roleNames[] = '普通用户';
            elseif ($u['role'] === 'scp') $roleNames[] = 'CP伙伴';
            elseif ($u['role'] === 'team_cp') $roleNames[] = 'CP会员';
            elseif ($u['role'] === 'boss_cp') $roleNames[] = 'CP会员';

            $processedUsers[] = [
                'id' => $u['id'],
                'name' => $u['real_name'] ?: '未设置',
                'nickname' => $u['nickname'] ?: '',
                'wechat_nickname' => $u['nickname'] ?: '',
                'phone' => $u['phone'] ?: '',
                'avatar' => $u['avatar'] ?: '',
                'wechat_avatar' => $u['avatar'] ?: '',
                'display_avatar' => $u['avatar'] ?: '',
                'status' => $u['status'] ?: 'active',
                'role' => $u['role'] ?: 'normal',
                'role_names' => $roleNames,
                'referrer_id' => $parentId,
                'referrer_name' => $referrerName,
                'referrer_name' => $referrerName,
                'is_vip' => ($u['role'] === 'team_cp' || $u['role'] === 'boss_cp') ? 1 : 0,
                'vip_at' => $u['role_upgraded_at'] ?? '',
                'created_at' => $u['created_at'] ?? '',
                'last_login_time' => '',
                'last_login_at' => '',
                'balance' => $u['available_balance'] ?? '0.00',
            ];
        }

        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => [
                'data' => $processedUsers,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage
            ]
        ]);
        exit;
    }

    // APP用户统计
    if ($path === 'admin/v1/app-users/statistics' && $method === 'GET') {
        $todayStart = date('Y-m-d 00:00:00');
        $monthStart = date('Y-m-01 00:00:00');
        $yesterdayStart = date('Y-m-d 00:00:00', strtotime('-1 day'));

        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_users");
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as today FROM ytb_users WHERE created_at >= ?");
        $stmt->execute([$todayStart]);
        $todayUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['today'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as yesterday FROM ytb_users WHERE created_at >= ? AND created_at < ?");
        $stmt->execute([$yesterdayStart, $todayStart]);
        $yesterdayUsers = (int)$stmt->fetch(PDO::FETCH_ASSOC)['yesterday'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as vip_total FROM ytb_users WHERE role IN ('scp', 'team_cp', 'boss_cp')");
        $stmt->execute();
        $vipTotal = (int)$stmt->fetch(PDO::FETCH_ASSOC)['vip_total'] ?? 0;

        $stmt = $db->prepare("SELECT COUNT(*) as month_vip FROM ytb_users WHERE (role IN ('team_cp', 'boss_cp')) AND created_at >= ?");
        $stmt->execute([$monthStart]);
        $monthVip = (int)$stmt->fetch(PDO::FETCH_ASSOC)['month_vip'] ?? 0;

        echo json_encode([
            'code' => 0,
            'message' => '操作成功',
            'data' => [
                'total' => $total,
                'today_users' => $todayUsers,
                'yesterday_users' => $yesterdayUsers,
                'vip_total' => $vipTotal,
                'monthly_vip' => $monthVip
            ]
        ]);
        exit;
    }

    // 设备列表
    if ($path === 'admin/v1/devices' && $method === 'GET') {
        $db = getDB(); // 使用YTB自己的数据库
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 10)));
        $offset = ($page - 1) * $perPage;
        $where = [];
        $params = [];

        // 关键词搜索
        if (!empty($_GET['keyword'])) {
            $where[] = "(device_number LIKE ? OR imei LIKE ? OR client_name LIKE ?)";
            $params[] = '%' . $_GET['keyword'] . '%';
            $params[] = '%' . $_GET['keyword'] . '%';
            $params[] = '%' . $_GET['keyword'] . '%';
        }
        // 状态筛选
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }
        // 网络状态筛选
        if (!empty($_GET['network_status'])) {
            $where[] = "network_status = ?";
            $params[] = $_GET['network_status'];
        }
        // 计费模式筛选
        if (!empty($_GET['billing_mode'])) {
            $where[] = "billing_mode = ?";
            $params[] = $_GET['billing_mode'];
        }
        // IOT注册筛选
        if (!empty($_GET['iot_registered'])) {
            if ($_GET['iot_registered'] === '1') {
                $where[] = "LENGTH(imei) >= 10";
            } else {
                $where[] = "(imei IS NULL OR LENGTH(imei) < 10)";
            }
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // 查询总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_devices $whereClause";
        $stmt = $db->prepare($countSql);
        $stmt->execute($params);
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 查询列表
        $listSql = "SELECT * FROM ytb_devices $whereClause ORDER BY create_date DESC LIMIT $offset, $perPage";
        $stmt = $db->prepare($listSql);
        $stmt->execute($params);
        $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $list = [];

        // 从 qiyun_devices 获取心跳时间，用于判断真实在线状态
        // 同时从 tapp_devices 获取累计过滤流量（IOT实时数据）
        $qiyunOnlineMap = [];
        $tappFlowMap = [];
        $deviceNumbers = array_filter(array_column($devices, 'device_number'));
        if (!empty($deviceNumbers)) {
            try {
                $tappDb = getTappDB();
                $dp = implode(',', array_fill(0, count($deviceNumbers), '?'));
                $qdStmt = $tappDb->prepare("SELECT board_code, last_sync_at FROM qiyun_devices WHERE board_code IN ($dp)");
                $qdStmt->execute(array_values($deviceNumbers));
                while ($qd = $qdStmt->fetch(PDO::FETCH_ASSOC)) {
                    // 5分钟内有心跳视为在线
                    $isOnline = !empty($qd['last_sync_at']) && (time() - strtotime($qd['last_sync_at'])) < 300;
                    $qiyunOnlineMap[$qd['board_code']] = [
                        'is_online' => $isOnline,
                        'last_sync_at' => $qd['last_sync_at'],
                    ];
                }
                // 批量获取tapp_devices的累计流量和剩余流量
                $tdStmt = $tappDb->prepare("SELECT device_number, cumulative_filtration_flow, surplus_flow FROM tapp_devices WHERE device_number IN ($dp)");
                $tdStmt->execute(array_values($deviceNumbers));
                while ($td = $tdStmt->fetch(PDO::FETCH_ASSOC)) {
                    $tappFlowMap[$td['device_number']] = $td;
                }
            } catch (Exception $e) {}
        }

        $onlineCount = 0;
        foreach ($devices as $d) {
            // 状态映射
            $statusMap = ['pending' => '待激活', 'assigned' => '已分配', 'installed' => '已安装', 'activated' => '已激活', 'disabled' => '已禁用'];
            $billingMap = ['flow' => '流量计费', 'time' => '包年计费', 'retail' => '零售'];

            // 通过心跳判断在线状态
            $devNum = $d['device_number'] ?? '';
            $qiyunInfo = $qiyunOnlineMap[$devNum] ?? null;
            $tappInfo = $tappFlowMap[$devNum] ?? null;
            $isOnline = $qiyunInfo ? $qiyunInfo['is_online'] : false;
            if ($isOnline) $onlineCount++;

            // 优先使用tapp实时数据
            $realSurplusFlow = floatval($tappInfo['surplus_flow'] ?? $d['surplus_flow'] ?? 0);
            $realCumulativeFlow = floatval($tappInfo['cumulative_filtration_flow'] ?? $d['cumulative_flow'] ?? 0);

            // 计算进度百分比
            $waterLevelPct = 0;
            $daysPct = 0;
            $isLowWater = false;
            $isExpireSoon = false;

            if ($d['billing_mode'] == 'flow') {
                $totalFlow = floatval($d['total_recharged_flow'] ?? 4500);
                $waterLevelPct = $totalFlow > 0 ? min(100, round($realSurplusFlow / $totalFlow * 100)) : 0;
                $isLowWater = $realSurplusFlow < 100;
            }

            $list[] = [
                'id' => $d['id'],
                'device_number' => $d['device_number'] ?? '',
                'board_code' => $d['board_code'] ?? '',
                'imei' => $d['imei'] ?? '',
                'iccid' => $d['iccid'] ?? '',
                'module_code' => $d['module_code'] ?? '',
                'brand' => $d['brand'] ?? '',
                'device_model' => $d['device_model'] ?? '',
                'product_name' => $d['device_type'] ?? '净水器',
                'device_type' => $d['device_type'] ?? '净水器',
                'status' => $d['status'] ?? 'pending',
                'status_text' => $statusMap[$d['status']] ?? '未知',
                'network_status' => $isOnline ? '1' : '0',
                'network_status_text' => $isOnline ? '在线' : '离线',
                'last_sync_at' => $qiyunInfo['last_sync_at'] ?? '',
                'client_name' => $d['client_name'] ?? '',
                'client_phone' => $d['client_phone'] ?? '',
                'client_wx_nickname' => '',
                'address' => $d['client_address'] ?? '',
                'dealer_name' => $d['dealer_name'] ?? '',
                'dealer_number' => '',
                'sale_dealer_name' => '',
                'billing_mode' => $d['billing_mode'] ?? 'flow',
                'billing_mode_text' => $billingMap[$d['billing_mode']] ?? '未知',
                'surplus_flow' => $realSurplusFlow,
                'water_level_percentage' => $waterLevelPct,
                'is_low_water' => $isLowWater,
                'remaining_days' => 0,
                'days_percentage' => 0,
                'is_expire_soon' => false,
                'cumulative_filtration_flow' => $realCumulativeFlow,
                'tds_in' => $d['raw_water_tds'] ?? '',
                'tds_out' => $d['pure_water_tds'] ?? '',
                'raw_water_value' => $d['raw_water_tds'] ?? '',
                'purification_water_value' => $d['pure_water_tds'] ?? '',
                'water_quality_grade' => '',
                'activate_date' => $d['activate_date'] ?? '',
                'service_end_time' => $d['service_end_date'] ?? '',
                'filter_date' => '',
                'iot_registered' => !empty($d['imei']) && strlen($d['imei']) >= 10,
                'created_at' => $d['create_date'] ?? '',
            ];
        }

        // 统计（在线数使用心跳统计）
        $todayStart = date('Y-m-d 00:00:00');
        $monthStart = date('Y-m-01 00:00:00');
        $statsStmt = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN LENGTH(imei) >= 10 THEN 1 ELSE 0 END) as iot_registered,
                SUM(CASE WHEN create_date >= '{$todayStart}' THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN create_date >= '{$monthStart}' THEN 1 ELSE 0 END) as this_month
            FROM ytb_devices
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
        $totalDevices = intval($stats['total'] ?? 0);

        // 在线数从心跳结果获取（全量，非分页）
        $allOnlineCount = 0;
        try {
            $tappDb = getTappDB();
            $allDevNums = $db->query("SELECT device_number FROM ytb_devices")->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($allDevNums)) {
                $dp2 = implode(',', array_fill(0, count($allDevNums), '?'));
                $qdStmt2 = $tappDb->prepare("SELECT COUNT(*) FROM qiyun_devices WHERE board_code IN ($dp2) AND last_sync_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
                $qdStmt2->execute($allDevNums);
                $allOnlineCount = (int)$qdStmt2->fetchColumn();
            }
        } catch (Exception $e) {}

        echo json_encode([
            'code' => 0,
            'data' => [
                'data' => $list,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'statistics' => [
                    'total_devices' => $totalDevices,
                    'pending_devices' => intval($stats['pending'] ?? 0),
                    'activated_devices' => intval($stats['active'] ?? 0),
                    'iot_registered_devices' => intval($stats['iot_registered'] ?? 0),
                    'online_devices' => $allOnlineCount,
                    'offline_devices' => $totalDevices - $allOnlineCount,
                    'online_rate' => $totalDevices > 0 ? round($allOnlineCount / $totalDevices * 100, 1) : 0,
                    'today_devices' => intval($stats['today'] ?? 0),
                    'this_month_devices' => intval($stats['this_month'] ?? 0),
                ]
            ]
        ]);
        exit;
    }

    // 创建设备 (POST /api/admin/v1/devices)
    if ($path === 'admin/v1/devices' && $method === 'POST') {
        $db = getDB(); // 使用YTB自己的数据库

        $device_number = trim($input['device_number'] ?? '');
        $board_code = trim($input['board_code'] ?? '');
        $imei = trim($input['imei'] ?? '');
        $iccid = trim($input['iccid'] ?? '');
        $module_code = trim($input['module_code'] ?? '');
        $device_type = trim($input['device_type'] ?? '净水器');
        $brand = trim($input['brand'] ?? '');
        $device_model = trim($input['device_model'] ?? '');
        $dealer_id = intval($input['dealer_id'] ?? 0) ?: null;
        $billing_mode = trim($input['billing_mode'] ?? 'flow');
        $client_name = trim($input['client_name'] ?? '');
        $client_phone = trim($input['client_phone'] ?? '');
        $address = trim($input['address'] ?? '');

        if (empty($device_number)) {
            echo json_encode(['code' => 1, 'message' => '请输入设备编号']);
            exit;
        }
        if (empty($imei)) {
            echo json_encode(['code' => 1, 'message' => '请输入IMEI']);
            exit;
        }

        // 检查设备编号是否已存在
        $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE device_number = ?");
        $checkStmt->execute([$device_number]);
        if ($checkStmt->fetch()) {
            echo json_encode(['code' => 1, 'message' => '设备编号已存在']);
            exit;
        }

        // 检查IMEI是否已存在
        $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE imei = ?");
        $checkStmt->execute([$imei]);
        if ($checkStmt->fetch()) {
            echo json_encode(['code' => 1, 'message' => 'IMEI已存在']);
            exit;
        }

        try {
            $insertSql = "INSERT INTO ytb_devices (device_number, board_code, imei, iccid, module_code, device_type, brand, device_model, dealer_id, billing_mode, status, network_status, client_name, client_phone, client_address, create_date)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '0', ?, ?, ?, NOW())";
            $stmt = $db->prepare($insertSql);
            $stmt->execute([$device_number, $board_code ?: $device_number, $imei, $iccid, $module_code, $device_type, $brand, $device_model, $dealer_id, $billing_mode, $client_name, $client_phone, $address]);

            $device_id = $db->lastInsertId();

            echo json_encode(['code' => 0, 'message' => '设备添加成功', 'data' => ['id' => $device_id]]);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '添加失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 删除设备 (DELETE /api/admin/v1/devices/:id)
    if (preg_match('#^admin/v1/devices/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $db = getDB(); // 使用YTB自己的数据库

        $deviceId = intval($matches[1]);

        try {
            // 删除设备
            $deleteStmt = $db->prepare("DELETE FROM ytb_devices WHERE id = ?");
            $deleteStmt->execute([$deviceId]);

            echo json_encode(['code' => 0, 'message' => '删除成功']);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '删除失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 注册IOT (POST /api/admin/v1/devices/:id/register-iot)
    if (preg_match('#^admin/v1/devices/(\d+)/register-iot$#', $path, $matches) && $method === 'POST') {
        $db = getDB();
        $deviceId = intval($matches[1]);

        try {
            // 检查设备是否存在
            $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ?");
            $stmt->execute([$deviceId]);
            $device = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$device) {
                echo json_encode(['code' => 1, 'message' => '设备不存在']);
                exit;
            }

            // 模拟IOT注册 - 更新设备状态
            $updateStmt = $db->prepare("UPDATE ytb_devices SET status = 'activated', activate_date = NOW() WHERE id = ?");
            $updateStmt->execute([$deviceId]);

            echo json_encode(['code' => 0, 'message' => 'IOT注册成功']);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '注册失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 修改IMEI (PUT /api/admin/v1/devices/:id/imei)
    if (preg_match('#^admin/v1/devices/(\d+)/imei$#', $path, $matches) && $method === 'PUT') {
        $db = getDB();
        $deviceId = intval($matches[1]);
        $newImei = trim($input['imei'] ?? '');

        if (empty($newImei)) {
            echo json_encode(['code' => 1, 'message' => '请输入新IMEI']);
            exit;
        }

        try {
            // 检查设备是否存在
            $stmt = $db->prepare("SELECT id FROM ytb_devices WHERE id = ?");
            $stmt->execute([$deviceId]);
            if (!$stmt->fetch()) {
                echo json_encode(['code' => 1, 'message' => '设备不存在']);
                exit;
            }

            // 检查新IMEI是否已被其他设备使用
            $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE imei = ? AND id != ?");
            $checkStmt->execute([$newImei, $deviceId]);
            if ($checkStmt->fetch()) {
                echo json_encode(['code' => 1, 'message' => '该IMEI已被其他设备使用']);
                exit;
            }

            // 更新IMEI
            $updateStmt = $db->prepare("UPDATE ytb_devices SET imei = ? WHERE id = ?");
            $updateStmt->execute([$newImei, $deviceId]);

            echo json_encode(['code' => 0, 'message' => 'IMEI修改成功']);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '修改失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 同步IOT (POST /api/admin/v1/devices/:id/sync-iot)
    if (preg_match('#^admin/v1/devices/(\d+)/sync-iot$#', $path, $matches) && $method === 'POST') {
        $db = getDB();
        $deviceId = intval($matches[1]);

        try {
            // 检查设备是否存在
            $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ?");
            $stmt->execute([$deviceId]);
            $device = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$device) {
                echo json_encode(['code' => 1, 'message' => '设备不存在']);
                exit;
            }

            // 模拟从IOT平台同步数据 - 这里可以后续接入真实IOT API
            // 暂时只更新最后同步时间
            echo json_encode(['code' => 0, 'message' => 'IOT数据同步成功', 'data' => [
                'device_number' => $device['device_number'],
                'imei' => $device['imei'],
                'synced_at' => date('Y-m-d H:i:s'),
            ]]);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '同步失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 批量文本导入 (POST /api/admin/v1/devices/batch-text)
    if ($path === 'admin/v1/devices/batch-text' && $method === 'POST') {
        $db = getDB();
        $devicesData = $input['devices'] ?? [];

        if (empty($devicesData) || !is_array($devicesData)) {
            echo json_encode(['code' => 1, 'message' => '请提供设备数据']);
            exit;
        }

        $successCount = 0;
        $failCount = 0;
        $errors = [];

        foreach ($devicesData as $index => $device) {
            $device_number = trim($device['device_number'] ?? '');
            $imei = trim($device['imei'] ?? '');

            if (empty($device_number) || empty($imei)) {
                $failCount++;
                $errors[] = "第{$index}行: 设备编号或IMEI不能为空";
                continue;
            }

            try {
                // 检查是否已存在
                $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE device_number = ? OR imei = ?");
                $checkStmt->execute([$device_number, $imei]);
                if ($checkStmt->fetch()) {
                    $failCount++;
                    $errors[] = "第{$index}行: 设备{$device_number}已存在";
                    continue;
                }

                $board_code = trim($device['board_code'] ?? '') ?: $device_number;
                $iccid = trim($device['iccid'] ?? '');
                $module_code = trim($device['module_code'] ?? '');
                $brand = trim($device['brand'] ?? '');
                $device_model = trim($device['device_model'] ?? '');

                $insertSql = "INSERT INTO ytb_devices (device_number, board_code, imei, iccid, module_code, device_type, brand, device_model, billing_mode, status, network_status, create_date)
                              VALUES (?, ?, ?, ?, ?, '净水器', ?, ?, 'flow', 'pending', '0', NOW())";
                $stmt = $db->prepare($insertSql);
                $stmt->execute([$device_number, $board_code, $imei, $iccid, $module_code, $brand, $device_model]);

                $successCount++;
            } catch (Exception $e) {
                $failCount++;
                $errors[] = "第{$index}行: " . $e->getMessage();
            }
        }

        echo json_encode([
            'code' => 0,
            'message' => "导入完成: 成功{$successCount}条, 失败{$failCount}条",
            'data' => [
                'success_count' => $successCount,
                'fail_count' => $failCount,
                'errors' => $errors,
            ]
        ]);
        exit;
    }

    // 获取经销商列表 (GET /api/admin/v1/dealers)
    if ($path === 'admin/v1/dealers' && $method === 'GET') {
        $tappDb = getTappDB();
        if (!$tappDb) {
            echo json_encode(['code' => 0, 'data' => []]);
            exit;
        }

        try {
            $stmt = $tappDb->query("SELECT id, dealer_name, dealer_number, contact_person, contact_phone, create_date FROM water_dealers ORDER BY id DESC");
            $dealers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['code' => 0, 'data' => $dealers]);
        } catch (Exception $e) {
            echo json_encode(['code' => 0, 'data' => [], 'message' => $e->getMessage()]);
        }
        exit;
    }

    // ========== 净水器工程师/工单 API ==========

    // 工单统计数据 (GET /api/admin/water-engineer/stats)
    if ($path === 'admin/water-engineer/stats' && $method === 'GET') {
        echo json_encode([
            'code' => 0,
            'data' => [
                'total_orders' => 0,
                'pending_orders' => 0,
                'assigned_orders' => 0,
                'completed_orders' => 0,
                'cancelled_orders' => 0,
            ]
        ]);
        exit;
    }

    // 工单列表 (GET /api/admin/water-engineer/orders)
    if ($path === 'admin/water-engineer/orders' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 15)));
        $offset = ($page - 1) * $limit;

        echo json_encode([
            'code' => 0,
            'data' => [
                'data' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $limit,
            ]
        ]);
        exit;
    }

    // 工单详情 (GET /api/admin/water-engineer/orders/:orderNo)
    if (preg_match('#^admin/water-engineer/orders/([^/]+)$#', $path, $matches) && $method === 'GET') {
        $orderNo = $matches[1];
        echo json_encode([
            'code' => 0,
            'data' => [
                'order_no' => $orderNo,
                'status' => 'pending',
            ]
        ]);
        exit;
    }

    // 派单 (POST /api/admin/water-engineer/orders/:orderNo/assign)
    if (preg_match('#^admin/water-engineer/orders/([^/]+)/assign$#', $path, $matches) && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '派单成功']);
        exit;
    }

    // 取消工单 (POST /api/admin/water-engineer/orders/:orderNo/cancel)
    if (preg_match('#^admin/water-engineer/orders/([^/]+)/cancel$#', $path, $matches) && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '工单已取消']);
        exit;
    }

    // 待接单订单 (GET /api/admin/water-engineer/pending-orders)
    if ($path === 'admin/water-engineer/pending-orders' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => []]);
        exit;
    }

    // 工程师列表 (GET /api/admin/water-engineer/engineers)
    if ($path === 'admin/water-engineer/engineers' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

        // 演示数据
        $demoEngineers = [
            [
                'id' => 1,
                'name' => '陈工',
                'phone' => '13800138001',
                'region' => '深圳市',
                'address' => '南山区科技园',
                'id_card' => '440301199001010001',
                'avatar' => '',
                'status' => 1,
                'remark' => '演示工程师',
                'completed_installations' => 0,
                'created_at' => '2026-04-01 10:00:00',
            ],
        ];

        $filtered = $demoEngineers;
        if (!empty($keyword)) {
            $filtered = array_filter($demoEngineers, function($e) use ($keyword) {
                return stripos($e['name'], $keyword) !== false || stripos($e['phone'], $keyword) !== false;
            });
        }

        $total = count($filtered);
        $list = array_slice(array_values($filtered), $offset, $limit);

        echo json_encode([
            'code' => 0,
            'data' => [
                'data' => $list,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 添加工程师 (POST /api/admin/water-engineer/engineers)
    if ($path === 'admin/water-engineer/engineers' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '添加成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 删除工程师 (DELETE /api/admin/water-engineer/engineers/:id)
    if (preg_match('#^admin/water-engineer/engineers/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        echo json_encode(['code' => 0, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========== 安装预约 API (非v1版本，用于 Booking.vue) ==========

    // 安装预约列表 (GET /api/admin/installation/booking)
    if ($path === 'admin/installation/booking' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 20)));
        $offset = ($page - 1) * $perPage;

        $where = [];
        $params = [];

        if (!empty($_GET['keyword'])) {
            $where[] = "(contact_name LIKE ? OR contact_phone LIKE ? OR install_address LIKE ?)";
            $params[] = '%' . $_GET['keyword'] . '%';
            $params[] = '%' . $_GET['keyword'] . '%';
            $params[] = '%' . $_GET['keyword'] . '%';
        }
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['payment_status'])) {
            $where[] = "payment_status = ?";
            $params[] = $_GET['payment_status'];
        }
        if (!empty($_GET['start_date'])) {
            $where[] = "install_time >= ?";
            $params[] = $_GET['start_date'] . ' 00:00:00';
        }
        if (!empty($_GET['end_date'])) {
            $where[] = "install_time <= ?";
            $params[] = $_GET['end_date'] . ' 23:59:59';
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // 查询总数
        try {
            $countSql = "SELECT COUNT(*) as total FROM water_installation_bookings $whereSql";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            $listSql = "SELECT * FROM water_installation_bookings $whereSql ORDER BY id DESC LIMIT $offset, $perPage";
            $listStmt = $db->prepare($listSql);
            $listStmt->execute($params);
            $rows = $listStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $rows = [];
            $total = 0;
        }

        echo json_encode([
            'code' => 0,
            'data' => [
                'data' => $rows,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage
            ]
        ]);
        exit;
    }

    // 创建安装预约 (POST /api/admin/installation/booking)
    if ($path === 'admin/installation/booking' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => time()]]);
        exit;
    }

    // 安装预约详情 (GET /api/admin/installation/booking/:id)
    if (preg_match('#^admin/installation/booking/(\d+)$#', $path, $matches) && $method === 'GET') {
        $id = intval($matches[1]);
        try {
            $stmt = $db->prepare("SELECT * FROM water_installation_bookings WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $row = null;
        }
        echo json_encode(['code' => 0, 'data' => $row ?: ['id' => $id]]);
        exit;
    }

    // 更新安装预约 (PUT /api/admin/installation/booking/:id)
    if (preg_match('#^admin/installation/booking/(\d+)$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '更新成功']);
        exit;
    }

    // 删除安装预约 (DELETE /api/admin/installation/booking/:id)
    if (preg_match('#^admin/installation/booking/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        echo json_encode(['code' => 0, 'message' => '删除成功']);
        exit;
    }

    // 分配工程师 (POST /api/admin/installation/booking/:id/assign-engineer)
    if (preg_match('#^admin/installation/booking/(\d+)/assign-engineer$#', $path, $matches) && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '分配成功']);
        exit;
    }

    // 可用工程师列表 (GET /api/admin/installation/available-engineers)
    if ($path === 'admin/installation/available-engineers' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => []]);
        exit;
    }

    // 安装统计 (非v1) (GET /api/admin/installation/statistics)
    if ($path === 'admin/installation/statistics' && $method === 'GET') {
        echo json_encode([
            'code' => 0,
            'data' => [
                'total_bookings' => 0, 'pending_bookings' => 0, 'confirmed_bookings' => 0,
                'assigned_bookings' => 0, 'in_progress_bookings' => 0, 'completed_bookings' => 0, 'cancelled_bookings' => 0
            ]
        ]);
        exit;
    }

    // 导出预约数据 (GET /api/admin/installation/booking/export)
    if ($path === 'admin/installation/booking/export' && $method === 'GET') {
        echo json_encode(['code' => 0, 'message' => '导出成功']);
        exit;
    }

    // ========== 安装预约 API (/api/admin/v1/installation/*) ==========

    // 安装预约列表 (GET /api/admin/v1/installation/bookings)
    if ($path === 'admin/v1/installation/bookings' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        echo json_encode([
            'code' => 0,
            'data' => ['data' => [], 'total' => 0, 'page' => $page, 'per_page' => $limit]
        ]);
        exit;
    }

    // 安装预约详情 (GET /api/admin/v1/installation/bookings/:id)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)$#', $path, $matches) && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => ['id' => intval($matches[1])]]);
        exit;
    }

    // 创建安装预约 (POST /api/admin/v1/installation/bookings)
    if ($path === 'admin/v1/installation/bookings' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => time()]]);
        exit;
    }

    // 更新安装预约 (PUT /api/admin/v1/installation/bookings/:id)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '更新成功']);
        exit;
    }

    // 删除安装预约 (DELETE /api/admin/v1/installation/bookings/:id)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        echo json_encode(['code' => 0, 'message' => '删除成功']);
        exit;
    }

    // 更新预约状态 (PUT /api/admin/v1/installation/bookings/:id/status)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)/status$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '状态更新成功']);
        exit;
    }

    // 分配工程师 (PUT /api/admin/v1/installation/bookings/:id/assign-engineer)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)/assign-engineer$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '分配成功']);
        exit;
    }

    // 可用工程师列表 (GET /api/admin/v1/installation/engineers/available)
    if ($path === 'admin/v1/installation/engineers/available' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => []]);
        exit;
    }

    // 工程师列表 (GET /api/admin/v1/installation/engineers)
    if ($path === 'admin/v1/installation/engineers' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => ['data' => [], 'total' => 0]]);
        exit;
    }

    // 创建工程师 (POST /api/admin/v1/installation/engineers)
    if ($path === 'admin/v1/installation/engineers' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => time()]]);
        exit;
    }

    // 更新工程师 (PUT /api/admin/v1/installation/engineers/:id)
    if (preg_match('#^admin/v1/installation/engineers/(\d+)$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '更新成功']);
        exit;
    }

    // 删除工程师 (DELETE /api/admin/v1/installation/engineers/:id)
    if (preg_match('#^admin/v1/installation/engineers/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        echo json_encode(['code' => 0, 'message' => '删除成功']);
        exit;
    }

    // 安装统计 (GET /api/admin/v1/installation/statistics)
    if ($path === 'admin/v1/installation/statistics' && $method === 'GET') {
        echo json_encode([
            'code' => 0,
            'data' => [
                'total_bookings' => 0, 'pending_bookings' => 0, 'confirmed_bookings' => 0,
                'assigned_bookings' => 0, 'in_progress_bookings' => 0, 'completed_bookings' => 0, 'cancelled_bookings' => 0
            ]
        ]);
        exit;
    }

    // 上传安装照片 (POST /api/admin/v1/installation/bookings/:bookingId/upload-photo)
    if (preg_match('#^admin/v1/installation/bookings/(\d+)/upload-photo$#', $path, $matches) && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '上传成功']);
        exit;
    }

    // ========== 工程师管理 API (/api/admin/v1/installation-engineers/*) ==========

    // 工程师列表
    if ($path === 'admin/v1/installation-engineers' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

        $demoEngineers = [
            [
                'id' => 1,
                'name' => '陈工',
                'phone' => '13800138001',
                'region' => '深圳市',
                'address' => '南山区科技园',
                'id_card' => '440301199001010001',
                'avatar' => '',
                'status' => 1,
                'remark' => '演示工程师',
                'completed_installations' => 0,
                'created_at' => '2026-04-01 10:00:00',
            ],
        ];

        $filtered = $demoEngineers;
        if (!empty($keyword)) {
            $filtered = array_filter($demoEngineers, function($e) use ($keyword) {
                return stripos($e['name'], $keyword) !== false || stripos($e['phone'], $keyword) !== false;
            });
        }

        $total = count($filtered);
        $list = array_slice(array_values($filtered), $offset, $limit);

        echo json_encode([
            'code' => 0,
            'data' => [
                'data' => $list,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 工程师详情
    if (preg_match('#^admin/v1/installation-engineers/(\d+)$#', $path, $matches) && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => ['id' => intval($matches[1])]]);
        exit;
    }

    // 创建工程师
    if ($path === 'admin/v1/installation-engineers' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => time()]]);
        exit;
    }

    // 更新工程师
    if (preg_match('#^admin/v1/installation-engineers/(\d+)$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '更新成功']);
        exit;
    }

    // 删除工程师
    if (preg_match('#^admin/v1/installation-engineers/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        echo json_encode(['code' => 0, 'message' => '删除成功']);
        exit;
    }

    // 更新工程师状态
    if (preg_match('#^admin/v1/installation-engineers/(\d+)/status$#', $path, $matches) && $method === 'PUT') {
        echo json_encode(['code' => 0, 'message' => '状态更新成功']);
        exit;
    }

    // 工程师统计
    if (preg_match('#^admin/v1/installation-engineers/(\d+)/stats$#', $path, $matches) && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => ['total_installations' => 0, 'completed' => 0, 'pending' => 0]]);
        exit;
    }

    // 工程师工作记录
    if (preg_match('#^admin/v1/installation-engineers/(\d+)/installations$#', $path, $matches) && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => ['data' => [], 'total' => 0]]);
        exit;
    }

    // 分配工作
    if (preg_match('#^admin/v1/installation-engineers/(\d+)/assign-work$#', $path, $matches) && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '分配成功']);
        exit;
    }

    // 可用工程师
    if ($path === 'admin/v1/installation-engineers/available' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => []]);
        exit;
    }

    // 批量操作工程师
    if ($path === 'admin/v1/installation-engineers/batch-operate' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '操作成功']);
        exit;
    }

    // 导出工程师
    if ($path === 'admin/v1/installation-engineers/export' && $method === 'GET') {
        echo json_encode(['code' => 0, 'message' => '导出成功']);
        exit;
    }

    // 工程师区域
    if ($path === 'admin/v1/installation-engineers/regions' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => []]);
        exit;
    }

    // 同步工程师
    if ($path === 'admin/v1/installation-engineers/sync-from-water-db' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '同步成功']);
        exit;
    }

    // 更新工程师安装数量
    if ($path === 'admin/v1/installation-engineers/update-installation-count' && $method === 'POST') {
        echo json_encode(['code' => 0, 'message' => '更新成功']);
        exit;
    }

    // ========== 净水器安装记录 API (/api/admin/v1/installations/*) ==========

    // 安装记录列表 (GET /api/admin/v1/installations)
    if ($path === 'admin/v1/installations' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $perPage = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $perPage;

        $where = [];
        $params = [];

        if (!empty($_GET['keyword'])) {
            $where[] = "(device_number LIKE ? OR client_name LIKE ?)";
            $params[] = '%' . $_GET['keyword'] . '%';
            $params[] = '%' . $_GET['keyword'] . '%';
        }
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }
        if (!empty($_GET['start_date'])) {
            $where[] = "installed_at >= ?";
            $params[] = $_GET['start_date'] . ' 00:00:00';
        }
        if (!empty($_GET['end_date'])) {
            $where[] = "installed_at <= ?";
            $params[] = $_GET['end_date'] . ' 23:59:59';
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        // 查询总数
        $countSql = "SELECT COUNT(*) as total FROM ytb_installations $whereSql";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 查询列表
        $listSql = "SELECT i.*,
            u.nickname as promoter_nickname, u.role as promoter_role, u.role_name as promoter_role_name,
            u1.nickname as level1_nickname, u2.nickname as level2_nickname
            FROM ytb_installations i
            LEFT JOIN ytb_users u ON i.user_id = u.id
            LEFT JOIN ytb_users u1 ON u.parent_id = u1.id
            LEFT JOIN ytb_users u2 ON u1.parent_id = u2.id
            $whereSql
            ORDER BY i.id DESC LIMIT $offset, $perPage";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $rows = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($rows as $row) {
            $statusName = ['pending' => '待激活', 'activated' => '已激活', 'settled' => '已结算'];
            $items[] = [
                'id' => $row['id'],
                'device_number' => $row['device_number'] ?? '',
                'client_name' => $row['client_name'] ?? '',
                'client_phone' => $row['client_phone'] ?? '',
                'install_address' => $row['install_address'] ?? '',
                'status' => $row['status'] ?? 'pending',
                'status_name' => $statusName[$row['status']] ?? '未知',
                'installed_at' => $row['installed_at'] ?? '',
                'activated_at' => $row['activated_at'] ?? '',
                'settled_at' => $row['settled_at'] ?? '',
                'promoter_reward' => floatval($row['promoter_reward'] ?? 0),
                'level1_reward' => floatval($row['level1_reward'] ?? 0),
                'level2_reward' => floatval($row['level2_reward'] ?? 0),
                'boss_refund' => floatval($row['boss_refund'] ?? 0),
                'promoter' => [
                    'nickname' => $row['promoter_nickname'] ?? '',
                    'role' => $row['promoter_role'] ?? '',
                    'role_name' => $row['promoter_role_name'] ?? '',
                    'avatar' => '',
                ],
                'level1_user' => [
                    'nickname' => $row['level1_nickname'] ?? '',
                ],
                'level2_user' => [
                    'nickname' => $row['level2_nickname'] ?? '',
                ],
                'boss_user' => [
                    'nickname' => '',
                ],
            ];
        }

        echo json_encode([
            'code' => 0,
            'data' => [
                'items' => $items,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
            ]
        ]);
        exit;
    }

    // 安装记录详情 (GET /api/admin/v1/installations/:id)
    if (preg_match('#^admin/v1/installations/(\d+)$#', $path, $matches) && $method === 'GET') {
        $id = intval($matches[1]);

        $stmt = $db->prepare("SELECT i.*,
            u.nickname as promoter_nickname, u.role as promoter_role, u.role_name as promoter_role_name,
            u1.nickname as level1_nickname, u2.nickname as level2_nickname
            FROM ytb_installations i
            LEFT JOIN ytb_users u ON i.user_id = u.id
            LEFT JOIN ytb_users u1 ON u.parent_id = u1.id
            LEFT JOIN ytb_users u2 ON u1.parent_id = u2.id
            WHERE i.id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            echo json_encode(['code' => 1, 'message' => '记录不存在']);
            exit;
        }

        $statusName = ['pending' => '待激活', 'activated' => '已激活', 'settled' => '已结算'];
        echo json_encode([
            'code' => 0,
            'data' => [
                'id' => $row['id'],
                'device_number' => $row['device_number'] ?? '',
                'client_name' => $row['client_name'] ?? '',
                'client_phone' => $row['client_phone'] ?? '',
                'install_address' => $row['install_address'] ?? '',
                'status' => $row['status'] ?? 'pending',
                'status_name' => $statusName[$row['status']] ?? '未知',
                'installed_at' => $row['installed_at'] ?? '',
                'activated_at' => $row['activated_at'] ?? '',
                'settled_at' => $row['settled_at'] ?? '',
                'promoter_reward' => floatval($row['promoter_reward'] ?? 0),
                'level1_reward' => floatval($row['level1_reward'] ?? 0),
                'level2_reward' => floatval($row['level2_reward'] ?? 0),
                'boss_refund' => floatval($row['boss_refund'] ?? 0),
                'promoter' => [
                    'nickname' => $row['promoter_nickname'] ?? '',
                    'role' => $row['promoter_role'] ?? '',
                    'role_name' => $row['promoter_role_name'] ?? '',
                    'avatar' => '',
                ],
                'level1_user' => ['nickname' => $row['level1_nickname'] ?? ''],
                'level2_user' => ['nickname' => $row['level2_nickname'] ?? ''],
                'boss_user' => ['nickname' => ''],
            ]
        ]);
        exit;
    }

    // 安装统计 (GET /api/admin/v1/installations/statistics)
    if ($path === 'admin/v1/installations/statistics' && $method === 'GET') {
        $stmt = $db->query("SELECT COUNT(*) as total FROM ytb_installations");
        $total = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        $stmt = $db->query("SELECT COUNT(*) as total_rewards FROM ytb_installations WHERE status IN ('activated', 'settled')");
        $totalRewards = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total_rewards'] ?? 0);

        $stmt = $db->query("SELECT COALESCE(SUM(boss_refund), 0) as total_boss_refunds FROM ytb_installations");
        $totalBossRefunds = floatval($stmt->fetch(PDO::FETCH_ASSOC)['total_boss_refunds'] ?? 0);

        $monthStart = date('Y-m-01 00:00:00');
        $stmt = $db->prepare("SELECT COUNT(*) as this_month FROM ytb_installations WHERE installed_at >= ?");
        $stmt->execute([$monthStart]);
        $thisMonthCount = (int)$stmt->fetch(PDO::FETCH_ASSOC)['this_month'] ?? 0;

        echo json_encode([
            'code' => 0,
            'data' => [
                'total_installations' => $total,
                'total_rewards' => $totalRewards,
                'total_boss_refunds' => $totalBossRefunds,
                'this_month_count' => $thisMonthCount,
            ]
        ]);
        exit;
    }

    // 结算安装分佣 (POST /api/admin/v1/installations/:id/settle)
    if (preg_match('#^admin/v1/installations/(\d+)/settle$#', $path, $matches) && $method === 'POST') {
        $id = intval($matches[1]);

        try {
            $stmt = $db->prepare("UPDATE ytb_installations SET status = 'settled', settled_at = NOW() WHERE id = ? AND status = 'activated'");
            $stmt->execute([$id]);

            echo json_encode(['code' => 0, 'message' => '结算成功']);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '结算失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 批量结算安装分佣 (POST /api/admin/v1/installations/batch-settle)
    if ($path === 'admin/v1/installations/batch-settle' && $method === 'POST') {
        $ids = $input['ids'] ?? [];

        if (empty($ids)) {
            echo json_encode(['code' => 1, 'message' => '请选择要结算的记录']);
            exit;
        }

        try {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $stmt = $db->prepare("UPDATE ytb_installations SET status = 'settled', settled_at = NOW() WHERE id IN ($placeholders) AND status = 'activated'");
            $stmt->execute($ids);

            echo json_encode(['code' => 0, 'message' => '批量结算成功', 'data' => ['settled_count' => count($ids)]]);
        } catch (Exception $e) {
            echo json_encode(['code' => 1, 'message' => '批量结算失败: ' . $e->getMessage()]);
        }
        exit;
    }

    // 微信JSSDK配置 (GET /Tapp/admin/api/wechat/jsconfig.php) - 亿拓宝专用
    if (preg_match('#^Tapp/admin/api/wechat/jsconfig\.php$#', $path) && $method === 'GET') {
        $url = $_GET['url'] ?? '';
        if (empty($url)) {
            echo json_encode(['code' => 1, 'message' => 'URL参数缺失']);
            exit;
        }

        // 亿拓宝微信公众号配置
        $appId = 'wx644418e60bf1f7a2';  // 亿拓宝服务号

        // 获取JSAPI Ticket
        $tappDb = getTappDB();
        $ticket = getWechatJsapiTicket($tappDb, $appId);
        if (!$ticket) {
            echo json_encode(['code' => 1, 'message' => '获取JSAPI Ticket失败']);
            exit;
        }

        $timestamp = time();
        $nonceStr = bin2hex(random_bytes(8));

        // 生成签名
        $signature = generateWechatSignature($url, $timestamp, $nonceStr, $ticket);

        echo json_encode([
            'code' => 0,
            'message' => '获取微信JSSDK配置成功',
            'data' => [
                'appId' => $appId,
                'timestamp' => $timestamp,
                'nonceStr' => $nonceStr,
                'signature' => $signature,
                'jsApiList' => [
                    'updateAppMessageShareData',
                    'updateTimelineShareData',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'chooseWXPay',
                    'getBrandWCPayRequest'
                ]
            ]
        ]);
        exit;
    }

    // ========== 七云IOT平台通信函数 ==========

    function qiyunIotRequest($endpoint, $params) {
        $token = '2erW4KEHbmw05KHfiLwO3OVV6FOrMiMW';
        $baseUrl = 'https://iot.7ciot.cn/iot/v1';

        // AES-128-ECB 加密
        $msg = json_encode($params, JSON_UNESCAPED_UNICODE);
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $nonce = '';
        for ($i = 0; $i < 16; $i++) $nonce .= $chars[random_int(0, strlen($chars) - 1)];

        $encrypted = openssl_encrypt($msg, 'AES-128-ECB', $nonce, OPENSSL_RAW_DATA);
        $msgEnc = base64_encode($encrypted);
        $signature = md5($token . $msgEnc);

        $body = json_encode(['msg' => $msgEnc, 'nonce' => $nonce, 'signature' => $signature]);

        $ch = curl_init($baseUrl . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false,
        ]);
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) return ['code' => -1, 'msg' => '网络错误: ' . $error];
        $result = json_decode($response, true);
        return $result ?: ['code' => -1, 'msg' => '解析响应失败', 'raw' => substr($response, 0, 500)];
    }

    // ========== 设备入库管理 API ==========

    // 入库统计 (GET /api/admin/water-purifier/stock-statistics)
    if ($path === 'admin/water-purifier/stock-statistics' && $method === 'GET') {
        $db = getDB();
        try {
            $total = (int)$db->query("SELECT COUNT(*) FROM ytb_devices")->fetchColumn();
            $pending = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'pending'")->fetchColumn();
            $activated = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'activated'")->fetchColumn();
            $installed = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'installed'")->fetchColumn();
            $locked = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'locked'")->fetchColumn();
            $fault = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE status = 'fault'")->fetchColumn();
            $todayReg = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE DATE(create_date) = CURDATE()")->fetchColumn();
            $monthReg = (int)$db->query("SELECT COUNT(*) FROM ytb_devices WHERE YEAR(create_date) = YEAR(CURDATE()) AND MONTH(create_date) = MONTH(CURDATE())")->fetchColumn();

            // IOT已注册数 - 从ddg.app的qiyun_devices表获取
            $iotReg = 0;
            $tappDb = getTappDB();
            if ($tappDb) {
                try {
                    $boardCodes = $db->query("SELECT device_number FROM ytb_devices")->fetchAll(PDO::FETCH_COLUMN);
                    if (!empty($boardCodes)) {
                        $dp = implode(',', array_fill(0, count($boardCodes), '?'));
                        $stmt = $tappDb->prepare("SELECT COUNT(*) FROM qiyun_devices WHERE board_code IN ($dp)");
                        $stmt->execute($boardCodes);
                        $iotReg = (int)$stmt->fetchColumn();
                    }
                } catch (Exception $e) {}
            }

            echo json_encode(['code' => 0, 'data' => [
                'total' => $total, 'pending' => $pending, 'activated' => $activated,
                'installed' => $installed, 'locked' => $locked, 'fault' => $fault,
                'iot_registered' => $iotReg, 'today_registered' => $todayReg, 'this_month_registered' => $monthReg,
            ]], JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(['code' => 0, 'data' => [
                'total' => 0, 'pending' => 0, 'activated' => 0, 'installed' => 0,
                'locked' => 0, 'fault' => 0, 'iot_registered' => 0,
                'today_registered' => 0, 'this_month_registered' => 0,
            ]]);
        }
        exit;
    }

    // 设备列表 (GET /api/admin/water-purifier/)
    if (($path === 'admin/water-purifier/' || $path === 'admin/water-purifier') && $method === 'GET') {
        $db = getDB();
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(100, max(1, (int)($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $perPage;

        $where = [];
        $params = [];
        if (!empty($_GET['keyword'])) {
            $kw = '%' . trim($_GET['keyword']) . '%';
            $where[] = "(device_number LIKE ? OR board_code LIKE ? OR imei LIKE ? OR iccid LIKE ?)";
            $params = array_merge($params, [$kw, $kw, $kw, $kw]);
        }
        if (!empty($_GET['status'])) {
            $where[] = "status = ?";
            $params[] = $_GET['status'];
        }
        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $countSql = "SELECT COUNT(*) FROM ytb_devices $whereClause";
        $stmt = $db->prepare($countSql);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();

        $listSql = "SELECT * FROM ytb_devices $whereClause ORDER BY id DESC LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($listSql);
        $stmt->execute($params);
        $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 查IOT注册状态
        $tappDb = getTappDB();
        $iotMap = [];
        if ($tappDb && !empty($list)) {
            $bcs = array_map(fn($d) => $d['device_number'] ?: $d['board_code'], $list);
            $bcs = array_filter($bcs);
            if (!empty($bcs)) {
                try {
                    $dp = implode(',', array_fill(0, count($bcs), '?'));
                    $qdStmt = $tappDb->prepare("SELECT board_code FROM qiyun_devices WHERE board_code IN ($dp)");
                    $qdStmt->execute(array_values($bcs));
                    while ($r = $qdStmt->fetch(PDO::FETCH_ASSOC)) {
                        $iotMap[$r['board_code']] = true;
                    }
                } catch (Exception $e) {}
            }
        }

        foreach ($list as &$d) {
            $d['id'] = (int)$d['id'];
            $bc = $d['device_number'] ?: ($d['board_code'] ?? '');
            $d['board_code'] = $bc;
            $d['iot_registered'] = isset($iotMap[$bc]);
            $d['created_at'] = $d['create_date'] ?? null;
        }
        unset($d);

        echo json_encode([
            'code' => 0, 'data' => $list,
            'meta' => ['total' => $total, 'current_page' => $page, 'per_page' => $perPage],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 模块型号列表 (GET /api/admin/water-purifier/module-types)
    if ($path === 'admin/water-purifier/module-types' && $method === 'GET') {
        echo json_encode(['code' => 0, 'data' => [
            'CS_01' => '常规4G模块',
            'QY_QN4G' => '七云4G模块',
            'QY_WIFI' => '七云WiFi模块',
        ]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 品牌和型号列表 (GET /api/admin/water-purifier/brands-models)
    if ($path === 'admin/water-purifier/brands-models' && $method === 'GET') {
        // 从ddg.app数据库读取品牌和型号
        $brands = [];
        $models = [];
        $tappDb = getTappDB();
        if ($tappDb) {
            try {
                $bStmt = $tappDb->query("SELECT id, brand_name, brand_code FROM qiyun_device_brands WHERE is_active = 1 ORDER BY sort_order ASC");
                $brands = $bStmt->fetchAll(PDO::FETCH_ASSOC);
                $mStmt = $tappDb->query("SELECT id, brand_id, model_name, model_code, description FROM qiyun_device_models WHERE is_active = 1 ORDER BY brand_id, sort_order ASC");
                $models = $mStmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Exception $e) {}
        }

        // 补充前端需要的通用品牌（如果DDG数据库不够全）
        $existingBrandNames = array_column($brands, 'brand_name');
        $extraBrands = [
            ['brand_name' => '美的', 'brand_code' => 'MIDEA'],
            ['brand_name' => '海尔', 'brand_code' => 'HAIER'],
            ['brand_name' => '格力', 'brand_code' => 'GREE'],
            ['brand_name' => '小米', 'brand_code' => 'XIAOMI'],
            ['brand_name' => '安吉尔', 'brand_code' => 'ANGEL'],
            ['brand_name' => '史密斯', 'brand_code' => 'AOSMITH'],
            ['brand_name' => '3M', 'brand_code' => 'THREE_M'],
            ['brand_name' => '怡口', 'brand_code' => 'ECOWATER'],
            ['brand_name' => '碧然德', 'brand_code' => 'BRITA'],
            ['brand_name' => '飞利浦', 'brand_code' => 'PHILIPS'],
            ['brand_name' => '九阳', 'brand_code' => 'JOYOUNG'],
            ['brand_name' => '苏泊尔', 'brand_code' => 'SUPOR'],
            ['brand_name' => '沁园', 'brand_code' => 'QINYUAN'],
            ['brand_name' => '怡宝', 'brand_code' => 'YIBAO'],
            ['brand_name' => '扬子', 'brand_code' => 'YANGZI'],
            ['brand_name' => '开能', 'brand_code' => 'CANATURE'],
            ['brand_name' => '汉斯顿', 'brand_code' => 'HANSTON'],
            ['brand_name' => '法兰尼', 'brand_code' => 'FLANNE'],
            ['brand_name' => '道尔顿', 'brand_code' => 'DOULTON'],
            ['brand_name' => '立升', 'brand_code' => 'LITREE'],
            ['brand_name' => '云米', 'brand_code' => 'VIOMI'],
            ['brand_name' => '容声', 'brand_code' => 'RONSHEN'],
            ['brand_name' => '荣事达', 'brand_code' => 'ROYALSTAR'],
            ['brand_name' => '泉来', 'brand_code' => 'QUANLAI'],
        ];
        $nextId = count($brands) + 100;
        foreach ($extraBrands as $eb) {
            if (!in_array($eb['brand_name'], $existingBrandNames)) {
                $nextId++;
                $brands[] = ['id' => $nextId, 'brand_name' => $eb['brand_name'], 'brand_code' => $eb['brand_code']];
            }
        }

        // 整型ID
        foreach ($brands as &$b) $b['id'] = (int)$b['id'];
        foreach ($models as &$m) { $m['id'] = (int)$m['id']; $m['brand_id'] = (int)$m['brand_id']; }
        unset($b, $m);

        echo json_encode(['code' => 0, 'data' => ['brands' => $brands, 'models' => $models]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 单个设备入库 (POST /api/admin/water-purifier/register)
    if ($path === 'admin/water-purifier/register' && $method === 'POST') {
        $db = getDB();
        $boardCode = trim($input['board_code'] ?? '');
        $imei = trim($input['imei'] ?? '');
        $iccid = trim($input['iccid'] ?? '');
        $moduleCode = trim($input['module_code'] ?? 'QY_QN4G');
        $brand = trim($input['brand'] ?? '');
        $deviceModel = trim($input['device_model'] ?? '');
        $remark = trim($input['remark'] ?? '');
        $syncToIot = (bool)($input['sync_to_iot'] ?? false);

        if (!$boardCode || !$imei) {
            echo json_encode(['code' => 1, 'message' => '主板编码和IMEI为必填'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 检查是否已存在
        $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE device_number = ? OR (imei = ? AND imei != '')");
        $checkStmt->execute([$boardCode, $imei]);
        if ($checkStmt->fetch()) {
            echo json_encode(['code' => 1, 'message' => '该主板编码或IMEI已存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 插入数据库
        $stmt = $db->prepare("INSERT INTO ytb_devices (device_number, board_code, imei, iccid, module_code, device_type, brand, device_model, billing_mode, status, network_status, create_date)
            VALUES (?, ?, ?, ?, ?, '净水器', ?, ?, 'flow', 'pending', '0', NOW())");
        $stmt->execute([$boardCode, $boardCode, $imei, $iccid, $moduleCode, $brand, $deviceModel]);
        $deviceId = (int)$db->lastInsertId();

        // 同步到IOT平台
        $iotResult = null;
        if ($syncToIot) {
            $iotResult = qiyunIotRequest('/deviceController/addBoard', [
                'boardCode' => $boardCode, 'imei' => $imei, 'moduleCode' => $moduleCode,
            ]);

            // 同步到ddg.app的qiyun_devices
            $tappDb = getTappDB();
            if ($tappDb) {
                try {
                    $tappDb->prepare("INSERT IGNORE INTO qiyun_devices (board_code, imei, module_code, brand, device_model, status, iot_registered, billing_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 1, 'flow', NOW(), NOW())")
                        ->execute([$boardCode, $imei, $moduleCode, $brand, $deviceModel]);
                } catch (Exception $e) {}
            }
        }

        echo json_encode([
            'code' => 0, 'message' => '设备入库成功' . ($syncToIot ? '（已同步IOT）' : ''),
            'data' => ['id' => $deviceId, 'iot_result' => $iotResult],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 批量设备入库 (POST /api/admin/water-purifier/batch-register)
    if ($path === 'admin/water-purifier/batch-register' && $method === 'POST') {
        $db = getDB();
        $devices = $input['devices'] ?? [];
        $syncToIot = (bool)($input['sync_to_iot'] ?? false);

        if (empty($devices)) {
            echo json_encode(['code' => 1, 'message' => '没有设备数据'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $success = [];
        $failed = [];

        foreach ($devices as $dev) {
            $bc = trim($dev['board_code'] ?? '');
            $imei = trim($dev['imei'] ?? '');
            $iccid = trim($dev['iccid'] ?? '');
            $mc = trim($dev['module_code'] ?? 'QY_QN4G');
            $brand = trim($dev['brand'] ?? '');
            $deviceModel = trim($dev['device_model'] ?? '');

            if (!$bc || !$imei) {
                $failed[] = ['board_code' => $bc ?: '(空)', 'reason' => '缺少必填字段'];
                continue;
            }

            try {
                // 检查重复
                $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE device_number = ?");
                $checkStmt->execute([$bc]);
                if ($checkStmt->fetch()) {
                    $failed[] = ['board_code' => $bc, 'reason' => '主板编码已存在'];
                    continue;
                }

                $stmt = $db->prepare("INSERT INTO ytb_devices (device_number, board_code, imei, iccid, module_code, device_type, brand, device_model, billing_mode, status, network_status, create_date)
                    VALUES (?, ?, ?, ?, ?, '净水器', ?, ?, 'flow', 'pending', '0', NOW())");
                $stmt->execute([$bc, $bc, $imei, $iccid, $mc, $brand, $deviceModel]);

                // IOT注册
                if ($syncToIot) {
                    $iotRes = qiyunIotRequest('/deviceController/addBoard', [
                        'boardCode' => $bc, 'imei' => $imei, 'moduleCode' => $mc,
                    ]);
                    // 同步到ddg.app
                    $tappDb = getTappDB();
                    if ($tappDb) {
                        try {
                            $tappDb->prepare("INSERT IGNORE INTO qiyun_devices (board_code, imei, module_code, brand, device_model, status, iot_registered, billing_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 1, 'flow', NOW(), NOW())")
                                ->execute([$bc, $imei, $mc, $brand, $deviceModel]);
                        } catch (Exception $e) {}
                    }
                }

                $success[] = ['board_code' => $bc];
            } catch (Exception $e) {
                $failed[] = ['board_code' => $bc, 'reason' => $e->getMessage()];
            }
        }

        echo json_encode([
            'code' => 0,
            'message' => '批量入库完成: 成功' . count($success) . '个, 失败' . count($failed) . '个',
            'data' => ['success' => $success, 'failed' => $failed],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Excel解析 (POST /api/admin/water-purifier/parse-excel)
    if ($path === 'admin/water-purifier/parse-excel' && $method === 'POST') {
        if (!isset($_FILES['file'])) {
            echo json_encode(['code' => 1, 'message' => '请上传文件'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $file = $_FILES['file'];
        $tmpPath = $file['tmp_name'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, ['xlsx', 'xls', 'csv'])) {
            echo json_encode(['code' => 1, 'message' => '仅支持xlsx/xls/csv格式'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 简单CSV解析（如果是xlsx需要额外库，先用CSV做fallback解析）
        $devices = [];
        if ($ext === 'csv') {
            $handle = fopen($tmpPath, 'r');
            $header = fgetcsv($handle); // 跳过表头
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 2) {
                    $devices[] = [
                        'board_code' => trim($row[0] ?? ''),
                        'imei' => trim($row[1] ?? ''),
                        'iccid' => trim($row[2] ?? ''),
                        'module_code' => trim($row[3] ?? 'QY_QN4G'),
                    ];
                }
            }
            fclose($handle);
        } else {
            // 对于xlsx，尝试用zip方式简单解析
            $devices = parseXlsxSimple($tmpPath);
        }

        echo json_encode(['code' => 0, 'data' => ['devices' => $devices]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 注册设备到IOT (POST /api/admin/water-purifier/:id/register-iot)
    if (preg_match('#^admin/water-purifier/(\d+)/register-iot$#', $path, $matches) && $method === 'POST') {
        $db = getDB();
        $deviceId = (int)$matches[1];

        $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ?");
        $stmt->execute([$deviceId]);
        $device = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$device) {
            echo json_encode(['code' => 1, 'message' => '设备不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $boardCode = $device['device_number'] ?: $device['board_code'];
        $imei = $device['imei'];
        $moduleCode = $device['module_code'] ?: 'QY_QN4G';

        if (!$boardCode || !$imei) {
            echo json_encode(['code' => 1, 'message' => '设备缺少主板编码或IMEI'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 调用七云IOT API注册
        $iotResult = qiyunIotRequest('/deviceController/addBoard', [
            'boardCode' => $boardCode, 'imei' => $imei, 'moduleCode' => $moduleCode,
        ]);

        // 同步到ddg.app的qiyun_devices
        $tappDb = getTappDB();
        if ($tappDb) {
            try {
                $tappDb->prepare("INSERT IGNORE INTO qiyun_devices (board_code, imei, module_code, brand, device_model, status, iot_registered, billing_mode, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 1, 'flow', NOW(), NOW())")
                    ->execute([$boardCode, $imei, $moduleCode, $device['brand'] ?? '', $device['device_model'] ?? '']);
            } catch (Exception $e) {}
        }

        $isSuccess = isset($iotResult['code']) && $iotResult['code'] == 0;
        echo json_encode([
            'code' => $isSuccess ? 0 : 1,
            'message' => $isSuccess ? 'IOT注册成功' : ('IOT注册失败: ' . ($iotResult['msg'] ?? '未知错误')),
            'data' => ['iot_result' => $iotResult],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 同步IOT状态 (POST /api/admin/water-purifier/:id/sync-iot)
    if (preg_match('#^admin/water-purifier/(\d+)/sync-iot$#', $path, $matches) && $method === 'POST') {
        $db = getDB();
        $deviceId = (int)$matches[1];

        $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ?");
        $stmt->execute([$deviceId]);
        $device = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$device) {
            echo json_encode(['code' => 1, 'message' => '设备不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $boardCode = $device['device_number'] ?: $device['board_code'];
        $iotResult = qiyunIotRequest('/deviceController/getBoardInfoByCode', ['boardCode' => $boardCode]);

        echo json_encode([
            'code' => 0, 'message' => '同步完成',
            'data' => ['iot_result' => $iotResult],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 修改IMEI (POST /api/admin/water-purifier/:id/update-imei)
    if (preg_match('#^admin/water-purifier/(\d+)/update-imei$#', $path, $matches) && $method === 'POST') {
        $db = getDB();
        $deviceId = (int)$matches[1];
        $newImei = trim($input['imei'] ?? '');
        $syncToIot = (bool)($input['sync_to_iot'] ?? false);

        if (!$newImei) {
            echo json_encode(['code' => 1, 'message' => '请输入新IMEI'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $db->prepare("SELECT * FROM ytb_devices WHERE id = ?");
        $stmt->execute([$deviceId]);
        $device = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$device) {
            echo json_encode(['code' => 1, 'message' => '设备不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 检查新IMEI是否已使用
        $checkStmt = $db->prepare("SELECT id FROM ytb_devices WHERE imei = ? AND id != ?");
        $checkStmt->execute([$newImei, $deviceId]);
        if ($checkStmt->fetch()) {
            echo json_encode(['code' => 1, 'message' => '该IMEI已被其他设备使用'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 更新IMEI
        $db->prepare("UPDATE ytb_devices SET imei = ? WHERE id = ?")->execute([$newImei, $deviceId]);

        // 同步到IOT
        $iotResult = null;
        if ($syncToIot) {
            $boardCode = $device['device_number'] ?: $device['board_code'];
            $iotResult = qiyunIotRequest('/deviceController/udpateBoard', [
                'boardCode' => $boardCode, 'imei' => $newImei,
            ]);
            // 更新ddg.app
            $tappDb = getTappDB();
            if ($tappDb) {
                try {
                    $tappDb->prepare("UPDATE qiyun_devices SET imei = ?, updated_at = NOW() WHERE board_code = ?")
                        ->execute([$newImei, $boardCode]);
                } catch (Exception $e) {}
            }
        }

        echo json_encode([
            'code' => 0, 'message' => 'IMEI修改成功' . ($syncToIot ? '（已同步IOT）' : ''),
            'data' => ['iot_result' => $iotResult],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 删除设备 (DELETE /api/admin/water-purifier/:id)
    if (preg_match('#^admin/water-purifier/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $db = getDB();
        $deviceId = (int)$matches[1];

        $stmt = $db->prepare("SELECT status FROM ytb_devices WHERE id = ?");
        $stmt->execute([$deviceId]);
        $device = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$device) {
            echo json_encode(['code' => 1, 'message' => '设备不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if ($device['status'] !== 'pending') {
            echo json_encode(['code' => 1, 'message' => '只能删除待激活状态的设备'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $db->prepare("DELETE FROM ytb_devices WHERE id = ?")->execute([$deviceId]);
        echo json_encode(['code' => 0, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ========== 用户预约安装与工单 API ==========
    function ensureInstallTables($db) {
        $db->exec("CREATE TABLE IF NOT EXISTS ytb_install_orders (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_no VARCHAR(32) NOT NULL UNIQUE,
            user_id BIGINT UNSIGNED NOT NULL,
            contact_name VARCHAR(50) NOT NULL,
            contact_phone VARCHAR(20) NOT NULL,
            province VARCHAR(50) DEFAULT NULL,
            city VARCHAR(50) DEFAULT NULL,
            district VARCHAR(50) DEFAULT NULL,
            address VARCHAR(500) NOT NULL,
            preferred_date DATE DEFAULT NULL,
            preferred_time VARCHAR(50) DEFAULT NULL,
            remark TEXT DEFAULT NULL,
            install_fee DECIMAL(10,2) NOT NULL DEFAULT 120.00,
            payment_status ENUM('pending','paid','refunded') DEFAULT 'pending',
            paid_at TIMESTAMP NULL DEFAULT NULL,
            status ENUM('pending','paid','assigned','accepted','picked','installing','completed','cancelled') DEFAULT 'pending',
            engineer_id BIGINT UNSIGNED DEFAULT NULL,
            assigned_at TIMESTAMP NULL DEFAULT NULL,
            accepted_at TIMESTAMP NULL DEFAULT NULL,
            board_code VARCHAR(50) DEFAULT NULL,
            picked_at TIMESTAMP NULL DEFAULT NULL,
            installed_at TIMESTAMP NULL DEFAULT NULL,
            accessory_order_id BIGINT UNSIGNED DEFAULT NULL,
            water_test_id BIGINT UNSIGNED DEFAULT NULL,
            accessory_paid TINYINT(1) NOT NULL DEFAULT 0,
            test_completed TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(user_id),
            INDEX(status),
            INDEX(engineer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='水净器安装工单表'");

        $db->exec("CREATE TABLE IF NOT EXISTS ytb_accessory_orders (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_no VARCHAR(32) NOT NULL UNIQUE,
            install_order_id BIGINT UNSIGNED NOT NULL,
            engineer_id BIGINT UNSIGNED NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            items JSON NOT NULL,
            total_amount DECIMAL(10,2) NOT NULL,
            payment_status ENUM('pending','paid') DEFAULT 'pending',
            paid_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(install_order_id),
            INDEX(user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='安装配件订单表'");

        $db->exec("CREATE TABLE IF NOT EXISTS ytb_water_tests (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            install_order_id BIGINT UNSIGNED NOT NULL,
            engineer_id BIGINT UNSIGNED NOT NULL,
            tds_before INT DEFAULT NULL,
            tds_after INT DEFAULT NULL,
            tds_photo VARCHAR(500) DEFAULT NULL,
            electrolysis_before_color VARCHAR(50) DEFAULT NULL,
            electrolysis_after_color VARCHAR(50) DEFAULT NULL,
            electrolysis_photo VARCHAR(500) DEFAULT NULL,
            chlorine_before DECIMAL(5,2) DEFAULT NULL,
            chlorine_after DECIMAL(5,2) DEFAULT NULL,
            chlorine_photo VARCHAR(500) DEFAULT NULL,
            conclusion TEXT DEFAULT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(install_order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='水质检测报告表'");
    }
    
    // 获取当前用户ID帮助函数
    function getYtbUserIdFromToken() {
        $jwt = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (strpos($jwt, 'Bearer ') === 0) $jwt = substr($jwt, 7);
        if (!$jwt) return null;
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) return null;
        $payload = json_decode(base64_decode($parts[1]), true);
        return $payload['user_id'] ?? null;
    }

    // 1. 创建预约工单 (POST /api/ytb/install/orders)
    if ($path === 'ytb/install/orders' && $method === 'POST') {
        $userId = getYtbUserIdFromToken() ?: 0;

        
        $db = getDB();
        ensureInstallTables($db);
        
        $orderNo = 'INS' . date('YmdHis') . rand(1000, 9999);
        $contactName = $input['contact_name'] ?? '';
        $contactPhone = $input['contact_phone'] ?? '';
        $province = $input['province'] ?? '';
        $city = $input['city'] ?? '';
        $district = $input['district'] ?? '';
        $address = $input['address'] ?? '';
        $remark = $input['remark'] ?? '';
        
        if (!$contactName || !$contactPhone || !$address) {
            echo json_encode(['code' => 1, 'message' => '缺少必填信息']); exit;
        }

        $stmt = $db->prepare("INSERT INTO ytb_install_orders 
            (order_no, user_id, contact_name, contact_phone, province, city, district, address, remark, install_fee)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 120.00)");
        $stmt->execute([$orderNo, $userId, $contactName, $contactPhone, $province, $city, $district, $address, $remark]);
        
        echo json_encode(['code' => 0, 'data' => ['id' => $db->lastInsertId(), 'order_no' => $orderNo]]);
        exit;
    }

    // 2. 获取用户的工单列表 (GET /api/ytb/install/orders)
    if ($path === 'ytb/install/orders' && $method === 'GET') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        ensureInstallTables($db);
        
        $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$userId]);
        echo json_encode(['code' => 0, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // 3. 获取工单详情 (GET /api/ytb/install/orders/:id)
    if (preg_match('#^ytb/install/orders/(\d+)$#', $path, $matches) && $method === 'GET') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        ensureInstallTables($db);
        $id = $matches[1];
        
        $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) { echo json_encode(['code' => 1, 'message' => '工单不存在']); exit; }
        
        // 抓取配件
        if ($order['accessory_order_id']) {
            $stmt2 = $db->prepare("SELECT * FROM ytb_accessory_orders WHERE id = ?");
            $stmt2->execute([$order['accessory_order_id']]);
            $order['accessory'] = $stmt2->fetch(PDO::FETCH_ASSOC);
            if ($order['accessory'] && is_string($order['accessory']['items'])) {
                $order['accessory']['items'] = json_decode($order['accessory']['items'], true);
            }
        }
        
        // 抓取水质测试
        if ($order['water_test_id']) {
            $stmt3 = $db->prepare("SELECT * FROM ytb_water_tests WHERE id = ?");
            $stmt3->execute([$order['water_test_id']]);
            $order['water_test'] = $stmt3->fetch(PDO::FETCH_ASSOC);
        }

        echo json_encode(['code' => 0, 'data' => $order]);
        exit;
    }

    // 4. 用户模拟支付安装预付费 (POST /api/ytb/install/orders/:id/pay)
    if (preg_match('#^ytb/install/orders/(\d+)/pay$#', $path, $matches) && $method === 'POST') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        
        $stmt = $db->prepare("UPDATE ytb_install_orders SET status = 'paid', payment_status = 'paid', paid_at = NOW() WHERE id = ? AND user_id = ? AND status = 'pending'");
        $stmt->execute([$id, $userId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['code' => 0, 'message' => '支付成功']);
        } else {
            echo json_encode(['code' => 1, 'message' => '状态异常或工单不存在']);
        }
        exit;
    }

    // 4.5 用户激活设备并支付套餐 (POST /api/ytb/install/orders/:id/activate)
    if (preg_match('#^ytb/install/orders/(\d+)/activate$#', $path, $matches) && $method === 'POST') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        $packageType = $input['package_type'] ?? '';
        
        // 此处应当校验套餐存在并且完成实际扣款。演示中省略。
        $stmt = $db->prepare("UPDATE ytb_install_orders SET status = 'activated', package_type = ?, activated_at = NOW() WHERE id = ? AND user_id = ? AND status = 'completed'");
        $stmt->execute([$packageType, $id, $userId]);
        
        if ($stmt->rowCount() > 0) {
            // 获取工单详情用于创建设备
            $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE id = ?");
            $stmt->execute([$id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            // 在实际系统中，这应该调用设备的IOT接口去下发激活指令（下发水耗和时间）
            // 目前将工单写入设备表，并配置模拟初值
            $db->exec("CREATE TABLE IF NOT EXISTS ytb_devices (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                board_code VARCHAR(50) NOT NULL UNIQUE,
                device_model VARCHAR(50) DEFAULT NULL,
                product_image VARCHAR(500) DEFAULT NULL,
                billing_mode ENUM('flow','duration') DEFAULT 'flow',
                surplus_flow INT DEFAULT 0,
                remaining_days INT DEFAULT 0,
                is_online TINYINT(1) DEFAULT 1,
                has_fault TINYINT(1) DEFAULT 0,
                fault_type VARCHAR(100) DEFAULT NULL,
                filter_life INT DEFAULT 100,
                address VARCHAR(255) DEFAULT NULL,
                brand VARCHAR(50) DEFAULT '万达',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX(user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备绑定表'");
            
            // 写入设备表
            try {
                $billingMode = strpos($packageType, 'traffic') !== false ? 'flow' : 'duration';
                $surplusFlow = $billingMode === 'flow' ? 4000 : 0;
                $remainingDays = $billingMode === 'duration' ? 365 : 0;
                
                $stmt = $db->prepare("INSERT INTO ytb_devices (user_id, board_code, billing_mode, surplus_flow, remaining_days, address) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE billing_mode=VALUES(billing_mode), surplus_flow=surplus_flow+VALUES(surplus_flow), remaining_days=remaining_days+VALUES(remaining_days)");
                $stmt->execute([$userId, $order['board_code'], $billingMode, $surplusFlow, $remainingDays, $order['install_address']]);
            } catch (Exception $e) {
                // Ignore uniqueness conflict if the board_code was already there somehow
            }

            echo json_encode(['code' => 0, 'message' => '激活成功，设备已开启工作']);
        } else {
            echo json_encode(['code' => 1, 'message' => '状态异常或未能激活']);
        }
        exit;
    }

    // ============================================
    // 工程师端 API (/api/ytb/engineer/...)
    // (需校验如果是工程师角色，此示例为了让演示能跑，暂且把当前登录用户当工程师)
    // ============================================

    // 5. 工程师获取可接单与自己的工单 (GET /api/ytb/engineer/orders)
    if (($path === 'ytb/engineer/orders' || $path === 'ytb/engineer/orders/') && $method === 'GET') {
        $engineerId = getYtbUserIdFromToken();
        if (!$engineerId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        ensureInstallTables($db);
        
        $type = $_GET['type'] ?? 'my'; // available, my (默认获取自己的工单)
        $status = $_GET['status'] ?? 'all';
        
        if ($type === 'available') {
            $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE status = 'paid' ORDER BY id DESC");
            $stmt->execute();
        } else {
            if ($status !== 'all' && $status) {
                // 如果传入 DDG 状态，可以映射。但这里直接支持 YTB 字符串
                if ($status === 'processing') {
                    $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE engineer_id = ? AND status IN ('accepted', 'picked', 'installing') ORDER BY id DESC");
                } else if ($status === 'pending') {
                    $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE engineer_id = ? AND status = 'paid' ORDER BY id DESC");
                } else {
                    $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE engineer_id = ? AND status = ? ORDER BY id DESC");
                }
                if ($status === 'processing' || $status === 'pending') {
                    $stmt->execute([$engineerId]);
                } else {
                    $stmt->execute([$engineerId, $status]);
                }
            } else {
                $stmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE engineer_id = ? ORDER BY id DESC");
                $stmt->execute([$engineerId]);
            }
        }
        
        echo json_encode(['code' => 0, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        exit;
    }

    // 6. 工程师接单 (POST /api/ytb/engineer/orders/:id/accept)
    if (preg_match('#^ytb/engineer/orders/(\d+)/accept$#', $path, $matches) && $method === 'POST') {
        $engineerId = getYtbUserIdFromToken();
        if (!$engineerId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        
        $stmt = $db->prepare("UPDATE ytb_install_orders SET status = 'accepted', engineer_id = ?, assigned_at = NOW(), accepted_at = NOW() WHERE id = ? AND status = 'paid'");
        $stmt->execute([$engineerId, $id]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['code' => 0, 'message' => '接单成功']);
        } else {
            echo json_encode(['code' => 1, 'message' => '该工单已被接走或状态异常']);
        }
        exit;
    }

    // 7. 工程师扫码领机 (POST /api/ytb/engineer/orders/:id/pick)
    if (preg_match('#^ytb/engineer/orders/(\d+)/pick$#', $path, $matches) && $method === 'POST') {
        $engineerId = getYtbUserIdFromToken();
        if (!$engineerId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        $boardCode = $input['board_code'] ?? '';
        
        if (!$boardCode) { echo json_encode(['code' => 1, 'message' => '请填写/扫描主板编码']); exit; }
        
        $stmt = $db->prepare("UPDATE ytb_install_orders SET status = 'picked', board_code = ?, picked_at = NOW() WHERE id = ? AND engineer_id = ? AND status IN ('accepted', 'picked')");
        $stmt->execute([$boardCode, $id, $engineerId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['code' => 0, 'message' => '领机成功']);
        } else {
            echo json_encode(['code' => 1, 'message' => '状态异常或无权限']);
        }
        exit;
    }

    // 8. 开始安装/设置配件与费用 (POST /api/ytb/engineer/orders/:id/accessories)
    if (preg_match('#^ytb/engineer/orders/(\d+)/accessories$#', $path, $matches) && $method === 'POST') {
        $engineerId = getYtbUserIdFromToken();
        if (!$engineerId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        $items = $input['items'] ?? []; // [{name, price, num}]
        
        $orderStmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE id = ? AND engineer_id = ?");
        $orderStmt->execute([$id, $engineerId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) { echo json_encode(['code' => 1, 'message' => '工单不存在或无权限']); exit; }
        
        $totalAmount = 0;
        foreach ($items as $item) { $totalAmount += ($item['price'] * $item['quantity']); }
        
        $accOrderNo = 'ACC' . date('YmdHis') . rand(1000, 9999);
        
        // 插入或更新配件单
        if ($order['accessory_order_id']) {
            $db->prepare("UPDATE ytb_accessory_orders SET items = ?, total_amount = ? WHERE id = ?")
               ->execute([json_encode($items, JSON_UNESCAPED_UNICODE), $totalAmount, $order['accessory_order_id']]);
        } else {
            $db->prepare("INSERT INTO ytb_accessory_orders (order_no, install_order_id, engineer_id, user_id, items, total_amount) VALUES (?, ?, ?, ?, ?, ?)")
               ->execute([$accOrderNo, $id, $engineerId, $order['user_id'], json_encode($items, JSON_UNESCAPED_UNICODE), $totalAmount]);
            $accId = $db->lastInsertId();
            $db->prepare("UPDATE ytb_install_orders SET accessory_order_id = ? WHERE id = ?")->execute([$accId, $id]);
        }
        
        // 如果开始安装，将状态变为 installing
        if ($order['status'] === 'picked') {
            $db->prepare("UPDATE ytb_install_orders SET status = 'installing' WHERE id = ?")->execute([$id]);
        }
        
        echo json_encode(['code' => 0, 'message' => '配件事项已提交，请客户确认付款']);
        exit;
    }

    // 9. 用户确认并模拟支付配件费 (POST /api/ytb/install/orders/:id/accessory-pay)
    if (preg_match('#^ytb/install/orders/(\d+)/accessory-pay$#', $path, $matches) && $method === 'POST') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        
        $orderStmt = $db->prepare("SELECT accessory_order_id FROM ytb_install_orders WHERE id = ? AND user_id = ?");
        $orderStmt->execute([$id, $userId]);
        $accId = $orderStmt->fetchColumn();
        
        if (!$accId) { echo json_encode(['code' => 1, 'message' => '无未支付配件订单']); exit; }
        
        $db->prepare("UPDATE ytb_accessory_orders SET payment_status = 'paid', paid_at = NOW() WHERE id = ? AND payment_status = 'pending'")->execute([$accId]);
        $db->prepare("UPDATE ytb_install_orders SET accessory_paid = 1 WHERE id = ?")->execute([$id]);
        
        echo json_encode(['code' => 0, 'message' => '配件费支付成功']);
        exit;
    }

    // 10. 工程师提交水质检测 (POST /api/ytb/engineer/orders/:id/tests)
    if (preg_match('#^ytb/engineer/orders/(\d+)/tests$#', $path, $matches) && $method === 'POST') {
        $engineerId = getYtbUserIdFromToken();
        if (!$engineerId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        
        $tdsBefore = $input['tds_before'] ?? 0;
        $tdsAfter = $input['tds_after'] ?? 0;
        $elecBefore = $input['electrolysis_before_color'] ?? '';
        $elecAfter = $input['electrolysis_after_color'] ?? '';
        $chlorBefore = $input['chlorine_before'] ?? 0;
        $chlorAfter = $input['chlorine_after'] ?? 0;
        $photos = $input['photos'] ?? []; // url array
        $photoStr = implode(',', $photos);
        
        $orderStmt = $db->prepare("SELECT * FROM ytb_install_orders WHERE id = ? AND engineer_id = ?");
        $orderStmt->execute([$id, $engineerId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) { echo json_encode(['code' => 1, 'message' => '工单不存在或无权限']); exit; }
        
        if ($order['water_test_id']) {
            $db->prepare("UPDATE ytb_water_tests SET tds_before=?, tds_after=?, electrolysis_before_color=?, electrolysis_after_color=?, chlorine_before=?, chlorine_after=?, tds_photo=? WHERE id=?")
               ->execute([$tdsBefore, $tdsAfter, $elecBefore, $elecAfter, $chlorBefore, $chlorAfter, $photoStr, $order['water_test_id']]);
        } else {
            $db->prepare("INSERT INTO ytb_water_tests (install_order_id, engineer_id, tds_before, tds_after, electrolysis_before_color, electrolysis_after_color, chlorine_before, chlorine_after, tds_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
               ->execute([$id, $engineerId, $tdsBefore, $tdsAfter, $elecBefore, $elecAfter, $chlorBefore, $chlorAfter, $photoStr]);
            $testId = $db->lastInsertId();
            $db->prepare("UPDATE ytb_install_orders SET water_test_id = ?, test_completed = 1 WHERE id = ?")->execute([$testId, $id]);
        }
        
        echo json_encode(['code' => 0, 'message' => '水质检测提交成功']);
        exit;
    }

    // 11. 用户确认测试结果并完成安装单 (POST /api/ytb/install/orders/:id/confirm)
    if (preg_match('#^ytb/install/orders/(\d+)/confirm$#', $path, $matches) && $method === 'POST') {
        $userId = getYtbUserIdFromToken();
        if (!$userId) { echo json_encode(['code' => 401, 'message' => '未登录']); exit; }
        
        $db = getDB();
        $id = $matches[1];
        
        $db->prepare("UPDATE ytb_install_orders SET status = 'completed', installed_at = NOW() WHERE id = ? AND user_id = ?")->execute([$id, $userId]);
        
        echo json_encode(['code' => 0, 'message' => '服务已确认，由于设备已安装完毕，请扫码绑定设备并购买套餐']);
        exit;
    }

    // ========== 套餐管理 API ==========

    // 自动建表函数（与点点够 qiyun_packages 表结构对齐）
    function ensurePackagesTable($db) {
        $db->exec("CREATE TABLE IF NOT EXISTS ytb_packages (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL COMMENT '套餐名称',
            code VARCHAR(50) NOT NULL COMMENT '套餐编码',
            description TEXT COMMENT '套餐描述',
            type ENUM('flow','yearly','deposit') NOT NULL COMMENT '类型: flow(流量)/yearly(包年)/deposit(押金)',
            price DECIMAL(10,2) NOT NULL COMMENT '售价(元)',
            original_price DECIMAL(10,2) DEFAULT NULL COMMENT '原价(元)',
            flow_limit INT DEFAULT NULL COMMENT '流量上限(升)',
            days INT DEFAULT NULL COMMENT '有效期(天)',
            unit_price DECIMAL(6,2) DEFAULT NULL COMMENT '单价(元/升)',
            is_first_only TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否仅限首次购买',
            is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
            sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
            brand VARCHAR(50) DEFAULT NULL COMMENT '适用品牌',
            device_model VARCHAR(50) DEFAULT NULL COMMENT '适用型号',
            billing_mode VARCHAR(20) DEFAULT 'prepaid' COMMENT '计费方式: prepaid(预付)/postpaid(后付)',
            is_renewal_only TINYINT(1) DEFAULT 0 COMMENT '是否仅限续费',
            commission_rate DECIMAL(5,2) DEFAULT 30 COMMENT '提成比例(%)',
            commission_amount DECIMAL(10,2) DEFAULT 0 COMMENT '提成金额(元)',
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='净水器套餐表(同步点点够qiyun_packages)'");

        // 检查是否需要预置种子数据（与点点够系统完全一致）
        $count = (int)$db->query("SELECT COUNT(*) FROM ytb_packages")->fetchColumn();
        if ($count === 0) {
            $db->exec("INSERT INTO ytb_packages (name, code, description, type, price, original_price, flow_limit, days, unit_price, is_first_only, is_active, sort_order, brand, device_model, billing_mode, is_renewal_only, commission_rate, commission_amount) VALUES
                ('4000L流量套餐', 'JZQ_XBD_FLOW_4000', '净之泉小扁豆专用，4000升水', 'flow', 980.00, 1200.00, 4000, NULL, NULL, 0, 1, 1, '净之泉', '小扁豆', 'prepaid', 0, 30, 294.00),
                ('包年不限量套餐', 'JZQ_XBD_YEARLY', '净之泉小扁豆专用，一年内不限流量', 'yearly', 1200.00, 1500.00, NULL, 365, NULL, 0, 1, 2, '净之泉', '小扁豆', 'prepaid', 0, 30, 360.00),
                ('包年不限量套餐', 'JZQ_SWJ_YEARLY', '净之泉商务机专用，一年内不限流量', 'yearly', 2400.00, 2800.00, NULL, 365, NULL, 0, 1, 3, '净之泉', '商务机', 'prepaid', 0, 30, 720.00),
                ('4000L流量套餐', 'HM_TL_FLOW_4000', '华迈屠龙专用，4000升水', 'flow', 980.00, 1200.00, 4000, NULL, NULL, 0, 1, 4, '华迈', '屠龙', 'prepaid', 0, 30, 294.00),
                ('包年不限量套餐', 'HM_TL_YEARLY', '华迈屠龙专用，一年内不限流量', 'yearly', 1200.00, 1500.00, NULL, 365, NULL, 0, 1, 5, '华迈', '屠龙', 'prepaid', 0, 30, 360.00),
                ('包年不限量套餐', 'HM_DBD_YEARLY', '华迈大扁豆专用，一年内不限流量', 'yearly', 1500.00, 1800.00, NULL, 365, NULL, 0, 1, 6, '华迈', '大扁豆', 'prepaid', 0, 30, 450.00),
                ('10桶流量包', 'PREPAY_180L', '180L流量包（约10桶），0.3元/L，可购买多份', 'flow', 54.00, NULL, 180, NULL, 0.30, 0, 1, 10, NULL, NULL, NULL, 1, 30, 16.20),
                ('4000L流量套餐', 'flow_4000', '净之泉大扁豆专用，4000升水', 'flow', 980.00, 980.00, 4000, NULL, 0.25, 0, 1, 7, '净之泉', '大扁豆', 'prepaid', 0, 30, 294.00),
                ('包年不限量套餐', 'yearly_unlimited', '净之泉大扁豆专用，一年内不限流量', 'yearly', 1200.00, 1200.00, NULL, 365, NULL, 0, 1, 8, '净之泉', '大扁豆', 'prepaid', 0, 30, 360.00)
            ");
        }
    }

    // 管理后台 - 套餐列表 (GET /api/admin/water-purifier/packages)
    if ($path === 'admin/water-purifier/packages' && $method === 'GET') {
        $db = getDB();
        ensurePackagesTable($db);

        $where = [];
        $params = [];

        if (!empty($_GET['brand'])) {
            $where[] = "brand = ?";
            $params[] = $_GET['brand'];
        }
        if (!empty($_GET['device_model'])) {
            $where[] = "device_model = ?";
            $params[] = $_GET['device_model'];
        }
        if (!empty($_GET['type'])) {
            $where[] = "type = ?";
            $params[] = $_GET['type'];
        }
        if (isset($_GET['is_active']) && $_GET['is_active'] !== '') {
            $where[] = "is_active = ?";
            $params[] = (int)$_GET['is_active'];
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT * FROM ytb_packages $whereClause ORDER BY sort_order ASC, id ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 类型转换
        foreach ($list as &$item) {
            $item['id'] = (int)$item['id'];
            $item['price'] = (float)$item['price'];
            $item['original_price'] = $item['original_price'] !== null ? (float)$item['original_price'] : null;
            $item['flow_limit'] = $item['flow_limit'] !== null ? (int)$item['flow_limit'] : null;
            $item['days'] = $item['days'] !== null ? (int)$item['days'] : null;
            $item['unit_price'] = $item['unit_price'] !== null ? (float)$item['unit_price'] : null;
            $item['commission_rate'] = (float)$item['commission_rate'];
            $item['commission_amount'] = (float)$item['commission_amount'];
            $item['sort_order'] = (int)$item['sort_order'];
            $item['is_active'] = (bool)$item['is_active'];
            $item['is_first_only'] = (bool)$item['is_first_only'];
            $item['is_renewal_only'] = (bool)$item['is_renewal_only'];
        }
        unset($item);

        echo json_encode(['code' => 0, 'data' => $list], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 管理后台 - 新增套餐 (POST /api/admin/water-purifier/packages)
    if ($path === 'admin/water-purifier/packages' && $method === 'POST') {
        $db = getDB();
        ensurePackagesTable($db);

        $name = trim($input['name'] ?? '');
        $code = trim($input['code'] ?? '');
        if (!$name) {
            echo json_encode(['code' => 400, 'message' => '套餐名称不能为空'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (!$code) {
            // 自动生成编码
            $code = strtoupper(uniqid('PKG_'));
        }

        $type = $input['type'] ?? 'flow';
        $price = (float)($input['price'] ?? 0);
        $originalPrice = isset($input['original_price']) ? (float)$input['original_price'] : null;
        $flowLimit = isset($input['flow_limit']) ? (int)$input['flow_limit'] : null;
        $days = isset($input['days']) ? (int)$input['days'] : null;
        $unitPrice = isset($input['unit_price']) ? (float)$input['unit_price'] : null;
        $isFirstOnly = (int)($input['is_first_only'] ?? 0);
        $isActive = isset($input['is_active']) ? ($input['is_active'] ? 1 : 0) : 1;
        $sortOrder = (int)($input['sort_order'] ?? 0);
        $brand = $input['brand'] ?? null;
        $deviceModel = $input['device_model'] ?? null;
        $billingMode = $input['billing_mode'] ?? 'prepaid';
        $isRenewalOnly = (int)($input['is_renewal_only'] ?? 0);
        $commissionRate = (float)($input['commission_rate'] ?? 30);
        $commissionAmount = (float)($input['commission_amount'] ?? round($price * $commissionRate / 100, 2));
        $description = trim($input['description'] ?? '');

        $stmt = $db->prepare("INSERT INTO ytb_packages (name, code, description, type, price, original_price, flow_limit, days, unit_price, is_first_only, is_active, sort_order, brand, device_model, billing_mode, is_renewal_only, commission_rate, commission_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $code, $description, $type, $price, $originalPrice, $flowLimit, $days, $unitPrice, $isFirstOnly, $isActive, $sortOrder, $brand, $deviceModel, $billingMode, $isRenewalOnly, $commissionRate, $commissionAmount]);

        echo json_encode(['code' => 0, 'message' => '创建成功', 'data' => ['id' => (int)$db->lastInsertId()]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 管理后台 - 修改套餐 (PUT /api/admin/water-purifier/packages/:id)
    if (preg_match('#^admin/water-purifier/packages/(\d+)$#', $path, $matches) && $method === 'PUT') {
        $db = getDB();
        ensurePackagesTable($db);
        $id = (int)$matches[1];

        $sets = [];
        $params = [];
        $allowedFields = ['name', 'code', 'description', 'type', 'price', 'original_price', 'flow_limit', 'days', 'unit_price', 'brand', 'device_model', 'billing_mode', 'sort_order', 'commission_rate', 'commission_amount'];
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $sets[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        if (isset($input['is_active'])) {
            $sets[] = "is_active = ?";
            $params[] = $input['is_active'] ? 1 : 0;
        }
        if (isset($input['is_first_only'])) {
            $sets[] = "is_first_only = ?";
            $params[] = $input['is_first_only'] ? 1 : 0;
        }
        if (isset($input['is_renewal_only'])) {
            $sets[] = "is_renewal_only = ?";
            $params[] = $input['is_renewal_only'] ? 1 : 0;
        }

        // 如果修改了价格或提成比例，自动重新计算提成金额
        if ((isset($input['price']) || isset($input['commission_rate'])) && !isset($input['commission_amount'])) {
            $stmt = $db->prepare("SELECT price, commission_rate FROM ytb_packages WHERE id = ?");
            $stmt->execute([$id]);
            $old = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($old) {
                $newPrice = isset($input['price']) ? (float)$input['price'] : (float)$old['price'];
                $newRate = isset($input['commission_rate']) ? (float)$input['commission_rate'] : (float)$old['commission_rate'];
                $sets[] = "commission_amount = ?";
                $params[] = round($newPrice * $newRate / 100, 2);
            }
        }

        if (empty($sets)) {
            echo json_encode(['code' => 400, 'message' => '没有要更新的字段'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $params[] = $id;
        $sql = "UPDATE ytb_packages SET " . implode(', ', $sets) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        echo json_encode(['code' => 0, 'message' => '更新成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 管理后台 - 删除套餐 (DELETE /api/admin/water-purifier/packages/:id)
    if (preg_match('#^admin/water-purifier/packages/(\d+)$#', $path, $matches) && $method === 'DELETE') {
        $db = getDB();
        $id = (int)$matches[1];

        $stmt = $db->prepare("DELETE FROM ytb_packages WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['code' => 0, 'message' => '删除成功'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 管理后台 - 设备套餐订单列表 (GET /api/admin/device-package-orders)
    if ($path === 'admin/device-package-orders' && $method === 'GET') {
        try {
            $db = getDB();
            $tappDb = getTappDB();
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;

            $billingMode = isset($_GET['billing_mode']) ? trim($_GET['billing_mode']) : '';
            $statusFilter = isset($_GET['status']) ? trim($_GET['status']) : '';
            $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

            // 获取已激活/已安装设备（激活过的）
            $where = ["d.status IN ('activated', 'installed')"];
            $params = [];

            if ($billingMode === 'flow') {
                $where[] = "d.billing_mode = 'flow'";
            } elseif ($billingMode === 'time') {
                $where[] = "d.billing_mode = 'time'";
            }

            if ($keyword !== '') {
                $where[] = "(d.board_code LIKE ? OR d.device_number LIKE ? OR d.client_address LIKE ?)";
                $params[] = '%' . $keyword . '%';
                $params[] = '%' . $keyword . '%';
                $params[] = '%' . $keyword . '%';
            }

            $whereClause = 'WHERE ' . implode(' AND ', $where);

            // 从qiyun获取实时套餐数据
            $qiyunData = [];
            $onlineCodes = [];
            $heartbeatMap = [];
            $qiyunSurplusFlow = [];
            $qiyunServiceEnd = [];
            if ($tappDb) {
                $qiyunStmt = $tappDb->query("SELECT board_code, billing_mode, surplus_flow, service_start_date, service_end_date, last_sync_at FROM qiyun_devices");
                while ($q = $qiyunStmt->fetch(PDO::FETCH_ASSOC)) {
                    $bc = $q['board_code'];
                    $qiyunData[$bc] = $q;
                    // 在线判断：5分钟内有心跳
                    if ($q['last_sync_at'] && strtotime($q['last_sync_at']) >= strtotime('-5 minutes')) {
                        $onlineCodes[] = $bc;
                    }
                    $heartbeatMap[$bc] = $q['last_sync_at'];
                    $qiyunSurplusFlow[$bc] = $q['surplus_flow'];
                    $qiyunServiceEnd[$bc] = $q['service_end_date'];
                }
            }

            // 统计（从ytb_devices）
            $statsSql = "SELECT
                COUNT(*) as total,
                SUM(CASE WHEN d.billing_mode = 'flow' THEN 1 ELSE 0 END) as flow_count,
                SUM(CASE WHEN d.billing_mode = 'time' THEN 1 ELSE 0 END) as time_count
                FROM ytb_devices d $whereClause";
            $statsStmt = $db->prepare($statsSql);
            $statsStmt->execute($params);
            $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

            // 在线设备数
            $onlineCount = 0;
            $lowWarning = 0;

            // 过滤在线状态
            if ($statusFilter === 'online') {
                $onlineCodesFiltered = array_filter($onlineCodes);
                if (!empty($onlineCodesFiltered)) {
                    $where[] = "d.board_code IN ('" . implode("','", $onlineCodesFiltered) . "')";
                } else {
                    $where[] = "1=0"; // 没有在线设备
                }
            } elseif ($statusFilter === 'offline') {
                $offlineCodes = array_diff(array_keys($qiyunData), $onlineCodes);
                if (!empty($offlineCodes)) {
                    $where[] = "(d.board_code NOT IN ('" . implode("','", array_map('strval', array_filter($offlineCodes))) . "') OR d.board_code IS NULL)";
                } else {
                    $where[] = "1=1"; // 全部在线但要求离线时显示空
                }
            }
            $whereClause = 'WHERE ' . implode(' AND ', $where);

            // 总数
            $countSql = "SELECT COUNT(*) FROM ytb_devices d $whereClause";
            $countStmt = $db->prepare($countSql);
            $countStmt->execute($params);
            $total = (int)$countStmt->fetchColumn();

            // 列表
            $listSql = "SELECT d.* FROM ytb_devices d $whereClause ORDER BY d.id DESC LIMIT $limit OFFSET $offset";
            $listStmt = $db->prepare($listSql);
            $listStmt->execute($params);
            $list = $listStmt->fetchAll(PDO::FETCH_ASSOC);

            // 获取用户信息
            $userIds = array_filter(array_column($list, 'ytb_user_id'));
            $userMap = [];
            if (!empty($userIds)) {
                $up = implode(',', array_fill(0, count($userIds), '?'));
                $userStmt = $db->prepare("SELECT id, nickname, phone FROM ytb_users WHERE id IN ($up)");
                $userStmt->execute(array_values($userIds));
                while ($u = $userStmt->fetch(PDO::FETCH_ASSOC)) {
                    $userMap[$u['id']] = $u;
                }
            }

            // 重新计算在线状态和预警
            $onlineCodesSet = array_flip($onlineCodes);
            foreach ($list as &$d) {
                $bc = $d['board_code'];
                $uid = $d['ytb_user_id'];

                // 用户信息
                if (isset($userMap[$uid])) {
                    $d['user_name'] = $userMap[$uid]['nickname'];
                    $d['user_phone'] = $userMap[$uid]['phone'] ?? '';
                } else {
                    $d['user_name'] = $d['client_name'] ?? '';
                    $d['user_phone'] = $d['client_phone'] ?? '';
                }

                // 在线状态
                $d['is_online'] = isset($onlineCodesSet[$bc]);
                $d['last_heartbeat'] = $heartbeatMap[$bc] ?? null;

                // 套餐剩余量（从qiyun实时获取）
                $d['surplus_flow'] = isset($qiyunSurplusFlow[$bc]) ? (float)$qiyunSurplusFlow[$bc] : (float)($d['surplus_flow'] ?? 0);
                $serviceEndDate = $qiyunServiceEnd[$bc] ?? $d['service_end_date'] ?? null;
                $d['service_end_date'] = $serviceEndDate;

                // 计算剩余天数
                $d['remaining_days'] = 0;
                if ($serviceEndDate) {
                    $end = strtotime($serviceEndDate);
                    $now = time();
                    $d['remaining_days'] = max(0, ceil(($end - $now) / 86400));
                }

                // 低量预警
                if ($d['is_online']) {
                    if ($d['billing_mode'] === 'flow' && $d['surplus_flow'] < 500) {
                        $lowWarning++;
                    } elseif ($d['billing_mode'] === 'time' && $d['remaining_days'] < 30) {
                        $lowWarning++;
                    }
                }
            }
            unset($d);

            $onlineCount = count(array_filter($list, fn($d) => $d['is_online']));

            echo json_encode([
                'code' => 0,
                'data' => [
                    'list' => $list,
                    'total' => $total,
                    'stats' => [
                        'total' => (int)($stats['total'] ?? 0),
                        'flow_count' => (int)($stats['flow_count'] ?? 0),
                        'duration_count' => (int)($stats['time_count'] ?? 0),
                        'online' => $onlineCount,
                        'low_warning' => $lowWarning
                    ]
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            error_log("device-package-orders error: " . $e->getMessage());
            echo json_encode(['code' => 500, 'message' => '服务器错误: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // 管理后台 - 安装订单列表 (GET /api/admin/water-purifier/install-orders)
    if ($path === 'admin/water-purifier/install-orders' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $pageSize = min(100, max(1, intval($_GET['per_page'] ?? 15)));
        $offset = ($page - 1) * $pageSize;

        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

        $db = getDB();

        $where = [];
        $params = [];

        if ($status !== '') {
            $where[] = "status = ?";
            $params[] = $status;
        }

        if ($keyword !== '') {
            $where[] = "(order_no LIKE ? OR device_number LIKE ? OR customer_name LIKE ?)";
            $params[] = '%' . $keyword . '%';
            $params[] = '%' . $keyword . '%';
            $params[] = '%' . $keyword . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $countSql = "SELECT COUNT(*) FROM ytb_install_orders $whereClause";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listSql = "SELECT * FROM ytb_install_orders $whereClause ORDER BY id DESC LIMIT $pageSize OFFSET $offset";
        $listStmt = $db->prepare($listSql);
        $listStmt->execute($params);
        $list = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($list as &$item) {
            $item['id'] = (int)$item['id'];
        }
        unset($item);

        echo json_encode([
            'code' => 0,
            'message' => 'ok',
            'data' => [
                'data' => $list,
                'total' => $total,
                'page' => $page,
                'per_page' => $pageSize,
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 管理后台 - 安装订单统计 (GET /api/admin/water-purifier/install-orders/stats)
    if ($path === 'admin/water-purifier/install-orders/stats' && $method === 'GET') {
        $db = getDB();

        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));
        $weekAgo = date('Y-m-d', strtotime('-7 days'));
        $monthAgo = date('Y-m-d', strtotime('-30 days'));

        $stats = [
            'today' => ['amount' => 0, 'count' => 0],
            'yesterday' => ['amount' => 0, 'count' => 0],
            'week' => ['amount' => 0, 'count' => 0],
            'month' => ['amount' => 0, 'count' => 0],
            'total_paid' => ['amount' => 0, 'count' => 0],
            'total' => ['amount' => 0, 'count' => 0],
        ];

        try {
            $periods = [
                'today' => $today,
                'yesterday' => $yesterday,
                'week' => $weekAgo,
                'month' => $monthAgo,
            ];

            foreach ($periods as $key => $startDate) {
                $sql = "SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as amt FROM ytb_install_orders WHERE DATE(created_at) >= ? AND status != 'cancelled'";
                $stmt = $db->prepare($sql);
                $stmt->execute([$startDate]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $stats[$key] = ['amount' => floatval($row['amt'] ?? 0), 'count' => (int)($row['cnt'] ?? 0)];
            }

            $sql = "SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as amt FROM ytb_install_orders WHERE status = 'paid'";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['total_paid'] = ['amount' => floatval($row['amt'] ?? 0), 'count' => (int)($row['cnt'] ?? 0)];

            $sql = "SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as amt FROM ytb_install_orders WHERE status != 'cancelled'";
            $stmt = $db->prepare($sql);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $stats['total'] = ['amount' => floatval($row['amt'] ?? 0), 'count' => (int)($row['cnt'] ?? 0)];
        } catch (Exception $e) {
        }

        echo json_encode(['code' => 0, 'data' => $stats], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 小程序/H5端 - 获取可用套餐列表 (GET /api/ytb/packages)
    if ($path === 'ytb/packages' && $method === 'GET') {
        $db = getDB();
        ensurePackagesTable($db);

        $where = ["is_active = 1"];
        $params = [];

        if (!empty($_GET['brand'])) {
            $where[] = "(brand = ? OR brand IS NULL)";
            $params[] = $_GET['brand'];
        }
        if (!empty($_GET['device_model'])) {
            $where[] = "(device_model = ? OR device_model IS NULL)";
            $params[] = $_GET['device_model'];
        }
        if (!empty($_GET['type'])) {
            $where[] = "type = ?";
            $params[] = $_GET['type'];
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT id, name, code, description, type, price, original_price, flow_limit, days, unit_price, brand, device_model, is_first_only, is_renewal_only FROM ytb_packages $whereClause ORDER BY sort_order ASC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $list = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($list as &$item) {
            $item['id'] = (int)$item['id'];
            $item['price'] = (float)$item['price'];
            $item['original_price'] = $item['original_price'] !== null ? (float)$item['original_price'] : null;
            $item['flow_limit'] = $item['flow_limit'] !== null ? (int)$item['flow_limit'] : null;
            $item['days'] = $item['days'] !== null ? (int)$item['days'] : null;
            $item['unit_price'] = $item['unit_price'] !== null ? (float)$item['unit_price'] : null;
            $item['is_first_only'] = (bool)$item['is_first_only'];
            $item['is_renewal_only'] = (bool)$item['is_renewal_only'];
        }
        unset($item);

        echo json_encode(['code' => 0, 'data' => $list], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 生成小程序码 (GET /api/ytb/miniapp/wxacode?scene=xxx&page=xxx)
    if ($path === 'ytb/miniapp/wxacode' && $method === 'GET') {
        $scene = $_GET['scene'] ?? '';
        $page = $_GET['page'] ?? 'pages/installations/booking';
        
        if (!$scene) {
            echo json_encode(['code' => 1, 'message' => '缺少scene参数'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // 获取小程序 access_token
        $miniAppId = 'wx5643a45f1e914b29';
        $miniSecret = 'd43623e961bd5459f6b3eb1f5130cc30';
        
        // 先尝试从缓存获取
        $db = getDB();
        $cacheKey = 'miniapp_access_token_' . $miniAppId;
        try {
            $db->exec("CREATE TABLE IF NOT EXISTS cache_store (
                cache_key VARCHAR(100) PRIMARY KEY,
                cache_value TEXT,
                expires_at INT
            )");
            $stmt = $db->prepare("SELECT cache_value, expires_at FROM cache_store WHERE cache_key = ?");
            $stmt->execute([$cacheKey]);
            $cached = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($cached && $cached['expires_at'] > time()) {
                $accessToken = $cached['cache_value'];
            }
        } catch (Exception $e) {}

        if (empty($accessToken)) {
            $tokenUrl = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={$miniAppId}&secret={$miniSecret}";
            $tokenRes = wechatApiGetJson($tokenUrl);
            if (!$tokenRes || empty($tokenRes['access_token'])) {
                echo json_encode(['code' => 1, 'message' => '获取access_token失败', 'debug' => $tokenRes], JSON_UNESCAPED_UNICODE);
                exit;
            }
            $accessToken = $tokenRes['access_token'];
            $expiresIn = $tokenRes['expires_in'] ?? 7200;
            // 缓存 token
            try {
                $stmt = $db->prepare("REPLACE INTO cache_store (cache_key, cache_value, expires_at) VALUES (?, ?, ?)");
                $stmt->execute([$cacheKey, $accessToken, time() + $expiresIn - 300]);
            } catch (Exception $e) {}
        }

        // 调用 wxacode.getUnlimited 生成小程序码
        $wxacodeUrl = "https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token={$accessToken}";
        $postData = json_encode([
            'scene' => $scene,
            'page' => $page,
            'width' => 430,
            'auto_color' => false,
            'line_color' => ['r' => 79, 'g' => 70, 'b' => 229],
            'is_hyaline' => false,
            'env_version' => 'trial'  // trial=体验版, release=正式版
        ]);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $wxacodeUrl,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);

        // 如果返回的是图片
        if ($response && strpos($contentType, 'image') !== false) {
            $base64 = base64_encode($response);
            echo json_encode([
                'code' => 0,
                'data' => [
                    'image' => 'data:image/png;base64,' . $base64,
                    'scene' => $scene,
                    'page' => $page
                ]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            // 返回的是错误JSON
            $errData = json_decode($response, true);
            echo json_encode([
                'code' => 1,
                'message' => '生成小程序码失败',
                'debug' => $errData
            ], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // 404
    http_response_code(404);
    echo json_encode(['code' => 404, 'message' => '接口不存在']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['code' => 500, 'message' => '服务器错误: ' . $e->getMessage()]);
}

// ==================== 微信JSSDK辅助函数 ====================

/**
 * 获取微信JSAPI Ticket
 */
function getWechatJsapiTicket($db, $appId) {
    try {
        // 获取authorizer_access_token
        $stmt = $db->prepare("SELECT authorizer_access_token, authorizer_access_token_expires_at FROM wechat_authorized_accounts WHERE authorizer_appid = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$appId]);
        $account = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$account || empty($account['authorizer_access_token'])) {
            return null;
        }

        $accessToken = $account['authorizer_access_token'];

        // 先检查数据库中是否有有效的jsapi_ticket
        $stmt = $db->prepare("SELECT ticket_value, expires_at FROM wechat_jsapi_tickets WHERE appid = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$appId]);
        $ticketRow = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ticketRow && $ticketRow['expires_at'] > time()) {
            return $ticketRow['ticket_value'];
        }

        // 需要刷新jsapi_ticket
        $jsapiUrl = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token={$accessToken}&type=jsapi";
        $context = stream_context_create([
            'http' => ['timeout' => 10, 'ignore_errors' => true]
        ]);
        $response = @file_get_contents($jsapiUrl, false, $context);

        if (!$response) {
            return null;
        }

        $result = json_decode($response, true);
        if (!isset($result['errcode']) || $result['errcode'] != 0) {
            return null;
        }

        $ticket = $result['ticket'];
        $expiresIn = intval($result['expires_in']);

        // 保存到数据库
        $stmt = $db->prepare("INSERT INTO wechat_jsapi_tickets (appid, ticket_value, expires_at, created_at) VALUES (?, ?, ?, NOW())");
        $stmt->execute([$appId, $ticket, time() + $expiresIn - 200]);

        return $ticket;

    } catch (Exception $e) {
        return null;
    }
}

/**
 * 生成微信签名
 */
function generateWechatSignature($url, $timestamp, $nonceStr, $ticket) {
    $str = "jsapi_ticket={$ticket}&noncestr={$nonceStr}&timestamp={$timestamp}&url={$url}";
    return sha1($str);
}

function parseXlsxSimple($filePath) {
    $devices = [];
    if (!class_exists('ZipArchive')) return $devices;

    $zip = new ZipArchive();
    if ($zip->open($filePath) !== true) return $devices;

    // 读取shared strings
    $sharedStrings = [];
    $ssXml = $zip->getFromName('xl/sharedStrings.xml');
    if ($ssXml) {
        $ss = simplexml_load_string($ssXml);
        if ($ss) {
            foreach ($ss->si as $si) {
                $sharedStrings[] = (string)$si->t;
            }
        }
    }

    // 读取sheet1
    $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if (!$sheetXml) return $devices;

    $sheet = simplexml_load_string($sheetXml);
    if (!$sheet || !isset($sheet->sheetData)) return $devices;

    $rows = [];
    foreach ($sheet->sheetData->row as $row) {
        $cells = [];
        foreach ($row->c as $cell) {
            $value = (string)$cell->v;
            $type = (string)$cell['t'];
            if ($type === 's' && isset($sharedStrings[(int)$value])) {
                $value = $sharedStrings[(int)$value];
            }
            $cells[] = $value;
        }
        $rows[] = $cells;
    }

    // 跳过表头(第一行)
    for ($i = 1; $i < count($rows); $i++) {
        $r = $rows[$i];
        if (count($r) >= 2 && !empty(trim($r[0]))) {
            $devices[] = [
                'board_code' => trim($r[0] ?? ''),
                'imei' => trim($r[1] ?? ''),
                'iccid' => trim($r[2] ?? ''),
                'module_code' => trim($r[3] ?? 'QY_QN4G'),
            ];
        }
    }
    return $devices;
}

function buildMenuTree($menus, $parentId = 0) {
    $tree = [];
    foreach ($menus as $menu) {
        if ($menu['parent_id'] == $parentId) {
            $children = buildMenuTree($menus, $menu['id']);
            $item = [
                'id' => $menu['id'],
                'path' => $menu['path'],
                'component' => $menu['path'],
                'meta' => [
                    'title' => $menu['title'] ?: '未命名',
                    'icon' => $menu['icon'] ?: 'Menu',
                ],
                'sort' => $menu['sort_order'] ?? 0,
            ];
            if (!empty($children)) {
                $item['children'] = $children;
            }
            $tree[] = $item;
        }
    }
    return $tree;
}