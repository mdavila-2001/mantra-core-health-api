<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/organization_extensions/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `organization_extensions`

**Fuente:** [`src/modules/organization_extensions/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/organization_extensions/README.md)
· 4 controllers · 4 services · 5 repositories · 6 entidades · 8 DTO

---

# Módulo 22 — Organization Extensions (Healthcare Organization Specializations)

Especializa organizaciones del directorio como hospitales y gestiona sus líneas
de servicio, licencias de instalación, afiliaciones entre organizaciones y
fronteras de datos (residencia/RLS).

## Endpoints

| UC | Método y ruta | Resumen | Permiso |
|----|---------------|---------|---------|
| UC-22-01 | `POST /orgext/hospitals` | Especializar practice/tenant como hospital (estado borrador) | `SECURITY_ADMIN` |
| UC-22-02 | `POST /orgext/hospitals/{id}/activate` | Activar hospital (guard: licencia verificada) | `SECURITY_ADMIN` |
| UC-22-03 | `POST /orgext/hospitals/{id}/service-lines` | Definir línea de servicio (hospital activo) | `SECURITY_ADMIN` |
| UC-22-04 | `DELETE /orgext/hospitals/{id}/service-lines/{lineId}` | Retirar (soft-delete) línea de servicio | `SECURITY_ADMIN` |
| UC-22-05 | `POST /orgext/facility-licenses` | Registrar licencia de instalación (pendiente) | `SECURITY_ADMIN` |
| UC-22-06 | `POST /orgext/facility-licenses/{id}/verify` | Verificar / rechazar licencia | `SECURITY_ADMIN` |
| UC-22-07 | `POST /orgext/affiliations` | Declarar afiliación (incluye guard de frontera de datos) | `SECURITY_ADMIN` |
| UC-22-08 | `POST /orgext/data-boundaries` | Definir frontera de datos (residencia/RLS) | `SECURITY_ADMIN` |
| UC-22-09 | `POST /orgext/affiliations/{id}/terminate` | Terminar afiliación y revocar acceso | `SECURITY_ADMIN` |

## Entidades

`hospitals`, `hospital_service_lines`, `facility_licenses`,
`organization_affiliations`, `organization_data_boundaries`,
`data_use_agreements` (esquema `organization_extensions`).

## Reglas de negocio

- **Especialización 1:1**: un tenant y un practice sólo pueden tener un hospital
  (guard de unicidad en `specialize`).
- **Activación**: sólo desde estado borrador y sólo si el tenant tiene al menos
  una licencia de instalación **verificada** (`422` en otro caso).
- **Líneas de servicio**: sólo sobre hospital activo; el retiro es soft-delete
  (estado `retired`, sin borrado físico).
- **Licencias**: número único por `(tenant, tipo)`; verificación sólo desde
  `pending` a `verified`/`rejected`.
- **Afiliaciones**: `primary != participating`; incluye (`<<include>>` UC-22-08)
  la existencia de una frontera de datos activa del tenant participante; único
  activo por `(primary, participating, tipo)`. La terminación fija `valid_to` y
  solicita la revocación de grants derivados (cross-módulo authz, vía outbox).
- **Fronteras de datos**: única vigente por `(tenant, tipo)`.

## Transacciones y persistencia

- Escrituras vía `em.transactional`; repositorios stateless (reciben el `em`).
- FKs son columnas uuid planas → `flush` del padre antes de los hijos; cada
  `em.create` usa `{ partial: true }`. `row_version` se omite (default en BD).
- Campos de auditoría con `createdBy(actor.id)` / `touch(entity, actor.id)`.

## Conceptos

`organization_extensions.concepts.ts` exporta
`ORGANIZATION_EXTENSIONS_CONCEPT_SEEDS` (para el seed) y `ORGEXT` (ids para los
servicios). Toda columna `*_concept_id` NOT NULL toma su valor de aquí cuando el
cliente no envía uno explícito.

## Logs

Pino estructurado por operación (`orgext.hospital.specialize`,
`orgext.license.verify`, `orgext.affiliation.declare`, …); nunca secretos ni PHI.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos y `em`) y
  `controllers/*.controller.spec.ts` (mockean servicios).
- Smoke: `test/smoke/modules/organization_extensions.smoke.ts`
  (`ORGANIZATION_EXTENSIONS_SMOKE`).

