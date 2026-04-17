<?php
/**
 * YTB微信OAuth代理 - 发起授权
 * 部署在 pay.itapgo.com 域名下
 * 
 * 用法: https://pay.itapgo.com/ytb-oauth-init.php?redirect_url=/home
 */

// 数据库配置（与ytb共用同一台服务器的ddg.app库）
$tappDbConfig = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'database' => 'ddg.app',
    'username' => 'ddg.app',
    'password' => '8GmWPjwbwY4waXcT',
];

try {
    $dsn = "mysql:host={$tappDbConfig['host']};port={$tappDbConfig['port']};dbname={$tappDbConfig['database']};charset=utf8mb4";
    $db = new PDO($dsn, $tappDbConfig['username'], $tappDbConfig['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['code' => 500, 'message' => '数据库连接失败']));
}

// 获取公众号配置
$stmt = $db->prepare("SELECT authorizer_appid FROM wechat_authorized_accounts WHERE authorizer_appid = 'wx644418e60bf1f7a2' AND status = 'active' LIMIT 1");
$stmt->execute();
$account = $stmt->fetch(PDO::FETCH_ASSOC);

// 获取第三方平台配置
$stmt = $db->prepare("SELECT component_app_id FROM wechat_third_party_platforms WHERE status = 'active' ORDER BY id DESC LIMIT 1");
$stmt->execute();
$platform = $stmt->fetch(PDO::FETCH_ASSOC);

$appId = $account['authorizer_appid'] ?? 'wx644418e60bf1f7a2';
$componentAppId = $platform['component_app_id'] ?? 'wx542eec58a75fe9e2';

// 回调地址指向 pay.itapgo.com 上的回调脚本
$callbackUrl = 'https://pay.itapgo.com/ytb-oauth-callback.php';

// state 参数携带 ytb 的重定向目标
$redirectUrl = $_GET['redirect_url'] ?? '/home';
$state = 'YTB|' . urlencode($redirectUrl);

// 构造微信OAuth授权URL
$query = http_build_query([
    'appid' => $appId,
    'redirect_uri' => $callbackUrl,
    'response_type' => 'code',
    'scope' => 'snsapi_base',
    'state' => $state,
    'component_appid' => $componentAppId,
]);

$authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?' . $query . '#wechat_redirect';

// 跳转到微信授权页
header('Location: ' . $authUrl);
exit;
