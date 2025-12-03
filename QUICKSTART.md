# 快速开始指南

## 系统简介

这是一个大模型训练数据版本管理系统，用于管理多个训练计划的数据分类、Token统计和阶段管理。

### 核心功能
- **多计划管理**: 支持创建多个训练计划
- **阶段管理**: 每个计划包含多个Stage，每个Stage有独立的数据表和类别
- **类别管理**: 二级类别结构（一级类别 → 二级类别）
- **数据表**: 每个二级类别包含数据路径、Token统计等信息
- **Token自动统计**: 实时计算和显示Token使用量
- **Excel导入导出**: 支持批量数据导入和导出
- **数据可视化**: 图表展示Token分布和趋势

## 环境要求

### 必需软件
- **Python**: 3.8 或更高版本
- **Node.js**: 14.x 或更高版本
- **npm**: 6.x 或更高版本

### 推荐使用
- **Conda**: 用于Python环境管理（可选但推荐）
- **VS Code**: 代码编辑器

## 安装步骤

### 1. 克隆或下载项目

```bash
# 如果使用Git
git clone <repository-url>
cd 1202_website

# 或直接解压下载的压缩包
```

### 2. 安装后端依赖

#### 使用Conda（推荐）

```bash
# 创建conda环境
conda create -n datamanage python=3.9

# 激活环境
conda activate datamanage

# 安装依赖
cd backend
pip install -r requirements.txt
```

#### 使用系统Python

```bash
cd backend
pip install -r requirements.txt
```

**后端依赖包**:
- `fastapi`: Web框架
- `uvicorn`: ASGI服务器
- `sqlalchemy`: ORM数据库框架
- `python-multipart`: 文件上传支持
- `passlib[bcrypt]`: 密码加密
- `python-jose[cryptography]`: JWT认证

### 3. 安装前端依赖

```bash
cd ..  # 回到项目根目录
npm install
```

**前端主要依赖**:
- `react`: UI框架
- `react-router-dom`: 路由管理
- `antd`: UI组件库
- `recharts`: 图表库
- `xlsx`: Excel处理
- `axios`: HTTP客户端

## 启动应用

### 启动后端

打开**第一个终端**：

```bash
# 确保在backend目录
cd backend

# 如果使用conda
conda activate datamanage

# 启动后端服务
uvicorn main:app --reload --port 5000
```

**后端服务地址**: http://localhost:5000

**成功标志**: 看到 "Application startup complete"

### 启动前端

打开**第二个终端**：

```bash
# 确保在项目根目录
npm run dev
```

**前端服务地址**: http://localhost:3000 或 http://localhost:3001（如果3000端口被占用）

**成功标志**: 看到 "Local: http://localhost:3000"

### 访问应用

在浏览器中打开：**http://localhost:3001**（或显示的实际端口）

## 首次使用

### 1. 登录系统

**默认管理员账号**:
- 用户名: `admin`
- 密码: `admin123`

**默认普通用户账号**:
- 用户名: `user`
- 密码: `user123`

> ⚠️ 首次登录后建议修改密码

### 2. 创建训练计划

1. 点击首页的"创建新计划"按钮
2. 输入计划名称和描述
3. 点击"确定"

计划名称可以是任意字符（中文、英文、数字、下划线等）

### 3. 添加Stage

1. 点击创建的计划卡片，进入计划详情页
2. 点击"添加新阶段"按钮
3. 输入Stage名称（如 stage1、stage2 等）
4. 点击"确定"

### 4. 管理类别

#### 方法1：在Stage详情页管理

1. 点击左侧导航栏的某个Stage（如"Stage 1"）
2. 点击"添加一级类别"按钮
3. 输入类别名称（如"类别01"）
4. 点击"添加二级类别"按钮添加子类别

#### 方法2：在概览表中直接输入

1. 在计划详情页，展开某个Stage
2. 在表格中直接输入类别和子类别名称
3. 数据会自动保存

