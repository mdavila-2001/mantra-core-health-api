# Controllers — delegated_access

Capa fina: validan parámetros (`ParseUUIDPipe`), aplican `@Roles('SECURITY_ADMIN')`
sobre el guard global, obtienen el actor con `@CurrentUser()` y delegan en el
servicio. Documentados con `@ApiTags`/`@ApiOperation`/`@ApiBearerAuth`.

| Controller                          | Rutas / UCs                                                                                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OrgUserAssignmentsController`      | `POST /org/{id}/user-assignments` (01), `PATCH /org/user-assignments/{id}` (10)                                                                                             |
| `DelegatedPermissionSetsController` | `POST /delegated-permission-sets` y `/{id}/versions` (02)                                                                                                                   |
| `PractitionerDelegatesController`   | `POST /practitioner-delegates` (03), `/{id}/access-requests` (04), `/{id}/grants` (06), `/{id}/revoke` (07)                                                                 |
| `AccessRequestsController`          | `POST /access-requests/{id}/decision` (05)                                                                                                                                  |
| `DelegatedAccessAuthzController`    | `POST /delegated-access/expiry-sweep` (08), `POST /authz/effective-actor/evaluate` (09)                                                                                     |
| `AccessReviewCampaignsController`   | `GET/POST /org/access-reviews/campaigns`, `POST …/preview`, `GET/PATCH …/{id}`, `POST …/{id}/launch\|close\|cancel`, `GET …/{id}/items\|results\|export`                    |
| `MyAccessReviewsController`         | `GET /me/access-reviews/items`, `GET …/{id}`, `POST …/{id}/decision`, `POST …/bulk-decision`                                                                                |
| `GovernanceReportsController`       | `GET /org/governance/summary\|access-matrix\|privilege-creep\|unused-access\|ownerless\|exceptions\|anomalies`, `POST …/anomalies/{id}/ack`, `POST …/reports/{kind}/export` |
| `PractitionerGovernanceController`  | `GET /me/practitioner/governance-panel`                                                                                                                                     |
| `GovernanceSweepController`         | `POST /delegated-access/support/governance-sweep`, `POST …/anomaly-scan` (`SYSTEM`)                                                                                         |
| `SupportLifecycleController`        | `GET org/lifecycle/cases`, `…/{id}`, `…/{id}/export`; `POST …/{id}/checklist/{code}`, `…/{id}/handover/assign`; `POST org/support-engagements/{id}/identity-verification\|move\|offboard\|suspend\|reactivate`, `PUT …/{id}/owner`, `GET …/{id}/handover-preview`; `POST me/support-engagements/{id}/confidentiality-ack` |
| `TeamAdminController`               | `GET/POST/PATCH org/team/members…`, `capabilities`, `invitations`, `requests`, `requests/{id}/decision` (administración delegada con techo) |

Specs (`*.controller.spec.ts`) mockean el servicio y verifican la delegación con
los argumentos correctos.
