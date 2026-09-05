from app.database import SessionLocal
from app.models import User
from app.core.security import hash_password

db = SessionLocal()

user = User(
    name="Test Officer",
    email="officer@crisisconnect.local",
    password_hash=hash_password("Officer123"),
    role="officer",
    language_pref="en",
)

db.add(user)
db.commit()
db.refresh(user)

print("Officer created successfully!")
print("ID:", user.id)
print("Name:", user.name)
print("Email:", user.email)
print("Role:", user.role)

db.close()