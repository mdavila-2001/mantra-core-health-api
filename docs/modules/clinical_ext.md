<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/clinical_ext/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `clinical_ext`

**Fuente:** [`src/modules/clinical_ext/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/clinical_ext/README.md)
· 7 controllers · 7 services · 11 repositories · 12 entidades · 8 DTO

---

# Módulo Clinical-Ext (18) — Care Coordination, Alerts & Decision Support

Coordinación de cuidado, decisión clínica (CDS), alertas, interacciones
medicamentosas, plantillas de órdenes, referencias, brechas de cuidado /
inmunizaciones y telesalud. Sigue la forma de los módulos de referencia
(`iam`, `common`, `terminology`): servicios que poseen la transacción
(`em.transactional`), repositorios stateless (reciben el `EntityManager`), FKs
como columnas uuid planas (flush del padre antes de los hijos), auditoría con
`createdBy`/`touch`, y `*_concept_id` tomados de `clinical_ext.concepts.ts`.

## Endpoints (UC → ruta)

| UC | Método y ruta | Descripción | Permiso |
| --- | --- | --- | --- |
| UC-18-01 | `POST /care-teams` | Crear equipo de cuidado con miembros | auth |
| UC-18-02 | `PATCH /care-teams/{id}/members/{memberId}/set-responsible` | Transferir liderazgo | auth |
| UC-18-03 | `POST /cds/evaluate` | Evaluar reglas CDS y generar alertas | auth |
| UC-18-04 | `POST /cds/check-interactions` | Detectar interacciones medicamentosas | auth |
| UC-18-05 | `PATCH /clinical-alerts/{id}/acknowledge` · `/override` | Reconocer / override de alerta | auth |
| UC-18-06 | `POST /order-sets/{id}/apply` | Aplicar order set (fan-out) | auth |
| UC-18-07 | `POST /referrals` | Emitir referencia | auth |
| UC-18-08 | `PATCH /referrals/{id}/respond` | Aceptar / rechazar referencia inter-tenant | auth |
| UC-18-09 | `POST /care-gaps/recompute` | Detectar y abrir brechas de cuidado | auth |
| UC-18-10 | `PATCH /care-gaps/{id}/close` | Cerrar brecha por evento clínico | auth |
| UC-18-11 | `POST /patients/{id}/immunization-plan/project` | Proyectar plan de inmunización y abrir brechas | auth |
| UC-18-12 | `POST /virtual-encounters` · `PATCH /{id}/join` · `/end` | Telesalud: iniciar / unirse / finalizar | auth |
| UC-18-13 | `POST /cds-rules/{id}/versions/publish` · `/rollback` | Publicar versión de regla CDS con rollback | `SECURITY_ADMIN` |

### Endpoints de soporte (datos de referencia / gobernanza)

| Método y ruta | Descripción | Permiso |
| --- | --- | --- |
| `POST /cds-rules` | Crear regla CDS en borrador (precondición de UC-18-13/03) | `SECURITY_ADMIN` |
| `POST /drug-interactions` | Registrar par de interacción (alimenta UC-18-04) | `SECURITY_ADMIN` |
| `POST /order-sets` | Crear plantilla de órdenes (precondición de UC-18-06) | `SECURITY_ADMIN` |
| `POST /immunization-schedules` | Registrar dosis del calendario (alimenta UC-18-11) | `SECURITY_ADMIN` |

## Entidades (schema `clinical_ext`)

`care_teams`, `care_team_members`, `cds_rules`, `clinical_alerts`,
`drug_interactions`, `order_sets`, `order_set_items`, `referrals`, `care_gaps`,
`immunization_schedules`, `virtual_encounters`, `reference_ranges`.

## Reglas de negocio

- Equipo de cuidado: a lo sumo un miembro `is_responsible`; la transferencia limpia
  el responsable previo y marca el nuevo (ambos deben estar activos).
- Reglas CDS: código único; ciclo `draft → active → retired`; solo `active` es
  evaluable; rollback solo desde `active`.
- Alertas: `active → acknowledged | overridden`; el override de alta severidad
  exige motivo (gobernanza).
- Order set: aplicación atómica de los ítems seleccionados (default o explícitos);
  el order set debe estar activo.
- Referencia: unicidad (encuentro, destino, especialidad); respuesta solo desde
  `requested`.
- Brechas: upsert idempotente por (paciente, tipo, medida) con estado `open`;
  cierre solo desde `open`. La proyección de inmunización abre una brecha por dosis
  pendiente con `due_date = nacimiento + recommended_age_days`.
- Telesalud: 1:1 con el encuentro; transiciones `scheduled → in-progress → completed`.

## Cross-módulo

`patient_profile_id`, `encounter_id`, `tenant_id`, `practitioner_profile_id`,
`target_tenant_id`, etc. se reciben por DTO (el cliente aporta el id). El fan-out
de `POST /order-sets/{id}/apply` deriva el plan de órdenes; el alta de las
`clinical.service_requests` resultantes pertenece al módulo clínico.

## Permisos, logs y tests

- Guard global de auth; endpoints de gobernanza / datos de referencia exigen
  `@Roles('SECURITY_ADMIN')`. `@CurrentUser()` como actor; `ParseUUIDPipe` en params.
- Logs Pino estructurados por operación (`clinical_ext.*`); sin secretos ni PHI.
- Tests unitarios (`*.spec.ts`) con repos/EM mockeados: happy path, not-found,
  conflicto y rechazos de regla de negocio. Smoke de integración transversal en
  `test/smoke/modules/clinical_ext.smoke.ts` (export `CLINICAL_EXT_SMOKE`).

