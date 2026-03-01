-- Tabla de recordatorios personalizados
CREATE TABLE IF NOT EXISTS recordatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora TIME NOT NULL DEFAULT '09:00',
  dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Domingo, 6=Sabado
  repetir VARCHAR(20) DEFAULT 'una_vez' CHECK (repetir IN ('una_vez', 'diario', 'semanal', 'mensual')),
  activo BOOLEAN DEFAULT true,
  enviado BOOLEAN DEFAULT false,
  tipo VARCHAR(30) DEFAULT 'recordatorio' CHECK (tipo IN ('recordatorio', 'urgente', 'cobro', 'personalizado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuracion global de notificaciones
CREATE TABLE IF NOT EXISTS configuracion_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notificaciones_activas BOOLEAN DEFAULT true,
  hora_recordatorio_defecto TIME DEFAULT '09:00',
  dias_antes_vencimiento INTEGER DEFAULT 1,
  sonido_urgente BOOLEAN DEFAULT true,
  sonido_recordatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de historial de notificaciones enviadas
CREATE TABLE IF NOT EXISTS historial_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recordatorio_id UUID REFERENCES recordatorios(id) ON DELETE SET NULL,
  prestamo_id UUID REFERENCES prestamos(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT,
  tipo VARCHAR(30) NOT NULL,
  enviado_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leido BOOLEAN DEFAULT false
);

-- Indices para mejorar busquedas
CREATE INDEX IF NOT EXISTS idx_recordatorios_fecha ON recordatorios(fecha);
CREATE INDEX IF NOT EXISTS idx_recordatorios_prestamo ON recordatorios(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_recordatorios_activo ON recordatorios(activo);
CREATE INDEX IF NOT EXISTS idx_historial_prestamo ON historial_notificaciones(prestamo_id);
CREATE INDEX IF NOT EXISTS idx_historial_enviado ON historial_notificaciones(enviado_at);
