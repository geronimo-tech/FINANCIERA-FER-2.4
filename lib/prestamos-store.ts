'use client'

import type { Prestamo, PrestamoFormData, PagoMensual, ConfiguracionRecordatorio, Recordatorio, FrecuenciaPago } from './types'

const STORAGE_KEY = 'sofin_prestamos'
const RECORDATORIO_KEY = 'sofin_recordatorio'
const RECORDATORIOS_KEY = 'sofin_recordatorios_lista'

export function getPrestamos(): Prestamo[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

export function savePrestamos(prestamos: Prestamo[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prestamos))
}

// Helper function to get the last day of a month
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// Generar pagos segun frecuencia
function generarPagos(
  fechaSolicitud: string, 
  montoPorPeriodo: number, 
  frecuencia: FrecuenciaPago, 
  periodos?: number
): PagoMensual[] {
  const pagos: PagoMensual[] = []
  const [year, month, day] = fechaSolicitud.split('-').map(Number)
  const diaOriginal = day

  if (frecuencia === 'semanal') {
    const totalPeriodos = periodos || 48 // 48 semanas por defecto
    const fechaBase = new Date(year, month - 1, day)
    for (let i = 1; i <= totalPeriodos; i++) {
      const fecha = new Date(fechaBase.getTime())
      fecha.setDate(fechaBase.getDate() + (i * 7))
      const yyyy = fecha.getFullYear()
      const mm = String(fecha.getMonth() + 1).padStart(2, '0')
      const dd = String(fecha.getDate()).padStart(2, '0')
      pagos.push({
        id: crypto.randomUUID(),
        mes: i,
        fechaCobro: `${yyyy}-${mm}-${dd}`,
        montoCobro: montoPorPeriodo,
        pagado: false,
        fechaPago: null,
        notas: null,
      })
    }
  } else if (frecuencia === 'quincenal') {
    const totalPeriodos = periodos || 24 // 24 quincenas por defecto
    const fechaBase = new Date(year, month - 1, day)
    for (let i = 1; i <= totalPeriodos; i++) {
      const fecha = new Date(fechaBase.getTime())
      fecha.setDate(fechaBase.getDate() + (i * 15))
      const yyyy = fecha.getFullYear()
      const mm = String(fecha.getMonth() + 1).padStart(2, '0')
      const dd = String(fecha.getDate()).padStart(2, '0')
      pagos.push({
        id: crypto.randomUUID(),
        mes: i,
        fechaCobro: `${yyyy}-${mm}-${dd}`,
        montoCobro: montoPorPeriodo,
        pagado: false,
        fechaPago: null,
        notas: null,
      })
    }
  } else {
    // Mensual (comportamiento original)
    const totalPeriodos = periodos || 12
    for (let i = 1; i <= totalPeriodos; i++) {
      let targetMonth = month - 1 + i
      let targetYear = year
      while (targetMonth > 11) {
        targetMonth -= 12
        targetYear++
      }
      const lastDayOfMonth = getLastDayOfMonth(targetYear, targetMonth)
      const targetDay = Math.min(diaOriginal, lastDayOfMonth)
      const yyyy = targetYear
      const mm = String(targetMonth + 1).padStart(2, '0')
      const dd = String(targetDay).padStart(2, '0')
      pagos.push({
        id: crypto.randomUUID(),
        mes: i,
        fechaCobro: `${yyyy}-${mm}-${dd}`,
        montoCobro: montoPorPeriodo,
        pagado: false,
        fechaPago: null,
        notas: null,
      })
    }
  }
  
  return pagos
}

// Obtener clientes previos para autocompletado
export function getClientesPrevios(): { nombreCliente: string; telefono: string; domicilio: string }[] {
  const prestamos = getPrestamos()
  const clientesMap = new Map<string, { nombreCliente: string; telefono: string; domicilio: string }>()
  
  prestamos.forEach((p) => {
    if (!clientesMap.has(p.telefono)) {
      clientesMap.set(p.telefono, {
        nombreCliente: p.nombreCliente,
        telefono: p.telefono,
        domicilio: p.domicilio,
      })
    }
  })
  
  return Array.from(clientesMap.values())
}

