@echo off
chcp 65001 >nul
echo =====================================
echo 启动后端服务
echo =====================================
echo 服务地址: http://localhost:5000
echo API文档: http://localhost:5000/docs
echo =====================================
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 5000
