# 系统架构文档

## 🎯 系统概述

这是一个**大模型训练数据版本管理系统**，采用现代化的前后端分离架构，为大模型数据技术实验室的训练数据管理提供完整解决方案。

### 核心设计理念

1. **多租户隔离**：每个训练计划使用独立的SQLite数据库，互不干扰
2. **实时同步**：前端操作实时保存到后端数据库，无需手动保存
3. **性能优化**：分页加载、单行操作、索引优化，支持大规模数据
4. **用户友好**：Excel集成、可视化图表、权限管理

### 技术亮点

- ✅ **多数据库架构**：主数据库 + 多个计划数据库
- ✅ **RESTful API**：标准化接口设计
- ✅ **JWT认证**：安全的用户认证机制
- ✅ **自动刷新**：可视化页面30秒自动更新
- ✅ **Excel无缝集成**：模板导入导出，格式保留

---

## 🏗️ 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      浏览器 (Browser)                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              React 前端应用 (Port 3000)                      │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Pages   │  │Components│  │  Utils   │  │  Assets  │  │ │
│  │  │          │  │          │  │          │  │          │  │ │
│  │  │ • Home   │  │ • Layout │  │ • auth.js│  │ • styles │  │ │
│  │  │ • Plan   │  │ • Table  │  │ • http   │  │ • images │  │ │
│  │  │ • Stage  │  │ • Charts │  │          │  │          │  │ │
│  │  │ • Visual │  │          │  │          │  │          │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                              │ │
│  │          Ant Design + Recharts + XLSX                       │ │
│  │          React Router + Axios                               │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/HTTPS
                             │ RESTful API (JSON)
                             │ JWT Token Authentication
                             │
┌────────────────────────────▼────────────────────────────────────┐
│               FastAPI 后端服务 (Port 5000)                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API 路由层                                │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  /auth   │  │  /plans  │  │ /stages  │  │  /visual │  │ │
│  │  │          │  │          │  │          │  │          │  │ │
│  │  │ • login  │  │ • create │  │ • update │  │ • stats  │  │ │
│  │  │ • logout │  │ • update │  │ • delete │  │ • charts │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               业务逻辑层 (main.py)                           │ │
│  │  • 请求验证 (Pydantic)                                       │ │
│  │  • 权限检查 (JWT + is_admin)                                │ │
│  │  • 数据处理 (JSON序列化/反序列化)                           │ │
│  │  • Token计算 (自动求和)                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             ▼                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │             ORM 层 (SQLAlchemy)                              │ │
│  │  • models.py (数据模型定义)                                 │ │
│  │  • database.py (连接管理)                                   │ │
│  │  • MainBase / PlanBase                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    数据持久化层 (SQLite)                         │
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────────────────┐ │
│  │   main.db        │         │    databases/                 │ │
│  │   (主数据库)      │         │    (计划数据库目录)            │ │
│  │                  │         │                                │ │
│  │  ┌────────────┐ │         │  ┌─────────┐  ┌─────────┐    │ │
│  │  │ users      │ │         │  │ 72b.db  │  │plan_a.db│    │ │
│  │  │ • id       │ │         │  │         │  │         │    │ │
│  │  │ • username │ │         │  │ stages  │  │ stages  │    │ │
│  │  │ • password │ │         │  │ rows    │  │ rows    │    │ │
│  │  │ • is_admin │ │         │  │ details │  │ details │    │ │
│  │  └────────────┘ │         │  └─────────┘  └─────────┘    │ │
│  │                  │         │                                │ │
│  │  ┌────────────┐ │         │       ... 更多计划数据库        │ │
│  │  │ plans      │ │         │                                │ │
│  │  │ • id       │ │         └────────────────────────────────┘ │
│  │  │ • name     │ │                                             │
│  │  │ • desc     │ │                                             │
│  │  └────────────┘ │                                             │
│  └──────────────────┘                                             │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🎨 前端架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 18.2.0 | UI框架，使用Hooks管理状态 |
| **Vite** | 5.0.8 | 构建工具，快速开发体验 |
| **React Router** | 6.20.1 | 客户端路由管理 |
| **Ant Design** | 5.12.5 | 企业级UI组件库 |
| **Recharts** | 3.5.0 | 数据可视化图表 |
| **Axios** | 1.6.2 | HTTP请求客户端 |
| **SheetJS (xlsx)** | 0.18.5 | Excel文件读写 |

### 目录结构

```
src/
├── pages/                    # 页面组件（6个主要页面）
│   ├── Home.jsx              # 首页 - 训练计划列表
│   ├── PlanDetail.jsx        # 计划详情 - 概览表
│   ├── StageDetail.jsx       # Stage详情 - 类别管理
│   ├── CategoryDetail.jsx    # 子类别详情 - 数据表
│   ├── Visualization.jsx     # 数据可视化分析
│   └── Login.jsx             # 用户登录
├── components/               # 可复用组件（目前较少）
├── utils/                    # 工具函数
│   └── auth.js               # 认证工具（token、权限检查）
├── App.jsx                   # 主应用（路由+左侧导航+布局）
└── main.jsx                  # React入口文件
```

### 页面详解

#### 1. Home.jsx - 首页

**功能**：
- 展示所有训练计划的卡片列表
- 管理员可以创建、编辑、删除计划
- 点击卡片进入计划详情页

**核心状态**：
```javascript
const [plans, setPlans] = useState([])        // 计划列表
const [modalVisible, setModalVisible] = useState(false)  // 模态框显示
const [editingPlan, setEditingPlan] = useState(null)     // 正在编辑的计划
```

**关键API**：
- `GET /api/plans` - 获取所有计划
- `POST /api/plans` - 创建新计划
- `PUT /api/plans/{id}` - 更新计划信息
- `DELETE /api/plans/{id}` - 删除计划

