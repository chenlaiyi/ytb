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