# Módulo 41 — Scheduling (agenda)

Agenda: recursos agendables, políticas de reserva, plantillas horarias, generación de cupos,
reservas con anti-double-booking, lista de espera, recordatorios, avisos, servicios con duración
dinámica y mostrador (alta de paciente + cita + encuentro en una transacción).

Es el **módulo piloto del molde DDD** (ADR-0026, `docs/architecture/module-layout.md`): sus capas
y reglas de dependencia las hace cumplir `src/architecture/module-layering.spec.ts`.

## Estructura

```text
scheduling/
├── scheduling.module.ts        cableado Nest (providers, puertos → adaptadores)
├── scheduling.tokens.ts        nombre del módulo ante la capa de persistencia
├── entities/                   ENTIDADES ORM GENERADAS desde el .puml — no se editan a mano
├── domain/                     reglas puras: sin Nest, sin MikroORM, sin otras capas
│   ├── scheduling.concepts.ts  conceptos de terminología (SCHED)
│   ├── booking/                máquina de estados, estados agrupados, roles/actores, canales,
│   │                           estado de pago, ventana de cancelación, admisión de retención,
│   │                           plan de servicio, lectura del historial, visibilidad del motivo
│   ├── catalog/                tipos y constantes del catálogo, geometría de franjas semanales
│   ├── notices/                redacción de avisos (funciones puras), catálogo de razones
│   ├── resource/               tablas que identifican a un perfil profesional
│   └── time/                   hora local ↔ UTC, propuesta de horarios de servicios
├── application/                casos de uso; dependen de puertos, no de adaptadores
│   ├── ports/                  contratos hacia otros contextos y hacia mensajería/listas de espera
│   ├── bookings/               fachada + support/ (colaboradores) + use-cases/ (18)
│   ├── catalog/                fachada + support/ + use-cases/ (16)
│   ├── agenda/ confirmation/ delay/ notices/ professional-time/ affiliation/ walk-in/
│   ├── waitlist/
├── infrastructure/
│   ├── repositories/           acceso a datos propio (clases sin estado, reciben el EntityManager)
│   ├── adapters/               puertos implementados: audit, profiles, clinical, insurance,
│   │                           forms, practice, directory, mensajería, SupportAdmin, Postgres
│   ├── persistence/            proveedores de sesión/puertos de lista de espera
│   ├── config/ seed/
└── presentation/
    ├── controllers/            HTTP: sólo orquesta, sin reglas
    └── dto/                    contrato HTTP (no se renombra nada de aquí)
```

### Reservas: de un servicio de 3 865 líneas a un caso de uso por operación

`SchedulingBookingsService` es ahora una **fachada de 256 líneas** que conserva la API pública
(controllers y `SchedulingWalkInService` no cambian) y delega en `application/bookings/use-cases/`:
`PlaceHold`, `ConfirmBooking`, `RequestBooking`, `CreateDirectAppointment`, `ExpireHolds`,
`RescheduleBooking`, `CancelBooking`, `RejectBooking`, `SetPaymentState`, `GetPaymentState`,
`AcceptBooking`, `RequestBookingInfo`, `ProposeSchedule`, `StartAppointment`,
`CompleteAppointment`, `CheckInBooking`, `SearchBookings`, `GetBooking`. Una operación = una
clase = una transacción. Lo compartido vive en `bookings/support/` (`BookingAccess`,
`BookingTransitionRecorder`, `BookingChangeNotifier`, `ServiceSlotLifecycle`,
`ClinicalAppointmentSync`, `SlotPolicyResolver`, `BookingMaterializer`,
`DisplacedRequestsCanceller`, `BookingItemAssembler`). El catálogo (`SchedulingCatalogService`,
antes 2 319 líneas) sigue el mismo patrón con 16 casos de uso.

## Puertos hacia otros contextos

Los casos de uso dependen de un token Nest + interfaz propia (`application/ports/`); el adaptador
(`infrastructure/adapters/`) es lo único que conoce al otro módulo.