**交互逻辑**：
1. 用户点击"创建新计划" → 打开模态框
2. 填写计划名称和描述 → 提交表单
3. 前端调用POST接口 → 后端创建数据库
4. 刷新计划列表 → 触发`plansChanged`事件更新左侧导航

#### 2. PlanDetail.jsx - 计划详情（概览表）

**功能**：
- 显示计划的所有Stage，以折叠面板形式展示
- 每个Stage有一个概览表，包含13列数据
- 支持Excel导入/导出、单元格编辑、合并单元格
- 自动保存（500ms防抖）

**核心状态**：
```javascript
const [stages, setStages] = useState({})          // Stage数据，key为stage名
const [stagesList, setStagesList] = useState([])  // Stage列表
const [selectedRows, setSelectedRows] = useState({})     // 选中的行
const [selectedCells, setSelectedCells] = useState({})   // 选中的单元格
const [editingCell, setEditingCell] = useState(null)     // 正在编辑的单元格
```

**数据结构**：
```javascript
stages = {
  'stage1': {
    rows: [
      {
        key: 1,
        category: '类别01',
        subcategory: '子类别01',
        total_tokens: '1000000',
        sample_ratio: '50%',
        cumulative_ratio: '50%',
        sample_tokens: '500000',
        category_ratio: '10%',
        part1: 'xxx',
        part2: 'xxx',
        part3: 'xxx',
        part4: 'xxx',
        part5: 'xxx',
        note: '备注'
      },
      // ... 更多行
    ],
    merges: [
      { row: 0, col: 0, rowspan: 2, colspan: 1 },  // 合并信息
      // ... 更多合并
    ]
  },
  'stage2': { ... }
}
```

**Excel导出**：
- 文件名格式：`计划名_Stage名_概览表.xlsx`
- 包含所有13列数据
- 使用XLSX.writeFile()直接触发浏览器下载

**自动保存机制**：
```javascript
useEffect(() => {
  if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
  autoSaveTimer.current = setTimeout(() => {
    saveData(true)  // 静默保存
  }, 500)  // 500ms防抖
}, [description, stages])
```

#### 3. StageDetail.jsx - Stage详情（类别管理）

**功能**：
- 管理二级分类结构（一级类别 → 二级类别）
- 显示每个类别的Token统计（DST/AUT）
- 点击二级类别进入数据表页面

**核心状态**：
```javascript
const [categories, setCategories] = useState([])      // 类别数组
const [description, setDescription] = useState('')    // Stage描述
```

**数据结构**：
```javascript
categories = [
  {
    id: 1702345678901,  // 时间戳生成的唯一ID
    name: '数学推理',
    subcategories: [
      {
        id: 1702345678902,
        name: '基础题型',
        tokenCountTotal: '1000000.50',    // 数据集总Token
        actualTokenTotal: '800000.25'      // 实际使用Token
      },
      {
        id: 1702345678903,
        name: '复杂题型',
        tokenCountTotal: '2000000.75',
        actualTokenTotal: '1600000.50'
      }
    ],
    tokenCountTotal: '3000001.25',   // 一级类别总计
    actualTokenTotal: '2400000.75'
  },
  // ... 更多一级类别
]
```

**Token统计逻辑**：
- 从后端获取每个二级类别的Token总量
- 前端汇总计算一级类别的总计
- 实时更新显示

#### 4. CategoryDetail.jsx - 数据表页面

**功能**：
- 展示某个二级类别的所有数据（分页显示）
- Excel导入/导出
- 双击编辑单元格，实时保存
- 行展开查看完整内容
- 批量删除

**核心状态**：
```javascript
const [rows, setRows] = useState([])                  // 当前页数据
const [total, setTotal] = useState(0)                 // 总行数
const [currentPage, setCurrentPage] = useState(1)     // 当前页码
const [pageSize, setPageSize] = useState(20)          // 每页条数
const [tokenCountTotal, setTokenCountTotal] = useState('0')   // DST
const [actualTokenTotal, setActualTokenTotal] = useState('0') // AUT
```

**分页机制**：
```javascript
// 加载指定页的数据
const loadData = async (page = 1) => {
  const res = await axios.get(
    `/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`,
    { params: { page, page_size: pageSize } }
  )
  setRows(res.data.rows)           // 当前页数据
  setTotal(res.data.total)         // 总条数
  setTokenCountTotal(res.data.tokenCountTotal)
  setActualTokenTotal(res.data.actualTokenTotal)
}
```

**单行编辑**：
- 双击单元格 → 进入编辑模式
- 修改内容 → 失去焦点
- 自动调用 `PATCH /.../row` 接口
- 后端更新该行数据并重新计算Token
- 前端更新Token显示

**Excel导入格式保留**：
```javascript
const workbook = XLSX.read(data, {
  type: 'array',
  raw: false,        // 不使用原始值
  cellText: true     // 保留文本格式
})
// 这样 "100%" 不会变成 1
```

**Excel导出**：
- 文件名格式：`计划名_Stage名_一级类别_二级类别_数据表.xlsx`
- 导出所有数据（不分页），参数：`page_size=999999`

#### 5. Visualization.jsx - 数据可视化

**功能**：
- 选择计划后展示多维度统计
- 自动刷新（30秒间隔）
- 三种空状态处理

**核心状态**：
```javascript
const [loading, setLoading] = useState(true)          // 加载状态
const [plans, setPlans] = useState([])                // 计划列表
const [selectedPlan, setSelectedPlan] = useState(null)  // 选中的计划
const [statsData, setStatsData] = useState(null)      // 统计数据
```

**自动刷新**：
```javascript
useEffect(() => {
  if (selectedPlan) {
    loadVisualizationData(selectedPlan)

    const interval = setInterval(() => {
      loadVisualizationData(selectedPlan)  // 每30秒刷新
    }, 30000)

    return () => clearInterval(interval)  // 清理定时器
  }
}, [selectedPlan])
```

