# 测试数据导入脚本
import sys
sys.path.insert(0, '.')

from database import get_plan_session
import models

def test_import(plan_name, stage_name, category_name, subcategory_name):
    print(f"\n=== 测试导入到 {plan_name}/{stage_name}/{category_name}/{subcategory_name} ===\n")

    plan_db = get_plan_session(plan_name.upper())
    try:
        # 1. 检查/创建 Stage
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
        if not stage:
            print(f"创建新 Stage: {stage_name}")
            stage = models.Stage(name=stage_name, stage_order=0)
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)
        else:
            print(f"✅ Stage 已存在: {stage_name} (ID: {stage.id})")

        # 2. 检查/创建 CategoryDetail
        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            print(f"创建新 CategoryDetail: {category_name}/{subcategory_name}")
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="",
                token_count_total="0",
                actual_token_total="0"
            )
            plan_db.add(category_data)
            plan_db.commit()
            plan_db.refresh(category_data)
            print(f"✅ CategoryDetail 创建成功 (ID: {category_data.id})")
        else:
            print(f"✅ CategoryDetail 已存在 (ID: {category_data.id})")
            print(f"   当前行数: {len(category_data.rows)}")
            print(f"   Token总计: {category_data.token_count_total}")
            print(f"   实际Token: {category_data.actual_token_total}")

        # 3. 添加测试数据
        print("\n添加测试数据...")
        test_rows = [
            {
                'key': 1,
                'hdfs_path': '/test/path1',
                'obs_fuzzy_path': 'obs://test1',
                'obs_full_path': 'obs://test1/full',
                'token_count': '1000',
                'actual_usage': '80%',
                'actual_token': '800'
            },
            {
                'key': 2,
                'hdfs_path': '/test/path2',
                'obs_fuzzy_path': 'obs://test2',
                'obs_full_path': 'obs://test2/full',
                'token_count': '2000',
                'actual_usage': '90%',
                'actual_token': '1800'
            }
        ]

        category_data.rows = test_rows

        # 4. 计算Token
        token_total = sum(float(r.get('token_count', 0) or 0) for r in test_rows)
        actual_total = sum(float(r.get('actual_token', 0) or 0) for r in test_rows)
        category_data.token_count_total = f"{token_total:.2f}"
        category_data.actual_token_total = f"{actual_total:.2f}"

        plan_db.commit()

        print(f"✅ 数据保存成功！")
        print(f"   总行数: {len(test_rows)}")
        print(f"   Token总计: {category_data.token_count_total}")
        print(f"   实际Token: {category_data.actual_token_total}")

        # 5. 验证读取
        print("\n验证数据读取...")
        plan_db.refresh(category_data)
        print(f"   读取行数: {len(category_data.rows)}")
        print(f"   Token总计: {category_data.token_count_total}")
        print(f"   实际Token: {category_data.actual_token_total}")

    finally:
        plan_db.close()

if __name__ == "__main__":
    # 使用你的URL参数测试
    test_import("1", "111", "2", "22")
