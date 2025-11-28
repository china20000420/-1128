@echo off
chcp 65001 >nul
echo =====================================
echo 启动后端服务
echo =====================================
echo 服务地址: http://localhost:5000
echo API文档: http://localhost:5000/docs
echo =====================================
echo 激活conda环境: fastapi
call conda activate fastapi
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000
