# Terminology · controllers

Controladores finos: validan parámetros de ruta (`ParseUUIDPipe`), delegan en el
servicio y devuelven un DTO de respuesta. Todos exigen rol `SECURITY_ADMIN`
(`@Roles`) sobre el `JwtAuthGuard` global, y anotan OpenAPI (`@ApiTags`,
`@ApiBearerAuth`, `@ApiOperation`).

| Controlador | Ruta base | Endpoints |
| --- | --- | --- |
| `TerminologyCodeSystemsController` | `terminology/code-systems` | `POST /` (03-01), `POST /:id/versions` (03-02) |
| `TerminologyVersionsController` | `terminology/versions` | `POST /:versionId/import` (03-03), `POST /:versionId/publish` (03-04) |
| `TerminologyConceptsController` | `terminology/concepts` | `POST /:conceptId/designations` (03-05), `POST /:conceptId/relationships` (03-06) |
| `TerminologyValueSetsController` | `terminology/value-sets` | `POST /` (03-07) |

Códigos de estado: `201 Created` en las altas e importación; `200 OK` en la
publicación (mutación de un recurso existente).

## Pruebas

`*.controller.spec.ts` — unitarias con el servicio mockeado; verifican la
delegación con los argumentos correctos y el valor devuelto.
