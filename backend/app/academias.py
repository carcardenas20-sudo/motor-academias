import uuid
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from typing import List
from datetime import datetime

from app.database import get_pool
from app.dependencies import get_current_super_admin
from app.auth import TokenData

router = APIRouter()


class AcademiaCreate(BaseModel):
    slug: str = Field(..., pattern=r"^[a-z0-9-]+$")
    nombre: str
    descripcion: str | None = None
    logo_url: str | None = None
    color_acento: str = "#3DD68C"


class AcademiaResponse(BaseModel):
    id: str
    slug: str
    nombre: str
    descripcion: str | None
    logo_url: str | None
    color_acento: str
    activa: bool
    creada_en: datetime


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    nombre: str


class AdminResponse(BaseModel):
    id: str
    email: str
    nombre: str | None
    activo: bool
    creado_en: datetime


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


@router.get("", response_model=List[AcademiaResponse])
async def list_academias(
    current_user: TokenData = Depends(get_current_super_admin)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, slug, nombre, descripcion, logo_url, color_acento, activa, creada_en "
            "FROM academias ORDER BY creada_en DESC"
        )
    return [
        AcademiaResponse(
            id=str(row["id"]),
            slug=row["slug"],
            nombre=row["nombre"],
            descripcion=row["descripcion"],
            logo_url=row["logo_url"],
            color_acento=row["color_acento"],
            activa=row["activa"],
            creada_en=row["creada_en"]
        ) for row in rows
    ]


@router.post("", response_model=AcademiaResponse, status_code=status.HTTP_201_CREATED)
async def create_academia(
    data: AcademiaCreate,
    current_user: TokenData = Depends(get_current_super_admin)
):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar slug único
        exists = await conn.fetchval("SELECT id FROM academias WHERE slug = $1", data.slug)
        if exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La academia con el slug '{data.slug}' ya existe."
            )

        row = await conn.fetchrow(
            "INSERT INTO academias (slug, nombre, descripcion, logo_url, color_acento) "
            "VALUES ($1, $2, $3, $4, $5) "
            "RETURNING id, slug, nombre, descripcion, logo_url, color_acento, activa, creada_en",
            data.slug, data.nombre, data.descripcion, data.logo_url, data.color_acento
        )
    return AcademiaResponse(
        id=str(row["id"]),
        slug=row["slug"],
        nombre=row["nombre"],
        descripcion=row["descripcion"],
        logo_url=row["logo_url"],
        color_acento=row["color_acento"],
        activa=row["activa"],
        creada_en=row["creada_en"]
    )


@router.post("/{academia_id}/admins", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
async def create_academia_admin(
    academia_id: str,
    data: AdminCreate,
    current_user: TokenData = Depends(get_current_super_admin)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de academia inválido."
        )

    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar que la academia exista
        academia_exists = await conn.fetchval("SELECT id FROM academias WHERE id = $1", academia_uuid)
        if not academia_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La academia especificada no existe."
            )

        # Verificar email único
        email_exists = await conn.fetchval("SELECT id FROM usuarios WHERE email = $1", data.email.lower().strip())
        if email_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado."
            )

        password_hash = hash_password(data.password)

        row = await conn.fetchrow(
            "INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol, activo) "
            "VALUES ($1, $2, $3, $4, 'admin_academia', true) "
            "RETURNING id, email, nombre, activo, creado_en",
            academia_uuid, data.email.lower().strip(), password_hash, data.nombre
        )

    return AdminResponse(
        id=str(row["id"]),
        email=row["email"],
        nombre=row["nombre"],
        activo=row["activo"],
        creado_en=row["creado_en"]
    )


@router.get("/{academia_id}/admins", response_model=List[AdminResponse])
async def list_academia_admins(
    academia_id: str,
    current_user: TokenData = Depends(get_current_super_admin)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de academia inválido."
        )

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, email, nombre, activo, creado_en "
            "FROM usuarios WHERE academia_id = $1 AND rol = 'admin_academia' "
            "ORDER BY creado_en DESC",
            academia_uuid
        )
    return [
        AdminResponse(
            id=str(row["id"]),
            email=row["email"],
            nombre=row["nombre"],
            activo=row["activo"],
            creado_en=row["creado_en"]
        ) for row in rows
    ]
