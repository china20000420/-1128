# 快速开始指南

## 📖 项目简介

这是一个**大模型训练数据版本管理系统**，由大模型数据技术实验室开发，用于管理训练计划的数据分类、Token统计和阶段管理。

### 核心特点

- **🗂️ 多计划管理**：支持创建多个独立的训练计划，每个计划有自己的数据库文件
- **📊 阶段管理**：每个计划可包含多个Stage（阶段），如stage1、stage2等
- **🏷️ 类别体系**：二级分类结构（一级类别 → 二级类别），便于数据组织
- **📈 Token统计**：自动计算并显示数据集总Token（DST）和实际使用Token（AUT）
- **📥 Excel集成**：支持Excel模板导入和导出功能
- **📉 数据可视化**：图表展示Token分布、趋势和统计信息
- **🔐 权限管理**：管理员可编辑，普通用户仅可查看

---

## 🛠️ 环境要求

### 必需软件

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| **Python** | 3.8+ | 后端API服务 |
| **Node.js** | 14.x+ | 前端构建工具 |
| **npm** | 6.x+ | 前端包管理 |

### 可选工具

- **Conda**：推荐使用，用于Python环境隔离
- **VS Code**：推荐的代码编辑器

---

## 📦 安装步骤

### 第一步：获取项目代码

```bash
# 如果使用Git
git clone <repository-url>
cd 1202_website

# 或者直接解压下载的压缩包
```

### 第二步：安装后端依赖

#### 方式1：使用Conda（推荐）

```bash
# 创建虚拟环境
conda create -n data-version-mgmt python=3.9

# 激活环境
conda activate data-version-mgmt

# 安装依赖
cd backend
pip install -r requirements.txt
```

#### 方式2：使用系统Python

```bash
cd backend
pip install -r requirements.txt
```

#### 后端依赖清单

```
fastapi==0.104.1          # 高性能Web框架
uvicorn[standard]==0.24.0 # ASGI服务器
sqlalchemy==2.0.23        # ORM数据库框架
python-multipart==0.0.6   # 文件上传支持
passlib[bcrypt]==1.7.4    # 密码加密
python-jose[cryptography]==3.3.0  # JWT认证
```

### 第三步：安装前端依赖

```bash
# 回到项目根目录
cd ..

# 安装前端依赖
npm install
```

#### 前端依赖清单

```json
{
  "react": "^18.2.0",              // UI框架
  "react-router-dom": "^6.20.1",   // 路由管理
  "antd": "^5.12.5",               // UI组件库
  "recharts": "^3.5.0",            // 图表库
  "axios": "^1.6.2",               // HTTP客户端
  "xlsx": "^0.18.5",               // Excel处理
  "vite": "^5.0.8"                 // 构建工具
}
```

---

## 🚀 启动应用

### 启动后端服务

打开**第一个终端窗口**：

```bash
# 进入backend目录
cd backend

# 如果使用conda，先激活环境
conda activate data-version-mgmt

# 启动后端API服务
uvicorn main:app --reload --port 5000
```

