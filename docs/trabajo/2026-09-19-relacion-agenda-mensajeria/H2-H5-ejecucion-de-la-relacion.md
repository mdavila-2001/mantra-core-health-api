# H2 a H5 — La relación ejercitada, integrada, medida y acorralada

> **Corte:** `5d5007fbdb7916b124010bbfbb560b7bb3aabc06` · **Rama:** `justin/noche-2026-09-19-relacion-agenda-mensajeria`
> **Suites:** `test/integration/agenda-mensajeria-relacion.int-spec.ts` (25) ·
> `test/integration/agenda-mensajeria-persistencia.int-spec.ts` (8) · **33/33 en verde, exit 0**

## El titular, antes que nada

**La relación `agenda → mensajería` no entrega ni un solo aviso contra la base de desarrollo
poblada, y lo hace en silencio.** No es una hipótesis: es la salida del runner.

```text
[H3.S1.M2] resultado real: {"delivered":false,"skippedReason":"La emisión del aviso falló; la operación no se revierte"}
```

Causa raíz, **observada** en el log del propio adaptador, no inferida:

```json
{"level":50,"context":"MessagingAgendaNoticeAdapter","operation":"scheduling.notice.emit",
 "kind":"BOOKING_STATE_CHANGED",
 "err":{"type":"ResourceNotFoundException","message":"Canal no encontrado"}}
```

Detalle completo en **HALL-02** del `REPORTE.md`.

## H2 — Ejercitar la relación con dobles fijados de ambos extremos

**Estado declarado: `ADAPTER_VERIFIED_WITH_DOUBLES`.** Ni una palabra más fuerte.

### H2.S1 — El adaptador contra el contrato fijado

| ID | Estado | Qué pasó |
|---|---|---|
| H2.S1.M1 | `BLOQUEADO` | **No existe artefacto de contrato versionado de Ender** en el árbol al corte. Buscado por nombre, por ruta candidata (`contracts/`, `docs/contracts/`) y por patrón; los hits de «contract» son de `integration_contracts` (módulo 31) y de ERP, otra cosa. El contrato de facto es el puerto, fijado por **blob sha1 `4e262747735005c16262a907de3caf09a1268923`** (`git rev-parse HEAD:src/modules/scheduling/ports/agenda-notice.port.ts`). Marcado `PROVISIONAL` |
| H2.S1.M2 | `HECHO` | 5 casos ejecutados: cada campo del aviso con origen y destino demostrados |
| H2.S1.M3 | `HECHO` | 8 casos ejecutados: los 7 modos de error del mapeo, más `emitMany` |

**Lo que el mapeo de datos demostró, ejecutando:**

- `kind` → `payloadJson.kind` + `categoryConceptId` + `priority`, los tres derivados.
- `recipient.patientProfileId` → resuelto a cuenta antes de crear la solicitud.
- `tenantId` **se omite del DTO** cuando el aviso no lo trae — no viaja como `null`.
- `debounceKey` → in-app tal cual; **correo con sufijo `:email`**.
- `payload.route` → botón absoluto en el `bodyHtml` del correo.
- El actor es **uno solo** para las dos solicitudes (in-app y correo).

> **Un defecto de mi propio harness, que vale registrar.** La primera corrida dio 20/21. El rojo era
> mío: la grabadora del doble copiaba `tenantId: dto.tenantId`, creando la clave aunque valiera
> `undefined`, así que `'tenantId' in solicitud` medía **la grabadora, no al adaptador**. Se corrigió
> guardando `Object.keys(dto)`. Es exactamente el error que un doble permisivo esconde.

**Lo que el mapeo de errores demostró:** los 5 `skippedReason` del catálogo salen por el camino que
la ficha dice, el correo **nunca degrada `delivered`**, y `emitMany` sigue con los demás cuando uno
falla. Además apareció una asimetría que no estaba escrita en ningún lado:

| Camino | ¿intenta correo? | ¿intenta chat? |
|---|---|---|
| Suprimida por preferencia | **sí** | **sí** |
| Rebotada | **sí** | **no** |

No es un defecto declarado: es una diferencia de comportamiento **no documentada** entre dos caminos
que se parecen. Queda como AMB-02 para que Ender la fije en el contrato.

### H2.S2 — Los dobles de los dos extremos

| ID | Estado | Qué pasó |
|---|---|---|
| H2.S2.M1 | `A MEDIAS` | El doble del **consumidor** (`StrictAgendaNoticePortDouble`) está fijado por el sha1 del puerto. El del **proveedor** (`ExtremoProveedorFijado`) está fijado por el commit, no por una versión publicada de mensajería: mensajería no publica versión de contrato |
| H2.S2.M2 | `HECHO` | ADV-12 **dejó de ser hipótesis**: ver abajo |
| H2.S2.M3 | `HECHO` | Estado registrado: `ADAPTER_VERIFIED_WITH_DOUBLES` |

