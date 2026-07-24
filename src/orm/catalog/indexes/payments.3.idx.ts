import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `payments` (parte 3/3).
 * 20 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const paymentsIndexes3: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['transaction_fees', 'ix_transaction_fees_bearer_type_concept_id', ['bearer_type_concept_id'], false, 'btree'],
  ['transaction_fees', 'ix_transaction_fees_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['transaction_fees', 'ix_transaction_fees_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['wallet_ledger_entries', 'uq_wallet_ledger_entries_idempotency_key', ['idempotency_key'], true, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_wallet_id', ['wallet_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_direction_concept_id', ['direction_concept_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_currency_concept_id', ['currency_concept_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_entry_type_concept_id', ['entry_type_concept_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_payment_transaction_id', ['payment_transaction_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_journal_transaction_id', ['journal_transaction_id'], false, 'btree'],
  ['wallet_ledger_entries', 'ix_wallet_ledger_entries_recorded_by_user_id', ['recorded_by_user_id'], false, 'btree'],
  ['wallets', 'ix_wallets_tenant_id', ['tenant_id'], false, 'btree'],
  ['wallets', 'ix_wallets_owner_type_concept_id', ['owner_type_concept_id'], false, 'btree'],
  ['wallets', 'ix_wallets_wallet_type_concept_id', ['wallet_type_concept_id'], false, 'btree'],
  ['wallets', 'ix_wallets_currency_concept_id', ['currency_concept_id'], false, 'btree'],
  ['wallets', 'ix_wallets_ledger_account_id', ['ledger_account_id'], false, 'btree'],
  ['wallets', 'ix_wallets_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['wallets', 'ix_wallets_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['wallets', 'ix_wallets_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['wallets', 'ix_wallets_tenant_id_status_concept_id', ['tenant_id', 'status_concept_id', 'updated_at desc'], false, 'btree'],
];