| Puerto | Contexto | Adaptador |
| --- | --- | --- |
| `BookingHistoryPort` | audit | `AuditBookingHistoryAdapter` |
| `PatientRepresentationPort` | profiles | `ProfilesPatientRepresentationAdapter` |
| `ClinicalAppointmentsPort` | clinical | `ClinicalAppointmentsAdapter` |
| `ClinicalEncountersPort` | clinical | `ClinicalEncountersAdapter` |
| `InsuranceReadPort` | insurance | `InsuranceReadAdapter` |
| `FormOriginPort` | forms | `FormsOriginAdapter` |
| `PractitionerAffiliationsPort` | profiles + practice | `ProfilesAffiliationsAdapter` |
| `PractitionerDirectoryPort` | profiles + practice | `PracticeProfilesDirectoryAdapter` |
| `TenantDirectoryPort` | directory + profiles | `DirectoryTenantDirectoryAdapter` |
| `WalkInPatientRegistryPort` | profiles + common | `ProfilesWalkInPatientAdapter` |
| `AgendaNoticePort` | messaging | `MessagingAgendaNoticeAdapter` |
| `WaitlistReadPort` / `WaitlistWritePort` | persistencia (Postgres) | `PostgresWaitlistAdapter` |

## Rutas (leídas de los controllers)

