# -*- coding: utf-8 -*-
from database import engine, SessionLocal
import models
from auth import get_password_hash

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

if not db.query(models.User).filter(models.User.username == "admin").first():
    admin = models.User(
        username="admin",
        hashed_password=get_password_hash("admin123"),
        is_admin=True
    )
    db.add(admin)
    db.commit()
    print("Admin user created: admin / admin123")
else:
    print("Admin user already exists")

if not db.query(models.User).filter(models.User.username == "user").first():
    user = models.User(
        username="user",
        hashed_password=get_password_hash("user123"),
        is_admin=False
    )
    db.add(user)
    db.commit()
    print("Normal user created: user / user123")
else:
    print("Normal user already exists")

db.close()
print("\nDatabase initialized successfully!")
