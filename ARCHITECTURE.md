# 系统架构说明

## 系统概述

这是一个基于React + FastAPI的大模型训练数据版本管理系统，采用前后端分离架构，使用SQLite作为数据存储，支持多计划管理、阶段管理、类别管理和Token统计。

### 核心特性

- **多计划独立数据库**: 每个训练计划使用独立的SQLite数据库文件
- **实时数据同步**: 前端操作实时保存到数据库
- **分页优化**: 支持大量数据的高效加载
- **Excel集成**: 完整的导入导出功能
- **可视化分析**: 多维度数据统计和图表展示

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (浏览器)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Application                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐         │   │
│  │  │  Pages   │  │Components│  │   Utils   │         │   │
│  │  └──────────┘  └──────────┘  └───────────┘         │   │
│  │       Ant Design + Recharts + XLSX                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
                       │ (Axios)
┌──────────────────────▼──────────────────────────────────────┐
│                    FastAPI Server                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              API Routes                               │   │
│  │  ┌──────┐  ┌───────┐  ┌──────────┐  ┌───────┐     │   │
│  │  │Plans │  │Stages │  │Categories│  │  Auth │     │   │
│  │  └──────┘  └───────┘  └──────────┘  └───────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           SQLAlchemy ORM                             │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   SQLite Databases                            │
│  ┌──────────────┐  ┌─────────────────────────────────┐     │
│  │   main.db    │  │      databases/                 │     │
│  │              │  │  ┌──────────┐  ┌──────────┐    │     │
│  │  - users     │  │  │PLAN01.db │  │PLAN02.db │    │     │
│  │  - plans     │  │  │          │  │          │    │     │
│  │              │  │  │ -stages  │  │ -stages  │    │     │
│  │              │  │  │ -details │  │ -details │    │     │
│  │              │  │  └──────────┘  └──────────┘    │     │
│  └──────────────┘  └─────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 前端架构

### 技术栈

- **React 18**: UI框架，使用Hooks进行状态管理
- **Vite**: 构建工具，提供快速的开发体验
- **React Router**: 客户端路由管理
- **Ant Design**: UI组件库
- **Recharts**: 数据可视化图表库
- **Axios**: HTTP客户端
- **SheetJS (xlsx)**: Excel文件处理

### 目录结构

```
src/
├── pages/                    # 页面组件
│   ├── Home.jsx              # 首页 - 计划列表
│   ├── PlanDetail.jsx        # 计划详情 - 概览表
│   ├── StageDetail.jsx       # Stage详情 - 类别管理
│   ├── CategoryDetail.jsx    # 子类别详情 - 数据表
│   ├── Visualization.jsx     # 可视化分析
│   └── Login.jsx             # 登录页面
├── components/               # 可复用组件
│   └── Layout.jsx            # 布局组件（侧边栏+内容区）
├── utils/                    # 工具函数
│   └── auth.js               # 认证相关工具
├── App.jsx                   # 主应用组件
└── main.jsx                  # 应用入口
```

### 页面功能

#### 1. Home.jsx - 计划管理

**功能**:
- 显示所有训练计划列表
- 创建新计划
- 编辑计划名称和描述
- 删除计划

**状态管理**:
```javascript
const [plans, setPlans] = useState([])
const [modalVisible, setModalVisible] = useState(false)
const [editingPlan, setEditingPlan] = useState(null)
```

**关键API调用**:
- `GET /api/plans` - 获取计划列表
- `POST /api/plans` - 创建计划
- `PUT /api/plans/{id}` - 更新计划
- `DELETE /api/plans/{id}` - 删除计划

#### 2. PlanDetail.jsx - 概览表

**功能**:
- 显示计划的所有Stage
- 折叠面板展示每个Stage的概览表
- Excel导入/导出
- 单元格编辑、合并
- 行操作（插入、删除）

**状态管理**:
```javascript
const [stages, setStages] = useState({})           // 各Stage数据
const [selectedRows, setSelectedRows] = useState({}) // 选中的行
const [selectedCells, setSelectedCells] = useState({}) // 选中的单元格
```

