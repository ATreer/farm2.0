@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo 🌾 启动像素农场...
echo ================================

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: ==================== [0/4] 拉取最新代码 ====================
echo.
echo 📥 [0/4] 拉取最新代码...
cd /d "%SCRIPT_DIR%"

:: 检查是否有未提交的本地修改
set STASHED=0
for /f "usebackq delims=" %%l in ('git status --porcelain 2^>nul') do (
    if not "%%l"=="" (
        echo    📦 检测到本地修改，暂存中...
        git stash push -m "auto-stash-before-pull" --quiet 2>nul
        set STASHED=1
        goto :do_pull
    )
)
:do_pull

git pull 2>&1
set PULL_ERROR=1
if errorlevel 1 (
    echo    ⚠️  git pull 失败，使用本地代码继续...
    set PULL_ERROR=0
) else (
    echo    ✅ 代码已更新
)

:: 恢复暂存的修改
if !STASHED! equ 1 (
    echo    📦 恢复本地修改...
    git stash pop --quiet 2>nul
    if errorlevel 1 (
        echo    ⚠️  恢复修改时存在冲突，请手动解决
        git stash drop --quiet 2>nul
    )
)

:: ==================== [1/4] 检查依赖 ====================
echo.
echo 🔍 [1/4] 检查依赖...

:: 检查后端依赖
if not exist "%SCRIPT_DIR%server\node_modules" (
    echo    ⚠️  后端依赖未安装，正在 npm install...
    cd /d "%SCRIPT_DIR%server"
    call npm install
    if errorlevel 1 (
        echo    ❌ 后端依赖安装失败！
        pause
        exit /b 1
    )
    echo    ✅ 后端依赖安装完成
)

:: 检查前端依赖
if not exist "%SCRIPT_DIR%client\node_modules" (
    echo    ⚠️  前端依赖未安装，正在 npm install...
    cd /d "%SCRIPT_DIR%client"
    call npm install
    if errorlevel 1 (
        echo    ❌ 前端依赖安装失败！
        pause
        exit /b 1
    )
    echo    ✅ 前端依赖安装完成
)

echo    ✅ 依赖检查完成

:: ==================== [2/4] 启动后端 ====================
echo.
echo 📦 [2/4] 启动后端服务器...

:: 杀死占用 3001 端口的旧进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING" 2^>nul') do (
    echo    ⚠️  端口 3001 被占用 (PID: %%a)，正在停止...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

cd /d "%SCRIPT_DIR%server"
del /f "%SCRIPT_DIR%server\server.log" 2>nul

start "FarmGame-Server" /b cmd /c "node index.js > server.log 2>&1"

:: 等待后端启动
echo    等待后端启动...
set SERVER_READY=0
for /l %%i in (1,1,15) do (
    if !SERVER_READY! equ 0 (
        :: 用 PowerShell 检测端口
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/time' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
        if errorlevel 1 (
            timeout /t 1 /nobreak >nul
        ) else (
            set SERVER_READY=1
        )
    )
)

if !SERVER_READY! equ 1 (
    echo    ✅ 后端启动成功
) else (
    echo    ⚠️  后端启动超时，继续...
    if exist "%SCRIPT_DIR%server\server.log" (
        echo    后端日志：
        type "%SCRIPT_DIR%server\server.log"
    )
)

echo.

:: ==================== [3/4] 构建前端 ====================
echo 🔨 [3/4] 构建前端...

cd /d "%SCRIPT_DIR%client"

:: 检查是否需要重编译
set NEED_REBUILD=1
if exist "build\.build_hash" (
    :: 简单检查：对比 build_hash 文件时间与 src 目录最新文件时间
    for /f "delims=" %%h in (build\.build_hash) do set OLD_HASH=%%h
    :: 用 certutil 计算 hash（Windows 内置）
    set NEW_HASH=
    for /f "skip=1 delims=" %%f in ('certutil -hashfile package.json MD5 2^>nul ^| findstr /v ":"') do (
        if not defined NEW_HASH set NEW_HASH=%%f
    )
    if "!NEW_HASH!"=="!OLD_HASH!" (
        if exist "build\index.html" (
            set NEED_REBUILD=0
            echo    ⏭️  源码未变更，跳过编译
        )
    )
)

if !NEED_REBUILD! equ 1 (
    echo    正在编译前端（可能需要 1-2 分钟）...
    call npx react-scripts build
    if errorlevel 1 (
        echo.
        echo    ❌ 前端编译失败！请检查上方错误信息
        pause
        exit /b 1
    )
    echo    ✅ 前端编译成功
)

:: ==================== [4/4] 启动前端服务 ====================
echo.
echo 🎨 [4/4] 启动前端服务...

:: 杀死占用 3000 端口的旧进程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    echo    ⚠️  端口 3000 被占用 (PID: %%a)，正在停止...
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

cd /d "%SCRIPT_DIR%client"

:: 使用 npx -y 跳过安装确认，使用 http-server 提供静态服务
start "FarmGame-Client" /b cmd /c "npx -y http-server build -p 3000 -c-1 --silent > client.log 2>&1"

:: 等待前端启动
echo    等待前端服务...
set CLIENT_READY=0
for /l %%i in (1,1,15) do (
    if !CLIENT_READY! equ 0 (
        powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
        if errorlevel 1 (
            timeout /t 1 /nobreak >nul
        ) else (
            set CLIENT_READY=1
        )
    )
)

if !CLIENT_READY! equ 1 (
    echo    ✅ 前端启动成功
) else (
    echo    ⚠️  前端启动超时，继续...
)

echo.

:: ==================== 完成 ====================
echo ================================
echo ✅ 像素农场已启动！
echo    📦 后端: http://localhost:3001
echo    🎨 前端: http://localhost:3000
echo.
echo 💡 提示：
echo    - 修改代码后重新运行此脚本即可自动重编译
echo    - 停止服务: 关闭此窗口 或 按 Ctrl+C
echo ================================
echo.

:: 保持窗口打开，显示后端日志
echo 📋 后端实时日志（Ctrl+C 停止所有服务）：
echo ================================
if exist "%SCRIPT_DIR%server\server.log" (
    :: 用 PowerShell 实时跟踪日志
    powershell -Command "Get-Content '%SCRIPT_DIR%server\server.log' -Wait -Tail 20"
) else (
    echo    （暂无日志）
    pause
)

:: 清理
echo.
echo 🛑 正在停止服务...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
del /f "%SCRIPT_DIR%server\server.log" 2>nul
del /f "%SCRIPT_DIR%client\client.log" 2>nul
echo ✅ 已停止
endlocal
