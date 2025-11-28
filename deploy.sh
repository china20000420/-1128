#!/bin/bash

echo "====================================="
echo "大模型训练数据版本管理系统"
echo "自动化部署脚本 v1.0"
echo "====================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Python
echo "[1/7] 检查Python环境..."
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo -e "${RED}[错误]${NC} 未找到Python! 请先安装Python 3.6+"
        echo "安装方法:"
        echo "  Ubuntu/Debian: sudo apt-get install python3 python3-pip"
        echo "  macOS: brew install python3"
        exit 1
    else
        PYTHON_CMD=python
    fi
else
    PYTHON_CMD=python3
fi

$PYTHON_CMD --version
echo -e "${GREEN}[成功]${NC} Python已安装"
echo ""

# 检查Node.js
echo "[2/7] 检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误]${NC} 未找到Node.js! 请先安装Node.js 14+"
    echo "下载地址: https://nodejs.org/"
    echo "或使用包管理器:"
    echo "  Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
    echo "                 sudo apt-get install -y nodejs"
    echo "  macOS: brew install node"
    exit 1
fi

node --version
echo -e "${GREEN}[成功]${NC} Node.js已安装"
echo ""

# 检查pip
if command -v pip3 &> /dev/null; then
    PIP_CMD=pip3
elif command -v pip &> /dev/null; then
    PIP_CMD=pip
else
    echo -e "${RED}[错误]${NC} 未找到pip! 请先安装pip"
    exit 1
fi

# 安装Python依赖
echo "[3/7] 安装Python依赖包..."
$PIP_CMD install -q fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[警告]${NC} 部分依赖安装失败，尝试使用清华镜像源..."
    $PIP_CMD install -i https://pypi.tuna.tsinghua.edu.cn/simple fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误]${NC} Python依赖安装失败!"
        exit 1
    fi
fi
echo -e "${GREEN}[成功]${NC} Python依赖安装完成"
echo ""

# 初始化数据库
echo "[4/7] 初始化数据库..."
cd backend
if [ -f "data_version.db" ]; then
    echo -e "${YELLOW}[警告]${NC} 数据库文件已存在，跳过初始化"
else
    $PYTHON_CMD init_db.py
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误]${NC} 数据库初始化失败!"
        cd ..
        exit 1
    fi
    echo -e "${GREEN}[成功]${NC} 数据库初始化完成"
    echo -e "${GREEN}[信息]${NC} 默认管理员账户 - 用户名: admin  密码: admin123"
fi
cd ..
echo ""

# 安装Node.js依赖
echo "[5/7] 安装Node.js依赖包（可能需要几分钟）..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}[警告]${NC} 依赖安装失败，尝试使用淘宝镜像源..."
    npm config set registry https://registry.npmmirror.com
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误]${NC} Node.js依赖安装失败!"
        exit 1
    fi
fi
echo -e "${GREEN}[成功]${NC} Node.js依赖安装完成"
echo ""

# 启动后端
echo "[6/7] 启动后端服务..."
cd backend
$PYTHON_CMD -m uvicorn main:app --reload --host 0.0.0.0 --port 5000 &
BACKEND_PID=$!
cd ..
sleep 3
echo -e "${GREEN}[成功]${NC} 后端服务已启动 (http://localhost:5000)"
echo ""

# 启动前端
echo "[7/7] 启动前端服务..."
sleep 2
npm run dev &
FRONTEND_PID=$!
sleep 5
echo -e "${GREEN}[成功]${NC} 前端服务已启动 (http://localhost:3000)"
echo ""

# 完成信息
echo "====================================="
echo "部署完成！"
echo "====================================="
echo ""
echo "服务地址:"
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:5000"
echo "  API文档: http://localhost:5000/docs"
echo ""
echo "默认账户:"
echo "  用户名: admin"
echo "  密码: admin123"
echo ""
echo "进程ID:"
echo "  后端PID: $BACKEND_PID"
echo "  前端PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}[提示]${NC} 按 Ctrl+C 停止所有服务"
echo ""

# 尝试打开浏览器
if command -v xdg-open &> /dev/null; then
    sleep 3
    xdg-open http://localhost:3000 &> /dev/null
elif command -v open &> /dev/null; then
    sleep 3
    open http://localhost:3000 &> /dev/null
fi

# 等待用户中断
trap "echo '';echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '服务已停止'; exit 0" INT

# 保持脚本运行
wait