**数据结构**:
```javascript
stages = {
  'stage1': {
    rows: [
      { key, category, subcategory, total_tokens, ... },
      ...
    ],
    merges: [
      { row, col, rowspan, colspan },
      ...
    ]
  },
  'stage2': { ... }
}
```

#### 3. StageDetail.jsx - 类别管理

**功能**:
- 显示Stage的类别结构（一级 + 二级）
- 添加/编辑/删除一级类别
- 添加/编辑/删除二级类别
- 显示各类别的Token统计（DST/AUT）

**状态管理**:
```javascript
const [categories, setCategories] = useState([])
const [description, setDescription] = useState('')
```

**数据结构**:
```javascript
categories = [
  {
    id: 12345,
    name: "类别01",
    subcategories: [
      {
        id: 67890,
        name: "子类别01",
        tokenCountTotal: "1000000",
        actualTokenTotal: "800000"
      },
      ...
    ],
    tokenCountTotal: "5000000",
    actualTokenTotal: "4000000"
  },
  ...
]
```

#### 4. CategoryDetail.jsx - 数据表

**功能**:
- 分页显示子类别的数据（每页20条）
- Excel导入/导出
- 双击编辑单元格（实时保存）
- 行展开查看完整内容
- 删除选中行

**状态管理**:
```javascript
const [rows, setRows] = useState([])
const [total, setTotal] = useState(0)
const [currentPage, setCurrentPage] = useState(1)
const [pageSize, setPageSize] = useState(20)
const [tokenCountTotal, setTokenCountTotal] = useState('0')
const [actualTokenTotal, setActualTokenTotal] = useState('0')
```

**关键优化**:
- **分页加载**: 只从API获取当前页数据
- **单行操作**: 编辑/删除时只操作单行，不保存整个数据集
- **实时更新**: Token统计实时重新计算

**API调用**:
- `GET /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}?page=1&page_size=20`
- `PATCH /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/row` - 更新单行
- `DELETE /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/rows` - 删除行

#### 5. Visualization.jsx - 数据可视化

**功能**:
- 概览统计卡片（阶段数、类别数、Token总量）
- 各阶段Token柱状图
- 一级类别Token分布饼图
- Token累计趋势折线图
- 详细统计表格
- 自动刷新（每30秒）

**状态管理**:
```javascript
const [selectedPlan, setSelectedPlan] = useState(null)
const [statsData, setStatsData] = useState(null)
```

**自动刷新**:
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    loadVisualizationData(selectedPlan)
  }, 30000)  // 30秒刷新
  return () => clearInterval(interval)
}, [selectedPlan])
```

## 后端架构

### 技术栈

- **FastAPI**: 现代Python Web框架
- **SQLAlchemy**: ORM框架
- **SQLite**: 轻量级关系型数据库
- **Uvicorn**: ASGI服务器
- **Passlib**: 密码加密
- **Python-Jose**: JWT认证

### 目录结构

```
backend/
├── main.py              # API路由和业务逻辑（主文件）
├── models.py            # 数据库模型定义
├── database.py          # 数据库连接和会话管理
├── auth.py              # 认证相关功能
├── requirements.txt     # Python依赖
├── main.db              # 主数据库（用户和计划列表）
└── databases/           # 计划数据库目录
    ├── PLAN01.db
    ├── PLAN02.db
    └── ...
```

### 数据库架构

#### 主数据库 (main.db)

```python
# 使用 MainBase

class User(MainBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Plan(MainBase):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
```

#### 计划数据库 (databases/{计划名}.db)

```python
# 使用 PlanBase

class Stage(PlanBase):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True)
    name = Column(String, index=True)
    description = Column(Text)
    stage_order = Column(Integer, default=0)
    _categories = Column("categories", Text)  # JSON存储

    @property
    def categories(self):
        return json.loads(self._categories)

    @categories.setter
    def categories(self, value):
        self._categories = json.dumps(value)

