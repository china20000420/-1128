# 系统架构详细文档

## 目录

1. [系统概述](#系统概述)
2. [技术架构](#技术架构)
3. [文件结构详解](#文件结构详解)
4. [数据库设计](#数据库设计)
5. [API接口详解](#api接口详解)
6. [前端组件详解](#前端组件详解)
7. [数据流程](#数据流程)
8. [核心功能实现](#核心功能实现)

---

## 系统概述

这是一个基于React + FastAPI的全栈Web应用,用于管理大模型训练数据的版本和内容。系统采用前后端分离架构,前端负责UI展示和交互,后端负责数据存储和业务逻辑。

### 核心概念

- **Plan (训练计划)**：顶层概念,如72B、120B等不同规模的训练计划
- **Stage (阶段)**：每个计划包含多个训练阶段,如stage1、stage2等
- **Category (一级类别)**：数据分类的第一层
- **Subcategory (二级类别)**：数据分类的第二层
- **Dataset (数据集)**：最终的数据条目,包含路径、Token数等信息

---

## 技术架构

### 整体架构图

```
┌─────────────────┐
│   浏览器客户端   │
└────────┬────────┘
         │ HTTP/HTTPS
         ↓
┌─────────────────┐
│  React Frontend │ (Port 3000)
│  - Ant Design   │
│  - Recharts     │
│  - Axios        │
└────────┬────────┘
         │ REST API
         ↓
┌─────────────────┐
│ FastAPI Backend │ (Port 5000)
│  - SQLAlchemy   │
│  - JWT Auth     │
└────────┬────────┘
         │ ORM
         ↓
┌─────────────────┐
│ SQLite Database │
│ data_version.db │
└─────────────────┘
```

### 技术选型理由

1. **React**: 组件化开发,生态丰富,性能优秀
2. **FastAPI**: 现代Python框架,自动生成API文档,性能出色
3. **SQLite**: 轻量级,无需额外安装数据库服务器,适合中小型应用
4. **Ant Design**: 企业级UI组件库,开箱即用
5. **Recharts**: 基于D3的React图表库,易用且美观

---

## 文件结构详解

### 后端文件

#### 1. `backend/main.py` (主应用文件)

**作用**: FastAPI应用的核心,定义所有API端点和业务逻辑。

**关键代码解析**:

```python
app = FastAPI()  # 创建FastAPI应用实例

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 允许前端访问
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**主要API端点**:

1. **认证相关** (Lines 79-98)
   - `/api/auth/login`: 用户登录,验证凭据并返回JWT token
   - `/api/auth/register`: 用户注册,创建新用户
   - `/api/auth/me`: 获取当前登录用户信息

2. **计划管理** (Lines 100-141)
   - `GET /api/plans`: 获取所有训练计划列表
   - `POST /api/plans`: 创建新训练计划,自动创建4个默认stage
   - `PUT /api/plans/{plan_name}`: 更新训练计划描述
   - `DELETE /api/plans/{plan_name}`: 删除训练计划

3. **计划详情** (Lines 143-255)
   - `GET /api/plan{plan_name}`: 获取计划的所有stage和数据
   - `POST /api/plan{plan_name}`: 保存计划数据,支持stage的增删改

4. **类别管理** (Lines 326-377)
   - `GET /api/plans/{plan_name}/stages/{stage_name}/categories`: 获取stage的类别结构
   - `POST /api/plans/{plan_name}/stages/{stage_name}/categories`: 保存类别结构

5. **数据详情** (Lines 385-487)
   - `GET /api/plans/.../categories/{category}/{subcategory}`: 获取具体数据表
   - `POST /api/plans/.../categories/{category}/{subcategory}`: 保存数据表

6. **可视化数据** (Lines 489-613)
   - `GET /api/plans/{plan_name}/visualization`: 聚合统计数据供图表使用

#### 2. `backend/models.py` (数据模型)

**作用**: 定义SQLAlchemy ORM模型,映射数据库表结构。

**核心模型**:

```python
class User(Base):
    """用户表"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)

class Plan(Base):
    """训练计划表"""
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # 如"72B"
    description = Column(Text)
    stages = relationship("Stage", back_populates="plan", cascade="all, delete-orphan")

class Stage(Base):
    """训练阶段表"""
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)  # 如"stage1"
    plan_id = Column(Integer, ForeignKey("plans.id"))
    description = Column(Text)
    categories = Column(JSON)  # 存储类别结构
    merges = Column(JSON)  # 存储单元格合并信息
    plan = relationship("Plan", back_populates="stages")
    rows = relationship("TableRow", back_populates="stage", cascade="all, delete-orphan")

class TableRow(Base):
    """PlanDetail页面的表格行数据"""
    __tablename__ = "table_rows"
    id = Column(Integer, primary_key=True)
    stage_id = Column(Integer, ForeignKey("stages.id"))
    row_order = Column(Integer)  # 行序号
    category = Column(String)
    subcategory = Column(String)
    total_tokens = Column(String)
    # ... 其他列

class CategoryDetail(Base):
    """类别详情数据表"""
    __tablename__ = "category_details"
    id = Column(Integer, primary_key=True)
    stage_id = Column(Integer, ForeignKey("stages.id"))
    category_name = Column(String)
    subcategory_name = Column(String)
    description = Column(Text)
    rows = Column(JSON)  # 存储数据行数组
    token_count_total = Column(String)  # 数据集总token
    actual_token_total = Column(String)  # 实际使用token
```

**关系说明**:
- User独立存在
- Plan → Stage (一对多)
- Stage → TableRow (一对多)
- Stage → CategoryDetail (一对多)

#### 3. `backend/database.py` (数据库配置)

**作用**: 配置SQLAlchemy数据库连接和会话管理。

```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./data_version.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite多线程配置
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """依赖注入函数,为每个请求提供数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

#### 4. `backend/auth.py` (认证模块)

**作用**: 处理JWT token生成、验证和密码加密。

```python
SECRET_KEY = "your-secret-key-keep-it-safe"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    """使用bcrypt加密密码"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    """创建JWT access token"""
    to_encode = data.copy()
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """从token获取当前用户"""
    # 解析token,验证用户
    # 返回User对象

def require_admin(current_user: User = Depends(get_current_user)):
    """要求管理员权限"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

#### 5. `backend/init_db.py` (数据库初始化)

**作用**: 创建数据库表并插入默认管理员账户。

```python
def init_database():
    # 创建所有表
    Base.metadata.create_all(bind=engine)

    # 创建默认管理员
    admin = User(
        username="admin",
        hashed_password=get_password_hash("admin123"),
        is_admin=True
    )
    db.add(admin)
    db.commit()
```

### 前端文件

#### 1. `src/App.jsx` (主应用组件)

**作用**: 应用的根组件,定义路由和全局布局。

**关键代码解析**:

```javascript
// 路由保护
function ProtectedRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" />
}

// 主布局组件
function MainLayout() {
  const [plans, setPlans] = useState([])  // 计划列表

  // 加载计划和stages
  const loadPlans = async () => {
    const res = await axios.get('/api/plans')
    const plansData = res.data.plans || []

    // 为每个计划加载stages
    const plansWithStages = await Promise.all(
      plansData.map(async (plan) => {
        const stagesRes = await axios.get(`/api/plan${plan.key}`)
        const stagesList = Object.keys(stagesRes.data.stages)
        return { ...plan, stages: stagesList }
      })
    )
    setPlans(plansWithStages)
  }

  // 动态生成菜单
  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/visualization', icon: <BarChartOutlined />, label: '数据可视化' },
    ...plans.map(plan => ({
      key: `plan-${plan.key}`,
      label: plan.name,
      children: [
        { key: `/plan/${plan.key}`, label: '计划概览' },
        ...plan.stages.map(stageKey => ({
          key: `/plan/${plan.key}/${stageKey}`,
          label: stageKey.toUpperCase()
        }))
      ]
    }))
  ]

  // 监听plans变化事件
  useEffect(() => {
    window.addEventListener('plansChanged', loadPlans)
    return () => window.removeEventListener('plansChanged', loadPlans)
  }, [])
}
```

**路由配置**:
- `/login` - 登录页
- `/` - 首页(计划列表)
- `/visualization` - 数据可视化
- `/plan/:planName` - 计划概览
- `/plan/:planName/:stageName` - Stage详情(类别管理)
- `/plan/:planName/:stageName/:category/:subcategory` - 数据表

#### 2. `src/pages/Home.jsx` (首页)

**作用**: 展示所有训练计划列表,支持创建/编辑/删除计划。

**核心功能**:

1. **加载计划列表**
```javascript
const loadPlans = async () => {
  const res = await axios.get('/api/plans')
  setPlans(res.data.plans || [])
}
```

2. **创建计划**
```javascript
const handleSubmit = async () => {
  const values = await form.validateFields()
  await axios.post('/api/plans', values)
  loadPlans()
  window.dispatchEvent(new Event('plansChanged'))  // 通知导航栏更新
}
```

3. **删除计划**
```javascript
const handleDeletePlan = async (planKey) => {
  await axios.delete(`/api/plans/${planKey}`)
  loadPlans()
  window.dispatchEvent(new Event('plansChanged'))
}
```

#### 3. `src/pages/PlanDetail.jsx` (计划概览)

**作用**: 显示计划的所有Stage表格,支持Excel导入导出和Stage管理。

**核心功能**:

1. **加载计划数据**
```javascript
const loadData = async () => {
  const res = await axios.get(`/api/plan${planName}`)
  setDescription(res.data.description)
  setStages(res.data.stages)

  // 转换stages对象为列表
  const list = Object.keys(stagesData).map(key => ({ key, name: key }))
  setStagesList(list)
}
```

2. **添加Stage**
```javascript
const handleStageSubmit = async () => {
  const values = await form.validateFields()
  const stageName = values.name.toLowerCase()

  // 添加新stage到状态
  const newStages = { ...stages, [stageName]: { rows: [], merges: [] } }
  setStages(newStages)
  setStagesList([...stagesList, { key: stageName, name: stageName }])

  // 保存到后端
  await axios.post(`/api/plan${planName}`, { description, stages: newStages })
  window.dispatchEvent(new Event('plansChanged'))
}
```

3. **删除Stage**
```javascript
const handleDeleteStage = async (stageKey) => {
  const newStages = { ...stages }
  delete newStages[stageKey]
  setStages(newStages)

  await axios.post(`/api/plan${planName}`, { description, stages: newStages })
  window.dispatchEvent(new Event('plansChanged'))
}
```

4. **Excel导出**
```javascript
const handleExport = (stageKey) => {
  const stageData = stages[stageKey]
  const worksheet = XLSX.utils.json_to_sheet(stageData.rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, stageKey)
  XLSX.writeFile(workbook, `${planName}_${stageKey}.xlsx`)
}
```

5. **Excel导入**
```javascript
const handleImport = (file, stageKey) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result, { type: 'binary' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(sheet)

    // 更新stage数据
    const newStages = {
      ...stages,
      [stageKey]: { rows: jsonData, merges: stages[stageKey].merges }
    }
    setStages(newStages)
  }
  reader.readAsBinaryString(file)
}
```

6. **自动保存**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    axios.post(`/api/plan${planName}`, { description, stages })
  }, 1000)  // 1秒延迟
  return () => clearTimeout(timer)
}, [description, stages])
```

#### 4. `src/pages/StageDetail.jsx` (阶段详情)

**作用**: 管理Stage的类别结构(一级/二级类别)。

**核心功能**:

1. **加载类别数据**
```javascript
const loadData = async () => {
  const res = await axios.get(
    `/api/plans/${planName}/stages/${stageName}/categories`
  )
  setDescription(res.data.description)

  // 加载每个子类别的token统计
  const categoriesWithTotals = await Promise.all(
    res.data.categories.map(async (category) => {
      const subcategoriesWithTotals = await Promise.all(
        category.subcategories.map(async (sub) => {
          const detailRes = await axios.get(
            `/api/plans/${planName}/stages/${stageName}/categories/${category.name}/${sub.name}`
          )
          return {
            ...sub,
            tokenCountTotal: detailRes.data.tokenCountTotal,
            actualTokenTotal: detailRes.data.actualTokenTotal
          }
        })
      )

      // 计算类别总计
      const categoryTokenCount = subcategoriesWithTotals.reduce(
        (sum, sub) => sum + parseFloat(sub.tokenCountTotal || 0), 0
      ).toFixed(2)

      return { ...category, subcategories: subcategoriesWithTotals, tokenCountTotal: categoryTokenCount }
    })
  )

  setCategories(categoriesWithTotals)
}
```

2. **添加一级类别**
```javascript
const handleCategorySubmit = async () => {
  const values = await form.validateFields()
  const newCategory = {
    id: Date.now(),
    name: values.name,
    subcategories: []
  }
  const newCategories = [...categories, newCategory]
  setCategories(newCategories)

  await axios.post(
    `/api/plans/${planName}/stages/${stageName}/categories`,
    { description, categories: newCategories }
  )
}
```

3. **添加二级类别**
```javascript
const handleSubcategorySubmit = async () => {
  const values = await subForm.validateFields()
  const newSubcategory = { id: Date.now(), name: values.name }

  const newCategories = categories.map(c =>
    c.id === currentCategory.id
      ? { ...c, subcategories: [...c.subcategories, newSubcategory] }
      : c
  )
  setCategories(newCategories)

  await axios.post(
    `/api/plans/${planName}/stages/${stageName}/categories`,
    { description, categories: newCategories }
  )
}
```

#### 5. `src/pages/CategoryDetail.jsx` (数据表)

**作用**: 展示和编辑具体的数据表,包含数据集路径、Token统计等。

**核心功能**:

1. **双击编辑单元格**
```javascript
const EditableCell = ({ value, record, dataIndex, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const handleClick = () => {
    clickCount.current += 1
    if (clickCount.current === 2) {
      setEditing(true)  // 双击进入编辑模式
    }
  }

  const handleSave = () => {
    setEditing(false)
    if (inputValue !== value) {
      onSave(record.key, dataIndex, inputValue)
    }
  }

  return editing ? (
    <TextArea value={inputValue} onChange={e => setInputValue(e.target.value)} onBlur={handleSave} />
  ) : (
    <div onClick={handleClick}>{value || '双击编辑'}</div>
  )
}
```

2. **Token自动统计**
```javascript
const calculateTotals = () => {
  let tokenCountTotal = 0
  let actualTokenTotal = 0

  rows.forEach(row => {
    tokenCountTotal += parseFloat(row.token_count) || 0
    actualTokenTotal += parseFloat(row.actual_token) || 0
  })

  return {
    tokenCountTotal: tokenCountTotal.toFixed(2),
    actualTokenTotal: actualTokenTotal.toFixed(2)
  }
}
```

3. **自动保存**
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    saveData(true)  // isAutoSave=true,不显示提示
  }, 1000)
  return () => clearTimeout(timer)
}, [rows, description])

const saveData = async (isAutoSave = false) => {
  const totals = calculateTotals()
  await axios.post(
    `/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`,
    { description, rows, tokenCountTotal: totals.tokenCountTotal, actualTokenTotal: totals.actualTokenTotal }
  )
  if (!isAutoSave) message.success('保存成功')
}
```

4. **Excel导入**
```javascript
const handleImport = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const workbook = XLSX.read(e.target.result)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })

    const newRows = jsonData.slice(1).map((row, idx) => ({
      key: Date.now() + idx,
      hdfs_path: String(row[0] || ''),
      obs_fuzzy_path: String(row[1] || ''),
      obs_full_path: String(row[2] || ''),
      token_count: String(row[3] || ''),
      actual_usage: String(row[4] || ''),
      actual_token: String(row[5] || '')
    }))

    setRows(newRows)
  }
  reader.readAsArrayBuffer(file)
}
```

#### 6. `src/pages/Visualization.jsx` (数据可视化)

**作用**: 展示训练计划的统计图表和分析数据。

**核心功能**:

1. **加载可视化数据**
```javascript
const loadVisualizationData = async (planKey) => {
  const res = await axios.get(`/api/plans/${planKey}/visualization`)
  setStatsData(res.data)
  // 数据包含:
  // - overview: 总览统计
  // - stageStats: 各阶段统计
  // - categoryStats: 类别统计
  // - subcategoryStats: 子类别统计
  // - categoryDistribution: 类别分布(饼图数据)
  // - tokenTrends: 累计趋势(折线图数据)
}
```

2. **图表渲染**
```javascript
// 柱状图
<BarChart data={stageStats}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="stage" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="tokenCount" fill="#8884d8" />
  <Bar dataKey="actualToken" fill="#82ca9d" />
