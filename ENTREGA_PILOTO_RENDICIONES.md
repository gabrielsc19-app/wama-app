# WAMA — Piloto de Rendiciones de Gastos

## Alcance de esta entrega

- Se incorpora **Rendiciones de gastos** como módulo inicial en `/trial`.
- El módulo queda seleccionado por defecto.
- La prueba queda limitada a **10 usuarios** y **15 días**.
- El portal dirige el módulo de rendiciones a `/expense-hub`.
- La administración interna muestra el nombre comercial **Rendiciones de Gastos**.
- El aprovisionamiento productivo continúa usando el módulo técnico `expense` en Supabase.

## Regla de licencias

Los 10 cupos pertenecen al módulo Rendiciones de Gastos de la empresa. Un usuario consume un solo cupo aunque participe en varios proyectos. Los proyectos organizan y restringen información, pero no entregan 10 cupos adicionales.

## Publicación

1. Copiar el contenido de esta entrega sobre `C:\Users\gabri\wama-app`.
2. Conservar `.env.local`.
3. Ejecutar:

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
git add .
git commit -m "Agregar Rendiciones de Gastos al piloto"
git push origin main
```

4. Esperar el deployment de Vercel en estado `Ready`.
5. Verificar:

- `https://www.wamaapp.com/trial`
- `https://www.wamaapp.com/admin/pilotos`
- `https://www.wamaapp.com/expense-hub`

## Alta del cliente piloto

La empresa real debe crearse desde `/admin/pilotos`, no desde la prueba visual local de `/trial`.

Completar:

- Clave interna
- Empresa
- Nombre del responsable
- Correo del responsable

Al confirmar, WAMA crea el tenant, activa Rendiciones de Gastos por 15 días, habilita 10 cupos, crea al Owner y envía la invitación.

## Validación antes de entregar al cliente

1. El Owner recibe el correo.
2. Acepta la invitación y crea su contraseña.
3. Inicia sesión.
4. Crea un proyecto.
5. Invita a un segundo usuario.
6. Registra una rendición.
7. Envía la rendición a aprobación.
8. Un aprobador cambia su estado.
9. El Owner ve el historial y el estado final.
