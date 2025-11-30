"""
创建超大规模测试数据
4个计划 × 10个stage × 15个一级类别 × 10个二级类别 × 1000条数据 = 600万条数据记录
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

def create_massive_test_data():
    db = SessionLocal()

    try:
        # 创建4个训练计划
        plan_names = ["MEGA_PLAN_A", "MEGA_PLAN_B", "MEGA_PLAN_C", "MEGA_PLAN_D"]

        for plan_idx, plan_name in enumerate(plan_names):
            print(f"\n{'='*60}")
            print(f"开始创建计划 {plan_idx + 1}/4: {plan_name}")
            print(f"{'='*60}")

            # 删除已存在的计划
            existing_plan = db.query(models.Plan).filter(models.Plan.name == plan_name).first()
            if existing_plan:
                print(f"  删除已存在的计划: {plan_name}")
                db.delete(existing_plan)
                db.commit()

            # 创建新计划
            plan = models.Plan(
                name=plan_name,
                description=f"超大规模测试计划 {chr(65 + plan_idx)} - 10个stage × 150个类别 × 1000条数据/类别"
            )
            db.add(plan)
            db.commit()
            db.refresh(plan)

            # 为每个计划创建10个stages
            for stage_idx in range(1, 11):
                stage_name = f"stage_{stage_idx:02d}"
                print(f"\n  [{stage_idx}/10] 创建Stage: {stage_name}")

                stage = models.Stage(
                    name=stage_name,
                    plan_id=plan.id,
                    description=f"{plan_name} 的第 {stage_idx} 个阶段",
                    categories=[],
                    stage_order=stage_idx - 1
                )
                db.add(stage)
                db.commit()
                db.refresh(stage)

                # 为每个stage创建15个一级类别
                categories = []
                category_count = 0

                for cat_idx in range(1, 16):
                    category = {
                        'id': stage.id * 10000 + cat_idx * 100,
                        'name': f"一级类别{cat_idx:02d}_{chr(65 + (cat_idx - 1) % 26)}",
                        'subcategories': []
                    }

                    # 每个一级类别创建10个二级类别
                    for sub_idx in range(1, 11):
                        subcategory = {
                            'id': stage.id * 10000 + cat_idx * 100 + sub_idx,
                            'name': f"二级类别{sub_idx:02d}_{chr(97 + (sub_idx - 1) % 26)}"
                        }
                        category['subcategories'].append(subcategory)

                        # 为每个二级类别创建详细数据（1000条记录）
                        # 生成唯一的token值，确保每个stage的数据不同
                        base_token = (plan_idx + 1) * 1000 + stage_idx * 100 + cat_idx * 10 + sub_idx

                        rows_data = []
                        for row_idx in range(1000):
                            rows_data.append({
                                'key': row_idx,
                                'dataset_path': f'/data/{plan_name.lower()}/{stage_name}/cat{cat_idx:02d}_sub{sub_idx:02d}/dataset_{row_idx:04d}.jsonl',
                                'token_count': str(base_token + row_idx * 10),
                                'actual_token': str((base_token + row_idx * 10) * 10),
                                'sampling_ratio': f'{((row_idx % 100) / 100 * 100):.1f}%',
                                'category': f"类别{cat_idx:02d}",
                                'subcategory': f"子类{sub_idx:02d}",
                                'dataset_size': f'{(row_idx + 1) * 1024} MB',
                                'status': 'completed' if row_idx % 10 != 0 else 'processing',
                                'note': f'{plan_name}-{stage_name}-数据行{row_idx + 1}'
                            })

                        # 计算统计信息
                        total_token = sum(int(row['token_count']) for row in rows_data)
                        total_actual = sum(int(row['actual_token']) for row in rows_data)

                        category_detail = models.CategoryDetail(
                            stage_id=stage.id,
                            category_name=category['name'],
                            subcategory_name=subcategory['name'],
                            description=f"{plan_name}/{stage_name}/{category['name']}/{subcategory['name']} 的完整数据集",
                            token_count_total=str(round(total_token / 1_000_000_000, 2)),  # 转换为T
                            actual_token_total=str(round(total_actual / 1_000_000_000, 2)),
                            rows=rows_data
                        )
                        db.add(category_detail)
                        category_count += 1

                    categories.append(category)

                    # 每处理5个类别提交一次，避免内存占用过大
                    if cat_idx % 5 == 0:
                        db.commit()
                        print(f"    进度: {cat_idx}/15 个一级类别 ({category_count} 个二级类别，{category_count * 1000} 条数据)")

                # 保存categories结构到stage
                stage.categories = categories
                db.commit()
                print(f"    完成: 15个一级类别，150个二级类别，150,000条数据")

            print(f"\n  计划 {plan_name} 创建完成!")
            print(f"    - Stages: 10")
            print(f"    - 一级类别: 150")
            print(f"    - 二级类别: 1,500")
            print(f"    - 数据记录: 1,500,000 条")

        print(f"\n{'='*60}")
        print("全部测试数据创建完成")
        print(f"{'='*60}")
        print(f"总计:")
        print(f"  - 训练计划: 4 个")
        print(f"  - Stages: 40 个 (每个计划 10个)")
        print(f"  - 一级类别: 600 个 (每个stage 15个)")
        print(f"  - 二级类别: 6,000 个 (每个一级类别 10个)")
        print(f"  - CategoryDetail记录: 6,000 个")
        print(f"  - 数据记录: 6,000,000 条 (每个二级类别 1000条)")
        print(f"\n数据库大小预计: 约 1-2 GB")

    except Exception as e:
        print(f"\n创建失败: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("开始创建超大规模测试数据...")
    print("预计创建: 4个计划 × 10个stage × 150个类别 × 1000条数据 = 600万条记录")
    print("预计时间: 10-30分钟")
    print("数据库大小: 约 1-2 GB\n")
    create_massive_test_data()
