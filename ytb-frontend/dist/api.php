<?php
/**
 * YTB 独立管理后台 API 入口
 * 独立部署，不依赖 pay.itapgo.com
 */

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

// 简单路由
try {
    $db = getDB();
    
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

    // 需要认证的接口
    if (!$token) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '未提供认证令牌']);
        exit;
    }
    
    // 验证 token
    $tokenData = json_decode(base64_decode($token), true);
    if (!$tokenData || !isset($tokenData['admin_id']) || !isset($tokenData['exp'])) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '无效的令牌格式']);
        exit;
    }
    
    if ($tokenData['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['code' => 401, 'message' => '令牌已过期']);
        exit;
    }
    
    $stmt = $db->prepare("SELECT * FROM ytb_admin_users WHERE id = ? AND status = 'active'");
    $stmt->execute([$tokenData['admin_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
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

    // 404
    http_response_code(404);
    echo json_encode(['code' => 404, 'message' => '接口不存在']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['code' => 500, 'message' => '服务器错误: ' . $e->getMessage()]);
}

function buildMenuTree($menus, $parentId = 0) {
    $tree = [];
    foreach ($menus as $menu) {
        if ($menu['parent_id'] == $parentId) {
            $children = buildMenuTree($menus, $menu['id']);
            $item = [
                'id' => $menu['id'],
                'name' => $menu['title'],
                'path' => $menu['path'],
                'icon' => $menu['icon'],
                'component' => $menu['path'],
                'sort' => $menu['sort_order'],
            ];
            if (!empty($children)) {
                $item['children'] = $children;
            }
            $tree[] = $item;
        }
    }
    return $tree;
}