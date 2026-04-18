#!/bin/bash
set -euo pipefail

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

info() {
  echo -e "${GREEN}$1${NC}"
}

warn() {
  echo -e "${YELLOW}$1${NC}"
}

error() {
  echo -e "${RED}$1${NC}"
}

trap 'error "构建脚本中断 (exit $?). 请检查上方日志。"' ERR

FORCE_REBUILD=${FORCE_REBUILD:-0}
SKIP_INSTALL=${SKIP_INSTALL:-0}
SKIP_NGINX_RELOAD=${SKIP_NGINX_RELOAD:-0}
SKIP_BACKUP=${SKIP_BACKUP:-0}
BUILD_CMD=${BUILD_CMD:-}

determine_build_command() {
  if [ -n "$BUILD_CMD" ]; then
    echo "$BUILD_CMD"
    return
  fi

  if [ "$FORCE_REBUILD" = "1" ]; then
    echo "npm run build"
  else
    echo "npx vite build"
  fi
}

prepare_nginx_logs() {
  local log_dir="/www/wwwroot/pay.itapgo.com/admin/logs"
  local log_file="${log_dir}/api_v1_access.log"
  if [ ! -d "$log_dir" ]; then
    mkdir -p "$log_dir"
    warn "已创建缺失的 Nginx 日志目录: $log_dir"
  fi
  if [ ! -f "$log_file" ]; then
    touch "$log_file"
    warn "已创建缺失的 Nginx 日志文件: $log_file"
  fi
}

