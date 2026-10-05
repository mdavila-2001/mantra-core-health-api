# Revisión del módulo `scheduling` — ALOVIDA

## 1. Alcance, método y límites

- Fecha: 2026-10-05. Unidad: `src/modules/scheduling`.
- Lectura focal: controladores de reservas, `SchedulingBookingsService`, repositorios de reservas, DTO de agenda y sus pruebas de autorización. Se verificaron también los flujos de cita directa y de lectura individual para intentar refutar la fuga.
- Evidencia dinámica: `corepack yarn test src/modules/scheduling --runInBand --silent` → **30 suites y 621 tests pasan**. Son pruebas unitarias con repositorios simulados; no prueban aislamiento real de tenant ni RLS.
- No cubierto: todos los subflujos de generación de slots, lista de espera, recordatorios, workers y cada endpoint del módulo de 25k líneas. Este informe no certifica esos recorridos.

## 2. Resumen ejecutivo

| Severidad | Total | Hallazgos |
|---|---:|---|
| Crítica | 1 | SCHED-01: una cuenta `PATIENT` puede listar por recurso las reservas de otros pacientes. |
| Alta | 0 | — |
| Media | 1 | SCHED-02: DTOs de lotes no imponen un máximo de elementos. |

La lectura individual de una reserva sí resuelve y comprueba titular, representación, profesional de la agenda y tenant antes de proyectar datos; ese control no está presente en el listado por recurso. La creación de cita directa valida recurso, tenant activo y titularidad de agenda; el perfil de paciente se busca globalmente. Eso permite atención entre organizaciones y no se registra como defecto sin una regla de afiliación verificable.

## 3. Mapa revisado

| Superficie | Ruta o método | Roles / control observado |
|---|---|---|
| Listado de reservas | `GET /scheduling/bookings` | `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`, `PATIENT`; sólo valida paciente cuando llega `patientProfileId`. |
| Lectura puntual | `GET /scheduling/bookings/:id` | El servicio comprueba paciente representado o profesional dueño de la agenda. |
| Cita directa | `POST /scheduling/appointments/direct` | `SCHEDULING_ADMIN`, `SCHEDULING_AGENT`, `PRACTITIONER`; valida recurso, tenant y agenda del profesional. |
| Persistencia leída | `appointment_bookings`, `bookable_slots`, perfiles | El repositorio de listado filtra por paciente/recurso/estado, sin tenant ni actor. |

El módulo no tiene un catálogo local `scheduling.error-reasons.ts` en esta base. Hay trabajo pendiente de integrar en `fa74b78c` que declara catálogo de reasons para scheduling; cualquier implementación debe contrastarlo al integrarse.

## 4. Hallazgos confirmados

### SCHED-01 — Crítica — el listado por recurso no autoriza al actor ni acota el tenant

