from datetime import datetime, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
from jose import JWTError, jwt
from pydantic import BaseModel
from app.config import settings
from app.database import get_pool

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verificar_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


Rol = Literal["super_admin", "admin_academia", "estudiante"]


class TokenData(BaseModel):
    usuario_id: str
    academia_id: str | None
    rol: Rol


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def crear_token(data: TokenData) -> str:
    payload = {
        **data.model_dump(),
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verificar_token(token: str = Depends(oauth2_scheme)) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenData(**payload)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")


@router.post("/login", response_model=Token)
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    x_tenant_slug: str | None = Header(None, alias="X-Tenant-Slug"),
    tenant: str | None = None
):
    slug = tenant or x_tenant_slug
    email_clean = form.username.lower().strip()
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        if slug:
            usuario = await conn.fetchrow(
                """
                SELECT u.id, u.academia_id, u.rol, u.password_hash 
                FROM usuarios u
                LEFT JOIN academias a ON u.academia_id = a.id
                WHERE u.email = $1 
                  AND u.activo = true 
                  AND (u.academia_id IS NULL OR (a.slug = $2 AND a.activa = true))
                """,
                email_clean,
                slug.lower().strip(),
            )
        else:
            usuario = await conn.fetchrow(
                """
                SELECT id, academia_id, rol, password_hash 
                FROM usuarios 
                WHERE email = $1 
                  AND activo = true 
                  AND academia_id IS NULL
                """,
                email_clean,
            )

    if not usuario or not verificar_password(form.password, usuario["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")

    token = crear_token(TokenData(
        usuario_id=str(usuario["id"]),
        academia_id=str(usuario["academia_id"]) if usuario["academia_id"] else None,
        rol=usuario["rol"],
    ))
    return Token(access_token=token)


@router.get("/me")
def me(token_data: TokenData = Depends(verificar_token)):
    return token_data
