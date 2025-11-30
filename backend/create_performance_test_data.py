"""
创建大量测试数据以验证网站性能
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

def create_performance_test_data():
    db = SessionLocal()

    try:
        # 检查TEST_PERFORMANCE计划是否已存在
        test_plan = db.query(models.Plan).filter(models.Plan.name == "TEST_PERFORMANCE").first()
        if test_plan:
            print("TEST_PERFORMANCE计划已存在，先删除...")
            db.delete(test_plan)
            db.commit()

        # 创建测试计划
        test_plan = models.Plan(
            name="TEST_PERFORMANCE",
            description="性能测试计划 - 包含大量数据"
        )
        db.add(test_plan)
        db.commit()
        db.refresh(test_plan)
        print(f"创建测试计划: TEST_PERFORMANCE")

        # 创建5个stages
        stages_data = []
        for i in range(1, 6):
            stage = models.Stage(
                name=f"perf_stage_{i}",
                plan_id=test_plan.id,
                description=f"性能测试阶段{i}",
                categories=[],
                stage_order=i-1
            )
            db.add(stage)
            db.commit()
            db.refresh(stage)
            stages_data.append(stage)
            print(f"  创建Stage: perf_stage_{i}")

        # 为每个stage创建大量类别和数据
        print("\n开始创建类别和数据...")

        for stage in stages_data:
            print(f"\n处理Stage: {stage.name}")

            # 每个stage创建15个一级类别
            categories = []
            for cat_idx in range(1, 16):
                category = {
                    'id': cat_idx * 1000 + stage.id,
                    'name': f"类别{cat_idx}",
                    'subcategories': []
                }

                # 每个一级类别创建8个二级类别
                for sub_idx in range(1, 9):
                    subcategory = {
                        'id': cat_idx * 1000 + sub_idx * 10 + stage.id,
                        'name': f"子类别{sub_idx}"
                    }
                    category['subcategories'].append(subcategory)

                    # 为每个二级类别创建数据详情
                    category_detail = models.CategoryDetail(
                        stage_id=stage.id,
                        category_name=category['name'],
                        subcategory_name=subcategory['name'],
                        description=f"{stage.name}/{category['name']}/{subcategory['name']} 的数据",
                        token_count_total=str(round(10.5 + cat_idx * 0.5 + sub_idx * 0.1, 2)),
                        actual_token_total=str(round(100.5 + cat_idx * 5 + sub_idx * 1.5, 2))
                    )

                    # 为每个CategoryDetail添加50行数据
                    rows_data = []
                    for row_idx in range(50):
                        rows_data.append({
                            'key': row_idx,
                            'dataset_path': f'/data/dataset_{cat_idx}_{sub_idx}_{row_idx}.txt',
                            'token_count': f'{(row_idx + 1) * 1000}',
                            'actual_token': f'{(row_idx + 1) * 10000}',
                            'sampling_ratio': f'{(row_idx % 10) * 10}%',
                            'note': f'测试数据行 {row_idx + 1}'
                        })

                    category_detail.rows = rows_data
                    db.add(category_detail)

                categories.append(category)

                if cat_idx % 5 == 0:
                    print(f"  已创建 {cat_idx}/15 个类别...")

            # 保存categories到stage
            stage.categories = categories
            db.commit()

        print("\n性能测试数据创建完成")
        print(f"  - 计划: 1 个")
        print(f"  - Stages: 5 个")
        print(f"  - 一级类别: 75 个 (每个stage 15个)")
        print(f"  - 二级类别: 600 个 (每个一级类别 8个)")
        print(f"  - CategoryDetail记录: 600 个")
        print(f"  - 数据行: 30,000 行 (每个二级类别 50行)")

    except Exception as e:
        print(f"创建失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_performance_test_data()
