# Configurar Gmail como proveedor real de email (`messaging`)

> Proveedor de **desarrollo** para el canal EMAIL de `messaging`. El proveedor definitivo de
> producción sigue siendo una decisión de negocio pendiente (SendGrid mencionado como candidato) —
> ver `ESTADO-Y-PENDIENTES.md`. Esta guía cubre cómo dejarlo funcionando localmente o en un
> entorno de desarrollo/staging.

## Qué hace esto

`worker-messaging` entrega notificaciones del canal EMAIL a través de un `providerAdapter`
intercambiable (ver [módulo `messaging`](../modules/messaging.md)). Por defecto, sin nada
configurado, ese adapter falla visible con `PROVIDER_NOT_CONFIGURED` — nunca finge un envío que no
ocurrió.

Hay dos adapters que pueden reemplazarlo en el arranque (`OnModuleInit`), y compiten por variables
de entorno:

1. **Mock** (`MOCK_PROVIDER_BASE_URL`) — pega contra `mock-provider-server`, útil para pruebas de
   extremo a extremo sin enviar correo real.
2. **Gmail real** (`GOOGLE_OAUTH_*` + `GOOGLE_SENDER_EMAIL`) — envía por la Gmail API de verdad,
   vía OAuth2 de una cuenta Gmail normal (sin Google Workspace, sin delegación de dominio).

`GoogleProviderWiringService` se registra **después** del mock en
`messaging.worker-module.ts`, así que si ambos están configurados a la vez, **Gmail gana** y pisa
el adapter que dejó el mock.

## 1. Crear las credenciales OAuth en Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) con la cuenta Gmail que va a
   enviar los correos (o cualquier proyecto donde tengas permiso de crear credenciales).
2. Crea un proyecto (o reusa uno existente).
3. **APIs & Services → Library** → busca "Gmail API" → **Enable**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Tipo de aplicación: **Desktop app** (no "Web application" — el script usa el flujo *loopback*,
     que sólo aceptan las credenciales de tipo Desktop sin tener que registrar un `redirect_uri`
     de antemano).
   - Guarda el **Client ID** y el **Client Secret** que te da la consola.
5. Si el proyecto de Google Cloud está en modo "Testing" (pantalla de consentimiento OAuth sin
   publicar), agrega la cuenta Gmail remitente como **usuario de prueba** en
   **APIs & Services → OAuth consent screen → Test users** — si no, Google rechaza el
   consentimiento.

## 2. Obtener el `refresh_token` (una sola vez)

Con las credenciales del paso anterior, corre:

```bash
GOOGLE_OAUTH_CLIENT_ID=<client_id> GOOGLE_OAUTH_CLIENT_SECRET=<client_secret> \
  yarn google:oauth:get-refresh-token
```

Esto ejecuta `tools/google-oauth/get-refresh-token.mjs`, que:

1. Levanta un servidor HTTP efímero en `127.0.0.1` (puerto elegido por el SO).
2. Imprime una URL de consentimiento de Google — ábrela en el navegador **con la cuenta Gmail que
   va a enviar los correos** (no necesariamente la misma con la que creaste el proyecto de Cloud).
3. Tras aceptar, Google redirige al servidor local con el código de autorización; el script lo
   cambia por tokens y termina solo.
4. Imprime en consola las 4 líneas listas para copiar a tu `.env`:

```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
GOOGLE_SENDER_EMAIL=<la cuenta Gmail con la que acabas de autorizar>
```

**Si Google no devuelve `refresh_token`**: pasa cuando esa cuenta ya había autorizado antes este
mismo Client ID (Google sólo lo emite en el primer consentimiento, salvo que se revoque). Revoca el
acceso en [myaccount.google.com/permissions](https://myaccount.google.com/permissions) y vuelve a
correr el script.

## 3. Configurar el `.env`

Copia las 4 variables al `.env` del worker (ver bloque correspondiente en `.env.example`):

```bash
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REFRESH_TOKEN=...
GOOGLE_SENDER_EMAIL=...
```

Las 4 son obligatorias juntas: `GoogleEmailClient.isConfigured()` exige que ninguna venga vacía
— si falta cualquiera, el worker se queda en el adapter mock/stub anterior en vez de fallar a
medias.

## 4. Verificar que quedó conectado

Al arrancar `worker-messaging`, si las 4 variables están presentes verás en el log:

```
NotificationDeliveryJob wired to Gmail API (real provider)
```

(`operation: 'worker.messaging.google-provider-wiring'`, nivel `info`). Si no aparece, revisa que
las 4 variables lleguen al proceso del worker (no sólo a la API — es una superficie de
configuración de `workerEnvSchema`, no del esquema común).

Para una prueba de extremo a extremo contra Google real (no un mock), con las mismas 4 variables en
el entorno:

```bash
yarn test:integration --testPathPatterns=google-email-provider
```

`test/integration/google-email-provider.int-spec.ts` es opt-in — se salta sola
(`describe.skip`) si las variables no están configuradas, así que no rompe `yarn test:integration`
para nadie más. Cuando corre, envía un correo real a la propia cuenta remitente (la única dirección
que se garantiza válida) para demostrar que el intercambio `refresh_token` → `access_token` y el
envío funcionan de punta a punta.

## Límites y notas

- **Cuota de Gmail API**: una cuenta Gmail normal (no Workspace) tiene un límite de envío diario
  bajo (cientos de mensajes/día). Suficiente para desarrollo; no usar como proveedor de producción
  — de ahí que sea explícitamente el adapter de **desarrollo**.
- **Sin delegación de dominio**: al no ser Workspace, sólo se puede enviar *como* la cuenta que dio
  el consentimiento (`GOOGLE_SENDER_EMAIL`), no en nombre de otras direcciones.
- **El `access_token` se cachea en memoria del proceso** hasta 60 segundos antes de expirar
  (`TOKEN_REFRESH_SKEW_MS`); no hay que refrescar manualmente entre envíos.
- **Revocar el acceso**: si necesitas invalidar el `refresh_token` (rotación de credenciales,
  desactivar el envío), revócalo en
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions) — el próximo intento
  de envío fallará visible en vez de silencioso.

## Ver también

- [Módulo `messaging`](../modules/messaging.md)
- [Variables de entorno](../getting-started/environment-variables.md)
- [Configuración](configuration.md)
- `src/worker/google-email-client.service.ts` — cliente HTTP crudo contra `oauth2.googleapis.com` y
  `gmail.googleapis.com`
- `src/worker/jobs/messaging/google-provider-wiring.service.ts` — reemplazo del adapter en
  `OnModuleInit`
