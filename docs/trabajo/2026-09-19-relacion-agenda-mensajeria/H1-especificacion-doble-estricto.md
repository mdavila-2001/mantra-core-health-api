# H1.S1 — El doble estricto de `AgendaNoticePort` y su catálogo

> **Corte:** `5d5007fbdb7916b124010bbfbb560b7bb3aabc06` (`dev`) · **Estado del contrato:** `PROVISIONAL`
> — el artefacto versionado de Ender no existe todavía en el árbol; lo que sigue está derivado del
> **puerto real en el corte**, no del paquete.

## H1.S1.M1 — Localización del adaptador real · `HECHO`

| Artefacto | Ruta verificada (archivo abierto, no sólo grep) | Líneas |
|---|---|---|
| Puerto | `src/modules/scheduling/ports/agenda-notice.port.ts` | 133 |
| Adaptador | `src/modules/scheduling/adapters/messaging-agenda-notice.adapter.ts` | 440 |
| Adaptador de chat | `src/modules/scheduling/adapters/support-admin-notice.adapter.ts` | 165 |
| Binding | `src/modules/scheduling/scheduling.module.ts:142` | — |
| Spec unitario existente | `src/modules/scheduling/adapters/messaging-agenda-notice.adapter.spec.ts` | — |

**Homónimo que NO es el de esta relación:** `src/modules/profiles/adapters/messaging-affiliation-notice.adapter.ts`
también menciona `MessagingAgendaNoticeAdapter`. Es otro carril (afiliación), no el de agenda.
Quien busque sólo por nombre de clase se lo lleva por delante.

**Binding literal** — confirma lo que la verificación previa anticipaba:

```ts
// scheduling.module.ts:142
{ provide: AGENDA_NOTICE_PORT, useExisting: MessagingAgendaNoticeAdapter },
// agenda-notice.port.ts:133
export const AGENDA_NOTICE_PORT = Symbol('AGENDA_NOTICE_PORT');
```

`useExisting` y no `useClass`: el adaptador está **además** en `providers` por su clase, así que el
token y la clase resuelven **la misma instancia**. Para H5 esto importa: sustituir el token no basta
si alguien inyecta la clase concreta.

**Consumidores del puerto en el corte (4):** `scheduling-agenda-notices.service.ts`,
`scheduling-bookings.service.ts`, `scheduling-catalog.service.ts`, `scheduling-delay.service.ts`.

Evidencia: `evidencia/h1s1m1-localizacion-adaptador.txt`.

## H1.S1.M2 — Qué hace hoy el adaptador frente a la definición del puerto · `HECHO`

*Lectura. No se corrigió nada, por más que abajo haya observaciones.*

### Los 8 campos del resultado, y de dónde sale cada uno

| # | Campo | Tipo | Origen en el adaptador |
|---|---|---|---|
| 1 | `delivered` | `boolean` | `delivery.inAppNotificationId !== undefined` (`:256`). **Sólo in-app.** No es «llegó por algún canal» |
| 2 | `inAppNotificationId` | `string?` | `deliverNotification(...).inAppNotificationId` (`:246`) |
| 3 | `notificationRequestId` | `string?` | `createRequest(...).id` del canal in-app (`:200`) |
| 4 | `skippedReason` | `string?` | 5 textos distintos según el camino (ver tabla siguiente) |
| 5 | `emailRequestId` | `string?` | `createRequest(...).id` del canal correo (`:398`). **Encolado, no entregado** |
| 6 | `emailSkippedReason` | `string?` | 4 textos: «La cuenta no declaró correo», «…no acepta este aviso por correo», «Ya había un correo igual sin enviar», «No se pudo encolar el correo» |
| 7 | `chatDelivered` | `boolean?` | `SupportAdminNoticeAdapter.notify(...)`. **Ausente** salvo `BOOKING_STATE_CHANGED` |
| 8 | `chatSkippedReason` | `string?` | ídem |

