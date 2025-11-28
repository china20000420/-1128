from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import json

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)

class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, default="")
    stages = relationship("Stage", back_populates="plan", cascade="all, delete-orphan")

class Stage(Base):
    __tablename__ = "stages"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"))
    description = Column(Text, default="")
    plan = relationship("Plan", back_populates="stages")
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

class TableRow(Base):
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

class CategoryDetail(Base):
    __tablename__ = "category_details"
    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"))
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
