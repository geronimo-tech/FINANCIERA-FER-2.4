import { ArrowLeft, Settings, Smartphone, Volume2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationSettings } from '@/components/notification-settings'
import { RecordatoriosManager } from '@/components/recordatorios-manager'

export default function ConfiguracionPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Image
            src="/logo.png"
            alt="FINANCIERA FERNANDEZ Y ASOCIADOS"
            width={50}
            height={50}
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configuracion
            </h1>
            <p className="text-sm text-muted-foreground">
              Ajustes de la aplicacion
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <RecordatoriosManager />
          
          <NotificationSettings />
          
          {/* Mobile instructions card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Notificaciones en tu Celular
              </CardTitle>
              <CardDescription>
                Instrucciones para recibir notificaciones en dispositivos moviles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Para Android:</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Abre esta pagina en Chrome</li>
                  <li>Toca el menu (3 puntos) y selecciona "Agregar a pantalla de inicio"</li>
                  <li>Acepta los permisos de notificaciones cuando se soliciten</li>
                </ol>
                
                <p className="font-medium text-foreground pt-2">Para iPhone (iOS):</p>
                <ol className="list-decimal list-inside space-y-1 pl-2">
                  <li>Abre esta pagina en Safari</li>
                  <li>Toca el boton de compartir y selecciona "Agregar a pantalla de inicio"</li>
                  <li>Las notificaciones push requieren iOS 16.4 o superior</li>
                </ol>
              </div>
              
              <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 mt-4">
                <Volume2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Sonidos de Alerta</p>
                  <p className="text-muted-foreground">
                    Las notificaciones incluyen tonos diferentes: uno urgente (agudo y repetido) para pagos vencidos, 
                    y uno suave para recordatorios de pagos proximos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