// Calcular interes cobrado por mes/anio
export function getInteresCobradoPorMes(mes: number, anio: number): number {
  const prestamos = getPrestamos()
  let totalInteres = 0

  prestamos.forEach((p) => {
    p.pagosMensuales.forEach((pago) => {
      if (pago.pagado && pago.fechaPago) {
        const [year, month] = pago.fechaPago.split('-').map(Number)
        if (month - 1 === mes && year === anio) {
          totalInteres += pago.montoCobro
        }
      }
    })
  })

  return totalInteres
}

export function createPrestamo(formData: PrestamoFormData): Prestamo {
  const frecuencia = formData.frecuenciaPago || 'mensual'
  const tasaDecimal = formData.tasaInteres / 100
  const montoInteresMensual = formData.montoCapital * tasaDecimal

  // Calcular monto por periodo segun frecuencia
  let montoPorPeriodo: number
  let montoCuota: number

  if (frecuencia === 'semanal') {
    // Semanal: el usuario define la cuota directamente
    montoCuota = formData.montoCuota || 0
    montoPorPeriodo = montoCuota
  } else if (frecuencia === 'quincenal') {
    // Quincenal: interes mensual x 2 
    montoCuota = montoInteresMensual * 2
    montoPorPeriodo = montoCuota
  } else {
    // Mensual: interes normal
    montoCuota = montoInteresMensual
    montoPorPeriodo = montoInteresMensual
  }

  const prestamo: Prestamo = {
    id: crypto.randomUUID(),
    nombreCliente: formData.nombreCliente,
    fechaSolicitud: formData.fechaSolicitud,
    montoCapital: formData.montoCapital,
    tasaInteres: formData.tasaInteres,
    montoInteresMensual,
    frecuenciaPago: frecuencia,
    montoCuota,
    fotoINE: formData.fotoINE,
    domicilio: formData.domicilio,
    telefono: formData.telefono,
    estado: 'activo',
    pagosMensuales: generarPagos(formData.fechaSolicitud, montoPorPeriodo, frecuencia),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const prestamos = getPrestamos()
  prestamos.unshift(prestamo)
  savePrestamos(prestamos)

  return prestamo
}

export function updatePrestamo(id: string, updates: Partial<Prestamo>): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === id)

  if (index === -1) return null

  const updatedPrestamo = {
    ...prestamos[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  // Actualizar campos de cliente
  if (updates.nombreCliente !== undefined) {
    updatedPrestamo.nombreCliente = updates.nombreCliente
  }
  if (updates.telefono !== undefined) {
    updatedPrestamo.telefono = updates.telefono
  }
  if (updates.domicilio !== undefined) {
    updatedPrestamo.domicilio = updates.domicilio
  }
  if (updates.fechaSolicitud !== undefined) {
    updatedPrestamo.fechaSolicitud = updates.fechaSolicitud
  }

  // Recalcular interes mensual si cambia el capital o la tasa
  if (updates.montoCapital !== undefined || updates.tasaInteres !== undefined) {
    const capital = updates.montoCapital ?? prestamos[index].montoCapital
    const tasa = updates.tasaInteres ?? prestamos[index].tasaInteres
    const nuevoInteresMensual = capital * (tasa / 100)
    updatedPrestamo.montoInteresMensual = nuevoInteresMensual
    updatedPrestamo.montoCapital = capital
    updatedPrestamo.tasaInteres = tasa
    
    // Actualizar todos los pagos pendientes con el nuevo monto de interes
    updatedPrestamo.pagosMensuales = updatedPrestamo.pagosMensuales.map((pago) => {
      if (!pago.pagado) {
        return {
          ...pago,
          montoCobro: nuevoInteresMensual,
        }
      }
      return pago
    })
  }

  prestamos[index] = updatedPrestamo
  savePrestamos(prestamos)

  return updatedPrestamo
}

export function deletePrestamo(id: string): boolean {
  const prestamos = getPrestamos()
  const filtered = prestamos.filter((p) => p.id !== id)

  if (filtered.length === prestamos.length) return false

  savePrestamos(filtered)
  return true
}

export function getPrestamoById(id: string): Prestamo | null {
  const prestamos = getPrestamos()
  return prestamos.find((p) => p.id === id) ?? null
}

export function getEstadisticas() {
  const prestamos = getPrestamos()

  const totalCapital = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((sum, p) => sum + p.montoCapital, 0)

  const totalInteresesMensuales = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((sum, p) => sum + p.montoInteresMensual, 0)

  // Calcular pagos pendientes del mes actual
  const hoy = new Date()
  const mesActual = hoy.getMonth()
  const anioActual = hoy.getFullYear()
  
  let pagosPendientesEsteMes = 0
  let pagosCompletadosEsteMes = 0
  
  prestamos.filter((p) => p.estado === 'activo').forEach((p) => {
    p.pagosMensuales.forEach((pago) => {
      // Parse date as local time to avoid timezone issues
      const [year, month, day] = pago.fechaCobro.split('-').map(Number)
      const fechaCobro = new Date(year, month - 1, day)
      if (fechaCobro.getMonth() === mesActual && fechaCobro.getFullYear() === anioActual) {
        if (pago.pagado) {
          pagosCompletadosEsteMes++
        } else {
          pagosPendientesEsteMes++
        }
      }
    })
  })

  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo').length
  const prestamosPagados = prestamos.filter((p) => p.estado === 'pagado').length

  return {
    totalCapital,
    totalInteresesMensuales,
    pagosPendientesEsteMes,
    pagosCompletadosEsteMes,
    prestamosActivos,
    prestamosPagados,
    totalPrestamos: prestamos.length,
  }
}

// Marcar pago mensual como pagado o pendiente
export function marcarPagoMensual(prestamoId: string, pagoId: string, pagado: boolean, notas?: string): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const pagoIndex = prestamo.pagosMensuales.findIndex((p) => p.id === pagoId)
  
  if (pagoIndex === -1) return null

  prestamo.pagosMensuales[pagoIndex] = {
    ...prestamo.pagosMensuales[pagoIndex],
    pagado,
    fechaPago: pagado ? new Date().toISOString().split('T')[0] : null,
    notas: notas || prestamo.pagosMensuales[pagoIndex].notas,
  }

  // Verificar si todos los pagos estan completos y el capital fue devuelto
  const todosPagados = prestamo.pagosMensuales.every((p) => p.pagado)
  if (todosPagados) {
    prestamo.estado = 'pagado'
  }

  prestamo.updatedAt = new Date().toISOString()
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Agregar mas meses de pago
export function agregarMesesPago(prestamoId: string, meses: number): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)
  
  if (index === -1) return null
  
  const prestamo = prestamos[index]
  const ultimoPago = prestamo.pagosMensuales[prestamo.pagosMensuales.length - 1]
  // Parse the date as local time to avoid timezone issues
  const [year, month, day] = ultimoPago.fechaCobro.split('-').map(Number)
  
  // Get the original day from the first payment to maintain consistency
  const primerPago = prestamo.pagosMensuales[0]
  const [, , diaOriginal] = primerPago.fechaCobro.split('-').map(Number)
  
  const ultimoMes = ultimoPago.mes
  
  for (let i = 1; i <= meses; i++) {
    // Calculate the target month and year from the last payment
    let targetMonth = month - 1 + i // month is 1-indexed, JS months are 0-indexed
    let targetYear = year
    
    // Handle year overflow
    while (targetMonth > 11) {
      targetMonth -= 12
      targetYear++
    }
    
    // Get the last day of the target month
    const lastDayOfMonth = getLastDayOfMonth(targetYear, targetMonth)
    
    // Use the original day, or the last day of the month if it doesn't exist
    const targetDay = Math.min(diaOriginal, lastDayOfMonth)
    
    // Format as YYYY-MM-DD
    const yyyy = targetYear
    const mm = String(targetMonth + 1).padStart(2, '0')
    const dd = String(targetDay).padStart(2, '0')
  
    prestamo.pagosMensuales.push({
      id: crypto.randomUUID(),
      mes: ultimoMes + i,
      fechaCobro: `${yyyy}-${mm}-${dd}`,
      montoCobro: prestamo.montoInteresMensual,
      pagado: false,
      fechaPago: null,
      notas: null,
    })
  }

  prestamo.updatedAt = new Date().toISOString()
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Modificar monto de un pago especifico (para atrasos, cargos extra, etc)
export function modificarMontoPago(prestamoId: string, pagoId: string, nuevoMonto: number): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const pagoIndex = prestamo.pagosMensuales.findIndex((p) => p.id === pagoId)
  
  if (pagoIndex === -1) return null

  prestamo.pagosMensuales[pagoIndex].montoCobro = nuevoMonto
  prestamo.updatedAt = new Date().toISOString()
  
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Modificar fecha de cobro de un pago especifico
export function modificarFechaPago(prestamoId: string, pagoId: string, nuevaFecha: string): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const pagoIndex = prestamo.pagosMensuales.findIndex((p) => p.id === pagoId)
  
  if (pagoIndex === -1) return null

  prestamo.pagosMensuales[pagoIndex].fechaCobro = nuevaFecha
  prestamo.updatedAt = new Date().toISOString()
  
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Modificar el dia de cobro de TODOS los pagos de un prestamo
export function modificarDiaCobroTodos(prestamoId: string, nuevoDia: number): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  
  // Actualizar el dia de cobro de todos los pagos
  prestamo.pagosMensuales = prestamo.pagosMensuales.map((pago) => {
    const [year, month] = pago.fechaCobro.split('-').map(Number)
    
    // Get the last day of the month to handle cases where new day exceeds month length
    const lastDayOfMonth = getLastDayOfMonth(year, month - 1)
    const diaAjustado = Math.min(nuevoDia, lastDayOfMonth)
    
    // Format the new date
    const mm = String(month).padStart(2, '0')
    const dd = String(diaAjustado).padStart(2, '0')
    
    return {
      ...pago,
      fechaCobro: `${year}-${mm}-${dd}`,
    }
  })
  
  prestamo.updatedAt = new Date().toISOString()
  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Cambiar la frecuencia de pago de un prestamo y regenerar pagos pendientes
