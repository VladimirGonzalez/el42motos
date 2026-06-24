-- ============================================================
-- El 42 Motos — Migración v2: CRM + promos + multi-foto
-- ============================================================

-- 1. NUEVAS COLUMNAS EN MOTOS
ALTER TABLE motos ADD COLUMN IF NOT EXISTS destacada BOOLEAN DEFAULT false;
ALTER TABLE motos ADD COLUMN IF NOT EXISTS etiqueta TEXT;
ALTER TABLE motos ADD COLUMN IF NOT EXISTS precio_anterior NUMERIC;

-- 2. TABLA DE EVENTOS WHATSAPP (mini CRM)
CREATE TABLE IF NOT EXISTS eventos_whatsapp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('consulta_moto', 'cotizacion', 'consulta_general')),
  moto_id UUID REFERENCES motos(id) ON DELETE SET NULL,
  moto_nombre TEXT,
  mensaje TEXT,
  pagina TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA DE COTIZACIONES REGISTRADAS
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moto_nombre TEXT,
  precio NUMERIC,
  entrega NUMERIC,
  plan_cuotas INTEGER,
  cuota_estimada NUMERIC,
  total_estimado NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE PROMOCIONES / BANNERS
CREATE TABLE IF NOT EXISTS promociones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  emoji TEXT,
  color TEXT DEFAULT '#F2E600',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA DE IMÁGENES POR MOTO (galería)
CREATE TABLE IF NOT EXISTS moto_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moto_id UUID NOT NULL REFERENCES motos(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. SEED — Promoción inicial
INSERT INTO promociones (texto, emoji, activo) VALUES
  ('Financiación en hasta 24 cuotas — Consultá sin compromiso', '🏍️', true)
ON CONFLICT DO NOTHING;

-- 7. RLS — Políticas para las nuevas tablas
ALTER TABLE eventos_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;
ALTER TABLE moto_imagenes ENABLE ROW LEVEL SECURITY;

-- Público: puede INSERTAR eventos (para tracking)
DROP POLICY IF EXISTS "Público puede insertar eventos" ON eventos_whatsapp;
CREATE POLICY "Público puede insertar eventos" ON eventos_whatsapp
  FOR INSERT WITH CHECK (true);

-- Público: puede INSERTAR cotizaciones
DROP POLICY IF EXISTS "Público puede insertar cotizaciones" ON cotizaciones;
CREATE POLICY "Público puede insertar cotizaciones" ON cotizaciones
  FOR INSERT WITH CHECK (true);

-- Público: puede LEER promociones activas y moto_imagenes
DROP POLICY IF EXISTS "Público lee promociones activas" ON promociones;
CREATE POLICY "Público lee promociones activas" ON promociones
  FOR SELECT USING (activo = true);

DROP POLICY IF EXISTS "Público lee imágenes" ON moto_imagenes;
CREATE POLICY "Público lee imágenes" ON moto_imagenes
  FOR SELECT USING (true);

-- Solo admin autenticado: todo sobre todas las tablas nuevas
CREATE POLICY IF NOT EXISTS "Admin total eventos" ON eventos_whatsapp
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admin total cotizaciones" ON cotizaciones
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admin total promociones" ON promociones
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Admin total moto_imagenes" ON moto_imagenes
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 8. PERMITIR INSERT anónimo en la tabla motos ampliada (ya existe policy SELECT)
--    La policy de INSERT para anónimos no existe, pero los inserts van a eventos/cotizaciones, no a motos. OK.
