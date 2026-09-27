# Plan — P42 + P43 · reconsulta atada a su consulta y `formInstanceId` en cuatro creates

- Fecha: 2026-09-26 · Repos afectados: `mantra-core-health-api` (rama `justin/form-instance-id-test-2026-09-26` desde `origin/test` @ `6b44f0c0`) · Predecesor: pendiente P43 del front (`wt-front-test`, `FollowUpOrigin.formInstanceId`)
- Resultado observable: la pantalla de consulta puede mandar `formInstanceId` al prescribir (`POST /clinical/medication-requests`), al ordenar (`POST /clinical/service-requests`) y al crear un plan (`POST /charts/care-plans`) sin recibir 400; la API lo guarda, lo devuelve y rechaza con 422 una instancia inexistente, abierta o de otro encuentro.
- Kill-test: validar con `class-validator` (`forbidNonWhitelisted`) el cuerpo de cada create con `formInstanceId`. Si dice `property formInstanceId should not exist`, no está hecho.

## Alcance
- IN (ampliado a pedido del coordinador, ver «Desvíos» del reporte): P42 completo — `scheduling` (entidad, repositorio, DTO de escritura y lectura, servicio, módulo, specs), `clinical/repositories/appointments.repository.ts` (tipología opcional), `database/SQL/patches/2026-09-26_v4231_appointment_follow_up_of.sql`.
- IN: `src/modules/forms/services/form-instance-origin.validator.ts` (+ spec, + índice), `src/modules/clinical/{entities,repositories,dto,services}` de receta y orden, `clinical.module.ts`, `src/modules/chart/{entities,repositories,dto,services}` de plan de cuidado, `chart.module.ts`, lecturas que ya devuelven `encounterId` de esos registros (resumen clínico → `medicationRequests`, `diagnostics` → `orders`), `database/SQL/patches/2026-09-26_v4232_form_instance_id.sql`, `openapi/openapi.{json,yaml}` si el generador corre, specs dirigidas.
- OUT: `mantra-core-health-model` (los `.puml` y el `CREATE TABLE` generado: el patch es para bases ya aplicadas; pedido al dueño del modelo) · el front.
- Ambigüedades registradas:
  - A1 · `followUpOf` (P42) no existía en la API de `origin/test`. Resuelto: el coordinador amplió el alcance y P42 se implementa en esta misma rama (H2).
  - A2 · La ruta pide `database/SQL/99_migrations/…`, pero la copia versionada no tiene `99_migrations` y su convención para ALTER incrementales es `patches/AAAA-MM-DD_vNNNN_*.sql` (último en `origin/dev` del modelo: v4230). Supuesto: `patches/2026-09-26_v4231_appointment_follow_up_of.sql` (P42) y `patches/2026-09-26_v4232_form_instance_id.sql` (P43); `docker/db-init/init-postgres.sh` aplica `patches/` y documenta que `99_migrations/` era el nombre viejo que no aplicaba nada. Confirmar: dueño del modelo.
  - A3 · "Cerrada" = `state_concept_id = FORMS.INSTANCE_CLOSED` (lo que escribe `closeInstance`, junto con `closed_at`).
  - A4 · "Pertenece al encuentro" = `form_instances.resource_id = encounterId` (las fichas se abren sobre la consulta; `resource_id` es el encuentro).

