# -*- coding: utf-8 -*-
from database import init_main_database, get_main_db
import models
from auth import get_password_hash

# Initialize main database schema
init_main_database()

# Get main database session
db_gen = get_main_db()
db = next(db_gen)

try:
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

    print("\nDatabase initialized successfully!")
    print("Main database: main.db")
    print("Plan databases will be created in: databases/")
finally:
    db.close()
