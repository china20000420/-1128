from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
from database import get_main_db, get_plan_engine, delete_plan_database, init_main_database
from sqlalchemy.orm import sessionmaker
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin

# Initialize main database
init_main_database()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class PlanCreate(BaseModel):
    name: str
    description: str = ""

class PlanUpdate(BaseModel):
    description: str

class StageCreate(BaseModel):
    name: str

class RowCreate(BaseModel):
    category: str = ""
    subcategory: str = ""
    total_tokens: str = ""
    sample_ratio: str = ""
    cumulative_ratio: str = ""
    sample_tokens: str = ""
    category_ratio: str = ""
    part1: str = ""
    part2: str = ""
    part3: str = ""
    part4: str = ""
    part5: str = ""
    note: str = ""

class RowUpdate(BaseModel):
    category: str = None
    subcategory: str = None
    total_tokens: str = None
    sample_ratio: str = None
    cumulative_ratio: str = None
    sample_tokens: str = None
    category_ratio: str = None
    part1: str = None
    part2: str = None
    part3: str = None
    part4: str = None
    part5: str = None
    note: str = None

class BulkDataImport(BaseModel):
    rows: List[dict]
    merges: List[dict]

class Plan72BData(BaseModel):
    description: str
    stages: dict

class CategoryData(BaseModel):
    description: str
    categories: list

class CategoryDetailData(BaseModel):
    description: str
    rows: list
    tokenCountTotal: Optional[str] = "0"
    actualTokenTotal: Optional[str] = "0"

class RowUpdateData(BaseModel):
    key: int
    hdfs_path: Optional[str] = ""
    obs_fuzzy_path: Optional[str] = ""
    obs_full_path: Optional[str] = ""
    token_count: Optional[str] = ""
    actual_usage: Optional[str] = ""
    actual_token: Optional[str] = ""

class RowDeleteData(BaseModel):
    keys: list[int]


# Helper function to get plan database session
def get_plan_session(plan_name: str):
    """Get a database session for a specific plan"""
    engine = get_plan_engine(plan_name.upper())
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        return db
    finally:
        pass


# ==================== Authentication Endpoints ====================

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_main_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "is_admin": db_user.is_admin}

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_main_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    db_user = models.User(username=user.username, hashed_password=get_password_hash(user.password), is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    return {"success": True}

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "is_admin": current_user.is_admin}


# ==================== Plan Endpoints ====================

@app.get("/api/plans")
def get_plans(db: Session = Depends(get_main_db)):
    plans = db.query(models.Plan).all()
    result = []
    for p in plans:
        # Get stage count from plan-specific database
        plan_db = get_plan_session(p.name)
        try:
            stage_count = plan_db.query(models.Stage).count()
        finally:
            plan_db.close()

        result.append({
            "key": p.name.lower(),
            "name": p.name + " 训练计划",
            "description": p.description or "",
            "stage_count": stage_count
        })
    return {"plans": result}

@app.post("/api/plans")
def create_plan(plan: PlanCreate, admin: models.User = Depends(require_admin), db: Session = Depends(get_main_db)):
    # Check if plan already exists
    existing = db.query(models.Plan).filter(models.Plan.name == plan.name.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan already exists")

    db_plan = models.Plan(name=plan.name.upper(), description=plan.description)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    # Initialize plan-specific database (empty - no auto-created stages)
    _ = get_plan_engine(db_plan.name)

    return {"key": db_plan.name.lower(), "name": db_plan.name + " 训练计划", "description": db_plan.description, "stage_count": 0}

@app.put("/api/plans/{plan_name}")
def update_plan(plan_name: str, plan: PlanUpdate, admin: models.User = Depends(require_admin), db: Session = Depends(get_main_db)):
    db_plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db_plan.description = plan.description
    db.commit()
    return {"success": True}

@app.delete("/api/plans/{plan_name}")
def delete_plan(plan_name: str, admin: models.User = Depends(require_admin), db: Session = Depends(get_main_db)):
    db_plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Delete from main database
    db.delete(db_plan)
    db.commit()

    # Delete plan-specific database file
    delete_plan_database(plan_name.upper())

    return {"success": True}


# ==================== Plan Data Endpoints ====================

@app.get("/api/plan{plan_name}")
def get_plan(plan_name: str, main_db: Session = Depends(get_main_db)):
    # Get or create plan in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    # Get plan-specific database
    plan_db = get_plan_session(plan_name.upper())
    try:
        # Load all stages from plan database, sorted by stage_order
        stages = plan_db.query(models.Stage).order_by(models.Stage.stage_order, models.Stage.id).all()

        stages_data = {}
        for stage in stages:
            rows = plan_db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).order_by(models.TableRow.row_order).all()
            stages_data[stage.name] = {
                "rows": [{
                    "key": r.id,
                    "category": r.category,
                    "subcategory": r.subcategory,
                    "total_tokens": r.total_tokens,
                    "sample_ratio": r.sample_ratio,
                    "cumulative_ratio": r.cumulative_ratio,
                    "sample_tokens": r.sample_tokens,
                    "category_ratio": r.category_ratio,
                    "part1": r.part1,
                    "part2": r.part2,
                    "part3": r.part3,
                    "part4": r.part4,
                    "part5": r.part5,
                    "note": r.note
                } for r in rows],
                "merges": stage.merges if stage.merges else []
            }

        return {"description": plan.description, "stages": stages_data}
    finally:
        plan_db.close()

