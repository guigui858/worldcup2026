@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title 世界杯预测网站 · 一键更新

REM 让 git 输出 UTF-8 中文不乱码
set LC_ALL=C.UTF-8
set LANG=C.UTF-8

echo.
echo ========================================
echo   🏆 世界杯预测网站 · 一键更新到公网
echo ========================================
echo.
echo 📂 当前目录：%CD%
echo 🌐 公网链接：https://guigui858.github.io/worldcup2026/
echo.

REM ==== 1. 检查代理是否开着 ====
echo [1/5] 检查代理（Clash Verge 端口 7897）...
powershell -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 7897); $c.Close(); exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ 代理端口 7897 没开！
    echo    请先打开 Clash Verge / V2rayN，再重试。
    echo.
    pause
    exit /b 1
)
echo     ✓ 代理通

REM ==== 2. 看哪些文件改了 ====
echo.
echo [2/5] 检查改动...
git status --short
git status --short >nul 2>&1
for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
if "%CHANGES%"=="0" (
    echo.
    echo ⚠️  没有任何文件改动，无需更新。
    echo.
    pause
    exit /b 0
)
echo     ✓ 有 %CHANGES% 个文件改动

REM ==== 3. 让用户输入 commit 描述 ====
echo.
echo [3/5] 请简单描述一下你改了什么（中英文都行）：
echo        例如：加了 6/15 比赛结果 / 修了方法论文案 / 调样式
echo.
set /p MSG="    > "
if "%MSG%"=="" set MSG=update

REM ==== 4. add + commit ====
echo.
echo [4/5] 提交改动...
git add -A
git commit -m "update: %MSG%" 2>&1
if errorlevel 1 (
    echo.
    echo ❌ commit 失败，看看上面报什么错。
    pause
    exit /b 1
)

REM ==== 5. push ====
echo.
echo [5/5] 推送到 GitHub...
git push 2>&1
if errorlevel 1 (
    echo.
    echo ❌ push 失败！可能原因：
    echo    1. 代理没开稳（试试关闭再打开 Clash Verge）
    echo    2. 网络抽风（等 30 秒重试）
    echo    3. 看上面具体错误信息
    echo.
    echo 修好之后只要重新双击这个 .bat 文件即可，
    echo 已经 commit 的改动还在，会自动重试 push。
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 更新成功！
echo ========================================
echo.
echo 🌐 60 秒后访问 https://guigui858.github.io/worldcup2026/
echo    刷新页面就是新版（GitHub Pages 自动重部署）
echo.
echo 💡 提示：可以打开下面这个链接看部署进度：
echo    https://github.com/guigui858/worldcup2026/actions
echo.
pause
