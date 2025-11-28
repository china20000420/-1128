from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import models
from database import engine, get_db
from auth import get_password_hash, verify_password, create_access_token, get_current_user, require_admin

models.Base.metadata.create_all(bind=engine)

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

@app.post("/api/auth/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "is_admin": db_user.is_admin}

@app.post("/api/auth/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    db_user = models.User(username=user.username, hashed_password=get_password_hash(user.password), is_admin=user.is_admin)
    db.add(db_user)
    db.commit()
    return {"success": True}

@app.get("/api/auth/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "is_admin": current_user.is_admin}

@app.get("/api/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(models.Plan).all()
    return {"plans": [{"key": p.name.lower(), "name": p.name + " 训练计划", "description": p.description or "", "stage_count": len(p.stages)} for p in plans]}

@app.post("/api/plans")
def create_plan(plan: PlanCreate, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    # Check if plan already exists
    existing = db.query(models.Plan).filter(models.Plan.name == plan.name.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan already exists")

    db_plan = models.Plan(name=plan.name.upper(), description=plan.description)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    # Automatically create 4 stages for the new plan
    for stage_name in ['stage1', 'stage2', 'stage3', 'stage4']:
        stage = models.Stage(name=stage_name, plan_id=db_plan.id, description="", categories=[])
        db.add(stage)

    db.commit()
    return {"key": db_plan.name.lower(), "name": db_plan.name + " 训练计划", "description": db_plan.description, "stage_count": 4}

@app.put("/api/plans/{plan_name}")
def update_plan(plan_name: str, plan: PlanUpdate, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db_plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db_plan.description = plan.description
    db.commit()
    return {"success": True}

@app.delete("/api/plans/{plan_name}")
def delete_plan(plan_name: str, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db_plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(db_plan)
    db.commit()
    return {"success": True}

@app.get("/api/plan{plan_name}")
def get_plan(plan_name: str, db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        db.add(plan)
        db.commit()
        db.refresh(plan)

        # Create default stages for new plan
        for stage_name in ['stage1', 'stage2', 'stage3', 'stage4']:
            stage = models.Stage(name=stage_name, plan_id=plan.id, description="", categories=[])
            db.add(stage)
        db.commit()

    # Load all stages dynamically from database
    stages = db.query(models.Stage).filter(models.Stage.plan_id == plan.id).all()

    stages_data = {}
    for stage in stages:
        rows = db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).order_by(models.TableRow.row_order).all()
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

@app.post("/api/plan{plan_name}")
def save_plan(plan_name: str, data: Plan72BData, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper())
        db.add(plan)
        db.commit()
        db.refresh(plan)

    plan.description = data.description

    # Get existing stages from database
    existing_stages = db.query(models.Stage).filter(models.Stage.plan_id == plan.id).all()
    existing_stage_names = {stage.name for stage in existing_stages}
    incoming_stage_names = set(data.stages.keys())

    # Delete stages that are no longer in the incoming data
    stages_to_delete = existing_stage_names - incoming_stage_names
    for stage_name in stages_to_delete:
        stage = db.query(models.Stage).filter(
            models.Stage.plan_id == plan.id,
            models.Stage.name == stage_name
        ).first()
        if stage:
            # Delete related data first (cascade delete)
            db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).delete()
            db.query(models.CategoryDetail).filter(models.CategoryDetail.stage_id == stage.id).delete()
            db.delete(stage)

    # Add or update stages
    for stage_name, stage_data in data.stages.items():
        stage = db.query(models.Stage).filter(
            models.Stage.plan_id == plan.id,
            models.Stage.name == stage_name
        ).first()

        if not stage:
            # Create new stage
            stage = models.Stage(name=stage_name, plan_id=plan.id, description="", categories=[])
            db.add(stage)
            db.commit()
            db.refresh(stage)

        # Update stage data
        db.query(models.TableRow).filter(models.TableRow.stage_id == stage.id).delete()

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
            db.add(db_row)

        stage.merges = stage_data.get('merges', [])

    db.commit()
    return {"success": True}

@app.get("/api/plans/{plan_id}/stages")
def get_stages(plan_id: int, db: Session = Depends(get_db)):
    stages = db.query(models.Stage).filter(models.Stage.plan_id == plan_id).all()
    return [{"id": s.id, "name": s.name, "row_count": len(s.rows)} for s in stages]

@app.post("/api/plans/{plan_id}/stages")
def create_stage(plan_id: int, stage: StageCreate, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db_stage = models.Stage(name=stage.name, plan_id=plan_id)
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return {"id": db_stage.id, "name": db_stage.name}

@app.get("/api/stages/{stage_id}")
def get_stage(stage_id: int, db: Session = Depends(get_db)):
    stage = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not stage:
        raise HTTPException(status_code=404, detail="Stage not found")
    return {"id": stage.id, "name": stage.name}

@app.get("/api/stages/{stage_id}/data")
def get_stage_data(stage_id: int, db: Session = Depends(get_db)):
    rows = db.query(models.TableRow).filter(models.TableRow.stage_id == stage_id).order_by(models.TableRow.row_order).all()
    return [{
        "id": r.id,
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
    } for r in rows]

@app.post("/api/stages/{stage_id}/data")
def import_data(stage_id: int, data: BulkDataImport, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db.query(models.TableRow).filter(models.TableRow.stage_id == stage_id).delete()
    for idx, row in enumerate(data.rows):
        db_row = models.TableRow(stage_id=stage_id, row_order=idx, **row)
        db.add(db_row)
    stage = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    stage.merges = data.merges
    db.commit()
    return {"success": True}

@app.post("/api/stages/{stage_id}/rows")
def create_row(stage_id: int, row: RowCreate, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    max_order = db.query(models.TableRow).filter(models.TableRow.stage_id == stage_id).count()
    db_row = models.TableRow(stage_id=stage_id, row_order=max_order, **row.dict())
    db.add(db_row)
    db.commit()
    return {"success": True}

@app.put("/api/stages/{stage_id}/rows/{row_id}")
def update_row(stage_id: int, row_id: int, row: RowUpdate, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db_row = db.query(models.TableRow).filter(models.TableRow.id == row_id).first()
    if not db_row:
        raise HTTPException(status_code=404, detail="Row not found")
    for key, value in row.dict(exclude_unset=True).items():
        setattr(db_row, key, value)
    db.commit()
    return {"success": True}

@app.delete("/api/stages/{stage_id}/rows")
def delete_rows(stage_id: int, ids: dict, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    db.query(models.TableRow).filter(models.TableRow.id.in_(ids["ids"])).delete(synchronize_session=False)
    db.commit()
    return {"success": True}

@app.post("/api/stages/{stage_id}/merge")
def merge_cells(stage_id: int, data: dict, admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    stage = db.query(models.Stage).filter(models.Stage.id == stage_id).first()
    if not stage.merges:
        stage.merges = []
    stage.merges.append(data["rowIds"])
    db.commit()
    return {"success": True}

class CategoryData(BaseModel):
    description: str
    categories: list

@app.get("/api/plans/{plan_name}/stages/{stage_name}/categories")
def get_stage_categories(plan_name: str, stage_name: str, db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        db.add(plan)
        db.commit()
        db.refresh(plan)

    stage = db.query(models.Stage).filter(
        models.Stage.plan_id == plan.id,
        models.Stage.name == stage_name
    ).first()

    if not stage:
        stage = models.Stage(name=stage_name, plan_id=plan.id, description="", categories=[])
        db.add(stage)
        db.commit()
        db.refresh(stage)

    return {"description": stage.description, "categories": stage.categories}

@app.post("/api/plans/{plan_name}/stages/{stage_name}/categories")
def save_stage_categories(
    plan_name: str,
    stage_name: str,
    data: CategoryData,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        db.add(plan)
        db.commit()
        db.refresh(plan)

    stage = db.query(models.Stage).filter(
        models.Stage.plan_id == plan.id,
        models.Stage.name == stage_name
    ).first()

    if not stage:
        stage = models.Stage(name=stage_name, plan_id=plan.id)
        db.add(stage)
        db.commit()
        db.refresh(stage)

    stage.description = data.description
    stage.categories = data.categories
    db.commit()
    return {"success": True}

class CategoryDetailData(BaseModel):
    description: str
    rows: list
    tokenCountTotal: Optional[str] = "0"
    actualTokenTotal: Optional[str] = "0"

@app.get("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}")
def get_category_detail(plan_name: str, stage_name: str, category_name: str, subcategory_name: str, db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        db.add(plan)
        db.commit()
        db.refresh(plan)

    stage = db.query(models.Stage).filter(
        models.Stage.plan_id == plan.id,
        models.Stage.name == stage_name
    ).first()

    if not stage:
        stage = models.Stage(name=stage_name, plan_id=plan.id)
        db.add(stage)
        db.commit()
        db.refresh(stage)

    category_data = db.query(models.CategoryDetail).filter(
        models.CategoryDetail.stage_id == stage.id,
        models.CategoryDetail.category_name == category_name,
        models.CategoryDetail.subcategory_name == subcategory_name
    ).first()

    if not category_data:
        return {"description": "", "rows": [], "tokenCountTotal": "0", "actualTokenTotal": "0"}

    return {
        "description": category_data.description,
        "rows": category_data.rows,
        "tokenCountTotal": category_data.token_count_total or "0",
        "actualTokenTotal": category_data.actual_token_total or "0"
    }

@app.post("/api/plans/{plan_name}/stages/{stage_name}/categories/{category_name}/{subcategory_name}")
def save_category_detail(
    plan_name: str,
    stage_name: str,
    category_name: str,
    subcategory_name: str,
    data: CategoryDetailData,
    admin: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        plan = models.Plan(name=plan_name.upper(), description="")
        db.add(plan)
        db.commit()
        db.refresh(plan)

    stage = db.query(models.Stage).filter(
        models.Stage.plan_id == plan.id,
        models.Stage.name == stage_name
    ).first()

    if not stage:
        stage = models.Stage(name=stage_name, plan_id=plan.id)
        db.add(stage)
        db.commit()
        db.refresh(stage)

    category_data = db.query(models.CategoryDetail).filter(
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
        db.add(category_data)

    category_data.description = data.description
    category_data.rows = data.rows
    category_data.token_count_total = data.tokenCountTotal
    category_data.actual_token_total = data.actualTokenTotal
    db.commit()
    return {"success": True}

@app.get("/api/plans/{plan_name}/visualization")
def get_visualization_data(plan_name: str, db: Session = Depends(get_db)):
    plan = db.query(models.Plan).filter(models.Plan.name == plan_name.upper()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Get all stages for this plan
    stages = db.query(models.Stage).filter(models.Stage.plan_id == plan.id).all()

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
        category_details = db.query(models.CategoryDetail).filter(
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
                'name': f"{cat_detail.category_name}/{cat_detail.subcategory_name}",
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