@app.post("/api/plan{plan_name}")
def save_plan(plan_name: str, data: Plan72BData, admin: models.User = Depends(require_admin), main_db: Session = Depends(get_main_db)):
    # Get or create plan in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper())
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    plan.description = data.description
    main_db.commit()

    # Get plan-specific database
    plan_db = get_plan_session(plan_name.upper())
    try:
        # Get existing stages from plan database
        existing_stages = plan_db.query(models.Stage).all()
        existing_stage_names = {stage.name for stage in existing_stages}
        incoming_stage_names = set(data.stages.keys())

        # Delete stages that are no longer in the incoming data
        stages_to_delete = existing_stage_names - incoming_stage_names
        for stage_name in stages_to_delete:
            stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
            if stage:
                # Delete related data first (cascade delete should handle this, but being explicit)
                plan_db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).delete()
                plan_db.query(models.CategoryDetail).filter(models.CategoryDetail.stage_id == stage.id).delete()
                plan_db.delete(stage)

        # Add or update stages
        for order, (stage_name, stage_data) in enumerate(data.stages.items()):
            stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

            if not stage:
                # Create new stage with proper order
                max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
                next_order = (max_order_result.stage_order + 1) if max_order_result else 0

                stage = models.Stage(
                    name=stage_name,
                    description="",
                    categories=[],
                    stage_order=next_order
                )
                plan_db.add(stage)
                plan_db.commit()
                plan_db.refresh(stage)

            # Update stage data
            plan_db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).delete()

            for idx, row in enumerate(stage_data['rows']):
                db_row = models.TableRow(
                    stage_id=stage.id,
                    row_order=idx,
                    category=row.get('category', ''),
                    subcategory=row.get('subcategory', ''),
                    total_tokens=row.get('total_tokens', ''),
                    sample_ratio=row.get('sample_ratio', ''),
                    cumulative_ratio=row.get('cumulative_ratio', ''),
                    sample_tokens=row.get('sample_tokens', ''),
                    category_ratio=row.get('category_ratio', ''),
                    part1=row.get('part1', ''),
                    part2=row.get('part2', ''),
                    part3=row.get('part3', ''),
                    part4=row.get('part4', ''),
                    part5=row.get('part5', ''),
                    note=row.get('note', '')
                )
                plan_db.add(db_row)

            stage.merges = stage_data.get('merges', [])

        plan_db.commit()
        return {"success": True}
    finally:
        plan_db.close()


# ==================== Stage Endpoints ====================

@app.get("/api/plans/{plan_name}/stages")
def get_stages(plan_name: str, main_db: Session = Depends(get_main_db)):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Get stages from plan-specific database
    plan_db = get_plan_session(plan_name.upper())
    try:
        stages = plan_db.query(models.Stage).order_by(models.Stage.stage_order).all()
        result = []
        for s in stages:
            row_count = plan_db.query(models.TableRow).filter(models.TableRow.stage_id == s.id).count()
            result.append({"id": s.id, "name": s.name, "row_count": row_count})
        return result
    finally:
        plan_db.close()

@app.post("/api/plans/{plan_name}/stages")
def create_stage(plan_name: str, stage: StageCreate, admin: models.User = Depends(require_admin), main_db: Session = Depends(get_main_db)):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Create stage in plan-specific database
    plan_db = get_plan_session(plan_name.upper())
    try:
        # Get max order
        max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
        next_order = (max_order_result.stage_order + 1) if max_order_result else 0

        db_stage = models.Stage(name=stage.name, stage_order=next_order, description="", categories=[])
        plan_db.add(db_stage)
        plan_db.commit()
        plan_db.refresh(db_stage)
        return {"id": db_stage.id, "name": db_stage.name}
    finally:
        plan_db.close()


# ==================== Category Endpoints ====================