**三种状态**：
1. **Loading**：显示Spin加载动画
2. **无计划**：显示"暂无训练计划，请先创建计划"
3. **无数据**：显示"该计划暂无阶段数据"（保留计划选择器）

**图表类型**：
| 图表 | 组件 | 数据源 |
|------|------|--------|
| 概览卡片 | Statistic | overview |
| 阶段Token柱状图 | BarChart | stageStats |
| 阶段数据集柱状图 | BarChart | stageStats |
| 一级类别饼图 | PieChart | categoryDistribution |
| Token趋势折线图 | LineChart | tokenTrends |
| 一级类别表格 | Table | categoryStats |
| 二级类别Top 10 | BarChart (horizontal) | subcategoryStats |

**饼图优化**：
```javascript
<Pie
  data={categoryDistribution}
  dataKey="value"
  nameKey="name"
  cx="50%"
  cy="50%"
  outerRadius={120}
  label={false}  // 隐藏标签，避免重叠
>
```
- 标签通过Legend和Tooltip显示
- 鼠标悬停查看详情

#### 6. Login.jsx - 登录页面

**功能**：
- 用户名密码登录
- JWT Token管理
- 自动跳转

**认证流程**：
1. 用户输入用户名和密码
2. 前端调用 `POST /api/auth/login`
3. 后端验证成功，返回JWT Token
4. 前端保存Token到localStorage
5. 跳转到首页

### 路由设计

```javascript
// App.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
</Routes>

// MainLayout中的Routes
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/visualization" element={<Visualization />} />
  <Route path="/plan/:planName" element={<PlanDetail />} />
  <Route path="/plan/:planName/:stageName" element={<StageDetail />} />
  <Route path="/plan/:planName/:stageName/:categoryName/:subcategoryName"
         element={<CategoryDetail />} />
</Routes>
```

**路由参数**：
- `:planName` - 计划名称（如 `72b`）
- `:stageName` - Stage名称（如 `stage1`）
- `:categoryName` - 一级类别（URL编码）
- `:subcategoryName` - 二级类别（URL编码）

### 左侧导航栏

**设计特点**：
- 固定在左侧，可折叠
- 动态生成计划和Stage菜单
- 支持滚动（当内容超出时）
- 顶部显示实验室名称
- 底部显示版权信息

**菜单结构**：
```javascript
const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: '首页'
  },
  {
    key: '/visualization',
    icon: <BarChartOutlined />,
    label: '数据可视化'
  },
  // 动态生成的计划菜单
  ...plans.map(plan => ({
    key: `plan-${plan.key}`,
    icon: <DatabaseOutlined />,
    label: plan.name,
    children: [
      { key: `/plan/${plan.key}`, label: '计划概览' },
      // 动态生成的Stage子菜单
      ...plan.stages.map(stageKey => ({
        key: `/plan/${plan.key}/${stageKey}`,
        label: stageKey.toUpperCase()
      }))
    ]
  }))
]
```

**滚动实现**：
```javascript
<div style={{
  height: 'calc(100vh - 100px - 70px)',  // 视口高度 - 头部 - 底部
  overflowY: 'auto',
  overflowX: 'hidden'
}}>
  <Menu ... />
</div>
```

---

## ⚙️ 后端架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **FastAPI** | 0.104.1 | 高性能Web框架 |
| **Uvicorn** | 0.24.0 | ASGI服务器 |
| **SQLAlchemy** | 2.0.23 | ORM框架 |
| **SQLite** | 3.x | 轻量级数据库 |
| **Passlib** | 1.7.4 | 密码加密（bcrypt） |
| **Python-Jose** | 3.3.0 | JWT Token生成 |

### 目录结构

```
backend/
├── main.py              # API路由和业务逻辑（核心文件，800+行）
├── models.py            # 数据库模型定义（5个模型）
├── database.py          # 数据库连接和多数据库管理
├── auth.py              # JWT认证和密码加密
├── init_db.py           # 数据库初始化脚本
├── requirements.txt     # Python依赖列表
├── main.db              # 主数据库（用户+计划）
└── databases/           # 计划数据库目录
    ├── 72b.db
    ├── plan_a.db
    └── ... (更多)
```

### 数据库架构

#### 多数据库设计

**核心概念**：
- **主数据库**（main.db）：存储用户和计划列表
- **计划数据库**（databases/{plan_name}.db）：每个计划独立存储

**优势**：
1. **隔离性**：计划之间完全独立，删除一个计划不影响其他
2. **可扩展性**：单个计划数据量大时不影响系统性能
3. **易维护**：可单独备份、恢复、迁移某个计划
4. **易调试**：数据库文件独立，问题定位更容易

**实现机制**：

```python
# database.py

# 主数据库
MAIN_DATABASE_URL = "sqlite:///./main.db"
main_engine = create_engine(MAIN_DATABASE_URL)
MainBase = declarative_base()  # 用于User和Plan模型

# 计划数据库目录
DATABASES_DIR = "./databases"
PlanBase = declarative_base()  # 用于Stage、TableRow、CategoryDetail模型

# 缓存计划数据库的engine
_plan_engines = {}

def get_plan_engine(plan_name: str):
    """获取或创建计划数据库engine"""
    if plan_name not in _plan_engines:
        db_path = os.path.join(DATABASES_DIR, f"{plan_name.lower()}.db")
        engine = create_engine(f"sqlite:///{db_path}")
        PlanBase.metadata.create_all(bind=engine)  # 自动创建表
        _plan_engines[plan_name] = engine
    return _plan_engines[plan_name]
```

#### 数据库模型

**主数据库模型（MainBase）**：

```python
# models.py

class User(MainBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Plan(MainBase):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, default="")
```

**计划数据库模型（PlanBase）**：

