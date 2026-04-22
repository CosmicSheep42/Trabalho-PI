from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "a",
        "clerk_configured": bool(os.getenv("CLERK_SECRET_KEY"))
    }

@app.get("/health")
def health():
    return {"status": "ok", "database": "mysql_available_but_no_tables"}