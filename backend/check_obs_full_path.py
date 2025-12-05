# -*- coding: utf-8 -*-
"""
检查数据库中是否有obs_full_path字段
"""
import sys
sys.path.insert(0, '.')

from database import get_plan_session
import models

def check_obs_full_path(plan_name, stage_name, category_name, subcategory_name):
    print(f"\n检查: {plan_name}/{stage_name}/{category_name}/{subcategory_name}")
    print("="*80)

    plan_db = get_plan_session(plan_name.upper())

    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
        if not stage:
            print(f"❌ Stage '{stage_name}' 不存在")
            return

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            print(f"❌ CategoryDetail 不存在")
            return

        rows = category_data.rows
        print(f"\n总行数: {len(rows)}")

        if len(rows) == 0:
            print("⚠️ 没有数据行")
            return

        # 检查前3行
        print(f"\n检查前 {min(3, len(rows))} 行数据:")
        print("-"*80)

        has_obs_full_path = 0
        for i, row in enumerate(rows[:3], 1):
            print(f"\n第 {i} 行:")
            print(f"  hdfs_path: {row.get('hdfs_path', 'N/A')[:50]}...")
            print(f"  obs_fuzzy_path: {row.get('obs_fuzzy_path', 'N/A')[:50]}...")

            obs_full_path = row.get('obs_full_path', '')
            if obs_full_path:
                print(f"  obs_full_path: ✅ {obs_full_path[:50]}...")
                has_obs_full_path += 1
            else:
                print(f"  obs_full_path: ❌ 空值或不存在")

            print(f"  token_count: {row.get('token_count', 'N/A')}")

        print("\n" + "="*80)
        print(f"统计: {has_obs_full_path}/{min(3, len(rows))} 行包含obs_full_path数据")

        if has_obs_full_path > 0:
            print("✅ 数据库中已有obs_full_path字段，无需修改！")
        else:
            print("⚠️ obs_full_path字段为空，可能是导入时没有包含该列")

    finally:
        plan_db.close()

if __name__ == "__main__":
    # 检查您的数据
    check_obs_full_path("1", "111", "2", "22")
