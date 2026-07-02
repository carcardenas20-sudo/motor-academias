import uuid
import hashlib
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

class CertificadoResponse(BaseModel):
    certificado_id: str
    nombre_estudiante: str
    nombre_curso: str
    nombre_academia: str
    logo_url: str | None = None
    color_acento: str
    fecha_emision: datetime
    fecha_emision_formateada: str

class RespuestaPrueba(BaseModel):
    respuestas: dict[str, int]

class ResultadoEvaluacion(BaseModel):
    aprobado: bool
    nota: float
    puntos_ganados: int
    feedback: dict[str, bool]

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

def map_row_to_pildora(row, strip_answers: bool = False) -> PildoraResponse:
    contenido = row["contenido"]
    if strip_answers and row["tipo"] == "prueba" and contenido:
        try:
            import json
            data = json.loads(contenido)
            if isinstance(data, dict) and "preguntas" in data:
                for q in data["preguntas"]:
                    q.pop("respuesta_correcta", None)
                contenido = json.dumps(data)
        except Exception:
            pass
    return PildoraResponse(
        id=str(row["id"]),
        academia_id=str(row["academia_id"]),
        bloque_id=str(row["bloque_id"]),
        titulo=row["titulo"],
        tipo=row["tipo"],
        contenido=contenido,
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
            return [map_row_to_pildora(r, strip_answers=False) for r in rows]
        else:
            # Estudiantes solo ven pildoras publicadas
            rows = await conn.fetch(
                "SELECT id, academia_id, bloque_id, titulo, tipo, contenido, duracion_min, orden, publicada, creado_en, actualizado_en "
                "FROM pildoras WHERE bloque_id = $1 AND academia_id = $2 AND publicada = true ORDER BY orden ASC, creado_en DESC",
                bloque_uuid, academia_uuid
            )
            return [map_row_to_pildora(r, strip_answers=True) for r in rows]

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
        async with conn.transaction():
            # Verificar que la píldora exista y pertenezca a la academia
            pildora_exists = await conn.fetchval(
                "SELECT id FROM pildoras WHERE id = $1 AND academia_id = $2",
                pildora_uuid, academia_uuid
            )
            if not pildora_exists:
                raise HTTPException(status_code=404, detail="La lección no pertenece a esta academia.")
                
            # Obtener estado de progreso previo
            prev_completada = await conn.fetchval(
                "SELECT completada FROM progreso "
                "WHERE academia_id = $1 AND usuario_id = $2 AND pildora_id = $3",
                academia_uuid, usuario_uuid, pildora_uuid
            )
            
            # Solo actualizar si el estado cambió
            if prev_completada is None or prev_completada != data.completada:
                completada_en = datetime.now() if data.completada else None
                row = await conn.fetchrow(
                    "INSERT INTO progreso (academia_id, usuario_id, pildora_id, completada, completada_en) "
                    "VALUES ($1, $2, $3, $4, $5) "
                    "ON CONFLICT (academia_id, usuario_id, pildora_id) DO UPDATE "
                    "SET completada = EXCLUDED.completada, completada_en = EXCLUDED.completada_en "
                    "RETURNING pildora_id, completada, completada_en",
                    academia_uuid, usuario_uuid, pildora_uuid, data.completada, completada_en
                )
                
                # Actualizar gamificación
                points_change = 10 if data.completada else -10
                await conn.execute(
                    """
                    INSERT INTO gamificacion (academia_id, usuario_id, puntos, nivel, ultima_actividad)
                    VALUES ($1, $2, GREATEST(0, $3), GREATEST(1, 1 + $3 // 100), NOW())
                    ON CONFLICT (academia_id, usuario_id) DO UPDATE SET
                        puntos = GREATEST(0, gamificacion.puntos + $3),
                        nivel = GREATEST(1, 1 + (gamificacion.puntos + $3) / 100),
                        ultima_actividad = NOW()
                    """,
                    academia_uuid, usuario_uuid, points_change
                )
            else:
                # Si no cambió, retornar progreso actual
                row = await conn.fetchrow(
                    "SELECT pildora_id, completada, completada_en FROM progreso "
                    "WHERE academia_id = $1 AND usuario_id = $2 AND pildora_id = $3",
                    academia_uuid, usuario_uuid, pildora_uuid
                )
                
    return ProgresoResponse(
        pildora_id=str(row["pildora_id"]),
        completada=row["completada"],
        completada_en=row["completada_en"]
    )

@router.get("/cursos/{curso_id}/certificado", response_model=CertificadoResponse)
async def get_certificado(
    academia_id: str,
    curso_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    academia_uuid = uuid.UUID(academia_id)
    usuario_uuid = uuid.UUID(current_user.usuario_id)
    try:
        curso_uuid = uuid.UUID(curso_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de curso inválido.")
        
    pool = await get_pool()
    async with pool.acquire() as conn:
        # 1. Verificar si el curso existe y pertenece a la academia
        curso = await conn.fetchrow(
            "SELECT id, titulo, publicado FROM cursos WHERE id = $1 AND academia_id = $2",
            curso_uuid, academia_uuid
        )
        if not curso:
            raise HTTPException(status_code=404, detail="El curso no pertenece a esta academia.")
            
        # 2. Contar píldoras publicadas en este curso
        total_pildoras = await conn.fetchval(
            """
            SELECT COUNT(p.id) 
            FROM pildoras p 
            JOIN bloques b ON p.bloque_id = b.id 
            WHERE b.curso_id = $1 AND p.publicada = true AND b.academia_id = $2
            """,
            curso_uuid, academia_uuid
        )
        
        if total_pildoras == 0:
            raise HTTPException(
                status_code=400, 
                detail="El curso no tiene lecciones publicadas para generar un certificado."
            )
            
        # 3. Contar progreso completado por este usuario
        completadas = await conn.fetchval(
            """
            SELECT COUNT(pr.id) 
            FROM progreso pr 
            JOIN pildoras p ON pr.pildora_id = p.id 
            JOIN bloques b ON p.bloque_id = b.id 
            WHERE b.curso_id = $1 AND pr.usuario_id = $2 AND pr.completada = true AND b.academia_id = $3
            """,
            curso_uuid, usuario_uuid, academia_uuid
        )
        
        if completadas < total_pildoras:
            raise HTTPException(
                status_code=400, 
                detail=f"Curso incompleto. Has completado {completadas} de {total_pildoras} lecciones publicadas."
            )
            
        # 4. Obtener datos del estudiante, academia y fecha de última completación
        estudiante_nombre = await conn.fetchval(
            "SELECT nombre FROM usuarios WHERE id = $1 AND academia_id = $2",
            usuario_uuid, academia_uuid
        ) or "Estudiante"
        
        academia = await conn.fetchrow(
            "SELECT nombre, logo_url, color_acento FROM academias WHERE id = $1",
            academia_uuid
        )
        
        # Fecha de la última píldora completada en este curso por este usuario
        fecha_emision = await conn.fetchval(
            """
            SELECT MAX(pr.completada_en) 
            FROM progreso pr 
            JOIN pildoras p ON pr.pildora_id = p.id 
            JOIN bloques b ON p.bloque_id = b.id 
            WHERE b.curso_id = $1 AND pr.usuario_id = $2 AND pr.completada = true AND b.academia_id = $3
            """,
            curso_uuid, usuario_uuid, academia_uuid
        ) or datetime.now()
        
    hash_seed = f"{current_user.usuario_id}:{curso_id}".encode()
    certificado_id = hashlib.sha256(hash_seed).hexdigest()[:12].upper()
    
    fecha_emision_formateada = fecha_emision.strftime("%d/%m/%Y")
    
    return CertificadoResponse(
        certificado_id=certificado_id,
        nombre_estudiante=estudiante_nombre,
        nombre_curso=curso["titulo"],
        nombre_academia=academia["nombre"],
        logo_url=academia["logo_url"],
        color_acento=academia["color_acento"] or "#3DD68C",
        fecha_emision=fecha_emision,
        fecha_emision_formateada=fecha_emision_formateada
    )


@router.post("/pildoras/{pildora_id}/evaluar", response_model=ResultadoEvaluacion)
async def evaluar_pildora(
    academia_id: str,
    pildora_id: str,
    data: RespuestaPrueba,
    current_user: TokenData = Depends(get_current_user)
):
    import json
    academia_uuid = uuid.UUID(academia_id)
    usuario_uuid = uuid.UUID(current_user.usuario_id)
    try:
        pildora_uuid = uuid.UUID(pildora_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de lección inválido.")

    pool = await get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Obtener la píldora y verificar que exista y sea de tipo 'prueba'
            pildora = await conn.fetchrow(
                "SELECT tipo, contenido FROM pildoras WHERE id = $1 AND academia_id = $2",
                pildora_uuid, academia_uuid
            )
            if not pildora:
                raise HTTPException(status_code=404, detail="La lección no existe en esta academia.")
            if pildora["tipo"] != "prueba":
                raise HTTPException(status_code=400, detail="Esta lección no es de tipo evaluación.")
            
            # 2. Cargar el cuestionario JSON
            if not pildora["contenido"]:
                raise HTTPException(status_code=500, detail="Cuestionario no configurado en el servidor.")
            
            try:
                cuestionario = json.loads(pildora["contenido"])
                preguntas = cuestionario.get("preguntas", [])
            except Exception:
                raise HTTPException(status_code=500, detail="Error al decodificar la estructura del cuestionario.")
                
            if not preguntas:
                raise HTTPException(status_code=400, detail="El cuestionario no tiene preguntas formuladas.")
            
            # 3. Evaluar respuestas
            respuestas_usuario = data.respuestas
            correctas_count = 0
            feedback = {}
            
            for q in preguntas:
                q_id = q.get("id")
                ans_correcta = q.get("respuesta_correcta")
                ans_usuario = respuestas_usuario.get(q_id)
                
                # Comparar respuesta
                is_correct = (ans_usuario is not None and int(ans_usuario) == int(ans_correcta))
                feedback[q_id] = is_correct
                if is_correct:
                    correctas_count += 1
            
            total_preguntas = len(preguntas)
            nota = (correctas_count / total_preguntas) * 100.0 if total_preguntas > 0 else 0.0
            
            # Nota mínima aprobatoria: >= 70%
            aprobado = nota >= 70.0
            puntos_ganados = 0
            
            if aprobado:
                # Verificar si ya estaba completada para evitar sumar puntos doble
                prev_completada = await conn.fetchval(
                    "SELECT completada FROM progreso WHERE academia_id = $1 AND usuario_id = $2 AND pildora_id = $3",
                    academia_uuid, usuario_uuid, pildora_uuid
                )
                
                if not prev_completada:
                    # Registrar progreso completado
                    completada_en = datetime.now()
                    await conn.execute(
                        "INSERT INTO progreso (academia_id, usuario_id, pildora_id, completada, completada_en) "
                        "VALUES ($1, $2, $3, true, $4) "
                        "ON CONFLICT (academia_id, usuario_id, pildora_id) DO UPDATE SET "
                        "completada = true, completada_en = EXCLUDED.completada_en",
                        academia_uuid, usuario_uuid, pildora_uuid, completada_en
                    )
                    
                    # Otorgar 20 puntos por aprobar evaluación
                    puntos_ganados = 20
                    await conn.execute(
                        """
                        INSERT INTO gamificacion (academia_id, usuario_id, puntos, nivel, ultima_actividad)
                        VALUES ($1, $2, $3, GREATEST(1, 1 + $3 // 100), NOW())
                        ON CONFLICT (academia_id, usuario_id) DO UPDATE SET
                            puntos = GREATEST(0, gamificacion.puntos + $3),
                            nivel = GREATEST(1, 1 + (gamificacion.puntos + $3) / 100),
                            ultima_actividad = NOW()
                        """,
                        academia_uuid, usuario_uuid, puntos_ganados
                    )
            
            return ResultadoEvaluacion(
                aprobado=aprobado,
                nota=round(nota, 2),
                puntos_ganados=puntos_ganados,
                feedback=feedback
            )