</BarChart>

// 饼图
<PieChart>
  <Pie
    data={categoryDistribution}
    dataKey="value"
    nameKey="name"
    outerRadius={120}
    label={(entry) => `${entry.name}: ${entry.value.toFixed(2)}T`}
  >
    {categoryDistribution.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>

// 折线图
<LineChart data={tokenTrends}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="stage" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="cumulativeTokenCount" stroke="#8884d8" />
  <Line type="monotone" dataKey="cumulativeActualToken" stroke="#82ca9d" />
</LineChart>
```

#### 7. `src/pages/Login.jsx` (登录页)

**作用**: 用户登录界面,验证用户身份并获取token。

**核心功能**:

```javascript
const handleLogin = async (values) => {
  const res = await axios.post('/api/auth/login', values)
  const { access_token, is_admin } = res.data

  // 保存token和权限信息
  setAuthToken(access_token)
  setUserInfo(is_admin)

  // 跳转到首页
  navigate('/')
}
```

#### 8. `src/utils/auth.js` (认证工具)

**作用**: 管理认证token和权限判断。

```javascript
export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem('token', token)
  } else {
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }
}

export const getToken = () => localStorage.getItem('token')

export const isAdmin = () => localStorage.getItem('is_admin') === 'true'

export const setUserInfo = (isAdmin) => {
  localStorage.setItem('is_admin', isAdmin)
}

