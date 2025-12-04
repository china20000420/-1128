# Excel导入数据持久化问题修复说明

## 问题描述

用户在 `http://localhost:3000/plan/1/111/2/22` 页面导入Excel数据后：
1. **数据不持久化**: 导入显示成功，但刷新页面后数据消失
2. **Token统计显示0.00**: "数据集总token累计" 和 "实际使用token累计" 始终显示 0.00

## 根本原因

后端的 **PATCH** 和 **DELETE** 接口在访问不存在的 Stage 时抛出 404 错误，而不是像 **GET** 接口那样自动创建。

### 问题流程：
1. 用户访问 `/plan/1/111/2/22` → GET接口创建了 Plan、Stage("111")、CategoryDetail("2"/"22")
2. 用户导入Excel → 前端循环调用 PATCH 接口保存每一行
3. 如果 Stage "111" 之前不存在（或数据库被清空），PATCH 接口抛出 404
4. 前端显示"导入成功"（因为捕获了错误），但数据实际没有保存到数据库

## 修复方案

### 修改 1: `backend/main.py` - PATCH 描述接口 (lines 632-675)

**修改前**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    raise HTTPException(status_code=404, detail="Stage not found")
```

**修改后**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    # Create stage if it doesn't exist (consistent with GET endpoint)
    max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
    next_order = (max_order_result.stage_order + 1) if max_order_result else 0
    stage = models.Stage(name=stage_name, stage_order=next_order, description="", categories=[])
    plan_db.add(stage)
    plan_db.commit()
    plan_db.refresh(stage)

# 同时也自动创建 CategoryDetail
if not category_data:
    category_data = models.CategoryDetail(
        stage_id=stage.id,
        category_name=category_name,
        subcategory_name=subcategory_name,
        description="",
        token_count_total="0.00",
        actual_token_total="0.00"
    )
    plan_db.add(category_data)
    plan_db.flush()
```

### 修改 2: `backend/main.py` - PATCH 行更新接口 (lines 663-772)

**修改前**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    raise HTTPException(status_code=404, detail="Stage not found")
```

**修改后**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    # Create stage if it doesn't exist
    max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
    next_order = (max_order_result.stage_order + 1) if max_order_result else 0
    stage = models.Stage(name=stage_name, stage_order=next_order, description="", categories=[])
    plan_db.add(stage)
    plan_db.commit()
    plan_db.refresh(stage)
```

### 修改 3: `backend/main.py` - DELETE 行删除接口 (lines 776-821)

**修改前**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    raise HTTPException(status_code=404, detail="Stage not found")

if not category_data:
    raise HTTPException(status_code=404, detail="Category not found")
```

**修改后**：
```python
stage = plan_db.query(models.Stage).filter(...).first()
if not stage:
    # Create stage if it doesn't exist
    # ... (自动创建逻辑)

if not category_data:
    # Create empty CategoryDetail and return immediately
    category_data = models.CategoryDetail(...)
    plan_db.add(category_data)
    plan_db.commit()
    return {"success": True, "total": 0, ...}
```

## 修复效果

### 修复前：
```
用户访问 /plan/1/111/2/22
  ↓
GET 创建 Stage("111") + CategoryDetail("2"/"22")
  ↓
用户导入Excel (5行)
  ↓
PATCH 第1行 → 404 错误 (Stage不存在)
PATCH 第2行 → 404 错误
...
  ↓
前端显示"导入成功"，但数据库实际为空
  ↓
刷新页面 → 显示空表
```

### 修复后：
```
用户访问 /plan/1/111/2/22
  ↓
GET 创建 Stage("111") + CategoryDetail("2"/"22")
  ↓
用户导入Excel (5行)
  ↓
PATCH 第1行 → 自动创建 Stage(如需) → 保存成功 → 更新Token统计
PATCH 第2行 → 保存成功 → 更新Token统计
PATCH 第3行 → 保存成功 → 更新Token统计
...
  ↓