class CategoryDetail(PlanBase):
    __tablename__ = "category_details"
    id = Column(Integer, primary_key=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), index=True)
    category_name = Column(String, index=True)
    subcategory_name = Column(String, index=True)
    description = Column(Text)
    _rows = Column("rows", Text)  # JSON存储数据行
    token_count_total = Column(String)
    actual_token_total = Column(String)

    @property
    def rows(self):
        return json.loads(self._rows)

    @rows.setter
    def rows(self, value):
        self._rows = json.dumps(value)
```

### 多数据库管理

**核心机制**:

```python
# database.py

MAIN_DATABASE_URL = "sqlite:///./main.db"
DATABASES_DIR = "./databases"

_main_engine = create_engine(MAIN_DATABASE_URL)
_plan_engines = {}  # 缓存计划数据库的engine

def get_plan_engine(plan_name: str):
    """获取或创建计划数据库engine"""
    if plan_name not in _plan_engines:
        db_path = os.path.join(DATABASES_DIR, f"{plan_name.lower()}.db")
        engine = create_engine(f"sqlite:///{db_path}")
        PlanBase.metadata.create_all(bind=engine)
        _plan_engines[plan_name] = engine
    return _plan_engines[plan_name]

def get_plan_session(plan_name: str):
    """获取计划数据库session"""
    engine = get_plan_engine(plan_name.upper())
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()
```

**优势**:
1. **隔离性**: 每个计划独立数据库，互不影响
2. **可扩展性**: 单个计划数据量大时不影响其他计划
3. **易维护**: 删除计划只需删除对应.db文件
4. **易备份**: 可单独备份某个计划的数据

### API设计

#### RESTful风格

```
# 计划管理
GET    /api/plans                    # 获取计划列表
POST   /api/plans                    # 创建计划
PUT    /api/plans/{id}               # 更新计划
DELETE /api/plans/{id}               # 删除计划

# Stage管理
GET    /api/plans/{plan}/stages/{stage}/categories  # 获取类别结构
POST   /api/plans/{plan}/stages/{stage}/categories  # 更新类别结构

# 数据表管理（分页+单行操作）
GET    /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}
       ?page=1&page_size=20           # 获取数据（分页）
PATCH  /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/description
                                      # 更新描述
PATCH  /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/row
                                      # 更新/插入单行
DELETE /api/plans/{plan}/stages/{stage}/categories/{cat}/{subcat}/rows
                                      # 删除多行

# 可视化
GET    /api/plans/{plan}/visualization  # 获取统计数据

# 认证
POST   /api/login                     # 登录
POST   /api/logout                    # 登出
```

#### 分页实现

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
    # 获取数据
    category_data = query_category_detail()

    # 分页
    all_rows = category_data.rows
    total = len(all_rows)
    start = (page - 1) * page_size
    end = start + page_size
    paged_rows = all_rows[start:end]

    return {
        "rows": paged_rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "tokenCountTotal": category_data.token_count_total,
        "actualTokenTotal": category_data.actual_token_total
    }
```

#### 单行操作

```python
@app.patch("/.../row")
def update_row(data: RowUpdateData):
    rows = category_data.rows

    # 查找并更新，如果不存在则插入
    found = False
    for i, row in enumerate(rows):
        if row['key'] == data.key:
            rows[i] = {...}
            found = True
            break

    if not found:
        rows.append({...})

    category_data.rows = rows

    # 重新计算totals
    token_total = sum(float(r.get('token_count', 0) or 0) for r in rows)
    actual_total = sum(float(r.get('actual_token', 0) or 0) for r in rows)

    db.commit()
    return {"tokenCountTotal": token_total, "actualTokenTotal": actual_total}
```

### 认证机制

**JWT Token**:

```python
# 登录
@app.post("/api/login")
def login(credentials: LoginData):
    user = authenticate_user(username, password)
    token = create_access_token({"sub": username})
    return {"access_token": token, "user": {...}}

# 保护路由
def require_admin(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user.is_admin:
        raise HTTPException(403, "Admin only")
    return user
```

