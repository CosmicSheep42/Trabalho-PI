from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.lists import router as lists_router
from app.api.routes.recipes import router as recipes_router
from app.api.routes.recipes import tags_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(lists_router)
api_router.include_router(recipes_router)
api_router.include_router(tags_router)
