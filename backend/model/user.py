from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"

# schéma pour l'inscription d'un nouvel utilisateur
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.user

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class RegisterResponse(BaseModel):
    message: str
    user_id: Optional[str] = None
