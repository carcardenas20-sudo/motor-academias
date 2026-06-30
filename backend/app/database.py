import ssl
import urllib.parse
import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


def get_connection_args(url: str) -> tuple[str, ssl.SSLContext | None]:
    """Genera la URL limpia y el contexto SSL si se requiere (por ejemplo, para Neon)."""
    ssl_ctx = None
    clean_url = url
    
    if "neon.tech" in url or "sslmode=require" in url or "sslmode=prefer" in url:
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        
        # Limpiar sslmode para evitar incompatibilidades con asyncpg
        parsed = urllib.parse.urlparse(url)
        query = urllib.parse.parse_qs(parsed.query)
        query.pop('sslmode', None)
        new_query = urllib.parse.urlencode(query, doseq=True)
        clean_url = urllib.parse.ParseResult(
            parsed.scheme, parsed.netloc, parsed.path,
            parsed.params, new_query, parsed.fragment
        ).geturl()
        
    return clean_url, ssl_ctx


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        clean_url, ssl_ctx = get_connection_args(settings.database_url)
        if ssl_ctx:
            _pool = await asyncpg.create_pool(clean_url, ssl=ssl_ctx)
        else:
            _pool = await asyncpg.create_pool(clean_url)
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