**启动成功标志**：
```
INFO:     Uvicorn running on http://127.0.0.1:5000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**后端服务地址**：http://localhost:5000

### 启动前端服务

打开**第二个终端窗口**：

```bash
# 确保在项目根目录
npm install
npm run dev
```

**启动成功标志**：
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**前端服务地址**：http://localhost:3000

> **💡 提示**：如果3000端口被占用，Vite会自动使用3001、3002等端口

### 访问应用

在浏览器中打开：**http://localhost:3000**

---

## 🎯 首次使用

### 1. 登录系统

系统内置了两个测试账号：

| 账号类型 | 用户名 | 密码 | 权限 |
|---------|--------|------|------|
| **管理员** | `admin` | `admin123` | 可以创建、编辑、删除 |
| **普通用户** | `user` | `user123` | 仅可查看 |

> ⚠️ **安全提示**：首次登录后建议修改默认密码

### 2. 创建训练计划

1. 以管理员身份登录
2. 在首页点击右上角的 **"创建新计划"** 按钮
3. 填写信息：
   - **计划名称**：如 `72B`、`训练计划A`、`PLAN_001` 等
   - **计划描述**：简要说明该计划的用途
4. 点击 **"确定"**

✅ **结果**：
- 系统在首页显示新的计划卡片
- 后端自动创建 `backend/databases/72b.db`（或对应名称的数据库文件）
- 左侧导航栏自动添加该计划的菜单项

### 3. 添加Stage（阶段）

1. 点击刚创建的计划卡片，进入 **计划详情页**
2. 点击 **"添加新阶段"** 按钮
3. 输入Stage名称（如 `stage1`、`stage2`）
4. 点击 **"确定"**

✅ **结果**：
- 详情页显示新的Stage折叠面板
- 左侧导航栏的计划菜单下出现该Stage
- 可以继续添加更多Stage

### 4. 管理类别结构

#### 方法A：在Stage详情页管理

1. 点击左侧导航栏的 Stage名称（如 `STAGE1`）
2. 进入类别管理页面
3. 点击 **"添加一级类别"** 按钮
4. 输入类别名称（如 `类别01`、`数学推理`）
5. 点击该类别右侧的 **"+"** 图标添加二级类别
6. 输入子类别名称（如 `子类别01`、`基础题型`）

#### 方法B：在概览表中直接输入

1. 在计划详情页，展开某个Stage的折叠面板
2. 概览表中可以直接双击单元格输入类别和子类别名称
3. 数据会自动保存到数据库

### 5. 添加数据

#### 方法1：Excel导入（推荐）

**适用场景**：批量导入大量数据

1. 进入二级类别的数据表页面
2. 点击 **"下载模板"** 按钮，保存Excel模板文件
3. 在Excel中填写数据：

| 列名 | 说明 | 示例 |
|------|------|------|
| v3词表hdfs路径 | HDFS路径 | `/data/vocab/v3/` |
| obs模糊路径 | OBS模糊路径 | `obs://bucket/data/` |
| obs补全路径 | OBS完整路径 | `obs://bucket/data/file.json` |
| 数据集总token | Token数量 | `1000000` |
| 实际使用 | 使用比例 | `100%` |
| 实际使用token | 实际Token数 | `1000000` |

4. **重要**：将"实际使用"列的单元格格式设置为 **文本**，这样 `100%` 才不会变成 `1`
5. 保存Excel文件
6. 返回页面，点击 **"导入Excel"** 按钮
7. 选择刚才保存的Excel文件
8. 等待导入完成

✅ **结果**：数据表中显示导入的所有数据

#### 方法2：手动输入

**适用场景**：少量数据或单条数据修改

1. 点击 **"插入空行"** 按钮
2. 双击表格单元格进行编辑
3. 按 Enter 或点击其他地方自动保存
4. Token统计自动更新

---

## 📚 主要功能说明

### 计划管理

| 操作 | 步骤 | 权限 |
|------|------|------|
| **创建计划** | 首页 → 创建新计划按钮 → 填写信息 | 管理员 |
| **编辑计划** | 首页 → 鼠标悬停计划卡片 → 点击编辑图标 | 管理员 |
| **删除计划** | 首页 → 鼠标悬停计划卡片 → 点击删除图标 → 确认 | 管理员 |
| **查看计划** | 首页 → 点击计划卡片 | 所有用户 |

### Stage管理

| 操作 | 步骤 | 权限 |
|------|------|------|
| **添加Stage** | 计划详情页 → 添加新阶段按钮 | 管理员 |
| **编辑Stage** | 点击Stage名称旁的编辑图标 | 管理员 |
| **删除Stage** | 点击删除图标 → 确认 | 管理员 |
| **查看Stage** | 左侧导航栏 → 点击Stage名称 | 所有用户 |

### 概览表功能

**位置**：计划详情页 → 展开某个Stage面板

| 功能 | 说明 |
|------|------|
| **导入Excel** | 下载模板 → 填写数据 → 导入 |
| **导出Excel** | 点击"导出Excel"，文件名：`计划名_Stage名_概览表.xlsx` |
| **插入空行** | 在表格末尾插入新行 |
| **删除选中** | 勾选行 → 点击"删除选中" |
| **合并单元格** | 选中相邻单元格 → 点击"合并单元格" |
| **取消合并** | 选中合并的单元格 → 点击"取消合并" |
| **双击编辑** | 双击任意单元格直接编辑 |

### 类别管理

**位置**：左侧导航栏 → 点击Stage名称

| 功能 | 说明 |
|------|------|
| **添加一级类别** | 点击"添加一级类别"按钮 |
| **添加二级类别** | 点击一级类别右侧的"+"图标 |
| **编辑类别** | 点击类别右侧的编辑图标 |
| **删除类别** | 点击删除图标 → 确认 |
| **查看统计** | 每个类别右侧自动显示DST和AUT |

### 数据表功能

**位置**：左侧导航栏 → Stage → 一级类别 → 二级类别

