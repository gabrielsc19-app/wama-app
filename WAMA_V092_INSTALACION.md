# WAMA v0.9.2 — Portal Gerencial

Esta entrega se instala sobre WAMA v0.9.1.

## Incluye

- Nuevo portal gerencial en `/empresa`.
- Bienvenida con empresa y logo real.
- Indicadores de módulos, usuarios, proyectos, licencia y configuración.
- Resumen ejecutivo de WAMA AI basado en datos reales disponibles.
- Acciones rápidas.
- Estado de licencias.
- Timeline de configuración.
- Acceso destacado a Expense Hub con fotografía + OpenAI.
- Navegación reorganizada.
- Ajustes móviles del portal y áreas seguras.

## Importante

Esta entrega conserva las correcciones de v0.9.1:

- RPC segura para el portal.
- Corrección RLS.
- Porcentaje OCR normalizado.
- Animación de lectura WAMA AI.
- Safe areas del teléfono.

## Instalación recomendada

1. Usa el ZIP completo si todavía no publicaste v0.9.1.
2. Copia el contenido sobre `C:\Users\gabri\wama-app`.
3. Conserva tu `.env.local`.
4. Ejecuta la migración de v0.9.1 si todavía no lo hiciste:

`supabase/migrations/202607300002_portal_rls_and_rpc.sql`

5. Publica:

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "feat: portal gerencial WAMA v0.9.2"
git push
```

## Pruebas

- Entrar a `/empresa`.
- Confirmar nombre y logo real.
- Revisar usuarios y licencias.
- Revisar proyectos.
- Abrir Expense Hub.
- Probar fotografía y lectura OpenAI.
- Revisar el portal desde teléfono.
