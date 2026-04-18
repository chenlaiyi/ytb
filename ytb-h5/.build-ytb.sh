#!/bin/bash
set -euo pipefail

TARGET_DIR=${TARGET_DIR:-/www/wwwroot/ytb.ddg.org.cn}
BUILD_CMD=${BUILD_CMD:-npm run build:ytb}

echo "开始构建 YTB 独立 H5..."
echo "目标目录: ${TARGET_DIR}"

if [ ! -f "package.json" ] || [ ! -f "vite.config.js" ]; then
  echo "请在 H5 目录下执行"
  exit 1
fi

npm install --no-audit --progress=false
rm -rf dist
${BUILD_CMD}

mkdir -p "${TARGET_DIR}"
find "${TARGET_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a dist/. "${TARGET_DIR}/"

echo "YTB 独立 H5 构建完成: ${TARGET_DIR}"
