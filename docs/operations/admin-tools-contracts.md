# Herramientas del portal administrativo

`GET /admin/ops/tools` sirve `ops-tools/v1`, el contrato del portal: `modelVersion`,
`evaluatedAt`, `summary` y `tools`. Cada herramienta informa su adaptador,
configuración y tipo de comprobación. `isHealthy` sólo expresa salud cuando
`checkType` es `LIVE`; configuración incompleta no demuestra una caída.

`GET /admin/ops/tool-registry` consulta el catálogo persistido de `platform_ops`
con la forma `evaluatedAt`, `items`, `notMeasured`.
`GET /admin/ops/tools/:code` conserva el detalle persistido y sus últimas
20 comprobaciones. Los tres endpoints exigen los roles de lectura de operaciones.

El catálogo integrado y el persistido tienen rutas diferentes. Al actualizar
clientes que consumen la antigua respuesta `items`, se usa `tool-registry`.
El portal que consume `tools` utiliza la ruta `tools`.

## Índices históricos y modelo v4.2.84

Los índices actuales se declaran en el modelo y se copian a `database/SQL`.
Estas diferencias respecto de parches históricos representan el esquema vigente:

| Nombre histórico | Definición actual |
| --- | --- |
| `uq_practitioner_affiliation_same` | Dos índices únicos parciales: por establecimiento cuando está declarado y por nombre de organización en los demás casos. |
| `ix_survey_versions_template_number` | `uq_survey_versions_template_number`: el par plantilla/versión es único. |
| `ix_survey_responses_invitation` | `uq_survey_responses_invitation`: una respuesta por invitación. |
| `ix_identifiers_issuing_administrative_area_concept_id` | `ix_identifiers_issuer_administrative_area_concept_id`, sobre la columna `issuer_administrative_area_concept_id`. |
| `ux_inventory_reservations_pickup_code` | `ux_inventory_reservations_pharmacy_site_pickup_code`: código único dentro de cada farmacia. |
| `ix_identifiers_national_id_normalized` | `uq_identifiers_national_id_normalized`: índice único normalizado. El índice no único es el recurso temporal del parche cuando existen duplicados. |

Recrear índices históricos puede reintroducir restricciones que el modelo cambió,
como exigir códigos de recogida únicos entre todas las farmacias.
