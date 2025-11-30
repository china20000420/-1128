"""
迁移脚本：为Stage表添加stage_order字段
"""
from database import engine
from sqlalchemy import text

def migrate():
    with engine.begin() as conn:  # 使用begin()来自动管理事务
        try:
            # 检查列是否已存在
            result = conn.execute(text("PRAGMA table_info(stages)"))
            columns = [row[1] for row in result]

            if 'stage_order' not in columns:
                print("添加stage_order列...")
                conn.execute(text("ALTER TABLE stages ADD COLUMN stage_order INTEGER DEFAULT 0"))

                # 为现有数据设置顺序（按id排序）
                print("更新现有数据的顺序...")
                result = conn.execute(text("SELECT id, plan_id FROM stages ORDER BY id"))
                stages = result.fetchall()

                # 按plan_id分组
                plan_stages = {}
                for stage_id, plan_id in stages:
                    if plan_id not in plan_stages:
                        plan_stages[plan_id] = []
                    plan_stages[plan_id].append(stage_id)

                # 为每个plan的stages设置顺序
                for plan_id, stage_ids in plan_stages.items():
                    for order, stage_id in enumerate(stage_ids):
                        conn.execute(
                            text("UPDATE stages SET stage_order = :order WHERE id = :id"),
                            {"order": order, "id": stage_id}
                        )

                print("迁移完成")
            else:
                print("stage_order列已存在，无需迁移")

        except Exception as e:
            print(f"迁移失败: {e}")
            raise

if __name__ == "__main__":
    migrate()
