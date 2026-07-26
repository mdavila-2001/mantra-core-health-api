# Controllers — Accounting

Capa fina bajo `@Controller('accounting')`: `@ApiTags` + `@ApiBearerAuth`,
`@HttpCode` correcto, `@Param('id', ParseUUIDPipe)`, `@CurrentUser() actor` y
`@Roles('SECURITY_ADMIN')`. Delegan en el servicio de dominio y devuelven un DTO.

| Controller | Rutas |
|------------|-------|
| `AccountingLedgerController` | `accounts`, `journal-transactions`, `postings/determine-accounts`, `journal-transactions/:id/reverse`, `journal-transactions/:id/files` |
| `AccountingFiscalController` | `fiscal-years`, `fiscal-periods/:id/lock` |
| `AccountingAccrualController` | `accrual-objects`, `accruals/run` |
| `AccountingSubledgerController` | `open-items`, `clearing-documents` |
| `AccountingAssetController` | `assets/capitalize`, `depreciation/run` |
| `AccountingLiabilityController` | `liabilities/:id/payments` |
| `AccountingExchangeRateController` | `exchange-rates` |

Specs (`*.spec.ts`) verifican la delegación al servicio con los argumentos
correctos, mockeando el servicio por completo.
