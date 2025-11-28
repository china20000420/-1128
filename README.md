# 大模型训练数据版本管理系统

一个专业的大模型训练数据版本管理系统,支持多计划、多阶段的数据管理,具备Excel导入导出、实时数据可视化等功能。

## 系统特性

- 🚀 **多计划管理**：支持创建多个独立的训练计划（如72B、120B、200B等）
- 📊 **阶段管理**：每个计划支持自定义多个训练阶段（Stage）
- 📁 **类别体系**：支持二级类别管理（一级类别/二级类别）
- 📈 **数据可视化**：实时统计图表,包含柱状图、饼图、折线图等
- 📤 **Excel导入导出**：支持Excel模板导入和数据导出
- 👥 **权限管理**：管理员/普通用户权限控制
- 💾 **自动保存**：数据修改后自动保存,防止数据丢失
- 🎨 **美观界面**：基于Ant Design的现代化UI

## 技术栈

### 前端
- React 18 + React Router 6
- Ant Design 5 - UI组件库
- Recharts - 数据可视化
- XLSX.js - Excel处理
- Axios + Vite

### 后端
- FastAPI + SQLAlchemy
- SQLite数据库
- JWT身份认证
- Bcrypt密码加密

## 快速开始

### 方式一：自动化部署（推荐）

```bash
# Windows
deploy.bat

# Linux/Mac
chmod +x deploy.sh && ./deploy.sh
```

自动部署会完成所有配置并启动服务。

### 方式二：手动部署

#### 1. 安装依赖

```bash
# 后端依赖
pip install -r requirements.txt

# 前端依赖
npm install
```

#### 2. 初始化数据库

```bash
cd backend
python init_db.py
```

#### 3. 启动服务

```bash
# 后端（终端1）
start_backend.bat

# 前端（终端2）
start_frontend.bat
```

#### 4. 访问系统

- 前端：http://localhost:3000
- 后端API：http://localhost:5000/docs

## 默认账户

- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
wangzhan/
├── backend/              # 后端代码
│   ├── main.py          # API端点
│   ├── models.py        # 数据模型
│   ├── database.py      # 数据库配置
│   ├── auth.py          # 认证模块
│   └── init_db.py       # 数据库初始化
├── src/                 # 前端代码
│   ├── pages/           # 页面组件
│   ├── utils/           # 工具函数
│   ├── App.jsx          # 主应用
│   └── main.jsx         # 入口
├── deploy.bat           # 自动部署脚本
├── start_backend.bat    # 后端启动
├── start_frontend.bat   # 前端启动
├── requirements.txt     # Python依赖
└── ARCHITECTURE.md      # 架构文档
```

## 核心功能

1. **训练计划管理** - 创建/编辑/删除多个独立训练计划
2. **阶段管理** - 动态添加/修改/删除Stage
3. **类别管理** - 二级类别体系,实时Token统计
4. **数据表管理** - Excel导入导出,双击编辑,自动保存
5. **数据可视化** - 多维度图表分析,实时统计

## 常见问题

### 端口被占用
修改 `vite.config.js` (前端)或启动命令中的端口号

### 依赖安装失败
```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
npm config set registry https://registry.npmmirror.com
```

### 数据库重置
```bash
cd backend && rm data_version.db && python init_db.py
```

## 详细文档

完整的架构说明、API文档、文件详解请查看 [ARCHITECTURE.md](./ARCHITECTURE.md)

## 版本

v1.0.0 (2024-11-28)
