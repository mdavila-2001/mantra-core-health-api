/**
 * Eventos de dominio de la protección al paciente (carril 16, REQ-16-034).
 *
 * `audit.audit_log` no tiene columnas de motivo ni de importes, así que lo que
 * la bitácora `@Audited` no puede guardar viaja en estos eventos del outbox:
 * quién, qué línea, qué motivo tipificado y qué importes. Los payloads llevan
 * **identificadores e importes**, nunca texto clínico ni datos de la persona.
 *
 * El prefijo es el mismo del único evento previo del módulo,
 * `InsuranceClaimDecided`.
 */
export const PATIENT_PROTECTION_EVENT = {
  /** Se facturó al paciente su parte (o el total, con su aceptación). */
  PATIENT_INVOICE_ISSUED: 'InsuranceClaimPatientInvoiceIssued',
  /** Se rechazó una factura al paciente: monto distinto, doble cobro, sin aceptación… */
  PATIENT_INVOICE_REJECTED: 'InsuranceClaimPatientInvoiceRejected',
  /** El paciente objetó el cobro: queda en pausa. */
  PATIENT_CHARGE_OBJECTED: 'InsuranceClaimPatientChargeObjected',
  /** Se rechazó una objeción del paciente. */
  PATIENT_OBJECTION_REJECTED: 'InsuranceClaimPatientObjectionRejected',
} as const;

/** `aggregate_type` de los eventos del reclamo: el mismo de `InsuranceClaimDecided`. */
export const CLAIM_AGGREGATE_TYPE = 'insurance.insurance_claims';