### 5. 添加数据

#### 方法1：Excel导入（推荐）

1. 进入二级类别的数据表页面
2. 点击"下载模板"按钮
3. 在Excel中填写数据：
   - v3词表hdfs路径
   - obs模糊路径
   - obs补全路径
   - 数据集总token
   - 实际使用（如 100%）
   - 实际使用token
4. 保存Excel文件
5. 点击"导入Excel"按钮上传文件

> 💡 **提示**: 在Excel中将单元格格式设置为"文本"，以保留百分比格式（100%）

#### 方法2：手动输入

1. 点击"插入空行"按钮
2. 双击单元格编辑内容
3. 数据实时自动保存

## 主要功能说明

### 计划管理
- **创建计划**: 首页 → 创建新计划
- **编辑计划**: 鼠标悬停在计划卡片 → 点击编辑图标
- **删除计划**: 鼠标悬停在计划卡片 → 点击删除图标 → 确认
- **查看计划**: 点击计划卡片进入详情

### Stage管理
- **添加Stage**: 计划详情页 → 添加新阶段
- **编辑Stage**: 点击Stage名称旁的编辑图标
- **删除Stage**: 点击删除图标 → 确认
- **查看Stage**: 点击左侧导航栏的Stage名称

### 概览表功能
- **导入Excel**: 下载模板 → 填写数据 → 导入
- **导出Excel**: 点击"导出Excel"按钮
- **插入空行**: 点击"插入空行"按钮
- **删除选中**: 选中行 → 点击"删除选中"按钮
- **合并单元格**: 选中相邻单元格 → 点击"合并单元格"
- **取消合并**: 点击"取消合并"按钮

### 类别管理
- **添加一级类别**: Stage详情页 → 添加一级类别
- **添加二级类别**: 点击一级类别的添加图标
- **编辑类别**: 点击编辑图标
- **删除类别**: 点击删除图标 → 确认
- **查看统计**: 自动显示该类别的DST和AUT

### 数据表功能
- **导入数据**: 下载模板 → 填写 → 导入Excel
- **导出数据**: 点击"导出Excel"导出当前子类别的所有数据
- **编辑数据**: 双击单元格编辑
- **删除数据**: 选中行 → 删除选中
- **查看完整内容**: 单击行展开详细信息

### 可视化功能
- 访问"可视化"页面
- 选择要查看的计划
- 查看各种统计图表：
  - 概览统计卡片
  - 各阶段Token柱状图
  - 一级类别Token分布饼图（鼠标悬停查看详情）
  - Token累计趋势折线图
  - 详细统计表格
- **自动刷新**: 数据每30秒自动刷新一次

### Token统计
- **自动计算**: 数据修改后自动重新计算Token总量
- **实时显示**: 在数据表页面和类别管理页面同步显示
- **DST**: 数据集总token累计（Dataset Total Token）
- **AUT**: 实际使用token累计（Actual Used Token）

## 数据库结构

### 主数据库 (backend/main.db)
- **users表**: 用户账号信息
- **plans表**: 计划列表

### 计划数据库 (backend/databases/{计划名}.db)
每个计划有独立的数据库文件：
- **stages表**: 阶段信息、顺序、类别结构
- **category_details表**: 二级类别的数据表内容

### 数据库备份

手动备份方法：

```bash
# 停止前后端服务

# 创建备份目录
mkdir backups/backup_20250102

# 复制数据库文件
cp backend/main.db backups/backup_20250102/
cp backend/databases/*.db backups/backup_20250102/

# 重启服务
```

恢复方法：

```bash
# 停止前后端服务

# 恢复数据库
cp backups/backup_20250102/main.db backend/
cp backups/backup_20250102/*.db backend/databases/

# 重启服务
```

## 常见问题

### 1. 后端无法启动

**症状**: `ModuleNotFoundError: No module named 'fastapi'`

