# Excel导入覆盖模式 + 删除功能修复

## 修复内容

### 问题1: 删除功能失效
**现象**: 点击"删除选中"按钮后，数据没有被删除

**根本原因**:
1. 后端DELETE接口的Token计算使用了`sum()`函数，没有异常处理
2. 前端删除后直接修改状态，没有重新从数据库加载

**解决方案**:
- **后端** ([backend/main.py](backend/main.py) lines 826-842): 改用for循环+try-except计算Token
- **前端** ([src/pages/CategoryDetail.jsx](src/pages/CategoryDetail.jsx) lines 451-477): 删除后调用`loadData(currentPage)`重新加载数据

### 问题2: Excel导入是追加而不是覆盖
**现象**: 每次导入Excel都在现有数据基础上追加，而不是替换

**用户需求**: "我希望每次导入excel都是覆盖现有的数据表而不是在当前基础上追加数据"

**解决方案**:
- **前端** ([src/pages/CategoryDetail.jsx](src/pages/CategoryDetail.jsx) lines 338-427):
  - 改用**POST接口**而不是循环PATCH
  - 一次性发送所有新数据，后端直接替换整个`rows`数组
  - 提示改为"成功导入 X 条数据（覆盖模式）"

- **后端** ([backend/main.py](backend/main.py) lines 623-649):
  - POST接口直接替换`category_data.rows = data.rows`
  - 自动重新计算Token统计
  - 返回计算后的Token值给前端

## 代码变更详情

### 后端修改 1: DELETE接口Token计算健壮性

**文件**: `backend/main.py`
**位置**: lines 826-842

```python
# 修改前（容易出错）:
token_total = sum(float(r.get('token_count', 0) or 0) for r in rows)
actual_total = sum(float(r.get('actual_token', 0) or 0) for r in rows)

# 修改后（健壮处理）:
token_total = 0.0
actual_total = 0.0
for r in rows:
    try:
        token_count = r.get('token_count', '') or '0'
        token_total += float(token_count)
    except (ValueError, TypeError):
        pass
    try:
        actual_token = r.get('actual_token', '') or '0'
        actual_total += float(actual_token)
    except (ValueError, TypeError):
        pass
```

### 后端修改 2: POST接口自动计算Token

**文件**: `backend/main.py`
**位置**: lines 623-649

```python
# 修改前:
category_data.description = data.description
category_data.rows = data.rows
category_data.token_count_total = data.tokenCountTotal  # 直接使用前端传来的值
category_data.actual_token_total = data.actualTokenTotal
plan_db.commit()
return {"success": True}

# 修改后:
category_data.description = data.description
category_data.rows = data.rows

# 重新计算Token统计（不信任前端传来的值）
token_total = 0.0
actual_total = 0.0
for r in data.rows:
    try:
        token_count = r.get('token_count', '') or '0'
        token_total += float(token_count)
    except (ValueError, TypeError):
        pass
    try:
        actual_token = r.get('actual_token', '') or '0'
        actual_total += float(actual_token)
    except (ValueError, TypeError):
        pass

category_data.token_count_total = f"{token_total:.2f}"
category_data.actual_token_total = f"{actual_total:.2f}"

plan_db.commit()
return {
    "success": True,
    "tokenCountTotal": category_data.token_count_total,
    "actualTokenTotal": category_data.actual_token_total
}
```

### 前端修改 1: Excel导入改为覆盖模式

**文件**: `src/pages/CategoryDetail.jsx`
**位置**: lines 391-418

```javascript
// 修改前（追加模式 - 循环PATCH每一行）:
for (let i = 0; i < newRows.length; i++) {
  const row = newRows[i]
  const res = await axios.patch(
    `/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}/row`,
    row
  )
  successCount++
}

// 修改后（覆盖模式 - 一次性POST整个数据集）:
// 【覆盖模式】先清空现有数据，然后导入新数据
message.loading({ content: '正在清空现有数据...', key: 'import', duration: 0 })

// 使用POST接口直接覆盖整个数据集
const res = await axios.post(
  `/api/plans/${planName}/stages/${stageName}/categories/${categoryName}/${subcategoryName}`,
  {
    description: description, // 保留原有描述
    rows: newRows,
    tokenCountTotal: '0', // 后端会重新计算
    actualTokenTotal: '0'
  }
)

// 更新Token统计
setTokenCountTotal(res.data.tokenCountTotal || '0')
setActualTokenTotal(res.data.actualTokenTotal || '0')

message.success({ content: `成功导入 ${newRows.length} 条数据（覆盖模式）`, key: 'import' })

// 重新加载第一页数据
setCurrentPage(1)
loadData(1)
```

