#!/bin/bash
#
# YTB 独立系统部署脚本
# 部署到 ytb.ddg.org.cn
#

set -e

SERVER="root@139.9.61.199"
YTB_ROOT="/www/wwwroot/ytb.ddg.org.cn"
SOURCE_DIR="/Users/chenlaiyi/YTB"

echo "===== YTB 独立系统部署开始 ====="

# 1. 部署后端文件到 pay.itapgo.com
echo "[1/4] 部署后端文件..."
ssh $SERVER "mkdir -p /www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Controllers/Admin/Api/V1"
ssh $SERVER "mkdir -p /www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Middleware"
ssh $SERVER "mkdir -p /www/wwwroot/pay.itapgo.com/Tapp/admin/routes"

# 复制控制器
scp $SOURCE_DIR/ytb-backend/app/Http/Controllers/Admin/Api/V1/*.php $SERVER:/www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Controllers/Admin/Api/V1/

# 复制中间件
scp $SOURCE_DIR/ytb-backend/app/Http/Middleware/YtbAuthenticate.php $SERVER:/www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Middleware/

# 复制路由
scp $SOURCE_DIR/ytb-backend/routes/ytb_api.php $SERVER:/www/wwwroot/pay.itapgo.com/Tapp/admin/routes/

# 2. 在 api.php 中加载 YTB 路由
echo "[2/4] 配置路由加载..."
ssh $SERVER "grep -q 'ytb_api_v1.php' /www/wwwroot/pay.itapgo.com/Tapp/admin/routes/api.php || echo 'require_once __DIR__.\"/ytb_api_v1.php\";' >> /www/wwwroot/pay.itapgo.com/Tapp/admin/routes/api.php"

# 在 Kernel.php 中注册 YtbAuthenticate 中间件
ssh $SERVER "grep -q 'ytb.auth' /www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Kernel.php || sed -i \"s/'admin.access' => \\\\App\\\\Http\\\\Middleware\\\\AdminAccessControl::class,/'admin.access' => \\App\\Http\\Middleware\\AdminAccessControl::class,\\n        'ytb.auth' => \\App\\Http\\Middleware\\YtbAuthenticate::class,/\" /www/wwwroot/pay.itapgo.com/Tapp/admin/app/Http/Kernel.php"

# 3. 部署前端文件
echo "[3/4] 部署前端文件..."
ssh $SERVER "mkdir -p $YTB_ROOT/admin"
scp $SOURCE_DIR/ytb-frontend/public/index.html $SERVER:$YTB_ROOT/admin/index.html

# 4. 更新 nginx 配置
echo "[4/4] 配置 nginx..."
cat > /tmp/ytb-standalone.conf << 'EOF'
server {
    listen 80;
    listen 443 ssl http2;
    server_name ytb.ddg.org.cn www.ytb.ddg.org.cn;
    
    root /www/wwwroot/ytb.ddg.org.cn;
    index index.php index.html;
    
    ssl_certificate /www/server/panel/vhost/cert/ytb.ddg.org.cn/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/ytb.ddg.org.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # CORS 头
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,X-Site-Domain' always;
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Max-Age' 1728000;
        add_header 'Content-Type' 'text/plain';
        return 204;
    }
    
    # 前端路由
    location /admin/ {
        try_files $uri $uri/index.html /admin/index.html;
    }
    
    # API 代理到 pay.itapgo.com
    location /api/ {
        proxy_pass https://127.0.0.1;
        proxy_ssl_server_name on;
        proxy_ssl_name pay.itapgo.com;
        proxy_ssl_verify off;
        proxy_set_header Host pay.itapgo.com;
        proxy_set_header X-Site-Domain ytb.ddg.org.cn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    access_log /www/wwwlogs/ytb.ddg.org.cn.log;
    error_log /www/wwwlogs/ytb.ddg.org.cn.error.log;
}
EOF

scp /tmp/ytb-standalone.conf $SERVER:/www/server/panel/vhost/nginx/ytb.ddg.org.cn.conf

# 5. 清除缓存并重载 nginx
echo "[5/5] 清除缓存并重载 nginx..."
ssh $SERVER "cd /www/wwwroot/pay.itapgo.com/Tapp/admin && php artisan route:clear && php artisan config:clear"
ssh $SERVER "/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload"

echo ""
echo "===== 部署完成 ====="
echo ""
echo "访问 https://ytb.ddg.org.cn/admin/"