-- ─────────────────────────────────────────────
-- MOTOR ACADEMIAS — Schema base (Actualizado)
-- Todas las tablas de nivel academia llevan academia_id (tenant_id)
-- ─────────────────────────────────────────────

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función para actualizar el timestamp de actualizado_en automáticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Limpiar tablas si existen para permitir re-aplicar
DROP TABLE IF EXISTS costos CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
DROP TABLE IF EXISTS gamificacion CASCADE;
DROP TABLE IF EXISTS progreso CASCADE;
DROP TABLE IF EXISTS membresias CASCADE;
DROP TABLE IF EXISTS pildoras CASCADE;
DROP TABLE IF EXISTS bloques CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS academias CASCADE;

-- ─── NIVEL PLATAFORMA ───────────────────────

CREATE TABLE academias (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,        -- "apuesta-con-cabeza"
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  logo_url     TEXT,
  color_acento TEXT DEFAULT '#3DD68C',      -- cada academia puede tener su color
  activa       BOOLEAN DEFAULT true,
  creada_en    TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ
);

CREATE TABLE usuarios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id    UUID REFERENCES academias(id) ON DELETE CASCADE,  -- NULL para super_admin
  email          TEXT NOT NULL,                                     -- Unicidad garantizada por índices parciales abajo
  password_hash  TEXT NOT NULL,
  nombre         TEXT,
  rol            TEXT NOT NULL CHECK (rol IN ('super_admin', 'admin_academia', 'estudiante')),
  activo         BOOLEAN DEFAULT true,
  creado_en      TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ,
  ultimo_acceso  TIMESTAMPTZ
);

-- ─── NIVEL ACADEMIA ─────────────────────────

CREATE TABLE cursos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id  UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  descripcion  TEXT,
  orden        INT DEFAULT 0 CHECK (orden >= 0),
  publicado    BOOLEAN DEFAULT false,
  creado_en    TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ
);

CREATE TABLE bloques (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  curso_id    UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  orden       INT DEFAULT 0 CHECK (orden >= 0),
  creado_en   TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ
);

CREATE TABLE pildoras (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academia_id UUID NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
  bloque_id   UUID NOT NULL REFERENCES bloques(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  tipo        TEXT DEFAULT 'video' CHECK (tipo IN ('video', 'texto', 'prueba')),
  contenido   TEXT,           -- URL del video o markdown del texto
  duracion_min INT CHECK (duracion_min >= 0),
  orden       INT DEFAULT 0 CHECK (orden >= 0),
  publicada   BOOLEAN DEFAULT false,
  creado_en   TIMESTAMPTZ DEFAULT now(),
  actualizado_en TIMESTAMPTZ
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
  puntos      INT DEFAULT 0 CHECK (puntos >= 0),
  nivel       INT DEFAULT 1 CHECK (nivel >= 1),
  racha_dias  INT DEFAULT 0 CHECK (racha_dias >= 0),
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

-- ─── ÍNDICES Y CONSTRAINTS DE UNICIDAD ──────

-- 1. Unicidad de email en multi-tenant
-- Super admin único globalmente (academia_id IS NULL)
CREATE UNIQUE INDEX idx_usuarios_super_admin_email 
ON usuarios(email) 
WHERE academia_id IS NULL;

-- Email único por academia para otros roles (academia_id IS NOT NULL)
CREATE UNIQUE INDEX idx_usuarios_tenant_email 
ON usuarios(academia_id, email) 
WHERE academia_id IS NOT NULL;

-- 2. Índices de optimización y búsquedas comunes
CREATE INDEX idx_academias_activa ON academias(activa);
CREATE INDEX idx_usuarios_academia ON usuarios(academia_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

CREATE INDEX idx_cursos_academia ON cursos(academia_id);
CREATE INDEX idx_cursos_publicado_orden ON cursos(publicado, orden);

CREATE INDEX idx_bloques_curso ON bloques(curso_id);
CREATE INDEX idx_bloques_academia_curso ON bloques(academia_id, curso_id);

CREATE INDEX idx_pildoras_bloque ON pildoras(bloque_id);
CREATE INDEX idx_pildoras_publicada ON pildoras(publicada);

CREATE INDEX idx_membresias_usuario ON membresias(usuario_id, academia_id);
CREATE INDEX idx_membresias_activa_vence ON membresias(activa, vence_en);
CREATE UNIQUE INDEX idx_membresias_hotmart_id ON membresias(hotmart_id) WHERE hotmart_id IS NOT NULL;

CREATE INDEX idx_progreso_usuario ON progreso(usuario_id, academia_id);
CREATE INDEX idx_progreso_pildora_completada ON progreso(pildora_id, completada);

CREATE INDEX idx_gamificacion_usuario ON gamificacion(usuario_id, academia_id);
CREATE INDEX idx_gamificacion_leaderboard ON gamificacion(puntos DESC, nivel DESC);

CREATE INDEX idx_ventas_academia ON ventas(academia_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE UNIQUE INDEX idx_ventas_hotmart_id ON ventas(hotmart_id) WHERE hotmart_id IS NOT NULL;

CREATE INDEX idx_costos_academia_fecha ON costos(academia_id, fecha);
CREATE INDEX idx_costos_categoria ON costos(categoria);

-- ─── TRIGGERS PARA ACTUALIZADO_EN ───────────
CREATE TRIGGER set_timestamp_academias
BEFORE UPDATE ON academias
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_cursos
BEFORE UPDATE ON cursos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_bloques
BEFORE UPDATE ON bloques
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_pildoras
BEFORE UPDATE ON pildoras
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
