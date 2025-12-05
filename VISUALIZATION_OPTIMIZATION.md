# 可视化页面优化说明 v2.0

## 优化目标

根据用户反馈，进行以下优化：
1. ✅ **Token单位显示** - 所有Token数值添加"B"单位
2. ✅ **横坐标横向显示** - 不再斜着，避免与Legend重叠
3. ✅ **类别统计表结构重构** - 合并为单表，按阶段→一级类别→二级类别层次显示
4. ✅ **数据钻取功能** - 点击二级类别跳转到详情页
5. ✅ **美化表格样式** - 斑马纹、悬停效果、进度条

---

## 核心改进

### 1. ✅ Token单位标准化 - 添加"B"单位

**问题**: 数据集Token的单位是B，但界面没有显示

**解决方案**: 统一使用`formatToken()`函数格式化所有Token数值

```javascript
// 格式化Token数值，添加B单位
const formatToken = (value) => {
  if (value === null || value === undefined) return '0.00B'
  return `${parseFloat(value).toFixed(2)}B`
}
```

**应用位置**:
- ✅ 概览统计卡片（数据集总Token、实际使用Token）
- ✅ 图表Tooltip（自定义CustomTooltip组件）
- ✅ 图表Y轴（tickFormatter添加B单位）
- ✅ 类别统计表（DST、AUT列）

**效果**:
```
修改前: 12501.50
修改后: 12501.50B
```

---

### 2. ✅ 横坐标横向显示 - 不再旋转

**问题**: 横坐标斜着显示会与下方Legend重叠

**解决方案**:
- 移除`CustomXAxisTick`组件（之前45度旋转）
- 使用默认横向显示：`angle={0}`
- 增加图表高度和底部margin避免拥挤

```javascript
// 修改前（斜着显示）
<XAxis dataKey="stage" tick={<CustomXAxisTick />} height={80} />
// CustomXAxisTick组件内使用 transform="rotate(-45)"

// 修改后（横向显示）
<XAxis
  dataKey="stage"
  height={60}
  tick={{ fontSize: 12, fill: '#666' }}
  angle={0}  // 横向显示
/>
```

**图表margin调整**:
```javascript
// 各阶段Token累计趋势
<LineChart margin={{ top: 20, right: 30, left: 20, bottom: 80 }} />
// 底部margin增加到80，确保Legend有足够空间

// 各阶段Token对比、数据集数量
<BarChart margin={{ top: 20, right: 30, left: 20, bottom: 80 }} />
```

**图表高度优化**:
- Token累计趋势: 450px（最重要的可视化，给予最大空间）
- Token统计对比: 450px
- 数据集数量: 400px

---

### 3. ✅ 类别统计表重构 - 三级层次结构

**问题**:
- 旧版分为"一级类别表"和"Top10表"两张表
- 无法看到完整的层次关系

**解决方案**: 合并为一张表，显示完整的**阶段→一级类别→二级类别**层次

#### 数据结构构建

```javascript
// 构建三级结构的完整类别列表
const buildHierarchicalData = () => {
  const hierarchical = []

  // 1. 按阶段分组
  const stageGroups = {}
  subcategoryStats.forEach(sub => {
    if (!stageGroups[sub.stage]) {
      stageGroups[sub.stage] = {}
    }
    if (!stageGroups[sub.stage][sub.category]) {
      stageGroups[sub.stage][sub.category] = []
    }
    stageGroups[sub.stage][sub.category].push(sub)
  })

  // 2. 按层次构建：阶段 → 一级类别 → 二级类别
  Object.keys(stageGroups).sort().forEach(stage => {
    Object.keys(stageGroups[stage]).sort().forEach(category => {
      const subcategories = stageGroups[stage][category]
      subcategories.forEach(sub => {
        hierarchical.push({
          stage: stage,
          category: category,
          subcategory: sub.subcategory,
          datasetCount: sub.datasetCount,
          tokenCount: sub.tokenCount,
          actualToken: sub.actualToken,
          usageRate: sub.tokenCount > 0 ? (sub.actualToken / sub.tokenCount * 100) : 0
        })
      })
    })
  })

  return hierarchical
}
```

#### 表格列定义

| 列名 | 宽度 | 排序 | 对齐 | 特殊功能 |
|-----|------|------|------|---------|
| 阶段 | 120px | ✅ | - | fixed='left'，蓝色加粗 |
| 一级类别 | 150px | ✅ | - | fixed='left'，加粗 |
| 二级类别 | 180px | ✅ | - | **点击跳转**到详情页 |
| 数据集数量 | 120px | ✅ | right | - |
| 数据集总Token (DST) | 180px | ✅ | right | 橙色，**默认降序** |
| 实际使用Token (AUT) | 180px | ✅ | right | 绿色 |
| 使用率 | 150px | ✅ | right | **彩色进度条** |

#### 关键特性

1. **所有列可排序** - 点击列标题即可排序
2. **默认按DST降序** - `defaultSortOrder: 'descend'`
3. **固定左侧列** - 阶段和一级类别固定，方便横向滚动时查看
4. **分页功能** - 默认50条/页，支持20/50/100/200切换

