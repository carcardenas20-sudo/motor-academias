from fastapi import Depends, HTTPException, status
from app.auth import verificar_token, TokenData


def get_current_user(token_data: TokenData = Depends(verificar_token)) -> TokenData:
    return token_data


def get_current_super_admin(token_data: TokenData = Depends(verificar_token)) -> TokenData:
    if token_data.rol != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción."
        )
    return token_data


def require_admin_academia(token_data: TokenData = Depends(verificar_token)) -> TokenData:
    if token_data.rol not in ("admin_academia", "super_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador para realizar esta acción."
        )
    return token_data


def require_estudiante(token_data: TokenData = Depends(verificar_token)) -> TokenData:
    if token_data.rol != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere rol de estudiante."
        )
    return token_data


async def verify_academy_access(
    academia_id: str,
    token_data: TokenData = Depends(verificar_token)
) -> TokenData:
    """Verifica que el usuario tenga acceso a la academia especificada.
    
    El super_admin tiene acceso global. Los demás roles solo pueden acceder
    a la academia con el id que coincide con el academia_id de su token.
    """
    if token_data.rol == "super_admin":
        return token_data

    if not token_data.academia_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a los datos de esta academia."
        )

    try:
        import uuid
        token_uuid = uuid.UUID(str(token_data.academia_id))
        req_uuid = uuid.UUID(academia_id)
        if token_uuid != req_uuid:
            raise ValueError()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a los datos de esta academia."
        )

    # Verificar membresía activa para estudiantes
    if token_data.rol == "estudiante":
        from app.database import get_pool
        pool = await get_pool()
        async with pool.acquire() as conn:
            active = await conn.fetchval(
                "SELECT activa FROM membresias "
                "WHERE academia_id = $1 AND usuario_id = $2 AND activa = true "
                "AND (vence_en IS NULL OR vence_en > NOW())",
                req_uuid, uuid.UUID(token_data.usuario_id)
            )
            if not active:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="No tienes una membresía activa en esta academia."
                )

    return token_data

