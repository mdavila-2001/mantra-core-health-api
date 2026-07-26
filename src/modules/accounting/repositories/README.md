# Repositorios — Accounting

Acceso a datos **stateless**: cada método recibe el `EntityManager` activo como
primer parámetro para que el servicio controle la unidad de trabajo, la
transacción y el orden de `flush` padre→hijo. No contienen reglas de negocio; solo
construcción de consultas y `em.create(..., { partial: true })` con
`createdBy(actorId)`.

| Repositorio | Entidades | Uso principal |
|-------------|-----------|---------------|
| `JournalRepository` | `journal_transactions`, `ledger_entries`, `journal_entry_assignments`, `accounting_document_links`, `transaction_files` | Posteo, reversa, adjuntos |
| `AccountsRepository` | `accounts`, `account_determination_rules` (RO) | Plan de cuentas, determinación (UC-16-02) |
| `FiscalRepository` | `fiscal_years`, `fiscal_periods` | Calendario fiscal (UC-16-04/05) |
| `AccrualRepository` | `accrual_objects`, `accrual_schedule_lines`, `accrual_postings` | Devengos (UC-16-06/07) |
| `SubledgerRepository` | `subledger_accounts`, `open_items`, `clearing_documents`, `clearing_items` | AR/AP (UC-16-08/09) |
| `AssetRepository` | `assets`, `asset_components`, `asset_valuations`, `asset_assignments`, `asset_postings`, `asset_depreciations` | Activos (UC-16-10/11) |
| `LiabilityRepository` | `liabilities`, `liability_schedules`, `liability_payments`, `liability_postings` | Pasivos (UC-16-12) |
| `ExchangeRateRepository` | `exchange_rates` | Tipos de cambio (UC-16-14) |
