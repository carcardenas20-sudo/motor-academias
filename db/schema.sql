-- ─────────────────────────────────────────────
-- MOTOR ACADEMIAS — Schema base
-- Todas las tablas de nivel academia llevan academia_id (tenant_id)
-- ─────────────────────────────────────────────

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── NIVEL PLATAFORMA ───────────────────────

CREATE TABLE academias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,        -- "apuesta-con-cabeza"
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  logo_url     TEXT,
  color_acento TEXT DEFAULT '#3DD68C',      -- cada academia puede tener su color
  activa       BOOLEAN DEFAULT true,
  creada_en    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE usuarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id    UUID REFERENCES academias(id) ON DELETE CASCADE,  -- NULL para super_admin
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  nombre         TEXT,
  rol            TEXT NOT NULL CHECK (rol IN ('super_admin', 'admin_academia', 'estudiante')),
  activo         BOOLEAN DEFAULT true,
  creado_en      TIMESTAMPTZ DEFAULT now(),
  ultimo_acceso  TIMESTAMPTZ
);

-- ─── NIVEL ACADEMIA ─────────────────────────

CREATE TABLE cursos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  orden        INT DEFAULT 0,
  publicado    BOOLEAN DEFAULT false,
  creado_en    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bloques (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  curso_id    UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  orden       INT DEFAULT 0
);

CREATE TABLE pildoras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  bloque_id   UUID NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  tipo        TEXT DEFAULT 'video' CHECK (tipo IN ('video', 'texto', 'prueba')),
  contenido   TEXT,           -- URL del video o markdown del texto
  duracion_min INT,
  orden       INT DEFAULT 0,
  publicada   BOOLEAN DEFAULT false
);

CREATE TABLE membresias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  plan         TEXT DEFAULT 'basico',
  activa       BOOLEAN DEFAULT true,
  hotmart_id   TEXT,
  comprada_en  TIMESTAMPTZ DEFAULT now(),
  vence_en     TIMESTAMPTZ,
  UNIQUE (academia_id, usuario_id)
);

CREATE TABLE progreso (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pildora_id  UUID NOT NULL REFERENCES pildoras(id) ON DELETE CASCADE,
  completada  BOOLEAN DEFAULT false,
  completada_en TIMESTAMPTZ,
  UNIQUE (academia_id, usuario_id, pildora_id)
);

CREATE TABLE gamificacion (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  puntos      INT DEFAULT 0,
  nivel       INT DEFAULT 1,
  racha_dias  INT DEFAULT 0,
  ultima_actividad TIMESTAMPTZ,
  UNIQUE (academia_id, usuario_id)
);

-- ─── NIVEL NEGOCIO (panel maestro) ──────────

CREATE TABLE ventas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  usuario_id   UUID REFERENCES usuarios(id),
  monto        NUMERIC(12,2) NOT NULL,
  moneda       TEXT DEFAULT 'COP',
  tipo         TEXT DEFAULT 'unico' CHECK (tipo IN ('unico', 'suscripcion')),
  hotmart_id   TEXT,
  fecha        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE costos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  descripcion  TEXT NOT NULL,
  monto        NUMERIC(12,2) NOT NULL,
  categoria    TEXT,           -- "infraestructura", "marketing", "contenido"
  fecha        TIMESTAMPTZ DEFAULT now()
);

-- Índices básicos
CREATE INDEX idx_usuarios_academia ON usuarios(academia_id);
CREATE INDEX idx_cursos_academia ON cursos(academia_id);
CREATE INDEX idx_pildoras_bloque ON pildoras(bloque_id);
CREATE INDEX idx_progreso_usuario ON progreso(usuario_id, academia_id);
CREATE INDEX idx_membresias_usuario ON membresias(usuario_id, academia_id);
CREATE INDEX idx_ventas_academia ON ventas(academia_id);
