import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';

/**
 * Smoke del módulo Billing (17). Encadena recursos vía `ctx.vars`:
 *  - emite facturas al paciente sembrado (`ctx.vars.patientProfileId`) usando
 *    `ctx.tenantId` como práctica/tenant (columnas cross-schema sin FK forzada);
 *  - aplica un cobro, lo concilia, contabiliza la factura, la incluye en un
 *    estado de cuenta, la usa como cuota origen de un plan de pagos, la vincula a
 *    un reembolso y la incluye en una corrida de morosidad.
 *
 * Notas de cobertura:
 *  - UC-17-04 (bills) y UC-17-05 (payments-made) exigen un `vendor`/`bill` reales
 *    y no hay endpoint para sembrar vendors; se cubren con 401 y 404 (vendor/bill
 *    inexistente). El happy-path requiere un vendor sembrado por el orquestador.
 *  - Se omite `taxCodeId` en las líneas: `invoice_lines.tax_code_id` tiene FK real
 *    a `billing.tax_codes` (sin filas sembradas).
 */
export const BILLING_SMOKE: SmokeCase[] = [
  // ---------------------------------------------------------------------------
  // UC-17-01: emitir factura desde cargos del encuentro
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices:issue-from-encounter',
    name: 'happy: factura con dos líneas (total 200)',
    method: 'post',
    path: () => '/billing/invoices:issue-from-encounter',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      tenantId: c.tenantId,
      lines: [
        { description: 'Consulta', quantity: '1', unitPrice: '100.00' },
        { description: 'Examen', quantity: '1', unitPrice: '100.00' },
      ],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.billingInvoiceId = String(b.id);
    },
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices:issue-from-encounter',
    name: 'happy: factura para plan de pagos (saldo 100)',
    method: 'post',
    path: () => '/billing/invoices:issue-from-encounter',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      lines: [{ description: 'Procedimiento', quantity: '1', unitPrice: '100.00' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.billingPlanInvoiceId = String(b.id);
    },
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices:issue-from-encounter',
    name: 'happy: factura para morosidad',
    method: 'post',
    path: () => '/billing/invoices:issue-from-encounter',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      lines: [{ description: 'Servicio', quantity: '1', unitPrice: '80.00' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.billingDunningInvoiceId = String(b.id);
    },
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices:issue-from-encounter',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/invoices:issue-from-encounter',
    auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, patientProfileId: c.vars.patientProfileId, lines: [{ quantity: '1', unitPrice: '1' }] }),
    expectedStatus: 401,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices:issue-from-encounter',
    name: 'límite: sin líneas -> 400',
    method: 'post',
    path: () => '/billing/invoices:issue-from-encounter',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, patientProfileId: c.vars.patientProfileId, lines: [] }),
    expectedStatus: 400,
  },

  // ---------------------------------------------------------------------------
  // UC-17-02: aplicar pago recibido con asignación multi-factura
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/payments-received:apply',
    name: 'happy: cobra 60 sobre la factura',
    method: 'post',
    path: () => '/billing/payments-received:apply',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      amount: '60.00',
      allocations: [{ invoiceId: c.vars.billingInvoiceId, allocatedAmount: '60.00' }],
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.billingPaymentReceivedId = String(b.id);
    },
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/payments-received:apply',
    name: 'límite: asignación excede monto -> 422',
    method: 'post',
    path: () => '/billing/payments-received:apply',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      amount: '10.00',
      allocations: [{ invoiceId: c.vars.billingInvoiceId, allocatedAmount: '50.00' }],
    }),
    expectedStatus: 422,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/payments-received:apply',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/payments-received:apply',
    auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '1.00', allocations: [{ invoiceId: c.vars.billingInvoiceId, allocatedAmount: '1.00' }] }),
    expectedStatus: 401,
  },

  // ---------------------------------------------------------------------------
  // UC-17-06: contabilizar documento (posting)
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/documents/{id}:post-to-ledger',
    name: 'happy: contabiliza la factura',
    method: 'post',
    path: (c) => `/billing/documents/${c.vars.billingInvoiceId}:post-to-ledger`,
    body: () => ({ documentType: 'INVOICE', transactionId: UUID_ABSENT }),
    expectedStatus: 200,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/documents/{id}:post-to-ledger',
    name: 'límite: doble contabilización -> 409',
    method: 'post',
    path: (c) => `/billing/documents/${c.vars.billingInvoiceId}:post-to-ledger`,
    body: () => ({ documentType: 'INVOICE', transactionId: UUID_ABSENT }),
    expectedStatus: 409,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/documents/{id}:post-to-ledger',
    name: 'límite: documento inexistente -> 404',
    method: 'post',
    path: () => `/billing/documents/${UUID_ABSENT}:post-to-ledger`,
    body: () => ({ documentType: 'INVOICE', transactionId: UUID_ABSENT }),
    expectedStatus: 404,
  },

  // ---------------------------------------------------------------------------
  // UC-17-07: conciliar pago vía documento de compensación
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/reconciliation:clear',
    name: 'happy: concilia el pago recibido',
    method: 'post',
    path: () => '/billing/reconciliation:clear',
    body: (c) => ({ clearingDocumentId: UUID_ABSENT, paymentReceivedIds: [c.vars.billingPaymentReceivedId] }),
    expectedStatus: 200,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/reconciliation:clear',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/reconciliation:clear',
    auth: false,
    body: (c) => ({ clearingDocumentId: UUID_ABSENT, paymentReceivedIds: [c.vars.billingPaymentReceivedId] }),
    expectedStatus: 401,
  },

  // ---------------------------------------------------------------------------
  // UC-17-08: vincular reembolso de reclamo de seguro
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/reimbursements:link',
    name: 'happy: vincula reembolso a la factura',
    method: 'post',
    path: () => '/billing/reimbursements:link',
    body: (c) => ({ claimId: UUID_ABSENT, invoiceId: c.vars.billingInvoiceId, amount: '20.00', tenantId: c.tenantId }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/reimbursements:link',
    name: 'límite: factura inexistente -> 404',
    method: 'post',
    path: () => '/billing/reimbursements:link',
    body: (c) => ({ claimId: c.tenantId, invoiceId: UUID_ABSENT, amount: '10.00' }),
    expectedStatus: 404,
  },

  // ---------------------------------------------------------------------------
  // UC-17-09: generar estado de cuenta del paciente
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/patient-statements:generate',
    name: 'happy: genera estado de cuenta del mes',
    method: 'post',
    path: () => '/billing/patient-statements:generate',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      tenantId: c.tenantId,
    }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/patient-statements:generate',
    name: 'límite: estado duplicado del periodo -> 409',
    method: 'post',
    path: () => '/billing/patient-statements:generate',
    body: (c) => ({
      practiceId: c.vars.pracPracticeId,
      patientProfileId: c.vars.patientProfileId,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    }),
    expectedStatus: 409,
  },

  // ---------------------------------------------------------------------------
  // UC-17-11: configurar plan de pagos del paciente
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/payment-plans',
    name: 'happy: plan de dos cuotas (50 + 50)',
    method: 'post',
    path: () => '/billing/payment-plans',
    body: (c) => ({
      sourceInvoiceId: c.vars.billingPlanInvoiceId,
      tenantId: c.tenantId,
      installments: [
        { dueDate: '2026-08-01', amount: '50.00' },
        { dueDate: '2026-09-01', amount: '50.00' },
      ],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/payment-plans',
    name: 'límite: cuotas no suman el saldo -> 422',
    method: 'post',
    path: () => '/billing/payment-plans',
    body: (c) => ({
      sourceInvoiceId: c.vars.billingDunningInvoiceId,
      installments: [{ dueDate: '2026-08-01', amount: '10.00' }],
    }),
    expectedStatus: 422,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/payment-plans',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/payment-plans',
    auth: false,
    body: (c) => ({ sourceInvoiceId: c.vars.billingPlanInvoiceId, installments: [{ dueDate: '2026-08-01', amount: '1.00' }] }),
    expectedStatus: 401,
  },

  // ---------------------------------------------------------------------------
  // UC-17-10: ejecutar ciclo de morosidad (dunning)
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/dunning-runs:execute',
    name: 'happy: corrida con una factura morosa',
    method: 'post',
    path: () => '/billing/dunning-runs:execute',
    body: (c) => ({
      tenantId: c.tenantId,
      runNumber: `DUN-${c.u}`,
      items: [{ invoiceId: c.vars.billingDunningInvoiceId, outstandingAmount: '80.00', daysOverdue: 30 }],
    }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/dunning-runs:execute',
    name: 'límite: número de corrida duplicado -> 409',
    method: 'post',
    path: () => '/billing/dunning-runs:execute',
    body: (c) => ({
      tenantId: c.tenantId,
      runNumber: `DUN-${c.u}`,
      items: [{ invoiceId: c.vars.billingDunningInvoiceId }],
    }),
    expectedStatus: 409,
  },

  // ---------------------------------------------------------------------------
  // UC-17-12: calcular snapshot de KPI financiero y aging
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/kpi-snapshots:compute',
    name: 'happy: registra KPI DSO',
    method: 'post',
    path: () => '/billing/kpi-snapshots:compute',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, kpiCode: `DSO-${c.u}`, valueNumeric: '42.50' }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/kpi-snapshots:compute',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/kpi-snapshots:compute',
    auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, kpiCode: 'DSO', valueNumeric: '1.0' }),
    expectedStatus: 401,
  },

  // ---------------------------------------------------------------------------
  // UC-17-03: nota de crédito
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices/{id}:credit-note',
    name: 'happy: nota de crédito parcial',
    method: 'post',
    path: (c) => `/billing/invoices/${c.vars.billingInvoiceId}:credit-note`,
    body: (c) => ({ reason: 'Ajuste', tenantId: c.tenantId, lines: [{ description: 'Reverso', quantity: '1', unitPrice: '20.00' }] }),
    expectedStatus: 201,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/invoices/{id}:credit-note',
    name: 'límite: factura inexistente -> 404',
    method: 'post',
    path: () => `/billing/invoices/${UUID_ABSENT}:credit-note`,
    body: () => ({ reason: 'x', lines: [{ quantity: '1', unitPrice: '1.00' }] }),
    expectedStatus: 404,
  },

  // ---------------------------------------------------------------------------
  // UC-17-04: registrar factura de proveedor (requiere vendor sembrado)
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/bills',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/bills',
    auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, vendorId: UUID_ABSENT, billNumber: 'B-1', lines: [{ quantity: '1', unitPrice: '1.00' }] }),
    expectedStatus: 401,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/bills',
    name: 'límite: vendor inexistente -> 404 (happy-path exige vendor sembrado)',
    method: 'post',
    path: () => '/billing/bills',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, vendorId: UUID_ABSENT, billNumber: `B-${c.u}`, lines: [{ quantity: '1', unitPrice: '1.00' }] }),
    expectedStatus: 404,
  },

  // ---------------------------------------------------------------------------
  // UC-17-05: pago a proveedor (requiere bill sembrado)
  // ---------------------------------------------------------------------------
  {
    module: 'Billing',
    endpoint: 'POST /billing/payments-made:execute',
    name: 'límite: sin auth -> 401',
    method: 'post',
    path: () => '/billing/payments-made:execute',
    auth: false,
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '1.00', allocations: [{ billId: UUID_ABSENT, allocatedAmount: '1.00' }] }),
    expectedStatus: 401,
  },
  {
    module: 'Billing',
    endpoint: 'POST /billing/payments-made:execute',
    name: 'límite: bill inexistente -> 404 (happy-path exige bill sembrado)',
    method: 'post',
    path: () => '/billing/payments-made:execute',
    body: (c) => ({ practiceId: c.vars.pracPracticeId, amount: '10.00', allocations: [{ billId: UUID_ABSENT, allocatedAmount: '10.00' }] }),
    expectedStatus: 404,
  },
];
