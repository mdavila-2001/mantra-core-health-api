# Reporte — H5: Notificaciones, comunidad y visitadores (BR-22, BR-27, BR-26)

Carril M7 · Lenovo Legion · 2026-09-26. Repos: `mantra-core-health-api` (este) y
`mantra-core-health`. Orden ejecutado: BR-22, BR-27, BR-26 (BR-26 al final, toca el modelo).

Decisiones de producto: `docs/progress/DECISIONS.md` de este repo (sección «H5») y el del front.
Evidencia literal: `live-h5-verification.txt` en esta carpeta.

## COMPLETADO

### BR-22 — Notificaciones y tiempo real

| Hallazgo | Qué se hizo | Peldaño |
|---|---|---|
| AG-22 (transporte de la campana) | `NotificationsGateway` nuevo (namespace por defecto, mismo socket del chat); `emitInApp()` lo llama tras el commit, sólo si no está suprimida/aplazada | TESTED (16 specs) — no se abrió un socket.io real en esta corrida |
| AG-06/AG-21 (destinos) | `notification-routes.ts`/`notifications.types.ts` mapean `scheduling.appointment_bookings`/`bookable_slots` y `SERVICE_REQUEST`; mock alineado | TESTED (specs de rutas y del mock) |
| TX-17 (token del socket) | `chat-socket.service.ts`: `auth` como función, lee el token vigente en cada reconexión; desconecta al cerrar sesión | TESTED |
| AG-19/AG-20 (F4, parcial) | Socket escucha `typing`/`presence`/`message:deleted`; `DirectMessage.deletedAt` convertido correctamente | TESTED — NO_CUBIERTO: la UI del hilo no consume estos eventos todavía (ver abajo) |
| AG-17 (stickers) | Allowlist `STICKER_PACK_FILE_IDS` en `AttachableFileService`/`community-messaging.service.ts`; `StickerPackSeedService` nuevo | VERIFIED (bug de orden de flush encontrado y corregido contra Postgres real; 24 filas confirmadas por SQL) |
| TX-18 (sondeo) | `notifications.store.ts` saltea la llamada con `document.hidden`, sigue agendando solo | TESTED (fake timers) |

### BR-27 — Comunidad: moderación y funciones sin UI

| Hallazgo | Qué se hizo | Peldaño |
|---|---|---|
| AG-18 (apelar sin ser el sancionado) | `community-moderation.service.ts.appeal()` exige `findStrikeByDecisionAndSubject`; 403 si no coincide | TESTED (43 specs) + VERIFIED el 403 contra un perfil ajeno vía HTTP real |
| AG-18 (lectura `decisions/mine`) | `GET /community/moderation/decisions/mine`, sin `@Roles`, declarada antes que la de `SECURITY_ADMIN`; `assertOwnProfile` | VERIFIED: ruta mapeada en el orden correcto, valida UUID (400), responde 200 con página vacía para SUPERADMIN |
| AG-23 (cliente sin UI) | `listMyModerationDecisions` en el front | TESTED — sin pantalla «Mis sanciones» |

### BR-26 — Visitadores médicos (alcance: sin DDL)

| Hallazgo | Qué se hizo | Peldaño |
|---|---|---|
| AG-31 (rol al vincular) | `medical-visitors.service.ts`: asigna/revoca `MEDICAL_VISITOR` en la misma transacción de alta/baja/revinculación, vía `AuthzGrantsService`/`UserRoleAssignmentsRepository` (exportados de `AuthzModule`) | TESTED (15 specs) — no VERIFIED: bloqueado por AG-30 (ver abajo), no por este cambio |
| AG-30 (500 en `pharma_lab`) | No se tocó (SIN DDL). Pedido explícito a M1: ver D-PharmaLab-2 en DECISIONS.md | BLOQUEADO, pedido registrado |

## A MEDIAS

### AG-19/AG-20 — F4 del chat, capa de UI
- Qué anda: el socket escucha los tres eventos nuevos y `DirectMessage` trae `deletedAt`
  correctamente convertido (fecha real, no string con tipo Date — mismo patrón que `sentAt`).
- Qué no anda: `chat.store.ts` no se suscribió a `onTyping`/`onPresence`/`onMessageDeleted`, así
  que la burbuja no dice «Se eliminó este mensaje» y no hay indicador de «escribiendo…» ni de
  presencia en pantalla. Favoritos/archivados/fijado siguen en `localStorage`
  (`chat-preferencias.ts`) en vez de `PATCH .../participant`. La bandeja no manda `q`/`cursor`.
- Qué falta exactamente: consumir los tres observables nuevos en `chat.store.ts`/el componente
  del hilo, migrar `chat-preferencias.ts` a los métodos del cliente que ya existen
  (`updateParticipant`), y sumar `q`/`cursor` a la llamada de bandeja.
- Dónde quedó: rama `legion/test-h5-notificaciones-comunidad` del front, compila y typechecka
  limpio; ningún test en rojo por esto.

### BR-27 — Comunidad completa (AG-23) y CV-26 (grupos médicos)
- Qué anda: la corrección de seguridad de `appeal()` y la lectura `decisions/mine`, con su
  cliente HTTP.
