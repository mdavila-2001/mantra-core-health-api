<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/diagnostic_units/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `diagnostic_units`

**Fuente:** [`src/modules/diagnostic_units/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/diagnostic_units/README.md)
· 5 controllers · 7 services · 12 repositories · 10 entidades · 13 DTO

---

# Módulo 23 — Diagnostic Units, Studies, Specialists and Prices

Gestión del ciclo de vida de **unidades diagnósticas** (laboratorios, imagenología):
sus sitios operativos, especialidades, ofertas de estudio (paneles), cronogramas y
versiones de precio (append-only), equipamiento/calibración, acreditaciones y
asignación de especialistas; más la reproyección del perfil público.

## Endpoints (UC → ruta)

| UC | Método y ruta | Descripción |
|---|---|---|
| Directorio P3 | `GET /diagnostic-units` | Listar unidades activas y verificadas del tenant activo |
| Directorio P3 | `GET /diagnostic-units/{id}` | Perfil con sedes, equipos, oferta, precios públicos y acreditaciones vigentes |
| UC-23-01 | `POST /diagnostic-units` | Alta de unidad con sitios (1..N) y acreditaciones (0..N) |
| UC-23-02 | `POST /diagnostic-units/{id}/sites` | Registrar sitio operativo |
| UC-23-02 | `PATCH /diagnostic-unit-sites/{siteId}` | Actualizar sitio |
| UC-23-03 | `POST /diagnostic-units/{id}/verify-and-publish` | Verificar y publicar perfil público |
| UC-23-04 | `PUT /diagnostic-units/{id}/specialties` | Declarar especialidades (upsert + soft-close) |
| UC-23-05 | `POST /diagnostic-units/{id}/study-offerings` | Publicar oferta con componentes (panel) |
| UC-23-06 | `POST /diagnostic-units/{id}/price-schedules` | Crear cronograma de precios |
| UC-23-07 | `POST /price-schedules/{scheduleId}/study-prices` | Fijar/versionar precio (append-only) |
| UC-23-08 | `POST /study-prices/{priceId}/close` | Cerrar versión de precio vigente |
| UC-23-08 | `DELETE /diagnostic-study-offerings/{id}` | Retirar (soft-delete) oferta |
| UC-23-09 | `POST /diagnostic-unit-sites/{siteId}/equipment` | Registrar equipamiento |
| UC-23-09 | `PATCH /diagnostic-equipment/{id}` | Actualizar estado/calibración de equipo |
| UC-23-10 | `POST /diagnostic-units/{id}/practitioner-assignments` | Asignar especialista |
| UC-23-11 | `POST /diagnostic-units/{id}/accreditations` | Registrar acreditación con evidencia |
| UC-23-11 | `POST /diagnostic-unit-accreditations/{id}/renew` | Renovar acreditación |
| UC-23-12 | `POST /diagnostic-units/{id}/reproject` | Reconstruir proyección del perfil público |

## Entidades (esquema `diagnostic_units`)

`diagnostic_units`, `diagnostic_unit_sites`, `diagnostic_unit_specialties`,
`diagnostic_unit_accreditations`, `diagnostic_unit_practitioner_assignments`,
`diagnostic_study_offerings`, `diagnostic_study_components`,
`diagnostic_price_schedules`, `diagnostic_study_prices`, `diagnostic_equipment`.

## Reglas de negocio

- **Unicidad**: el modelo declara para la unidad **dos restricciones separadas** —
  `tenant_id` a solas (una unidad de diagnóstico por organización) y `code` a solas
  (código único en toda la plataforma)—, no una compuesta `(tenant_id, code)`. Las
  demás las hace valer el servicio: `(diagnostic_unit_id, study_code)` por oferta;
  `(diagnostic_unit_id, code)` por cronograma; `(site, serial_number)` por equipo.
  Duplicado → `409 Conflict`.
  > El chequeo de alta busca el código **dentro del tenant**, que es más permisivo
  > que lo que declara el modelo: la segunda unidad de una organización, o un código
  > repetido entre organizaciones, lo rechaza Postgres y no el servicio. Anotado el
  > 2026-08-19; alinear es cambio de comportamiento y va por su propia tarjeta.
- **Verify-and-publish** exige ≥1 sitio ACTIVO; si no, `422 Precondition Failed`.
  Verifica especialidades y acreditaciones vigentes y asigna `public_profile_id`.
- **Precios append-only**: nunca se reescribe un importe publicado. Una versión
  nueva cierra la anterior (`effective_to` + `SUPERSEDED`); cerrar retira
  (`RETIRED`) sin DELETE físico. `version_number = max + 1`.
- **Componentes de panel**: se rechaza la autorreferencia (`422`).
- **Especialidades**: a lo sumo una primaria por unidad (`422`); las retiradas se
  cierran con `valid_to`.
- **Asignaciones**: se rechaza el solape activo del mismo profesional en el
  mismo rol/sitio (`409`).
- **Ofertas/estudios/precios/cronogramas** requieren unidad ACTIVA (`422`).

## Permisos

Guard JWT global. Las lecturas del directorio aceptan cualquier sesión con tenant
activo y nunca reciben `tenantId` del cliente; los comandos requieren rol
`SECURITY_ADMIN` (`@Roles('SECURITY_ADMIN')`) y `@CurrentUser()` como actor.
Los identificadores de ruta se validan con `ParseUUIDPipe`.

## Conceptos

`diagnostic_units.concepts.ts` declara los conceptos del módulo (prefijo
`diagnostic_units`): exporta `DIAGNOSTIC_UNITS_CONCEPT_SEEDS` (para el seed) y
`DUNIT` (ids para los servicios). Toda columna `*_concept_id` NOT NULL fijada por
el servidor toma su valor de aquí.

## Logs

Pino estructurado por operación (`operation: 'diagnostic_units.*'`) en inicio,
éxito y rechazo de regla de negocio. Nunca se registran seriales de equipo,
reglas de aseguradora, importes internos ni PHI.

## Tests

- Unitarios (`*.spec.ts`, jest raíz, sin BD): servicios (mockean repos y
  `EntityManager`) y controladores (mockean servicios).
- Smoke transversal: `test/smoke/modules/diagnostic_units.smoke.ts`
  (`DIAGNOSTIC_UNITS_SMOKE`) encadena los 12 casos de uso.

