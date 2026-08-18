# Configurar Google Analytics 4 como analítica web (`telemetry`)

> Guía de cero a medir. Cubre qué crear en Google, qué poner en el `.env`, cómo comprobar que los
> eventos llegan y qué hacer cuando no llegan. No hace falta tocar código: el adaptador ya existe
> ([módulo `telemetry`](../modules/telemetry.md)) y se enciende por configuración.

## Qué hace esto

El portal **no** habla con Google. Habla con esta API, la API persiste la telemetría en
`telemetry.*` —que sigue siendo la fuente de verdad— y **después** reenvía una copia a Google
Analytics por el Measurement Protocol:

```
navegador ──► POST /telemetry/activity-events ──► TelemetryEventsService ──► COMMIT
                                                          │
                                                          └──► GA4 (server-side, mejor esfuerzo)
```

Tres consecuencias prácticas de que sea server-side:

- **Un bloqueador de anuncios no lo silencia.** No hay `gtag.js` en el navegador que bloquear.
- **A Google no le llega ningún dato personal.** Sólo claves derivadas con SHA-256 y la sal del
  despliegue, plantillas de ruta (`/doctores/:id`, nunca `/doctores/8f21…`) y propiedades ya
  minimizadas por el esquema de evento.
- **Si Google se cae, no pasa nada.** El evento ya está guardado; el reenvío es un efecto
  secundario que no puede degradar la ingesta.

## Antes de empezar

- Una cuenta de Google con permiso para administrar una propiedad de Analytics.
- Acceso al `.env` del despliegue de la API (no del frontend: las credenciales son de servidor).
- Saber si el despliegue debe recolectar en la UE (afecta a `GA4_ENDPOINT`).

---

## 1. Crear la propiedad y el flujo de datos en Google Analytics

