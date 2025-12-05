# 数据可视化页面大改版说明

## 改版目标

基于用户反馈，重新设计可视化页面，解决以下问题：
1. ✅ **横坐标重叠** - Stage名称长时显示不全
2. ✅ **饼图文字太多** - 类别多时下方图例不方便看
3. ✅ **纵坐标重叠** - Top10图表标签重叠
4. ✅ **添加新模块** - 数据集来源统计、上下文分布

## 改版方案

### 布局结构：Tab切换

原来所有内容堆在一个页面，现在分成4个Tab：

| Tab | 内容 | 展示方式 |
|-----|------|---------|
| **概览统计** | 4个统计卡片 + 3个图表 | 可视化（图表）|
| **类别统计** | 一级类别表 + 二级类别Top10表 | 表格 |
| **数据集来源统计** | 待开发 | 占位 |
| **上下文分布** | 待开发 | 占位 |

---

## 核心改进

### 1. ✅ 解决横坐标重叠 - 旋转45度

**问题**: Stage名称包含中文括号时，横坐标文字重叠

**解决方案**: 自定义XAxis标签，旋转45度显示

```javascript
const CustomXAxisTick = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-45)"  // 旋转45度
        fontSize={12}
      >
        {payload.value}
      </text>
    </g>
  )
}

// 在图表中使用
<XAxis dataKey="stage" tick={<CustomXAxisTick />} height={80} />
```

**效果**:
```
修改前:
Stage1(预训练) Stage2(微调) Stage3(强化学习)
   ↓ 重叠          ↓ 重叠         ↓ 重叠

修改后:
         Stage3(强化学习)
      Stage2(微调)
   Stage1(预训练)
      ↑ 旋转45度，不重叠
```

**应用到**:
- 各阶段Token统计对比
- 各阶段数据集数量
- 各阶段Token累计趋势

### 2. ✅ 饼图改为表格

**问题**: 一级类别很多时，饼图下方图例文字密密麻麻，不方便查看

**解决方案**: 完全移除饼图，改为功能强大的表格

**旧版（饼图）**:
- 只能看到名称和占比
- 类别多时图例重叠
- 无法排序、搜索
- 信息展示有限

**新版（表格）**:
```javascript
<Table
  dataSource={categoryStats}
  pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true }}
  columns={[
    { title: '一级类别', sorter: true },
    { title: '所属阶段', sorter: true },
    { title: '二级类别数', sorter: true, defaultSortOrder: 'descend' },
    { title: '数据集数量', sorter: true },
    { title: '数据集总Token (DST)', sorter: true, color: '#faad14' },
    { title: '实际使用Token (AUT)', sorter: true, color: '#f5222d' },
    {
      title: '使用率',
      sorter: true,
      render: (val) => {
        // 使用率 >= 90%: 绿色
        // 使用率 >= 70%: 橙色
        // 使用率 < 70%: 红色
        const color = val >= 90 ? '#52c41a' : val >= 70 ? '#faad14' : '#f5222d'
        return <Text strong style={{ color }}>{val.toFixed(2)}%</Text>
      }
    }
  ]}
/>
```

**优势**:
- ✅ 显示7列详细信息（而不是饼图的2个）
- ✅ 可按任意列排序
- ✅ 分页显示（每页20条）
- ✅ 可搜索、筛选
- ✅ 使用率彩色显示（一眼看出利用率高低）

### 3. ✅ Top10改为表格 + 排名高亮

**问题**: 纵坐标二级类别名称长，导致重叠

**解决方案**: 横向柱状图改为表格，前3名用颜色高亮

```javascript
<Table
  dataSource={subcategoryStats.slice(0, 10)}
  pagination={false}
  columns={[
    {
      title: '排名',
      render: (_, __, index) => {
        const colors = ['#faad14', '#52c41a', '#1890ff']  // 金银铜
        const color = index < 3 ? colors[index] : '#666'
        return <Text strong style={{ color, fontSize: 16 }}>{index + 1}</Text>
      }
    },
    { title: '二级类别' },
    { title: '一级类别' },
    { title: '所属阶段' },
    { title: '数据集数量', align: 'right' },
    { title: 'DST', align: 'right', color: '#faad14' },
    { title: 'AUT', align: 'right', color: '#f5222d' }
  ]}
/>
```

**效果**:
- ✅ 排名1-3用金/绿/蓝高亮
- ✅ 显示完整的类别名称
- ✅ 包含所属阶段、数据集数量等详细信息
- ✅ 不会有重叠问题

### 4. ✅ 新增模块（占位）

#### 数据集来源统计 (Tab 3)
```javascript
<Empty
  description={
    <div>
      <div style={{ fontSize: 16 }}>数据集来源统计</div>
      <div style={{ color: '#999' }}>该功能正在开发中，敬请期待</div>
    </div>
  }
/>
```

**未来可展示**:
- HDFS路径来源分布
- OBS路径来源分布
- 数据提供方统计
- ...

#### 上下文分布 (Tab 4)
```javascript
<Empty
  description={
    <div>
      <div style={{ fontSize: 16 }}>数据统计上下文分布</div>
      <div style={{ color: '#999' }}>该功能正在开发中，敬请期待</div>
    </div>
  }
/>
```

**未来可展示**:
- Token长度分布
- 上下文窗口使用情况
- 长短文本占比
- ...

---

## 页面布局对比