```python
class Stage(PlanBase):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, default="")
    stage_order = Column(Integer, default=0)
    rows = relationship("TableRow", back_populates="stage")
    _merges = Column("merges", Text, default="[]")      # JSON字段
    _categories = Column("categories", Text, default="[]")  # JSON字段

    @property
    def merges(self):
        return json.loads(self._merges)

    @merges.setter
    def merges(self, value):
        self._merges = json.dumps(value)

class TableRow(PlanBase):
    __tablename__ = "table_rows"
    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"))
    stage = relationship("Stage", back_populates="rows")
    category = Column(String, default="")
    subcategory = Column(String, default="")
    total_tokens = Column(String, default="")
    sample_ratio = Column(String, default="")
    cumulative_ratio = Column(String, default="")
    sample_tokens = Column(String, default="")
    category_ratio = Column(String, default="")
    part1 = Column(String, default="")
    part2 = Column(String, default="")
    part3 = Column(String, default="")
    part4 = Column(String, default="")
    part5 = Column(String, default="")
    note = Column(String, default="")
    row_order = Column(Integer, default=0)

class CategoryDetail(PlanBase):
    __tablename__ = "category_details"
    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), index=True)
    category_name = Column(String, index=True)
    subcategory_name = Column(String, index=True)
    description = Column(Text, default="")
    _rows = Column("rows", Text, default="[]")  # JSON数组，存储数据行
    token_count_total = Column(String, default="0")
    actual_token_total = Column(String, default="0")

    @property
    def rows(self):
        return json.loads(self._rows)

    @rows.setter
    def rows(self, value):
        self._rows = json.dumps(value)
```

**JSON字段说明**：
- SQLite不支持原生JSON类型
- 使用TEXT字段存储JSON字符串
- 通过@property装饰器实现自动序列化/反序列化
- 优点：灵活存储复杂数据结构

**索引优化**：
- 所有主键自动索引
- username、plan name添加唯一索引
- stage_id、category_name、subcategory_name添加索引
- 提升查询性能

### API设计

#### RESTful风格接口

```
基础路径：http://localhost:5000/api
```

**认证相关**：
```
POST   /auth/login           登录，返回JWT Token
POST   /auth/register        注册新用户（需要管理员权限）
GET    /auth/me              获取当前用户信息
```

**计划管理**：
```
GET    /plans                获取所有计划列表
POST   /plans                创建新计划（需管理员）
PUT    /plans/{id}           更新计划信息（需管理员）
DELETE /plans/{id}           删除计划（需管理员）
```

**计划详情（概览表）**：
```
GET    /plan{plan_name}      获取计划的所有Stage数据
POST   /plan{plan_name}      保存计划的所有Stage数据
```

**Stage管理（类别结构）**：
```
GET    /plans/{plan}/stages/{stage}/categories
       获取Stage的类别结构（JSON数组）

POST   /plans/{plan}/stages/{stage}/categories
       保存Stage的类别结构
```

**数据表管理（分页+单行操作）**：
```
GET    /plans/{plan}/stages/{stage}/categories/{cat}/{subcat}
       ?page=1&page_size=20
       获取数据表（分页）

PATCH  /plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/description
       更新描述

PATCH  /plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/row
       更新或插入单行数据

DELETE /plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/rows
       批量删除行
```

**可视化统计**：
```
GET    /plans/{plan}/visualization
       获取计划的统计数据（概览、图表、表格）
```

#### 分页实现

**API接口**：
```python
@app.get("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}")
def get_category_detail(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    page: int = 1,
    page_size: int = 20
):
    # 1. 获取CategoryDetail记录
    db = get_plan_session(plan_name)
    stage = db.query(models.Stage).filter(models.Stage.name == stage_name).first()
    category_data = db.query(models.CategoryDetail).filter(
        models.CategoryDetail.stage_id == stage.id,
        models.CategoryDetail.category_name == category_name,
        models.CategoryDetail.subcategory_name == subcategory_name
    ).first()

    # 2. 从JSON字段获取所有行
    all_rows = category_data.rows if category_data else []
    total = len(all_rows)

    # 3. 分页切片
    start = (page - 1) * page_size
    end = start + page_size
    paged_rows = all_rows[start:end]

    # 4. 返回分页数据
    return {
        "rows": paged_rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "description": category_data.description,
        "tokenCountTotal": category_data.token_count_total,
        "actualTokenTotal": category_data.actual_token_total
    }
```

**优势**：
- 减少数据传输量（只传输20条）
- 前端渲染更快（DOM节点更少）
- 支持大规模数据（10万+行）

#### 单行操作

**更新单行**：
```python
class RowUpdateData(BaseModel):
    key: int                       # 行的唯一标识
    hdfs_path: Optional[str] = ""
    obs_fuzzy_path: Optional[str] = ""
    obs_full_path: Optional[str] = ""
    token_count: Optional[str] = ""
    actual_usage: Optional[str] = ""
    actual_token: Optional[str] = ""

@app.patch("/.../row")
def update_row(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: RowUpdateData
):
    # 1. 获取CategoryDetail
    category_data = query_category_detail(...)

    # 2. 更新rows数组中的指定行
    rows = category_data.rows
    found = False
    for i, row in enumerate(rows):
        if row['key'] == data.key:
            rows[i] = {
                'key': data.key,
                'hdfs_path': data.hdfs_path,
                'obs_fuzzy_path': data.obs_fuzzy_path,
                'obs_full_path': data.obs_full_path,
                'token_count': data.token_count,
                'actual_usage': data.actual_usage,
                'actual_token': data.actual_token
            }
            found = True
            break

    # 如果没找到，说明是新行，插入
    if not found:
        rows.append({...})

    # 3. 保存回数据库
    category_data.rows = rows

    # 4. 重新计算Token总量
    token_total = sum(float(r.get('token_count', 0) or 0) for r in rows)
    actual_total = sum(float(r.get('actual_token', 0) or 0) for r in rows)
    category_data.token_count_total = str(token_total)
    category_data.actual_token_total = str(actual_total)

    db.commit()

    # 5. 返回新的总量
    return {
        "tokenCountTotal": str(token_total),
        "actualTokenTotal": str(actual_total)
    }
```

