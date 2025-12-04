# -*- coding: utf-8 -*-
"""
数据库检查脚本 - 用于诊断登录问题
"""
from database import get_main_db
import models
from auth import verify_password

db_gen = get_main_db()
db = next(db_gen)

try:
    # 检查用户表
    users = db.query(models.User).all()

    if len(users) == 0:
        print("❌ 数据库中没有用户！")
        print("   请运行: python init_db.py")
    else:
        print(f"✅ 数据库中有 {len(users)} 个用户:\n")
        for user in users:
            print(f"   用户名: {user.username}")
            print(f"   管理员: {'是' if user.is_admin else '否'}")
            print(f"   密码哈希: {user.hashed_password[:50]}...")

            # 测试密码验证
            if user.username == "admin":
                test_result = verify_password("admin123", user.hashed_password)
                print(f"   测试密码 'admin123': {'✅ 正确' if test_result else '❌ 错误'}")
            elif user.username == "user":
                test_result = verify_password("user123", user.hashed_password)
                print(f"   测试密码 'user123': {'✅ 正确' if test_result else '❌ 错误'}")
            print()

except Exception as e:
    print(f"❌ 错误: {e}")
finally:
    db.close()
