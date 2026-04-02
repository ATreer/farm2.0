#!/bin/bash

echo "🌾 启动像素农场..."
echo "================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ==================== 函数定义 ====================

# 检查并安装依赖，如果 package.json 有变更则重新安装
check_and_install_deps() {
  local dir="$1"
  local name="$2"
  local lock_file="$dir/package-lock.json"
  local hash_file="$dir/.dep_hash"

  if [ ! -d "$dir/node_modules" ]; then
    echo "⚠️  $name 依赖未安装，正在执行 npm install..."
    cd "$dir" && npm install
    if [ $? -ne 0 ]; then
      echo "❌ $name 依赖安装失败！"
      return 1
    fi
    # 记录哈希
    _save_dep_hash "$dir" "$lock_file" "$hash_file"
    return 0
  fi

  # 检查 package.json 或 package-lock.json 是否有变更
  local current_hash=""
  if [ -f "$lock_file" ]; then
    current_hash=$(md5sum "$dir/package.json" "$lock_file" 2>/dev/null | md5sum | cut -d' ' -f1)
  else
    current_hash=$(md5sum "$dir/package.json" 2>/dev/null | cut -d' ' -f1)
  fi

  local saved_hash=""
  if [ -f "$hash_file" ]; then
    saved_hash=$(cat "$hash_file")
  fi

  if [ "$current_hash" != "$saved_hash" ]; then
    echo "📦 检测到 $name 依赖配置变更，重新安装..."
    cd "$dir" && npm install
    if [ $? -ne 0 ]; then
      echo "❌ $name 依赖安装失败！"
      return 1
    fi
    _save_dep_hash "$dir" "$lock_file" "$hash_file"
    echo "   ✅ $name 依赖更新完成"
  fi

  return 0
}

_save_dep_hash() {
  local dir="$1"
  local lock_file="$2"
  local hash_file="$3"
  local hash=""
  if [ -f "$lock_file" ]; then
    hash=$(md5sum "$dir/package.json" "$lock_file" 2>/dev/null | md5sum | cut -d' ' -f1)
  else
    hash=$(md5sum "$dir/package.json" 2>/dev/null | cut -d' ' -f1)
  fi
  echo "$hash" > "$hash_file"
}

# 检查源码是否有变更（需要重新编译/重启）
check_source_changed() {
  local dir="$1"
  local hash_file="$dir/.src_hash"

  local current_hash=$(find "$dir/src" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \) -newer "$hash_file" 2>/dev/null | head -1)

  if [ -n "$current_hash" ] || [ ! -f "$hash_file" ]; then
    return 0  # 有变更
  fi
  return 1  # 无变更
}

update_source_hash() {
  local dir="$1"
  local hash_file="$dir/.src_hash"
  touch "$hash_file"
  find "$dir/src" -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.css" -o -name "*.json" \) -exec touch "$hash_file" \; 2>/dev/null
}

# ==================== 检查依赖 ====================
echo ""
echo "🔍 [0/3] 检查依赖..."

check_and_install_deps "$SCRIPT_DIR/server" "后端"
if [ $? -ne 0 ]; then exit 1; fi

check_and_install_deps "$SCRIPT_DIR/client" "前端"
if [ $? -ne 0 ]; then
  # 尝试停止可能已启动的后端
  kill $SERVER_PID 2>/dev/null
  exit 1
fi

echo "   ✅ 依赖检查完成"

# ==================== 启动后端 ====================
echo ""
echo "📦 [1/3] 启动后端服务器..."

# 先清理旧日志
SERVER_LOG="$SCRIPT_DIR/server/server.log"
rm -f "$SERVER_LOG"

cd "$SCRIPT_DIR/server"

# 检查是否有旧的后端进程占用端口
OLD_SERVER_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$OLD_SERVER_PID" ]; then
  echo "   ⚠️  端口 3001 被占用 (PID: $OLD_SERVER_PID)，正在停止旧进程..."
  kill $OLD_SERVER_PID 2>/dev/null
  sleep 1
fi

node index.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

# 等待后端启动，最多等待 15 秒
echo "   等待后端启动..."
MAX_WAIT=15
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo ""
    echo "❌ 后端启动失败！错误信息："
    echo "================================"
    cat "$SERVER_LOG"
    echo "================================"
    rm -f "$SERVER_LOG"
    exit 1
  fi

  # 检查端口是否已监听
  if command -v curl &>/dev/null; then
    if curl -s http://localhost:3001/api/time >/dev/null 2>&1; then
      echo "   ✅ 后端启动成功 (PID: $SERVER_PID)"
      break
    fi
  elif command -v nc &>/dev/null; then
    if nc -z localhost 3001 2>/dev/null; then
      echo "   ✅ 后端启动成功 (PID: $SERVER_PID)"
      break
    fi
  fi

  # 备用检查：看日志中是否有启动成功标志
  if grep -q "种田游戏服务器运行" "$SERVER_LOG" 2>/dev/null; then
    echo "   ✅ 后端启动成功 (PID: $SERVER_PID)"
    break
  fi

  sleep 1
  WAITED=$((WAITED + 1))
  printf "   等待中... %ds/%ds\r" "$WAITED" "$MAX_WAIT"