| 功能 | 说明 |
|------|------|
| **导入数据** | 下载模板 → 填写 → 导入Excel |
| **导出数据** | 点击"导出Excel"，文件名：`计划名_Stage名_一级类别_二级类别_数据表.xlsx` |
| **编辑数据** | 双击单元格直接编辑，实时保存 |
| **插入空行** | 点击"插入空行"按钮 |
| **删除数据** | 勾选行 → 点击"删除选中" |
| **查看完整内容** | 点击行前的"+"图标展开详细信息 |
| **分页浏览** | 每页显示20条，底部翻页控件 |

### 可视化功能

**位置**：左侧导航栏 → 数据可视化

#### 概览统计卡片

显示4个关键指标：
- 阶段总数
- 一级类别总数
- 数据集总Token（DST）
- 实际使用Token（AUT）

#### 图表展示

| 图表类型 | 展示内容 |
|---------|---------|
| **柱状图** | 各阶段Token统计、各阶段数据集数量 |
| **饼图** | 一级类别Token分布（鼠标悬停查看详情）|
| **折线图** | Token累计趋势 |
| **统计表** | 一级类别详细统计、二级类别Top 10 |

#### 自动刷新

- 数据每**30秒**自动刷新一次
- 确保显示最新的统计信息

---

## 🗄️ 数据库结构

### 主数据库：`backend/main.db`

存储用户信息和计划列表：

```
users 表：
- id (主键)
- username (用户名，唯一)
- hashed_password (加密密码)
- is_admin (是否管理员)

plans 表：
- id (主键)
- name (计划名称，唯一)
- description (计划描述)
```

### 计划数据库：`backend/databases/{计划名}.db`

每个计划一个独立的数据库文件：

```
stages 表：
- id (主键)
- name (Stage名称)
- description (描述)
- stage_order (排序)
- categories (JSON，存储类别结构)
- merges (JSON，存储合并单元格信息)

table_rows 表：
- id (主键)
- stage_id (外键，关联stages表)
- category (一级类别)
- subcategory (二级类别)
- total_tokens (总Token数)
- sample_ratio (采样比例)
- ... (其他字段)

category_details 表：
- id (主键)
- stage_id (外键)
- category_name (一级类别)
- subcategory_name (二级类别)
- description (描述)
- rows (JSON，存储数据行)
- token_count_total (数据集总Token)
- actual_token_total (实际使用Token)
```

### 数据库备份

#### 手动备份

```bash
# 创建备份目录
mkdir -p backups/backup_$(date +%Y%m%d)

# 备份主数据库
cp backend/main.db backups/backup_$(date +%Y%m%d)/

# 备份所有计划数据库
cp backend/databases/*.db backups/backup_$(date +%Y%m%d)/
```

#### 恢复数据

```bash
# 停止前后端服务

# 恢复数据库文件
cp backups/backup_20250102/main.db backend/
cp backups/backup_20250102/*.db backend/databases/

# 重新启动服务
```

---

## ❓ 常见问题

### 1. 登录失败：Invalid credentials

**问题**：在新电脑上输入 `admin` / `admin123` 显示 **"Invalid credentials"**

**原因**：数据库未初始化，缺少默认用户

**解决方法**：

**步骤1：检查数据库状态**
```bash
cd backend
python check_db.py
```

如果显示 `❌ 数据库中没有用户！`，继续下一步。

**步骤2：初始化数据库**
```bash
python init_db.py
```

**预期输出**：
```
Admin user created: admin / admin123
Normal user created: user / user123

Database initialized successfully!
Main database: main.db
Plan databases will be created in: databases/
```

**步骤3：再次检查**
```bash
python check_db.py
```

**预期输出**：
```
✅ 数据库中有 2 个用户:

   用户名: admin
   管理员: 是
   密码哈希: $2b$12$...
   测试密码 'admin123': ✅ 正确

   用户名: user
   管理员: 否
   密码哈希: $2b$12$...
   测试密码 'user123': ✅ 正确
```

**步骤4：重新启动后端服务**
```bash
uvicorn main:app --reload --port 5000
```

**步骤5：尝试登录**

现在应该可以使用 `admin` / `admin123` 成功登录了！

---

**💡 为什么会出现这个问题？**

当你把代码复制到新电脑时：
- ✅ 代码文件都复制了
- ❌ `backend/main.db` 数据库文件**没有**复制（或在 `.gitignore` 中被忽略）
- 结果：后端启动时自动创建了空的 `main.db`，但里面没有用户数据

**预防方法**：
- 方法1：把 `backend/main.db` 一起复制到新电脑（包含所有用户和计划）
- 方法2：在新电脑上运行 `python init_db.py` 初始化数据库

### 2. 后端启动失败

**问题**：`ModuleNotFoundError: No module named 'fastapi'`

**原因**：Python依赖未安装

**解决方法**：
```bash
cd backend
pip install -r requirements.txt
```

