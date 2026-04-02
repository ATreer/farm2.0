#!/bin/bash

echo "🌾 启动像素农场..."
echo "================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ==================== [0/4] 拉取最新代码 ====================
echo ""
echo "📥 [0/4] 拉取最新代码..."
cd "$SCRIPT_DIR"

# 检查是否有未提交的本地修改
HAS_CHANGES=$(git status --porcelain 2>/dev/null | head -1)
if [ -n "$HAS_CHANGES" ]; then
  echo "   📦 检测到本地修改，暂存中..."
  git stash push -m "auto-stash-before-pull" --quiet 2>&1
  STASHED=1
else
  STASHED=0
fi

git pull 2>&1
PULL_RESULT=$?

# 恢复暂存的修改
if [ "$STASHED" = "1" ]; then
  echo "   📦 恢复本地修改..."
  git stash pop --quiet 2>&1
  if [ $? -ne 0 ]; then
    echo "   ⚠️  恢复修改时存在冲突，请手动解决"
    git stash drop --quiet 2>/dev/null
  fi
fi

if [ $PULL_RESULT -ne 0 ]; then
  echo "   ⚠️  git pull 失败，使用本地代码继续..."
else
  echo "   ✅ 代码已更新"
fi

# ==================== 函数 ====================

check_and_install_deps() {
  local dir="$1" name="$2"
  local hash_file="$dir/.dep_hash"
  local current_hash=$(cat "$dir/package.json" "$dir/package-lock.json" 2>/dev/null | md5sum | cut -d' ' -f1)
  local saved_hash=""

  if [ ! -d "$dir/node_modules" ]; then
    echo "   ⚠️  $name 依赖未安装，正在 npm install..."
    cd "$dir" && npm install --prefer-offline 2>&1 | tail -3
    [ $? -ne 0 ] && echo "   ❌ $name 依赖安装失败！" && return 1
    echo "$current_hash" > "$hash_file"
    return 0
  fi

  [ -f "$hash_file" ] && saved_hash=$(cat "$hash_file")
  if [ "$current_hash" != "$saved_hash" ]; then
    echo "   📦 检测到 $name 依赖变更，重新安装..."
    cd "$dir" && npm install 2>&1 | tail -3
    [ $? -ne 0 ] && echo "   ❌ $name 依赖安装失败！" && return 1
    echo "$current_hash" > "$hash_file"
    echo "   ✅ 依赖更新完成"
  fi
  return 0
}

wait_for_port() {
  local port=$1 max_wait=$2 label=$3
  local waited=0
  while [ $waited -lt $max_wait ]; do
    if command -v curl &>/dev/null; then
      curl -s -o /dev/null -w "" "http://localhost:$port" 2>/dev/null && return 0
    elif command -v nc &>/dev/null; then
      nc -z localhost $port 2>/dev/null && return 0
    elif command -v powershell &>/dev/null; then
      powershell -Command "Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet" 2>/dev/null && return 0
    fi
    sleep 1
    waited=$((waited + 1))
    printf "   %s 等待中... %ds/%ds\r" "$label" "$waited" "$max_wait"
  done
  return 1
}

kill_port() {
  local port=$1
  # 尝试多种方式杀死占用端口的进程
  lsof -ti:$port 2>/dev/null | xargs kill 2>/dev/null
  fuser -k $port/tcp 2>/dev/null
}

# ==================== [1/4] 检查依赖 ====================
echo ""
echo "🔍 [1/4] 检查依赖..."

check_and_install_deps "$SCRIPT_DIR/server" "后端" || exit 1
check_and_install_deps "$SCRIPT_DIR/client" "前端" || exit 1

echo "   ✅ 依赖检查完成"

# ==================== [2/4] 启动后端 ====================
echo ""
echo "📦 [2/4] 启动后端服务器..."

kill_port 3001
sleep 1

SERVER_LOG="$SCRIPT_DIR/server/server.log"
rm -f "$SERVER_LOG"
cd "$SCRIPT_DIR/server"

node index.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!

if wait_for_port 3001 15 "后端"; then
  echo "   ✅ 后端启动成功 (PID: $SERVER_PID)"
else
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo ""
    echo "   ❌ 后端启动失败！错误信息："
    cat "$SERVER_LOG"
    rm -f "$SERVER_LOG"
    exit 1
  fi
  echo "   ⚠️  后端启动超时，继续..."
fi

echo ""

# ==================== [3/4] 构建前端 ====================
echo "🔨 [3/4] 构建前端..."

cd "$SCRIPT_DIR/client"

# 每次都重新编译，确保代码最新
echo "   正在编译前端..."
BUILD_LOG="$SCRIPT_DIR/client/build.log"
rm -rf build
npx react-scripts build > "$BUILD_LOG" 2>&1

if [ $? -ne 0 ]; then
  echo ""
  echo "   ❌ 前端编译失败！"
  tail -20 "$BUILD_LOG"
  kill $SERVER_PID 2>/dev/null
  rm -f "$BUILD_LOG"
  exit 1
fi

rm -f "$BUILD_LOG"
echo "   ✅ 前端编译成功"

# ==================== [4/4] 启动前端服务 ====================
echo ""
echo "🎨 [4/4] 启动前端服务..."

kill_port 3000
sleep 1

cd "$SCRIPT_DIR/client"
CLIENT_LOG="$SCRIPT_DIR/client/client.log"

# 使用 npx -y 跳过安装确认，使用 http-server 作为轻量静态服务
# http-server 是 react-scripts 自带的依赖，无需额外安装
npx -y http-server build -p 3000 -c-1 --silent > "$CLIENT_LOG" 2>&1 &
CLIENT_PID=$!

if wait_for_port 3000 10 "前端"; then
  echo "   ✅ 前端启动成功 (PID: $CLIENT_PID)"
else
  if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo "   ❌ 前端启动失败！"
    cat "$CLIENT_LOG" 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
  echo "   ⚠️  前端启动超时，继续..."
fi

echo ""

# ==================== 完成 ====================
echo "================================"
echo "✅ 像素农场已启动！"
echo "   📦 后端: http://localhost:3001"
echo "   🎨 前端: http://localhost:3000"
echo ""
echo "   后端 PID: $SERVER_PID"
echo "   前端 PID: $CLIENT_PID"
echo ""
echo "💡 提示："
echo "   - 查看后端日志: tail -f $SERVER_LOG"
echo "   - 修改代码后重新运行此脚本即可自动重编译"
echo "   - 停止服务: 按 Ctrl+C"
echo "================================"

cleanup() {
  echo ""
  echo "🛑 正在停止服务..."
  kill $CLIENT_PID 2>/dev/null
  kill $SERVER_PID 2>/dev/null
  rm -f "$SERVER_LOG" "$CLIENT_LOG"
  echo "✅ 已停止"
  exit 0
}

trap cleanup INT TERM

tail -f "$SERVER_LOG" &
TAIL_PID=$!

wait $SERVER_PID $CLIENT_PID 2>/dev/null
kill $TAIL_PID 2>/dev/null
cleanup
