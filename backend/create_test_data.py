"""
自动化测试脚本 - 创建测试数据
这个脚本会创建一个完整的测试计划，包含多个stage、类别和数据
"""

import sys
sys.path.append('.')

from database import SessionLocal, engine
import models
from auth import get_password_hash

def create_test_data():
    db = SessionLocal()

    try:
        print("开始创建测试数据...")

        # 1. 创建测试用户（如果不存在）
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_admin=True
            )
            db.add(admin)
            db.commit()
            print("创建管理员用户完成")

        # 2. 创建测试训练计划
        test_plan = db.query(models.Plan).filter(models.Plan.name == "TEST").first()
        if test_plan:
            print("测试计划已存在，删除旧数据...")
            db.delete(test_plan)
            db.commit()

        test_plan = models.Plan(name="TEST", description="自动化测试训练计划\n包含完整的测试数据结构")
        db.add(test_plan)
        db.commit()
        db.refresh(test_plan)
        print(f"创建测试计划: TEST")

        # 3. 创建3个stages
        stages_data = []
        for i in range(1, 4):
            stage = models.Stage(
                name=f"test_stage_{i}",
                plan_id=test_plan.id,
                description=f"测试阶段{i} - 包含模拟训练数据",
                categories=[],
                merges=[]
            )
            db.add(stage)
            db.commit()
            db.refresh(stage)
            stages_data.append(stage)
            print(f"✓ 创建Stage: test_stage_{i}")

            # 为每个stage添加表格数据
            for row_idx in range(5):
                table_row = models.TableRow(
                    stage_id=stage.id,
                    row_order=row_idx,
                    category=f"类别{(row_idx % 3) + 1}",
                    subcategory=f"子类别{row_idx + 1}",
                    total_tokens=str(100 + row_idx * 50),
                    sample_ratio=str(0.1 + row_idx * 0.05),
                    cumulative_ratio=str(0.1 * (row_idx + 1)),
                    sample_tokens=str(10 + row_idx * 5),
                    category_ratio=str(0.2 + row_idx * 0.1),
                    part1=f"Part1_S{i}_R{row_idx}",
                    part2=f"Part2_S{i}_R{row_idx}",
                    part3=f"Part3_S{i}_R{row_idx}",
                    part4=f"Part4_S{i}_R{row_idx}",
                    part5=f"Part5_S{i}_R{row_idx}",
                    note=f"测试备注 Stage{i} Row{row_idx}"
                )
                db.add(table_row)
            db.commit()
            print(f"  ✓ 添加{5}行表格数据")

        # 4. 为每个stage创建类别和数据
        categories_names = [
            ("英文网页", ["自然网页", "科学文献", "技术文档"]),
            ("中文网页", ["新闻资讯", "百科知识", "社交媒体"]),
            ("代码数据", ["Python代码", "Java代码", "JavaScript代码"]),
            ("对话数据", ["客服对话", "教学对话", "闲聊对话"])
        ]

        for stage_idx, stage in enumerate(stages_data):
            # 保存类别结构到stage.categories
            stage_categories = []

            for cat_idx, (category_name, subcategories) in enumerate(categories_names):
                category_dict = {
                    'id': 1000 + stage_idx * 10 + cat_idx,
                    'name': category_name,
                    'subcategories': []
                }

                for sub_idx, subcategory_name in enumerate(subcategories):
                    subcategory_dict = {
                        'id': 2000 + stage_idx * 100 + cat_idx * 10 + sub_idx,
                        'name': subcategory_name
                    }
                    category_dict['subcategories'].append(subcategory_dict)

                    # 创建CategoryDetail数据
                    dataset_rows = []
                    for data_idx in range(8):  # 每个子类别8条数据
                        dataset_row = {
                            'key': 3000 + stage_idx * 1000 + cat_idx * 100 + sub_idx * 10 + data_idx,
                            'hdfs_path': f'/data/{category_name}/{subcategory_name}/dataset_{data_idx}.parquet',
                            'obs_fuzzy_path': f's3://bucket/{category_name}/{subcategory_name}/fuzzy_{data_idx}/',
                            'obs_full_path': f's3://bucket/{category_name}/{subcategory_name}/full_{data_idx}.parquet',
                            'token_count': str(1000 + data_idx * 500 + stage_idx * 100),
                            'actual_usage': str(0.6 + data_idx * 0.05),
                            'actual_token': str((1000 + data_idx * 500 + stage_idx * 100) * (0.6 + data_idx * 0.05))
                        }
                        dataset_rows.append(dataset_row)

                    # 计算总token
                    total_token_count = sum(float(row['token_count']) for row in dataset_rows)
                    total_actual_token = sum(float(row['actual_token']) for row in dataset_rows)

                    category_detail = models.CategoryDetail(
                        stage_id=stage.id,
                        category_name=category_name,
                        subcategory_name=subcategory_name,
                        description=f"{category_name} - {subcategory_name} 测试数据\n包含{len(dataset_rows)}个数据集",
                        rows=dataset_rows,
                        token_count_total=str(round(total_token_count, 2)),
                        actual_token_total=str(round(total_actual_token, 2))
                    )
                    db.add(category_detail)

                stage_categories.append(category_dict)

            # 更新stage的categories字段
            stage.categories = stage_categories
            db.commit()
            print(f"  ✓ Stage {stage.name}: 创建{len(categories_names)}个一级类别, {sum(len(c[1]) for c in categories_names)}个二级类别")

        print("\n" + "="*50)
        print("测试数据创建完成！")
        print("="*50)
        print(f"训练计划: TEST")
        print(f"Stages数量: 3 (test_stage_1, test_stage_2, test_stage_3)")
        print(f"一级类别数量: {len(categories_names)}")
        print(f"二级类别数量: {sum(len(c[1]) for c in categories_names)}")
        print(f"总数据条目: {3 * len(categories_names) * sum(len(c[1]) for c in categories_names) * 8}")
        print("\n登录信息:")
        print("  用户名: admin")
        print("  密码: admin123")
        print("="*50)

    except Exception as e:
        print(f"错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    # 确保表已创建
    models.Base.metadata.create_all(bind=engine)

    # 创建测试数据
    create_test_data()