**Evidencia y refutación.** La ruta admite el rol `PATIENT` y entrega `resourceId` al servicio ([scheduling-bookings.controller.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/controllers/scheduling-bookings.controller.ts#L85-L119)). El servicio sólo llama `assertPuedeActuarPorElPaciente` si llega `patientProfileId`; con sólo `resourceId` pasa directamente al repositorio ([scheduling-bookings.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/services/scheduling-bookings.service.ts#L3088-L3143)). El repositorio forma el `where` con `resourceId`, paciente y estado, sin `tenantId` ni predicado de actor ([scheduling-bookings.repository.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/repositories/scheduling-bookings.repository.ts#L495-L556)). La proyección conserva `patientProfileId`, recurso, slot, cita, encuentro, horario y estado para cada fila ([scheduling-bookings.service.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/services/scheduling-bookings.service.ts#L3548-L3588)).

La prueba dirigida confirma el camino: llama al listado con sólo `resourceId` como `intruso` y verifica que no se consulta la política de representación ([scheduling-bookings.service.spec.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/services/scheduling-bookings.service.spec.ts#L4374-L4388)). La comprobación de titular y profesional existe para `getBookingById`, por lo que no refuta este listado.

**Impacto y escenario.** Una cuenta paciente que conozca o pueda obtener un UUID de agenda puede enumerar hasta el límite de reservas de esa agenda, incluidos identificadores de paciente, franjas horarias, estado, IDs clínicos y metadatos de pago. Aunque `reasonText` y nombre se ocultan en parte de la proyección, la existencia y horario de una atención son datos clínicos. No hay un límite de tenant que contenga el recurso si el UUID pertenece a otra organización.

**Plan de corrección.**

1. En `searchBookings`, resolver el recurso antes de consultar filas y obtener su tenant y propietario.
2. Para `PATIENT`, permitir sólo reservas del propio perfil o de perfiles representados; una consulta de agenda pública debe devolver disponibilidad agregada desde otro endpoint y nunca `AppointmentBookings`.
3. Para profesionales, exigir que el recurso sea propio o que una asignación/rol de organización autorice el tenant; para agentes y administradores, derivar tenant del contexto confiable y filtrarlo dentro de `findBookings`.
4. Cambiar el repositorio para recibir `tenantId` obligatorio y usarlo en el `where`; no filtrar después de cargar filas.
5. Añadir una razón estable para el recurso fuera de alcance y pruebas HTTP de dos tenants. Contrastar los nombres con `fa74b78c` al integrarlo.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
|---|---|---|---|
| Correcto | Integración, profesional dueño de recurso T1 | `GET /scheduling/bookings?resourceId=R1` | Sólo reservas T1 permitidas, `200`. |
| Límite | Integración, paciente con representación vigente | `GET` con `patientProfileId` del dependiente T1 | Sólo las reservas representadas, `200`. |
| Error | Integración, paciente T1 y `resourceId` de agenda T2 | `GET` por R2 | Cero filas y sin consultas de nombre/cobertura. |
| Falla catalogada | E2E, mismo actor/recurso ajeno | `GET` por R2 | `404`, `RESOURCE_NOT_FOUND`, `SCHEDULING_RESOURCE_NOT_AVAILABLE` (o nombre consolidado al integrar catálogo). |

### SCHED-02 — Media — los DTO de lotes de agenda aceptan tamaño no acotado

**Evidencia.** Plantillas de agenda aceptan `rules` con `@ArrayMinSize(1)` sin `@ArrayMaxSize` tanto al crear como al actualizar ([scheduling-catalog.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-catalog.dto.ts#L362-L383), [#L438-L456](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-catalog.dto.ts#L438-L456)). También `slotIds` de mover/cerrar cupos no tiene máximo ([scheduling-catalog.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-catalog.dto.ts#L1062-L1066), [#L1103-L1127](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-catalog.dto.ts#L1103-L1127)), igual que los offsets de recordatorios ([scheduling-bookings.dto.ts](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-bookings.dto.ts#L128-L141), [#L522-L541](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/scheduling/dto/scheduling-bookings.dto.ts#L522-L541)).

**Plan.** Definir máximos de producto para reglas, IDs y recordatorios; rechazar cuerpo excesivo antes de transacción; deduplicar IDs y fijar el tope de trabajo de cada operación. Medir una ejecución de tamaño máximo antes de fijar los valores para no romper agendas legítimas.

| Caso | Tipo y preparación | Entrada | Resultado esperado |
|---|---|---|---|
| Correcto | Unit DTO | máximo permitido de reglas/IDs | valida y procesa una vez cada ID. |
| Límite | Unit DTO | exactamente el máximo | `201/200` según ruta. |
| Error | Unit DTO | máximo + 1 elementos | no llega al servicio. |
| Falla catalogada | E2E | lote excesivo | `400`, `VALIDATION_FAILED`, `SCHEDULING_BATCH_TOO_LARGE`. |

## 5. Olas y pruebas de regresión

| Ola | Hallazgo | Esfuerzo | Gate |
|---|---|---:|---|
| 0 | SCHED-01 | M | integración con dos tenants, paciente, representante, profesional propio y profesional ajeno; asegurar que el SQL contiene `tenantId`. |
| 2 | SCHED-02 | S | validación de DTO y prueba de que no abre transacción ni itera lote excesivo. |

Antes de corregir, añadir una prueba de regresión que reproduzca SCHED-01 con una cuenta `PATIENT`; la prueba actual documenta precisamente el camino sin comprobación. Tras corregir, ejecutar `corepack yarn test src/modules/scheduling --runInBand --silent`, las pruebas de integración de autorización y la suite de rutas afectadas.