### Los cinco `skippedReason` que el adaptador produce hoy, literales

| Camino | Texto exacto | `delivered` | ¿`notificationRequestId`? |
|---|---|---|---|
| Sin cuenta de portal (`:187`) | El destinatario no tiene cuenta de portal | `false` | **no** |
| Preferencia en contra (`:231`) | `suppressionReason` ?? El destinatario no acepta este aviso por el canal in-app | `false` | sí |
| Rebotada (`:240`) | Ya había un aviso igual sin entregar | `false` | sí |
| Entrega sin bandeja (`:262`) | La entrega no produjo bandeja in-app | `false` | sí |
| Excepción atrapada (`:152`) | La emisión del aviso falló; la operación no se revierte | `false` | **no** |

### Lo que el puerto promete y el adaptador cumple

- **No lanza** (`emit` envuelve `entregar` en `try/catch`, `:135-155`). Confirmado leyendo el código.
- **`emitMany` en serie** (`:167-172`): un aviso que falla no cancela los demás, y no hay paralelismo.
- **El correo va en su propio `try`** (`:341-410`) y **nunca degrada `delivered`**.
- **El chat corre después** y tampoco cambia el resto (`:274-286`).

### Observaciones registradas, NO corregidas (fuera de alcance)

| ID | Qué | Por qué importa |
|---|---|---|
| OBS-01 | El rebote del correo namespacea con `':email'` (`REBOTE_CORREO`, `:62`) porque `findLiveRequestByDebounceKey` **no filtra por canal**. Es un parche correcto sobre un defecto de mensajería, no del adaptador | Si mensajería algún día filtra por canal, este sufijo pasa a ser deuda silenciosa |
| OBS-02 | `debounce_key` **no tiene índice ni restricción única** en `SQL/35_messaging/` (ver H4) | La deduplicación es un *read-then-write*, no una garantía de la base |
| OBS-03 | `escaparHtml` escapa el `bodyText`, pero el `href` se compone con `env.webAppBaseUrl + payload.route` **sin escapar** (`:324`) | `route` lo produce el propio sistema hoy; si alguna vez viene de entrada de usuario, es inyección en atributo HTML |

## H1.S1.M3 — Especificación del doble estricto · `HECHO` (`PROVISIONAL`)

El doble es `StrictAgendaNoticePortDouble`, en `test/doubles/`. **No vive en `src/`.**

### Qué registra

Toda llamada a `emit`/`emitMany`, en orden, con el `AgendaNotice` completo recibido y una marca
lógica (contador monótono, no reloj de pared — ver caso 7 del catálogo).

### Qué valida — antes de devolver nada

1. **Forma:** `kind` ∈ los 4 literales del puerto; `subject` y `bodyText` no vacíos;
   `relatedResourceType` presente; `recipient` con **exactamente uno** de
   `patientProfileId`/`userId` (el puerto dice «uno de los dos, no los dos»).
2. **Semántica conocida:** si el `kind` no está en `KINDS_CON_CHAT`, el resultado previsto **no puede**
   traer `chatDelivered` ni `chatSkippedReason`.
3. **Previsión:** la llamada tiene que casar con un escenario **registrado de antemano**.

### Qué devuelve

**Sólo resultados previstos**: el `AgendaNoticeResult` que el escenario registrado declara, validado
contra los 8 campos antes de salir. Un resultado con un campo que el puerto no declara es un fallo
del harness, no un resultado.

### Qué hace ante lo no previsto

Lanza `UnexpectedAgendaNoticeCall` **y además** anota el fallo en una lista no consumida.
Ver M4: lanzar solo no alcanza.

## H1.S1.M4 — La regla de fallo del harness · `HECHO` — **no negociable**

> **Una llamada no registrada es un error del harness, no un fallo operacional.**
> El doble **no puede** devolver `{ delivered: false, skippedReason }` ante algo no previsto.

