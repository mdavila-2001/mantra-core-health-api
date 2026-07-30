# Billing · DTO

Contratos de entrada/salida con `class-validator` + `class-transformer` +
`@nestjs/swagger`. Los importes monetarios viajan como strings `@IsNumberString`
(la BD usa `numeric`); las fechas como `@IsDateString`; los ids como `@IsUUID`.

| Archivo | Request | Response |
|---------|---------|----------|
| `invoice.dto.ts` | `IssueInvoiceFromEncounterDto`, `CreditNoteDto` | `InvoiceResponseDto` |
| `payment-received.dto.ts` | `ApplyPaymentReceivedDto` | `PaymentReceivedResponseDto` |
| `bill.dto.ts` | `RegisterBillDto` | `BillResponseDto` |
| `payment-made.dto.ts` | `ExecutePaymentMadeDto` | `PaymentMadeResponseDto` |
| `posting.dto.ts` | `PostToLedgerDto` | `PostingResultDto` |
| `reconciliation.dto.ts` | `ReconciliationClearDto` | `ReconciliationResultDto` |
| `reimbursement.dto.ts` | `LinkReimbursementDto` | `ReimbursementResponseDto` |
| `patient-statement.dto.ts` | `GeneratePatientStatementDto` | `PatientStatementResponseDto` |
| `dunning.dto.ts` | `ExecuteDunningRunDto` | `DunningRunResponseDto` |
| `payment-plan.dto.ts` | `CreatePaymentPlanDto` | `PaymentPlanResponseDto` |
| `kpi-snapshot.dto.ts` | `ComputeKpiSnapshotDto` | `KpiSnapshotResponseDto` |

Las referencias cross-módulo (paciente, práctica, tenant, encuentro, reclamo) se
reciben por DTO como uuid; el `tenantId` opcional habilita el registro del vínculo
de documento correspondiente.
