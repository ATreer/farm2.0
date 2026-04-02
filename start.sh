#!/bin/bash

echo "🌾 启动像素农场..."
echo "================================"

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ==================== 启动后端 ====================
echo ""
echo "📦 [1/2] 启动后端服务器..."
cd "$SCRIPT_DIR/server"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
  echo "⚠️  后端依赖未安装，正在执行 npm install..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败！请检查网络或 package.json"
    exit 1
  fi
fi

# 启动后端，将输出重定向到日志文件，同时显示到终端
SERVER_LOG="$SCRIPT_DIR/server/server.log"
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

# ==================== 启动前端 ====================
echo ""
echo "🎨 [2/2] 启动前端开发服务器..."
cd "$SCRIPT_DIR/client"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
  echo "⚠️  前端依赖未安装，正在执行 npm install..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败！请检查网络或 package.json"
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi
fi

# 启动前端
BROWSER=none PORT=3000 npm start &
CLIENT_PID=$!

# 等待前端启动，最多等待 30 秒（React 编译较慢）
echo "   等待前端编译..."
MAX_WAIT_FRONT=30
WAITED_FRONT=0
while [ $WAITED_FRONT -lt $MAX_WAIT_FRONT ]; do
  if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo ""
    echo "❌ 前端启动失败！请检查上方错误信息"
    kill $SERVER_PID 2>/dev/null
    exit 1
  fi

  # 检查前端端口
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

  sleep 2
  WAITED_FRONT=$((WAITED_FRONT + 2))
  printf "   编译中... %ds/%ds\r" "$WAITED_FRONT" "$MAX_WAIT_FRONT"
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
echo "   - 停止服务: 按 Ctrl+C"
echo "================================"

# 清理函数
cleanup() {
  echo ""
  echo "🛑 正在停止服务..."
  kill $CLIENT_PID 2>/dev/null
  kill $SERVER_PID 2>/dev/null
  rm -f "$SERVER_LOG"
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