### 3. 前端启动失败

**问题**：`npm ERR! missing script: dev`

**原因**：Node依赖未安装

**解决方法**：
```bash
npm install
```

### 4. 端口被占用

**问题**：
- 后端：`Error: [Errno 10048] error while attempting to bind on address`
- 前端：React自动切换到3001端口

**解决方法**：
```bash
# 后端：更换端口
uvicorn main:app --reload --port 5001

# 前端：Vite会自动选择可用端口
# 或手动指定：npm run dev -- --port 3002
```

### 5. Excel导入后百分比变成小数

**问题**：Excel中的 `100%` 导入后显示为 `1`

**原因**：Excel默认将百分比识别为数值

**解决方法**：
1. 在Excel中选中"实际使用"列
2. 右键 → **设置单元格格式**
3. 选择 **文本** 格式
4. 重新输入 `100%`（作为文本）
5. 保存并导入

### 6. Token统计不更新

**问题**：修改数据后Token统计没有变化

**原因**：页面缓存或网络延迟

**解决方法**：
1. 刷新页面（F5）
2. 检查后端控制台是否有错误日志
3. 检查浏览器开发者工具的Network标签

### 7. 左侧导航栏显示不全

**问题**：当计划和Stage很多时，导航栏显示不完整

**解决方法**：
- 导航栏已支持上下滚动
- 使用鼠标滚轮或拖动滚动条查看更多内容

### 8. 页面加载慢

**原因**：数据量过大

**优化建议**：
- 系统已实现分页（每页20条）
- 如果仍然慢，可能是单个Stage的数据超过10万条
- 建议将数据分散到多个Stage中

---

## 💻 开发环境

### 后端开发

```bash
cd backend

# 开发模式（热重载）
uvicorn main:app --reload --port 5000

# 查看API文档
# 访问：http://localhost:5000/docs
```

**API文档说明**：
- FastAPI自动生成交互式API文档
- 可以直接在浏览器中测试API接口

### 前端开发

```bash
# 开发模式（热更新）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 调试技巧

1. **后端调试**：
   - 查看终端输出的日志
   - 使用 `print()` 或 `logging` 打印调试信息

2. **前端调试**：
   - 使用浏览器开发者工具（F12）
   - 查看 Console 标签的错误信息
   - 查看 Network 标签的API请求

---

## 📂 项目文件结构

```
1202_website/
├── backend/                  # 后端代码
│   ├── main.py              # API路由和业务逻辑（核心文件）
│   ├── models.py            # 数据库模型定义
│   ├── database.py          # 数据库连接管理
│   ├── auth.py              # 认证和JWT
│   ├── init_db.py           # 数据库初始化脚本
│   ├── requirements.txt     # Python依赖列表
│   ├── main.db              # 主数据库（用户+计划列表）
│   └── databases/           # 计划数据库目录
│       ├── 72b.db           # 示例：72B计划的数据库
│       └── plan_a.db        # 示例：PLAN_A计划的数据库
├── src/                      # 前端代码
│   ├── pages/               # 页面组件
│   │   ├── Home.jsx         # 首页（计划列表）
│   │   ├── PlanDetail.jsx   # 计划详情（概览表）
│   │   ├── StageDetail.jsx  # Stage详情（类别管理）
│   │   ├── CategoryDetail.jsx # 数据表页面
│   │   ├── Visualization.jsx  # 数据可视化
│   │   └── Login.jsx        # 登录页面
│   ├── components/          # 可复用组件（如有）
│   ├── utils/               # 工具函数
│   │   └── auth.js          # 前端认证工具
│   ├── App.jsx              # 主应用组件（路由+布局）
│   └── main.jsx             # 应用入口
├── package.json             # 前端依赖配置
├── vite.config.js           # Vite构建配置
├── README.md                # 项目简介
├── QUICKSTART.md            # 快速开始指南（本文件）
└── ARCHITECTURE.md          # 系统架构文档
```

---

## 🎓 下一步学习

1. ✅ **熟悉基本操作**：创建计划 → 添加Stage → 管理类别 → 导入数据
2. ✅ **使用可视化**：查看统计图表，了解数据分布
3. ✅ **定期备份**：建立数据库备份习惯
4. 📖 **深入理解架构**：阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 了解系统设计
5. 🛠️ **二次开发**：根据需求修改代码或添加新功能

---

## 📞 技术支持

- **API文档**：访问 http://localhost:5000/docs 查看完整API文档
- **架构文档**：阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 了解技术细节
- **项目README**：查看 [README.md](README.md) 获取项目概述

---

**最后更新**：2025-12-03
**版本**：v1.0
**开发单位**：大模型数据技术实验室
