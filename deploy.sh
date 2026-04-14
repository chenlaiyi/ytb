#!/bin/bash
#
# YTB 前端部署脚本
# 部署到 ytb.ddg.org.cn
#

set -e

SERVER="root@139.9.61.199"
YTB_ROOT="/www/wwwroot/ytb.ddg.org.cn"
SOURCE_DIR="/Users/chenlaiyi/YTB"

echo "===== YTB 前端部署开始 ====="

# 1. 构建前端
echo "[1/2] 构建前端..."
cd $SOURCE_DIR/ytb-frontend
npm run build

# 2. 部署前端文件
echo "[2/2] 部署前端文件..."
ssh $SERVER "mkdir -p $YTB_ROOT/admin/assets"
rsync -avz --delete dist/assets/ $SERVER:$YTB_ROOT/admin/assets/
scp dist/index.html $SERVER:$YTB_ROOT/admin/index.html

# 3. 部署logo到admin目录
echo "[3/3] 部署logo..."
scp $SOURCE_DIR/logo.png $SERVER:$YTB_ROOT/admin/logo.png

echo ""
echo "===== 部署完成 ====="
echo ""
echo "访问 https://ytb.ddg.org.cn/admin/"