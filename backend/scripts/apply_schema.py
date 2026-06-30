"""Aplica /db/schema.sql a la base de datos de Neon.

Uso (desde /backend, con el venv activado):
    .venv\\Scripts\\python scripts\\apply_schema.py

Lee DATABASE_URL de backend/.env vía app.config.settings.
"""
import asyncio
import sys
from pathlib import Path

# Permite importar `app.*` ejecutando el script desde /backend
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import asyncpg
from app.config import settings

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "db" / "schema.sql"


async def main():
    sql = SCHEMA_PATH.read_text(encoding="utf-8")
    print(f"Leyendo schema: {SCHEMA_PATH}")
    
    from app.database import get_connection_args
    clean_url, ssl_ctx = get_connection_args(settings.database_url)
    conn = await asyncpg.connect(clean_url, ssl=ssl_ctx)
    try:
        await conn.execute(sql)
        print("Schema aplicado correctamente.")

        tablas = await conn.fetch(
            "SELECT tablename FROM pg_tables "
            "WHERE schemaname = 'public' ORDER BY tablename"
        )
        print("\nTablas en la base de datos:")
        for t in tablas:
            print(f"  - {t['tablename']}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