# 计算源码签名，避免重复构建（优化：使用更快的方法）
SOURCE_SIGNATURE_FILE=".build-cache/.last_build_signature"
DEPS_SIGNATURE_FILE=".build-cache/.last_npm_deps"
mkdir -p .build-cache
SOURCE_HASH=""
DEPS_HASH=""
# shellcheck disable=SC2181
compute_source_hash() {
  # 优化：只检查关键文件的修改时间，而非计算所有文件的SHA1
  local paths=("src" "public" "vite.config.js" "package.json")
  local existing=()
  for item in "${paths[@]}"; do
    if [ -e "$item" ]; then
      existing+=("$item")
    fi
  done

  if [ ${#existing[@]} -eq 0 ]; then
    echo ""
    return
  fi

  # 使用 find + stat 获取最新修改时间，比 sha1sum 快 10 倍以上
  find "${existing[@]}" -type f -not -path "*/node_modules/*" -printf '%T@\n' 2>/dev/null \
    | sort -rn \
    | head -1 \
    | sha1sum \
    | awk '{print $1}'
}

SOURCE_HASH=$(compute_source_hash)
[ -n "$SOURCE_HASH" ] || SOURCE_HASH=$(date +%s)
LAST_HASH=""
if [ -f "$SOURCE_SIGNATURE_FILE" ]; then
  LAST_HASH=$(cat "$SOURCE_SIGNATURE_FILE")
fi
if [ -f package-lock.json ]; then
  DEPS_HASH=$(stat -c '%Y' package-lock.json package.json 2>/dev/null | sha1sum | awk '{print $1}')
fi
LAST_DEPS_HASH=""
if [ -f "$DEPS_SIGNATURE_FILE" ]; then
  LAST_DEPS_HASH=$(cat "$DEPS_SIGNATURE_FILE")
fi

# 获取当前时间
TIMESTAMP=$(date +%Y%m%d%H%M%S)
GLOBAL_START=$(date +%s)
BUILD_COMMAND=$(determine_build_command)

info "==============================================="
info "开始处理点点够App前端 - $(date)"
info "==============================================="
info "使用构建命令: ${BUILD_COMMAND}"
if [ "$FORCE_REBUILD" = "1" ]; then
  warn "FORCE_REBUILD=1 -> 将执行全量编译（含 --force），耗时较长"
fi
if [ "$SKIP_INSTALL" = "1" ]; then
  warn "SKIP_INSTALL=1 -> 本次将跳过 npm install"
fi

# 当前目录
CURRENT_DIR=$(pwd)
# 目标目录
TARGET_DIR=/www/wwwroot/pay.itapgo.com/app
# 备份目录
BACKUP_DIR=/www/wwwroot/pay.itapgo.com/app_backup_${TIMESTAMP}

warn "当前工作目录: ${CURRENT_DIR}"

# 备份当前部署文件
if [ "$SKIP_BACKUP" = "1" ]; then
  warn "SKIP_BACKUP=1 -> 跳过部署目录备份"
  mkdir -p "$TARGET_DIR"
else
  if [ -d "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
    warn "备份当前部署文件到: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -a "$TARGET_DIR"/. "$BACKUP_DIR"/ 2>/dev/null
  else
    warn "目标目录为空或不存在，跳过备份"
    mkdir -p "$TARGET_DIR"
  fi
fi

# 检查是否在本地开发环境
SHOULD_BUILD=1
if [ -n "$SOURCE_HASH" ] && [ "$SOURCE_HASH" = "$LAST_HASH" ] && [ -d "dist" ] && [ "$(ls -A dist 2>/dev/null)" ]; then
  SHOULD_BUILD=0
  echo -e "${YELLOW}检测到源码无改动，跳过重新构建，直接使用已有 dist${NC}"
fi

if [ -f "vite.config.js" ] && [ -f "package.json" ]; then
  warn "检测到本地开发环境，准备执行构建..."

  if [ $SHOULD_BUILD -eq 1 ]; then
    STEP_START=$(date +%s)
    if [ "$SKIP_INSTALL" = "1" ]; then
      warn "跳过 npm install (SKIP_INSTALL=1)"
    elif [ -n "$DEPS_HASH" ] && [ "$DEPS_HASH" = "$LAST_DEPS_HASH" ] && [ -d "node_modules" ]; then
      warn "依赖未变化，跳过 npm install"
    else
      warn "检查并更新依赖..."
      npm install --no-audit --progress=false
      if [ -n "$DEPS_HASH" ]; then
        echo "$DEPS_HASH" > "$DEPS_SIGNATURE_FILE"
      fi
    fi
    warn "删除旧的构建文件..."
    rm -rf dist
    warn "开始构建生产环境版本 (${BUILD_COMMAND})..."
    eval "$BUILD_COMMAND"
    BUILD_STATUS=$?
    BUILD_DURATION=$(( $(date +%s) - STEP_START ))
    warn "本地构建耗时 ${BUILD_DURATION} 秒"
  else
    BUILD_STATUS=0
  fi

  if [ $BUILD_STATUS -eq 0 ]; then
    info "构建成功，产物位于 dist 目录"

    if [ $SHOULD_BUILD -eq 1 ]; then
      mkdir -p dist
      {
        echo "构建时间: $(date)"
        echo "版本: $(grep '"version"' package.json | cut -d '"' -f 4)"
        echo "命令: ${BUILD_COMMAND}"
      } > dist/build-info.txt
      echo "$SOURCE_HASH" > "$SOURCE_SIGNATURE_FILE"
    fi

    warn "清空部署目录并复制新文件..."
    if [ -d "$TARGET_DIR" ]; then
      find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    else
      mkdir -p "$TARGET_DIR"
    fi
    cp -a dist/. "$TARGET_DIR"/
  else
    error "构建失败，将尝试从备份恢复"
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
      warn "从备份恢复文件..."
      cp -a "$BACKUP_DIR"/. "$TARGET_DIR"/
    else
      error "备份不存在或为空，无法恢复"
    fi
  fi
else
  warn "未检测到本地开发环境，将进行应急修复..."
  # 如果在服务器环境，仅进行基本的文件维护，不执行构建
  
  # 如果备份目录存在且不为空，确保文件完整性
  if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR 2>/dev/null)" ]; then
    # 检查目标目录是否缺少关键文件
    if [ ! -f "$TARGET_DIR/index.html" ]; then
      warn "从备份恢复index.html..."
      cp "$BACKUP_DIR/index.html" "$TARGET_DIR/" 2>/dev/null
    fi
    
    # 确保assets目录存在
    if [ ! -d "$TARGET_DIR/assets" ] && [ -d "$BACKUP_DIR/assets" ]; then
      warn "从备份恢复assets目录..."
      mkdir -p "$TARGET_DIR/assets"
      cp -a "$BACKUP_DIR/assets"/. "$TARGET_DIR/assets"/ 2>/dev/null
    fi
  fi
fi

# 创建构建信息文件（如果之前的步骤没有创建）
if [ ! -f "$TARGET_DIR/build-info.txt" ]; then
  warn "创建构建信息文件..."
  {
    echo "构建时间: $(date)"
    if [ -f "package.json" ]; then
      echo "版本: $(grep '"version"' package.json | cut -d '"' -f 4)"
    else
      echo "版本: 1.0.0"
    fi
  } > "$TARGET_DIR/build-info.txt"
fi

# 设置正确的文件权限
warn "设置文件权限..."
find "$TARGET_DIR" -type d -exec chmod 755 {} \;
find "$TARGET_DIR" -type f -exec chmod 644 {} \;

# 检查当前用户
CURRENT_USER=$(whoami)
if [ "$CURRENT_USER" = "root" ]; then
  warn "当前以root用户运行，更改文件所有者为www:www"
  chown -R www:www "$TARGET_DIR"
else
  warn "当前用户为 ${CURRENT_USER}，跳过更改文件所有者"
fi

# 安全重启nginx服务
if [ "$SKIP_NGINX_RELOAD" = "1" ]; then
  warn "SKIP_NGINX_RELOAD=1 -> 跳过 Nginx 重载"
else
  warn "安全重启nginx服务..."
  if [ -x "/www/server/nginx/sbin/nginx" ]; then
    prepare_nginx_logs
    if /www/server/nginx/sbin/nginx -t 2>/dev/null; then
      warn "Nginx 配置检查通过，开始重载..."
      if /www/server/nginx/sbin/nginx -s reload 2>/dev/null; then
        info "Nginx 重载完成"
      else
        warn "通过信号重载失败，尝试向 master 进程发送 HUP..."
        NGINX_PID=$(ps -ef | grep "nginx: master" | grep -v grep | awk '{print $2}')
        if [ -n "$NGINX_PID" ]; then
          kill -HUP "$NGINX_PID" || warn "发送 HUP 信号失败，请手动检查"
        else
          error "未找到 Nginx 主进程，需手动处理"
        fi
      fi
    else
      warn "Nginx 配置检查失败，跳过重启"
    fi
  else
    warn "无法找到Nginx可执行文件，跳过重启"
  fi
fi

info "==============================================="
info "处理完成 - $(date)"
info "App前端已部署到: $TARGET_DIR"
info "访问地址: https://pay.itapgo.com/app/"
info "==============================================="

# 修复后端Laravel权限问题（防止VIP中心数据显示问题）
warn "修复后端Laravel权限..."
if [ -f "/www/wwwroot/pay.itapgo.com/Tapp/admin/fix-permissions.sh" ]; then
  cd /www/wwwroot/pay.itapgo.com/Tapp/admin
  ./fix-permissions.sh
  cd "$CURRENT_DIR"
  info "Laravel权限修复完成"
else
  warn "权限修复脚本未找到，跳过"
fi

if [ ! -f "vite.config.js" ] || [ ! -f "package.json" ]; then
  warn "提示：此脚本在服务器上执行了应急修复，但并未执行实际构建"
  warn "完整构建需要在本地开发环境中执行，然后将dist目录上传到服务器"
fi