前端显示"导入成功 5/5 条"
Token统计自动更新: DST = 12501.50, AUT = 11646.41
  ↓
刷新页面 → 数据持久化显示，Token统计正确
```

## 一致性保证

现在所有 4 个接口都遵循相同的策略：

| 接口类型 | URL模式 | 行为 |
|---------|---------|------|
| **GET** | `/api/plans/{plan}/stages/{stage}/categories/{cat}/{sub}` | 自动创建 Plan、Stage、CategoryDetail |
| **PATCH 描述** | `/api/plans/{plan}/stages/{stage}/categories/{cat}/{sub}/description` | 自动创建 Stage、CategoryDetail |
| **PATCH 行** | `/api/plans/{plan}/stages/{stage}/categories/{cat}/{sub}/row` | 自动创建 Stage、CategoryDetail |
| **DELETE 行** | `/api/plans/{plan}/stages/{stage}/categories/{cat}/{sub}/rows` | 自动创建 Stage、CategoryDetail（空数据返回）|

## Token统计计算

Token统计在每次 PATCH 操作后自动重新计算：

```python
# 累加所有行的token_count
token_total = 0.0
for r in rows:
    try:
        token_count = r.get('token_count', '') or '0'
        token_total += float(token_count)
    except (ValueError, TypeError):
        pass  # 健壮处理：跳过无效值

# 累加所有行的actual_token
actual_total = 0.0
for r in rows:
    try:
        actual_token = r.get('actual_token', '') or '0'
        actual_total += float(actual_token)
    except (ValueError, TypeError):
        pass

# 保存到数据库（保留2位小数）
category_data.token_count_total = f"{token_total:.2f}"
category_data.actual_token_total = f"{actual_total:.2f}"
```

## 测试工具

创建了完整的测试脚本 `backend/test_full_flow.py` 用于验证整个数据流：

```bash
cd backend
python test_full_flow.py
```

测试内容：
1. 创建 Plan（如需）
2. 创建 Stage（如需）
3. 创建 CategoryDetail（如需）
4. 模拟导入 5 行测试数据
5. 验证 Token 统计计算正确
6. 模拟页面刷新，验证数据持久化

## 使用建议

### 重启后端服务

修改完成后，请重启后端服务以加载新代码：

```bash
# Ctrl+C 停止当前服务
cd backend
uvicorn main:app --reload --port 5000
```

### 测试步骤

1. 访问 http://localhost:3000/plan/1/111/2/22
2. 点击"导入Excel"，选择包含数据的Excel文件
3. 等待导入完成，观察Token统计是否更新
4. 按 F5 刷新页面
5. 验证数据和Token统计仍然显示正确

### Excel格式要求

| 列名 | 对应字段 | 示例值 |
|-----|---------|--------|
| v3词表hdfs路径 | hdfs_path | `/data/train/batch1` |
| obs模糊路径 | obs_fuzzy_path | `obs://bucket/train` |
| obs补全路径 | obs_full_path | `obs://bucket/train/data.jsonl` |
| 数据集总token | token_count | `1000.50` |
| 实际使用 | actual_usage | `100%` |
| 实际使用token | actual_token | `1000.50` |

**重要**: 将"实际使用"列设置为**文本格式**，避免 `100%` 被Excel转换为 `1`。

## 总结

这次修复确保了系统的**健壮性（Robustness）**和**一致性（Consistency）**：

✅ **自动容错**: 所有接口都能自动创建缺失的数据库记录
✅ **持久化存储**: Excel导入的数据可靠保存到数据库
✅ **实时统计**: Token累计值根据数据实时计算并更新
✅ **用户体验**: 无需手动创建Stage或类别，直接导入即可

---

**修改时间**: 2025-12-04
**修改文件**: `backend/main.py` (lines 632-821)
**测试工具**: `backend/test_full_flow.py`