export const logout = () => {
  setAuthToken(null)
  localStorage.removeItem('is_admin')
}

// 应用启动时恢复token
if (getToken()) {
  setAuthToken(getToken())
}
```

---

## 数据库设计

### ER图

```
┌─────────┐
│  User   │
└─────────┘

┌─────────┐       ┌──────────┐       ┌─────────────┐
│  Plan   │──1:N──│  Stage   │──1:N──│  TableRow   │
└─────────┘       └──────────┘       └─────────────┘
                       │1:N
                       ↓
                  ┌──────────────────┐
                  │ CategoryDetail   │
                  └──────────────────┘
```

### 表结构

#### users (用户表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR | 用户名(唯一) |
| hashed_password | VARCHAR | 加密后的密码 |
| is_admin | BOOLEAN | 是否管理员 |

#### plans (训练计划表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR | 计划名称(唯一,如"72B") |
| description | TEXT | 计划描述 |

#### stages (阶段表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR | 阶段名称(如"stage1") |
| plan_id | INTEGER | 外键→plans.id |
| description | TEXT | 阶段描述 |
| categories | JSON | 类别结构数据 |
| merges | JSON | 单元格合并信息 |

#### table_rows (表格行数据)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| stage_id | INTEGER | 外键→stages.id |
| row_order | INTEGER | 行序号 |
| category | VARCHAR | 类别 |
| subcategory | VARCHAR | 子类别 |
| total_tokens | VARCHAR | 总token数 |
| sample_ratio | VARCHAR | 采样比例 |
| cumulative_ratio | VARCHAR | 累积比例 |
| sample_tokens | VARCHAR | 采样token |
| category_ratio | VARCHAR | 类别比例 |
| part1~5 | VARCHAR | 第1~5部分 |
| note | TEXT | 备注 |

#### category_details (类别详情表)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| stage_id | INTEGER | 外键→stages.id |
| category_name | VARCHAR | 类别名 |
| subcategory_name | VARCHAR | 子类别名 |
| description | TEXT | 说明 |
| rows | JSON | 数据行数组 |
| token_count_total | VARCHAR | 数据集总token |
| actual_token_total | VARCHAR | 实际使用token |

---

## API接口详解

### 认证接口

#### POST /api/auth/login
登录获取token

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "access_token": "eyJhbGc...",
  "is_admin": true
}
```

