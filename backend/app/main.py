from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.seed import seed_recipes_from_data_directory
from app.db.session import SessionLocal

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.on_event("startup")
def seed_database() -> None:
    db = SessionLocal()
    try:
        seed_recipes_from_data_directory(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "api online",
        "clerk_configured": bool(settings.clerk_secret_key),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
