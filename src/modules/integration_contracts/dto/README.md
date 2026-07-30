# DTOs — integration_contracts

Contratos de entrada/salida HTTP con `class-validator` + `@nestjs/swagger`. Los DTO
de respuesta exponen solo campos seguros (nunca referencias de secreto en claro más
allá de la referencia opaca; los estados se devuelven como concept id).

## Requests

| DTO | Endpoint (UC) |
|-----|---------------|
| `CreateContractDto` | UC-31-01 |
| `CreateContractVersionDto` | UC-31-02 |
| `CreateAuthProfileDto` | UC-31-03 |
| `CreateWebhookSubscriptionDto` | UC-31-04 |
| `ExecuteExchangeDto` | UC-31-05 (clave por header `idempotency-key` o cuerpo) |
| `RecordAttemptDto` | UC-31-06 |
| `RetryExchangeDto` | UC-31-07 |
| `AdvanceCursorDto` | UC-31-08 |
| `DeliverWebhookDto` | UC-31-09 |
| `ActivateVersionDto` | UC-31-10 |
| `RetireContractDto` / `RotateCredentialDto` | UC-31-11 |

## Responses (`responses.dto.ts`)

`ContractResponseDto`, `ContractVersionResponseDto`, `AuthProfileResponseDto`,
`WebhookSubscriptionResponseDto`, `ExchangeRecordResponseDto`,
`ExchangeAttemptResponseDto`, `SyncCursorResponseDto`,
`DeliveryEvidenceResponseDto`, `StatusResultDto`.
