<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/clinical/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `clinical`

**Fuente:** [`src/modules/clinical/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/clinical/README.md)
· 6 controllers · 12 services · 12 repositories · 22 entidades · 12 DTO

---

# Módulo Clinical (08) — Core Clinical Record, Orders & Encounter Logistics

Registro clínico nuclear del paciente, órdenes y logística del encuentro. Cubre
los 14 casos de uso UC-08-01..14 como endpoints REST bajo el prefijo `/clinical`.

## Endpoints (UC → ruta)

| UC | Endpoint | Método | Descripción |
|----|----------|--------|-------------|
| UC-08-01 | `/clinical/care-episodes` | POST | Abrir episodio de cuidado |
| UC-08-02 | `/clinical/encounters/check-in` | POST | Check-in de encuentro (participantes + ubicación) |
| UC-08-03 | `/clinical/observations` | POST | Registrar observación (componentes, rangos, ejecutantes, notas) |
| UC-08-04 | `/clinical/observations/{id}/amend` | PATCH | Corregir/enmendar observación |
| UC-08-05 | `/clinical/service-requests` | POST | Crear orden de servicio |
| UC-08-06 | `/clinical/diagnostic-reports` | POST | Emitir reporte diagnóstico desde la orden |
| UC-08-07 | `/clinical/diagnostic-reports/{id}/release` | POST | Liberar resultados del reporte |
| UC-08-08 | `/clinical/conditions` | POST | Registrar condición/diagnóstico |
| UC-08-09 | `/clinical/allergy-intolerances` | POST | Registrar alergia con reacciones |
| UC-08-10 | `/clinical/medication-requests` | POST | Prescribir medicación |
| UC-08-11 | `/clinical/medication-records` | POST | Administrar/registrar medicación |
| UC-08-12 | `/clinical/procedures` | POST | Registrar procedimiento |
| UC-08-13 | `/clinical/immunizations` | POST | Registrar inmunización |
| UC-08-14 | `/clinical/encounters/{id}/close` | POST | Cerrar encuentro (gatilla facturación) |

> Nota: los sufijos `:accion` de la spec (`encounters:check-in`,
> `observations/{id}:amend`, …) se realizan como **segmento de ruta**
> (`/check-in`, `/{id}/amend`, `/{id}/release`, `/{id}/close`) por compatibilidad
> con el router (Express 5 / path-to-regexp v8, donde `:` es sintaxis de
> parámetro). El método HTTP y la intención se preservan.

## Entidades (schema `clinical`)

`care_episodes`, `encounters` (+ `encounter_participants`, `encounter_locations`),
`observations` (+ `observation_components`, `observation_reference_ranges`,
`observation_performers`, `observation_notes`), `service_requests`,
`diagnostic_reports`, `conditions`, `allergy_intolerances` (+ `allergy_reactions`),
`medication_requests`, `medication_records`, `procedures`, `immunizations`,
`appointments` (solo referenciada por el check-in).

## Reglas de negocio

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

Guard JWT global: todos los endpoints exigen bearer token (401 sin auth). Son
operaciones de actores clínicos (clínico, enfermería, recepción); no se restringen
a `SECURITY_ADMIN`. Parámetros de ruta validados con `ParseUUIDPipe` (400 si el id
es malformado). El actor (`@CurrentUser()`) alimenta `created_by`/`recorded_by`.

## Logs

Pino estructurado por operación (`clinical.<agregado>.<acción>`): inicio, éxito y
rechazos de regla de negocio. No se registran PHI ni secretos.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos + `em.transactional`) y
  `controllers/*.controller.spec.ts` (mockean servicios). 14 suites, verdes.
- Smoke de contrato: `test/smoke/modules/clinical.smoke.ts`
  (`CLINICAL_SMOKE: SmokeCase[]`), encadena episodio→encuentro→observación→orden→
  reporte→…→cierre y ejercita casos límite (401/400/404/409/422).

