<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/clinical/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `clinical`

**Fuente:** [`src/modules/clinical/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/clinical/README.md)
· 11 controllers · 20 services · 18 repositories · 24 entidades · 18 DTO

---

# Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics

Registro clínico nuclear del paciente, órdenes y logística del encuentro. Cubre
los 14 casos de uso UC-08-01..14 como endpoints REST bajo el prefijo `/clinical`; además el módulo expone lecturas, sellado de encuentros, recetas en PDF y políticas de firma (todas las rutas en [Rutas HTTP](#rutas-http-y-alcance-medido)).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/clinical -name '*.controller.ts' | wc -l
  find src/modules/clinical -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/clinical -name '*.entity.ts' | wc -l
  find src/modules/clinical -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **10 controllers, 40 rutas HTTP, 23 entidades y 18 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`clinical.module.ts`): `AuditModule`, `MessagingModule`, `CommonModule`, `AuthzModule`, `TerminologyModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /clinical/care-episodes` | CLINICIAN, PRACTITIONER | `clinical-encounters` |
| `POST /clinical/encounters/check-in` | CLINICIAN, PRACTITIONER | `clinical-encounters` |
| `POST /clinical/encounters/:id/close` | CLINICIAN, PRACTITIONER | `clinical-encounters` |
| `POST /clinical/encounters/:id/attachments` | CLINICIAN, PRACTITIONER | `clinical-encounters` |
| `GET /clinical/encounters/:id/attachments` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-encounters` |
| `GET /clinical/me/medical-aspects` | sesión | `clinical-medical-aspects` |
| `PUT /clinical/me/medical-aspects` | sesión | `clinical-medical-aspects` |
| `POST /clinical/observations` | CLINICIAN, PRACTITIONER | `clinical-observations` |
| `PATCH /clinical/observations/:id/amend` | CLINICIAN, PRACTITIONER | `clinical-observations` |
| `POST /clinical/service-requests/duplicate-check` | CLINICIAN, PRACTITIONER | `clinical-orders` |
| `POST /clinical/service-requests` | CLINICIAN, PRACTITIONER | `clinical-orders` |
| `POST /clinical/diagnostic-reports` | CLINICIAN, PRACTITIONER | `clinical-orders` |
| `POST /clinical/diagnostic-reports/:id/release` | CLINICIAN, PRACTITIONER | `clinical-orders` |
| `POST /clinical/prescription-signature-policies` | CLINICIAN, SECURITY_ADMIN | `clinical-prescription-policies` |
| `GET /clinical/prescription-signature-policies` | CLINICIAN, SECURITY_ADMIN | `clinical-prescription-policies` |
| `POST /clinical/prescription-signature-policies/:id/deactivate` | CLINICIAN, SECURITY_ADMIN | `clinical-prescription-policies` |
| `GET /public/prescriptions/:id/verify` | pública | `clinical-prescriptions-public` |
| `GET /clinical/prescriptions/:id/pdf` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-prescriptions` |
| `GET /clinical/patients/:patientProfileId/summary` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-read` |
| `GET /clinical/patients/:patientProfileId/received-services` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-read` |
| `POST /clinical/conditions` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/conditions/:id/change-status` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/conditions/:id/verification` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/conditions/:id/attachments` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/allergy-intolerances` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/allergy-intolerances/:id/attachments` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `GET /clinical/allergy-intolerances/:id/attachments` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-records` |
| `POST /clinical/medication-requests` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/attachments` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `GET /clinical/medication-requests/:id/attachments` | CLINICIAN, PRACTITIONER, PATIENT | `clinical-records` |
| `POST /clinical/medication-records` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/edit` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/sign` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/issue` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/invalidate` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/replace` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/medication-requests/:id/renew` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/procedures` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/procedures/:id/attachments` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/immunizations` | CLINICIAN, PRACTITIONER | `clinical-records` |
| `POST /clinical/internal/prescription-expiry-notices` | SYSTEM, SYSTEM_WORKER | `clinical-prescription-expiry` |

## Endpoints por caso de uso (subconjunto: UC-08-01..14 y adiciones puntuales)

| UC | Endpoint | Método | Descripción |
|----|----------|--------|-------------|
| UC-08-01 | `/clinical/care-episodes` | POST | Abrir episodio de cuidado |
| UC-08-02 | `/clinical/encounters/check-in` | POST | Check-in de encuentro (participantes + ubicación); deja la relación asistencial de los profesionales que exige el cobro con seguro (`insurance`, REQ-16-035) |
| UC-08-03 | `/clinical/observations` | POST | Registrar observación (componentes, rangos, ejecutantes, notas) |
| UC-08-04 | `/clinical/observations/{id}/amend` | PATCH | Corregir/enmendar observación |
| UC-08-05 | `/clinical/service-requests` | POST | Crear orden de servicio |
| 3.2 (T-26) | `/clinical/service-requests/duplicate-check` | POST | Pre-validar duplicidad de estudios (antiduplicación) |
| UC-08-06 | `/clinical/diagnostic-reports` | POST | Emitir reporte diagnóstico desde la orden |
| UC-08-07 | `/clinical/diagnostic-reports/{id}/release` | POST | Liberar resultados del reporte |
| UC-08-08 | `/clinical/conditions` | POST | Registrar condición/diagnóstico (presuntivo o confirmado) |
| C3 / P41 | `/clinical/conditions/{id}/verification` | POST | Confirmar o refutar un diagnóstico presuntivo, con motivo o evidencia |
| UC-08-09 | `/clinical/allergy-intolerances` | POST | Registrar alergia con reacciones |
| UC-08-10 | `/clinical/medication-requests` | POST | Prescribir medicación |
| UC-08-11 | `/clinical/medication-records` | POST | Administrar/registrar medicación |
| UC-08-12 | `/clinical/procedures` | POST | Registrar procedimiento |
| UC-08-13 | `/clinical/immunizations` | POST | Registrar inmunización |
| UC-08-14 | `/clinical/encounters/{id}/close` | POST | Cerrar encuentro (gatilla facturación) |
| — | `/clinical/patients/{patientProfileId}/received-services` | GET | Servicios recibidos del paciente: intervenciones médicas realizadas y vacunas |

> Nota: los sufijos `:accion` de la spec (`encounters:check-in`,
> `observations/{id}:amend`, …) se realizan como **segmento de ruta**
> (`/check-in`, `/{id}/amend`, `/{id}/release`, `/{id}/close`) por compatibilidad
> con el router (Express 5 / path-to-regexp v8, donde `:` es sintaxis de
> parámetro). El método HTTP y la intención se preservan.

## Aviso de receta por vencer (PAC-REC-002)

`POST /clinical/internal/prescription-expiry-notices` lo dispara el job `prescription-expiry-notice`
del worker `messaging` (cada hora). Es un barrido entre organizaciones, sin actor humano; sólo
acepta `SYSTEM`/`SYSTEM_WORKER`.

- **Qué receta avisa:** estado emitido (`MR_ISSUED`) con `valid_to` posterior a ahora y hasta
  `PRESCRIPTION_EXPIRY_NOTICE_DAYS` (3) días. Sin `valid_to` no vence y no avisa; borrador,
  invalidada, reemplazada, completada o ya vencida tampoco. La fuente (ALOVIDA PAC-REC-002) pide la
  alerta sin fijar la antelación: los 3 días son el valor adoptado.
- **A quién y por dónde:** a la cuenta activa del paciente, por la bandeja in-app (categoría
  `CLINICAL`, destino `PRESCRIPTION_EXPIRING` con el `id` de la receta). El texto no nombra el
  medicamento. Un paciente sin cuenta activa no recibe aviso hasta que la tenga, si la receta sigue
  dentro de la ventana.
- **Una sola vez:** el aviso usa la clave de idempotencia `clinical:PRESCRIPTION_EXPIRING:<receta>`;
  `messaging.notification_requests` la guarda aun cuando la preferencia del paciente lo suprime, y el
  barrido excluye las recetas con clave existente. Un aviso que falla no deja fila y se reintenta
  en el barrido siguiente. Dos barridos simultáneos se excluyen con un bloqueo consultivo de
  transacción.
- **Respuesta:** `scanned`, `notified`, `suppressed`, `failed`, `skipped`.

## Entidades (schema `clinical`)

24 entidades (`find src/modules/clinical -name '*.entity.ts' | wc -l`):
`care_episodes`, `encounters` (+ `encounter_participants`, `encounter_locations`),
`observations` (+ `observation_components`, `observation_reference_ranges`,
`observation_performers`, `observation_notes`), `service_requests`,
`diagnostic_reports`, `conditions`, `allergy_intolerances` (+ `allergy_reactions`),
`medication_requests`, `medication_records`, `procedures`, `immunizations`,
`received_services`,
`family_member_history`, `social_history`, `patient_reported_health_statements`,
`prescription_signature_policies` y `appointments` (solo referenciada por el
check-in).

## Reglas de negocio

- **Servicios recibidos** (`received_services`): una fila por servicio que el paciente
  recibió. Hoy son dos tipos, ambos conceptos del value set `vs_received_service_type`:
  la **intervención médica** realizada (un `procedures` completado o un caso M53
  completado) y la **vacunación** (un `immunizations` completado). La fila la escribe
  `ReceivedServicesProjector` en la misma transacción que registra el hecho de origen;
  un caso M53 y su procedimiento principal comparten fila. Lo que ya existía se
  proyecta con el parche `v4249` del modelo. La consulta, el laboratorio y la
  imagenología **no** son servicios recibidos: viven en sus propias pestañas de la
  historia. El costo lo ve el titular o quien lo representa, no el personal clínico; la
  cobertura del seguro no se expone porque el reparto se publica por pedido
  (`PatientSettlementService`) y no por servicio.
- **Transaccionalidad**: cada operación de escritura corre en `em.transactional`.
  Las FK son columnas uuid planas → se hace `tx.flush()` del padre antes de crear
  hijos (encuentro→participantes/ubicaciones, observación→componentes/etc.,
  alergia→reacciones). `row_version` nunca se fija (DEFAULT 1 en BD).
- **Estados por concepto**: todo `*_concept_id` de ciclo de vida/tipo se toma de
  `clinical.concepts.ts` (`CLIN`). Las columnas `*_concept_id` tienen FK forzada a
  `terminology.catalog_concepts`, por lo que los conceptos del módulo se siembran
  vía `CLINICAL_CONCEPT_SEEDS`.
- **Unicidad de negocio** (validada en servicio, sin índice único en BD):
  episodio activo único por (tenant, paciente); condición activa única por
  (tenant, paciente, código); alergia activa única por (tenant, paciente,
  sustancia); dosis única por (tenant, paciente, vacuna, número).
- **Verificación de diagnósticos (C3 / P41)**: un diagnóstico nace confirmado, o
  presuntivo (`COND_PROVISIONAL`) si el alta manda `verificationStatusConceptId`;
  refutado (`COND_REFUTED`) no es un estado de alta. `POST
  /clinical/conditions/{id}/verification` lleva un presuntivo a confirmado
  (activo) o refutado (inactivo, con `resolvedAt`). Ambos son terminales: decidir
  de nuevo es 409. Exige **motivo o evidencia** (422 si faltan las dos); la
  evidencia (`NOTE` o `ANALYSIS`) debe ser **del mismo paciente**, y una ajena
  responde como una inexistente (422). Al confirmar, inicio y fin esperado salvo
  curso crónico. Escribe con la misma política que `change-status` (turno, consulta
  o relación asistencial vigentes) y el autor es `practitionerProfileId` de la
  sesión (403 si no tiene perfil profesional). La decisión no tiene columna: se
  sella en `audit.conditions_history.data_snapshot.verification` (D-BR14-04).
- **Concurrencia optimista**: `close`, `amend` y `release` aceptan
  `expectedRowVersion` y lanzan `ConcurrencyConflictException` (409) si no coincide.
- **Transiciones**: `close` exige encuentro `in-progress`; `amend` exige
  observación `final`/`preliminary`; `release` exige reporte `partial`/`preliminary`
  (→ `PreconditionFailedException` 422 en caso contrario).
- **Encadenado**: crear reporte desde una orden marca la orden `completed`;
  registrar procedimiento con orden la marca `completed`; administrar la dosis
  final marca la prescripción `completed`; cerrar encuentro cierra participantes y
  ubicaciones activos.
- **VALUE CONTRACT**: la observación (y cada componente) lleva un único tipo de
  valor; el `value_type_concept_id` se infiere del campo presente si no se indica.

## Permisos y auth

Guard JWT global: todos los endpoints exigen bearer token (401 sin auth) **salvo** `GET /public/prescriptions/:id/verify` (`@Public()`, verificación pública de recetas). Son
operaciones de actores clínicos (clínico, enfermería, recepción); no se restringen
a `SECURITY_ADMIN`. Parámetros de ruta validados con `ParseUUIDPipe` (400 si el id
es malformado). El actor (`@CurrentUser()`) alimenta `created_by`/`recorded_by`.

## Logs

Pino estructurado por operación (`clinical.<agregado>.<acción>`): inicio, éxito y
rechazos de regla de negocio. No se registran PHI ni secretos.

## Tests

- Unit: `corepack yarn test src/modules/clinical --runInBand --silent` — 51 suites y 518 pruebas aprobadas durante la revisión (dos advertencias JSON preexistentes). Incluye servicios, controladores y guards.
- Smoke de contrato: `test/smoke/modules/clinical.smoke.ts`
  (`CLINICAL_SMOKE: SmokeCase[]`), encadena episodio→encuentro→observación→orden→
  reporte→…→cierre y ejercita casos límite (401/400/404/409/422).
