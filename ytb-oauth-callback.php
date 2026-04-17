<?php
/**
 * YTB微信OAuth代理 - 回调处理
 * 部署在 pay.itapgo.com 域名下
 * 
 * 微信OAuth回调到此脚本，换取openid后创建/登录用户，
 * 然后带着token跳回 ytb.ddg.org.cn
 */

// 数据库配置
$tappDbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'ddg.app',
    'username' => 'ddg.app',
    'password' => '8GmWPjwbwY4waXcT',
];

$ytbDbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'ytb_ddg_org_cn',
    'username' => 'ytb_ddg_org_cn',
    'password' => 'XYKHzy1DTzR1w1sT',
];

function connectDB($config) {
    $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}

function wechatApiGet($url) {
    $context = stream_context_create(['http' => ['timeout' => 10, 'ignore_errors' => true]]);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) return null;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

// 跳转到YTB并显示错误
function redirectWithError($msg, $redirectPath = '/login') {
    $url = 'https://ytb.ddg.org.cn/app/#' . $redirectPath . '?error=' . urlencode($msg);
    header('Location: ' . $url);
    exit;
}

// 获取参数
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';

if (!$code) {
    redirectWithError('微信授权失败，缺少授权码');
}

// 解析 state：格式为 YTB|/home
$redirectUrl = '/devices';
if (strpos($state, 'YTB|') === 0) {
    $redirectUrl = urldecode(substr($state, 4)) ?: '/devices';
}

try {
    $tappDb = connectDB($tappDbConfig);
    $ytbDb = connectDB($ytbDbConfig);
} catch (PDOException $e) {
    redirectWithError('服务器内部错误');
}

// 获取第三方平台配置
$stmt = $tappDb->prepare("SELECT component_app_id, component_access_token, component_access_token_expires_at FROM wechat_third_party_platforms WHERE status = 'active' ORDER BY id DESC LIMIT 1");
$stmt->execute();
$platform = $stmt->fetch(PDO::FETCH_ASSOC);

$componentAppId = $platform['component_app_id'] ?? '';
$componentAccessToken = $platform['component_access_token'] ?? '';
$tokenExpiresAt = (int)($platform['component_access_token_expires_at'] ?? 0);

// 如果 component_access_token 过期，尝试自动刷新
if ($tokenExpiresAt < time() && $componentAppId) {
    $stmt2 = $tappDb->prepare("SELECT component_app_secret, component_verify_ticket FROM wechat_third_party_platforms WHERE component_app_id = ? LIMIT 1");
    $stmt2->execute([$componentAppId]);
    $platformFull = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    if ($platformFull && !empty($platformFull['component_app_secret']) && !empty($platformFull['component_verify_ticket'])) {
        $refreshResult = wechatApiGet('https://api.weixin.qq.com/cgi-bin/component/api_component_token');
        // 用POST方式
        $postData = json_encode([
            'component_appid' => $componentAppId,
            'component_appsecret' => $platformFull['component_app_secret'],
            'component_verify_ticket' => $platformFull['component_verify_ticket'],
        ]);
        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/json',
                'content' => $postData,
                'timeout' => 10,
            ]
        ]);
        $raw = @file_get_contents('https://api.weixin.qq.com/cgi-bin/component/api_component_token', false, $ctx);
        $refreshResult = $raw ? json_decode($raw, true) : null;
        
        if ($refreshResult && !empty($refreshResult['component_access_token'])) {
            $componentAccessToken = $refreshResult['component_access_token'];
            $newExpires = time() + ($refreshResult['expires_in'] ?? 7200);
            $updateStmt = $tappDb->prepare("UPDATE wechat_third_party_platforms SET component_access_token = ?, component_access_token_expires_at = ?, updated_at = NOW() WHERE component_app_id = ?");
            $updateStmt->execute([$componentAccessToken, $newExpires, $componentAppId]);
        }
    }
}

