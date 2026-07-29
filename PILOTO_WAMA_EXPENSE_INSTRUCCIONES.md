# WAMA Piloto Expense — instalación y uso

## Decisión de licenciamiento
Los 10 usuarios pertenecen al módulo Expense de la empresa, no a cada proyecto.

- Un usuario asignado a Expense consume 1 cupo.
- Ese mismo usuario puede estar en 1, 5 o 10 proyectos y sigue consumiendo 1 solo cupo de Expense.
- Si más adelante se le asigna Sales, consumirá además 1 cupo de Sales.
- Los proyectos funcionan como alcance y segmentación de datos, no como licencias independientes.

## Qué incluye esta entrega
- Empresa piloto por 15 días.
- Expense activo con 10 usuarios únicos.
- Invitación por correo mediante Supabase Auth.
- Owner con capacidad de invitar usuarios y asignar roles.
- Creación de proyectos sin consumo adicional de cupos.
- Asignación de usuarios a uno o más proyectos.
- Rendiciones reales almacenadas en Supabase.
- Flujo básico: enviar, listar y aprobar rendiciones.
- Login real con Supabase.
- Página de aceptación de invitación y creación de clave.
- WAMA AI continúa conectada a OpenAI.
- Compatible con web y PWA móvil.

## 1. Ejecutar SQL
En Supabase > SQL Editor, ejecuta:

`supabase/migrations/202607290001_pilot_expense_trial.sql`

La migración anterior `202607280001_wama_multitenant_licensing.sql` debe estar ejecutada previamente.

## 2. Variables de Vercel
Mantén las existentes y agrega:

- `WAMA_PILOT_SETUP_SECRET`: crea una clave privada larga que solo tú conozcas.
- `SUPABASE_SERVICE_ROLE_KEY`: debe existir en Vercel y nunca comenzar con `NEXT_PUBLIC_`.

Las variables de OpenAI ya utilizadas se mantienen:

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4.1-mini`

Después haz un nuevo deployment.

## 3. Configurar URL de invitación en Supabase
En Supabase > Authentication > URL Configuration:

- Site URL: `https://www.wamaapp.com`
- Redirect URLs: agrega `https://www.wamaapp.com/invitacion/aceptar`

Para pruebas locales agrega también:

`http://localhost:3000/invitacion/aceptar`

## 4. Crear la empresa piloto
Abre:

`https://www.wamaapp.com/admin/pilotos`

Ingresa:
- clave interna (`WAMA_PILOT_SETUP_SECRET`)
- nombre de la empresa
- nombre del responsable
- correo del responsable

WAMA creará el tenant, activará Expense por 15 días, reservará 10 cupos y enviará la invitación al owner.

## 5. Flujo del cliente
1. El responsable abre el correo de Supabase.
2. Pulsa la invitación.
3. WAMA abre `/invitacion/aceptar`.
4. Define su clave.
5. Entra al Portal Empresarial.
6. Crea proyectos en `/empresa/proyectos`.
7. Invita usuarios en `/empresa/usuarios`.
8. Los usuarios aceptan su invitación.
9. Entran a `/expense-hub` para registrar rendiciones.

## 6. Publicar
```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "Activar piloto Expense con invitaciones y 10 usuarios"
git push origin main
```

## 7. Pruebas obligatorias antes de entregar al piloto
- Crear tenant piloto.
- Confirmar llegada del correo al owner.
- Aceptar invitación y definir clave.
- Iniciar sesión.
- Crear proyecto.
- Invitar un segundo usuario.
- Confirmar que el segundo usuario consume 1 de 10 cupos.
- Asignarlo a dos proyectos y confirmar que sigue consumiendo 1 cupo.
- Crear una rendición desde computador.
- Crear otra rendición desde el teléfono/PWA.
- Aprobar una rendición con owner/admin/manager.
