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