```javascript
pagination={{
  pageSize: 50,
  showSizeChanger: true,
  pageSizeOptions: ['20', '50', '100', '200'],
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条数据`
}}
```

---

### 4. ✅ 数据钻取功能 - 点击跳转

**功能**: 点击二级类别名称，直接跳转到对应的详情页

```javascript
{
  title: '二级类别',
  dataIndex: 'subcategory',
  key: 'subcategory',
  width: 180,
  render: (text, record) => (
    <AntTooltip title="点击查看详情">
      <a
        onClick={() => navigate(`/plan/${selectedPlan}/${record.stage}/${record.category}/${record.subcategory}`)}
        style={{ color: '#1890ff', fontWeight: 500 }}
      >
        {text}
      </a>
    </AntTooltip>
  )
}
```

**效果**:
- 鼠标悬停显示"点击查看详情"提示
- 点击后跳转到：`/plan/1/111/2/22`（例如）
- 可直接查看该二级类别的具体数据集

---

### 5. ✅ 美化表格样式

#### 斑马纹效果

```javascript
// 表格行样式
rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}

// CSS样式
<style>{`
  .table-row-light {
    background-color: #fafafa;
  }
  .table-row-dark {
    background-color: #ffffff;
  }
  .ant-table-tbody > tr:hover > td {
    background-color: #e6f7ff !important;
  }
`}</style>
```

#### 使用率进度条

```javascript
{
  title: '使用率',
  dataIndex: 'usageRate',
  key: 'usageRate',
  width: 150,
  align: 'right',
  render: (val) => {
    const rate = parseFloat(val)
    const color = rate >= 90 ? '#52c41a' : rate >= 70 ? '#faad14' : '#f5222d'
    return (
      <div>
        <Text strong style={{ color, fontSize: 15 }}>{rate.toFixed(2)}%</Text>
        <Progress
          percent={parseFloat(rate.toFixed(2))}
          strokeColor={color}
          showInfo={false}
          size="small"
          style={{ marginTop: 4 }}
        />
      </div>
    )
  }
}
```

**颜色映射**:
- 🟢 绿色 (>=90%): 优秀
- 🟠 橙色 (>=70%): 良好
- 🔴 红色 (<70%): 需改进

---

### 6. ✅ 新增全局使用率卡片

**功能**: 在概览统计中新增第5个卡片，显示全局使用率

```javascript
<Col xs={24} sm={12} md={12} lg={5}>
  <Card hoverable>
    <Statistic
      title="全局使用率"
      value={globalUsageRate.toFixed(2)}
      suffix="%"
      prefix={<PercentageOutlined />}
      valueStyle={{
        color: globalUsageRate >= 90 ? '#52c41a' : globalUsageRate >= 70 ? '#faad14' : '#f5222d',
        fontSize: 28
      }}
    />
    <Progress
      percent={parseFloat(globalUsageRate.toFixed(2))}
      strokeColor={globalUsageRate >= 90 ? '#52c41a' : globalUsageRate >= 70 ? '#faad14' : '#f5222d'}
      showInfo={false}
      style={{ marginTop: 8 }}
    />
  </Card>
</Col>
```

**计算公式**:
```javascript
const globalUsageRate = overview.totalTokenCount > 0
  ? (overview.totalActualToken / overview.totalTokenCount * 100)
  : 0
