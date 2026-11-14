from fastapi import APIRouter

from app.api.routes import analytics, auth, chat, goals, profile


api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(chat.router)
api_router.include_router(analytics.router)
api_router.include_router(goals.router)
