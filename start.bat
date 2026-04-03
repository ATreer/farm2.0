@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

echo.
echo ================================
echo   🌾 像素农场 启动器
echo ================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: ==================== 参数解析 ====================
set "RESET_DB=0"
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--reset-db" set "RESET_DB=1"
if /i "%~1"=="-r" set "RESET_DB=1"
shift
goto :parse_args
:args_done

:: ==================== 数据库重置 ====================
if "!RESET_DB!"=="1" (
    echo.
    echo [DB] 🗑️  重置数据库...
    if exist "%SCRIPT_DIR%server\farm.db" (
        del /f "%SCRIPT_DIR%server\farm.db" 2>nul
        echo      ✅ 已删除 farm.db
    ) else (
        echo      ℹ️  数据库文件不存在，跳过
    )
    echo      💡 下次启动后端时会自动重新初始化
    echo.
)

:: 如果没有 git 仓库，跳过拉取
set "HAS_GIT=0"
if exist ".git" set "HAS_GIT=1"

:: ==================== [0/4] 拉取最新代码 ====================
if "!HAS_GIT!"=="1" (
    echo [0/4] 📥 拉取最新代码...

    :: 检查是否有本地修改
    set "STASHED=0"
    for /f "usebackq tokens=1" %%l in (`git status --porcelain 2^>nul`) do (
        set "STASHED=1"
    )

    if "!STASHED!"=="1" (
        echo      📦 检测到本地修改，暂存中...
        git stash push -m "auto-stash" --quiet 2>nul
    )

    git pull --no-rebase 2>&1
    if errorlevel 1 (
        echo      ⚠️  git pull 失败，使用本地代码继续
    ) else (
        echo      ✅ 代码已更新
    )

    if "!STASHED!"=="1" (
        echo      📦 恢复本地修改...
        git stash pop --quiet 2>nul
        if errorlevel 1 (
            echo      ⚠️  恢复时存在冲突，已丢弃暂存
            git stash drop --quiet 2>nul
        )
    )
    echo.
) else (
    echo [0/4] ⏭️  非 git 仓库，跳过拉取
    echo.
)

:: ==================== [1/4] 检查依赖 ====================
echo [1/4] 🔍 检查依赖...

if not exist "%SCRIPT_DIR%server\node_modules" (
    echo      后端依赖缺失，安装中...
    cd /d "%SCRIPT_DIR%server"
    call npm install 2>&1
    if errorlevel 1 (
        echo      ❌ 后端依赖安装失败
        goto :fail
    )
    echo      ✅ 后端依赖安装完成
)

if not exist "%SCRIPT_DIR%client\node_modules" (
    echo      前端依赖缺失，安装中...
    cd /d "%SCRIPT_DIR%client"
    call npm install 2>&1
    if errorlevel 1 (
        echo      ❌ 前端依赖安装失败
        goto :fail
    )
    echo      ✅ 前端依赖安装完成
)

echo      ✅ 依赖检查完成
echo.

:: ==================== [2/4] 启动后端 ====================
echo [2/4] 📦 启动后端服务器...

:: 清理 3001 端口
call :kill_port 3001

cd /d "%SCRIPT_DIR%server"
del /f server.log 2>nul

start "" /b cmd /c "chcp 65001 >nul & node index.js > server.log 2>&1"

:: 等待后端启动（最多 15 秒）
set "SRV_OK=0"
for /l %%i in (1,1,15) do (
    if "!SRV_OK!"=="0" (
        ping -n 2 127.0.0.1 >nul 2>&1
        curl -s -o nul http://localhost:3001/api/time >nul 2>&1
        if not errorlevel 1 set "SRV_OK=1"
    )
)

if "!SRV_OK!"=="1" (
    echo      ✅ 后端启动成功
) else (
    echo      ⚠️  后端启动超时
    if exist server.log (
        echo      ---- 错误日志 ----
        type server.log
        echo      -------------------
    )
    goto :fail
)
echo.

:: ==================== [3/4] 构建前端 ====================
echo [3/4] 🔨 构建前端...

cd /d "%SCRIPT_DIR%client"

:: 每次都重新编译，确保代码最新
echo      正在编译前端（约 1-2 分钟）...
if exist build rmdir /s /q build 2>nul
call npx react-scripts build 2>&1
if errorlevel 1 (
    echo      ❌ 前端编译失败
    goto :fail
)
echo      ✅ 前端编译成功
echo.

:: ==================== [4/4] 启动前端服务 ====================
echo [4/4] 🎨 启动前端服务...

:: 清理 3000 端口
call :kill_port 3000

cd /d "%SCRIPT_DIR%client"
start "" /b cmd /c "npx -y http-server build -p 3000 -c-1 --silent > client.log 2>&1"

:: 等待前端启动（最多 10 秒）
set "CLI_OK=0"
for /l %%i in (1,1,10) do (
    if "!CLI_OK!"=="0" (
        ping -n 2 127.0.0.1 >nul 2>&1
        curl -s -o nul http://localhost:3000 >nul 2>&1
        if not errorlevel 1 set "CLI_OK=1"
    )
)

if "!CLI_OK!"=="1" (
    echo      ✅ 前端启动成功
) else (
    echo      ⚠️  前端启动超时
    if exist client.log (
        echo      ---- 错误日志 ----
        type client.log
        echo      -------------------
    )
    goto :fail
)
echo.

:: ==================== 启动成功 ====================
echo ================================
echo   ✅ 像素农场已启动！
echo   📦 后端: http://localhost:3001
echo   🎨 前端: http://localhost:3000
echo.
echo   关闭此窗口即可停止所有服务
echo ================================
echo.
echo 📋 后端实时日志：
echo ================================

:: 实时显示后端日志（关闭窗口时自动结束）
powershell -NoProfile -Command "Get-Content '%SCRIPT_DIR%server\server.log' -Wait -Tail 30" 2>nul
if errorlevel 1 (
    :: PowerShell 不可用时用 type 模拟
    type "%SCRIPT_DIR%server\server.log"
    echo.
    echo 按任意键退出...
    pause >nul
)

goto :cleanup

:: ==================== 失败处理 ====================
:fail
echo.
echo ================================
echo   ❌ 启动失败，请检查上方错误信息
echo ================================
echo.
echo 按任意键退出...
pause >nul
goto :cleanup

:: ==================== 清理 ====================
:cleanup
echo.
echo 🛑 正在停止服务...
call :kill_port 3001
call :kill_port 3000
del /f "%SCRIPT_DIR%server\server.log" 2>nul
del /f "%SCRIPT_DIR%client\client.log" 2>nul
echo ✅ 已停止
endlocal
exit /b

:: ==================== 子程序：清理端口 ====================
:kill_port
set "KILL_PORT=%~1"
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%KILL_PORT% " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
exit /b
