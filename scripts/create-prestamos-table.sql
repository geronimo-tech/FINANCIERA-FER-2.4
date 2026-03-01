-- Tabla de préstamos para SOFiN Fernández Y Asociados
CREATE TABLE IF NOT EXISTS prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_cliente VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  domicilio TEXT,
  foto_ine TEXT,
  fecha_solicitud DATE NOT NULL,
  fecha_cobro DATE NOT NULL,
  monto_capital DECIMAL(12, 2) NOT NULL,
  tasa_interes DECIMAL(5, 4) NOT NULL,
  monto_interes DECIMAL(12, 2) NOT NULL,
  monto_total DECIMAL(12, 2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'pagado', 'vencido')),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_prestamos_nombre ON prestamos(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_prestamos_estado ON prestamos(estado);
CREATE INDEX IF NOT EXISTS idx_prestamos_fecha_cobro ON prestamos(fecha_cobro);
