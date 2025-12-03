# 测试说明

## 📋 项目文件结构（已清理）

```
1202_website/
├── test.py                    # 完整功能测试脚本
├── QUICKSTART.md              # 快速开始指南
├── ARCHITECTURE.md            # 系统架构文档
├── package.json               # 前端依赖
├── vite.config.js             # 前端配置
├── src/                       # 前端源代码
└── backend/
    ├── main.py                # API服务
    ├── database.py            # 数据库配置
    ├── models.py              # 数据模型
    ├── auth.py                # 认证模块
    ├── init_db.py             # 数据库初始化
    └── data_version.db        # 数据库文件
```

## 🧪 测试脚本

### 安装依赖
```bash
pip install playwright
playwright install chromium
```

### 运行测试
```bash
python test.py
```

## ✅ 测试内容

### 1. 权限管理 🔐
- ✅ 管理员可以创建、编辑、删除
- ✅ 普通用户只能查看

### 2. 特殊字符支持 📝
- ✅ 中文、英文、数字
- ✅ 特殊符号 @#$%^&*()
- ✅ 换行符正确显示

### 3. 层级结构 🏗️
- ✅ 创建计划
- ✅ 添加Stage
- ✅ 创建一级类别
- ✅ 创建二级类别

### 4. 数据管理 💾
- ✅ 插入数据记录
- ✅ 数据自动保存

### 5. 数据持久化 🔄
- ✅ 刷新后数据完整
- ✅ 导航后数据保留

### 6. 数据可视化 📊
- ✅ 图表正确加载
- ✅ 数据正确显示

## 🎯 功能验证

| 功能 | 状态 |
|------|------|
| 用户权限隔离 | ✅ 已验证 |
| 多语言和特殊字符 | ✅ 已测试 |
| 换行符显示 | ✅ 正常 |
| 多计划创建 | ✅ 支持 |
| 多Stage管理 | ✅ 支持 |
| 多级类别 | ✅ 支持 |
| 大量数据 | ✅ 支持 |
| 数据库保存 | ✅ 实时保存 |
| 刷新后显示 | ✅ 数据完整 |
| 并发访问 | ✅ 已测试 |
| 数据可视化 | ✅ 正常工作 |

## 📍 测试页面路径

- 首页：`http://localhost:3000/`
- 登录：`http://localhost:3000/login`
- 计划详情：`http://localhost:3000/plan/{plan_name}`
- Stage详情：`http://localhost:3000/plan/{plan_name}/{stage_name}`
- 数据表：`http://localhost:3000/plan/{plan_name}/{stage_name}/{category}/{subcategory}`
- 可视化：`http://localhost:3000/visualization`

## 🔒 测试账号

- 管理员：`admin` / `admin123`
- 普通用户：`user` / `user123`

## 💡 测试重点

### ✅ 已通过的测试
1. **权限控制**
   - 管理员登录后可以看到所有编辑按钮
   - 普通用户登录后只能查看，无编辑按钮

2. **数据完整性**
   - 所有输入支持中英文、数字、特殊符号
   - 换行符正确保存和显示
   - 刷新页面后数据完整保留

3. **功能流程**
   - 创建计划 → 添加Stage → 创建类别 → 添加数据
   - 每步都能正确保存到数据库

4. **并发场景**
   - 多个用户同时访问不冲突
   - 数据实时同步

## 🚀 快速验证

### 手动验证步骤

1. **启动服务**
```bash
# 终端1：后端
cd backend
python -m uvicorn main:app --reload --port 5000

# 终端2：前端
npm run dev
```

2. **测试管理员功能**
- 访问 http://localhost:3000
- 登录：admin / admin123
- 创建计划
- 添加Stage
- 创建类别
- 添加数据

3. **测试普通用户功能**
- 退出登录
- 登录：user / user123
- 验证只能查看，无编辑按钮

4. **测试数据持久化**
- 添加数据后刷新页面
- 验证数据完整保留

## 📝 注意事项

1. **前后端必须都启动**
   - 前端：http://localhost:3000
   - 后端：http://localhost:5000

2. **首次运行需要初始化数据库**
```bash
cd backend
python init_db.py
```

3. **测试数据**
   - 测试脚本会创建测试数据
   - 可以手动清理或重新初始化数据库

---

**测试脚本位置**: [test.py](test.py)
**快速开始指南**: [QUICKSTART.md](QUICKSTART.md)
**系统架构说明**: [ARCHITECTURE.md](ARCHITECTURE.md)
