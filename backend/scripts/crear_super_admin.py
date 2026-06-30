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

    from app.database import get_connection_args
    clean_url, ssl_ctx = get_connection_args(settings.database_url)
    conn = await asyncpg.connect(clean_url, ssl=ssl_ctx)
    
    try:
        # 1. Crear / actualizar super_admin
        row = await conn.fetchrow(
            """
            INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol, activo)
            VALUES (NULL, $1, $2, $3, 'super_admin', true)
            ON CONFLICT (email) WHERE academia_id IS NULL DO UPDATE
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

        # 2. Inicializar academia "Apuesta con cabeza" si no existe
        academia_row = await conn.fetchrow(
            """
            INSERT INTO academias (slug, nombre, descripcion, color_acento, activa)
            VALUES ('apuesta-con-cabeza', 'Apuesta con cabeza', 'Academia de educación en apuestas deportivas para colombianos.', '#3DD68C', true)
            ON CONFLICT (slug) DO UPDATE
                SET nombre = EXCLUDED.nombre,
                    descripcion = EXCLUDED.descripcion,
                    color_acento = EXCLUDED.color_acento
            RETURNING id, slug, nombre
            """
        )
        print("\nAcademia demo lista:")
        print(f"   id:     {academia_row['id']}")
        print(f"   slug:   {academia_row['slug']}")
        print(f"   nombre: {academia_row['nombre']}")

        # 3. Crear / actualizar admin de la academia "Apuesta con cabeza"
        admin_email = "admin@apuesta.com"
        admin_pass = "Apuesta123!"
        admin_pass_hash = hash_password(admin_pass)
        admin_row = await conn.fetchrow(
            """
            INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol, activo)
            VALUES ($1, $2, $3, 'Administrador Apuesta', 'admin_academia', true)
            ON CONFLICT (academia_id, email) WHERE academia_id IS NOT NULL DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    nombre        = EXCLUDED.nombre,
                    rol           = 'admin_academia',
                    activo        = true
            RETURNING id, email, rol
            """,
            academia_row['id'], admin_email, admin_pass_hash
        )
        print("\nAdministrador de academia demo listo:")
        print(f"   id:       {admin_row['id']}")
        print(f"   email:    {admin_row['email']} (contraseña: {admin_pass})")
        print(f"   rol:      {admin_row['rol']}")
        print(f"   academia: {academia_row['nombre']} ({academia_row['id']})")

        # 4. Crear / actualizar estudiante de prueba
        student_email = "estudiante@apuesta.com"
        student_pass = "Apuesta123!"
        student_pass_hash = hash_password(student_pass)
        student_row = await conn.fetchrow(
            """
            INSERT INTO usuarios (academia_id, email, password_hash, nombre, rol, activo)
            VALUES ($1, $2, $3, 'Estudiante Prueba', 'estudiante', true)
            ON CONFLICT (academia_id, email) WHERE academia_id IS NOT NULL DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    nombre        = EXCLUDED.nombre,
                    rol           = 'estudiante',
                    activo        = true
            RETURNING id, email, rol
            """,
            academia_row['id'], student_email, student_pass_hash
        )
        print("\nEstudiante demo listo:")
        print(f"   id:       {student_row['id']}")
        print(f"   email:    {student_row['email']} (contraseña: {student_pass})")
        print(f"   rol:      {student_row['rol']}")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