1. Entra a [analytics.google.com](https://analytics.google.com/) y elige o crea una **cuenta**.
2. **Administrar** (rueda dentada, abajo a la izquierda) → **Crear** → **Propiedad**.
   - Nombre: el del producto (p. ej. `Mantra Core Health — Producción`).
   - Zona horaria y moneda: las del negocio. **Ojo**: la zona horaria decide dónde corta cada día
     en los informes y **no se puede cambiar retroactivamente**.
3. Al terminar te pide crear un **flujo de datos**: elige **Web**.
   - URL del sitio: el origen público del portal (el mismo que pondrás en
     `TELEMETRY_WEB_ANALYTICS_SITE_URL`).
   - Nombre del flujo: `Portal web`.
4. Google te muestra el **ID de medición**, con la forma `G-XXXXXXXXXX`. Anótalo.

> Crea **una propiedad por entorno** (producción, staging). Mezclar el tráfico de pruebas con el
> real ensucia informes que luego nadie limpia.

## 2. Crear el secreto de API del Measurement Protocol

El ID de medición identifica el flujo, pero no autoriza a escribir en él. Eso lo hace el secreto.

1. **Administrar** → **Flujos de datos** → abre el flujo web que acabas de crear.
2. Baja a **Secretos de API del Protocolo de medición** → **Crear**.
3. Ponle un apodo que diga de dónde escribe (`api-produccion`, `api-staging`) → **Crear**.
4. Copia el **valor del secreto**. Google no lo vuelve a mostrar completo.

> Un secreto por entorno, y tratado como cualquier otra credencial: en el gestor de secretos del
> despliegue, nunca en el repositorio. Si se filtra, cualquiera puede inyectar eventos falsos en tus
> informes; se revoca desde esta misma pantalla creando uno nuevo y borrando el viejo.

## 3. Generar la sal de pseudonimización

GA4 necesita un identificador estable por visitante (`client_id`). El adaptador **no** le manda el
uuid interno: manda un `SHA-256(sal + uuid)`. La sal es lo que impide que alguien con el mismo uuid
—o el propio Google— reconstruya la correspondencia y cruce sus datos con los nuestros.

```bash
openssl rand -hex 32
```

Guarda ese valor en `TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT`. Dos avisos:

- **Mínimo 16 caracteres.** Con el reenvío activo y una sal más corta, el proceso se niega a
  arrancar en lugar de medir mal en silencio.
- **Cambiarla reinicia la identidad de todos los visitantes.** Cada uno pasa a ser "usuario nuevo"
  en GA4. Es la palanca correcta si sospechas que la sal se filtró, y una mala idea por rutina.

## 4. Configurar el `.env` de la API

```bash
# Encender el reenvío y elegir proveedor
TELEMETRY_WEB_ANALYTICS_ENABLED=true
TELEMETRY_WEB_ANALYTICS_PROVIDER=google_analytics

# Identidad pseudónima y origen público del portal
TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT=<lo que devolvió openssl rand -hex 32>
TELEMETRY_WEB_ANALYTICS_SITE_URL=https://portal.tu-dominio.com

# Credenciales del flujo de datos (pasos 1 y 2)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=<secreto del Measurement Protocol>

# Estrenando la integración: valida sin contar nada (ver paso 5)
GA4_DEBUG_VALIDATION=true
```

Si el despliegue debe recolectar en la Unión Europea, añade además:

```bash
GA4_ENDPOINT=https://region1.google-analytics.com
```

El resto de variables (`TELEMETRY_WEB_ANALYTICS_TIMEOUT_MS`, reintentos, cortacircuitos,
`GA4_AD_USER_DATA`, `GA4_AD_PERSONALIZATION`, `GA4_BATCH_TIME_TOLERANCE_MS`) traen valores por
defecto sensatos y están documentadas en `.env.example`. Los dos de publicidad se quedan en `false`
salvo que exista una decisión de negocio —y su base legal— para lo contrario: la medición de
producto no la necesita.

> Con `TELEMETRY_WEB_ANALYTICS_ENABLED=false` no sale ni un evento, aunque el resto esté
> configurado. Es el interruptor de emergencia: para cortar el reenvío en un incidente no hace falta
> recordar a qué valor había que devolver el proveedor.

## 5. Validar antes de contar (`GA4_DEBUG_VALIDATION=true`)

Con la validación activada, el adaptador envía a `/debug/mp/collect` en vez de a `/mp/collect`.
Google **no cuenta** esos eventos, pero contesta qué rechazaría. Esto importa porque el endpoint
real responde `204 No Content` tanto si cuenta el evento como si lo tira: sin este modo, una
integración mal configurada parece funcionar durante semanas.

1. Arranca la API con la configuración del paso 4.
2. Provoca tráfico real (navega el portal, o llama a `POST /telemetry/activity-events`).
3. Mira los logs de la API:

```bash
docker compose logs -f api | grep web-analytics
```

- **Sin líneas de aviso** → los payloads son válidos. Pasa al paso 6.
- **`Google Analytics returned validation messages`** → el log trae el motivo exacto de Google
  (`NAME_RESERVED`, `NO_VALID_MEASUREMENT_ID`, …). Ver [Diagnóstico](#diagnóstico).

También puedes validar a mano, sin tocar la API:

```bash
curl -s -X POST \
  "https://www.google-analytics.com/debug/mp/collect?measurement_id=$GA4_MEASUREMENT_ID&api_secret=$GA4_API_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"client_id":"1234567890.1234567890","events":[{"name":"page_view","params":{"engagement_time_msec":1}}]}'
```

Respuesta esperada: `{"validationMessages":[]}`.

## 6. Pasar a recolección real y comprobar en GA4

1. Pon `GA4_DEBUG_VALIDATION=false` y reinicia la API.
2. Genera tráfico otra vez.
3. En Google Analytics: **Informes → Tiempo real**. Los eventos aparecen en segundos.
4. Para ver el detalle evento a evento: **Administrar → DebugView**. Sólo muestra tráfico marcado
   como de depuración, así que para una comprobación rápida el informe de **Tiempo real** es el
   adecuado.

> Los informes estándar (no el de tiempo real) tardan **hasta 24-48 h** en consolidar los primeros
> datos de una propiedad recién creada. Que no aparezcan ahí el primer día no significa que algo
> vaya mal.

## 7. Marcar los eventos clave (conversiones)

Cada conversión se reenvía con el **código de su funnel** como nombre de evento
(`appointment_booked`, `lead_submitted`, …), en vez de un `conversion` genérico, precisamente para
que GA4 pueda marcarla como evento clave sin configurar dimensiones personalizadas.

1. Espera a que el evento haya llegado al menos una vez (aparece en **Administrar → Eventos**).
2. Activa el conmutador **Marcar como evento clave** en la fila del evento.

## Qué se reenvía exactamente

| Origen en la API | Evento en GA4 | Propiedades |
| --- | --- | --- |
| `POST /telemetry/activity-events` | el nombre del esquema de evento (`page_view`, `doctor_profile_viewed`, …) | `route_template`, `page_location`, las propiedades del evento, `session_id`, `engagement_time_msec` |
| `POST /telemetry/web-vitals` | `web_vitals` | `metric_name`, `metric_value`, `metric_rating`, `route_template`, `page_location` |
| `POST /telemetry/conversion-events` | el código del funnel | `funnel_code`, `funnel_version` |

Y lo que **no** se reenvía nunca:

- Eventos que el gate de consentimiento descartó (no se persistieron, no salen).
- Una conversión ya registrada: es idempotente por `(funnel, sujeto, journey)` y GA4 no deduplica
  eventos clave, así que reenviarla contaría dos.
- Identificadores internos, IP, user-agent, correo, ni ninguna URL con identificadores en claro.
- Eventos de más de 72 horas: GA4 los descartaría sin avisar, así que el adaptador los cuenta como
  perdidos en el log en lugar de fingir que se entregaron.

## Diagnóstico

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| La API no arranca: `El proveedor google_analytics requiere GA4_MEASUREMENT_ID y GA4_API_SECRET` | Reenvío activo sin credenciales | Completar el paso 4. Es deliberado: falla al arrancar, no en la primera visita. |
| La API no arranca: `TELEMETRY_WEB_ANALYTICS_SUBJECT_SALT (>=16 caracteres)` | Sal ausente o corta | Paso 3. |
| Log `NO_VALID_MEASUREMENT_ID` | ID de medición mal copiado, o secreto de otra propiedad | Verificar que ambos salen del **mismo** flujo de datos. |
| Log `NAME_RESERVED` | Un esquema de evento usa un nombre que GA4 se reserva | El adaptador ya lo rescata con el prefijo `evt_`; si aparece, es que se envió algo fuera del adaptador. |
| Log `WEB_ANALYTICS_UNAUTHORIZED` | Secreto revocado o incorrecto | Crear uno nuevo (paso 2). |
| Log `Web analytics forwarding dropped events` con `skipReason: NOT_CONFIGURED` | Reenvío encendido sin credenciales cargadas en ese proceso | Revisar que el `.env` llegue al contenedor de la API. |
| Log `Google Analytics circuit state changed` a `OPEN` | Google devuelve errores de forma sostenida | El adaptador deja de insistir 30 s y se recupera solo. Si persiste, revisar [estado de Google](https://status.cloud.google.com/). |
| No hay ningún log de `web-analytics` | El reenvío está apagado | `TELEMETRY_WEB_ANALYTICS_ENABLED=true`. |
| Eventos en tiempo real pero informes vacíos | Propiedad recién creada | Esperar 24-48 h. |

## Apagarlo

```bash
TELEMETRY_WEB_ANALYTICS_ENABLED=false
```

Reiniciar la API. La ingesta sigue funcionando igual y `telemetry.*` conserva todo: el reenvío
nunca fue la fuente de verdad.