**解决方法**:
```bash
cd backend
pip install -r requirements.txt
```

### 2. 前端无法启动

**症状**: `npm ERR! missing script: dev`

**解决方法**:
```bash
npm install
```

### 3. 端口被占用

**症状**:
- 后端: `Error: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 5000)`
- 前端: React自动使用3001端口

**解决方法**:
```bash
# 后端：修改端口
uvicorn main:app --reload --port 5001

# 前端：React会自动使用下一个可用端口（3001、3002等）
# 或关闭占用端口的程序
```

### 4. Excel导入后百分比变成数值

**原因**: Excel将100%识别为数值1

**解决方法**:
1. 在Excel中选中该列
2. 右键 → 设置单元格格式
3. 选择"文本"格式
4. 输入 `100%` 而不是 1
5. 保存并重新导入

### 5. Token统计不更新

**原因**: 可能是页面缓存

**解决方法**:
1. 刷新页面（F5）
2. 检查是否有数据修改操作
3. 检查后端日志是否有错误

### 6. 数据丢失

**预防措施**:
- ✅ 定期备份数据库文件
- ✅ 重要操作前手动备份
- ✅ 使用Excel导出功能导出数据

### 7. 页面加载慢

**优化建议**:
- 系统已实现分页（每页20条）
- 如仍然慢，可能是数据量过大（>10万条）
- 建议分批导入数据或增加服务器性能

## 开发环境

### 后端开发

```bash
cd backend

# 热重载模式（自动重启）
uvicorn main:app --reload --port 5000

# 查看API文档
# 访问 http://localhost:5000/docs
```

### 前端开发

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 代码结构

```
1202_website/
├── backend/               # 后端代码
│   ├── main.py           # API路由和业务逻辑
│   ├── models.py         # 数据库模型
│   ├── database.py       # 数据库连接
│   ├── auth.py           # 认证相关
│   ├── main.db           # 主数据库
│   └── databases/        # 计划数据库目录
│       ├── PLAN01.db
│       └── PLAN02.db
├── src/                   # 前端代码
│   ├── pages/            # 页面组件
│   │   ├── Home.jsx      # 首页
│   │   ├── PlanDetail.jsx          # 计划详情/概览表
│   │   ├── StageDetail.jsx         # Stage类别管理
│   │   ├── CategoryDetail.jsx      # 二级类别数据表
│   │   └── Visualization.jsx       # 可视化页面
│   ├── components/       # 可复用组件
│   ├── utils/            # 工具函数
│   └── App.jsx           # 主应用组件
├── package.json          # 前端依赖配置
├── vite.config.js        # Vite配置
├── README.md             # 项目说明
├── QUICKSTART.md         # 本文件
└── ARCHITECTURE.md       # 架构说明
```

## 技术栈

### 后端
- **FastAPI**: 现代Python Web框架
- **SQLAlchemy**: ORM框架
- **SQLite**: 轻量级数据库
- **Uvicorn**: ASGI服务器
- **Passlib**: 密码加密
- **Python-Jose**: JWT认证

### 前端
- **React 18**: UI框架
- **Vite**: 构建工具
- **React Router**: 路由管理
- **Ant Design**: UI组件库
- **Recharts**: 图表可视化
- **Axios**: HTTP客户端
- **SheetJS (xlsx)**: Excel处理

## 下一步

1. ✅ 熟悉基本操作（创建计划、添加Stage、管理类别）
2. ✅ 导入测试数据验证功能
3. ✅ 查看可视化统计
4. ✅ 定期备份数据库
5. 📖 阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 了解系统架构

## 获取帮助

- **API文档**: 访问 http://localhost:5000/docs 查看完整API文档
- **架构说明**: 阅读 [ARCHITECTURE.md](ARCHITECTURE.md)
- **README**: 查看 [README.md](README.md)

---

**最后更新**: 2025-12-03
**版本**: v1.0
