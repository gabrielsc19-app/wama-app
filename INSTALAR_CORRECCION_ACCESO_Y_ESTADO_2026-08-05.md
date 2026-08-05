# Corrección de recuperación y estado de usuarios

## 1. Reemplazar archivos

Copia todo el contenido de este paquete dentro de `C:\Users\gabri\wama-app` y acepta reemplazar.

## 2. Personalizar el correo de recuperación

En Supabase abre `Authentication > Email Templates > Reset password`.

- Subject: `Recupera tu acceso a WAMA`
- Body: pega el contenido completo de `SUPABASE_PLANTILLA_RECUPERACION_WAMA.html`

Guarda los cambios. Esta configuración se realiza una sola vez y no requiere una migración SQL.

## 3. Publicar

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "Corregir recuperacion y estado de usuarios"
git push origin main
```

## 4. Comprobar

1. Entra como administrador en `Empresa > Usuarios`. Al cargar la pantalla, todo usuario que ya haya iniciado sesión se sincroniza automáticamente de `Invitación pendiente` a `Activo`.
2. Solicita una recuperación nueva. No uses el correo anterior.
3. Confirma que el correo llegue en español con el diseño WAMA.
4. Abre el botón `Crear nueva contraseña`, escribe y confirma la nueva clave, y comprueba los dos controles de visualización independientes.

No elimines ni vuelvas a invitar a Benito. La corrección conserva su usuario, perfil y licencia actuales.
