import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos propios del módulo Accounting (módulo 16 — libro mayor y subledgers).
 *
 * Cada estado/tipo/rol que una columna `*_concept_id` NOT NULL de este módulo
 * necesita se declara aquí con el prefijo `accounting`, de modo que se puede
 * ampliar sin tocar el catálogo transversal (`src/common/constants/concepts.ts`)
 * ni el agregador `module-concepts.ts` (los cablea el orquestador). Los servicios
 * importan `ACCT` y referencian, p. ej., `ACCT.DIRECTION_DEBIT`.
 *
 * Para columnas `*_concept_id` cuyo valor semántico ya existe en el catálogo
 * transversal (por ejemplo un estado ACTIVO genérico) se usa `CONCEPTS.STATE_ACTIVE`.
 */
export const { seeds: ACCOUNTING_CONCEPT_SEEDS, ids: ACCT } = defineModuleConcepts('accounting', {
  // --- Tipos de transacción (journal_transactions.transaction_type_concept_id) ---
  TXN_TYPE_STANDARD: { code: 'ACCT_TXN_STANDARD', display: 'Standard journal entry' },
  TXN_TYPE_REVERSAL: { code: 'ACCT_TXN_REVERSAL', display: 'Reversal journal entry' },
  TXN_TYPE_ACCRUAL: { code: 'ACCT_TXN_ACCRUAL', display: 'Accrual posting' },
  TXN_TYPE_DEPRECIATION: { code: 'ACCT_TXN_DEPRECIATION', display: 'Depreciation posting' },
  TXN_TYPE_CLEARING: { code: 'ACCT_TXN_CLEARING', display: 'Clearing posting' },
  TXN_TYPE_ASSET_ACQUISITION: { code: 'ACCT_TXN_ASSET_ACQ', display: 'Asset acquisition posting' },
  TXN_TYPE_LIABILITY_PAYMENT: { code: 'ACCT_TXN_LIAB_PAY', display: 'Liability payment posting' },

  // --- Estado de la transacción (journal_transactions.status_concept_id) ---
  TXN_DRAFT: { code: 'ACCT_TXN_DRAFT', display: 'Draft transaction' },
  TXN_POSTED: { code: 'ACCT_TXN_POSTED', display: 'Posted transaction' },
  TXN_REVERSED: { code: 'ACCT_TXN_REVERSED', display: 'Reversed transaction' },

  // --- Dirección de la línea del mayor (ledger_entries.direction_concept_id) ---
  // También se reutiliza como saldo normal de la cuenta (accounts.normal_balance_concept_id).
  DIRECTION_DEBIT: { code: 'ACCT_DEBIT', display: 'Debit' },
  DIRECTION_CREDIT: { code: 'ACCT_CREDIT', display: 'Credit' },

  // --- Tipos de cuenta (accounts.account_type_concept_id) ---
  ACCOUNT_TYPE_ASSET: { code: 'ACCT_ACC_ASSET', display: 'Asset account' },
  ACCOUNT_TYPE_LIABILITY: { code: 'ACCT_ACC_LIABILITY', display: 'Liability account' },
  ACCOUNT_TYPE_EQUITY: { code: 'ACCT_ACC_EQUITY', display: 'Equity account' },
  ACCOUNT_TYPE_REVENUE: { code: 'ACCT_ACC_REVENUE', display: 'Revenue account' },
  ACCOUNT_TYPE_EXPENSE: { code: 'ACCT_ACC_EXPENSE', display: 'Expense account' },

  // --- Ejercicios y periodos fiscales (fiscal_years/periods.status_concept_id) ---
  YEAR_OPEN: { code: 'ACCT_FY_OPEN', display: 'Fiscal year open' },
  PERIOD_OPEN: { code: 'ACCT_FP_OPEN', display: 'Fiscal period open' },
  PERIOD_LOCKED: { code: 'ACCT_FP_LOCKED', display: 'Fiscal period locked' },

  // --- Devengos (accrual_objects / accrual_schedule_lines) ---
  ACCRUAL_TYPE_DEFAULT: { code: 'ACCT_ACCRUAL_DEFAULT', display: 'Default accrual type' },
  ACCRUAL_ACTIVE: { code: 'ACCT_ACCRUAL_ACTIVE', display: 'Accrual object active' },
  SCHEDULE_PENDING: { code: 'ACCT_ACCRUAL_LINE_PENDING', display: 'Accrual schedule line pending' },
  SCHEDULE_POSTED: { code: 'ACCT_ACCRUAL_LINE_POSTED', display: 'Accrual schedule line posted' },

  // --- Subledgers y partidas abiertas (subledger_accounts / open_items) ---
  SUBLEDGER_CUSTOMER: { code: 'ACCT_SL_CUSTOMER', display: 'Customer subledger role' },
  SUBLEDGER_VENDOR: { code: 'ACCT_SL_VENDOR', display: 'Vendor subledger role' },
  SUBLEDGER_ACTIVE: { code: 'ACCT_SL_ACTIVE', display: 'Subledger account active' },
  DOC_TYPE_INVOICE: { code: 'ACCT_DOC_INVOICE', display: 'Invoice document' },
  DOC_TYPE_BILL: { code: 'ACCT_DOC_BILL', display: 'Bill document' },
  OPEN_ITEM_OPEN: { code: 'ACCT_OI_OPEN', display: 'Open item open' },
  OPEN_ITEM_PARTIAL: { code: 'ACCT_OI_PARTIAL', display: 'Open item partially cleared' },
  OPEN_ITEM_CLEARED: { code: 'ACCT_OI_CLEARED', display: 'Open item cleared' },

  // --- Clearing y vínculos entre documentos (clearing_documents / accounting_document_links) ---
  CLEARING_COMPLETED: { code: 'ACCT_CLR_COMPLETED', display: 'Clearing completed' },
  RELATION_REVERSES: { code: 'ACCT_REL_REVERSES', display: 'Reverses' },
  RELATION_CLEARS: { code: 'ACCT_REL_CLEARS', display: 'Clears' },

  // --- Activos y depreciación (assets / asset_postings) ---
  ASSET_ACTIVE: { code: 'ACCT_ASSET_ACTIVE', display: 'Asset active' },
  ASSET_TYPE_EQUIPMENT: { code: 'ACCT_ASSET_EQUIPMENT', display: 'Equipment asset' },
  DEPRECIATION_METHOD_STRAIGHT_LINE: { code: 'ACCT_DEP_STRAIGHT_LINE', display: 'Straight-line depreciation' },
  ASSET_POSTING_ACQUISITION: { code: 'ACCT_ASSET_POST_ACQ', display: 'Asset acquisition' },
  ASSET_POSTING_DEPRECIATION: { code: 'ACCT_ASSET_POST_DEP', display: 'Asset depreciation' },

  // --- Pasivos (liabilities / liability_schedules / liability_postings) ---
  LIABILITY_ACTIVE: { code: 'ACCT_LIAB_ACTIVE', display: 'Liability active' },
  LIABILITY_SETTLED: { code: 'ACCT_LIAB_SETTLED', display: 'Liability settled' },
  LIAB_SCHEDULE_PENDING: { code: 'ACCT_LIAB_SCHED_PENDING', display: 'Liability installment pending' },
  LIAB_SCHEDULE_PAID: { code: 'ACCT_LIAB_SCHED_PAID', display: 'Liability installment paid' },
  COMPONENT_PRINCIPAL: { code: 'ACCT_COMP_PRINCIPAL', display: 'Principal component' },
  COMPONENT_INTEREST: { code: 'ACCT_COMP_INTEREST', display: 'Interest component' },

  // --- Determinación de cuentas (account_determination_rules) ---
  RULE_ACTIVE: { code: 'ACCT_RULE_ACTIVE', display: 'Determination rule active' },
  SCENARIO_ASSET_ACQUISITION: { code: 'ACCT_SCN_ASSET_ACQ', display: 'Asset acquisition scenario' },
  ROLE_ACQUISITION_ACCOUNT: { code: 'ACCT_ROLE_ACQ_ACCOUNT', display: 'Acquisition account role' },

  // --- Monedas (currency_concept_id / exchange_rates) ---
  CURRENCY_PEN: { code: 'ACCT_CUR_PEN', display: 'Peruvian Sol' },
  CURRENCY_USD: { code: 'ACCT_CUR_USD', display: 'US Dollar' },
});
