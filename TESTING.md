# 自动化测试指南

本文档说明如何使用Playwright MCP进行自动化测试。

## 准备工作

### 1. 创建测试数据

```bash
# 激活conda环境
conda activate fastapi

# 进入backend目录
cd backend

# 运行测试数据创建脚本
python create_test_data.py
```

这将创建：
- **1个测试计划**: TEST训练计划
- **3个Stages**: test_stage_1, test_stage_2, test_stage_3
- **4个一级类别**: 英文网页、中文网页、代码数据、对话数据
- **12个二级类别**: 每个一级类别下3个子类别
- **288条数据记录**: 每个子类别8条数据 × 3个stage

### 2. 启动服务

**启动后端（终端1）**:
```bash
conda activate fastapi
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

**启动前端（终端2）**:
```bash
npm run dev
```

等待服务完全启动（前端：http://localhost:3000，后端：http://localhost:5000）

## 自动化测试流程

使用Playwright MCP工具可以测试以下功能：

### 测试1: 登录功能

1. 访问 http://localhost:3000
2. 应该自动跳转到登录页 http://localhost:3000/login
3. 输入用户名：admin
4. 输入密码：admin123
5. 点击登录按钮
6. 验证跳转到首页

### 测试2: 查看训练计划列表

1. 在首页查看计划卡片
2. 应该能看到 "TEST 训练计划" 卡片
3. 验证显示的stage数量为3

### 测试3: 进入计划概览

1. 点击 "TEST 训练计划" 卡片
2. 跳转到 /plan/test
3. 验证页面标题显示 "TEST 训练计划"
4. 验证显示3个stage表格

### 测试4: 查看Stage详情

1. 点击某个stage的"查看详情"按钮
2. 跳转到 /plan/test/test_stage_1
3. 验证显示4个一级类别卡片
4. 验证每个类别下有子类别列表

### 测试5: 查看数据详情

1. 在stage详情页，点击某个子类别
2. 跳转到数据表页面
3. 验证表格显示8条数据记录
4. 验证Token统计信息正确显示

### 测试6: 数据可视化

1. 点击导航栏的 "数据可视化"
2. 验证显示统计卡片（阶段总数、类别总数等）
3. 验证柱状图、饼图、折线图正确渲染
4. 验证表格数据正确显示

### 测试7: 创建新Stage

1. 回到计划概览页
2. 点击 "添加Stage" 按钮
3. 输入新stage名称：test_stage_4
4. 确认创建
5. 验证新stage出现在列表中
6. 验证新stage自动复制了上一个stage的类别结构

### 测试8: Excel导入导出

1. 在计划概览页某个stage表格
2. 点击 "导出Excel" 按钮
3. 验证文件下载
4. 点击 "下载模板" 按钮
5. 验证模板下载
6. 导入Excel文件
7. 验证数据正确导入

## Playwright MCP 测试命令示例

### 示例1: 完整登录测试

```javascript
// 1. 导航到网站
await page.goto('http://localhost:3000');

// 2. 等待跳转到登录页
await page.waitForURL('**/login');

// 3. 输入用户名
await page.fill('input[placeholder="用户名"]', 'admin');

// 4. 输入密码
await page.fill('input[placeholder="密码"]', 'admin123');

// 5. 点击登录按钮
await page.click('button:has-text("登录")');

// 6. 等待跳转到首页
await page.waitForURL('http://localhost:3000/');

// 7. 验证登录成功（应该能看到"管理员"标识）
await page.waitForSelector('text=管理员');
```

### 示例2: 测试计划列表

```javascript
// 1. 等待计划卡片加载
await page.waitForSelector('.ant-card');

// 2. 验证TEST计划存在
const testCard = await page.locator('text=TEST 训练计划');
await expect(testCard).toBeVisible();

// 3. 点击计划卡片
await testCard.click();

// 4. 验证跳转到计划详情页
await page.waitForURL('**/plan/test');
```

### 示例3: 测试数据可视化

```javascript
// 1. 点击数据可视化菜单
await page.click('text=数据可视化');

// 2. 等待页面加载
await page.waitForURL('**/visualization');

// 3. 验证统计卡片显示
await page.waitForSelector('.ant-statistic');

// 4. 验证图表渲染
await page.waitForSelector('.recharts-wrapper');

// 5. 验证表格显示
await page.waitForSelector('.ant-table');
```

## 预期结果

所有测试应该能够成功执行，验证：

✅ 用户登录功能正常
✅ 训练计划列表正确显示
✅ 计划详情页正确显示3个stages
✅ Stage详情显示4个类别和12个子类别
✅ 数据表显示8条记录
✅ Token统计信息正确
✅ 数据可视化图表正确渲染
✅ Stage创建和类别复制功能正常
✅ Excel导入导出功能正常

## 测试数据结构

```
TEST训练计划
├── test_stage_1
│   ├── 英文网页
│   │   ├── 自然网页 (8条数据)
│   │   ├── 科学文献 (8条数据)
│   │   └── 技术文档 (8条数据)
│   ├── 中文网页
│   │   ├── 新闻资讯 (8条数据)
│   │   ├── 百科知识 (8条数据)
│   │   └── 社交媒体 (8条数据)
│   ├── 代码数据
│   │   ├── Python代码 (8条数据)
│   │   ├── Java代码 (8条数据)
│   │   └── JavaScript代码 (8条数据)
│   └── 对话数据
│       ├── 客服对话 (8条数据)
│       ├── 教学对话 (8条数据)
│       └── 闲聊对话 (8条数据)
├── test_stage_2 (相同结构)
└── test_stage_3 (相同结构)
```

## 清理测试数据

如果需要清理测试数据：

```python
# backend目录下
python -c "from database import SessionLocal; import models; db = SessionLocal(); plan = db.query(models.Plan).filter(models.Plan.name == 'TEST').first(); db.delete(plan) if plan else None; db.commit()"
```

或直接删除数据库重新初始化：
```bash
cd backend
del data_version.db  # Windows
rm data_version.db   # Linux/Mac
python init_db.py
```

## 注意事项

1. **确保服务已启动**: 测试前确认前后端服务都在运行
2. **数据库状态**: 运行测试前先创建测试数据
3. **浏览器兼容性**: Playwright支持Chromium、Firefox、WebKit
4. **等待元素加载**: 使用适当的等待策略避免测试失败
5. **清理状态**: 每次测试前确保数据库处于预期状态

## 扩展测试

可以添加更多测试场景：

- 测试表格编辑功能（双击单元格编辑）
- 测试单元格合并功能
- 测试数据删除功能
- 测试权限控制（普通用户vs管理员）
- 测试分页和排序
- 测试搜索和过滤
- 测试响应式布局（不同屏幕尺寸）
- 性能测试（大量数据加载时间）

---

**测试环境准备完成后，即可开始自动化测试！**
