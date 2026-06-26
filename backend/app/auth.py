from datetime import datetime, timedelta
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from app.config import settings
from app.database import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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
def login(form: OAuth2PasswordRequestForm = Depends()):
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, academia_id, rol, password_hash FROM usuarios WHERE email = %s AND activo = true",
            (form.username,),
        )
        usuario = cur.fetchone()

    if not usuario or not pwd_context.verify(form.password, usuario["password_hash"]):
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