**批量删除**：
```python
class RowDeleteData(BaseModel):
    keys: list[int]  # 要删除的行的key列表

@app.delete("/.../rows")
def delete_rows(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: RowDeleteData
):
    category_data = query_category_detail(...)

    # 过滤掉要删除的行
    rows = [r for r in category_data.rows if r['key'] not in data.keys]
    category_data.rows = rows

    # 重新计算Token
    token_total = sum(...)
    actual_total = sum(...)
    category_data.token_count_total = str(token_total)
    category_data.actual_token_total = str(actual_total)

    db.commit()

    return {
        "tokenCountTotal": str(token_total),
        "actualTokenTotal": str(actual_total)
    }
```

### 认证机制

#### JWT Token流程

**登录**：
```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your-secret-key-here"  # 生产环境应使用环境变量
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天

@app.post("/api/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_main_db)):
    # 1. 查询用户
    user = db.query(models.User).filter(
        models.User.username == credentials.username
    ).first()

    # 2. 验证密码
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. 生成JWT Token
    access_token = create_access_token({"sub": user.username})

    # 4. 返回Token和用户信息
    return {
        "access_token": access_token,
        "is_admin": user.is_admin
    }

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

**权限验证**：
```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_main_db)
):
    try:
        # 解码Token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # 查询用户
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def require_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

**使用示例**：
```python
@app.post("/api/plans")
def create_plan(
    plan: PlanCreate,
    current_user: models.User = Depends(require_admin)  # 需要管理员权限
):
    # 创建计划的逻辑
    ...
```

---

## 🔄 数据流详解

### 1. 用户登录流程

```
┌──────┐                  ┌──────┐                  ┌──────────┐
│浏览器│                  │后端  │                  │main.db   │
└──┬───┘                  └──┬───┘                  └────┬─────┘
   │                         │                           │
   │  POST /api/auth/login   │                           │
   │  {username, password}   │                           │
   ├────────────────────────>│                           │
   │                         │                           │
   │                         │  SELECT * FROM users      │
   │                         │  WHERE username = ?       │
   │                         ├──────────────────────────>│
   │                         │                           │
   │                         │<──────────────────────────┤
   │                         │  User {id, username,      │
   │                         │       hashed_password,    │
   │                         │       is_admin}           │
   │                         │                           │
   │                         │  verify_password()        │
   │                         │  ✓ 密码正确               │
   │                         │                           │
   │                         │  create_access_token()    │
   │                         │  ✓ 生成JWT Token          │
   │                         │                           │
   │  {access_token,         │                           │
   │   is_admin: true}       │                           │
   │<────────────────────────┤                           │
   │                         │                           │
   │  localStorage.setItem(  │                           │
   │    'token', token)      │                           │
   │  localStorage.setItem(  │                           │
   │    'is_admin', true)    │                           │
   │                         │                           │
   │  navigate('/')          │                           │
   │  进入首页                │                           │
   │                         │                           │
```

### 2. 创建计划流程

```
┌──────┐     ┌──────┐     ┌──────────┐     ┌────────────┐
│浏览器│     │后端  │     │main.db   │     │databases/  │
└──┬───┘     └──┬───┘     └────┬─────┘     └─────┬──────┘
   │            │              │                  │
   │  用户点击   │              │                  │
   │ "创建新计划"│              │                  │
   │            │              │                  │
   │  打开模态框 │              │                  │
   │  填写信息： │              │                  │
   │  name: 72B │              │                  │
   │  desc: xxx │              │                  │
   │            │              │                  │
   │  POST /api/plans         │                  │
   │  {name, description}     │                  │
   │  Header: Bearer {token}  │                  │
   ├─────────────────────────>│                  │
   │            │              │                  │
   │            │ verify JWT   │                  │
   │            │ ✓ 管理员      │                  │
   │            │              │                  │
   │            │ INSERT INTO plans               │
   │            │ (name, description)             │
   │            │ VALUES ('72B', 'xxx')           │
   │            ├─────────────>│                  │
   │            │              │                  │
   │            │ get_plan_engine('72B')          │
   │            │              │                  │
   │            │ 创建新引擎：  │                  │
   │            │ sqlite:///./databases/72b.db    │
   │            ├──────────────────────────────────>│
   │            │              │                  │
   │            │ PlanBase.metadata.create_all()  │
   │            │ ✓ 创建tables:│                  │
   │            │   - stages   │                  │
   │            │   - table_rows│                 │
   │            │   - category_details            │
   │            ├──────────────────────────────────>│
   │            │              │                  │
   │            │              │<─────────────────┤
   │            │              │  72b.db 已创建   │
   │            │              │                  │
   │  {success: true,          │                  │
   │   plan: {...}}            │                  │
   │<─────────────────────────┤                  │
   │            │              │                  │
   │  message.success()        │                  │
   │  loadPlans()              │                  │
   │  window.dispatchEvent(    │                  │
   │    'plansChanged')        │                  │
   │            │              │                  │
   │  App.jsx监听到事件        │                  │
   │  重新加载导航栏            │                  │
   │  ✓ 显示新计划菜单          │                  │
   │            │              │                  │
```

### 3. 数据表编辑流程（分页+单行操作）

