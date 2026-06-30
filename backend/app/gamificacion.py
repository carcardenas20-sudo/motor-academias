import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_pool
from app.auth import TokenData, verificar_token
from app.dependencies import get_current_user, verify_academy_access

router = APIRouter(
    prefix="/academias/{academia_id}/gamificacion",
    tags=["gamificacion"],
    dependencies=[Depends(verify_academy_access)]
)

class GamificacionPerfilResponse(BaseModel):
    puntos: int
    nivel: int
    racha_dias: int

class LeaderboardEntry(BaseModel):
    nombre: str
    puntos: int
    nivel: int

@router.get("/perfil", response_model=GamificacionPerfilResponse)
async def get_gamificacion_perfil(
    academia_id: str,
    current_user: TokenData = Depends(get_current_user)
):
    academia_uuid = uuid.UUID(academia_id)
    usuario_uuid = uuid.UUID(current_user.usuario_id)
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT puntos, nivel, racha_dias FROM gamificacion "
            "WHERE academia_id = $1 AND usuario_id = $2",
            academia_uuid, usuario_uuid
        )
        if not row:
            # Perfil por defecto
            return GamificacionPerfilResponse(puntos=0, nivel=1, racha_dias=0)
            
    return GamificacionPerfilResponse(
        puntos=row["puntos"],
        nivel=row["nivel"],
        racha_dias=row["racha_dias"]
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    academia_id: str
):
    academia_uuid = uuid.UUID(academia_id)
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Consulta cruzando con usuarios para mostrar el nombre del estudiante
        rows = await conn.fetch(
            "SELECT u.nombre, g.puntos, g.nivel FROM gamificacion g "
            "JOIN usuarios u ON g.usuario_id = u.id "
            "WHERE g.academia_id = $1 "
            "ORDER BY g.puntos DESC, g.nivel DESC LIMIT 10",
            academia_uuid
        )
    
    return [
        LeaderboardEntry(
            nombre=row["nombre"] or "Estudiante Anónimo",
            puntos=row["puntos"],
            nivel=row["nivel"]
        ) for row in rows
    ]
