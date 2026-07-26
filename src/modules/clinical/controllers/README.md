# Clinical — Controladores

Capa fina: validan parámetros (`ParseUUIDPipe`), toman el actor con
`@CurrentUser()` y delegan en el servicio de dominio. Documentados con
`@ApiTags`/`@ApiBearerAuth`/`@ApiOperation`. Guard JWT global (401 sin token).

| Controlador | Prefijo | Endpoints (UC) |
|-------------|---------|----------------|
| `ClinicalEncountersController` | `/clinical` | `POST care-episodes` (01), `POST encounters/check-in` (02), `POST encounters/:id/close` (14) |
| `ClinicalObservationsController` | `/clinical/observations` | `POST /` (03), `PATCH /:id/amend` (04) |
| `ClinicalOrdersController` | `/clinical` | `POST service-requests` (05), `POST diagnostic-reports` (06), `POST diagnostic-reports/:id/release` (07) |
| `ClinicalRecordsController` | `/clinical` | `POST conditions` (08), `POST allergy-intolerances` (09), `POST medication-requests` (10), `POST medication-records` (11), `POST procedures` (12), `POST immunizations` (13) |

`HttpCode`: 201 para creaciones; 200 para mutaciones sobre recurso existente
(close, amend, release).

## Tests

`*.controller.spec.ts` — unit, mockean el servicio y verifican la delegación con
los argumentos correctos.
