import uuid
from datetime import datetime
from typing import List, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_pool
from app.auth import TokenData, verificar_token
from app.dependencies import require_admin_academia, verify_academy_access, get_current_user

router = APIRouter(
    prefix="/academias/{academia_id}",
    tags=["cursos"],
    dependencies=[Depends(verify_academy_access)]
)

# ─────────────────────────────────────────────
# PYDANTIC SCHEMAS
# ─────────────────────────────────────────────

class CursoCreate(BaseModel):
    titulo: str
    descripcion: str | None = None
    orden: int = 0
    publicado: bool = False

class CursoResponse(BaseModel):
    id: str
    academia_id: str
    titulo: str
    descripcion: str | None
    orden: int
    publicado: bool
    creado_en: datetime
    actualizado_en: datetime | None

class BloqueCreate(BaseModel):
    titulo: str
    orden: int = 0

class BloqueResponse(BaseModel):
    id: str
    academia_id: str
    curso_id: str
    titulo: str
    orden: int
    creado_en: datetime
    actualizado_en: datetime | None

class PildoraCreate(BaseModel):
    titulo: str
    tipo: Literal["video", "texto", "prueba"] = "video"
    contenido: str | None = None
    duracion_min: int | None = None
    orden: int = 0
    publicada: bool = False

class PildoraResponse(BaseModel):
    id: str
    academia_id: str
    bloque_id: str
    titulo: str
    tipo: str
    contenido: str | None
    duracion_min: int | None
    orden: int
    publicada: bool
    creado_en: datetime
    actualizado_en: datetime | None

class ProgresoToggle(BaseModel):
    completada: bool

class ProgresoResponse(BaseModel):
    pildora_id: str
    completada: bool
    completada_en: datetime | None

# Helper functions to convert DB row to Response Model
def map_row_to_curso(row) -> CursoResponse:
    return CursoResponse(
        id=str(row["id"]),
        academia_id=str(row["academia_id"]),
        titulo=row["titulo"],
        descripcion=row["descripcion"],
        orden=row["orden"],
        publicado=row["publicado"],
        creado_en=row["creado_en"],
        actualizado_en=row["actualizado_en"]
    )

def map_row_to_bloque(row) -> BloqueResponse:
    return BloqueResponse(
        id=str(row["id"]),
        academia_id=str(row["academia_id"]),
        curso_id=str(row["curso_id"]),
        titulo=row["titulo"],
        orden=row["orden"],
        creado_en=row["creado_en"],
        actualizado_en=row["actualizado_en"]
    )

def map_row_to_pildora(row) -> PildoraResponse:
    return PildoraResponse(
        id=str(row["id"]),
        academia_id=str(row["academia_id"]),
        bloque_id=str(row["bloque_id"]),
        titulo=row["titulo"],
        tipo=row["tipo"],
        contenido=row["contenido"],
        duracion_min=row["duracion_min"],
        orden=row["orden"],
        publicada=row["publicada"],
        creado_en=row["creado_en"],
        actualizado_en=row["actualizado_en"]
    )