#### POST /api/auth/register
注册新用户(需管理员权限)

**请求体**:
```json
{
  "username": "user1",
  "password": "password",
  "is_admin": false
}
```

#### GET /api/auth/me
获取当前用户信息

**响应**:
```json
{
  "username": "admin",
  "is_admin": true
}
```

### 计划管理接口

#### GET /api/plans
获取所有训练计划

**响应**:
```json
{
  "plans": [
    {
      "key": "72b",
      "name": "72B 训练计划",
      "description": "...",
      "stage_count": 4
    }
  ]
}
```

#### POST /api/plans
创建新训练计划(需管理员权限)

**请求体**:
```json
{
  "name": "120B",
  "description": "120B规模训练计划"
}
```

#### DELETE /api/plans/{plan_name}
删除训练计划(需管理员权限)

### 计划详情接口

#### GET /api/plan{plan_name}
获取计划的所有stage数据

**响应**:
```json
{
  "description": "...",
  "stages": {
    "stage1": {
      "rows": [...],
      "merges": [...]
    },
    "stage2": {...}
  }
}
```

#### POST /api/plan{plan_name}
保存计划数据(需管理员权限)

**请求体**:
```json
{
  "description": "...",
  "stages": {
    "stage1": {
      "rows": [...],
      "merges": [...]
    }
  }
}
```

