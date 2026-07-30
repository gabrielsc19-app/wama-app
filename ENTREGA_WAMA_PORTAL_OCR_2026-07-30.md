# WAMA — Portal, navegación y OCR restaurado

## Cambios incluidos

1. Header público sin accesos duplicados:
   - Probar demo → `/acceso`
   - Ingresar → `/login`
   - Activa tu prueba gratis → `/trial`

2. Portal de empresa `/empresa`:
   - Bienvenida con nombre real de empresa.
   - Logo corporativo o iniciales.
   - Módulo solicitado en prueba.
   - Estado del trial y días restantes.
   - Licencias reales, cupos y usuarios.
   - Proyectos reales.
   - Guía de primeros pasos.
   - Se eliminó el fallback silencioso con “Empresa Demo SpA”.

3. Personalización `/empresa/configuracion`:
   - Cambio del nombre de empresa.
   - Carga de logo corporativo (máximo 1 MB).

4. Expense Hub `/expense-hub`:
   - Cámara del teléfono.
   - Galería o archivo PDF.
   - Lectura automática mediante el endpoint OpenAI existente `/api/expense/ocr`.
   - Autocompletado de comercio, fecha, monto, categoría y centro de costo.
   - Vista previa y nivel de confianza.
   - Confirmación antes de enviar.
   - Proyectos y flujo de aprobación conservados.

## Archivos principales modificados

- `src/components/brand/WamaShell.tsx`
- `app/page.tsx`
- `app/empresa/page.tsx`
- `app/empresa/configuracion/page.tsx`
- `src/core/portal/portalData.ts`
- `src/components/pilot/PilotExpenseHub.tsx`

## Publicación

Reemplaza el proyecto o copia solo los cambios. No reemplaces tu `.env.local`.
Después ejecuta:

```powershell
npm install
npm run build
git add .
git commit -m "feat: portal real, navegación y OCR en Expense Hub"
git push
```

No se modificó el endpoint de OpenAI ni las credenciales existentes.
