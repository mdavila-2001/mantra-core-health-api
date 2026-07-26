# DTOs — Accounting

`class-validator` + `class-transformer` + `@nestjs/swagger`. Los importes viajan
como cadenas numéricas (`@IsNumberString`) para no perder precisión; las fechas
como `@IsDateString`. Los DTOs de respuesta exponen solo campos seguros.

| Archivo | DTOs |
|---------|------|
| `account.dto.ts` | `CreateAccountDto`, `AccountResponseDto` |
| `journal.dto.ts` | `LedgerLineDto`, `PostJournalDto`, `ReverseJournalDto`, `DetermineAccountsDto`, `AttachFileDto`, respuestas + `AccountingStatusDto` |
| `fiscal.dto.ts` | `FiscalPeriodInputDto`, `CreateFiscalYearDto`, `LockPeriodDto`, `FiscalYearResponseDto` |
| `accrual.dto.ts` | `AccrualScheduleInputDto`, `CreateAccrualObjectDto`, `RunAccrualsDto`, respuestas |
| `subledger.dto.ts` | `CreateOpenItemDto`, `ClearingItemInputDto`, `CreateClearingDto`, respuestas |
| `asset.dto.ts` | `CapitalizeAssetDto`, `RunDepreciationDto`, respuestas |
| `liability.dto.ts` | `PayLiabilityDto`, `LiabilityPaymentResponseDto` |
| `exchange-rate.dto.ts` | `RegisterExchangeRateDto`, `ExchangeRateResponseDto` |

Reglas de validación relevantes: `PostJournalDto.lines` exige `@ArrayMinSize(2)`
(el balance debe=haber se valida en el servicio); `CreateFiscalYearDto.periods`
exige `@ArrayMinSize(1)`; `CreateAccrualObjectDto.schedule` exige `@ArrayMinSize(1)`.
