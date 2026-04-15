#!/bin/bash
#
# YTB H5 部署脚本
# 部署到 ytb.ddg.org.cn/app/
#

set -e

SERVER="root@139.9.61.199"
YTB_ROOT="/www/wwwroot/ytb.ddg.org.cn"
H5_ROOT="$YTB_ROOT/app"
SOURCE_DIR="/Users/chenlaiyi/YTB/ytb-h5"

echo "===== YTB H5 部署开始 ====="

# 1. 构建前端
echo "[1/2] 构建H5前端..."
cd $SOURCE_DIR
npm run build:ytb

# 2. 部署H5文件
echo "[2/2] 部署H5文件..."
# 部署 index.html 到 /app/ 目录
ssh $SERVER "mkdir -p $H5_ROOT"
scp $SOURCE_DIR/dist/index.html $SERVER:$H5_ROOT/index.html

# 部署静态资源到 /app/assets/
ssh $SERVER "mkdir -p $H5_ROOT/assets"
rsync -avz --delete $SOURCE_DIR/dist/assets/ $SERVER:$H5_ROOT/assets/

# 部署 public 资源 (js, css等) 到 /app/ 下
ssh $SERVER "mkdir -p $H5_ROOT/js $H5_ROOT/css $H5_ROOT/vant-icons"
rsync -avz --delete $SOURCE_DIR/public/js/ $SERVER:$H5_ROOT/js/
rsync -avz --delete $SOURCE_DIR/public/css/ $SERVER:$H5_ROOT/css/
rsync -avz --delete $SOURCE_DIR/public/vant-icons/ $SERVER:$H5_ROOT/vant-icons/

# 部署 jquery.min.js (stub)
ssh $SERVER "mkdir -p $H5_ROOT/js"
rsync -avz --delete $SOURCE_DIR/public/js/jquery.min.js $SERVER:$H5_ROOT/js/jquery.min.js 2>/dev/null || true

echo ""
echo "===== H5 部署完成 ====="
echo ""
echo "访问 https://ytb.ddg.org.cn/app/"