## 数据流

### 1. 创建计划流程

```
用户点击"创建计划"
    ↓
前端打开模态框输入信息
    ↓
POST /api/plans {name, description}
    ↓
后端创建Plan记录（main.db）
    ↓
后端创建计划数据库文件（databases/{name}.db）
    ↓
返回成功
    ↓
前端刷新计划列表
    ↓
通知左侧导航栏更新
```

### 2. 添加类别流程

```
用户在Stage页添加类别
    ↓
POST /api/plans/{plan}/stages/{stage}/categories
    ↓
后端更新stage.categories JSON字段
    ↓
后端commit到数据库
    ↓
返回成功
    ↓
前端更新类别列表
```

### 3. 数据表编辑流程

```
用户双击单元格编辑
    ↓
前端更新本地state
    ↓
PATCH /.../row {更新的行数据}
    ↓
后端查找并更新该行
    ↓
后端重新计算token totals
    ↓
后端commit
    ↓
返回新的totals
    ↓
前端更新token统计显示
```

### 4. 分页加载流程

```
用户访问数据表页面
    ↓
GET /.../categories/{cat}/{subcat}?page=1&page_size=20
    ↓
后端从JSON字段读取所有rows
    ↓
后端进行分页切片 rows[0:20]
    ↓
返回: {rows, total, page, page_size, totals}
    ↓
前端显示第1页数据和分页控件
    ↓
用户点击"下一页"
    ↓
GET ...?page=2&page_size=20
    ↓
后端返回 rows[20:40]
    ↓
前端显示第2页数据
```

## 性能优化

### 1. 分页优化

**问题**: 1000条数据一次性加载导致页面卡顿1秒+

**解决方案**:
- 后端API支持分页参数
- 前端每次只请求当前页数据（20条）
- 减少98%的数据传输和DOM渲染

**效果**: 加载时间从1-2秒降至0.2-0.3秒

### 2. 单行操作

**问题**: 编辑或删除时保存整个数据集，导致数据丢失

**解决方案**:
- 新增单行更新API
- 新增批量删除API
- 每次操作只传输修改的数据

**效果**: 避免数据覆盖，操作更快速

### 3. 数据库索引

```python
class CategoryDetail(PlanBase):
    stage_id = Column(Integer, ForeignKey("stages.id"), index=True)
    category_name = Column(String, index=True)
    subcategory_name = Column(String, index=True)
```

**效果**: 查询速度提升

### 4. 自动刷新

可视化页面每30秒自动刷新，保证数据实时性

## 部署建议

### 开发环境

```bash
# 后端
cd backend
conda activate datamanage
uvicorn main:app --reload --port 5000

# 前端
npm run dev
```

### 生产环境

```bash
# 后端（使用Gunicorn + Uvicorn workers）
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000

# 前端（构建静态文件）
npm run build
# 使用Nginx或其他Web服务器托管dist/目录
```

### 数据库备份

```bash
# 定期备份（建议每天）
mkdir -p backups/$(date +%Y%m%d)
cp backend/main.db backups/$(date +%Y%m%d)/
cp backend/databases/*.db backups/$(date +%Y%m%d)/
```

## 扩展性

### 添加新功能

1. **添加新页面**: 在`src/pages/`创建组件，在`App.jsx`添加路由
2. **添加新API**: 在`backend/main.py`添加endpoint
3. **修改数据模型**: 更新`models.py`，运行迁移（手动）

### 支持更多数据库

修改`database.py`中的数据库连接：

```python
# PostgreSQL
MAIN_DATABASE_URL = "postgresql://user:pass@localhost/maindb"

# MySQL
MAIN_DATABASE_URL = "mysql+pymysql://user:pass@localhost/maindb"
```

### 横向扩展

- 使用Redis缓存频繁访问的数据
- 使用消息队列处理大量数据导入
- 部署多个后端实例+负载均衡

---

**最后更新**: 2025-12-03
**版本**: v1.0
