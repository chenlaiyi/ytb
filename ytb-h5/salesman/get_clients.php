<?php
/**
 * H5端业务员客户列表API
 * 这个文件作为H5端的API代理，调用Laravel的业务员客户API
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // 获取Authorization header
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader)) {
        throw new Exception('缺少Authorization header');
    }
    
    // 构建Laravel API的URL
    $laravelApiUrl = 'https://pay.itapgo.com/api/app/v1/business/salesman/customers';
    
    // 获取查询参数
    $queryParams = $_GET;
    if (!empty($queryParams)) {
        $laravelApiUrl .= '?' . http_build_query($queryParams);
    }
    
    // 初始化cURL
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $laravelApiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            $authHeader
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception('cURL错误: ' . $error);
    }
    
    if ($httpCode !== 200) {
        throw new Exception('API请求失败，状态码: ' . $httpCode);
    }
    
    // 解析Laravel API的响应
    $data = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('响应解析失败: ' . json_last_error_msg());
    }
    
    // 转换为H5端期望的格式
    if ($data['code'] === 0) {
        $clients = [];
        $stats = $data['data']['stats'] ?? [];
        
        // 转换客户列表格式
        foreach ($data['data']['list'] as $client) {
            $clients[] = [
                'id' => $client['id'],
                'client_name' => $client['client_name'],
                'client_phone' => $client['client_phone'],
                'client_address' => $client['client_address'],
                'register_time' => $client['register_time'],
                'is_vip' => $client['is_vip'],
                'device_count' => $client['device_count'],
                'total_commission' => $client['total_commission'],
                'devices' => $client['devices']
            ];
        }
        
        // 返回H5端期望的格式
        echo json_encode([
            'success' => true,
            'code' => 200,
            'message' => '获取成功',
            'data' => [
                'clients' => $clients,
                'stats' => [
                    'total_clients' => $stats['total_clients'] ?? 0,
                    'vip_clients' => $stats['vip_clients'] ?? 0,
                    'total_devices' => $stats['total_devices'] ?? 0,
                    'total_commission' => $stats['total_commission'] ?? 0
                ],
                'pagination' => [
                    'total' => $data['data']['total'] ?? 0,
                    'page' => $data['data']['page'] ?? 1,
                    'per_page' => $data['data']['per_page'] ?? 20
                ]
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        // Laravel API返回错误
        echo json_encode([
            'success' => false,
            'code' => $data['code'] ?? 500,
            'message' => $data['message'] ?? '获取客户列表失败',
            'data' => null
        ], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'code' => 500,
        'message' => $e->getMessage(),
        'data' => null
    ], JSON_UNESCAPED_UNICODE);
}
?>
