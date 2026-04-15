#!/bin/bash
#
# YTB H5 部署脚本
# 部署到 ytb.ddg.org.cn
#

set -e

SERVER="root@139.9.61.199"
YTB_ROOT="/www/wwwroot/ytb.ddg.org.cn"
SOURCE_DIR="/Users/chenlaiyi/YTB/ytb-h5"

echo "===== YTB H5 部署开始 ====="

# 1. 构建前端
echo "[1/2] 构建H5前端..."
cd $SOURCE_DIR
npm run build:ytb

# 2. 部署H5文件
echo "[2/2] 部署H5文件..."
# 部署 index.html 到根目录
ssh $SERVER "mkdir -p $YTB_ROOT"
scp $SOURCE_DIR/dist/index.html $SERVER:$YTB_ROOT/index.html

# 部署静态资源到根目录
ssh $SERVER "mkdir -p $YTB_ROOT/assets"
rsync -avz --delete $SOURCE_DIR/dist/assets/ $SERVER:$YTB_ROOT/assets/

# 部署 public 资源 (images, js, css等)
ssh $SERVER "mkdir -p $YTB_ROOT/images $YTB_ROOT/js $YTB_ROOT/css"
rsync -avz --delete $SOURCE_DIR/public/images/ $SERVER:$YTB_ROOT/images/
rsync -avz --delete $SOURCE_DIR/public/js/ $SERVER:$YTB_ROOT/js/
rsync -avz --delete $SOURCE_DIR/public/css/ $SERVER:$YTB_ROOT/css/

# 部署 dist 中的 js 和 css (如 jquery.min.js stub)
rsync -avz --delete $SOURCE_DIR/dist/js/ $SERVER:$YTB_ROOT/js/
rsync -avz --delete $SOURCE_DIR/dist/css/ $SERVER:$YTB_ROOT/css/

echo ""
echo "===== H5 部署完成 ====="
echo ""
echo "访问 https://ytb.ddg.org.cn/"
