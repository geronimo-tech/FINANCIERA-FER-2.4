'use client'

import { FileText, Download, Calendar, FileDown } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'
import { getPrestamos } from '@/lib/prestamos-store'
import type { Prestamo, PagoMensual } from '@/lib/types'

interface PagoConPrestamo {
  prestamo: Prestamo
  pago: PagoMensual
}

interface PagosPorMes {
  [key: string]: PagoConPrestamo[]
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Helper function to parse date string as local time to avoid timezone issues
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('T')[0].split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function ListaMensual() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pagosPorMes, setPagosPorMes] = useState<PagosPorMes>({})
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('todos')
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>(new Date().getFullYear().toString())
  const [aniosDisponibles, setAniosDisponibles] = useState<string[]>([])

  useEffect(() => {
    const prestamos = getPrestamos().filter(p => p.estado === 'activo')
    const pagos: PagosPorMes = {}
    const anios = new Set<string>()

    prestamos.forEach(prestamo => {
      prestamo.pagosMensuales.forEach(pago => {
        if (!pago.pagado) {
          const fecha = parseLocalDate(pago.fechaCobro)
          const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
          anios.add(fecha.getFullYear().toString())
          
          if (!pagos[mesKey]) {
            pagos[mesKey] = []
          }
          pagos[mesKey].push({ prestamo, pago })
        }
      })
    })

    // Ordenar pagos por fecha dentro de cada mes
    Object.keys(pagos).forEach(key => {
      pagos[key].sort((a, b) => 
        parseLocalDate(a.pago.fechaCobro).getTime() - parseLocalDate(b.pago.fechaCobro).getTime()
      )
    })

    setPagosPorMes(pagos)
    setAniosDisponibles(Array.from(anios).sort())
  }, [dialogOpen])

  const getMesesFiltrados = () => {
    const mesesFiltrados: { key: string; label: string; pagos: PagoConPrestamo[] }[] = []
    
    Object.keys(pagosPorMes).sort().forEach(mesKey => {
      const [anio, mes] = mesKey.split('-')
      
      if (anioSeleccionado !== 'todos' && anio !== anioSeleccionado) return
      if (mesSeleccionado !== 'todos' && mes !== mesSeleccionado) return
      
      mesesFiltrados.push({
        key: mesKey,
        label: `${MESES[parseInt(mes) - 1]} ${anio}`,
        pagos: pagosPorMes[mesKey]
      })
    })
    
    return mesesFiltrados
  }

  const generarTextoLista = () => {
    const mesesFiltrados = getMesesFiltrados()
    const fecha = new Date()
    const fechaFormato = fecha.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    let texto = `${fechaFormato}\n`
    texto += `PRÉSTAMOS POR MES\n\n`

    mesesFiltrados.forEach(({ label, pagos }) => {
      texto += `--- ${label.toUpperCase()} ---\n\n`
      
      pagos.forEach(({ prestamo, pago }) => {
        const fechaCobro = parseLocalDate(pago.fechaCobro)
        const diaFormato = fechaCobro.toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
        const total = prestamo.montoCapital + pago.montoCobro
        
        texto += `-${prestamo.nombreCliente}, cobrar ${formatCurrency(prestamo.montoCapital)} + **${formatCurrency(pago.montoCobro)}** de interes. Total ${formatCurrency(total)} para ${diaFormato}.\n\n`
      })
    })

    return texto
  }

  const descargarWord = () => {
    const mesesFiltrados = getMesesFiltrados()
    const fecha = new Date()
    const fechaFormato = fecha.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Prestamos por Mes - FINANCIERA FERNÁNDEZ Y ASOCIADOS</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #555; padding-bottom: 10px; }
          .header h1 { font-family: Arial, sans-serif; font-size: 18pt; font-weight: bold; margin: 0; }
          .header p { font-family: Arial, sans-serif; font-size: 12pt; color: #666; margin: 5px 0 0 0; }
          h2 { font-family: Arial, sans-serif; font-size: 14pt; font-weight: bold; margin-top: 20px; background: #f0f0f0; padding: 8px; border-left: 4px solid #555; }
          p { font-family: Arial, sans-serif; font-size: 12pt; margin: 10px 0; }
          .fecha { font-family: Arial, sans-serif; font-size: 12pt; color: #666; }
          .titulo { font-family: Arial, sans-serif; font-size: 16pt; font-weight: bold; margin: 15px 0; }
          .prestamo { font-family: Arial, sans-serif; font-size: 12pt; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINANCIERA FERNÁNDEZ Y ASOCIADOS</h1>
          <p>Sistema de Prestamos</p>
        </div>
        <p class="fecha">${fechaFormato}</p>
        <p class="titulo">PRÉSTAMOS POR MES</p>
    `

    mesesFiltrados.forEach(({ label, pagos }) => {
      htmlContent += `<h2>${label.toUpperCase()}</h2>`
      
      pagos.forEach(({ prestamo, pago }) => {
        const fechaCobro = parseLocalDate(pago.fechaCobro)
        const diaFormato = fechaCobro.toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
        const total = prestamo.montoCapital + pago.montoCobro
        
        htmlContent += `<p class="prestamo"><strong>-${prestamo.nombreCliente}</strong>, cobrar ${formatCurrency(prestamo.montoCapital)} + <b style="font-size:14pt;font-weight:900;">${formatCurrency(pago.montoCobro)}</b> de interes. <b>Total ${formatCurrency(total)}</b> para <u>${diaFormato}</u>.</p>`
      })
    })

    htmlContent += `</body></html>`

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prestamos_${mesSeleccionado === 'todos' ? 'todos' : MESES[parseInt(mesSeleccionado) - 1]}_${anioSeleccionado}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const descargarPDF = () => {
    const mesesFiltrados = getMesesFiltrados()
    const fecha = new Date()
    const fechaFormato = fecha.toLocaleDateString('es-MX', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    // Crear contenido HTML para imprimir como PDF
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para descargar el PDF')
      return
    }
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Prestamos por Mes - FINANCIERA FERNÁNDEZ Y ASOCIADOS</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 12pt;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #555;
          }
          .header h1 { font-family: Arial, sans-serif; font-size: 18pt; margin-bottom: 5px; }
          .header p { font-family: Arial, sans-serif; font-size: 12pt; color: #666; }
          .fecha { font-family: Arial, sans-serif; font-size: 12pt; color: #666; margin-bottom: 15px; }
          h2 { 
            font-family: Arial, sans-serif;
            font-size: 14pt; 
            font-weight: bold; 
            margin-top: 20px; 
            margin-bottom: 10px;
            padding: 8px;
            background: #f0f0f0;
            border-left: 4px solid #555;
          }
          .prestamo { 
            font-family: Arial, sans-serif;
            font-size: 12pt; 
            margin: 8px 0; 
            padding: 8px;
            border-bottom: 1px solid #eee;
          }
          .prestamo strong { font-weight: bold; }
          .total { font-weight: bold; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FINANCIERA FERNÁNDEZ Y ASOCIADOS</h1>
          <p>Sistema de Prestamos</p>
        </div>
        <p class="fecha">${fechaFormato}</p>
        <h1 style="font-family: Arial, sans-serif; font-size: 16pt; margin-bottom: 15px;">PRÉSTAMOS POR MES</h1>
    `

    mesesFiltrados.forEach(({ label, pagos }) => {
      htmlContent += `<h2>${label.toUpperCase()}</h2>`
      
      pagos.forEach(({ prestamo, pago }) => {
        const fechaCobro = parseLocalDate(pago.fechaCobro)
        const diaFormato = fechaCobro.toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        })
        const total = prestamo.montoCapital + pago.montoCobro
        
        htmlContent += `<div class="prestamo"><strong>-${prestamo.nombreCliente}</strong>, cobrar ${formatCurrency(prestamo.montoCapital)} + <b style="font-size:14pt;font-weight:900;">${formatCurrency(pago.montoCobro)}</b> de interes. <span class="total">Total ${formatCurrency(total)}</span> para <u>${diaFormato}</u>.</div>`
      })
    })

    htmlContent += `
        <script>
          window.onload = function() {
            window.print();
          }
        <\/script>
      </body></html>`

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const mesesFiltrados = getMesesFiltrados()
  const totalPagos = mesesFiltrados.reduce((sum, m) => sum + m.pagos.length, 0)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-transparent">
          <FileText className="mr-2 h-4 w-4" />
          Lista por Mes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lista de Prestamos por Mes
          </DialogTitle>
          <DialogDescription>
            Genera una lista de todos los cobros pendientes organizados por mes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-wrap gap-4 py-4">
          <div className="space-y-2 flex-1 min-w-[140px]">
            <Label>Año</Label>
            <Select value={anioSeleccionado} onValueChange={setAnioSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los años</SelectItem>
                {aniosDisponibles.map(anio => (
                  <SelectItem key={anio} value={anio}>{anio}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1 min-w-[140px]">
            <Label>Mes</Label>
            <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los meses</SelectItem>
                {MESES.map((mes, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, '0')}>{mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button onClick={descargarWord} variant="outline" className="flex-1 bg-transparent">
            <Download className="mr-2 h-4 w-4" />
            Descargar Word
          </Button>
          <Button onClick={descargarPDF} className="flex-1">
            <FileDown className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-lg bg-muted/30">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="FINANCIERA FERNÁNDEZ Y ASOCIADOS"
                width={60}
                height={60}
                className="h-14 w-14 object-contain"
              />
              <div>
                <h3 className="font-bold text-sm">FINANCIERA</h3>
                <p className="text-xs text-muted-foreground">FERNÁNDEZ Y ASOCIADOS</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <h3 className="font-bold text-lg">PRÉSTAMOS POR MES</h3>
            <p className="text-sm text-muted-foreground">
              {totalPagos} cobro{totalPagos !== 1 ? 's' : ''} pendiente{totalPagos !== 1 ? 's' : ''}
            </p>
            
            {mesesFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No hay cobros pendientes para el periodo seleccionado.
              </p>
            ) : (
              mesesFiltrados.map(({ key, label, pagos }) => (
                <Card key={key} className="bg-background">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-bold">{label.toUpperCase()}</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0 pb-4 space-y-3">
                    {pagos.map(({ prestamo, pago }) => {
                      const fechaCobro = parseLocalDate(pago.fechaCobro)
                      const diaFormato = fechaCobro.toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric' 
                      })
                      const total = prestamo.montoCapital + pago.montoCobro
                      
                      return (
                        <div key={`${prestamo.id}-${pago.id}`} className="text-sm">
                          <span className="font-semibold">-{prestamo.nombreCliente}</span>
                          {', cobrar '}
                          <span className="font-medium">{formatCurrency(prestamo.montoCapital)}</span>
                          {' + '}
                          <span className="font-extrabold text-foreground text-base">{formatCurrency(pago.montoCobro)}</span>
                          {' de interes. Total '}
                          <span className="font-bold">{formatCurrency(total)}</span>
                          {' para '}
                          <span className="underline">{diaFormato}</span>
                          {'.'}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
