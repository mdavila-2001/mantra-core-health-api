# H1.S3 — La ficha de la relación, y lo que el doble no acredita

## H1.S3.M1 — Ficha de la relación `agenda → mensajería` (gate B1) · `HECHO`

**Fija versiones, no ramas.** El producto compone versiones verificadas compatibles, no la última
rama incompleta de cada persona.

### Artefactos

| Rol | Artefacto | Versión fijada |
|---|---|---|
| **Consumidor** | `scheduling` (4 servicios que inyectan `AGENDA_NOTICE_PORT`) | `mantra-core-health-api@5d5007fbdb7916b124010bbfbb560b7bb3aabc06` |
| **Contrato** | `src/modules/scheduling/ports/agenda-notice.port.ts` | mismo commit · **sha1 del archivo: `git rev-parse HEAD:<ruta>`** (ver evidencia) |
| **Proveedor** | `MessagingAgendaNoticeAdapter` | mismo commit |
| **Proveedor transitivo** | `messaging` (`NotificationsService`) | mismo commit |
| **Proveedor transitivo** | `SupportAdminNoticeAdapter` (chat) | mismo commit |
| **Base** | `mantra_redesa_health` en `localhost:5433` | 1 184 tablas · 6 664 FKs |

### Por qué el corte es `5d5007f` y no `32ae939`

`32ae939…` es **ancestro** del `HEAD` de `dev`, a 2 commits. Esos 2 commits tocan exclusivamente
`src/modules/clinical/services/{conditions,service-requests}.service.ts` y sus spec — **ninguno toca
`scheduling`, `messaging` ni el puerto**. Trabajar contra el `HEAD` real no cambia esta relación y
evita un rebase. Si Pablo fija `32ae939…`, la decisión se revierte sin costo.

### Configuración que la relación lee

| Variable | Default en el código | Quién la usa |
|---|---|---|
| `WEB_APP_BASE_URL` | `http://localhost:4200` | `loadAgendaNoticesEnv()` → enlace absoluto del correo |
| `ORM_SCHEMA_SYNC` | `off` en `.env` (default `safe` **en el código**) | Arranque del ORM. Con `safe` la app aplica DDL sola: vector de deriva |
| `RATE_LIMIT_DISABLED` | lo fija `test:integration` | Harness |

### Baseline

Ninguno propio todavía: **el baseline de la capacidad es de Itzan** (H2 de su prompt). Esta ficha
declara los artefactos; la composición y el baseline se referencian cuando él los publique.

### Estado de la relación al abrir el turno

`IN_PROGRESS`. No `ADAPTER_VERIFIED_WITH_DOUBLES`: eso lo declara H2 y sólo con los dobles corridos.

## H1.S3.M2 — Mapeo de datos, errores y seguridad (gate B2) · `HECHO`

### Datos — cada campo del contrato, origen y destino

| Campo de `AgendaNotice` | Destino en mensajería | Nota |
|---|---|---|
| `kind` | `payloadJson.kind` **y** `categoryConceptId` vía `CATEGORIA[kind]` **y** `priority` vía `PRIORIDAD[kind]` | Un `kind` sin entrada en esos dos mapas es `undefined` silencioso |
| `recipient.userId` | `recipientUserId` directo | |
| `recipient.patientProfileId` | `recipientUserId` **resuelto** por `noticeRepo.findAccountForProfile` | Si no hay cuenta → `skippedReason`, no error |
| `tenantId` | `tenantId` de la solicitud, **omitido si `undefined`** | Spread condicional, no `null` |
| `subject` / `bodyText` | `payloadJson.subject` / `.bodyText` y argumentos de `deliverNotification` | |
| `relatedResourceType` / `relatedResourceId` | homónimos de la solicitud | `relatedResourceId` omitido si `undefined` |
| `payload` | se **esparce** dentro de `payloadJson` | **Puede pisar `kind`/`subject`/`bodyText`**: el spread va después. Registrado, no corregido |
| `debounceKey` | `debounceKey` (in-app) y `debounceKey + ':email'` (correo) | El sufijo existe porque el rebote no filtra por canal |
| `actorUserId` | `actor.id`, con default `SEED.systemWorkerUserId` y rol `SYSTEM` | `authorized_by_user_id` es NOT NULL |

