from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.VIEWER


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