### 可视化接口

#### GET /api/plans/{plan_name}/visualization
获取可视化统计数据

**响应**:
```json
{
  "overview": {
    "totalStages": 6,
    "totalCategories": 10,
    "totalTokenCount": 1234.56,
    "totalActualToken": 567.89
  },
  "stageStats": [
    {
      "stage": "STAGE1",
      "tokenCount": 100.50,
      "actualToken": 50.25,
      "datasetCount": 10
    }
  ],
  "categoryStats": [...],
  "subcategoryStats": [...],
  "categoryDistribution": [...],
  "tokenTrends": [...]
}
```

---

## 数据流程

### 1. 用户登录流程

```
用户输入账密 → 前端发送POST /api/auth/login
    ↓
后端验证密码(bcrypt) → 生成JWT token
    ↓
返回token和is_admin → 前端保存到localStorage
    ↓
设置axios全局header → 后续请求自动带token
    ↓
跳转到首页
```

### 2. 创建计划流程

```
管理员点击创建 → 填写计划名和描述
    ↓
POST /api/plans → 后端创建Plan记录
    ↓
自动创建4个默认Stage → 返回成功
    ↓
前端重新加载计划列表 → 触发plansChanged事件
    ↓
导航栏更新菜单 → 显示新计划
```

### 3. Stage数据保存流程

