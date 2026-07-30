# WAMA — Centro de Control del propietario

Esta entrega agrega control SaaS sobre empresas, pagos, módulos y bloques de usuarios sin modificar Gmail ni el OCR/OpenAI existente.

## Archivos principales

- `app/admin/control/page.tsx`: panel privado de propietarios WAMA.
- `app/api/platform/tenants/route.ts`: API para listar empresas y activar/suspender accesos.
- `supabase/migrations/202607300001_wama_owner_billing_control.sql`: estado de pago, auditoría y función central de autorización.
- `.env.example`: nueva variable `WAMA_OWNER_CONTROL_SECRET`.

## Instalación

1. Reemplaza el proyecto con esta entrega o copia los tres archivos indicados.
2. En Supabase SQL Editor ejecuta:
   `supabase/migrations/202607300001_wama_owner_billing_control.sql`
3. En Vercel agrega una variable de entorno:
   `WAMA_OWNER_CONTROL_SECRET=<clave-larga-y-privada>`
4. Publica el proyecto.
5. Ingresa a `/admin/control` y escribe la clave configurada.

## Funciones habilitadas

- Ver todas las empresas y cantidad de usuarios.
- Registrar pago y fecha pagada hasta.
- Activar o suspender una empresa completa.
- Activar o desactivar módulos individualmente.
- Agregar bloques de 10 usuarios a un módulo.
- Registrar cada intervención en `wama_platform_admin_logs`.
- Validar centralmente que empresa, pago y licencia estén activos mediante `wama_has_active_module(tenant_id, module_key)`.

## Regla de negocio implementada

El administrador de cada empresa sigue gestionando usuarios, proyectos y operación. WAMA controla la habilitación comercial del tenant y de cada módulo según el estado de pago.

## Verificación

No se incluyeron `.env.local`, credenciales, `.git`, `.next` ni `node_modules`.

El build no pudo ejecutarse en el entorno de entrega porque el registro interno de paquetes no contenía una dependencia transitiva del `package-lock.json`. No se modificaron dependencias ni el lockfile.