## H1 — Los tres creates aceptan, validan, guardan y devuelven `formInstanceId`
**CA:** Dado un create con `formInstanceId`, cuando la instancia existe, está cerrada y es del mismo encuentro (o el registro no tiene encuentro), entonces se crea la fila con `form_instance_id` y la respuesta lo trae; si no, 422 `PRECONDITION_FAILED`.
**DoD:** specs dirigidas en verde + `yarn typecheck` exit 0 + eslint de archivos tocados exit 0.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD (comando de verificación) | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Validador reutilizable en `forms` | inexistente/abierta/otro encuentro → 422 con `details.reason`; ok → resuelve | `jest form-instance-origin.validator.spec.ts` → PASS | HECHO |
| H1.S2.M1 | DTO receta acepta `formInstanceId` uuid | uuid válido pasa; no-uuid falla con `isUuid` | `jest clinical/dto/medication.dto.spec.ts` → PASS | HECHO |
| H1.S2.M2 | DTO orden acepta `formInstanceId` uuid | idem | `jest clinical/dto/service-request.dto.spec.ts` → PASS | HECHO |
| H1.S2.M3 | DTO plan acepta `formInstanceId` uuid | idem | `jest chart/dto/care-plans.dto.spec.ts` → PASS | HECHO |
| H1.S3.M1 | Servicios validan antes de escribir y persisten | con id → validador llamado con (id, encounterId) y fila con `formInstanceId`; sin id → validador no llamado | `jest medications.service service-requests.service chart-care-plans.service` → PASS | HECHO |
| H1.S3.M2 | Respuestas y lecturas devuelven `formInstanceId` (null si no hay) | create responses + resumen clínico + órdenes de diagnóstico | typecheck exit 0 + specs | HECHO |
| H1.S4.M1 | Patch DDL idempotente | columnas + FK + índices; segunda pasada sin error | `psql -f` dos veces exit 0 (si hay Postgres local) | HECHO |
| H1.S4.M2 | OpenAPI regenerado | `formInstanceId` en los tres request/response | `node tools/openapi/generate-openapi.mjs` exit 0 | HECHO |

## H2 — P42 reconsulta + `followUpOf.formInstanceId`
**CA:** Dado `POST /scheduling/appointments/direct` con `followUpOf`, cuando la agenda es del profesional, el origen existe, es del mismo paciente, `startAt` es futuro y no hay otra reconsulta por venir, entonces nace la cita con `follow_up_of_booking_id` (y `form_instance_id` si viaja y es válido); si no, 403/404/422/409/422. Las lecturas devuelven `followUpOf` y `followUpBookingId` con la compuerta de privacidad del nombre.
**DoD:** `jest scheduling-bookings.service.spec.ts scheduling-bookings.dto.spec.ts` → PASS; patch v4231 idempotente en Postgres.
**Estado:** HECHO

| ID | Microtarea | CA (binario) | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | DTO `followUpOf` (bookingId, encounterId?, formInstanceId?) | anidado validado con forbidNonWhitelisted | `jest scheduling-bookings.dto.spec.ts` → PASS | HECHO |
| H2.S1.M2 | Reglas 403/404/422/409 con `FOR UPDATE` del origen | cada rechazo no crea reserva | `jest scheduling-bookings.service.spec.ts` → PASS | HECHO |
| H2.S1.M3 | Persistir vínculo + tipología `ACT_FOLLOW_UP` | `createBooking` recibe `followUpOfBookingId`; cita con `typeConceptId` | idem | HECHO |
| H2.S1.M4 | P43 en la reconsulta contra el encuentro del ORIGEN | validador llamado con el encuentro derivado | idem | HECHO |
| H2.S2.M1 | Lectura: `followUpOf` {bookingId, encounterId, startAt, formInstanceId?} y `followUpBookingId` derivado, misma compuerta | ausente para quien no ve el nombre; null si no hay | idem | HECHO |
| H2.S3.M1 | Patch `v4231` idempotente | columna + FK + índice; segunda pasada exit 0 | `psql -f` ×2 | HECHO |

## Riesgos y bloqueos previstos
| Riesgo | Impacto | Mitigación |
|---|---|---|
| La entidad va por delante del esquema en bases sin el patch | 500 al escribir receta/orden/plan | aplicar el patch antes de desplegar; anotarlo en el PR |
| Docker local apagado | sin prueba contra Postgres real | declarar el peldaño alcanzado sin inflarlo |
