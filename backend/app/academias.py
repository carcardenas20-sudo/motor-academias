import uuid
import bcrypt
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from typing import List
from datetime import datetime

from app.database import get_pool
from app.dependencies import get_current_super_admin, require_admin_academia, verify_academy_access
from app.auth import TokenData

router = APIRouter()


class AcademiaCreate(BaseModel):
    slug: str = Field(..., pattern=r"^[a-z0-9-]+$")
    nombre: str
    descripcion: str | None = None
    logo_url: str | None = None
    color_acento: str = "#3DD68C"


class AcademiaUpdate(BaseModel):
    nombre: str
    descripcion: str | None = None
    logo_url: str | None = None
    color_acento: str = "#3DD68C"
    activa: bool = True


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


@router.get("/{academia_id}", response_model=AcademiaResponse)
async def get_academia(
    academia_id: str,
    current_user: TokenData = Depends(verify_academy_access)
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
        row = await conn.fetchrow(
            "SELECT id, slug, nombre, descripcion, logo_url, color_acento, activa, creada_en "
            "FROM academias WHERE id = $1",
            academia_uuid
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La academia especificada no existe."
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


@router.get("/public/{slug}")
async def get_academia_public_info(slug: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT nombre, logo_url, color_acento, descripcion FROM academias WHERE slug = $1 AND activa = true",
            slug.lower().strip()
        )
    if not row:
        raise HTTPException(
            status_code=404,
            detail="La academia especificada no existe o no está activa."
        )
    return {
        "nombre": row["nombre"],
        "logo_url": row["logo_url"],
        "color_acento": row["color_acento"],
        "descripcion": row["descripcion"]
    }


@router.get("/public/slug/{slug}/cursos")
async def get_public_courses_outline(slug: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Obtener id de academia
        academia_row = await conn.fetchrow(
            "SELECT id FROM academias WHERE slug = $1 AND activa = true",
            slug.lower().strip()
        )
        if not academia_row:
            raise HTTPException(status_code=404, detail="La academia no existe o no está activa.")
        
        academia_uuid = academia_row["id"]
        
        # Obtener cursos publicados
        cursos = await conn.fetch(
            "SELECT id, titulo, descripcion, orden FROM cursos "
            "WHERE academia_id = $1 AND publicado = true "
            "ORDER BY orden ASC, creado_en DESC",
            academia_uuid
        )
        
        outline = []
        for c in cursos:
            curso_uuid = c["id"]
            # Obtener bloques
            bloques = await conn.fetch(
                "SELECT id, titulo, orden FROM bloques "
                "WHERE curso_id = $1 AND academia_id = $2 "
                "ORDER BY orden ASC, creado_en DESC",
                curso_uuid, academia_uuid
            )
            
            bloques_list = []
            for b in bloques:
                bloque_uuid = b["id"]
                # Obtener pildoras publicadas
                pildoras = await conn.fetch(
                    "SELECT id, titulo, tipo, duracion_min, orden FROM pildoras "
                    "WHERE bloque_id = $1 AND academia_id = $2 AND publicada = true "
                    "ORDER BY orden ASC, creado_en DESC",
                    bloque_uuid, academia_uuid
                )
                
                bloques_list.append({
                    "id": str(bloque_uuid),
                    "titulo": b["titulo"],
                    "orden": b["orden"],
                    "pildoras": [{
                        "id": str(p["id"]),
                        "titulo": p["titulo"],
                        "tipo": p["tipo"],
                        "duracion_min": p["duracion_min"],
                        "orden": p["orden"]
                    } for p in pildoras]
                })
                
            outline.append({
                "id": str(curso_uuid),
                "titulo": c["titulo"],
                "descripcion": c["descripcion"],
                "orden": c["orden"],
                "bloques": bloques_list
            })
            
    return outline


@router.post("/{academia_id}/webhook/hotmart")
async def hotmart_webhook(
    academia_id: str,
    payload: dict
):
    event = payload.get("event")
    buyer = payload.get("buyer", {})
    email = buyer.get("email") or payload.get("buyer_email")
    nombre = buyer.get("name") or payload.get("buyer_nombre")
    
    if not event or not email:
        raise HTTPException(status_code=400, detail="Payload de Hotmart inválido.")
        
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de academia inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            user_row = await conn.fetchrow(
                "SELECT id FROM usuarios WHERE email = $1 AND academia_id = $2",
                email.lower().strip(), academia_uuid
            )
            
            if user_row:
                usuario_uuid = user_row["id"]
            else:
                import bcrypt
                dummy_pwd = bcrypt.hashpw(b"Apuesta123!", bcrypt.gensalt()).decode("utf-8")
                usuario_uuid = await conn.fetchval(
                    "INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol) "
                    "VALUES ($1, $2, $3, $4, 'estudiante') RETURNING id",
                    academia_uuid, email.lower().strip(), dummy_pwd, nombre or "Estudiante Nuevo"
                )
                
            if event in ("PURCHASE_APPROVED", "subscription_active", "compra_aprobada"):
                await conn.execute(
                    "INSERT INTO membresias (academia_id, usuario_id, plan, activa, hotmart_id, comprada_en) "
                    "VALUES ($1, $2, 'premium', true, $3, NOW()) "
                    "ON CONFLICT (academia_id, usuario_id) DO UPDATE SET "
                    "activa = true, comprada_en = NOW(), hotmart_id = EXCLUDED.hotmart_id",
                    academia_uuid, usuario_uuid, "HOTMART-" + str(uuid.uuid4())[:8]
                )
                
                # Registrar la venta en la tabla ventas
                await conn.execute(
                    "INSERT INTO ventas (academia_id, usuario_id, monto, moneda, hotmart_id) "
                    "VALUES ($1, $2, $3, 'USD', $4)",
                    academia_uuid, usuario_uuid, Decimal("49.90"), "HOTMART-SALE-" + str(uuid.uuid4())[:8]
                )
            elif event in ("PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "subscription_canceled", "compra_devolucion"):
                await conn.execute(
                    "UPDATE membresias SET activa = false "
                    "WHERE academia_id = $1 AND usuario_id = $2",
                    academia_uuid, usuario_uuid
                )
                
    return {"status": "processed", "event": event, "email": email}


@router.put("/{academia_id}", response_model=AcademiaResponse)
async def update_academia_details(
    academia_id: str,
    data: AcademiaUpdate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de academia inválido."
        )

    # Si no es super_admin, verificar que solo pueda editar su propia academia
    if admin_user.rol != "super_admin" and str(admin_user.academia_id) != academia_id:
         raise HTTPException(
             status_code=status.HTTP_403_FORBIDDEN,
             detail="No tienes permisos para modificar esta academia."
         )

    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE academias SET nombre = $1, descripcion = $2, logo_url = $3, color_acento = $4, activa = $5 "
            "WHERE id = $6 "
            "RETURNING id, slug, nombre, descripcion, logo_url, color_acento, activa, creada_en",
            data.nombre, data.descripcion, data.logo_url, data.color_acento, data.activa, academia_uuid
        )
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="La academia especificada no existe."
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


class CostoCreate(BaseModel):
    monto: float
    descripcion: str


@router.get("/{academia_id}/finanzas/metricas")
async def get_finanzas_metricas(
    academia_id: str,
    admin_user: TokenData = Depends(require_admin_academia)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de academia inválido.")
        
    if admin_user.rol != "super_admin" and str(admin_user.academia_id) != academia_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a los datos de esta academia.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        ingresos_totales = await conn.fetchval(
            "SELECT COALESCE(SUM(monto), 0) FROM ventas WHERE academia_id = $1",
            academia_uuid
        )
        costos_totales = await conn.fetchval(
            "SELECT COALESCE(SUM(monto), 0) FROM costos WHERE academia_id = $1",
            academia_uuid
        )
        
        beneficio_neto = float(ingresos_totales) - float(costos_totales)
        
        ventas_rows = await conn.fetch(
            "SELECT v.id, 'venta' as tipo, v.monto, v.creado_en, u.nombre as detalle "
            "FROM ventas v "
            "LEFT JOIN usuarios u ON v.usuario_id = u.id "
            "WHERE v.academia_id = $1",
            academia_uuid
        )
        
        costos_rows = await conn.fetch(
            "SELECT id, 'costo' as tipo, monto, creado_en, descripcion as detalle "
            "FROM costos "
            "WHERE academia_id = $1",
            academia_uuid
        )
        
        transacciones = []
        for r in ventas_rows:
            transacciones.append({
                "id": str(r["id"]),
                "tipo": r["tipo"],
                "monto": float(r["monto"]),
                "fecha": r["creado_en"],
                "detalle": r["detalle"] or "Estudiante Premium"
            })
            
        for r in costos_rows:
            transacciones.append({
                "id": str(r["id"]),
                "tipo": r["tipo"],
                "monto": float(r["monto"]),
                "fecha": r["creado_en"],
                "detalle": r["detalle"]
            })
            
        transacciones.sort(key=lambda x: x["fecha"], reverse=True)
        
    return {
        "ingresos_totales": float(ingresos_totales),
        "costos_totales": float(costos_totales),
        "beneficio_neto": beneficio_neto,
        "transacciones": transacciones[:30]
    }


@router.post("/{academia_id}/finanzas/costos", status_code=status.HTTP_201_CREATED)
async def create_costo(
    academia_id: str,
    data: CostoCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de academia inválido.")
        
    if admin_user.rol != "super_admin" and str(admin_user.academia_id) != academia_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a los datos de esta academia.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO costos (academia_id, monto, descripcion) "
            "VALUES ($1, $2, $3) RETURNING id, monto, descripcion, creado_en",
            academia_uuid, Decimal(str(data.monto)), data.descripcion
        )
    return {
        "id": str(row["id"]),
        "monto": float(row["monto"]),
        "descripcion": row["descripcion"],
        "creado_en": row["creado_en"]
    }


@router.delete("/{academia_id}/finanzas/costos/{costo_id}")
async def delete_costo(
    academia_id: str,
    costo_id: str,
    admin_user: TokenData = Depends(require_admin_academia)
):
    try:
        academia_uuid = uuid.UUID(academia_id)
        costo_uuid = uuid.UUID(costo_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido.")
        
    if admin_user.rol != "super_admin" and str(admin_user.academia_id) != academia_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a los datos de esta academia.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        deleted = await conn.execute(
            "DELETE FROM costos WHERE id = $1 AND academia_id = $2",
            costo_uuid, academia_uuid
        )
        if deleted == "DELETE 0":
            raise HTTPException(status_code=404, detail="El gasto especificado no existe.")
            
    return {"status": "deleted"}
