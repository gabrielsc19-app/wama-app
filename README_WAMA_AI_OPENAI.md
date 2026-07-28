# WAMA AI — configuración de OpenAI

## Cambios incluidos

- Se eliminó el botón negro «Portal» del encabezado del Portal Empresarial.
- WAMA AI ahora mantiene el historial de la conversación.
- Los saludos reciben una respuesta natural.
- La interfaz muestra si está conectada a OpenAI, en modo local o con problemas.
- La API Key queda solo en el servidor.
- Si falta la API Key, WAMA no simula estar conectado: usa un modo local limitado y lo informa.

## Configuración local

Agrega estas variables a `.env.local`:

```env
OPENAI_API_KEY=tu_clave_secreta
OPENAI_MODEL=gpt-4.1-mini
```

No uses el prefijo `NEXT_PUBLIC_` en la API Key.

Reinicia el servidor después de editar el archivo:

```powershell
npm run dev
```

## Configuración en Vercel

1. Abre el proyecto WAMA en Vercel.
2. Entra a Settings > Environment Variables.
3. Agrega `OPENAI_API_KEY`.
4. Agrega opcionalmente `OPENAI_MODEL` con el valor `gpt-4.1-mini`.
5. Activa las variables para Production, Preview y Development según corresponda.
6. Realiza un nuevo Deploy.

## Importante sobre cobro

La suscripción de ChatGPT y el uso de la API de OpenAI se administran y facturan por separado. Para usar WAMA AI en producción debes tener una cuenta de API con facturación habilitada.

## Prueba esperada

1. Abre `/empresa/ia`.
2. Escribe `hola`.
3. Debe responder con un saludo natural y preguntar qué necesitas revisar.
4. Haz una segunda pregunta; debe mantener el contexto de la conversación.
5. La insignia superior debe decir `Conectada a OpenAI` cuando la clave esté activa.

## Estado de datos

La conversación ya funciona con OpenAI, pero el contexto empresarial incluido en esta versión sigue siendo demostrativo. La siguiente integración debe obtener tenant, rol, licencias, proyectos y usuarios directamente desde Supabase antes de enviar el contexto autorizado al modelo.
