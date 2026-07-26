import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { ACCT } from '../../../src/modules/accounting/accounting.concepts';

/**
 * Contrato de integración del módulo 16 (Accounting). Encadena recursos propios
 * (cuentas → asiento → líneas; ejercicio → periodos → devengo/depreciación) con
 * `ctx.vars`, usando `ctx.vars.pracPracticeId` (práctica sembrada por Practice) y
 * `ctx.tenantId`/`ctx.adminUserId` para FKs externas.
 *
 * Los flujos que exigen un padre que este módulo no puede crear por endpoint
 * (subledger→business_partner, pasivo, regla de determinación) se ejercen con sus
 * casos límite (401/404/422), según lo permite el brief.
 */
export const ACCOUNTING_SMOKE: SmokeCase[] = [
  // ---- setup: archivo soporte (common.files) --------------------------------
  {
    module: 'Accounting', endpoint: 'POST /common/files', name: 'setup: archivo soporte',
    method: 'post', path: () => '/common/files',
    body: (c) => ({
      originalName: `acct-${c.u}.pdf`,
      category: 'DOCUMENT',
      sensitivity: 'NORMAL',
      mimeType: 'application/pdf',
      sizeBytes: 2048,
      contentHash: `acct-hash-${c.u}`,
      storageUri: `s3://bucket/acct-${c.u}.pdf`,
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctFileId = String(b.id); },
  },

  // ---- setup: plan de cuentas ----------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'setup: cuenta activo (débito)',
    method: 'post', path: () => '/accounting/accounts',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `AST-${c.u}`, name: 'Equipos', accountType: 'ASSET', normalBalance: 'DEBIT' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctAssetAccId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'setup: cuenta banco (débito)',
    method: 'post', path: () => '/accounting/accounts',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `BNK-${c.u}`, name: 'Banco', accountType: 'ASSET', normalBalance: 'DEBIT' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctBankAccId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'setup: cuenta gasto (débito)',
    method: 'post', path: () => '/accounting/accounts',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `EXP-${c.u}`, name: 'Gasto', accountType: 'EXPENSE', normalBalance: 'DEBIT' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctExpenseAccId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'setup: cuenta por pagar (crédito)',
    method: 'post', path: () => '/accounting/accounts',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `PAY-${c.u}`, name: 'Por pagar', accountType: 'LIABILITY', normalBalance: 'CREDIT' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctPayableAccId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'setup: depreciación acumulada (crédito)',
    method: 'post', path: () => '/accounting/accounts',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `ADP-${c.u}`, name: 'Deprec. acumulada', accountType: 'LIABILITY', normalBalance: 'CREDIT' }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctAccumDepAccId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accounts', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/accounts', auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: 'X', name: 'X', accountType: 'ASSET', normalBalance: 'DEBIT' }),
    expectedStatus: 401,
  },

  // ---- UC-16-04: abrir ejercicio fiscal -------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-years', name: 'happy: abrir ejercicio con periodos',
    method: 'post', path: () => '/accounting/fiscal-years',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      code: `FY-${c.u}`,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      periods: [
        { code: `2026-01-${c.u}`, startDate: '2026-01-01', endDate: '2026-01-31' },
        { code: `2026-02-${c.u}`, startDate: '2026-02-01', endDate: '2026-02-28' },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.acctFiscalYearId = String(b.id);
      const ids = (b.periodIds as string[]) ?? [];
      c.vars.acctPeriodOpenId = String(ids[0]);
      c.vars.acctPeriodLockId = String(ids[1]);
    },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-years', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/fiscal-years', auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `FY-${c.u}-x`, startDate: '2026-01-01', endDate: '2026-12-31', periods: [] }),
    expectedStatus: 401,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-years', name: 'límite: validación (sin periodos)',
    method: 'post', path: () => '/accounting/fiscal-years',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `FY-${c.u}-y`, startDate: '2026-01-01', endDate: '2026-12-31', periods: [] }),
    expectedStatus: 400,
  },

  // ---- UC-16-05: bloquear periodo -------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-periods/{id}/lock', name: 'happy: bloquear periodo',
    method: 'post', path: (c) => `/accounting/fiscal-periods/${c.vars.acctPeriodLockId}/lock`,
    body: () => ({ reason: 'cierre mensual' }), expectedStatus: 200,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-periods/{id}/lock', name: 'límite: periodo inexistente',
    method: 'post', path: () => `/accounting/fiscal-periods/${UUID_ABSENT}/lock`,
    body: () => ({}), expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/fiscal-periods/{id}/lock', name: 'límite: sin auth',
    method: 'post', path: (c) => `/accounting/fiscal-periods/${c.vars.acctPeriodLockId}/lock`, auth: false,
    body: () => ({}), expectedStatus: 401,
  },

  // ---- UC-16-01: postear asiento balanceado ---------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions', name: 'happy: asiento balanceado en periodo abierto',
    method: 'post', path: () => '/accounting/journal-transactions',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      transactionDate: '2026-01-15',
      fiscalPeriodId: c.vars.acctPeriodOpenId,
      description: 'Compra de insumos',
      lines: [
        { accountId: c.vars.acctExpenseAccId, direction: 'DEBIT', amount: '100.00' },
        { accountId: c.vars.acctPayableAccId, direction: 'CREDIT', amount: '100.00' },
      ],
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctJournalId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions', name: 'límite: no balancea (422)',
    method: 'post', path: () => '/accounting/journal-transactions',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      transactionDate: '2026-01-15',
      lines: [
        { accountId: c.vars.acctExpenseAccId, direction: 'DEBIT', amount: '100.00' },
        { accountId: c.vars.acctPayableAccId, direction: 'CREDIT', amount: '90.00' },
      ],
    }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions', name: 'límite: periodo bloqueado (422)',
    method: 'post', path: () => '/accounting/journal-transactions',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      transactionDate: '2026-02-15',
      fiscalPeriodId: c.vars.acctPeriodLockId,
      lines: [
        { accountId: c.vars.acctExpenseAccId, direction: 'DEBIT', amount: '10.00' },
        { accountId: c.vars.acctPayableAccId, direction: 'CREDIT', amount: '10.00' },
      ],
    }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/journal-transactions', auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, transactionDate: '2026-01-15', lines: [] }),
    expectedStatus: 401,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions', name: 'límite: validación (una sola línea)',
    method: 'post', path: () => '/accounting/journal-transactions',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      transactionDate: '2026-01-15',
      lines: [{ accountId: c.vars.acctExpenseAccId, direction: 'DEBIT', amount: '100.00' }],
    }),
    expectedStatus: 400,
  },

  // ---- UC-16-03: reversar asiento -------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/reverse', name: 'happy: reversar asiento posteado',
    method: 'post', path: (c) => `/accounting/journal-transactions/${c.vars.acctJournalId}/reverse`,
    body: () => ({ reason: 'error de captura' }), expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/reverse', name: 'límite: ya reversado (409)',
    method: 'post', path: (c) => `/accounting/journal-transactions/${c.vars.acctJournalId}/reverse`,
    body: () => ({}), expectedStatus: 409,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/reverse', name: 'límite: inexistente (404)',
    method: 'post', path: () => `/accounting/journal-transactions/${UUID_ABSENT}/reverse`,
    body: () => ({}), expectedStatus: 404,
  },

  // ---- UC-16-13: adjuntar documento -----------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/files', name: 'happy: adjuntar soporte',
    method: 'post', path: (c) => `/accounting/journal-transactions/${c.vars.acctJournalId}/files`,
    body: (c) => ({ fileId: c.vars.acctFileId }), expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/files', name: 'límite: asiento inexistente (404)',
    method: 'post', path: (c) => `/accounting/journal-transactions/${UUID_ABSENT}/files`,
    body: (c) => ({ fileId: c.vars.acctFileId }), expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/journal-transactions/{id}/files', name: 'límite: sin auth',
    method: 'post', path: (c) => `/accounting/journal-transactions/${c.vars.acctJournalId}/files`, auth: false,
    body: (c) => ({ fileId: c.vars.acctFileId }), expectedStatus: 401,
  },

  // ---- UC-16-02: determinación de cuentas -----------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/postings/determine-accounts', name: 'límite: sin regla vigente (404)',
    method: 'post', path: () => '/accounting/postings/determine-accounts',
    body: (c) => ({ tenantId: c.tenantId, postingScenarioConceptId: ACCT.SCENARIO_ASSET_ACQUISITION }),
    expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/postings/determine-accounts', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/postings/determine-accounts', auth: false,
    body: (c) => ({ tenantId: c.tenantId, postingScenarioConceptId: ACCT.SCENARIO_ASSET_ACQUISITION }),
    expectedStatus: 401,
  },

  // ---- UC-16-06: objeto de devengo ------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/accrual-objects', name: 'happy: crear objeto y cronograma',
    method: 'post', path: () => '/accounting/accrual-objects',
    body: (c) => ({
      tenantId: c.tenantId,
      objectNumber: `ACR-${c.u}`,
      expenseAccountId: c.vars.acctExpenseAccId,
      accrualAccountId: c.vars.acctPayableAccId,
      totalAmount: '200.00',
      schedule: [
        { fiscalPeriodId: c.vars.acctPeriodOpenId, plannedAmount: '100.00' },
        { fiscalPeriodId: c.vars.acctPeriodLockId, plannedAmount: '100.00' },
      ],
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctAccrualObjectId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accrual-objects', name: 'límite: cronograma != total (422)',
    method: 'post', path: () => '/accounting/accrual-objects',
    body: (c) => ({
      tenantId: c.tenantId,
      objectNumber: `ACR-${c.u}-x`,
      expenseAccountId: c.vars.acctExpenseAccId,
      accrualAccountId: c.vars.acctPayableAccId,
      totalAmount: '999.00',
      schedule: [{ fiscalPeriodId: c.vars.acctPeriodOpenId, plannedAmount: '100.00' }],
    }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accrual-objects', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/accrual-objects', auth: false,
    body: (c) => ({ tenantId: c.tenantId, objectNumber: `ACR-${c.u}-z`, totalAmount: '1.00', schedule: [] }),
    expectedStatus: 401,
  },

  // ---- UC-16-07: correr devengo ---------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/accruals/run', name: 'happy: postear devengo del periodo',
    method: 'post', path: () => '/accounting/accruals/run',
    body: (c) => ({
      accrualObjectId: c.vars.acctAccrualObjectId,
      fiscalPeriodId: c.vars.acctPeriodOpenId,
      practiceId: c.vars.pracPracticeId,
      postingDate: '2026-01-31',
    }),
    expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accruals/run', name: 'límite: sin líneas pendientes (422)',
    method: 'post', path: () => '/accounting/accruals/run',
    body: (c) => ({
      accrualObjectId: c.vars.acctAccrualObjectId,
      fiscalPeriodId: c.vars.acctPeriodOpenId,
      practiceId: c.vars.pracPracticeId,
      postingDate: '2026-01-31',
    }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/accruals/run', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/accruals/run', auth: false,
    body: (c) => ({ accrualObjectId: c.vars.acctAccrualObjectId, fiscalPeriodId: c.vars.acctPeriodOpenId, practiceId: c.vars.pracPracticeId, postingDate: '2026-01-31' }),
    expectedStatus: 401,
  },

  // ---- UC-16-10: capitalizar activo -----------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/assets/capitalize', name: 'happy: alta de activo con asiento',
    method: 'post', path: () => '/accounting/assets/capitalize',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      code: `AST-EQ-${c.u}`,
      name: 'Tomógrafo',
      acquisitionAccountId: c.vars.acctAssetAccId,
      offsetAccountId: c.vars.acctPayableAccId,
      acquisitionCost: '12000.00',
      acquisitionDate: '2026-01-10',
      usefulLifeMonths: 60,
    }),
    expectedStatus: 201, capture: (b, c) => { c.vars.acctAssetId = String(b.id); },
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/assets/capitalize', name: 'límite: validación (sin código)',
    method: 'post', path: () => '/accounting/assets/capitalize',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, name: 'x', acquisitionAccountId: c.vars.acctAssetAccId, offsetAccountId: c.vars.acctPayableAccId, acquisitionCost: '1.00', acquisitionDate: '2026-01-10' }),
    expectedStatus: 400,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/assets/capitalize', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/assets/capitalize', auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, code: `AST-EQ-${c.u}-x`, name: 'x', acquisitionAccountId: c.vars.acctAssetAccId, offsetAccountId: c.vars.acctPayableAccId, acquisitionCost: '1.00', acquisitionDate: '2026-01-10' }),
    expectedStatus: 401,
  },

  // ---- UC-16-11: correr depreciación ----------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/depreciation/run', name: 'happy: depreciar activo del periodo',
    method: 'post', path: () => '/accounting/depreciation/run',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      fiscalPeriodId: c.vars.acctPeriodOpenId,
      depreciationExpenseAccountId: c.vars.acctExpenseAccId,
      accumulatedDepreciationAccountId: c.vars.acctAccumDepAccId,
      postingDate: '2026-01-31',
      assetId: c.vars.acctAssetId,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/depreciation/run', name: 'límite: ya depreciado en el periodo (422)',
    method: 'post', path: () => '/accounting/depreciation/run',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      fiscalPeriodId: c.vars.acctPeriodOpenId,
      depreciationExpenseAccountId: c.vars.acctExpenseAccId,
      accumulatedDepreciationAccountId: c.vars.acctAccumDepAccId,
      postingDate: '2026-01-31',
      assetId: c.vars.acctAssetId,
    }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/depreciation/run', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/depreciation/run', auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, fiscalPeriodId: c.vars.acctPeriodOpenId, depreciationExpenseAccountId: c.vars.acctExpenseAccId, accumulatedDepreciationAccountId: c.vars.acctAccumDepAccId, postingDate: '2026-01-31' }),
    expectedStatus: 401,
  },

  // ---- UC-16-08: partida abierta (subledger requerido) ----------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/open-items', name: 'límite: subledger inexistente (404)',
    method: 'post', path: () => '/accounting/open-items',
    body: (c) => ({ tenantId: c.tenantId, subledgerAccountId: UUID_ABSENT, ledgerEntryId: UUID_ABSENT, documentType: 'INVOICE', originalAmount: '100.00' }),
    expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/open-items', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/open-items', auth: false,
    body: (c) => ({ tenantId: c.tenantId, subledgerAccountId: UUID_ABSENT, ledgerEntryId: UUID_ABSENT, documentType: 'INVOICE', originalAmount: '100.00' }),
    expectedStatus: 401,
  },

  // ---- UC-16-09: clearing (partidas requeridas) -----------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/clearing-documents', name: 'límite: partida inexistente (404)',
    method: 'post', path: () => '/accounting/clearing-documents',
    body: (c) => ({ tenantId: c.tenantId, practiceId: c.vars.pracPracticeId, bankAccountId: c.vars.acctBankAccId, clearingDate: '2026-02-01', items: [{ openItemId: UUID_ABSENT, clearedAmount: '10.00' }] }),
    expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/clearing-documents', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/clearing-documents', auth: false,
    body: (c) => ({ tenantId: c.tenantId, practiceId: c.vars.pracPracticeId, bankAccountId: c.vars.acctBankAccId, clearingDate: '2026-02-01', items: [{ openItemId: UUID_ABSENT, clearedAmount: '10.00' }] }),
    expectedStatus: 401,
  },

  // ---- UC-16-12: pago de pasivo (pasivo requerido) --------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/liabilities/{id}/payments', name: 'límite: componentes != importe (422)',
    method: 'post', path: () => `/accounting/liabilities/${UUID_ABSENT}/payments`,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '100.00', principalComponent: '100.00', interestComponent: '50.00', bankAccountId: c.vars.acctBankAccId, interestExpenseAccountId: c.vars.acctExpenseAccId }),
    expectedStatus: 422,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/liabilities/{id}/payments', name: 'límite: pasivo inexistente (404)',
    method: 'post', path: () => `/accounting/liabilities/${UUID_ABSENT}/payments`,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '100.00', principalComponent: '80.00', interestComponent: '20.00', bankAccountId: c.vars.acctBankAccId, interestExpenseAccountId: c.vars.acctExpenseAccId }),
    expectedStatus: 404,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/liabilities/{id}/payments', name: 'límite: sin auth',
    method: 'post', path: () => `/accounting/liabilities/${UUID_ABSENT}/payments`, auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '100.00', principalComponent: '80.00', interestComponent: '20.00', bankAccountId: c.vars.acctBankAccId, interestExpenseAccountId: c.vars.acctExpenseAccId }),
    expectedStatus: 401,
  },

  // ---- UC-16-14: tipo de cambio ---------------------------------------------
  {
    module: 'Accounting', endpoint: 'POST /accounting/exchange-rates', name: 'happy: registrar tasa (create)',
    method: 'post', path: () => '/accounting/exchange-rates',
    body: () => ({ fromCurrencyConceptId: ACCT.CURRENCY_USD, toCurrencyConceptId: ACCT.CURRENCY_PEN, rate: '3.75', validOn: '2026-01-31' }),
    expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/exchange-rates', name: 'happy: upsert de la misma tasa (update)',
    method: 'post', path: () => '/accounting/exchange-rates',
    body: () => ({ fromCurrencyConceptId: ACCT.CURRENCY_USD, toCurrencyConceptId: ACCT.CURRENCY_PEN, rate: '3.80', validOn: '2026-01-31' }),
    expectedStatus: 201,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/exchange-rates', name: 'límite: validación (sin rate)',
    method: 'post', path: () => '/accounting/exchange-rates',
    body: () => ({ fromCurrencyConceptId: ACCT.CURRENCY_USD, toCurrencyConceptId: ACCT.CURRENCY_PEN, validOn: '2026-01-31' }),
    expectedStatus: 400,
  },
  {
    module: 'Accounting', endpoint: 'POST /accounting/exchange-rates', name: 'límite: sin auth',
    method: 'post', path: () => '/accounting/exchange-rates', auth: false,
    body: () => ({ fromCurrencyConceptId: ACCT.CURRENCY_USD, toCurrencyConceptId: ACCT.CURRENCY_PEN, rate: '3.75', validOn: '2026-01-31' }),
    expectedStatus: 401,
  },
];
