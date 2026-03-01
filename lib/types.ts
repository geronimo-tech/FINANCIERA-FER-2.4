export type FrecuenciaPago = 'mensual' | 'quincenal' | 'semanal'

export interface PagoMensual {
  id: string
  mes: number // 1, 2, 3...
  fechaCobro: string
  montoCobro: number // Interes o cuota por periodo
  pagado: boolean
  fechaPago: string | null
  notas: string | null
}

export interface Prestamo {
  id: string
  nombreCliente: string
  fechaSolicitud: string
  montoCapital: number
  tasaInteres: number // Porcentaje (ej: 20 = 20%)
  montoInteresMensual: number
  frecuenciaPago: FrecuenciaPago // semanal, quincenal, mensual
  montoCuota: number // Monto por periodo (para semanal/quincenal)
  fotoINE: string | null
  domicilio: string
  telefono: string
  estado: 'activo' | 'pagado'
  pagosMensuales: PagoMensual[]
  createdAt: string
  updatedAt: string
}

export interface PrestamoFormData {
  nombreCliente: string
  fechaSolicitud: string
  montoCapital: number
  tasaInteres: number // Porcentaje (ej: 20)
  frecuenciaPago: FrecuenciaPago
  montoCuota: number // Para semanal: cuota fija que el usuario define
  fotoINE: string | null
  domicilio: string
  telefono: string
}

export interface ConfiguracionRecordatorio {
  hora: string // HH:mm format
  activo: boolean
}

export interface Recordatorio {
  id: string
  nombre: string
  diasSemana: number[] // 0=Domingo, 1=Lunes, etc.
  hora: string // HH:mm format
  activo: boolean
  tipo: 'general' | 'vencidos' | 'proximos'
  createdAt: string
}
