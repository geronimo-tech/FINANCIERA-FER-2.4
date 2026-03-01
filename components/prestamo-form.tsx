'use client'

import React from "react"

import { Calculator, Camera, MapPin, Phone, User, Calendar, Percent } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState, useRef, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/format'
import type { PrestamoFormData, FrecuenciaPago } from '@/lib/types'
import { createPrestamo, getClientesPrevios } from '@/lib/prestamos-store'

export function PrestamoForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<PrestamoFormData>({
    nombreCliente: '',
    fechaSolicitud: new Date().toISOString().split('T')[0],
    montoCapital: 0,
    tasaInteres: 20,
    frecuenciaPago: 'mensual',
    montoCuota: 0,
    fotoINE: null,
    domicilio: '',
    telefono: '',
  })

  const [previewINE, setPreviewINE] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientesPrevios, setClientesPrevios] = useState<{ nombreCliente: string; telefono: string; domicilio: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Cargar clientes previos
  useEffect(() => {
    setClientesPrevios(getClientesPrevios())
  }, [])

  // Auto-completar cuando cambia el telefono
  const handleTelefonoChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, telefono: value }))
    
    // Buscar cliente existente por telefono
    const clienteExistente = clientesPrevios.find(c => c.telefono === value)
    if (clienteExistente) {
      setFormData((prev) => ({
        ...prev,
        telefono: value,
        nombreCliente: clienteExistente.nombreCliente,
        domicilio: clienteExistente.domicilio,
      }))
      setShowSuggestions(false)
    } else {
      setShowSuggestions(value.length >= 3)
    }
  }, [clientesPrevios])

  // Filtrar sugerencias
  const sugerencias = useMemo(() => {
    if (!formData.telefono || formData.telefono.length < 3) return []
    return clientesPrevios.filter(c => 
      c.telefono.includes(formData.telefono) || 
      c.nombreCliente.toLowerCase().includes(formData.telefono.toLowerCase())
    )
  }, [formData.telefono, clientesPrevios])

  const seleccionarCliente = useCallback((cliente: { nombreCliente: string; telefono: string; domicilio: string }) => {
    setFormData((prev) => ({
      ...prev,
      nombreCliente: cliente.nombreCliente,
      telefono: cliente.telefono,
      domicilio: cliente.domicilio,
    }))
    setShowSuggestions(false)
  }, [])

  // Calculos segun frecuencia
  const montoInteresMensual = formData.montoCapital * (formData.tasaInteres / 100)

  const resumenCalculo = useMemo(() => {
    const frecuencia = formData.frecuenciaPago
    if (frecuencia === 'semanal') {
      return {
        labelPeriodo: 'Cuota Semanal',
        montoPeriodo: formData.montoCuota,
        descripcion: `Se cobra ${formatCurrency(formData.montoCuota)} cada semana. El monto es definido por usted.`,
      }
    } else if (frecuencia === 'quincenal') {
      const montoQuincenal = montoInteresMensual * 2
      return {
        labelPeriodo: 'Cobro Quincenal',
        montoPeriodo: montoQuincenal,
        descripcion: `Interes mensual (${formatCurrency(montoInteresMensual)}) x 2 = ${formatCurrency(montoQuincenal)} cada quincena.`,
      }
    } else {
      return {
        labelPeriodo: 'Interes Mensual',
        montoPeriodo: montoInteresMensual,
        descripcion: `Se cobra ${formatCurrency(montoInteresMensual)} de interes cada mes hasta devolver el capital.`,
      }
    }
  }, [formData.frecuenciaPago, formData.montoCuota, montoInteresMensual])

  const handleChange = useCallback((field: keyof PrestamoFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      setPreviewINE(base64)
      setFormData((prev) => ({ ...prev, fotoINE: base64 }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const prestamo = createPrestamo(formData)
      router.push(`/prestamos/${prestamo.id}`)
    } catch (error) {
      console.error('Error al crear prestamo:', error)
      setIsSubmitting(false)
    }
  }, [formData, router])

  // Calcular proximas fechas de cobro segun frecuencia
  const proximasFechas = () => {
    const fechas: string[] = []
    const [year, month, day] = formData.fechaSolicitud.split('-').map(Number)
    const fechaBase = new Date(year, month - 1, day)

    const frecuencia = formData.frecuenciaPago
    const cantidadMostrar = 3

    for (let i = 1; i <= cantidadMostrar; i++) {
      let fecha: Date
      if (frecuencia === 'semanal') {
        fecha = new Date(fechaBase.getTime())
        fecha.setDate(fechaBase.getDate() + (i * 7))
      } else if (frecuencia === 'quincenal') {
        fecha = new Date(fechaBase.getTime())
        fecha.setDate(fechaBase.getDate() + (i * 15))
      } else {
        let targetMonth = month - 1 + i
        let targetYear = year
        while (targetMonth > 11) {
          targetMonth -= 12
          targetYear++
        }
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
        const targetDay = Math.min(day, lastDayOfMonth)
        fecha = new Date(targetYear, targetMonth, targetDay)
      }
      fechas.push(fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }))
    }
    return fechas
  }

  const frecuenciaLabel = formData.frecuenciaPago === 'semanal' ? 'Semana' : formData.frecuenciaPago === 'quincenal' ? 'Quincena' : 'Mes'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Datos del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="telefono"
                type="tel"
                placeholder="55 1234 5678"
                className="pl-10"
                value={formData.telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                onFocus={() => setShowSuggestions(formData.telefono.length >= 3)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                required
              />
              {showSuggestions && sugerencias.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg">
                  <p className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    Clientes encontrados:
                  </p>
                  {sugerencias.map((cliente) => (
                    <button
                      key={cliente.telefono}
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        seleccionarCliente(cliente)
                      }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cliente.nombreCliente}</p>
                        <p className="text-xs text-muted-foreground">{cliente.telefono} - {cliente.domicilio.substring(0, 30)}...</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Si el cliente ya tiene un prestamo, sus datos se llenaran automaticamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombreCliente">Nombre Completo del Cliente</Label>
            <Input
              id="nombreCliente"
              placeholder="Nombre Completo"
              value={formData.nombreCliente}
              onChange={(e) => handleChange('nombreCliente', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="domicilio">Domicilio</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="domicilio"
                placeholder="Calle, numero, colonia, ciudad, estado"
                className="min-h-[80px] pl-10"
                value={formData.domicilio}
                onChange={(e) => handleChange('domicilio', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto de INE</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 transition-colors hover:border-primary hover:bg-muted/50 active:bg-muted/70"
              >
                {previewINE ? (
                  <div className="relative w-full">
                    <img
                      src={previewINE || "/placeholder.svg"}
                      alt="Vista previa INE"
                      className="max-h-48 w-full rounded-lg object-contain"
                    />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Toca para cambiar la imagen
                    </p>
                  </div>
                ) : (
                  <>
                    <Camera className="mb-2 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Subir Foto o Archivo</p>
                    <p className="text-xs text-muted-foreground text-center">
                      Toca para tomar foto, seleccionar imagen o archivo
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                    }
                  }}
                >
                  Galeria
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment')
                      fileInputRef.current.click()
                    }
                  }}
                >
                  <Camera className="mr-1 h-4 w-4" />
                  Camara
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Fecha y Frecuencia del Prestamo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fechaSolicitud">Fecha del Prestamo</Label>
            <Input
              id="fechaSolicitud"
              type="date"
              value={formData.fechaSolicitud}
              onChange={(e) => handleChange('fechaSolicitud', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Selecciona el dia en que se realizo el prestamo
            </p>
          </div>

          <div className="space-y-2">
            <Label>Frecuencia de Pago</Label>
            <Select
              value={formData.frecuenciaPago}
              onValueChange={(value) => handleChange('frecuenciaPago', value as FrecuenciaPago)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar frecuencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semanal">Semanal (cada 7 dias)</SelectItem>
                <SelectItem value="quincenal">Quincenal (cada 15 dias)</SelectItem>
                <SelectItem value="mensual">Mensual (cada mes)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.frecuenciaPago === 'semanal' && 'Se generaran pagos cada semana. Usted define la cuota.'}
              {formData.frecuenciaPago === 'quincenal' && 'Se generaran pagos cada 15 dias. El interes es x2.'}
              {formData.frecuenciaPago === 'mensual' && 'Se generaran pagos cada mes con el porcentaje de interes.'}
            </p>
          </div>
          
          {formData.fechaSolicitud && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm font-medium text-foreground mb-2">Proximas fechas de cobro:</p>
              <div className="flex flex-wrap gap-2">
                {proximasFechas().map((fecha, i) => (
                  <span key={i} className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {frecuenciaLabel} {i + 1}: {fecha}
                  </span>
                ))}
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  ...y asi sucesivamente
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-primary" />
            Calculo del Prestamo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="montoCapital">Monto del Capital</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="montoCapital"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="10000"
                  className="pl-8"
                  value={formData.montoCapital || ''}
                  onChange={(e) => handleChange('montoCapital', Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {formData.frecuenciaPago === 'semanal' ? (
              <div className="space-y-2">
                <Label htmlFor="montoCuota">Cuota Semanal</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="montoCuota"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="500"
                    className="pl-8"
                    value={formData.montoCuota || ''}
                    onChange={(e) => handleChange('montoCuota', Number(e.target.value))}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Defina el monto que se cobrara cada semana
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="tasaInteres">Tasa de Interes (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="tasaInteres"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="20"
                    className="pl-10"
                    value={formData.tasaInteres || ''}
                    onChange={(e) => handleChange('tasaInteres', Number(e.target.value))}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.frecuenciaPago === 'quincenal' 
                    ? 'Interes mensual x2 para pago quincenal' 
                    : 'Ejemplo: 20 = 20% mensual'}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Capital prestado:</span>
              <span className="font-medium text-foreground">{formatCurrency(formData.montoCapital)}</span>
            </div>

            {formData.frecuenciaPago !== 'semanal' && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasa de interes:</span>
                  <span className="font-medium text-foreground">{formData.tasaInteres}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Interes mensual base:</span>
                  <span className="font-medium text-foreground">{formatCurrency(montoInteresMensual)}</span>
                </div>
              </>
            )}

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">{resumenCalculo.labelPeriodo}:</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(resumenCalculo.montoPeriodo)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {resumenCalculo.descripcion}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting || !formData.nombreCliente || !formData.montoCapital || (formData.frecuenciaPago === 'semanal' && !formData.montoCuota)}
      >
        {isSubmitting ? 'Guardando...' : 'Registrar Prestamo'}
      </Button>
    </form>
  )
}
