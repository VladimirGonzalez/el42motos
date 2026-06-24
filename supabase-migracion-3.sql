-- ============================================================
-- El 42 Motos — Migración v3: Leads / formulario de contacto
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  moto_interes TEXT,
  mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Público puede insertar leads" ON leads;
CREATE POLICY "Público puede insertar leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin total leads" ON leads;
CREATE POLICY "Admin total leads" ON leads
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