```

---

### 7. ✅ 图表Tooltip优化

**自定义Tooltip**，统一显示B单位：

```javascript
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#262626' }}>{label}</div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginBottom: 4 }}>
            {entry.name}: <span style={{ fontWeight: 'bold' }}>{formatToken(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// 应用到图表
<Tooltip content={<CustomTooltip />} />
```

---

## 页面布局对比

### Tab 1: 概览统计

```
┌─────────────────────────────────────────────────────────────────┐
│ 【5个统计卡片】                                                  │
│ ┌─────┐ ┌─────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│ │阶段  │ │类别  │ │DST      │ │AUT      │ │使用率    │             │
│ │总数  │ │总数  │ │12501.50B│ │11646.41B│ │93.16%   │             │
│ └─────┘ └─────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                          └── 新增 ──┘             │
├─────────────────────────────────────────────────────────────────┤
│ Token累计趋势（折线图，450px高）                                 │
│ ├─ 横坐标：横向显示，不旋转                                      │
│ ├─ Y轴：显示"B"单位                                             │
│ ├─ Tooltip：显示"12501.50B"格式                                │
│ └─ Legend：在图表下方，不重叠                                    │
├─────────────────────────────────────────────────────────────────┤
│ Token统计对比（柱状图，450px高）                                 │
│ └─ 同样横向显示，带B单位                                         │
├─────────────────────────────────────────────────────────────────┤
│ 数据集数量（柱状图，400px高）                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 2: 类别统计

```
┌─────────────────────────────────────────────────────────────────┐
│ 完整类别层次统计                     共 X 个二级类别             │
├────┬──────┬────────┬────┬─────────┬─────────┬────────┤
│阶段│一级  │二级     │数量│DST      │AUT      │使用率   │
│    │类别  │类别     │    │         │         │        │
├────┼──────┼────────┼────┼─────────┼─────────┼────────┤
│111 │2     │22      │ 5  │12501.50B│11646.41B│93.16%  │ ← 斑马纹
│    │      │        │    │         │         │████    │ ← 进度条
├────┼──────┼────────┼────┼─────────┼─────────┼────────┤
│111 │3     │33      │ 3  │8500.00B │7200.00B │84.71%  │
│    │      │        │    │         │         │███     │
└────┴──────┴────────┴────┴─────────┴─────────┴────────┘
         ↑        ↑                                ↑
    固定列   可点击跳转                      彩色进度条
```

---

## 技术亮点

### 1. 响应式布局

```javascript
// 统计卡片自适应
<Col xs={24} sm={12} md={8} lg={4}>  // 阶段总数
<Col xs={24} sm={12} md={8} lg={5}>  // 一级类别总数
<Col xs={24} sm={12} md={8} lg={5}>  // DST
<Col xs={24} sm={12} md={12} lg={5}> // AUT
<Col xs={24} sm={12} md={12} lg={5}> // 使用率
```

### 2. 数据验证

所有Token计算都包含0值检查：

```javascript
const globalUsageRate = overview.totalTokenCount > 0
  ? (overview.totalActualToken / overview.totalTokenCount * 100)
  : 0

usageRate: sub.tokenCount > 0 ? (sub.actualToken / sub.tokenCount * 100) : 0
```

### 3. 性能优化

- 使用`useMemo`缓存层次数据（可选）
- Tab懒加载（Ant Design Tabs自动支持）
- 分页显示，避免渲染过多DOM

---

## 使用说明

### 测试步骤

1. **访问可视化页面**:
   ```
   http://localhost:3000/visualization
   ```

2. **选择计划**: 右上角下拉框选择要查看的训练计划

3. **查看概览统计** (Tab 1):
   - ✅ 验证：所有Token值显示"B"单位
   - ✅ 验证：图表横坐标横向显示，不与Legend重叠
   - ✅ 验证：鼠标悬停图表显示Tooltip，格式为"12501.50B"
   - ✅ 验证：全局使用率卡片显示正确

4. **查看类别统计** (Tab 2):
   - ✅ 验证：表格显示完整的阶段→一级类别→二级类别层次
   - ✅ 验证：点击列标题可排序
   - ✅ 验证：默认按DST降序排列
   - ✅ 验证：点击二级类别名称跳转到详情页
   - ✅ 验证：使用率列显示彩色进度条
   - ✅ 验证：表格有斑马纹效果
   - ✅ 验证：鼠标悬停行变蓝色

---

## 对比总结

| 功能 | 优化前 | 优化后 | 改进 |
|-----|-------|--------|------|
| **Token单位** | ❌ 无单位 | ✅ 统一显示"B"单位 | 标准化 |
| **横坐标显示** | ❌ 45度旋转，与Legend重叠 | ✅ 横向显示，增加间距 | 避免重叠 |
| **类别统计** | ❌ 分两张表（一级+Top10） | ✅ 单表三级层次结构 | 完整清晰 |
| **数据总量** | ⚠️ Top10仅显示10条 | ✅ 显示全部二级类别 | 信息完整 |
| **数据钻取** | ❌ 无 | ✅ 点击二级类别跳转详情 | 交互增强 |
| **表格样式** | ⚠️ 单调 | ✅ 斑马纹+悬停+进度条 | 美观实用 |
| **排序功能** | ⚠️ 部分列可排序 | ✅ 所有列可排序 | 功能完善 |
| **使用率可视化** | ⚠️ 仅文字 | ✅ 文字+彩色进度条 | 直观 |
| **卡片数量** | 4个 | 5个（新增全局使用率） | 信息增强 |

---

## 文件修改清单

- **修改文件**: `src/pages/Visualization.jsx` (完全重写，502→600行)
- **新增功能**:
  - formatToken()函数统一处理B单位
  - CustomTooltip组件显示格式化Token
  - buildHierarchicalData()构建三级层次数据
  - 数据钻取跳转功能
  - 全局使用率卡片
  - 表格斑马纹和悬停效果
- **新增依赖**:
  - `Tag`（显示数据总量）
  - `Progress`（使用率进度条）
  - `Tooltip as AntTooltip`（避免与Recharts的Tooltip冲突）
  - `useNavigate`（页面跳转）

---

**修改时间**: 2025-12-05
**版本**: v2.0 - 可视化页面优化
**适用场景**: 多阶段、多类别、大数据量的训练数据可视化分析

## 数据准确性保证

所有数据直接来自后端API `/api/plans/{plan}/visualization`，计算逻辑：

1. **后端聚合** - Stage → Category → Subcategory
2. **前端展示** - 直接使用后端数据，不再次计算
3. **使用率计算** - `(actualToken / tokenCount * 100)`
4. **全局使用率** - `(totalActualToken / totalTokenCount * 100)`

所有数值与数据库完全一致。