### Errores — cada modo y su traducción

| Modo de fallo | Dónde nace | Qué devuelve la relación |
|---|---|---|
| Destinatario sin cuenta de portal | `resolverDestinatario` → `null` | `{delivered:false, skippedReason:'El destinatario no tiene cuenta de portal'}` |
| Preferencia / consentimiento en contra | `createRequest` → `suppressed` | `{delivered:false, notificationRequestId, skippedReason: suppressionReason ?? …}` + **igual intenta correo y chat** |
| Rebote (ya hay una viva) | `createRequest` → `debounced` | `{delivered:false, notificationRequestId, skippedReason:'Ya había un aviso igual sin entregar'}` + intenta correo |
| Entrega sin fila de bandeja | `deliverNotification` sin `inAppNotificationId` | `{delivered:false, skippedReason:'La entrega no produjo bandeja in-app'}` |
| Cualquier excepción del in-app | `catch` de `emit` | `{delivered:false, skippedReason:'La emisión del aviso falló; la operación no se revierte'}` |
| Cualquier excepción del correo | `catch` de `encolarCorreo` | `{emailSkippedReason:'No se pudo encolar el correo'}` — **no toca `delivered`** |
| Canal sin dirección | `findEmailForUser` → `null` | `{emailSkippedReason:'La cuenta no declaró correo'}` |

**El adaptador traduce, no decide.** Verificado: no hay ninguna regla de agenda dentro del adaptador
—ni permisos, ni estados de cita, ni ventanas horarias—. Lo único que elige es **por qué canal
intentar** (`KINDS_CON_CHAT`) y **con qué prioridad** (`PRIORIDAD`), que son propiedades del envío,
no del dominio.

### Seguridad — cómo viajan actor y organización

- **Actor:** nunca se propaga el usuario de la petición. Se firma con `notice.actorUserId ?? SEED.systemWorkerUserId`
  y rol `['SYSTEM']`. Es deliberado: los cuatro avisos los dispara un worker sin persona detrás.
- **Organización:** `tenantId` viaja **opcional**. Si el aviso no lo trae, la solicitud se crea sin
  tenant. **La separación por organización de la bandeja depende de que el emisor lo pase**, no de
  una validación del adaptador. → Es el caso 3 del catálogo, y con dobles **no se acredita**.
- **Sin datos clínicos por correo:** verificado en los cuatro redactores de `notices/agenda-notices.ts`:
  componen quién, cuándo, cuántos minutos y el motivo **administrativo**. El motivo de consulta no
  aparece y no debe agregarse.

## H1.S3.M3 — Lo que el doble **NO** prueba, por canal · `HECHO`

> Sin esta lista, `ADAPTER_VERIFIED_WITH_DOUBLES` se lee como integración terminada.

### Canal in-app

| Un doble acredita | Un doble NO acredita |
|---|---|
| Que el adaptador fue llamado con el aviso correcto | Que exista la **fila** en `messaging.in_app_notifications` |
| Que el resultado tiene la forma del contrato | Que el **destinatario real la vea** (acceso, tenant, estado no-leído) |
| | Que el `tenant_id` de la fila sea el correcto |

**Qué hace falta:** consultar la fila **desde una conexión independiente** y comprobar el acceso del
destinatario. Un `delivered: true` es un booleano del adaptador, no una bandeja.

### Canal correo

Tres estados **distintos** que se confunden todo el tiempo:

| Estado | Qué lo acredita | Quién lo produce |
|---|---|---|
| **Solicitud persistida** | Fila en `messaging.notification_requests` con `channel_id` = email | El adaptador (`emailRequestId`) |
| **Aceptación por transporte** | El proveedor aceptó el mensaje | El worker de mensajería |
| **Evidencia de entrega** | Fila en `messaging.notification_deliveries` con `provider_message_ref` | El worker contra el proveedor real |