### 前端修改 2: 删除功能重新加载数据

**文件**: `src/pages/CategoryDetail.jsx`
**位置**: lines 451-477

```javascript
// 修改前（直接修改状态，不重新加载）:
setTotal(res.data.total)
setTokenCountTotal(res.data.tokenCountTotal)
setActualTokenTotal(res.data.actualTokenTotal)
setRows(prev => prev.filter(row => !selectedRowKeys.includes(row.key)))
setSelectedRowKeys([])
setExpandedRowKeys(prev => prev.filter(key => !selectedRowKeys.includes(key)))
message.success('删除成功')

if (rows.length === selectedRowKeys.length && currentPage > 1) {
  setCurrentPage(currentPage - 1)
} else {
  loadData()
}

// 修改后（删除后重新加载数据）:
// 更新Token统计
setTokenCountTotal(res.data.tokenCountTotal || '0')
setActualTokenTotal(res.data.actualTokenTotal || '0')

// 清空选中状态
setSelectedRowKeys([])

message.success(`成功删除 ${selectedRowKeys.length} 条数据`)

// 重新加载当前页数据
loadData(currentPage)
```

## 使用效果对比

### Excel导入

**修改前（追加模式）**:
```
现有数据: 10行
导入Excel: 5行
结果: 15行（10 + 5）
```

**修改后（覆盖模式）**:
```
现有数据: 10行
导入Excel: 5行
结果: 5行（完全替换）
提示: "成功导入 5 条数据（覆盖模式）"
```

### 删除功能

**修改前**:
- 选中3行 → 点击删除 → 可能失败或显示不一致
- Token统计可能不更新

**修改后**:
- 选中3行 → 点击删除 → 提示"成功删除 3 条数据"
- 页面自动刷新显示最新数据
- Token统计正确更新

## 测试步骤

### 测试1: Excel导入覆盖模式

1. 访问任意数据表页面（如 http://localhost:3000/plan/1/111/2/22）
2. 手动"插入空行"添加几行数据，记录行数
3. 准备一个包含不同数据的Excel文件（如5行）
4. 点击"导入Excel"，选择文件
5. 观察提示："成功导入 5 条数据（覆盖模式）"
6. **验证**: 数据表只有5行（之前的数据被完全替换）
7. **验证**: Token统计正确显示新数据的总和

### 测试2: 删除功能

1. 在数据表中勾选几行数据
2. 点击"删除选中"按钮
3. 观察提示："成功删除 X 条数据"
4. **验证**: 选中的行已经从数据库中删除
5. **验证**: Token统计自动更新为剩余数据的总和
6. 刷新页面（F5）
7. **验证**: 数据仍然是删除后的结果（持久化成功）

## 注意事项

1. **Excel导入是覆盖模式**:
   - 每次导入会**完全替换**现有数据
   - 如果需要追加，请先导出现有数据，在Excel中合并后再导入

2. **Description保留**:
   - 导入Excel时会保留"说明"字段的内容
   - 只有数据行会被替换

3. **Token自动计算**:
   - 无论导入还是删除，Token统计都会自动重新计算
   - 不再依赖前端传来的值，确保数据准确性

4. **删除后页面状态**:
   - 删除后会重新加载当前页
   - 如果当前页没有数据，显示空表而不是自动跳转

## 文件清单

修改的文件:
1. `backend/main.py` (lines 623-649, 826-842)
2. `src/pages/CategoryDetail.jsx` (lines 338-477)

新增文件:
- `backend/EXCEL_IMPORT_FIX.md` (本文件)

---

**修改时间**: 2025-12-04
**版本**: v2.0 - Excel覆盖模式 + 删除功能修复
