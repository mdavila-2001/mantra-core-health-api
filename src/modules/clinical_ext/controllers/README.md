# clinical_ext / controllers

Capa fina: `@ApiTags` + `@ApiBearerAuth()`, `@HttpCode` correcto, `@CurrentUser()`
como actor, `@Param('id', ParseUUIDPipe)` en params; delegan en el servicio y
devuelven un response DTO. Los sufijos `:accion` de la spec se realizan como
segmento de ruta por compatibilidad con Express 5.

- `CareTeamsController` — `/care-teams` (UC-18-01, UC-18-02).
- `CdsController` — `/cds-rules`, `/cds/evaluate`, `/cds/check-interactions`,
  `/drug-interactions` (UC-18-03, UC-18-04, UC-18-13). Gobernanza → `SECURITY_ADMIN`.
- `ClinicalAlertsController` — `/clinical-alerts` (UC-18-05).
- `OrderSetsController` — `/order-sets` (UC-18-06). Creación → `SECURITY_ADMIN`.
- `ReferralsController` — `/referrals` (UC-18-07, UC-18-08).
- `CareGapsController` — `/care-gaps`, `/patients/{id}/immunization-plan/project`,
  `/immunization-schedules` (UC-18-09, UC-18-10, UC-18-11).
- `VirtualEncountersController` — `/virtual-encounters` (UC-18-12).

Specs unitarios mockean el servicio y verifican la delegación con los args correctos.
