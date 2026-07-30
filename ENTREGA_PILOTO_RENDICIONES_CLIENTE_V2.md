# WAMA · Piloto Rendiciones de Gastos · Entrega cliente V2

## Flujo final

1. El cliente abre `/trial`.
2. Completa Empresa, RUT, administrador, teléfono y correo.
3. WAMA crea la empresa, el Owner y la licencia de Rendiciones de Gastos.
4. La prueba incluye 15 días y 10 usuarios para toda la empresa dentro del módulo.
5. WAMA envía inmediatamente un correo desde `contacto@wamaapp.com` con correo de acceso, clave temporal y botón de ingreso.
6. En el primer login, el usuario debe reemplazar la clave temporal.
7. WAMA lo lleva directamente a `/empresa`.

## Variables requeridas en Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `WAMA_FROM_EMAIL=WAMA <contacto@wamaapp.com>`
- `WAMA_PILOT_SETUP_SECRET` (solo para `/admin/pilotos`)

El dominio `wamaapp.com` debe estar verificado en Resend para enviar desde `contacto@wamaapp.com`.

## SQL obligatorio

Ejecutar en Supabase:

`supabase/migrations/202607290002_trial_contact_fields.sql`

## Verificación

- `/api/trial/health` debe mostrar `databaseConfigured: true` y `emailConfigured: true`.
- `/trial` debe crear el portal y mostrar confirmación de correo.
- El correo debe llegar desde `contacto@wamaapp.com`.
- El primer login debe redirigir a `/cuenta/crear-clave`.
- Después de guardar la clave, debe abrir `/empresa`.

## Publicación

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "Simplificar piloto y enviar acceso por correo"
git push origin main
```