# ─────────────────────────────────────────────
# CURSOS ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/cursos", response_model=List[CursoResponse])
async def list_cursos(
    academia_id: str,
    token_data: TokenData = Depends(verificar_token)
):
    academia_uuid = uuid.UUID(academia_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        if token_data.rol in ("super_admin", "admin_academia"):
            rows = await conn.fetch(
                "SELECT id, academia_id, titulo, descripcion, orden, publicado, creado_en, actualizado_en "
                "FROM cursos WHERE academia_id = $1 ORDER BY orden ASC, creado_en DESC",
                academia_uuid
            )
        else:
            # Estudiantes solo ven cursos publicados
            rows = await conn.fetch(
                "SELECT id, academia_id, titulo, descripcion, orden, publicado, creado_en, actualizado_en "
                "FROM cursos WHERE academia_id = $1 AND publicado = true ORDER BY orden ASC, creado_en DESC",
                academia_uuid
            )
    return [map_row_to_curso(r) for r in rows]

@router.post("/cursos", response_model=CursoResponse, status_code=status.HTTP_201_CREATED)
async def create_curso(
    academia_id: str,
    data: CursoCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO cursos (academia_id, titulo, descripcion, orden, publicado) "
            "VALUES ($1, $2, $3, $4, $5) "
            "RETURNING id, academia_id, titulo, descripcion, orden, publicado, creado_en, actualizado_en",
            academia_uuid, data.titulo, data.descripcion, data.orden, data.publicado
        )
    return map_row_to_curso(row)

@router.get("/cursos/{curso_id}", response_model=CursoResponse)
async def get_curso(
    academia_id: str,
    curso_id: str,
    token_data: TokenData = Depends(verificar_token)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, academia_id, titulo, descripcion, orden, publicado, creado_en, actualizado_en "
            "FROM cursos WHERE id = $1 AND academia_id = $2",
            curso_uuid, academia_uuid
        )
        if not row:
            raise HTTPException(status_code=404, detail="Curso no encontrado.")
            
        # Si es estudiante y no está publicado, denegar
        if token_data.rol == "estudiante" and not row["publicado"]:
            raise HTTPException(status_code=403, detail="No tienes acceso a este curso.")
            
    return map_row_to_curso(row)

@router.put("/cursos/{curso_id}", response_model=CursoResponse)
async def update_curso(
    academia_id: str,
    curso_id: str,
    data: CursoCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar pertenencia
        exists = await conn.fetchval(
            "SELECT id FROM cursos WHERE id = $1 AND academia_id = $2",
            curso_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Curso no encontrado en esta academia.")
            
        row = await conn.fetchrow(
            "UPDATE cursos SET titulo = $1, descripcion = $2, orden = $3, publicado = $4 "
            "WHERE id = $5 "
            "RETURNING id, academia_id, titulo, descripcion, orden, publicado, creado_en, actualizado_en",
            data.titulo, data.descripcion, data.orden, data.publicado, curso_uuid
        )
    return map_row_to_curso(row)

@router.delete("/cursos/{curso_id}")
async def delete_curso(
    academia_id: str,
    curso_id: str,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT id FROM cursos WHERE id = $1 AND academia_id = $2",
            curso_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Curso no encontrado en esta academia.")
            
        await conn.execute("DELETE FROM cursos WHERE id = $1", curso_uuid)
    return {"status": "ok", "message": "Curso eliminado correctamente."}

# ─────────────────────────────────────────────
# BLOQUES ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/cursos/{curso_id}/bloques", response_model=List[BloqueResponse])
async def list_bloques(
    academia_id: str,
    curso_id: str
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, academia_id, curso_id, titulo, orden, creado_en, actualizado_en "
            "FROM bloques WHERE curso_id = $1 AND academia_id = $2 ORDER BY orden ASC, creado_en DESC",
            curso_uuid, academia_uuid
        )
    return [map_row_to_bloque(r) for r in rows]

@router.post("/cursos/{curso_id}/bloques", response_model=BloqueResponse, status_code=status.HTTP_201_CREATED)
async def create_bloque(
    academia_id: str,
    curso_id: str,
    data: BloqueCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar que el curso pertenezca a la academia
        curso_exists = await conn.fetchval(
            "SELECT id FROM cursos WHERE id = $1 AND academia_id = $2",
            curso_uuid, academia_uuid
        )
        if not curso_exists:
            raise HTTPException(status_code=404, detail="Curso no encontrado en esta academia.")
            
        row = await conn.fetchrow(
            "INSERT INTO bloques (academia_id, curso_id, titulo, orden) "
            "VALUES ($1, $2, $3, $4) "
            "RETURNING id, academia_id, curso_id, titulo, orden, creado_en, actualizado_en",
            academia_uuid, curso_uuid, data.titulo, data.orden
        )
    return map_row_to_bloque(row)

@router.put("/bloques/{bloque_id}", response_model=BloqueResponse)
async def update_bloque(
    academia_id: str,
    bloque_id: str,
    data: BloqueCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        bloque_uuid = uuid.UUID(bloque_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de bloque inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT id FROM bloques WHERE id = $1 AND academia_id = $2",
            bloque_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Bloque no encontrado en esta academia.")
            
        row = await conn.fetchrow(
            "UPDATE bloques SET titulo = $1, orden = $2 WHERE id = $3 "
            "RETURNING id, academia_id, curso_id, titulo, orden, creado_en, actualizado_en",
            data.titulo, data.orden, bloque_uuid
        )
    return map_row_to_bloque(row)

@router.delete("/bloques/{bloque_id}")
async def delete_bloque(
    academia_id: str,
    bloque_id: str,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        bloque_uuid = uuid.UUID(bloque_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de bloque inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT id FROM bloques WHERE id = $1 AND academia_id = $2",
            bloque_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Bloque no encontrado en esta academia.")
            
        await conn.execute("DELETE FROM bloques WHERE id = $1", bloque_uuid)
    return {"status": "ok", "message": "Bloque eliminado correctamente."}

# ─────────────────────────────────────────────
# PILDORAS ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/bloques/{bloque_id}/pildoras", response_model=List[PildoraResponse])
async def list_pildoras(
    academia_id: str,
    bloque_id: str,
    token_data: TokenData = Depends(verificar_token)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        bloque_uuid = uuid.UUID(bloque_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de bloque inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        if token_data.rol in ("super_admin", "admin_academia"):
            rows = await conn.fetch(
                "SELECT id, academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada, creado_en, actualizado_en "
                "FROM pildoras WHERE bloque_id = $1 AND academia_id = $2 ORDER BY orden ASC, creado_en DESC",
                bloque_uuid, academia_uuid
            )
        else:
            # Estudiantes solo ven pildoras publicadas
            rows = await conn.fetch(
                "SELECT id, academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada, creado_en, actualizado_en "
                "FROM pildoras WHERE bloque_id = $1 AND academia_id = $2 AND publicada = true ORDER BY orden ASC, creado_en DESC",
                bloque_uuid, academia_uuid
            )
    return [map_row_to_pildora(r) for r in rows]

@router.post("/bloques/{bloque_id}/pildoras", response_model=PildoraResponse, status_code=status.HTTP_201_CREATED)
async def create_pildora(
    academia_id: str,
    bloque_id: str,
    data: PildoraCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        bloque_uuid = uuid.UUID(bloque_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de bloque inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar que el bloque pertenezca a la academia
        bloque_exists = await conn.fetchval(
            "SELECT id FROM bloques WHERE id = $1 AND academia_id = $2",
            bloque_uuid, academia_uuid
        )
        if not bloque_exists:
            raise HTTPException(status_code=404, detail="Bloque no encontrado en esta academia.")
            
        row = await conn.fetchrow(
            "INSERT INTO pildoras (academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8) "
            "RETURNING id, academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada, creado_en, actualizado_en",
            academia_uuid, bloque_uuid, data.titulo, data.tipo, data.contenido, data.duracion_min, data.orden, data.publicada
        )
    return map_row_to_pildora(row)

@router.put("/pildoras/{pildora_id}", response_model=PildoraResponse)
async def update_pildora(
    academia_id: str,
    pildora_id: str,
    data: PildoraCreate,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        pildora_uuid = uuid.UUID(pildora_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de pildora inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT id FROM pildoras WHERE id = $1 AND academia_id = $2",
            pildora_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Pildora no encontrada en esta academia.")
            
        row = await conn.fetchrow(
            "UPDATE pildoras SET titulo = $1, tipo = $2, contenido = $3, duracion_min = $4, orden = $5, publicada = $6 "
            "WHERE id = $7 "
            "RETURNING id, academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada, creado_en, actualizado_en",
            data.titulo, data.tipo, data.contenido, data.duracion_min, data.orden, data.publicada, pildora_uuid
        )
    return map_row_to_pildora(row)

@router.delete("/pildoras/{pildora_id}")
async def delete_pildora(
    academia_id: str,
    pildora_id: str,
    admin_user: TokenData = Depends(require_admin_academia)
):
    academia_uuid = uuid.UUID(academia_id)
    try:
        pildora_uuid = uuid.UUID(pildora_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de pildora inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        exists = await conn.fetchval(
            "SELECT id FROM pildoras WHERE id = $1 AND academia_id = $2",
            pildora_uuid, academia_uuid
        )
        if not exists:
            raise HTTPException(status_code=404, detail="Pildora no encontrada en esta academia.")
            
        await conn.execute("DELETE FROM pildoras WHERE id = $1", pildora_uuid)
    return {"status": "ok", "message": "Pildora eliminada correctamente."}

# ─────────────────────────────────────────────
# PROGRESO ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/progreso", response_model=List[ProgresoResponse])
async def get_progreso(
    academia_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    academia_uuid = uuid.UUID(academia_id)
    usuario_uuid = uuid.UUID(current_user.usuario_id)
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT pildora_id, completada, completada_en FROM progreso "
            "WHERE academia_id = $1 AND usuario_id = $2",
            academia_uuid, usuario_uuid
        )
    return [
        ProgresoResponse(
            pildora_id=str(row["pildora_id"]),
            completada=row["completada"],
            completada_en=row["completada_en"]
        ) for row in rows
    ]

@router.post("/progreso/{pildora_id}", response_model=ProgresoResponse)
async def toggle_progreso(
    academia_id: str,
    pildora_id: str,
    data: ProgresoToggle,
    current_user: TokenData = Depends(get_current_user)
):
    academia_uuid = uuid.UUID(academia_id)
    usuario_uuid = uuid.UUID(current_user.usuario_id)
    try:
        pildora_uuid = uuid.UUID(pildora_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de pildora inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Verificar que la píldora exista y pertenezca a la academia
        pildora_exists = await conn.fetchval(
            "SELECT id FROM pildoras WHERE id = $1 AND academia_id = $2",
            pildora_uuid, academia_uuid
        )
        if not pildora_exists:
            raise HTTPException(status_code=404, detail="La lección no pertenece a esta academia.")
            
        completada_en = datetime.now() if data.completada else None
        
        row = await conn.fetchrow(
            "INSERT INTO progreso (academia_id, usuario_id, pildora_id, completada, completada_en) "
            "VALUES ($1, $2, $3, $4, $5) "
            "ON CONFLICT (academia_id, usuario_id, pildora_id) DO UPDATE "
            "SET completada = EXCLUDED.completada, completada_en = EXCLUDED.completada_en "
            "RETURNING pildora_id, completada, completada_en",
            academia_uuid, usuario_uuid, pildora_uuid, data.completada, completada_en
        )
    return ProgresoResponse(
        pildora_id=str(row["pildora_id"]),
        completada=row["completada"],
        completada_en=row["completada_en"]
    )
