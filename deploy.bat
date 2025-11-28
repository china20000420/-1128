@echo off
chcp 65001 >nul
echo =====================================
echo 大模型训练数据版本管理系统
echo 自动化部署脚本 v1.0
echo =====================================
echo.

:: 检查Python
echo [1/7] 检查Python环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Python! 请先安装Python 3.6+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo [成功] Python已安装
echo.

:: 检查Node.js
echo [2/7] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到Node.js! 请先安装Node.js 14+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo [成功] Node.js已安装
echo.

:: 安装Python依赖
echo [3/7] 安装Python依赖包...
pip install -q fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart
if %errorlevel% neq 0 (
    echo [警告] 部分依赖安装失败，尝试使用清华镜像源...
    pip install -i https://pypi.tuna.tsinghua.edu.cn/simple fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart
)
echo [成功] Python依赖安装完成
echo.

:: 初始化数据库
echo [4/7] 初始化数据库...
cd backend
if exist data_version.db (
    echo [警告] 数据库文件已存在，跳过初始化
) else (
    python init_db.py
    if %errorlevel% neq 0 (
        echo [错误] 数据库初始化失败!
        cd ..
        pause
        exit /b 1
    )
    echo [成功] 数据库初始化完成
    echo [信息] 默认管理员账户 - 用户名: admin  密码: admin123
)
cd ..
echo.

:: 安装Node.js依赖
echo [5/7] 安装Node.js依赖包（可能需要几分钟）...
call npm install
if %errorlevel% neq 0 (
    echo [警告] 依赖安装失败，尝试使用淘宝镜像源...
    call npm config set registry https://registry.npmmirror.com
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] Node.js依赖安装失败!
        pause
        exit /b 1
    )
)
echo [成功] Node.js依赖安装完成
echo.

:: 启动后端
echo [6/7] 启动后端服务...
start "后端服务" cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 5000"
timeout /t 3 /nobreak >nul
echo [成功] 后端服务已启动 (http://localhost:5000)
echo.

:: 启动前端
echo [7/7] 启动前端服务...
timeout /t 2 /nobreak >nul
start "前端服务" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo [成功] 前端服务已启动 (http://localhost:3000)
echo.

:: 打开浏览器
echo =====================================
echo 部署完成！
echo =====================================
echo.
echo 服务地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:5000
echo   API文档: http://localhost:5000/docs
echo.
echo 默认账户:
echo   用户名: admin
echo   密码: admin123
echo.
echo 正在打开浏览器...
timeout /t 3 /nobreak >nul
start http://localhost:3000
echo.
echo [提示] 如需停止服务，请关闭相应的命令行窗口
echo.
pause