@app.get("/api/plans/{plan_name}/stages/{stage_name}/categories")
def get_stage_categories(plan_name: str, stage_name: str, main_db: Session = Depends(get_main_db)):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    # Get or create stage in plan database
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

        if not stage:
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, description="", categories=[], stage_order=next_order)
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        # Get all CategoryDetail data
        category_details = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id
        ).all()

        # If stage.categories is empty but we have CategoryDetail data, rebuild from CategoryDetail
        if not stage.categories and category_details:
            category_dict = {}
            for detail in category_details:
                cat_name = detail.category_name
                sub_name = detail.subcategory_name

                if cat_name not in category_dict:
                    category_dict[cat_name] = {
                        'id': hash(cat_name) & 0x7FFFFFFF,
                        'name': cat_name,
                        'subcategories': []
                    }

                category_dict[cat_name]['subcategories'].append({
                    'id': hash(f"{cat_name}_{sub_name}") & 0x7FFFFFFF,
                    'name': sub_name
                })

            stage.categories = list(category_dict.values())
            plan_db.commit()

        # Build statistics dictionary
        stats_dict = {}
        for detail in category_details:
            key = (detail.category_name, detail.subcategory_name)
            stats_dict[key] = {
                'tokenCountTotal': detail.token_count_total or '0',
                'actualTokenTotal': detail.actual_token_total or '0'
            }

        # Merge statistics into categories
        categories_with_stats = []
        for category in stage.categories:
            subcategories_with_stats = []
            category_token_total = 0.0
            category_actual_total = 0.0

            for sub in category.get('subcategories', []):
                key = (category['name'], sub['name'])
                stats = stats_dict.get(key, {'tokenCountTotal': '0', 'actualTokenTotal': '0'})

                subcategories_with_stats.append({
                    **sub,
                    'tokenCountTotal': stats['tokenCountTotal'],
                    'actualTokenTotal': stats['actualTokenTotal']
                })

                # Add to category totals
                category_token_total += float(stats['tokenCountTotal'])
                category_actual_total += float(stats['actualTokenTotal'])

            categories_with_stats.append({
                **category,
                'subcategories': subcategories_with_stats,
                'tokenCountTotal': f"{category_token_total:.2f}",
                'actualTokenTotal': f"{category_actual_total:.2f}"
            })

        return {
            "description": stage.description,
            "categories": categories_with_stats
        }
    finally:
        plan_db.close()

@app.post("/api/plans/{plan_name}/stages/{stage_name}/categories")
def save_stage_categories(
    plan_name: str,
    stage_name: str,
    data: CategoryData,
    admin: models.User = Depends(require_admin),
    main_db: Session = Depends(get_main_db)
):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    # Get or create stage in plan database
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

        if not stage:
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order)
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        stage.description = data.description
        stage.categories = data.categories
        plan_db.commit()
        return {"success": True}
    finally:
        plan_db.close()


# ==================== Category Detail Endpoints ====================

@app.get("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}")
def get_category_detail(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    page: int = 1,
    page_size: int = 20,
    main_db: Session = Depends(get_main_db)
):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    # Get or create stage in plan database
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

        if not stage:
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order)
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        # 如果CategoryDetail不存在，创建一个空的
        if not category_data:
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="",
                token_count_total="0.00",
                actual_token_total="0.00"
            )
            plan_db.add(category_data)
            plan_db.commit()
            plan_db.refresh(category_data)

        all_rows = category_data.rows
        total = len(all_rows)
        start = (page - 1) * page_size
        end = start + page_size
        paged_rows = all_rows[start:end]

        return {
            "description": category_data.description,
            "rows": paged_rows,
            "total": total,
            "page": page,
            "page_size": page_size,
            "tokenCountTotal": category_data.token_count_total or "0.00",
            "actualTokenTotal": category_data.actual_token_total or "0.00"
        }
    finally:
        plan_db.close()

@app.post("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}")
def save_category_detail(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: CategoryDetailData,
    admin: models.User = Depends(require_admin),
    main_db: Session = Depends(get_main_db)
):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        main_db.add(plan)
        main_db.commit()
        main_db.refresh(plan)

    # Get or create stage in plan database
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()

        if not stage:
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order)
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name
            )
            plan_db.add(category_data)

        category_data.description = data.description
        category_data.rows = data.rows
        category_data.token_count_total = data.tokenCountTotal
        category_data.actual_token_total = data.actualTokenTotal
        plan_db.commit()
        return {"success": True}
    finally:
        plan_db.close()