```
用户修改stage表格数据 → 触发state更新
    ↓
useEffect监听变化 → 延迟1秒
    ↓
POST /api/plan{plan_name} → 后端接收数据
    ↓
对比existing_stages和incoming_stages
    ↓
删除不存在的stages → 添加新stages
    ↓
更新TableRow数据 → 提交数据库
    ↓
返回成功 → 前端显示保存成功
```

### 4. 数据可视化加载流程

```
进入可视化页面 → 选择计划
    ↓
GET /api/plans/{plan_name}/visualization
    ↓
后端查询所有stages → 遍历CategoryDetail
    ↓
聚合统计数据:
  - 各阶段token统计
  - 类别token分布
  - 累计趋势数据
  - 子类别排行
    ↓
返回聚合结果 → 前端渲染图表
```

---

## 核心功能实现

### 1. JWT认证机制

**流程**:
1. 用户登录时,后端生成JWT token
2. Token包含用户信息(username, exp过期时间)
3. 前端保存token到localStorage
4. 后续请求在header中携带: `Authorization: Bearer <token>`
5. 后端通过Depends(get_current_user)验证token

**安全措施**:
- 密码使用bcrypt加密存储
- Token有过期时间
- 管理员操作需require_admin验证

### 2. 动态Stage管理

**技术要点**:
- Stage数据存储在stages表中
- 通过plan_id外键关联
- 前端通过对比existing和incoming实现增删
- 删除stage时级联删除相关TableRow和CategoryDetail

