# WAMA · Operations Hub

## Instalación

1. Copia las carpetas y archivos del paquete sobre `C:\Users\gabri\wama-app`, conservando la misma estructura.
2. En Supabase, abre **SQL Editor** y ejecuta completa la migración:
   `supabase/migrations/202608100003_operations_hub_experience.sql`.
3. Confirma que en Vercel continúan configuradas las variables actuales de Supabase. Este paquete no modifica ni incluye `.env.local`.
4. Desde `C:\Users\gabri\wama-app`, ejecuta:

   ```powershell
   npm install
   npm run build
   git add .
   git commit -m "feat: complete Operations Hub experience"
   git push
   ```

## Qué incorpora

- Onboarding persistente y vacío para empresas nuevas; las áreas sugeridas no se crean automáticamente.
- Ubicaciones, categorías, SLA, equipos, coordinadores e integrantes configurables.
- Cinco perfiles propios: administrador, coordinador, operativo, reportante y observador.
- Acceso validado por licencia activa de Operations Hub, no solo por pertenecer a la empresa.
- Casos móviles con hasta cinco fotografías o PDF, vista previa del archivo y protección contra doble envío.
- Responsables y destinatarios limitados a usuarios licenciados en el módulo.
- Flujo de asignación, toma, inicio, resolución, cierre y reapertura con permisos por perfil.
- Alertas urgentes, avisos internos, trazabilidad y evidencias privadas con enlaces temporales.
- Eliminación lógica y restauración mediante API, con motivo obligatorio y auditoría conservada.
- Capacidad comercial en bloques de 10 usuarios por US$10 mensuales para Operations Hub.
- El mismo usuario consume un cupo en cada módulo al que está asignado y puede pertenecer a varios equipos sin volver a consumir cupos dentro de Operations Hub.

## Verificaciones realizadas

- TypeScript sin errores con `npx tsc --noEmit`.
- Compilación de código y validación de tipos completadas correctamente.
- El prerender final en el entorno de revisión se detuvo únicamente porque el ZIP se procesó deliberadamente sin `.env.local`; en Vercel utilizará las variables ya configuradas.

## Importante

El paquete no contiene `.env.local`, `.git`, `.next` ni `node_modules`. No reemplaza Sales Hub ni Expense Hub. Los únicos cambios compartidos son los perfiles y validaciones de invitación necesarios para que Operations Hub use correctamente las licencias empresariales existentes.