**Por qué, exactamente:** el puerto declara que `emit` **no lanza** y que los fallos vuelven como
`{ delivered: false, skippedReason }` (`agenda-notice.port.ts:122-126`, verificado). Si el doble
convierte «no te registré esta llamada» en `{delivered:false}`, ese valor es **indistinguible** de
un fallo operacional legítimo —sin cuenta de portal, preferencia en contra, canal caído—, y el
laboratorio empieza a producir verdes falsos: un test que esperaba `delivered:false` pasa por el
motivo equivocado. Esto es ADV-02.

**Y lanzar tampoco alcanza.** Los cuatro consumidores llaman al puerto dentro de código que
**atrapa**: emiten después de cerrar su transacción, precisamente para que un aviso roto no tumbe la
agenda. Una excepción lanzada dentro de ese `try` se la come la aplicación y el test termina en verde.

**Por eso la regla tiene dos mitades:**

1. El doble **lanza** `UnexpectedAgendaNoticeCall` en el punto de la llamada, y
2. el doble **acumula el fallo en `unconsumedFailures`**, y `assertClean()` —invocado en el
   `afterEach` del harness— **falla la prueba** si esa lista no está vacía, *aunque nadie haya visto
   la excepción*.

**Kill-test:** «¿qué pasa si el código de aplicación atrapa la excepción de una llamada no
registrada?» → **el test falla igual, en el cierre del harness.** Si la respuesta fuera «el test
pasa», esto no está hecho.

## H1.S1.M5 — Catálogo mínimo de escenarios · `HECHO`

Operación elegida: **`BOOKING_STATE_CHANGED`** (cancelación con motivo). Motivo de la elección: es
el **único** `kind` que ejercita los **tres** canales —in-app, correo y chat—, así que es el que más
superficie del contrato cubre por escenario.

| # | Escenario | Qué se comprueba | Oráculo |
|---|---|---|---|
| 1 | Cambio propio válido con aviso correcto | Los 8 campos coherentes: `delivered:true`, `inAppNotificationId` presente, `emailRequestId` presente, `chatDelivered:true` | El `AgendaNotice` registrado por el doble + el resultado devuelto. Con base real (H3): **la fila** de `messaging.in_app_notifications` |
| 2 | Proveedor indisponible | `delivered:false` con `skippedReason` **del catálogo de cinco**, no un texto nuevo | Los 5 textos literales de M2. Un `skippedReason` fuera de esa lista es un hallazgo, no un pass |
| 3 | Recurso o actor de otra organización | El aviso **no** se emite, o se emite con `tenantId` ajeno y eso queda visible | `notice.tenantId` registrado vs el tenant del recurso. **Con dobles esto NO acredita aislamiento**: lo acredita la fila con su `tenant_id` (H3) |
| 4 | Doble con respuesta incompatible | Un resultado con campo fuera de los 8, o `chatDelivered` en un `kind` sin chat → **falla** | La validación de salida del doble |
| 5 | Operación no registrada | `UnexpectedAgendaNoticeCall` **y** `assertClean()` en rojo aunque la app atrape | Ver M4. Es el caso que hace honesto a todo el resto |
| 6 | Repetición según idempotencia definida | Dos `emit` con el mismo `debounceKey` → **efectos persistidos = 1** | **Conteo en `messaging.notification_requests`**, no el contador de llamadas del doble. Con dobles solos este caso es `NOT_RUN`: lo cierra H4 |
| 7 | Reloj y destinatario reproducibles | Dos corridas producen el mismo `subject`/`bodyText` y el mismo destinatario, con reset entre casos | Reloj inyectado fijo + `reset()` del doble en `afterEach`. Sin reset, el caso 6 contamina al 1 |

**Nota de método:** el ejemplo de escenario del paquete es formato de trabajo, no política de Mantra.
Los oráculos de arriba son los que el código del corte permite observar, no los que se querrían.