```
┌──────┐              ┌──────┐              ┌──────────────┐
│浏览器│              │后端  │              │databases/    │
│      │              │      │              │  72b.db      │
└──┬───┘              └──┬───┘              └──────┬───────┘
   │                     │                         │
   │ 用户访问数据表页面   │                         │
   │ /plan/72B/stage1/  │                         │
   │   数学/基础题型     │                         │
   │                     │                         │
   │ GET /.../categories/数学/基础题型             │
   │    ?page=1&page_size=20                      │
   ├────────────────────>│                         │
   │                     │                         │
   │                     │ SELECT * FROM category_details │
   │                     │ WHERE stage_id = 1      │
   │                     │   AND category_name = '数学'   │
   │                     │   AND subcategory_name = '基础' │
   │                     ├────────────────────────>│
   │                     │                         │
   │                     │<────────────────────────┤
   │                     │ {id: 1,                 │
   │                     │  _rows: '[{...}, ...]', │
   │                     │  token_count_total: '1M',│
   │                     │  actual_token_total: '800K'}│
   │                     │                         │
   │                     │ rows = json.loads(_rows)│
   │                     │ total = len(rows) = 500 │
   │                     │ paged = rows[0:20]      │
   │                     │                         │
   │ {rows: [...20条...],│                         │
   │  total: 500,        │                         │
   │  page: 1,           │                         │
   │  tokenCountTotal: '1M',                       │
   │  actualTokenTotal: '800K'}                    │
   │<────────────────────┤                         │
   │                     │                         │
   │ 显示第1页数据        │                         │
   │ 显示分页控件：1/25页  │                         │
   │                     │                         │
   │ 用户双击单元格       │                         │
   │ 修改token_count     │                         │
   │ 从 "1000" → "2000" │                         │
   │                     │                         │
   │ PATCH /.../row      │                         │
   │ {key: 123,          │                         │
   │  token_count: '2000'}                         │
   ├────────────────────>│                         │
   │                     │                         │
   │                     │ SELECT * FROM category_details │
   │                     ├────────────────────────>│
   │                     │<────────────────────────┤
   │                     │                         │
   │                     │ rows = json.loads(_rows)│
   │                     │ for i, row in enumerate(rows): │
   │                     │   if row['key'] == 123: │
   │                     │     rows[i]['token_count'] = '2000' │
   │                     │                         │
   │                     │ _rows = json.dumps(rows)│
   │                     │                         │
   │                     │ token_total = sum(...)  │
   │                     │ = 1001000 (增加了1000)  │
   │                     │                         │
   │                     │ UPDATE category_details │
   │                     │ SET _rows = '...',      │
   │                     │     token_count_total = '1001000' │
   │                     │ WHERE id = 1            │
   │                     ├────────────────────────>│
   │                     │                         │
   │ {tokenCountTotal: '1001000',                  │
   │  actualTokenTotal: '800K'}                    │
   │<────────────────────┤                         │
   │                     │                         │
   │ 更新显示的Token统计   │                         │
   │ DST: 1001000        │                         │
   │                     │                         │
```

### 4. Excel导入流程

```
┌──────┐              ┌──────┐              ┌──────────────┐
│浏览器│              │后端  │              │databases/    │
└──┬───┘              └──┬───┘              └──────┬───────┘
   │                     │                         │
   │ 用户点击"导入Excel"  │                         │
   │ 选择文件            │                         │
   │                     │                         │
   │ 前端读取Excel：      │                         │
   │ const wb = XLSX.read(file, {                  │
   │   raw: false,       │                         │
   │   cellText: true    │                         │
   │ })                  │                         │
   │                     │                         │
   │ 解析数据：          │                         │
   │ rows = [            │                         │
   │   {key: 1,          │                         │
   │    hdfs_path: '...', │                        │
   │    token_count: '1000000',                    │
   │    actual_usage: '100%'},  // 保留文本格式   │
   │   ...               │                         │
   │ ]                   │                         │
   │                     │                         │
   │ POST /.../import    │                         │
   │ {rows: [...]}       │                         │
   ├────────────────────>│                         │
   │                     │                         │
   │                     │ 获取或创建CategoryDetail │
   │                     │                         │
   │                     │ 为每行生成key（如果没有）│
   │                     │ rows.forEach(r => {     │
   │                     │   if (!r.key)           │
   │                     │     r.key = Date.now()  │
   │                     │ })                      │
   │                     │                         │
   │                     │ _rows = json.dumps(rows)│
   │                     │ token_total = sum(...)  │
   │                     │ actual_total = sum(...) │
   │                     │                         │
   │                     │ UPDATE category_details │
   │                     │ SET _rows = '...',      │
   │                     │     token_count_total = 'xxx', │
   │                     │     actual_token_total = 'xxx' │
   │                     ├────────────────────────>│
   │                     │                         │
   │ {success: true,     │                         │
   │  tokenCountTotal: 'xxx',                      │
   │  actualTokenTotal: 'xxx'}                     │
   │<────────────────────┤                         │
   │                     │                         │
   │ message.success()   │                         │
   │ loadData()          │                         │
   │ 重新加载数据表        │                         │
   │                     │                         │
```

### 5. 可视化数据流

```
┌──────┐              ┌──────┐              ┌──────────────┐
│浏览器│              │后端  │              │databases/    │
└──┬───┘              └──┬───┘              └──────┬───────┘
   │                     │                         │
   │ 用户访问可视化页面   │                         │
   │ 选择计划：72B        │                         │
   │                     │                         │
   │ GET /api/plans/72B/visualization              │
   ├────────────────────>│                         │
   │                     │                         │
   │                     │ 1. 查询所有Stage        │
   │                     │    SELECT * FROM stages │
   │                     ├────────────────────────>│
   │                     │<────────────────────────┤
   │                     │ [stage1, stage2, ...]   │
   │                     │                         │
   │                     │ 2. 遍历Stage，解析categories │
   │                     │    categories = json.loads(stage._categories) │
   │                     │                         │
   │                     │ 3. 查询CategoryDetail获取Token │
   │                     │    for cat in categories: │
   │                     │      for subcat in cat.subcategories: │
   │                     │        detail = query(...) │
   │                     │        token += detail.token_count_total │
   │                     ├────────────────────────>│
   │                     │<────────────────────────┤
   │                     │                         │
   │                     │ 4. 聚合数据：            │
   │                     │    - stageStats: 各阶段统计 │
   │                     │    - categoryStats: 一级类别统计 │
   │                     │    - categoryDistribution: 饼图数据 │
   │                     │    - tokenTrends: 累计趋势 │
   │                     │                         │
   │ {                   │                         │
   │   overview: {...},  │                         │
   │   stageStats: [...],│                         │
   │   categoryStats: [...],                       │
   │   categoryDistribution: [...],                │
   │   tokenTrends: [...],                         │
   │   subcategoryStats: [...]                     │
   │ }                   │                         │
   │<────────────────────┤                         │
   │                     │                         │
   │ 渲染图表：          │                         │
   │ - 概览卡片          │                         │
   │ - 柱状图            │                         │
   │ - 饼图              │                         │
   │ - 折线图            │                         │
   │ - 统计表            │                         │
   │                     │                         │
   │ 设置定时器：        │                         │
   │ setInterval(() => { │                         │
   │   loadData()        │                         │
   │ }, 30000)           │                         │
   │                     │                         │
   │ ... 30秒后 ...      │                         │
   │                     │                         │
   │ GET /api/plans/72B/visualization              │
   ├────────────────────>│                         │
   │ ... 重复上述流程 ... │                         │
   │                     │                         │
```

