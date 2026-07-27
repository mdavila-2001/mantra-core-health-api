# Terminology · controllers

Controladores finos: validan parámetros de ruta (`ParseUUIDPipe`), delegan en el
servicio y devuelven un DTO de respuesta. Anotan OpenAPI (`@ApiTags`,
`@ApiBearerAuth`, `@ApiOperation`) sobre el `JwtAuthGuard` global.

| Controlador | Ruta base | Endpoints |
| --- | --- | --- |
| `TerminologyCodeSystemsController` | `terminology/code-systems` | `POST /` (03-01), `POST /:id/versions` (03-02) |
| `TerminologyVersionsController` | `terminology/versions` | `POST /:versionId/import` (03-03), `POST /:versionId/publish` (03-04) |
| `TerminologyConceptsController` | `terminology/concepts` | `POST /:conceptId/designations` (03-05), `POST /:conceptId/properties` (03-05), `POST /:conceptId/relationships` (03-06), `POST /:conceptId/$deprecate` (03-10) |
| `TerminologyValueSetsController` | `terminology/value-sets` | `POST /` (03-07) |
| `TerminologyFhirController` | `terminology` | `POST /ValueSet/:id/$expand` (03-08), `POST /ConceptMap/$translate` (03-09), `GET /CodeSystem/$lookup` (03-11) |
| `TerminologyTenantCatalogController` | `terminology/tenants` | `PUT /:tenantId/catalog-policies` (03-12) |

Las operaciones con nombre del estilo FHIR viven en su propio controlador porque
cuelgan de rutas con el nombre del recurso FHIR (`ValueSet`, `ConceptMap`,
`CodeSystem`), distintas de las rutas administrativas del módulo. El prefijo `$`
es un segmento literal: `path-to-regexp` v8 sólo trata `:` como inicio de
parámetro.

Permisos: todo exige `@Roles('SECURITY_ADMIN')` salvo `$translate` y `$lookup`,
que el caso de uso asigna al consumidor FHIR y sólo exigen autenticación.

Códigos de estado: `201 Created` en las altas e importación; `200 OK` en las
mutaciones de recursos existentes (publicación, propiedades, `$expand`,
`$deprecate`, `$translate`, política de catálogo) y en las lecturas.

`$lookup` valida en el propio controlador que lleguen `system` **y** `code`: son
la clave completa del concepto y resolver con uno solo devolvería un resultado
arbitrario.

## Pruebas

`*.controller.spec.ts` — unitarias con el servicio mockeado; verifican la
delegación con los argumentos correctos y el valor devuelto.