**ADV-12 — el doble satisface el catálogo y el proveedor real devuelve lo contrario.**
No hubo que construir el escenario: **ocurrió**.

| Extremo | Qué dice |
|---|---|
| Doble del proveedor | `delivered: true`, `inAppNotificationId` presente, `emailRequestId` presente, `chatDelivered: true` |
| Proveedor **real** | `delivered: false`, `skippedReason: 'La emisión del aviso falló…'`, **cero filas** |

**No se alteró el contrato para forzar verde.** Se abrió la discrepancia (HALL-02), con dueño, y el
doble quedó como está — porque el doble no está mal: está describiendo el contrato. Quien está mal
es la composición real.

### H2.S3 — Compatibilidad temprana

| ID | Estado | Qué pasó |
|---|---|---|
| H2.S3.M1 | `BLOQUEADO` | **No hay versiones que combinar.** El contrato existe en una sola versión (el puerto al corte). Una matriz de una fila no es una matriz; inventar versiones para llenarla sería peor que no tenerla |
| H2.S3.M2 | `HECHO` | Los resultados están registrados con los 13 campos en `registro-de-checks.json` |

## H3 — Integrar con los artefactos que ya estén listos

**Estado declarado: NO se alcanza `INTEGRATION_VERIFIED_WITH_REAL_IMPLEMENTATIONS`.**
Los participantes reales estaban disponibles; la relación **falló** contra ellos.

| ID | Estado | Qué pasó |
|---|---|---|
| H3.S1.M1 | `HECHO` | Participantes reales: PostgreSQL 5433 (1 184 tablas, 6 664 FKs), mensajería real, cuenta real de `iam.users`. **Y el hallazgo: el canal que el adaptador direcciona no existe** |
| H3.S1.M2 | `HECHO` | Ejecutada. Falló con causa, y la causa quedó capturada |
| H3.S1.M3 | `HECHO` | Comprobado desde **conexión independiente** (`pg.Client` propio): **0 filas**. Ni solicitud, ni bandeja |
| H3.S2.M1 | `A MEDIAS` | In-app: la consulta de fila y acceso está escrita y corre, pero no hay fila que mirar |
| H3.S2.M2 | `HECHO` | Correo: **los tres estados quedaron separados y medidos** — ver abajo |
| H3.S2.M3 | `NOT_RUN` | Chat: el in-app falla antes de llegar al chat |
| H3.S3.M1 | `HECHO` | Estado **por relación**: `ADAPTER_VERIFIED_WITH_DOUBLES` |
| H3.S3.M2 | `HECHO` | Faltantes y destrabes en la tabla del `REPORTE.md` |

**Correo — los tres estados, separados como exige la ficha:**

| Estado | Qué lo acredita | Resultado medido |
|---|---|---|
| Solicitud persistida | Fila en `notification_requests` | **no ocurrió** |
| Aceptación por transporte | El proveedor aceptó | **no ocurrió** (no corre el worker) |
| Evidencia de entrega | `provider_message_ref` en `notification_deliveries` | **no ocurrió** |

Y un dato del contrato que sólo aparece ejecutando: **`emit` puede devolver un resultado sin
ningún campo de correo** —ni `emailRequestId` ni `emailSkippedReason`—, porque el in-app falló
antes de llegar al `try` del correo. Leer esa ausencia como «no hacía falta correo» sería falso.
Es AMB-03.

## H4 — Idempotencia, concurrencia y recuperación

| ID | Estado | Qué pasó |
|---|---|---|
| H4.S1.M1 | `NOT_RUN` | ADV-05 ejecutado, **sin poder medir**: 0 efectos persistidos. **0 filas NO es «idempotente», es «no hizo nada»** — y confundirlos sería el verde falso más caro de la noche |
| H4.S1.M2 | `NOT_RUN` | Misma clave con payload distinto: sin persistencia no hay qué comparar |
| H4.S1.M3 | **`HECHO`** | **La deduplicación NO descansa en la base.** Ver abajo |
| H4.S2.M1 | `NOT_RUN` | Dos emisiones en paralelo con la misma clave: 0 filas, nada que medir |
| H4.S2.M2 | `HECHO` | La precondición **no** está en la escritura. Ver abajo |
| H4.S3.M1-M3 | `BLOQUEADO` | ADV-09 exige commit de negocio + caída en la emisión. Sin emisión que persista, no hay caída que simular. **Y el oráculo de negocio no existe: Q-06 sigue `DECISION_REQUIRED`** |

### H4.S1.M3 — La deduplicación es un *read-then-write*, no una garantía

Verificado contra el DDL canónico y contra la base viva:

```sql
select indexdef from pg_indexes
 where schemaname='messaging' and tablename='notification_requests'
   and indexdef ilike '%debounce_key%';
-- 0 filas
```

`messaging.notification_requests.debounce_key` **no tiene índice, ni único ni común.** La
deduplicación vive en `NotificationsService.createRequest`: un `findOne` por `debounceKey` y, si no
hay, un `insert` — dentro de `em.transactional`, que bajo READ COMMITTED **no impide** que dos
transacciones concurrentes vean ambas «no hay» e inserten las dos.

**El propio repositorio tiene el patrón correcto a dos tablas de distancia:**

| Tabla | Índice |
|---|---|
| `messaging.outbox_messages` | `uq_outbox_messages_idempotency_key` UNIQUE |
| `messaging.queued_jobs` | `uq_queued_jobs_dedupe_key` UNIQUE |
| **`messaging.notification_requests`** | **ninguno sobre `debounce_key`** |

Esto es HALL-03. **No se corrigió**: el DDL sale de `SQL/`, que se genera desde los `.puml` y no
vive en este repo. Es cambio de modelo, con su propio dueño.

### H4.S2.M2 — La precondición no está en la escritura

Es el corolario del anterior, y es literalmente el `if` previo que la regla 96.3.2 prohíbe:

```ts
// notifications.service.ts — el if previo
if (dto.debounceKey) {
  const live = await this.notificationsRepo.findLiveRequestByDebounceKey(...);
  if (live) return { id: live.id, debounced: true };   // ← lee
}
// … más abajo, sin condición en el INSERT                 ← escribe
```

No hay `UPDATE … WHERE`, no hay `ON CONFLICT`, no hay `SELECT … FOR UPDATE` sobre una fila que
sirva de cerrojo. **Con una restricción única, la carrera se resolvería sola** con un `23505` que el
código podría traducir a `debounced: true`.

## H5 — Que un doble no llegue a producción ni salga a un destinatario real

| ID | Estado | Qué pasó |
|---|---|---|
| H5.S1.M1 | `HECHO` (con hallazgo) | El control **estructural** existe y se ejecutó. El control **de runtime no existe** |
| H5.S1.M2 | `BLOQUEADO` | Salida a destinatario real: no se ejercitó — con el in-app roto, nada sale. Además exigiría apuntar a un proveedor real, que es justo lo que no se debe hacer para probarlo |
| H5.S1.M3 | `HECHO` | Evidencia de composición, no de variable de entorno |
| H5.S2.M1 | `HECHO` | ADV-12 ocurrió solo (ver H2.S2) |
| H5.S2.M2 | `HECHO` | Discrepancia registrada sin tocar el contrato |
| H5.S3.M1 | `HECHO` | `registro-de-checks.json`, 13 campos por check |
| H5.S3.M2 | `HECHO` | Estado final por relación |

### Lo que sí se ejecutó

```text
[H5.S1.M3] AGENDA_NOTICE_PORT resuelve a: MessagingAgendaNoticeAdapter
```

- **Composición real:** se le preguntó a la app compuesta qué instancia respondió al token. No es
  el nombre de una variable: es el objeto.
- **`useExisting` verificado:** `app.get(MessagingAgendaNoticeAdapter) === app.get(AGENDA_NOTICE_PORT)`.
  Importa para el control: sustituir sólo el token dejaría viva la clase para quien la inyecte
  directo.
- **Estructural:** **ningún archivo de `src/` importa de `test/`** — barrido recursivo, 0 infractores.
  Si no hay camino de import, no hay doble que bindear. Ése es el bloqueo *antes del envío*.
- **El doble no entra al build:** `tsconfig.build.json` excluye `test/`.

### Lo que NO existe, y hay que decirlo

**No hay guarda de runtime que impida bindear un doble de `AGENDA_NOTICE_PORT` en producción.**
El repositorio **tiene el patrón** para hacerlo, en dos precedentes verificados:

| Precedente | Mecanismo |
|---|---|
| `src/worker/worker.env.ts:201` `assertMockProviderNotInProduction` | Lanza al cargar el env |
| `src/common/verification/verification-bypass.env.ts:52` | **Dos mitades**: `Joi.when('NODE_ENV','production', valid(false))` que aborta el arranque + assert en profundidad |

Hoy el riesgo real es bajo —el binding es literal y no hay flag de entorno que lo cambie—, así que
la recomendación **no** es agregar una guarda contra un ataque que nadie puede ejecutar: es
**escribir la regla antes de que alguien agregue el flag**. Está en H1.S3.M4, capa 3.

**Kill-test de H5:** «intentá configurar el doble en la composición de producción». Respuesta
honesta: **hoy no hay dónde configurarlo** — no existe la palanca. Eso es más fuerte que un `if`,
pero es una propiedad del código actual, no un control que resista que alguien agregue la palanca.