| Método | Ruta | Controller | Handler | Roles |
|---|---|---|---|---|
| GET | `/scheduling/activity-types` | Scheduling | `listActivityTypes` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/appointments/direct` | Scheduling | `createDirectAppointment` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/appointments/walk-in` | Scheduling | `createWalkInAppointment` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/booking-policies` | Scheduling | `createPolicy` | SCHEDULING_ADMIN, PRACTITIONER |
| GET | `/scheduling/bookings` | Bookings | `searchBookings` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| GET | `/scheduling/bookings/:id` | Bookings | `getBooking` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/bookings/:id/accept` | Bookings | `accept` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/cancel` | Bookings | `cancel` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/bookings/:id/check-in` | Bookings | `checkIn` | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| POST | `/scheduling/bookings/:id/complete` | Bookings | `complete` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/delay` | Bookings | `delay` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| GET | `/scheduling/bookings/:id/payment-state` | Bookings | `getPaymentState` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| PUT | `/scheduling/bookings/:id/payment-state` | Bookings | `setPaymentState` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/propose-schedule` | Bookings | `proposeSchedule` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/reject` | Bookings | `reject` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/reminders` | Bookings | `scheduleReminders` | SCHEDULING_ADMIN, SCHEDULING_AGENT |
| POST | `/scheduling/bookings/:id/request-info` | Bookings | `requestInfo` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| POST | `/scheduling/bookings/:id/reschedule` | Bookings | `reschedule` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/bookings/:id/start` | Bookings | `start` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| GET | `/scheduling/confirmation-rules` | Confirmation | `list` | SCHEDULING_ADMIN |
| POST | `/scheduling/confirmation-rules` | Confirmation | `create` | SCHEDULING_ADMIN |
| POST | `/scheduling/confirmation-rules/:id/activate` | Confirmation | `activate` | SCHEDULING_ADMIN |
| POST | `/scheduling/confirmation-rules/:id/deactivate` | Confirmation | `deactivate` | SCHEDULING_ADMIN |
| POST | `/scheduling/confirmation-rules/evaluate` | Confirmation | `evaluate` | SCHEDULING_ADMIN |
| GET | `/scheduling/exception-types` | Scheduling | `listExceptionTypes` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| DELETE | `/scheduling/exceptions/:id` | Scheduling | `removeException` | SCHEDULING_ADMIN, PRACTITIONER |
| PATCH | `/scheduling/exceptions/:id` | Scheduling | `updateException` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/holds/:holdToken/confirm` | Scheduling | `confirmBooking` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| POST | `/scheduling/holds/:holdToken/request` | Scheduling | `requestBooking` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| POST | `/scheduling/internal/dispatch-reminders` | Internal | `dispatchReminders` | SYSTEM, SYSTEM_WORKER |
| POST | `/scheduling/internal/expire-holds` | Internal | `expireHolds` | SYSTEM, SYSTEM_WORKER |
| POST | `/scheduling/internal/promote-waitlist/:slotId` | Internal | `promoteWaitlist` | SYSTEM, SYSTEM_WORKER |
| GET | `/scheduling/internal/waitlist-candidates` | Internal | `listWaitlistCandidates` | SYSTEM, SYSTEM_WORKER |
| GET | `/scheduling/resources` | Agenda | `listResources` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/resources` | Scheduling | `createResource` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/resources/:id/close-slots` | Scheduling | `closeSlots` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/resources/:id/delay` | Scheduling | `delayResource` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| GET | `/scheduling/resources/:id/exceptions` | Scheduling | `listExceptions` | SCHEDULING_ADMIN, PRACTITIONER, PATIENT |
| POST | `/scheduling/resources/:id/exceptions` | Scheduling | `createException` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/resources/:id/shift-slots` | Scheduling | `shiftSlots` | SCHEDULING_ADMIN, PRACTITIONER |
| GET | `/scheduling/resources/:id/slots` | Scheduling | `getResourceAgenda` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| GET | `/scheduling/resources/:id/templates` | Scheduling | `listTemplates` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/resources/:id/templates` | Scheduling | `createTemplate` | SCHEDULING_ADMIN, PRACTITIONER |
| GET | `/scheduling/resources/:resourceId/waitlist` | Scheduling | `listResourceWaitlist` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER |
| GET | `/scheduling/service-availability` | ServiceOfferings | `availability` | PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| GET | `/scheduling/service-offerings` | ServiceOfferings | `list` | PATIENT, PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| POST | `/scheduling/service-offerings` | ServiceOfferings | `create` | PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN |
| PATCH | `/scheduling/service-offerings/:id` | ServiceOfferings | `update` | PRACTITIONER, CLINICIAN, SCHEDULING_ADMIN |
| POST | `/scheduling/service-offerings/:id/holds` | ServiceOfferings | `placeHold` | PATIENT, SCHEDULING_ADMIN, SCHEDULING_AGENT |
| GET | `/scheduling/slots` | Agenda | `listSlots` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/slots/:id/holds` | Scheduling | `placeHold` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| DELETE | `/scheduling/templates/:id` | Scheduling | `retireTemplate` | SCHEDULING_ADMIN, PRACTITIONER |
| PATCH | `/scheduling/templates/:id` | Scheduling | `updateTemplate` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/templates/:id/generate-slots` | Scheduling | `generateSlots` | SCHEDULING_ADMIN, PRACTITIONER |
| POST | `/scheduling/templates/:id/reactivate` | Scheduling | `reactivateTemplate` | SCHEDULING_ADMIN, PRACTITIONER |
| GET | `/scheduling/waitlist` | Scheduling | `listWaitlist` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PRACTITIONER, PATIENT |
| POST | `/scheduling/waitlist` | Scheduling | `enrollWaitlist` | SCHEDULING_ADMIN, SCHEDULING_AGENT, PATIENT |
| GET | `/tenants/:tenantId/agenda` | TenantAgenda | `list` | (guard del servicio) |

Los endpoints `internal/*` son de workers (`SYSTEM`, `SYSTEM_WORKER`). `GET /tenants/:tenantId/agenda`
no lleva `@Roles`: lo decide `TenantDirectoryPort.assertCanRead`.

## Reglas de negocio

- **Anti-double-booking**: el slot se toma con `SELECT ... FOR UPDATE` antes de decrementar
  `remaining_capacity`; nunca baja de cero. Al llegar a cero el slot pasa a `held`/`booked`.
- **Hold con TTL**: la vigencia sale de `booking_policies.hold_ttl_seconds` (300 s por defecto).
  Un hold vencido **no se puede confirmar** aunque el worker aún no lo haya reciclado.
- **Límite por paciente**: `max_active_per_patient` de la política se comprueba al tomar el hold.
- **Excepciones no cancelan citas**: bloquean solo los slots libres e intactos que se solapan.
  Cancelar citas confirmadas es una decisión clínica, no un efecto colateral.
- **Cargo por inasistencia**: solo si la política define `no_show_fee_amount` **y** la cancelación
  se marca como no-show. Una cancelación avisada no se cobra.
- **Generación idempotente**: los slots ya existentes se cuentan como `skipped`; hay un tope de
  2000 slots por ejecución para no generar lotes inmanejables (se avisa por log).
- **Promoción de lista de espera**: marca candidatos, **no reserva por ellos**. La cita la confirma
  el paciente por el flujo normal.

## Permisos

Cada handler declara sus `@Roles` (tabla de rutas). Además, el servicio comprueba **quién** es el
actor sobre **qué** cita (`BookingAccess`): el titular o su representante, quien opera cualquier
agenda (`SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `SUPERADMIN`) o el profesional del recurso.

## Concurrencia

`FOR UPDATE` sobre cupo, retención y cita antes de mutarlos. El worker de expiración usa
`FOR UPDATE SKIP LOCKED`. `row_version` da bloqueo optimista automático.

## Logs

`operation: 'scheduling.<área>.<acción>'`. Se registran ids y contadores, nunca el `holdToken`
ni datos personales del paciente. El contexto del logger es ahora el de cada caso de uso.

## Pruebas

```bash
corepack yarn test --maxWorkers=1 --testPathPatterns 'src/modules/scheduling' 'src/architecture'
```

Las pruebas arman la fachada con `createBookingsService` / `createCatalogService`
(`*.testing.ts`, excluidos del build): usan los **adaptadores reales** sobre dobles de los
repositorios ajenos. Son unitarias con el `EntityManager` simulado; no demuestran aislamiento entre
tenants ni nada contra una base real.

## Qué no cambió a propósito

- Contrato HTTP: rutas, DTO, códigos y mensajes. Las claves de `details` de errores en castellano
  (`minutosDeAviso`, `vinculo`, `nueva`/`existente`/`siguiente`) y `desplazadas` en la respuesta
  de aceptar **siguen así**: son contrato.
- Los veredictos del vínculo (`'sin-vinculos'`, `'aprobado'`, `'pendiente'`, `'ausente'`,
  `'no-vigente'`) viajan en `details.vinculo` de los 422; por eso no se tradujeron.

## Pendiente

- Separar el modelo de dominio de la entidad ORM (A3): `application/` aún usa las entidades
  generadas y los repositorios propios (única excepción de capas, declarada en el spec de
  arquitectura).
- `dto/` sigue en archivos de 1 100+ líneas por área.
- La proyección vía `messaging.outbox_events` (recordatorios reales) depende del módulo 35.

### `generateSlots` respeta la zona horaria del recurso

`schedulable_resources.time_zone` se usa para materializar cupos: las reglas de una plantilla
declaran **hora de pared de la sede** («los lunes de 08:00 a 12:00» son las ocho de la mañana
allí), y `scheduling-time.ts` las convierte al instante UTC que se guarda.

Hasta el 2026-08-15 la hora se resolvía con `setUTCHours`, así que se interpretaba en UTC sea cual
fuera la sede: una agenda de La Paz (UTC−4) que publicaba «08:00 a 12:00» materializaba sus cupos a
las **04:00–08:00 hora local** y el portal ofrecía turnos de madrugada.

Tres cosas que el arreglo tuvo que resolver, y que conviene no deshacer:

- **El día de la semana también es local.** Una regla de lunes se evalúa en el calendario de la
  sede; si no, para zonas cuyo desfase cruza la medianoche puede caer en domingo local. Por eso
  `diasLocalesQueCoinciden` recorre el calendario de la zona y no los días UTC.
- **El horario de verano se mide, no se supone.** La conversión usa `Intl` —Node trae la base IANA
  completa— en vez de sumar un desplazamiento fijo, que se rompería dos veces al año en las zonas
  del alcance que sí lo tienen. La segunda pasada de `horaLocalAUtc` existe para los dos días del
  año en que el desplazamiento del instante supuesto no coincide con el del corregido.
- **Sin zona declarada se cae a UTC**, que es exactamente lo que hacía antes. Así una agenda sin
  `time_zone` no cambia de comportamiento y los cupos ya publicados no se mueven.

Como el barrido de días locales se ensancha un día por lado, los cupos se recortan a la ventana
pedida: sin ese recorte, una zona al oeste de UTC materializaría cupos del día anterior.

**Pendiente relacionado:** `tools/alovida/seed-dev-data.mjs` declara sus franjas ya convertidas con
`horaUtcDeLocal`, una compensación deliberada de cuando el generador era incorrecto. Ahora que
`generateSlots` lee `time_zone`, esa función sobra y las franjas deberían volver a declararse en
hora local — vive en `salud-db`/`tools`, fuera del alcance de este cambio.
