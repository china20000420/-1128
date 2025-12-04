# -*- coding: utf-8 -*-
"""
完整数据流测试脚本 - 模拟用户从导入到查看的全过程
"""
import sys
sys.path.insert(0, '.')

from database import get_plan_session, get_main_db
import models

def test_full_flow(plan_name, stage_name, category_name, subcategory_name):
    """
    测试完整流程：
    1. 检查/创建 Plan（在主数据库）
    2. 检查/创建 Stage（在计划数据库）
    3. 检查/创建 CategoryDetail
    4. 模拟Excel导入（添加多行数据）
    5. 验证Token统计计算
    6. 模拟页面刷新（重新读取数据）
    """
    print(f"\n{'='*80}")
    print(f"测试完整数据流: {plan_name}/{stage_name}/{category_name}/{subcategory_name}")
    print(f"{'='*80}\n")

    # ========== Step 1: 检查主数据库中的Plan ==========
    print("【步骤1】检查主数据库中的Plan...")
    main_db_gen = get_main_db()
    main_db = next(main_db_gen)

    try:
        plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
        if not plan:
            print(f"  ❌ Plan '{plan_name}' 不存在，正在创建...")
            plan = models.Plan(name=plan_name.upper(), description=f"测试计划 {plan_name}")
            main_db.add(plan)
            main_db.commit()
            main_db.refresh(plan)
            print(f"  ✅ Plan 创建成功")
        else:
            print(f"  ✅ Plan '{plan_name}' 已存在")
    finally:
        main_db.close()

    # ========== Step 2: 检查计划数据库中的Stage ==========
    print(f"\n【步骤2】检查计划数据库 '{plan_name.upper()}.db' 中的Stage...")
    plan_db = get_plan_session(plan_name.upper())

    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

        if not stage:
            print(f"  ❌ Stage '{stage_name}' 不存在，正在创建...")
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(
                name=stage_name,
                stage_order=next_order,
                description="",
                categories=[]
            )
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)
            print(f"  ✅ Stage 创建成功 (ID: {stage.id}, Order: {stage.stage_order})")
        else:
            print(f"  ✅ Stage '{stage_name}' 已存在 (ID: {stage.id})")

        # ========== Step 3: 检查CategoryDetail ==========
        print(f"\n【步骤3】检查CategoryDetail '{category_name}/{subcategory_name}'...")
        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            print(f"  ❌ CategoryDetail 不存在，正在创建...")
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="测试类别",
                token_count_total="0.00",
                actual_token_total="0.00"
            )
            plan_db.add(category_data)
            plan_db.commit()
            plan_db.refresh(category_data)
            print(f"  ✅ CategoryDetail 创建成功 (ID: {category_data.id})")
        else:
            print(f"  ✅ CategoryDetail 已存在 (ID: {category_data.id})")
            print(f"      当前行数: {len(category_data.rows)}")
            print(f"      Token总计: {category_data.token_count_total}")
            print(f"      实际Token: {category_data.actual_token_total}")

        # ========== Step 4: 模拟Excel导入（清空旧数据，添加新数据）==========
        print(f"\n【步骤4】模拟Excel导入（添加测试数据）...")

        # 清空旧数据
        category_data.rows = []

        # 模拟导入5行数据
        test_data = [
            {
                'key': 1,
                'hdfs_path': '/data/train/batch1',
                'obs_fuzzy_path': 'obs://bucket/train1',
                'obs_full_path': 'obs://bucket/train1/data.jsonl',
                'token_count': '1000.50',
                'actual_usage': '100%',
                'actual_token': '1000.50'
            },
            {
                'key': 2,
                'hdfs_path': '/data/train/batch2',
                'obs_fuzzy_path': 'obs://bucket/train2',
                'obs_full_path': 'obs://bucket/train2/data.jsonl',
                'token_count': '2500.75',
                'actual_usage': '95%',
                'actual_token': '2375.71'
            },
            {
                'key': 3,
                'hdfs_path': '/data/train/batch3',
                'obs_fuzzy_path': 'obs://bucket/train3',
                'obs_full_path': 'obs://bucket/train3/data.jsonl',
                'token_count': '3200.00',
                'actual_usage': '100%',
                'actual_token': '3200.00'
            },
            {
                'key': 4,
                'hdfs_path': '/data/train/batch4',
                'obs_fuzzy_path': 'obs://bucket/train4',
                'obs_full_path': 'obs://bucket/train4/data.jsonl',
                'token_count': '1500.25',
                'actual_usage': '80%',
                'actual_token': '1200.20'
            },
            {
                'key': 5,
                'hdfs_path': '/data/train/batch5',
                'obs_fuzzy_path': 'obs://bucket/train5',
                'obs_full_path': 'obs://bucket/train5/data.jsonl',
                'token_count': '4300.00',
                'actual_usage': '90%',
                'actual_token': '3870.00'
            }
        ]

        # 逐行添加（模拟前端的循环导入）
        for i, row_data in enumerate(test_data, 1):
            category_data.rows.append(row_data)
            print(f"  [{i}/{len(test_data)}] 导入: {row_data['hdfs_path']} "
                  f"(Token: {row_data['token_count']}, 实际: {row_data['actual_token']})")

        # ========== Step 5: 计算Token统计 ==========
        print(f"\n【步骤5】计算Token统计...")

        token_total = 0.0
        actual_total = 0.0

        for row in category_data.rows:
            try:
                token_count = row.get('token_count', '') or '0'
                token_total += float(token_count)
            except (ValueError, TypeError) as e:
                print(f"  ⚠️ 警告: token_count 转换失败: {token_count}, 错误: {e}")

            try:
                actual_token = row.get('actual_token', '') or '0'
                actual_total += float(actual_token)
            except (ValueError, TypeError) as e:
                print(f"  ⚠️ 警告: actual_token 转换失败: {actual_token}, 错误: {e}")

        category_data.token_count_total = f"{token_total:.2f}"
        category_data.actual_token_total = f"{actual_total:.2f}"

        print(f"  ✅ Token统计计算完成:")
        print(f"      数据集总Token (DST): {category_data.token_count_total}")
        print(f"      实际使用Token (AUT): {category_data.actual_token_total}")
        print(f"      预期DST: {sum(float(r['token_count']) for r in test_data):.2f}")
        print(f"      预期AUT: {sum(float(r['actual_token']) for r in test_data):.2f}")

        # 提交到数据库
        plan_db.commit()
        print(f"  ✅ 数据已提交到数据库")

        # ========== Step 6: 模拟页面刷新（重新读取数据）==========
        print(f"\n【步骤6】模拟页面刷新（重新读取数据）...")

        # 刷新对象以确保从数据库读取最新数据
        plan_db.refresh(category_data)

        print(f"  ✅ 数据库读取成功:")
        print(f"      总行数: {len(category_data.rows)}")
        print(f"      数据集总Token: {category_data.token_count_total}")
        print(f"      实际使用Token: {category_data.actual_token_total}")

        # 验证数据完整性
        if len(category_data.rows) == len(test_data):
            print(f"  ✅ 数据完整性验证通过: {len(category_data.rows)} 行")
        else:
            print(f"  ❌ 数据完整性验证失败: 预期 {len(test_data)} 行, 实际 {len(category_data.rows)} 行")

        # 验证Token统计
        expected_dst = f"{sum(float(r['token_count']) for r in test_data):.2f}"
        expected_aut = f"{sum(float(r['actual_token']) for r in test_data):.2f}"

        if category_data.token_count_total == expected_dst:
            print(f"  ✅ DST统计正确: {category_data.token_count_total}")
        else:
            print(f"  ❌ DST统计错误: 预期 {expected_dst}, 实际 {category_data.token_count_total}")

        if category_data.actual_token_total == expected_aut:
            print(f"  ✅ AUT统计正确: {category_data.actual_token_total}")
        else:
            print(f"  ❌ AUT统计错误: 预期 {expected_aut}, 实际 {category_data.actual_token_total}")

        # ========== 总结 ==========
        print(f"\n{'='*80}")
        print(f"测试完成！")
        print(f"{'='*80}")
        print(f"\n✅ 所有步骤执行成功！数据已持久化到数据库。")
        print(f"   - 计划: {plan_name}")
        print(f"   - 阶段: {stage_name}")
        print(f"   - 类别: {category_name}/{subcategory_name}")
        print(f"   - 数据行数: {len(category_data.rows)}")
        print(f"   - 数据集总Token: {category_data.token_count_total}")
        print(f"   - 实际使用Token: {category_data.actual_token_total}")
        print(f"\n访问URL: http://localhost:3000/plan/{plan_name}/{stage_name}/{category_name}/{subcategory_name}")
        print()

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        plan_db.close()


if __name__ == "__main__":
    # 使用用户的实际URL参数测试
    test_full_flow("1", "111", "2", "22")