@app.patch("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}/description")
def update_description(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: dict,
    admin: models.User = Depends(require_admin),
    main_db: Session = Depends(get_main_db)
):
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
        if not stage:
            # Create stage if it doesn't exist (consistent with GET endpoint)
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order, description="", categories=[])
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            # Create CategoryDetail if it doesn't exist
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="",
                token_count_total="0.00",
                actual_token_total="0.00"
            )
            plan_db.add(category_data)
            plan_db.flush()

        category_data.description = data.get("description", "")
        plan_db.commit()
        return {"success": True}
    finally:
        plan_db.close()

@app.patch("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}/row")
def update_row(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: RowUpdateData,
    admin: models.User = Depends(require_admin),
    main_db: Session = Depends(get_main_db)
):
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
        if not stage:
            # Create stage if it doesn't exist (consistent with GET endpoint)
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order, description="", categories=[])
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        # 如果CategoryDetail不存在，创建一个新的
        if not category_data:
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="",
                token_count_total="0",
                actual_token_total="0"
            )
            plan_db.add(category_data)
            plan_db.flush()  # 确保ID被分配

        rows = category_data.rows
        found = False
        for i, row in enumerate(rows):
            if row.get('key') == data.key:
                rows[i] = {
                    'key': data.key,
                    'hdfs_path': data.hdfs_path or '',
                    'obs_fuzzy_path': data.obs_fuzzy_path or '',
                    'obs_full_path': data.obs_full_path or '',
                    'token_count': data.token_count or '',
                    'actual_usage': data.actual_usage or '',
                    'actual_token': data.actual_token or ''
                }
                found = True
                break

        if not found:
            rows.append({
                'key': data.key,
                'hdfs_path': data.hdfs_path or '',
                'obs_fuzzy_path': data.obs_fuzzy_path or '',
                'obs_full_path': data.obs_full_path or '',
                'token_count': data.token_count or '',
                'actual_usage': data.actual_usage or '',
                'actual_token': data.actual_token or ''
            })

        category_data.rows = rows

        # Recalculate totals
        token_total = 0.0
        actual_total = 0.0
        for r in rows:
            try:
                token_count = r.get('token_count', '') or '0'
                token_total += float(token_count)
            except (ValueError, TypeError):
                pass
            try:
                actual_token = r.get('actual_token', '') or '0'
                actual_total += float(actual_token)
            except (ValueError, TypeError):
                pass

        category_data.token_count_total = f"{token_total:.2f}"
        category_data.actual_token_total = f"{actual_total:.2f}"

        plan_db.commit()
        return {
            "success": True,
            "tokenCountTotal": category_data.token_count_total,
            "actualTokenTotal": category_data.actual_token_total
        }
    finally:
        plan_db.close()

@app.delete("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}/rows")
def delete_rows(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: RowDeleteData,
    admin: models.User = Depends(require_admin),
    main_db: Session = Depends(get_main_db)
):
    plan_db = get_plan_session(plan_name.upper())
    try:
        stage = plan_db.query(models.Stage).filter(models.Stage.name == stage_name).first()
        if not stage:
            # Create stage if it doesn't exist (consistent with GET endpoint)
            max_order_result = plan_db.query(models.Stage).order_by(models.Stage.stage_order.desc()).first()
            next_order = (max_order_result.stage_order + 1) if max_order_result else 0
            stage = models.Stage(name=stage_name, stage_order=next_order, description="", categories=[])
            plan_db.add(stage)
            plan_db.commit()
            plan_db.refresh(stage)

        category_data = plan_db.query(models.CategoryDetail).filter(
            models.CategoryDetail.stage_id == stage.id,
            models.CategoryDetail.category_name == category_name,
            models.CategoryDetail.subcategory_name == subcategory_name
        ).first()

        if not category_data:
            # Create CategoryDetail if it doesn't exist (empty, nothing to delete)
            category_data = models.CategoryDetail(
                stage_id=stage.id,
                category_name=category_name,
                subcategory_name=subcategory_name,
                description="",
                token_count_total="0.00",
                actual_token_total="0.00"
            )
            plan_db.add(category_data)
            plan_db.commit()
            return {
                "success": True,
                "total": 0,
                "tokenCountTotal": "0.00",
                "actualTokenTotal": "0.00"
            }

        rows = [r for r in category_data.rows if r.get('key') not in data.keys]
        category_data.rows = rows

        # Recalculate totals
        token_total = sum(float(r.get('token_count', 0) or 0) for r in rows)
        actual_total = sum(float(r.get('actual_token', 0) or 0) for r in rows)
        category_data.token_count_total = f"{token_total:.2f}"
        category_data.actual_token_total = f"{actual_total:.2f}"

        plan_db.commit()
        return {
            "success": True,
            "total": len(rows),
            "tokenCountTotal": category_data.token_count_total,
            "actualTokenTotal": category_data.actual_token_total
        }
    finally:
        plan_db.close()


