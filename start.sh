#!/bin/bash

echo "🌾 启动像素农场..."

# 启动后端
echo "📦 启动后端服务器..."
cd "$(dirname "$0")/server"
node index.js &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "🎨 启动前端开发服务器..."
cd "$(dirname "$0")/client"
PORT=3000 npm start &
CLIENT_PID=$!

echo ""
echo "✅ 像素农场已启动！"
echo "   后端: http://localhost:3001"
echo "   前端: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM

wait
