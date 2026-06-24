-- ============================================================
-- El 42 Motos — Esquema de base de datos (Supabase PostgreSQL)
-- ============================================================
-- Ejecutalo en el SQL Editor de Supabase Dashboard.
-- Crea tablas, políticas RLS y datos iniciales.

-- 1. TABLA DE MOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS motos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  condicion TEXT NOT NULL CHECK (condicion IN ('0km', 'usada')),
  precio NUMERIC,
  precio_texto TEXT,
  img TEXT NOT NULL DEFAULT 'img/placeholder.jpg',
  disponible BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE CONFIGURACIÓN FINANCIERA
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SEED — Configuración financiera por defecto
-- ============================================================
INSERT INTO configuracion (clave, valor) VALUES
('financiera', '{
  "entregaMinimaPct": 20,
  "entregaInicialPct": 30,
  "gastoAdministrativoPct": 0,
  "gastoFijo": 0,
  "redondeo": 100,
  "planInicial": 12,
  "disclaimer": "Simulación orientativa. La cuota final puede variar según aprobación crediticia, gastos, patentamiento, seguros y vigencia de precios.",
  "planes": [
    { "cuotas": 6, "recargoTotalPct": 18, "nombre": "6 cuotas" },
    { "cuotas": 12, "recargoTotalPct": 38, "nombre": "12 cuotas" },
    { "cuotas": 18, "recargoTotalPct": 62, "nombre": "18 cuotas" },
    { "cuotas": 24, "recargoTotalPct": 92, "nombre": "24 cuotas" }
  ]
}')
ON CONFLICT (clave) DO NOTHING;

-- 4. SEED — Inventario inicial de motos
-- ============================================================
INSERT INTO motos (nombre, condicion, precio, precio_texto, img, disponible, orden) VALUES
  ('Honda Navi',               '0km',   3400000, NULL,            'img/moto-navi.jpg',      true,  1),
  ('Gilera Smash Base 110',    '0km',   1650000, NULL,            'img/moto-smashbase.jpg', true,  2),
  ('Gilera Smash',             '0km',   2150000, NULL,            'img/moto-smash.jpg',     true,  3),
  ('Gilera SMX 200',           '0km',   2500000, NULL,            'img/moto-smx200.jpg',    true,  4),
  ('Yamaha XTZ 125',           '0km',   5900000, NULL,            'img/moto-xtz125.jpg',    true,  5),
  ('Yamaha 125',               '0km',   4900000, NULL,            'img/moto-yamaha125.jpg', true,  6),
  ('IKA 110',                  '0km',   1300000, NULL,            'img/moto-ika.jpg',       true,  7),
  ('Keller Miracle 150',       '0km',   2400000, NULL,            'img/moto-miracle150.jpg',true,  8),
  ('Keeway 150',               'usada', 1900000, NULL,            'img/moto-keeway.jpg',    true,  9),
  ('Honda Wave',               'usada', 3400000, NULL,            'img/moto-wave.jpg',      true, 10),
  ('Suzuki GSX-S 750',         'usada', NULL,    'USD 13.000',   'img/moto-gsxs750.jpg',   true, 11),
  ('Mondial TD 250',           'usada', 2400000, NULL,            'img/moto-mondial250.jpg',true, 12),
  ('Keller Crono Classic',     'usada', 990000,  NULL,            'img/moto-crono.jpg',     true, 13),
  ('Zanella Styler',           'usada', 1400000, NULL,            'img/moto-styler.jpg',    true, 14)
ON CONFLICT DO NOTHING;

-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE motos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Público anónimo: solo ver motos disponibles
DROP POLICY IF EXISTS "Lectura pública de motos disponibles" ON motos;
CREATE POLICY "Lectura pública de motos disponibles" ON motos
  FOR SELECT USING (disponible = true);

-- Público anónimo: leer configuración
DROP POLICY IF EXISTS "Lectura pública de configuración" ON configuracion;
CREATE POLICY "Lectura pública de configuración" ON configuracion
  FOR SELECT USING (true);

-- Admin autenticado: acceso total a motos
DROP POLICY IF EXISTS "Admin full access motos" ON motos;
CREATE POLICY "Admin full access motos" ON motos
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Admin autenticado: acceso total a configuración
DROP POLICY IF EXISTS "Admin full access config" ON configuracion;
CREATE POLICY "Admin full access config" ON configuracion
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 6. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_motos_updated_at ON motos;
CREATE TRIGGER trg_motos_updated_at
  BEFORE UPDATE ON motos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_config_updated_at ON configuracion;
CREATE TRIGGER trg_config_updated_at
  BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
