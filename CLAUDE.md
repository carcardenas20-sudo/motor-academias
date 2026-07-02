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
- [x] Schema SQL multi-tenant en `/db/schema.sql`
- [x] Backend corriendo localmente en `http://localhost:8000`
- [x] Frontend corriendo localmente en `http://localhost:5173`
- [x] Aplicar schema a Neon
- [x] Auth end-to-end funcionando (login → JWT → /me)
- [x] Panel super_admin para crear academias y admin_academia
- [x] Panel admin_academia para gestionar cursos y estudiantes
- [x] Área de estudiante: cursos, progreso, gamificación

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

1. **Integración de Pagos:** Implementar la lógica del webhook de Hotmart para activar o revocar membresías premium automáticamente al recibir eventos de compra o reembolso.
2. **Almacenamiento Multimedia:** Configurar la carga de archivos adjuntos y contenido en la nube (ej. AWS S3 o Cloudinary) para las píldoras de aprendizaje de tipo texto o vídeo.
3. **Lecciones de Evaluación:** Desarrollar el soporte completo para píldoras tipo 'prueba' (cuestionarios interactivos y envío de respuestas por parte del estudiante).
4. **Despliegue Continuo:** Configurar el pipeline en Railway para el despliegue automático del frontend y backend desde GitHub.