- Qué no anda: no hay pantallas «Mis sanciones», «Seguir» ni «Responder reseña»; no se tocaron
  encuestas, bloquear ni grupos médicos (CV-26, módulo entero).
- Qué falta exactamente: los tres componentes de pantalla (`ng generate`), sus rutas,
  entradas en `navigation.map.ts`, estados M34, y prueba visual (regla `NO_EVIDENCE_NO_DONE`
  del front). CV-26 es un carril propio (formulario, ciclo de vida, ventana de 7 días).
- Dónde quedó: D-Comunidad-1 en DECISIONS.md explica la priorización.

## PENDIENTE

| Hallazgo | Estado | Qué lo destraba |
|---|---|---|
| AG-07 (regla real de horario liberado) | El mock sigue con la heurística de 10 min | Modelar lista de espera en el mock, o aceptar la heurística como decisión de producto |
| AG-30 (schema `pharma_lab` inexistente) | Bloqueado, sin DDL en este carril | M1: diagrama 67 (coordinar con AG-44/`data_catalog` de BR-30), DDL, `db:vendor`, `schemas.catalog.ts` |
| AG-43/CV-17 (54/76 rutas de `pharma_lab` sin UI) | No se tocó | Depende de AG-30: construir contra el mock antes de que el modelo exista duplica trabajo |
| Camino completo apelación (reporte→decisión→strike→apelar→201) | Cubierto por unitarios, no por HTTP real | Dar de alta 2 perfiles + publicación + pasar por `report()`/`decide()` en una corrida dedicada |

## Evidencia

Ver `live-h5-verification.txt` en esta misma carpeta: aplicación de esquema, arranque limpio,
el bug de `fk_file_versions_file_id` encontrado y corregido contra Postgres real, y las
llamadas HTTP en verde del endpoint `decisions/mine` y del 403 de `appeal()`.

Comandos de verificación unitaria (los commits de este hito):

    corepack yarn typecheck
    corepack yarn test --testPathPatterns="notifications-in-app.service|notifications.gateway"   # 16/16
    corepack yarn test --testPathPatterns="sticker-pack-seed|attachable-file|community-messaging.service|seed-bootstrap"  # 71/71
    corepack yarn test --testPathPatterns="community-moderation"                                 # 43/43
    corepack yarn test --testPathPatterns="medical-visitors"                                      # 15/15
    corepack yarn test --testPathPatterns="authz"                                                 # 110/110 (sin regresión)

Front (`mantra-core-health`):

    corepack yarn typecheck
    corepack yarn test --watch=false --include=src/app/core/notifications/**       # 8+37 en verde
    corepack yarn test --watch=false --include=src/app/core/data-access/community/community.client.spec.ts  # 31/31
    corepack yarn test --watch=false --include=src/app/core/mock/horario-liberado.spec.ts --include=src/app/core/mock/handlers/scheduling.handlers.spec.ts  # 45/45

## No cubierto

- AG-29 (documentar el upgrade de `/socket.io/` en el entorno de demo): no se tocó
  `deploy/README`/`docs/operations/` — no se levantó nginx en esta corrida.
- Playwright `carril-chat-realtime.spec.ts`: no se corrió contra este stack.
- `check-*.mjs` del front: no se corrieron a mano en esta pasada.
- Ambigüedades Q-01/Q-02/Q-03 del encargo M7: no aplican directamente a H5 (son de H1).

## Desvíos del plan

- BR-26 se ejecutó con alcance reducido respecto al prompt original (que pide DDL completo del
  módulo `pharma_lab`, 4 capas): por instrucción explícita del encargo («SIN DDL en la API»), sólo
  avanzó lo que no requiere modelo (AG-31). AG-30, AG-43 y CV-17 quedan pedidos a M1/pendientes.
- `AuthzModule` exporta 3 providers nuevos (`AuthzGrantsService`, `RolesRepository`,
  `UserRoleAssignmentsRepository`) para que `pharma_lab` pueda asignar/revocar el rol. Es aditivo
  al arreglo `exports:[]` existente y no toca ningún `@Roles` ni `role-mapping.ts` (tabla de M2
  del encargo), pero es un cambio de superficie de un módulo que no es dueño de este hito — se
  documenta acá y en D-PharmaLab-1 de DECISIONS.md.
- No se abrieron PRs separados por prompt (BR-22/BR-27/BR-26): el encargo pide «un PR por hito»
  (H5), así que los tres prompts van en un solo PR por repo.

## Pedidos a otras máquinas

- M1: promover `pharma_lab` (31 entidades, diagrama 67, coordinar con AG-44/`data_catalog`
  de BR-30) por las 4 capas — ver D-PharmaLab-2. Sin esto, AG-30 sigue dando 500 y AG-43/CV-17 no
  tienen API real contra la cual construir.
- BR-06 (quien la tome): si ya resolvió el camino de roles al token por membresía en el login
  (opción B), avisar — este carril ya lo resolvió por A (asignación en `authz`) para
  `pharma_lab`; no debería hacerse dos veces (D-PharmaLab-1).
- BR-21/scheduling (quien lo tome): sumar el push de `notification:new` a
  `MessagingAgendaNoticeAdapter`/`createRequest()`, o migrar la agenda a `emitInApp()` — hoy el
  push de este carril no llega a los avisos de agenda (D-Notif-2).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