`emailRequestId` es **el primero y sólo el primero**: es «encolado», no «entregado». Verificado en el
puerto (`:100-107`) y en el adaptador (`encolarCorreo` no entrega).

**Y un sumidero local prueba el transporte hacia ese sumidero: NO certifica un proveedor externo.**
El stack tiene `mock-provider-server`; mandarle un correo y verlo llegar no dice nada sobre Gmail.

### Canal chat (`SupportAdmin`)

| Un doble acredita | Un doble NO acredita |
|---|---|
| Que `chatDelivered` volvió `true` | Que exista la **conversación** |
| | Que el destinatario sea **miembro** de ella |
| | Que el mensaje le sea **visible** |

**Un booleano no acredita conversación, membresía ni visibilidad.** Además: `chatDelivered` está
**ausente** —no `false`— para `SLOT_RELEASED`, `PRACTITIONER_DELAY` y `APPOINTMENT_REMINDER`. Un
doble que siempre lo devuelve está mintiendo sobre el contrato.

## H1.S3.M4 — El control que impide un doble en producción (ADV-07) · `HECHO` (especificación)

### Qué hay hoy — localizado, no inventado

El proyecto **ya tiene** el patrón exacto para esto, en dos precedentes:

| Precedente | Qué impide | Cómo |
|---|---|---|
| `src/worker/worker.env.ts:201` `assertMockProviderNotInProduction` | Que `mock-provider-server` —que aprueba **toda** verificación— quede apuntado en producción | Lanza al cargar el env del worker |
| `src/common/verification/verification-bypass.env.ts:52` `assertVerificationBypassNotInProduction` | Que `DEV_VERIFICATION_BYPASS=true` llegue a producción | **Dos mitades**: `Joi.when('NODE_ENV','production', valid(false))` que aborta el arranque + el assert como defensa en profundidad |

Ese es el estándar de la casa, y es un control de verdad: **aborta el proceso**, no avisa.

### Qué falta para esta relación

**No existe guarda equivalente para `AGENDA_NOTICE_PORT`.** Hoy el riesgo es distinto del de una
variable de entorno, porque **ningún camino de producción bindea un doble**: el binding es fijo
(`useExisting: MessagingAgendaNoticeAdapter`) y el doble sólo entra por `overrideProvider` del
módulo de pruebas. Eso es una propiedad **verificable**, no una promesa.

### El control especificado, en tres capas

1. **Estructural (la que ya rige):** `src/` no puede importar de `test/`. Comprobable con una
   búsqueda que **falla** si aparece. Es el bloqueo *antes del envío*: si no hay import, no hay doble
   que bindear.
2. **De composición:** el binding de `AGENDA_NOTICE_PORT` en `scheduling.module.ts` es literal y sin
   condicional de entorno. Comprobable leyendo el proveedor resuelto **de la app compuesta**, no el
   archivo: `app.get(AGENDA_NOTICE_PORT).constructor.name` debe ser `MessagingAgendaNoticeAdapter`.
3. **De política — si alguien alguna vez agrega un binding por entorno:** tiene que seguir las dos
   mitades del precedente (`Joi` que aborta + `assert` al cargar). Un `if (env !== 'prod')` suelto
   **no es un control: es una intención**, y este documento lo rechaza explícitamente.

### El caso negativo que lo dispara

Intentar, a propósito, componer la app de producción con el doble bindeado y comprobar que **se
bloquea antes de emitir nada**. Se ejecuta en H5.S1, y la evidencia exigida son **fragmentos de
composición y política**, no el nombre de una variable.

### Lo que este control NO cubre

No impide mandar a un destinatario **real** desde un entorno de desarrollo: eso depende de a qué
apunta el proveedor de correo, que es configuración de mensajería y no de esta relación. Se ejercita
aparte en H5.S1.M2.