$appId = 'wx644418e60bf1f7a2';

// 用 component OAuth 换取 access_token
$oauthToken = null;
if ($componentAppId && $componentAccessToken) {
    $tokenUrl = 'https://api.weixin.qq.com/sns/oauth2/component/access_token?' . http_build_query([
        'appid' => $appId,
        'code' => $code,
        'grant_type' => 'authorization_code',
        'component_appid' => $componentAppId,
        'component_access_token' => $componentAccessToken,
    ]);
    $oauthToken = wechatApiGet($tokenUrl);
}

if (!$oauthToken || !empty($oauthToken['errcode']) || empty($oauthToken['openid'])) {
    $errMsg = $oauthToken['errmsg'] ?? '微信授权码无效或已过期';
    redirectWithError($errMsg);
}

$openid = $oauthToken['openid'];
$unionid = $oauthToken['unionid'] ?? null;
$snsToken = $oauthToken['access_token'] ?? '';

// 尝试获取用户信息（snsapi_base 可能拿不到，没关系）
$nickname = '微信用户' . substr(md5($openid), 0, 6);
$avatar = '';
if ($snsToken && $openid) {
    $userInfo = wechatApiGet('https://api.weixin.qq.com/sns/userinfo?' . http_build_query([
        'access_token' => $snsToken,
        'openid' => $openid,
        'lang' => 'zh_CN',
    ]));
    if ($userInfo && empty($userInfo['errcode'])) {
        $nickname = $userInfo['nickname'] ?? $nickname;
        $avatar = $userInfo['headimgurl'] ?? '';
        $unionid = $userInfo['unionid'] ?? $unionid;
    }
}

// 在 ytb_users 表中创建或更新用户
$stmt = $ytbDb->prepare('SELECT * FROM ytb_users WHERE openid = ? LIMIT 1');
$stmt->execute([$openid]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    $updateStmt = $ytbDb->prepare('UPDATE ytb_users SET unionid = ?, nickname = ?, avatar = ?, updated_at = NOW() WHERE id = ?');
    $updateStmt->execute([$unionid, $nickname, $avatar, $user['id']]);
} else {
    $insertStmt = $ytbDb->prepare(
        "INSERT INTO ytb_users (openid, unionid, nickname, avatar, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'normal', 'active', NOW(), NOW())"
    );
    $insertStmt->execute([$openid, $unionid, $nickname, $avatar]);

    $stmt = $ytbDb->prepare('SELECT * FROM ytb_users WHERE id = ? LIMIT 1');
    $stmt->execute([$ytbDb->lastInsertId()]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
}

if (!$user) {
    redirectWithError('创建用户失败');
}

// 生成 api_token
$apiToken = bin2hex(random_bytes(24));
$tokenExpiresAt = date('Y-m-d H:i:s', time() + 30 * 24 * 60 * 60);
$tokenStmt = $ytbDb->prepare('UPDATE ytb_users SET api_token = ?, token_expires_at = ?, updated_at = NOW() WHERE id = ?');
$tokenStmt->execute([$apiToken, $tokenExpiresAt, $user['id']]);

// 构造用户数据（JSON编码后放在URL参数里）
$userData = json_encode([
    'id' => (int)$user['id'],
    'userId' => (int)$user['id'],
    'nickname' => $nickname,
    'name' => $nickname,
    'phone' => $user['phone'] ?? '',
    'avatar' => $avatar,
    'openid' => $openid,
], JSON_UNESCAPED_UNICODE);

// 跳回 ytb.ddg.org.cn，带上 token 和用户数据
$callbackUrl = 'https://ytb.ddg.org.cn/app/#/wechat-callback'
    . '?token=' . urlencode($apiToken)
    . '&user=' . urlencode(base64_encode($userData))
    . '&redirect=' . urlencode($redirectUrl);

header('Location: ' . $callbackUrl);
exit;
