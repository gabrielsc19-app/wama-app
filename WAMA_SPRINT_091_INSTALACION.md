# WAMA v0.9.1 — Portal, RLS, OCR y móvil

## Qué corrige

1. El portal ya no consulta directamente `wama_tenant_memberships`.
2. Se agrega una RPC segura que devuelve únicamente las empresas del usuario autenticado.
3. La confianza OCR acepta valores `0.90` o `90` y siempre se muestra entre `0%` y `100%`.
4. La lectura vuelve a mostrar una secuencia visual de análisis.
5. Expense Hub respeta el notch, la barra superior y la zona segura inferior del teléfono.
6. Se compactan títulos, márgenes y tarjetas en pantallas pequeñas.

## Instalación

### 1. Copiar archivos

Copia el contenido del ZIP `SOLO_CAMBIOS` sobre la raíz de tu proyecto WAMA.

### 2. Ejecutar migración en Supabase

Abre Supabase > SQL Editor y ejecuta:

`supabase/migrations/202607300002_portal_rls_and_rpc.sql`

Esto es obligatorio para eliminar:

`permission denied for table wama_tenant_memberships`

### 3. Publicar

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "fix: portal RLS, OCR confidence and mobile safe areas"
git push
```

### 4. Pruebas

- Ingresar con el usuario del trial.
- Abrir `/empresa`.
- Confirmar que aparece la empresa real.
- Abrir Expense Hub en iPhone.
- Tomar una foto.
- Verificar secuencia WAMA AI.
- Confirmar que la confianza nunca supera 100%.
- Revisar que el encabezado no choque con la hora, notch ni barra de estado.
