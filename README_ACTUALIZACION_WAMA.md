# WAMA — Actualización Portal Empresarial

## Qué quedó implementado

- Portal Empresarial con navegación propia.
- Vista **Mi empresa**.
- Gestión visual de licencias por módulo.
- Vista de usuarios y consumo de licencias.
- Vista de proyectos opcionales por empresa.
- Trust Center.
- Vista de seguridad.
- Vista de facturación.
- Integración con el Core de Tenant y Licensing ya agregado.
- Modo demostrativo automático cuando todavía no existe una sesión Supabase asociada a un tenant.
- Acceso al Portal Empresarial desde el menú principal de WAMA.

## Rutas nuevas

- `/empresa`
- `/empresa/licencias`
- `/empresa/proyectos`
- `/empresa/usuarios`
- `/empresa/trust`
- `/empresa/seguridad`
- `/empresa/facturacion`

## Instalación

1. Haz una copia de respaldo de tu carpeta actual `C:\Users\gabri\wama-app`.
2. Descomprime este ZIP.
3. Reemplaza el contenido de tu carpeta actual por el contenido de la carpeta `wama-app` entregada.
4. Conserva tu archivo `.env.local` actual. Este ZIP ya lo incluye porque venía en el proyecto recibido, pero no debes subirlo a GitHub.
5. Abre PowerShell en `C:\Users\gabri\wama-app`.
6. Ejecuta:

```bash
npm install
npm run build
npm run dev
```

7. Abre `http://localhost:3000/empresa`.

## Validación

Comprueba estas rutas:

- `http://localhost:3000/empresa`
- `http://localhost:3000/empresa/licencias`
- `http://localhost:3000/empresa/proyectos`
- `http://localhost:3000/empresa/usuarios`
- `http://localhost:3000/empresa/trust`
- `http://localhost:3000/empresa/seguridad`
- `http://localhost:3000/empresa/facturacion`

## Supabase

No es necesario ejecutar una migración SQL adicional para esta entrega. Las pantallas intentan leer las tablas multiempresa y de licenciamiento ya creadas. Cuando no existe una sesión Supabase válida, muestran datos demostrativos para que el portal pueda revisarse sin bloquear la navegación.

## Publicación en Vercel

Después de validar localmente:

```bash
git add .
git commit -m "feat: portal empresarial WAMA"
git push
```

Vercel debería desplegar automáticamente desde el repositorio conectado.

## Seguridad

- No publiques `.env.local`.
- Verifica que `.env.local` esté ignorado por `.gitignore`.
- El modo demostrativo es visual. La activación productiva completa requiere que el login cree o recupere una membresía real en `wama_tenant_memberships`.
