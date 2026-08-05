# Controllers — integration_contracts

Capa fina: validan parámetros (`ParseUUIDPipe`), aplican rol y delegan en el
servicio. Todas las operaciones son gobernadas → `@Roles('SECURITY_ADMIN')`.
`@CurrentUser()` provee el actor para auditoría.

| Controller | Base | Endpoints |
|------------|------|-----------|
| `IntegrationContractsController` | `/integration/contracts` | UC-31-01, 02, 03, 04, 05, 06, 08, 10, 11 |
| `IntegrationExchangesController` | `/integration` | UC-31-07 (`exchanges/:recordId/retry`), UC-31-09 (`webhooks/:subscriptionId/deliveries`) |

`executeExchange` lee la clave de idempotencia del header `idempotency-key`
(`@Headers`) y, si falta, la toma del cuerpo. Unit tests verifican la delegación al
servicio con los argumentos correctos (servicios mockeados).
