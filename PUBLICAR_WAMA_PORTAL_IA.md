# Publicación de WAMA Portal Empresarial + WAMA AI

Esta entrega contiene el Portal Empresarial, WAMA AI, navegación móvil/PWA y la ruta servidor que consulta OpenAI.

## 1. Reemplazar el proyecto local

1. Respaldar `C:\Users\gabri\wama-app`.
2. Descomprimir este ZIP.
3. Copiar la carpeta `wama-app` en `C:\Users\gabri\wama-app`.
4. Conservar el `.env.local` actual. El ZIP no incluye secretos.

## 2. Validar variables locales

El archivo `.env.local` debe contener:

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4.1-mini
```

La API key debe ir solamente en `OPENAI_API_KEY`. `OPENAI_MODEL` debe contener solamente el nombre del modelo.

## 3. Probar localmente

```powershell
cd C:\Users\gabri\wama-app
npm install
npm run build
npm run dev
```

Abrir:

- `http://localhost:3000/empresa`
- `http://localhost:3000/empresa/ia`
- `http://localhost:3000/api/enterprise-ai/health`

El endpoint de salud debe responder `configured: true` y `model: "gpt-4.1-mini"`. Nunca muestra la API key.

## 4. Publicar en GitHub

```powershell
cd C:\Users\gabri\wama-app
git status
git add .
git commit -m "Publicar Portal Empresarial y WAMA AI"
git push origin main
```

Vercel debería crear automáticamente un deployment desde la rama `main`.

## 5. Revisar Vercel

En **Settings > Environment Variables** verificar:

- `OPENAI_API_KEY`: valor que comienza con `sk-proj-...`
- `OPENAI_MODEL`: valor exacto `gpt-4.1-mini`
- Ambos aplicados a **Production and Preview**.

Después del push, esperar que el nuevo deployment quede en estado **Ready**. No basta con redeployar código antiguo: el deployment debe incluir el commit `Publicar Portal Empresarial y WAMA AI`.

## 6. Prueba productiva

Abrir:

- `https://www.wamaapp.com/empresa`
- `https://www.wamaapp.com/empresa/ia`
- `https://www.wamaapp.com/api/enterprise-ai/health`

Prueba inicial del chat:

1. Escribir `hola`.
2. Debe contestar con un saludo natural.
3. Preguntar `¿Cuántas licencias libres tengo?`.
4. Debe usar el contexto empresarial disponible.

## 7. Diagnóstico

- `configured: false`: falta `OPENAI_API_KEY` en el deployment actual.
- Modelo incorrecto en `/health`: corregir `OPENAI_MODEL` y volver a desplegar.
- La ruta `/empresa/ia` devuelve 404: el ZIP aún no fue subido a GitHub/Vercel.
- La interfaz aparece, pero OpenAI falla: revisar **Vercel > Deployment > Functions > Logs** y la facturación de la API.

## Estado de los datos empresariales

La conversación con OpenAI es real. Los datos del panel usados actualmente por WAMA AI siguen siendo demostrativos. La conexión de cada respuesta con las tablas reales de cada tenant en Supabase corresponde a la siguiente integración de producto.
