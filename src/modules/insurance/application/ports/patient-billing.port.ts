import type { EntityManager } from '@mikro-orm/postgresql';

/** Línea de factura ya vinculada a una línea del reclamo. */
export interface LinkedInvoiceLine {
  readonly invoiceId: string;
  readonly invoiceLineId: string;
}

/** Factura al paciente que el servidor arma a partir del cálculo del reclamo. */
export interface IssuePatientInvoiceInput {
  readonly practiceId: string;
  readonly patientProfileId: string;
  readonly currencyConceptId?: string | null;
  /** Línea del reclamo que respalda la factura: el vínculo 1 a 1 (REQ-16-028). */
  readonly insuranceClaimLineId: string;
  readonly description: string;
  /** Importe decimal con dos posiciones: la parte del paciente ya calculada. */
  readonly amount: string;
  readonly actorUserId: string;
}

export interface IssuedPatientInvoice {
  readonly invoiceId: string;
  readonly invoiceLineId: string;
  readonly invoiceNumber: string;
}

/**
 * Lo que `insurance` necesita de la facturación al paciente (carril 16,
 * REQ-16-028 y 029).
 *
 * Es un puerto porque la factura vive en `billing` y sólo `infrastructure/`
 * puede hablar con otro contexto. Ambas operaciones corren en la transacción
 * del caso de uso, que ya tiene el reclamo bloqueado.
 */
export interface PatientBillingPort {
  /** La línea de factura que ya respalda esta línea del reclamo, si la hay. */
  findInvoiceLineByClaimLine(
    tx: EntityManager,
    claimLineId: string,
  ): Promise<LinkedInvoiceLine | null>;

  /**
   * Crea la factura (cabecera y una línea) vinculada a la línea del reclamo.
   * No hace el flush final: lo hace el caso de uso, junto con el evento.
   */
  issuePatientInvoice(
    tx: EntityManager,
    input: IssuePatientInvoiceInput,
  ): Promise<IssuedPatientInvoice>;
}

export const PATIENT_BILLING_PORT = Symbol('INSURANCE_PATIENT_BILLING_PORT');
