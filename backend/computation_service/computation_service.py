from fastapi import APIRouter, Depends
from auth_service.auth_service import get_current_user, require_admin