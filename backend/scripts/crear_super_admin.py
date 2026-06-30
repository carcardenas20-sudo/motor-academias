"""Crea (o actualiza) el usuario super_admin inicial.

Uso (desde /backend, con el venv activado):
    .venv\\Scripts\\python scripts\\crear_super_admin.py <email> <password> [nombre]

Ejemplo:
    .venv\\Scripts\\python scripts\\crear_super_admin.py carlos@motor.com MiClaveSegura123 "Carlos"

El super_admin no pertenece a ninguna academia: academia_id = NULL.
Usa la librería bcrypt directamente para evitar la incompatibilidad
passlib 1.7.4 + bcrypt 5.0 (passlib lee bcrypt.__about__.__version__,
que ya no existe). El hash $2b$ generado es 100% compatible con
passlib.verify() que usa el backend en /auth/login.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import asyncpg
import bcrypt
from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def main():
    if len(sys.argv) < 3:
        print("Uso: python scripts/crear_super_admin.py <email> <password> [nombre]")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    password = sys.argv[2]
    nombre = sys.argv[3] if len(sys.argv) > 3 else "Carlos"

    password_hash = hash_password(password)

    conn = await asyncpg.connect(settings.database_url)
    try:
        row = await conn.fetchrow(
            """
            INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol, activo)
            VALUES (NULL, $1, $2, $3, 'super_admin', true)
            ON CONFLICT (email) DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    nombre        = EXCLUDED.nombre,
                    rol           = 'super_admin',
                    activo        = true
            RETURNING id, email, rol
            """,
            email, password_hash, nombre,
        )
        print("super_admin listo:")
        print(f"   id:    {row['id']}")
        print(f"   email: {row['email']}")
        print(f"   rol:   {row['rol']}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
