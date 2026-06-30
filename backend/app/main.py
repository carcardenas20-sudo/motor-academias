from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import get_pool, close_pool
from app.auth import router as auth_router
from app.academias import router as academias_router
from app.cursos import router as cursos_router
from app.gamificacion import router as gamificacion_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await get_pool()
    yield
    await close_pool()


app = FastAPI(title="Motor Academias API", version="0.1.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(academias_router, prefix="/academias", tags=["academias"])
app.include_router(cursos_router)
app.include_router(gamificacion_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
