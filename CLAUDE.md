# Motor Academias

Plataforma multi-tenant de LMS (tipo Hotmart/Kajabi auto-hospedado).  
El primer tenant de validación es **"Apuesta con cabeza"** — academia de educación en apuestas deportivas para colombianos.  
Tentacle será el tenant #2 cuando el motor esté validado.

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind v4 (`@tailwindcss/vite`) — en `/frontend`
- **Backend:** FastAPI (Python 3.14) + asyncpg + JWT — en `/backend`
- **DB:** PostgreSQL en Neon (multi-tenant, todas las tablas tienen `academia_id`)
- **Deploy futuro:** Railway (dos servicios: frontend + backend)

## Estado actual (junio 2026)

- [x] Repositorio creado en GitHub: `carcardenas20-sudo/motor-academias`
- [x] Monorepo: `/frontend`, `/backend`, `/db`
- [x] Schema SQL multi-tenant en `/db/schema.sql` (pendiente aplicar a Neon)
- [x] Backend corriendo localmente en `http://localhost:8000`
- [x] Frontend corriendo localmente en `http://localhost:5173`
- [ ] Aplicar schema a Neon
- [ ] Auth end-to-end funcionando (login → JWT → /me)
- [ ] Panel super_admin para crear academias y admin_academia
- [ ] Panel admin_academia para gestionar cursos y estudiantes
- [ ] Área de estudiante: cursos, progreso, gamificación

## Roles

| Rol | Descripción |
|-----|-------------|
| `super_admin` | Carlos — gestiona todas las academias |
| `admin_academia` | Dueño de una academia (ej. "Apuesta con cabeza") |
| `estudiante` | Compra membresía y accede a cursos |

## Arrancar localmente

```bash
# Backend
cd backend
.venv\Scripts\uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
```

## Variables de entorno

- `backend/.env` — `DATABASE_URL` (Neon) + `JWT_SECRET`
- **No commitear `.env`**

## Próximos pasos

1. Aplicar `/db/schema.sql` a Neon
2. Crear primer `super_admin` en DB (INSERT manual o script)
3. Probar `POST /auth/login` con ese usuario
4. Construir UI de login en el frontend
