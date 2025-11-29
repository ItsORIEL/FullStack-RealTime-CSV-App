from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel

# =======================
# 👤 USER MODELS
# =======================

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(default="user")  # 'user' or 'admin'

# Used for Signup inputs
class UserCreate(SQLModel):
    username: str
    password: str

# Used for API responses (hides the password)
class UserRead(SQLModel):
    id: int
    username: str
    role: str

# Used for JWT Token responses
class Token(SQLModel):
    access_token: str
    token_type: str


# =======================
# 📂 FILE MODELS
# =======================

class FileMetadata(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    filepath: str
    size_bytes: int
    uploaded_by: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)