done

echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
  echo "⚠️  后端启动超时（${MAX_WAIT}秒），继续尝试启动前端..."
  echo "   后端日志："
  cat "$SERVER_LOG"
fi

# ==================== 构建前端 ====================
echo ""
echo "🔨 [2/3] 构建前端..."

cd "$SCRIPT_DIR/client"

# 检查是否有旧的 build 目录（用于对比）
NEED_REBUILD=true
if [ -d "build" ] && [ -f ".build_hash" ]; then
  # 检查源码是否有变更
  NEW_HASH=$(find src public -type f -exec md5sum {} \; 2>/dev/null | md5sum | cut -d' ' -f1)
  OLD_HASH=$(cat ".build_hash")
  if [ "$NEW_HASH" = "$OLD_HASH" ]; then
    NEED_REBUILD=false
    echo "   ⏭️  源码未变更，跳过重新编译"
  fi
fi

if [ "$NEED_REBUILD" = true ]; then
  echo "   正在编译前端（这可能需要 1-2 分钟）..."
  BUILD_LOG="$SCRIPT_DIR/client/build.log"
  npx react-scripts build > "$BUILD_LOG" 2>&1
  BUILD_EXIT=$?

  if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo "❌ 前端编译失败！错误信息："
    echo "================================"
    tail -30 "$BUILD_LOG"
    echo "================================"
    kill $SERVER_PID 2>/dev/null
    rm -f "$BUILD_LOG"
    exit 1
  fi

  # 保存编译哈希
  find src public -type f -exec md5sum {} \; 2>/dev/null | md5sum | cut -d' ' -f1 > ".build_hash"
  rm -f "$BUILD_LOG"
  echo "   ✅ 前端编译成功"
fi

# ==================== 启动前端静态服务 ====================
echo ""
echo "🎨 [3/3] 启动前端服务..."

# 检查是否有旧的前端进程占用端口
OLD_CLIENT_PID=$(lsof -ti:3000 2>/dev/null)
if [ -n "$OLD_CLIENT_PID" ]; then
  echo "   ⚠️  端口 3000 被占用 (PID: $OLD_CLIENT_PID)，正在停止旧进程..."
  kill $OLD_CLIENT_PID 2>/dev/null
  sleep 1
fi

# 使用 serve 提供静态文件服务（比 npm start 更快、更稳定）
if command -v npx &>/dev/null; then
  cd "$SCRIPT_DIR/client"
  CLIENT_LOG="$SCRIPT_DIR/client/client.log"
  npx serve -s build -l 3000 > "$CLIENT_LOG" 2>&1 &
  CLIENT_PID=$!
else
  # 回退到 npm start（开发模式）
  cd "$SCRIPT_DIR/client"
  BROWSER=none PORT=3000 npm start > "$SCRIPT_DIR/client/client.log" 2>&1 &
  CLIENT_PID=$!
fi

# 等待前端启动
echo "   等待前端服务..."
MAX_WAIT_FRONT=15
WAITED_FRONT=0
while [ $WAITED_FRONT -lt $MAX_WAIT_FRONT ]; do
  if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo ""
    echo "❌ 前端启动失败！错误信息："
    echo "================================"
    cat "$SCRIPT_DIR/client/client.log" 2>/dev/null
    echo "================================"
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi

  if command -v curl &>/dev/null; then
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
      echo "   ✅ 前端启动成功 (PID: $CLIENT_PID)"
      break
    fi
  elif command -v nc &>/dev/null; then
    if nc -z localhost 3000 2>/dev/null; then
      echo "   ✅ 前端启动成功 (PID: $CLIENT_PID)"
      break
    fi
  fi

  sleep 1
  WAITED_FRONT=$((WAITED_FRONT + 1))
  printf "   等待中... %ds/%ds\r" "$WAITED_FRONT" "$MAX_WAIT_FRONT"
done

echo ""

# ==================== 启动完成 ====================
echo "================================"
echo "✅ 像素农场已启动！"
echo "   📦 后端: http://localhost:3001"
echo "   🎨 前端: http://localhost:3000"
echo ""
echo "   后端 PID: $SERVER_PID (日志: $SERVER_LOG)"
echo "   前端 PID: $CLIENT_PID"
echo ""
echo "💡 提示："
echo "   - 查看后端日志: tail -f $SERVER_LOG"
echo "   - 修改代码后重新运行此脚本即可自动重编译"
echo "   - 停止服务: 按 Ctrl+C"
echo "================================"

# 清理函数
cleanup() {
  echo ""
  echo "🛑 正在停止服务..."
  kill $CLIENT_PID 2>/dev/null
  kill $SERVER_PID 2>/dev/null
  rm -f "$SERVER_LOG"
  rm -f "$SCRIPT_DIR/client/client.log"
  echo "✅ 已停止"
  exit 0
}

trap cleanup INT TERM

# 持续显示后端日志（方便调试）
tail -f "$SERVER_LOG" &
TAIL_PID=$!

wait $SERVER_PID $CLIENT_PID 2>/dev/null
kill $TAIL_PID 2>/dev/null
cleanup
