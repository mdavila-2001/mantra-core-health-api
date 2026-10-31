# Módulo `admin_catalogs` — Editor de catálogos globales

Rutas de administración para editar catálogos por tipo de usuario, con versión optimista y auditoría. Parte del plan
«Perfil admin: medición y gobierno» (H3); contrato completo en `mantra-core-health/docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H3-catalogos.md`.

| Ruta                                                           | Acceso                                      | Qué hace                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `GET /admin/catalogs/services/scopes`                          | `SECURITY_ADMIN` (`SUPERADMIN` por comodín) | Tipos de organización, prácticas activas y monedas del editor                                     |
| `GET /admin/catalogs/services`                                 | ídem                                        | Lista por tipo de organización/práctica, cursor `(code, id)`                                      |
| `GET /admin/catalogs/services/:id`                             | ídem                                        | Un servicio; de otra organización => 404                                                          |
| `POST /admin/catalogs/services`                                | ídem                                        | Alta idempotente por `(práctica, código)`: 201 / 200 repetición idéntica / 409 contenido distinto |
| `PATCH /admin/catalogs/services/:id`                           | ídem                                        | Edición con `expectedRowVersion` (409 `SERVICE_CATALOG_VERSION_MISMATCH`)                         |
| `POST /admin/catalogs/services/:id/deactivate` · `/reactivate` | ídem                                        | Idempotentes; no hay `DELETE`                                                                     |

Auditoría (`@Audited`, entidad `service_catalog`): `ADMIN_SERVICE_CATALOG_CREATED|UPDATED|DEACTIVATED|REACTIVATED`.

**Pendiente (no implementado en este módulo):** glosario editable (`/admin/catalogs/glossary`, contrato §3) y reporte contable por tipo de usuario
(contrato §4, decisión de negocio). Reutiliza entidades existentes (`billing.service_catalog`, `practice.practices`, `terminology.catalog_concepts`); no hay DDL nuevo.
