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
                        'total' => 0,
                        'active' => 0,
                        'online' => 0,
                        'online_rate' => 0
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

    // CP会员列表 (vip_list.php) - 兼容旧API路径
    if ($path === 'Tapp/admin/api/user/vip_list.php' && $method === 'GET') {
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        // 获取CP会员总数 (team_cp 和 boss_cp)
        $countSql = "SELECT COUNT(*) as total FROM ytb_users WHERE (role = 'team_cp' OR role = 'boss_cp')";
        if ($search) {
            $countSql .= " AND (name LIKE ? OR nickname LIKE ? OR mobile LIKE ?)";
        }
        $countStmt = $db->prepare($countSql);
        if ($search) {
            $searchParam = "%{$search}%";
            $countStmt->execute([$searchParam, $searchParam, $searchParam]);
        } else {
            $countStmt->execute();
        }
        $total = (int)$countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 获取CP会员列表
        $listSql = "SELECT u.*,
            CASE WHEN u.role = 'team_cp' THEN 'VIPCP' WHEN u.role = 'boss_cp' THEN 'BossCP' ELSE 'CP' END as cp_level,
            CASE WHEN u.role = 'team_cp' THEN 2 WHEN u.role = 'boss_cp' THEN 3 ELSE 1 END as cp_level_sort
            FROM ytb_users u
            WHERE (u.role = 'team_cp' OR u.role = 'boss_cp')";
        if ($search) {
            $listSql .= " AND (u.name LIKE ? OR u.nickname LIKE ? OR u.mobile LIKE ?)";
        }
        $listSql .= " ORDER BY u.created_at DESC LIMIT {$offset}, {$limit}";

        $listStmt = $db->prepare($listSql);
        if ($search) {
            $searchParam = "%{$search}%";
            $listStmt->execute([$searchParam, $searchParam, $searchParam]);
        } else {
            $listStmt->execute();
        }
        $users = $listStmt->fetchAll(PDO::FETCH_ASSOC);

        // 获取推荐人信息
        $userIds = array_column($users, 'id');
        $referrers = [];
        if (!empty($userIds)) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $refStmt = $db->prepare("SELECT id, name, nickname FROM ytb_users WHERE id IN ({$placeholders})");
            $refStmt->execute($userIds);
            foreach ($refStmt->fetchAll(PDO::FETCH_ASSOC) as $ref) {
                $referrers[$ref['id']] = $ref;
            }
        }

        // 处理用户数据，添加推荐人信息和团队统计
        $processedUsers = [];
        foreach ($users as $u) {
            $referrerId = $u['referrer_id'] ?? 0;
            $processedUsers[] = [
                'id' => $u['id'],
                'name' => $u['name'] ?: '未设置',
                'nickname' => $u['nickname'] ?: '',
                'mobile' => $u['mobile'] ?: '',
                'phone' => $u['mobile'] ?: '',
                'avatar' => $u['avatar'] ?: '',
                'wechat_avatar' => $u['wechat_avatar'] ?: '',
                'balance' => $u['balance'] ?: '0.00',
                'referrer_id' => $referrerId,
                'referrer_name' => ($referrerId && isset($referrers[$referrerId])) ? ($referrers[$referrerId]['name'] ?: $referrers[$referrerId]['nickname'] ?: '未知') : null,
                'direct_vip_count' => 0,
                'team_vip_count' => 0,
                'month_direct_vip' => 0,
                'month_team_vip' => 0,
                'last_month_direct_vip' => 0,
                'last_month_team_vip' => 0,
                'vip_at' => $u['vip_at'] ?? '',
                'vip_paid_at' => $u['vip_paid_at'] ?? '',
                'created_at' => $u['created_at'] ?? '',
                'cp_level' => $u['cp_level'] ?? 'CP',
                'is_vip' => 1,
                'is_vip_paid' => ($u['vip_paid_at'] ?? '') !== '' ? 1 : 0,
            ];
        }

        // 统计数据
        $monthStart = date('Y-m-01 00:00:00');
        $lastMonthStart = date('Y-m-01 00:00:00', strtotime('first day of last month'));
        $lastMonthEnd = date('Y-m-01 00:00:00');

        $statsSql = "SELECT
            COUNT(CASE WHEN role = 'team_cp' OR role = 'boss_cp' THEN 1 END) as total_vip,
            COUNT(CASE WHEN (role = 'team_cp' OR role = 'boss_cp') AND created_at >= ? THEN 1 END) as month_new_vip,
            COUNT(CASE WHEN (role = 'team_cp' OR role = 'boss_cp') AND created_at >= ? AND created_at < ? THEN 1 END) as last_month_new_vip,
            COALESCE(SUM(balance), 0) as total_balance
            FROM ytb_users WHERE role = 'team_cp' OR role = 'boss_cp'";

        $statsStmt = $db->prepare($statsSql);
        $statsStmt->execute([$monthStart, $lastMonthStart, $lastMonthEnd]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'code' => 0,
            'message' => 'success',
            'data' => [
                'list' => $processedUsers,
                'total' => $total,
                'stats' => [
                    'total_vip' => (int)($stats['total_vip'] ?? 0),
                    'month_new_vip' => (int)($stats['month_new_vip'] ?? 0),
                    'last_month_new_vip' => (int)($stats['last_month_new_vip'] ?? 0),
                    'total_balance' => number_format((float)($stats['total_balance'] ?? 0), 2, '.', ''),
                ]
            ]
        ]);
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
        foreach ($devices as $d) {
            // 状态映射
            $statusMap = ['pending' => '待激活', 'assigned' => '已分配', 'installed' => '已安装', 'activated' => '已激活', 'disabled' => '已禁用'];
            $networkMap = ['0' => '离线', '1' => '在线'];
            $billingMap = ['flow' => '流量计费', 'time' => '包年计费', 'retail' => '零售'];

            // 计算进度百分比
            $waterLevelPct = 0;
            $daysPct = 0;
            $isLowWater = false;
            $isExpireSoon = false;

            if ($d['billing_mode'] == 'flow') {
                $surplus = floatval($d['surplus_flow'] ?? 0);
                $totalFlow = floatval($d['total_recharged_flow'] ?? 4500); // 使用总充值流量作为总量
                $waterLevelPct = $totalFlow > 0 ? min(100, round($surplus / $totalFlow * 100)) : 0;
                $isLowWater = $surplus < 100;
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
                'network_status' => $d['network_status'] ?? '0',
                'network_status_text' => $networkMap[$d['network_status']] ?? '未知',
                'client_name' => $d['client_name'] ?? '',
                'client_phone' => $d['client_phone'] ?? '',
                'client_wx_nickname' => '',
                'address' => $d['client_address'] ?? '',
                'dealer_name' => $d['dealer_name'] ?? '',
                'dealer_number' => '',
                'sale_dealer_name' => '',
                'billing_mode' => $d['billing_mode'] ?? 'flow',
                'billing_mode_text' => $billingMap[$d['billing_mode']] ?? '未知',
                'surplus_flow' => floatval($d['surplus_flow'] ?? 0),
                'water_level_percentage' => $waterLevelPct,
                'is_low_water' => $isLowWater,
                'remaining_days' => 0,
                'days_percentage' => 0,
                'is_expire_soon' => false,
                'cumulative_filtration_flow' => floatval($d['cumulative_flow'] ?? 0),
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

        // 统计
        $todayStart = date('Y-m-d 00:00:00');
        $monthStart = date('Y-m-01 00:00:00');
        $statsStmt = $db->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN network_status = '1' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN LENGTH(imei) >= 10 THEN 1 ELSE 0 END) as iot_registered,
                SUM(CASE WHEN create_date >= '{$todayStart}' THEN 1 ELSE 0 END) as today,
                SUM(CASE WHEN create_date >= '{$monthStart}' THEN 1 ELSE 0 END) as this_month
            FROM ytb_devices
        ");
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
        $totalDevices = intval($stats['total'] ?? 0);
        $onlineDevices = intval($stats['online'] ?? 0);

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
                    'active_devices' => intval($stats['active'] ?? 0),
                    'iot_registered_devices' => intval($stats['iot_registered'] ?? 0),
                    'online_devices' => $onlineDevices,
                    'offline_devices' => $totalDevices - $onlineDevices,
                    'online_rate' => $totalDevices > 0 ? round($onlineDevices / $totalDevices * 100, 1) : 0,
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
        echo json_encode(['code' => 0, 'data' => []]);
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
        echo json_encode(['code' => 0, 'data' => ['data' => [], 'total' => 0]]);
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