export function cambiarFrecuenciaPago(
  prestamoId: string, 
  nuevaFrecuencia: FrecuenciaPago,
  montoCuota?: number // Solo requerido para semanal
): Prestamo | null {
  const prestamos = getPrestamos()
  const index = prestamos.findIndex((p) => p.id === prestamoId)

  if (index === -1) return null

  const prestamo = prestamos[index]
  const frecuenciaAnterior = prestamo.frecuenciaPago

  if (frecuenciaAnterior === nuevaFrecuencia) return prestamo

  // Guardar pagos ya pagados
  const pagosPagados = prestamo.pagosMensuales.filter((p) => p.pagado)

  // Calcular nuevo monto por periodo
  const tasaDecimal = prestamo.tasaInteres / 100
  const montoInteresMensual = prestamo.montoCapital * tasaDecimal
  let montoPorPeriodo: number
  let nuevaMontoCuota: number

  if (nuevaFrecuencia === 'semanal') {
    nuevaMontoCuota = montoCuota || 0
    montoPorPeriodo = nuevaMontoCuota
  } else if (nuevaFrecuencia === 'quincenal') {
    nuevaMontoCuota = montoInteresMensual * 2
    montoPorPeriodo = nuevaMontoCuota
  } else {
    nuevaMontoCuota = montoInteresMensual
    montoPorPeriodo = montoInteresMensual
  }

  // Generar nuevos pagos desde la fecha de solicitud
  const nuevosPagos = generarPagos(prestamo.fechaSolicitud, montoPorPeriodo, nuevaFrecuencia)

  // Combinar: mantener los pagados y agregar los nuevos que no se superpongan
  prestamo.frecuenciaPago = nuevaFrecuencia
  prestamo.montoCuota = nuevaMontoCuota
  prestamo.montoInteresMensual = nuevaFrecuencia === 'mensual' ? montoInteresMensual : nuevaMontoCuota
  prestamo.pagosMensuales = [...pagosPagados, ...nuevosPagos.slice(pagosPagados.length)]
  prestamo.updatedAt = new Date().toISOString()

  prestamos[index] = prestamo
  savePrestamos(prestamos)

  return prestamo
}