**关键代码** (backend/main.py Lines 197-213):
```python
# 获取现有stages
existing_stages = db.query(models.Stage).filter(models.Stage.plan_id == plan.id).all()
existing_stage_names = {stage.name for stage in existing_stages}
incoming_stage_names = set(data.stages.keys())

# 删除不存在的stages
stages_to_delete = existing_stage_names - incoming_stage_names
for stage_name in stages_to_delete:
    stage = db.query(models.Stage).filter(...).first()
    if stage:
        # 级联删除
        db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).delete()
        db.query(models.CategoryDetail).filter(models.CategoryDetail.stage_id == stage.id).delete()
        db.delete(stage)
```

### 3. 自动保存机制

**实现原理**:
- 使用React的useEffect监听数据变化
- setTimeout延迟执行保存
- 返回清理函数取消上次定时器(防抖)

**代码示例**:
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    saveData(true)  // 自动保存
  }, 1000)
  return () => clearTimeout(timer)  // 清理上次定时器
}, [description, rows])  // 监听数据变化
```

### 4. Excel导入导出

**导出流程**:
1. 使用XLSX.utils.json_to_sheet转换JSON为sheet
2. XLSX.utils.book_new创建workbook
3. XLSX.utils.book_append_sheet添加sheet
4. XLSX.writeFile保存文件

**导入流程**:
1. FileReader读取文件内容
2. XLSX.read解析workbook
3. XLSX.utils.sheet_to_json转换为JSON
4. 更新state并保存到后端

### 5. 可视化数据聚合

**后端聚合逻辑** (main.py Lines 489-613):
1. 查询计划的所有stages
2. 遍历每个stage的CategoryDetail
3. 累加token统计
4. 按category_name聚合数据
5. 计算累计趋势
6. 排序并返回Top N

**前端图表渲染**:
- 使用Recharts库
- ResponsiveContainer自适应容器
- 多种图表类型组合展示

### 6. 权限控制

**前端权限**:
- isAdmin()检查localStorage中的权限标识
- 根据权限显示/隐藏操作按钮
- 编辑功能仅管理员可用

**后端权限**:
- Depends(require_admin)装饰器
- 非管理员请求返回403
- 关键操作(创建/删除/修改)需要管理员权限

---

## 性能优化

1. **前端**:
   - 使用React.memo避免不必要渲染
   - 防抖(debounce)减少API调用
   - 虚拟滚动处理大量数据

2. **后端**:
   - SQLAlchemy ORM优化查询
   - 使用索引加速查询
   - JSON字段存储非结构化数据

3. **网络**:
   - Axios拦截器统一处理token
   - 错误统一捕获和提示
   - 并发请求使用Promise.all

---

## 扩展性设计

1. **数据库**:
   - 可轻松切换到PostgreSQL/MySQL
   - 修改database.py的连接字符串即可

2. **前端**:
   - 组件化设计,易于复用
   - 路由配置集中管理
   - 工具函数统一放utils目录

3. **后端**:
   - FastAPI自动生成OpenAPI文档
   - 模型与业务逻辑分离
   - 依赖注入便于测试

---

## 常见问题排查

### 1. 数据不更新

**检查**:
- 浏览器控制台是否有错误
- 网络请求是否成功(Network标签)
- 后端终端是否有错误日志

**解决**:
- 清除浏览器缓存
- 检查token是否过期
- 重启前后端服务

### 2. Excel导入失败

**原因**:
- Excel格式不匹配
- 列顺序不正确
- 数据类型不符合

**解决**:
- 使用系统提供的模板
- 检查Excel表头与模板一致
- 确保数值列不含文本

### 3. 图表不显示

**原因**:
- 数据为空
- 浏览器不支持Canvas
- recharts未正确安装

**解决**:
- 检查数据是否加载成功
- 更新浏览器版本
- 重新安装依赖: npm install recharts

---

## 总结

本系统采用现代Web技术栈,实现了一个功能完整、性能优秀的数据版本管理平台。通过前后端分离架构,保证了系统的可维护性和扩展性。详细的文档和清晰的代码结构,便于后续开发和维护。
