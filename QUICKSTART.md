# 快速开始指南

## 一分钟快速部署

### Windows用户

1. **双击运行**
   ```
   deploy.bat
   ```

2. **等待自动完成**
   - ✅ 检查Python和Node.js环境
   - ✅ 安装所有依赖
   - ✅ 初始化数据库
   - ✅ 启动前后端服务
   - ✅ 自动打开浏览器

3. **使用默认账户登录**
   - 用户名: `admin`
   - 密码: `admin123`

### Linux/Mac用户

1. **赋予执行权限并运行**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **等待自动完成**
   - 自动检测环境
   - 安装依赖
   - 启动服务

3. **登录系统**
   - 浏览器访问: http://localhost:3000
   - 用户名/密码: admin/admin123

## 手动部署（可选）

如果自动部署失败,可以手动执行以下步骤:

### 步骤1: 安装Python依赖
```bash
pip install -r requirements.txt
```

### 步骤2: 初始化数据库
```bash
cd backend
python init_db.py
cd ..
```

### 步骤3: 安装Node.js依赖
```bash
npm install
```

### 步骤4: 启动后端（新终端）
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

或使用脚本:
```bash
# Windows
start_backend.bat

# Linux/Mac
chmod +x start_backend.sh && ./start_backend.sh
```

### 步骤5: 启动前端（新终端）
```bash
npm run dev
```

或使用脚本:
```bash
# Windows
start_frontend.bat

# Linux/Mac
chmod +x start_frontend.sh && ./start_frontend.sh
```

### 步骤6: 访问系统
打开浏览器访问: http://localhost:3000

## 常见问题

### Q: Python或Node.js未安装怎么办?

**Python下载**: https://www.python.org/downloads/ (选择3.6+版本)

**Node.js下载**: https://nodejs.org/ (选择LTS版本)

### Q: 依赖安装很慢或失败?

使用国内镜像源:

```bash
# Python
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

# Node.js
npm config set registry https://registry.npmmirror.com
npm install
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
rm data_version.db
python init_db.py
cd ..
```

### Q: 忘记管理员密码?

删除数据库并重新初始化,会重置为默认账户(admin/admin123):
```bash
cd backend
rm data_version.db
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
