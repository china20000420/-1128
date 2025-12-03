from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Main database for users and plan list
MAIN_DATABASE_URL = "sqlite:///./main.db"

# Directory for per-plan databases
DATABASES_DIR = "./databases"

# Ensure databases directory exists
os.makedirs(DATABASES_DIR, exist_ok=True)

# Main database engine and session
main_engine = create_engine(MAIN_DATABASE_URL, connect_args={"check_same_thread": False})
MainSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=main_engine)

# Base classes for different database types
MainBase = declarative_base()  # For User and Plan models
PlanBase = declarative_base()  # For Stage, TableRow, CategoryDetail models

# Dictionary to cache plan database engines
_plan_engines = {}

def get_main_db():
    """Get main database session (for users and plan list)"""
    db = MainSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_plan_db_path(plan_name: str) -> str:
    """Get the database file path for a specific plan"""
    return os.path.join(DATABASES_DIR, f"{plan_name.lower()}.db")

def get_plan_engine(plan_name: str):
    """Get or create engine for a specific plan database"""
    if plan_name not in _plan_engines:
        db_path = get_plan_db_path(plan_name)
        db_url = f"sqlite:///{db_path}"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        _plan_engines[plan_name] = engine

        # Create tables if they don't exist
        PlanBase.metadata.create_all(bind=engine)

    return _plan_engines[plan_name]

def get_plan_db(plan_name: str):
    """Get database session for a specific plan"""
    engine = get_plan_engine(plan_name)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_main_database():
    """Initialize main database tables"""
    MainBase.metadata.create_all(bind=main_engine)

def delete_plan_database(plan_name: str):
    """Delete the database file for a specific plan"""
    db_path = get_plan_db_path(plan_name)
    if os.path.exists(db_path):
        # Close engine if cached
        if plan_name in _plan_engines:
            _plan_engines[plan_name].dispose()
            del _plan_engines[plan_name]
        # Delete file
        os.remove(db_path)
