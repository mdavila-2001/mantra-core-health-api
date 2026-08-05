# src / modules / payments / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `callback_verification_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cash_registers.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `cashier_payment_contexts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `connected_accounts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fee_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `fx_rate_locks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `gateway_connections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `gateway_payment_channel_mappings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `gateway_settlements.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
| `installment_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `installment_schedules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `invoice_regeneration_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `kyc_verifications.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_cancellation_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_channel_catalog.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_checkout_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_debt_invoice_requests.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_debt_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_debts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_disputes.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_gateways.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_intents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_mandates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_methods.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_receipts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_splits.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_status_inquiries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_transactions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payment_webhook_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payout_items.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `payouts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `plan_eligibility_rules.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `plan_features.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `plan_prices.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `plan_quotas.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_api_attempts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_api_operations.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_callback_endpoints.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_callback_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_invoice_artifacts.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `provider_reconciliation_records.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reconciliation_exceptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `reconciliation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `refunds.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `risk_assessments.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `settlement_lines.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `subscription_plans.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `subscription_usage_counters.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `subscriptions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `tips.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `transaction_fees.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `wallet_ledger_entries.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `wallets.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
