# WAMA — Actualización Atomic: IA + Portal móvil

## Incluye
- Nueva ruta `/empresa/ia` con interfaz WAMA AI.
- Tarjeta de recomendaciones de IA en `/empresa`.
- Dashboard ejecutivo mejorado.
- Trust Score circular y métricas con tendencia.
- Botón de instalación PWA.
- Navegación inferior para teléfonos.
- Sidebar de escritorio con acceso a WAMA AI.
- Manifest actualizado con accesos directos a Portal Empresarial y WAMA AI.
- Indicador negro de Next.js desactivado en desarrollo (`devIndicators: false`).

## Instalación
1. Conserva tu `.env.local` actual.
2. Reemplaza el proyecto con esta carpeta.
3. Ejecuta `npm install`.
4. Ejecuta `npm run build`.
5. Ejecuta `npm run dev`.
6. Abre `http://localhost:3000/empresa`.
7. Prueba en teléfono desde la URL publicada en Vercel y agrégala a la pantalla de inicio.

## Nota sobre WAMA AI
La interfaz está lista y usa una respuesta demostrativa controlada. La conexión real del agente con los datos del tenant, permisos y auditoría corresponde a la integración backend siguiente; no se simula como conexión productiva.