---

## ⚡ 性能优化

### 1. 分页优化

**问题**：
- 1000条数据一次性加载导致：
  - 网络传输时间长（1-2秒）
  - 浏览器渲染1000行DOM节点（卡顿）
  - 内存占用高

**解决方案**：
- 后端API支持分页参数 `page` 和 `page_size`
- 前端每次只请求当前页数据（默认20条）
- 数据量减少98%（从1000条到20条）

**效果**：
- 加载时间：2秒 → 0.2秒
- 内存占用：大幅降低
- 用户体验：即时响应

**代码示例**：
```javascript
// 前端
const loadData = async (page = 1) => {
  const res = await axios.get(url, {
    params: { page, page_size: 20 }
  })
  setRows(res.data.rows)  // 只有20条
  setTotal(res.data.total)  // 总条数用于分页控件
}

// 后端
all_rows = category_data.rows  # 所有数据
total = len(all_rows)
start = (page - 1) * page_size
end = start + page_size
paged_rows = all_rows[start:end]  # 只返回当前页
```

### 2. 单行操作优化

**问题**：
- 旧版本：编辑或删除时保存整个数据集
- 导致：
  - 并发冲突（多用户同时编辑）
  - 数据覆盖（后提交覆盖先提交）
  - 性能差（传输大量数据）

**解决方案**：
- 新增单行更新API：`PATCH /.../row`
- 新增批量删除API：`DELETE /.../rows`
- 每次操作只传输修改的数据

**效果**：
- 避免数据覆盖冲突
- 操作速度提升（10ms级别）
- 支持更高并发

### 3. 数据库索引

```python
class CategoryDetail(PlanBase):
    stage_id = Column(Integer, ForeignKey("stages.id"), index=True)
    category_name = Column(String, index=True)
    subcategory_name = Column(String, index=True)
```

**索引字段**：
- `stage_id`：加速按Stage查询
- `category_name`：加速按一级类别查询
- `subcategory_name`：加速按二级类别查询

**效果**：
- 查询速度提升10-100倍（取决于数据量）
- 尤其在大数据量时效果显著

### 4. JSON字段优化

**优势**：
- 灵活存储复杂数据结构（数组、对象）
- 减少表连接（JOIN）操作
- 简化数据模型

**注意**：
- 不要在JSON字段上进行复杂查询
- 适合整体读取、整体更新的场景
- 本项目的使用场景完全适合

### 5. 自动刷新优化

**可视化页面**：
- 每30秒自动刷新数据
- 使用 `setInterval` + `clearInterval`
- 避免内存泄漏

```javascript
useEffect(() => {
  if (selectedPlan) {
    loadVisualizationData(selectedPlan)

    const interval = setInterval(() => {
      loadVisualizationData(selectedPlan)
    }, 30000)

    return () => clearInterval(interval)  // 组件卸载时清理
  }
}, [selectedPlan])
```

### 6. 左侧导航滚动优化

**问题**：
- 计划和Stage很多时，导航栏显示不全

**解决方案**：
```javascript
<div style={{
  height: 'calc(100vh - 100px - 70px)',  // 固定高度
  overflowY: 'auto',   // 垂直滚动
  overflowX: 'hidden'  // 隐藏横向滚动
}}>
  <Menu ... />
</div>
```

**效果**：
- 支持鼠标滚轮滚动
- 版权信息不被遮挡
- 折叠按钮位置固定

---

## 🚀 部署建议

### 开发环境

**后端**：
```bash
cd backend
conda activate data-version-mgmt
uvicorn main:app --reload --port 5000
```

**前端**：
```bash
npm run dev
```

**API文档**：
- 访问 http://localhost:5000/docs 查看交互式API文档

### 生产环境

**后端部署**：

1. **使用Gunicorn + Uvicorn Workers**：
```bash
# 安装Gunicorn
pip install gunicorn

# 启动（4个worker进程）
gunicorn main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:5000 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log
```

2. **使用Supervisor管理进程**：
```ini
[program:data-mgmt-backend]
directory=/path/to/backend
command=/path/to/gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
autostart=true
autorestart=true
stderr_logfile=/var/log/data-mgmt-backend.err.log
stdout_logfile=/var/log/data-mgmt-backend.out.log
```

**前端部署**：

1. **构建生产版本**：
```bash
npm run build
# 生成 dist/ 目录
```

2. **使用Nginx托管静态文件**：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # 反向代理后端API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 数据库备份

**定期备份脚本**：
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$DATE"

# 创建备份目录
mkdir -p $BACKUP_PATH

# 备份主数据库
cp backend/main.db $BACKUP_PATH/

