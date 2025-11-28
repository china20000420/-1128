# 项目文件清单

本文档列出了项目中所有关键文件及其作用。

## 📁 项目根目录

| 文件名 | 类型 | 作用 | 是否必需 |
|--------|------|------|----------|
| `README.md` | 文档 | 项目概述和快速开始指南 | 是 |
| `ARCHITECTURE.md` | 文档 | 详细架构文档,包含所有技术细节 | 是 |
| `QUICKSTART.md` | 文档 | 快速开始指南 | 是 |
| `package.json` | 配置 | Node.js项目配置,定义依赖和脚本 | 是 |
| `package-lock.json` | 配置 | Node.js依赖锁定文件,确保版本一致 | 是 |
| `requirements.txt` | 配置 | Python依赖列表 | 是 |
| `vite.config.js` | 配置 | Vite前端构建工具配置 | 是 |
| `index.html` | HTML | 前端入口HTML文件 | 是 |
| `deploy.bat` | 脚本 | Windows自动化部署脚本 | 推荐 |
| `deploy.sh` | 脚本 | Linux/Mac自动化部署脚本 | 推荐 |
| `start_backend.bat` | 脚本 | Windows后端启动脚本 | 推荐 |
| `start_frontend.bat` | 脚本 | Windows前端启动脚本 | 推荐 |

## 📁 backend/ (后端代码)

| 文件名 | 代码行数 | 主要作用 | 关键功能 |
|--------|---------|---------|---------|
| `main.py` | ~600 | FastAPI主应用 | 定义所有API端点 |
| `models.py` | ~150 | 数据库模型 | User, Plan, Stage, TableRow, CategoryDetail |
| `database.py` | ~30 | 数据库配置 | SQLAlchemy连接和会话管理 |
| `auth.py` | ~100 | 认证模块 | JWT token生成/验证,密码加密 |
| `init_db.py` | ~40 | 数据库初始化 | 创建表结构和默认管理员账户 |
| `data_version.db` | 数据库 | SQLite数据库文件 | 运行后自动生成 |

### main.py 主要端点
- **认证**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
- **计划管理**: `/api/plans` (GET/POST), `/api/plans/{name}` (PUT/DELETE)
- **计划详情**: `/api/plan{name}` (GET/POST)
- **类别管理**: `/api/plans/{plan}/stages/{stage}/categories`
- **数据详情**: `/api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}`
- **可视化**: `/api/plans/{plan}/visualization`

## 📁 src/ (前端代码)

| 文件名 | 组件类型 | 主要作用 | 路由 |
|--------|---------|---------|------|
| `main.jsx` | 入口 | 应用启动入口,渲染根组件 | - |
| `App.jsx` | 布局 | 主应用组件,路由和导航栏 | - |
| `index.css` | 样式 | 全局CSS样式 | - |

### src/pages/ (页面组件)

| 文件名 | 功能 | 路由 | 核心特性 |
|--------|------|------|---------|
| `Home.jsx` | 首页 | `/` | 训练计划列表,创建/编辑/删除计划 |
| `Login.jsx` | 登录页 | `/login` | 用户认证,JWT token获取 |
| `PlanDetail.jsx` | 计划概览 | `/plan/:planName` | Stage表格,Excel导入导出,Stage管理 |
| `StageDetail.jsx` | 阶段详情 | `/plan/:planName/:stageName` | 一级/二级类别管理,Token统计 |
| `CategoryDetail.jsx` | 数据表 | `/plan/:planName/:stageName/:cat/:subcat` | 数据编辑,双击编辑,自动保存 |
| `Visualization.jsx` | 数据可视化 | `/visualization` | 图表统计,多维度分析 |

### src/utils/ (工具函数)

| 文件名 | 主要函数 | 作用 |
|--------|---------|------|
| `auth.js` | `setAuthToken`, `getToken`, `isAdmin`, `logout` | 认证token管理和权限判断 |

## 📁 public/ (静态资源)

| 文件/目录 | 作用 |
|----------|------|
| `vite.svg` | Vite图标 |

## 📁 node_modules/ (Node.js依赖)

运行 `npm install` 后自动生成,包含所有前端依赖包。**不要手动修改此目录**。

主要依赖:
- `react` + `react-dom` - React核心
- `react-router-dom` - 路由管理
- `antd` - UI组件库
- `recharts` - 图表库
- `axios` - HTTP客户端
- `xlsx` - Excel处理
- `vite` - 构建工具

## 🔧 配置文件详解

### package.json
```json
{
  "scripts": {
    "dev": "vite",           // 启动开发服务器
    "build": "vite build",   // 构建生产版本
    "preview": "vite preview" // 预览构建结果
  }
}
```

### vite.config.js
```javascript
export default defineConfig({
  server: {
    port: 3000,              // 前端端口
    proxy: {                 // API代理配置
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### requirements.txt
```
fastapi          # Web框架
uvicorn          # ASGI服务器
sqlalchemy       # ORM
pydantic         # 数据验证
python-jose      # JWT
passlib          # 密码加密
bcrypt           # 加密算法
python-multipart # 文件上传
```

## 📊 代码统计

| 类别 | 文件数 | 代码行数(约) |
|------|-------|-------------|
| 后端Python | 5 | 900 |
| 前端React | 9 | 2500 |
| 配置文件 | 4 | 100 |
| 文档 | 3 | 1500 |
| **总计** | **21** | **5000** |

## 🗂️ 文件关系图

```
index.html
    ↓
main.jsx (入口)
    ↓
App.jsx (路由和布局)
    ├── Home.jsx → /api/plans
    ├── PlanDetail.jsx → /api/plan{name}
    ├── StageDetail.jsx → /api/plans/{plan}/stages/{stage}/categories
    ├── CategoryDetail.jsx → /api/plans/.../categories/{cat}/{subcat}
    └── Visualization.jsx → /api/plans/{plan}/visualization
```

## 🔐 安全相关文件

| 文件 | 安全功能 |
|------|---------|
| `auth.py` | JWT token生成,密码bcrypt加密 |
| `auth.js` | Token本地存储,请求头注入 |
| `models.py` | 用户模型,权限字段 |

## 📦 可删除的文件(如已存在)

以下文件如果在您的项目中存在,可以安全删除:

- `.gitignore` (Git配置,可选)
- `.eslintrc.*` (ESLint配置,可选)
- `.prettierrc` (Prettier配置,可选)
- `启动说明.txt` (已删除)
- `如何访问.txt` (已删除)
- `docs/` 目录 (已删除)
- 任何 `.md` 文件除了 `README.md`, `ARCHITECTURE.md`, `QUICKSTART.md`

## 📌 重要提示

1. **不要修改**:
   - `package-lock.json` - 锁定依赖版本
   - `node_modules/` - 自动生成
   - `data_version.db` - 运行时生成(删除会丢失数据)

2. **可以修改**:
   - `vite.config.js` - 修改端口等配置
   - `src/` 下所有文件 - 业务逻辑
   - `backend/main.py` - API端点

3. **需要版本控制** (Git):
   - 所有 `.py`, `.jsx`, `.js`, `.css` 文件
   - 配置文件 `.json`, `.config.js`
   - 文档文件 `.md`
   - 排除: `node_modules/`, `data_version.db`, `__pycache__/`

## 🔄 更新记录

- v1.0.0 (2024-11-28): 初始版本,所有核心功能完成
