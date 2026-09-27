# Plan — Aviso al tutor del paciente de mostrador (walk-in)

- Fecha: 2026-09-26 · Repo: `mantra-core-health-api` (rama `pablo/aviso-tutor-2026-09-26` desde `origin/test` @ `6b44f0c0`).
- Resultado observable: cuando el mostrador registra un paciente con tutor y teléfono, el alta deja un evento de dominio en el outbox; un suscriptor encola el aviso y el worker de mensajería le manda al teléfono del tutor (E.164) un enlace de un solo uso para confirmar el vínculo.
- Techo honesto: **`TESTED`** (unitarias con repositorios y cliente HTTP dobles). No hay base ni proveedor SMS/WhatsApp contratado: el camino real se verifica contra el doble.

## Hallazgos que fijan el diseño (verificados en código)

1. `walk-in-patient.ts:154-167` crea al tutor con `createGuardianRelatedPerson` y no emite nada; la función devuelve `boolean` y ningún llamador lo usa.
2. El API ya tiene outbox transaccional (`OutboxService.publishDomainEvent(tx, …)`, módulo 35) con relay → fan-out a `event_subscriptions` → `queued_jobs` → `QueueJob` del worker con `registerQueueJobHandler`. No hay `EventEmitter2`. El consumidor interno de referencia es `AudioGenerationJob` (cola `audio-generation`).
3. `messaging.notification_requests.recipient_user_id` es `NOT NULL` con FK a `iam.users`: el tutor de un walk-in **no tiene cuenta**, así que el aviso no puede viajar por `notification_requests`. Hace falta un registro propio de la invitación.
4. `NotificationDeliveryJob` tiene adaptadores Gmail y mock, ninguno de teléfono.
5. La decisión P-15-2 (`agenda-notices.env.ts`) prohíbe tokens de acción clínica sin sesión. El enlace del tutor **no** ejecuta ninguna acción clínica: sólo confirma que el teléfono es de quien dice ser (sin PHI en la respuesta). Se declara como desvío acotado.

## Alcance
- IN: `src/modules/profiles/**` (contrato, entidad, repositorio, servicio, controladores, DTO, conceptos, módulo), `src/modules/scheduling/services/{walk-in-patient,scheduling-walk-in.service}.ts` y specs, `src/modules/profiles/services/guardian-related-person.ts` (devolver ids), `src/common/seed/messaging-seed.service.ts` (cola + suscripción), `src/worker/jobs/messaging/**` (puerto `PhoneMessagingChannel`, adaptadores, suscriptor, módulo), `src/worker/worker.env.ts`, `.env.example`, `docker-compose*.yml` (cola del worker de mensajería), `database/SQL/patches/2026-09-26_v4234_guardian_link_invitations.sql`, este directorio.
- OUT: front (no hay pantalla de confirmación; se documenta), contratación de proveedor, `isLegalGuardian` (confirmar el teléfono no prueba la tutela), DDL generado de `05_profiles` (se pide al modelo).

## H1 — El alta publica el hecho en el outbox
**CA:** Dado un walk-in con tutor y teléfono, cuando se confirma la transacción, entonces existe un `GuardianLinkRequested` en el outbox con ids (sin nombre ni teléfono). Sin tutor o sin teléfono no se publica.
**DoD:** `npx jest src/modules/scheduling/services/scheduling-walk-in.service.spec.ts src/modules/scheduling/services/walk-in-patient.spec.ts` → PASS.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | `createGuardianRelatedPerson` devuelve `{guardianPersonId, relatedPersonId, contactPointId?}` o `undefined` | los tres llamadores compilan sin cambio | `npx tsc --noEmit` | HECHO |
| H1.S1.M2 | `GuardianLinkService.requestInTransaction` publica el evento en el `tx` del alta | con teléfono publica 1; sin teléfono 0 | spec del servicio | HECHO |
| H1.S1.M3 | `SchedulingWalkInService` lo llama con el tenant de la reserva | spec del walk-in | spec | HECHO |

## H2 — El suscriptor emite la invitación y el worker la envía
**CA:** Dado el job `event:GuardianLinkRequested`, cuando el worker lo procesa, entonces la API emite una invitación (token de 32 bytes, se guarda sólo su SHA-256, vence a las 72 h) y el canal de teléfono la envía a un número E.164; el resultado queda en la fila. Teléfono no normalizable → `INVALID_PHONE`, terminal, sin reintento.
**DoD:** specs de `phone-e164`, `guardian-link.service`, `guardian-link.subscriber`, adaptadores → PASS.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Parche v4234 `profiles.guardian_link_invitations` (idempotente) + entidad + repositorio | UNIQUE por `domain_event_id` y por `token_hash` | revisión del SQL + tsc | HECHO |
| H2.S1.M2 | `toE164` (Bolivia por defecto, +591) en tres niveles | correcto / límite / inválido | spec | HECHO |
| H2.S1.M3 | `POST /internal/guardian-links/issue` y `POST /internal/guardian-links/:id/delivery` (rol `SYSTEM`/`SYSTEM_WORKER`) | idempotente por evento; reemisión rota el token | spec | HECHO |
| H2.S2.M1 | Puerto `PhoneMessagingChannel` + `MockPhoneMessagingChannel` (sin PHI en el log) + `TwilioPhoneMessagingChannel` activado sólo con credenciales | sin credenciales → mock y log de arranque explícito | spec | HECHO |
| H2.S2.M2 | `GuardianLinkSubscriber` registra el handler de la cola `guardian-links` | envío OK → `SENT`; fallo → reporta y relanza (reintento de la cola) | spec | HECHO |
| H2.S2.M3 | Semilla de cola, DLQ y suscripción; `MESSAGING_QUEUE_CODES` del worker de mensajería | la suscripción casa con `eventVersion` 1 | spec de la semilla | HECHO |

## H3 — El tutor confirma
**CA:** Dado el token del enlace, cuando se hace `POST /public/guardian-links/confirm`, entonces la invitación pasa a `CONFIRMED` una sola vez; token vencido, desconocido o ya usado → 404/410 sin revelar datos.
**DoD:** spec del servicio → PASS.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Controlador público con `@Public()` + `@Throttle` y DTO del token | tres niveles | spec | HECHO |
