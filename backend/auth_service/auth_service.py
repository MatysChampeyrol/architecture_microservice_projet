from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

from config.config import get_settings
from model.user import UserRegister, UserLogin, TokenResponse, RegisterResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def get_supabase():
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    supabase = get_supabase()
    res = supabase.auth.get_user(credentials.credentials)
    if res.user is None:
        raise HTTPException(status_code=401, detail="Token invalide")
    return res.user

def require_admin(user = Depends(get_current_user)):
    if user.user_metadata.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin requis")
    return user


@router.post("/register", response_model=RegisterResponse)
async def register(user: UserRegister):
    supabase = get_supabase()

    res = supabase.auth.sign_up({
        "email": user.email,
        "password": user.password,
        "options": {
            "data": {
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value
            }
        }
    })

    if res.user is None:
        raise HTTPException(status_code=400, detail="Erreur lors de la création du compte")

    return RegisterResponse(
        message="Compte créé avec succès",
        user_id=res.user.id
    )


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    supabase = get_supabase()

    res = supabase.auth.sign_in_with_password({
        "email": user.email,
        "password": user.password
    })

    if res.session is None:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    return TokenResponse(
        access_token=res.session.access_token,
        token_type="bearer",
        user={
            "id": res.user.id,
            "email": res.user.email,
            "first_name": res.user.user_metadata.get("first_name", ""),
            "last_name": res.user.user_metadata.get("last_name", ""),
            "role": res.user.user_metadata.get("role", "user")
        }
    )
