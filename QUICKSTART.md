# 快速开始指南

## 前置要求

- **Conda**: 已安装Anaconda或Miniconda
- **Node.js**: 14+ 版本
- **Conda环境**: 需要创建名为 `fastapi` 的conda环境

## 创建Conda环境（首次使用）

```bash
# 创建fastapi环境
conda create -n fastapi python=3.8

# 激活环境
conda activate fastapi
```

## 一分钟快速部署

### Windows用户

1. **双击运行**
   ```
   deploy.bat
   ```

2. **自动完成以下步骤**
   - ✅ 激活fastapi conda环境
   - ✅ 检查Node.js环境
   - ✅ 配置npm淘宝镜像源
   - ✅ 安装Python依赖（requirements.txt）
   - ✅ 安装Node.js依赖
   - ✅ 初始化数据库
   - ✅ 启动前后端服务
   - ✅ 自动打开浏览器

3. **使用默认账户登录**
   - 用户名: `admin`
   - 密码: `admin123`

### Linux/Mac用户

1. **激活conda环境**
   ```bash
   conda activate fastapi
   ```

2. **赋予执行权限并运行**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **登录系统**
   - 浏览器访问: http://localhost:3000
   - 用户名/密码: admin/admin123

## 手动部署（可选）

如果自动部署失败,可以手动执行以下步骤:

### 步骤1: 激活conda环境
```bash
conda activate fastapi
```

### 步骤2: 配置npm镜像源
```bash
# 查看当前源
npm config get registry

# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证设置
npm config get registry
```

### 步骤3: 安装依赖
```bash
# Python依赖
pip install -r requirements.txt

# Node.js依赖
npm install
```

### 步骤4: 初始化数据库
```bash
cd backend
python init_db.py
cd ..
```

### 步骤5: 启动后端（新终端）
```bash
# 激活环境
conda activate fastapi

# 启动后端
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

或使用脚本:
```bash
start_backend.bat  # Windows
```

### 步骤6: 启动前端（新终端）
```bash
npm run dev
```

或使用脚本:
```bash
start_frontend.bat  # Windows
```

### 步骤7: 访问系统
打开浏览器访问: http://localhost:3000

## 常见问题

### Q: Conda环境不存在?

```bash
# 创建环境
conda create -n fastapi python=3.8

# 激活环境
conda activate fastapi
```

### Q: npm安装很慢?

已自动配置淘宝镜像源。如仍然很慢,可手动设置:
```bash
npm config set registry https://registry.npmmirror.com
```

### Q: Python依赖安装失败?

使用清华镜像源:
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
```

### Q: 端口被占用怎么办?

**修改后端端口** (默认5000):
- 方式1: 修改启动命令中的 `--port 5000` 为其他端口
- 方式2: 修改 `backend/main.py` 中的端口配置

**修改前端端口** (默认3000):
- 修改 `vite.config.js` 中的 `server.port` 配置

### Q: 如何重置数据库?

```bash
cd backend
rm data_version.db  # Linux/Mac
del data_version.db  # Windows
python init_db.py
cd ..
```

### Q: 忘记管理员密码?

删除数据库并重新初始化,会重置为默认账户(admin/admin123):
```bash
cd backend
del data_version.db
python init_db.py
```

## 项目地址

- 前端: http://localhost:3000
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/docs

## 下一步

1. 使用默认账户登录
2. 创建第一个训练计划
3. 添加Stage和数据
4. 查看数据可视化

## 获取帮助

- 查看 [README.md](./README.md) - 系统概述
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) - 详细架构文档
- 检查浏览器控制台和终端的错误信息
