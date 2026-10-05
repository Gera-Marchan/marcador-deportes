-- ===================================================
-- ESQUEMA DE BASE DE DATOS POSTGRESQL PARA RENDER
-- Proyecto: Marcador Deportes SaaS Multi-usuario
-- ===================================================

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    google_id VARCHAR(255),
    overlay_key VARCHAR(128) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index para búsquedas rápidas por correo y por clave de overlay
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_overlay_key ON usuarios(overlay_key);


-- 2. TABLA DE PATROCINADORES POR USUARIO
CREATE TABLE IF NOT EXISTS patrocinadores (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    slogan TEXT,
    logo_url TEXT NOT NULL,
    duracion_seg INT DEFAULT 10,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patrocinadores_user ON patrocinadores(user_id);


-- 3. TABLA DE ESTADOS Y CONFIGURACIONES DE PARTIDO
CREATE TABLE IF NOT EXISTS estados_partido (
    overlay_key VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES usuarios(id) ON DELETE CASCADE,
    estado_json JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_estados_json ON estados_partido USING gin (estado_json);
