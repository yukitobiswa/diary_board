from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Union
from .core.config import ORIGINS
from .db import engine, SessionLocal
from .routers import auth, users, teams, diaries, quizzes, ranking, teachers, health
import logging

# FastAPI app
app = FastAPI()
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターの登録
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(teams.router, prefix="/teams", tags=["teams"])
app.include_router(diaries.router, prefix="/diaries", tags=["diaries"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
app.include_router(ranking.router, prefix="/ranking", tags=["ranking"])
app.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
app.include_router(health.router, prefix="", tags=["health"])

@app.exception_handler(404)
async def page_not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"error": "Page not found"})

@app.exception_handler(500)
async def internal_server_error(request: Request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