// Obtener pagos pendientes para recordatorios
export function getPagosPendientesHoy(): { prestamo: Prestamo; pago: PagoMensual }[] {
  const prestamos = getPrestamos()
  const hoy = new Date().toISOString().split('T')[0]
  const pendientes: { prestamo: Prestamo; pago: PagoMensual }[] = []

  prestamos.filter((p) => p.estado === 'activo').forEach((prestamo) => {
    prestamo.pagosMensuales.forEach((pago) => {
      if (!pago.pagado && pago.fechaCobro <= hoy) {
        pendientes.push({ prestamo, pago })
      }
    })
  })

  return pendientes
}

// Configuracion de recordatorios
export function getConfiguracionRecordatorio(): ConfiguracionRecordatorio {
  if (typeof window === 'undefined') return { hora: '09:00', activo: false }
  const data = localStorage.getItem(RECORDATORIO_KEY)
  return data ? JSON.parse(data) : { hora: '09:00', activo: false }
}

export function saveConfiguracionRecordatorio(config: ConfiguracionRecordatorio): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECORDATORIO_KEY, JSON.stringify(config))
}

// Funciones para manejar recordatorios personalizados
export function getRecordatorios(): Recordatorio[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(RECORDATORIOS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveRecordatorios(recordatorios: Recordatorio[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(RECORDATORIOS_KEY, JSON.stringify(recordatorios))
}

export function createRecordatorio(data: Omit<Recordatorio, 'id' | 'createdAt'>): Recordatorio {
  const recordatorio: Recordatorio = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  
  const recordatorios = getRecordatorios()
  recordatorios.push(recordatorio)
  saveRecordatorios(recordatorios)
  
  return recordatorio
}

export function updateRecordatorio(id: string, updates: Partial<Recordatorio>): Recordatorio | null {
  const recordatorios = getRecordatorios()
  const index = recordatorios.findIndex((r) => r.id === id)
  
  if (index === -1) return null
  
  recordatorios[index] = { ...recordatorios[index], ...updates }
  saveRecordatorios(recordatorios)
  
  return recordatorios[index]
}

export function deleteRecordatorio(id: string): boolean {
  const recordatorios = getRecordatorios()
  const filtered = recordatorios.filter((r) => r.id !== id)
  
  if (filtered.length === recordatorios.length) return false
  
  saveRecordatorios(filtered)
  return true
}

export function toggleRecordatorio(id: string): Recordatorio | null {
  const recordatorios = getRecordatorios()
  const index = recordatorios.findIndex((r) => r.id === id)
  
  if (index === -1) return null
  
  recordatorios[index].activo = !recordatorios[index].activo
  saveRecordatorios(recordatorios)
  
  return recordatorios[index]
}
