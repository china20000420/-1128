from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import MainBase, PlanBase
import json

# ==================== Main Database Models ====================
# These models are stored in main.db

class User(MainBase):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Plan(MainBase):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, default="")
    # Note: No stages relationship here - stages are in separate databases


# ==================== Per-Plan Database Models ====================
# These models are stored in databases/{plan_name}.db

class Stage(PlanBase):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    # Note: No plan_id foreign key - each plan has its own database
    description = Column(Text, default="")
    stage_order = Column(Integer, default=0)
    rows = relationship("TableRow", back_populates="stage", cascade="all, delete-orphan")
    _merges = Column("merges", Text, default="[]")
    _categories = Column("categories", Text, default="[]")

    @property
    def merges(self):
        return json.loads(self._merges) if self._merges else []

    @merges.setter
    def merges(self, value):
        self._merges = json.dumps(value)

    @property
    def categories(self):
        return json.loads(self._categories) if self._categories else []

    @categories.setter
    def categories(self, value):
        self._categories = json.dumps(value)

class TableRow(PlanBase):
    __tablename__ = "table_rows"
    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"))
    stage = relationship("Stage", back_populates="rows")
    category = Column(String, default="")
    subcategory = Column(String, default="")
    total_tokens = Column(String, default="")
    sample_ratio = Column(String, default="")
    cumulative_ratio = Column(String, default="")
    sample_tokens = Column(String, default="")
    category_ratio = Column(String, default="")
    part1 = Column(String, default="")
    part2 = Column(String, default="")
    part3 = Column(String, default="")
    part4 = Column(String, default="")
    part5 = Column(String, default="")
    note = Column(String, default="")
    row_order = Column(Integer, default=0)

class CategoryDetail(PlanBase):
    __tablename__ = "category_details"
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )
    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), index=True)
    category_name = Column(String, index=True)
    subcategory_name = Column(String, index=True)
    description = Column(Text, default="")
    _rows = Column("rows", Text, default="[]")
    token_count_total = Column(String, default="0")
    actual_token_total = Column(String, default="0")

    @property
    def rows(self):
        return json.loads(self._rows) if self._rows else []

    @rows.setter
    def rows(self, value):
        self._rows = json.dumps(value)
