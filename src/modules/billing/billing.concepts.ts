import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del módulo Billing (17). El prefijo `billing` espacia las claves para
 * que sus UUID deterministas no colisionen con los de otros módulos. Se declaran
 * únicamente los conceptos que los endpoints necesitan para poblar cada columna
 * `*_concept_id` NOT NULL (estados de ciclo de vida, métodos de pago, tipos de
 * vínculo entre documentos).
 *
 * `BILL` es el mapa `nombre -> UUID` que consumen servicios/repos; el array
 * `BILLING_CONCEPT_SEEDS` lo consume el agregador central del seed (no se toca
 * aquí).
 */
export const { seeds: BILLING_CONCEPT_SEEDS, ids: BILL } = defineModuleConcepts('billing', {
  // --- Ciclo de vida de facturas (billing.invoices.status_concept_id) ---
  INVOICE_DRAFT: { code: 'INV_DRAFT', display: 'Invoice draft' },
  INVOICE_ISSUED: { code: 'INV_ISSUED', display: 'Invoice issued' },
  INVOICE_PARTIALLY_PAID: { code: 'INV_PARTIALLY_PAID', display: 'Invoice partially paid' },
  INVOICE_PAID: { code: 'INV_PAID', display: 'Invoice paid' },
  INVOICE_CREDIT_NOTE: { code: 'INV_CREDIT_NOTE', display: 'Credit note' },
  INVOICE_ADJUSTED: { code: 'INV_ADJUSTED', display: 'Invoice adjusted' },
  INVOICE_IN_COLLECTION: { code: 'INV_IN_COLLECTION', display: 'Invoice in collection' },
  INVOICE_PAYMENT_PLAN: { code: 'INV_PAYMENT_PLAN', display: 'Invoice under payment plan' },

  // --- Ciclo de vida de facturas de proveedor (billing.bills.status_concept_id) ---
  BILL_RECEIVED: { code: 'BILL_RECEIVED', display: 'Bill received' },
  BILL_APPROVED: { code: 'BILL_APPROVED', display: 'Bill approved' },
  BILL_PARTIALLY_PAID: { code: 'BILL_PARTIALLY_PAID', display: 'Bill partially paid' },
  BILL_PAID: { code: 'BILL_PAID', display: 'Bill paid' },

  // --- Estados de pago (payments_received/made.status_concept_id) ---
  PAYMENT_CLEARED: { code: 'PAY_CLEARED', display: 'Payment cleared' },
  PAYMENT_EXECUTED: { code: 'PAY_EXECUTED', display: 'Payment executed' },
  PAYMENT_RECONCILED: { code: 'PAY_RECONCILED', display: 'Payment reconciled' },

  // --- Métodos de pago (payments_received/made.method_concept_id) ---
  METHOD_CASH: { code: 'PM_CASH', display: 'Cash' },
  METHOD_CARD: { code: 'PM_CARD', display: 'Card' },
  METHOD_TRANSFER: { code: 'PM_TRANSFER', display: 'Bank transfer' },

  // --- Tipos de vínculo entre documentos (billing_document_links.relation_type_concept_id) ---
  REL_ENCOUNTER_OF: { code: 'REL_ENCOUNTER_OF', display: 'Invoice of encounter' },
  REL_CREDIT_OF: { code: 'REL_CREDIT_OF', display: 'Credit of invoice' },
  REL_REIMBURSEMENT_OF: { code: 'REL_REIMBURSEMENT_OF', display: 'Reimbursement of invoice' },
  REL_STATEMENT_INCLUDES: { code: 'REL_STATEMENT_INCLUDES', display: 'Statement includes invoice' },
  REL_INSTALLMENT_OF: { code: 'REL_INSTALLMENT_OF', display: 'Installment of invoice' },

  // --- Reembolsos de seguro (billing.reimbursements.status_concept_id) ---
  REIMBURSEMENT_POSTED: { code: 'REIMB_POSTED', display: 'Reimbursement posted' },

  // --- Morosidad (billing.dunning_runs/items) ---
  DUNNING_RUN_RUNNING: { code: 'DUN_RUN_RUNNING', display: 'Dunning run running' },
  DUNNING_RUN_COMPLETED: { code: 'DUN_RUN_COMPLETED', display: 'Dunning run completed' },
  DUNNING_ITEM_NOTIFIED: { code: 'DUN_ITEM_NOTIFIED', display: 'Dunning notice issued' },
  DUNNING_LEVEL_1: { code: 'DUN_LEVEL_1', display: 'Dunning level 1' },
});