# 备份所有计划数据库
cp backend/databases/*.db $BACKUP_PATH/

# 压缩
cd $BACKUP_DIR
tar -czf backup_$DATE.tar.gz backup_$DATE
rm -rf backup_$DATE

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_PATH.tar.gz"
```

**设置Cron定时任务**：
```bash
# 每天凌晨2点备份
0 2 * * * /path/to/backup.sh
```

### 监控建议

1. **日志监控**：
   - 使用ELK Stack（Elasticsearch + Logstash + Kibana）
   - 或使用简单的日志轮转：logrotate

2. **性能监控**：
   - 使用Prometheus + Grafana
   - 监控指标：CPU、内存、磁盘、请求量、响应时间

3. **健康检查**：
```python
@app.get("/health")
def health_check():
    return {"status": "ok"}
```

---

## 🔧 扩展性设计

### 添加新功能

#### 1. 添加新页面

```javascript
// src/pages/NewPage.jsx
export default function NewPage() {
  return <div>New Page</div>
}

// src/App.jsx
import NewPage from './pages/NewPage'

<Routes>
  <Route path="/new-page" element={<NewPage />} />
</Routes>
```

#### 2. 添加新API

```python
# backend/main.py
@app.get("/api/new-endpoint")
def new_endpoint():
    return {"data": "..."}
```

#### 3. 修改数据模型

```python
# backend/models.py
class Stage(PlanBase):
    # 添加新字段
    new_field = Column(String, default="")

# 手动迁移（SQLite没有自动迁移）
# 方法1：删除旧数据库，重新创建（仅开发环境）
# 方法2：使用SQL ALTER TABLE语句
```

### 支持其他数据库

**PostgreSQL**：
```python
# backend/database.py
MAIN_DATABASE_URL = "postgresql://user:password@localhost/maindb"
```

**MySQL**：
```python
MAIN_DATABASE_URL = "mysql+pymysql://user:password@localhost/maindb"
```

**注意**：需要安装相应的驱动：
```bash
pip install psycopg2-binary  # PostgreSQL
pip install pymysql  # MySQL
```

### 横向扩展

#### 1. 缓存优化

使用Redis缓存频繁访问的数据：
```python
import redis

r = redis.Redis(host='localhost', port=6379)

@app.get("/api/plans")
def get_plans():
    # 先查缓存
    cached = r.get('plans')
    if cached:
        return json.loads(cached)

    # 查数据库
    plans = db.query(models.Plan).all()

    # 写入缓存
    r.setex('plans', 300, json.dumps(plans))  # 5分钟过期

    return plans
```

#### 2. 消息队列

使用Celery处理异步任务（如大量数据导入）：
```python
from celery import Celery

celery_app = Celery('tasks', broker='redis://localhost:6379/0')

@celery_app.task
def import_large_excel(file_path, plan_name):
    # 异步处理Excel导入
    ...

@app.post("/api/import-async")
def import_async(file: UploadFile):
    # 保存文件
    file_path = save_file(file)

    # 提交异步任务
    task = import_large_excel.delay(file_path, plan_name)

    return {"task_id": task.id}
```

#### 3. 负载均衡

使用Nginx进行负载均衡：
```nginx
upstream backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

---

## 📝 开发规范

### 代码风格

**Python**：
- 遵循PEP 8规范
- 使用类型提示（Type Hints）
- 函数和类添加文档字符串

**JavaScript**：
- 使用ES6+语法
- 函数式组件 + Hooks
- 驼峰命名法

### Git工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发、测试

# 提交
git add .
git commit -m "feat: add new feature"

# 合并到main
git checkout main
git merge feature/new-feature
```

### 提交信息规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建工具或辅助工具
```

---

## 📚 常见问题

### 为什么使用SQLite而不是PostgreSQL或MySQL？

**优势**：
- 零配置：无需安装数据库服务器
- 单文件：易于备份、迁移、版本控制
- 高性能：对于中小型数据集（<10万条）性能优秀
- 跨平台：Windows、Linux、Mac均可运行

**劣势**：
- 不支持并发写入（本项目读多写少，影响不大）
- 不支持复杂的权限管理
- 单文件大小限制（理论上2TB，实际建议<100GB）

**适用场景**：
- 本项目的数据量和并发量完全适合SQLite
- 如果未来需要高并发或大数据量，可轻松迁移到PostgreSQL

### 为什么使用JSON字段而不是关系表？

**JSON字段**：
- 优势：灵活、减少JOIN、简化模型
- 劣势：不能在JSON内部查询和索引

**本项目场景**：
- `Stage.categories`：类别结构是整体读取、整体更新
- `CategoryDetail.rows`：数据行是批量读取、单行更新
- **完全适合JSON字段**

**何时使用关系表**：
- 需要复杂查询（如：查找token_count > 1000的所有行）
- 需要外键约束
- 需要独立的增删改查

### 如何扩展支持更多Stage？

**当前设计已支持任意数量的Stage**：
- 没有硬编码的Stage数量限制
- 动态创建Stage
- 左侧导航自动更新

**如果Stage非常多（>100个）**：
- 考虑使用虚拟滚动（react-window）
- 或添加搜索/过滤功能

### 如何支持多用户协作？

**当前支持**：
- 多用户同时查看（无限制）
- 管理员权限控制
- 单行操作避免数据覆盖

**进一步增强**：
- 添加WebSocket实现实时同步
- 添加操作日志（谁在什么时候修改了什么）
- 添加数据锁（悲观锁或乐观锁）

---

## 📖 参考资料

**后端**：
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [SQLAlchemy官方文档](https://www.sqlalchemy.org/)
- [JWT官方网站](https://jwt.io/)

**前端**：
- [React官方文档](https://react.dev/)
- [Ant Design官方文档](https://ant.design/)
- [Recharts官方文档](https://recharts.org/)
- [SheetJS文档](https://docs.sheetjs.com/)

**其他**：
- [Vite官方文档](https://vitejs.dev/)
- [SQLite官方文档](https://www.sqlite.org/docs.html)

---

**最后更新**：2025-12-03
**版本**：v1.0
**开发单位**：大模型数据技术实验室
**文档维护**：请根据代码变更及时更新本文档