# ==================== Visualization Endpoints ====================

@app.get("/api/plans/{plan_name}/visualization")
def get_visualization_data(plan_name: str, main_db: Session = Depends(get_main_db)):
    # Verify plan exists in main database
    plan = main_db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Get data from plan-specific database
    plan_db = get_plan_session(plan_name.upper())
    try:
        # Get all stages for this plan, sorted by stage_order
        stages = plan_db.query(models.Stage).order_by(models.Stage.stage_order, models.Stage.id).all()

        # Initialize statistics
        total_token_count = 0
        total_actual_token = 0
        stage_stats = []
        category_stats = []
        subcategory_stats = []
        category_distribution = {}
        token_trends = []
        cumulative_token = 0
        cumulative_actual = 0

        for stage in stages:
            stage_token_count = 0
            stage_actual_token = 0
            stage_dataset_count = 0

            # Get all category details for this stage
            category_details = plan_db.query(models.CategoryDetail).filter(
                models.CategoryDetail.stage_id == stage.id
            ).all()

            # Process each category detail
            for cat_detail in category_details:
                token_count = float(cat_detail.token_count_total or 0)
                actual_token = float(cat_detail.actual_token_total or 0)
                dataset_count = len(cat_detail.rows) if cat_detail.rows else 0

                stage_token_count += token_count
                stage_actual_token += actual_token
                stage_dataset_count += dataset_count

                # Aggregate by category name
                category_key = f"{stage.name}_{cat_detail.category_name}"
                if category_key not in category_distribution:
                    category_distribution[category_key] = {
                        'category': cat_detail.category_name,
                        'stage': stage.name,
                        'tokenCount': 0,
                        'actualToken': 0,
                        'datasetCount': 0,
                        'subcategoryCount': 0
                    }

                category_distribution[category_key]['tokenCount'] += token_count
                category_distribution[category_key]['actualToken'] += actual_token
                category_distribution[category_key]['datasetCount'] += dataset_count
                category_distribution[category_key]['subcategoryCount'] += 1

                # Add to subcategory stats
                subcategory_stats.append({
                    'name': f"{cat_detail.category_name}/{cat_detail.subcategory_name} ({stage.name.upper()})",
                    'stage': stage.name,
                    'category': cat_detail.category_name,
                    'subcategory': cat_detail.subcategory_name,
                    'tokenCount': token_count,
                    'actualToken': actual_token,
                    'datasetCount': dataset_count
                })

            # Add stage statistics
            stage_stats.append({
                'stage': stage.name.upper(),
                'tokenCount': round(stage_token_count, 2),
                'actualToken': round(stage_actual_token, 2),
                'datasetCount': stage_dataset_count
            })

            total_token_count += stage_token_count
            total_actual_token += stage_actual_token

            # Calculate cumulative trends
            cumulative_token += stage_token_count
            cumulative_actual += stage_actual_token
            token_trends.append({
                'stage': stage.name.upper(),
                'cumulativeTokenCount': round(cumulative_token, 2),
                'cumulativeActualToken': round(cumulative_actual, 2)
            })

        # Process category distribution for pie chart
        category_pie_data = []
        for cat_key, cat_data in category_distribution.items():
            category_pie_data.append({
                'name': f"{cat_data['category']} ({cat_data['stage'].upper()})",
                'value': cat_data['tokenCount']
            })

            # Calculate usage rate
            usage_rate = (cat_data['actualToken'] / cat_data['tokenCount'] * 100) if cat_data['tokenCount'] > 0 else 0

            category_stats.append({
                'category': cat_data['category'],
                'stage': cat_data['stage'].upper(),
                'subcategoryCount': cat_data['subcategoryCount'],
                'datasetCount': cat_data['datasetCount'],
                'tokenCount': cat_data['tokenCount'],
                'actualToken': cat_data['actualToken'],
                'usageRate': round(usage_rate, 2)
            })

        # Sort subcategory stats by token count
        subcategory_stats.sort(key=lambda x: x['tokenCount'], reverse=True)

        return {
            'overview': {
                'totalStages': len(stages),
                'totalCategories': len(category_distribution),
                'totalTokenCount': round(total_token_count, 2),
                'totalActualToken': round(total_actual_token, 2)
            },
            'stageStats': stage_stats,
            'categoryStats': category_stats,
            'subcategoryStats': subcategory_stats,
            'categoryDistribution': category_pie_data,
            'tokenTrends': token_trends
        }
    finally:
        plan_db.close()
