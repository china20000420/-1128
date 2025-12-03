# -*- coding: utf-8 -*-
"""
Migration script to move data from old data_version.db to new database structure:
- Users and Plans go to main.db
- Each plan's stages and data go to databases/{plan_name}.db
"""

import os
import sys
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Add parent directory to path to import models
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import models
from database import init_main_database, get_plan_engine, MainBase, PlanBase

def migrate_data():
    """Migrate data from old single database to new multi-database structure"""

    # Check if old database exists
    old_db_path = "data_version.db"
    if not os.path.exists(old_db_path):
        print("Old database (data_version.db) not found. Starting fresh.")
        return

    print("Found old database. Starting migration...")

    # Connect to old database
    old_engine = create_engine(f"sqlite:///{old_db_path}")

    # Check if old database has the old structure
    inspector = inspect(old_engine)
    if 'users' not in inspector.get_table_names():
        print("Old database doesn't have expected structure. Skipping migration.")
        return

    OldSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=old_engine)
    old_db = OldSessionLocal()

    # Create temporary Base for old database
    from sqlalchemy.ext.declarative import declarative_base
    OldBase = declarative_base()

    # Define old models (with plan_id foreign key)
    from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
    from sqlalchemy.orm import relationship
    import json

    class OldUser(OldBase):
        __tablename__ = "users"
        id = Column(Integer, primary_key=True)
        username = Column(String)
        hashed_password = Column(String)
        is_admin = Column(Boolean)

    class OldPlan(OldBase):
        __tablename__ = "plans"
        id = Column(Integer, primary_key=True)
        name = Column(String)
        description = Column(Text)

    class OldStage(OldBase):
        __tablename__ = "stages"
        id = Column(Integer, primary_key=True)
        name = Column(String)
        plan_id = Column(Integer)
        description = Column(Text)
        stage_order = Column(Integer)
        _merges = Column("merges", Text)
        _categories = Column("categories", Text)

        @property
        def merges(self):
            return json.loads(self._merges) if self._merges else []

        @property
        def categories(self):
            return json.loads(self._categories) if self._categories else []

    class OldTableRow(OldBase):
        __tablename__ = "table_rows"
        id = Column(Integer, primary_key=True)
        stage_id = Column(Integer)
        category = Column(String)
        subcategory = Column(String)
        total_tokens = Column(String)
        sample_ratio = Column(String)
        cumulative_ratio = Column(String)
        sample_tokens = Column(String)
        category_ratio = Column(String)
        part1 = Column(String)
        part2 = Column(String)
        part3 = Column(String)
        part4 = Column(String)
        part5 = Column(String)
        note = Column(String)
        row_order = Column(Integer)

    class OldCategoryDetail(OldBase):
        __tablename__ = "category_details"
        id = Column(Integer, primary_key=True)
        stage_id = Column(Integer)
        category_name = Column(String)
        subcategory_name = Column(String)
        description = Column(Text)
        _rows = Column("rows", Text)
        token_count_total = Column(String)
        actual_token_total = Column(String)

        @property
        def rows(self):
            return json.loads(self._rows) if self._rows else []

    try:
        # Initialize new main database
        init_main_database()
        main_engine = create_engine("sqlite:///main.db")
        MainSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_engine)
        main_db = MainSessionLocal()

        # Migrate users
        print("\nMigrating users...")
        old_users = old_db.query(OldUser).all()
        for old_user in old_users:
            # Check if user already exists in new database
            existing = main_db.query(models.User).filter(models.User.username == old_user.username).first()
            if not existing:
                new_user = models.User(
                    username=old_user.username,
                    hashed_password=old_user.hashed_password,
                    is_admin=old_user.is_admin
                )
                main_db.add(new_user)
                print(f"  ✓ Migrated user: {old_user.username}")
        main_db.commit()

        # Migrate plans
        print("\nMigrating plans...")
        old_plans = old_db.query(OldPlan).all()
        for old_plan in old_plans:
            # Check if plan already exists in new main database
            existing = main_db.query(models.Plan).filter(models.Plan.name == old_plan.name).first()
            if not existing:
                new_plan = models.Plan(
                    name=old_plan.name,
                    description=old_plan.description or ""
                )
                main_db.add(new_plan)
                main_db.commit()
                print(f"  ✓ Created plan: {old_plan.name}")

            # Migrate stages and data for this plan to plan-specific database
            print(f"\n  Migrating stages for plan: {old_plan.name}")
            plan_engine = get_plan_engine(old_plan.name)
            PlanSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=plan_engine)
            plan_db = PlanSessionLocal()

            try:
                # Get all stages for this plan
                old_stages = old_db.query(OldStage).filter(OldStage.plan_id == old_plan.id).order_by(OldStage.stage_order).all()
                stage_id_mapping = {}  # Map old stage IDs to new stage IDs

                for old_stage in old_stages:
                    # Check if stage already exists
                    existing_stage = plan_db.query(models.Stage).filter(models.Stage.name == old_stage.name).first()
                    if not existing_stage:
                        new_stage = models.Stage(
                            name=old_stage.name,
                            description=old_stage.description or "",
                            stage_order=old_stage.stage_order or 0
                        )
                        new_stage.merges = old_stage.merges
                        new_stage.categories = old_stage.categories
                        plan_db.add(new_stage)
                        plan_db.commit()
                        plan_db.refresh(new_stage)
                        stage_id_mapping[old_stage.id] = new_stage.id
                        print(f"    ✓ Migrated stage: {old_stage.name}")
                    else:
                        stage_id_mapping[old_stage.id] = existing_stage.id
                        print(f"    - Stage already exists: {old_stage.name}")

                # Migrate table rows
                print(f"  Migrating table rows...")
                for old_stage_id, new_stage_id in stage_id_mapping.items():
                    old_rows = old_db.query(OldTableRow).filter(OldTableRow.stage_id == old_stage_id).order_by(OldTableRow.row_order).all()
                    for old_row in old_rows:
                        new_row = models.TableRow(
                            stage_id=new_stage_id,
                            category=old_row.category or "",
                            subcategory=old_row.subcategory or "",
                            total_tokens=old_row.total_tokens or "",
                            sample_ratio=old_row.sample_ratio or "",
                            cumulative_ratio=old_row.cumulative_ratio or "",
                            sample_tokens=old_row.sample_tokens or "",
                            category_ratio=old_row.category_ratio or "",
                            part1=old_row.part1 or "",
                            part2=old_row.part2 or "",
                            part3=old_row.part3 or "",
                            part4=old_row.part4 or "",
                            part5=old_row.part5 or "",
                            note=old_row.note or "",
                            row_order=old_row.row_order or 0
                        )
                        plan_db.add(new_row)
                    print(f"    ✓ Migrated {len(old_rows)} rows for stage {old_stage_id}")

                # Migrate category details
                print(f"  Migrating category details...")
                for old_stage_id, new_stage_id in stage_id_mapping.items():
                    old_details = old_db.query(OldCategoryDetail).filter(OldCategoryDetail.stage_id == old_stage_id).all()
                    for old_detail in old_details:
                        new_detail = models.CategoryDetail(
                            stage_id=new_stage_id,
                            category_name=old_detail.category_name,
                            subcategory_name=old_detail.subcategory_name,
                            description=old_detail.description or "",
                            token_count_total=old_detail.token_count_total or "0",
                            actual_token_total=old_detail.actual_token_total or "0"
                        )
                        new_detail.rows = old_detail.rows
                        plan_db.add(new_detail)
                    print(f"    ✓ Migrated {len(old_details)} category details for stage {old_stage_id}")

                plan_db.commit()
                print(f"  ✓ Completed migration for plan: {old_plan.name}")
            finally:
                plan_db.close()

        main_db.close()
        old_db.close()

        print("\n" + "="*60)
        print("Migration completed successfully!")
        print("="*60)
        print("\nNew database structure:")
        print("  - main.db: Users and plan list")
        print("  - databases/*.db: Per-plan data")
        print("\nOld database (data_version.db) is still present for backup.")
        print("You can delete it once you verify everything works correctly.")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        old_db.close()
        raise

if __name__ == "__main__":
    migrate_data()