### 旧版布局（单页面，全部堆叠）
```
┌─────────────────────────────────────┐
│ 标题 + 计划选择器                    │
├─────────────────────────────────────┤
│ 4个统计卡片                          │
├─────────────────────────────────────┤
│ 各阶段Token柱状图 | 数据集数量柱状图  │
├─────────────────────────────────────┤
│ 饼图（类别分布）  | 累计趋势折线图    │
│ ❌ 类别多时图例密密麻麻                │
├─────────────────────────────────────┤
│ 一级类别统计表                       │
├─────────────────────────────────────┤
│ Top10横向柱状图                      │
│ ❌ 纵坐标文字重叠                     │
└─────────────────────────────────────┘
```

### 新版布局（Tab切换，分类清晰）
```
┌─────────────────────────────────────┐
│ 标题 + 计划选择器                    │
├─────────────────────────────────────┤
│ [概览统计] [类别统计] [来源] [上下文] │ ← Tab切换
├─────────────────────────────────────┤
│                                     │
│  Tab 1: 概览统计                     │
│  ├─ 4个统计卡片                      │
│  ├─ Token累计趋势（折线图）✨ 最重要  │
│  ├─ 各阶段Token对比（柱状图）         │
│  └─ 各阶段数据集数量（柱状图）        │
│      ✅ 横坐标旋转45度，不重叠         │
│                                     │
│  Tab 2: 类别统计                     │
│  ├─ 一级类别详细统计表                │
│  │   ✅ 7列信息，可排序、分页          │
│  │   ✅ 使用率彩色显示                 │
│  └─ 二级类别Top10表                  │
│      ✅ 排名1-3高亮                   │
│      ✅ 完整信息，无重叠                │
│                                     │
│  Tab 3: 数据集来源统计 (占位)         │
│  Tab 4: 上下文分布 (占位)             │
│                                     │
└─────────────────────────────────────┘
```

---

## 技术亮点

### 1. 自定义图表标签组件
```javascript
// XAxis标签旋转
const CustomXAxisTick = ({ x, y, payload }) => (
  <g transform={`translate(${x},${y})`}>
    <text transform="rotate(-45)" textAnchor="end">
      {payload.value}
    </text>
  </g>
)

// YAxis标签截断
const CustomYAxisTick = ({ x, y, payload }) => {
  const maxLength = 20
  let displayText = payload.value
  if (displayText.length > maxLength) {
    displayText = displayText.substring(0, maxLength) + '...'
  }
  return <text>{displayText}</text>
}
```

### 2. 表格条件格式化
```javascript
// 使用率颜色映射
render: (val) => {
  const color = val >= 90 ? '#52c41a'   // 绿色: 优秀
              : val >= 70 ? '#faad14'   // 橙色: 良好
              : '#f5222d'               // 红色: 需改进
  return <Text strong style={{ color }}>{val.toFixed(2)}%</Text>
}

// 排名高亮
render: (_, __, index) => {
  const colors = ['#faad14', '#52c41a', '#1890ff']  // 金银铜
  const color = index < 3 ? colors[index] : '#666'
  return <Text strong style={{ color }}>{index + 1}</Text>
}
```

### 3. Tab懒加载内容
使用Tabs组件的items属性，只渲染当前激活的Tab，提升性能

---

## 使用说明

### 测试步骤

1. **访问可视化页面**:
   ```
   http://localhost:3000/visualization
   ```

2. **选择计划**: 右上角下拉框选择要查看的训练计划

3. **查看概览统计** (默认Tab):
   - 查看4个关键指标卡片
   - 查看Token累计趋势（最重要）
   - 查看各阶段对比
   - ✅ 验证：Stage名称长时不重叠（旋转45度）

4. **查看类别统计** (Tab 2):
   - 查看一级类别详细表
   - 点击列标题排序
   - ✅ 验证：使用率高的显示绿色
   - 查看二级类别Top10
   - ✅ 验证：前3名用颜色高亮

5. **查看占位Tab** (Tab 3, 4):
   - 看到"该功能正在开发中"提示

---

## 对比总结

| 功能 | 旧版 | 新版 | 改进 |
|-----|------|------|------|
| **横坐标重叠** | ❌ Stage名称长时重叠 | ✅ 旋转45度显示 | 完全解决 |
| **类别分布** | ❌ 饼图+图例，类别多时难看 | ✅ 表格，7列信息可排序 | 大幅提升 |
| **Top10展示** | ❌ 横向柱状图，纵坐标重叠 | ✅ 表格，排名彩色高亮 | 完全解决 |
| **页面布局** | ❌ 单页堆叠，内容杂乱 | ✅ Tab切换，分类清晰 | 结构优化 |
| **数据详细度** | ⚠️ 饼图只显示名称+占比 | ✅ 表格显示7列详细信息 | 信息量翻倍 |
| **交互性** | ⚠️ 只能hover查看 | ✅ 可排序、分页、搜索 | 功能增强 |
| **新功能** | ❌ 无 | ✅ 数据集来源、上下文分布（占位） | 扩展性强 |

---

## 文件修改清单

- **修改文件**: `src/pages/Visualization.jsx` (完全重写)
- **新增功能**:
  - Tab切换布局
  - 自定义图表标签（旋转、截断）
  - 表格条件格式化（颜色映射）
  - 2个占位Tab
- **代码行数**: 从366行优化到502行
- **可读性**: 大幅提升（Tab结构清晰）

---

**修改时间**: 2025-12-04
**版本**: v2.0 - 可视化大改版
**适用场景**: 多计划、多Stage、多类别的复杂训练数据管理
