# 快速启动指南

## 启动后端服务

打开终端1，运行：
```bash
cd backend
python main.py
```

后端会启动在: http://localhost:5000

## 启动前端服务

打开终端2，运行：
```bash
npm start
```

前端会启动在: http://localhost:3000

## 访问网站

1. 首页: http://localhost:3000
2. 登录: 用户名 `admin`, 密码 `admin`

## 测试新创建的数据

数据创建脚本正在后台运行，完成后可以访问：

### MEGA_PLAN_A (已完成)
- 计划详情: http://localhost:3000/plan/mega_plan_a
- Stage 01: http://localhost:3000/plan/mega_plan_a/stage_01
- 数据详情示例: http://localhost:3000/plan/mega_plan_a/stage_01/一级类别01_A/二级类别01_a

### MEGA_PLAN_B, C, D (正在创建中)
等待所有数据创建完成后可访问

### 数据可视化
http://localhost:3000/visualization

## 注意事项

1. 确保端口5000和3000没有被占用
2. 后端需要先启动，然后再启动前端
3. 首次访问需要登录：admin/admin
4. 数据创建完成后刷新页面即可看到新数据
