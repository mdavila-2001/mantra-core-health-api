import type { PatientShareResult } from './patient-share.port';

/** Cómo dice el paciente que pagó (C-01). */
export type PaymentProofMethod = 'QR_TRANSFER' | 'CASH';

/** Ciclo de vida del comprobante: nace pendiente, el médico lo acepta o lo rechaza. */
export type PaymentProofStatus = 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';

/** Estado del cargo, DERIVADO del comprobante aceptado o de la cuenta saldada. */
export type ChargePaymentStatus = 'PENDING' | 'PAID' | 'NOT_PRICED';

export interface PaymentProofView {
  id: string;
  chargeId: string;
  patientProfileId: string;
  method: PaymentProofMethod;
  fileId: string | null;
  amountMinor: number;
  currency: string;
  status: PaymentProofStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
}

export interface PaymentSiteView {
  id: string;
  name: string;
  /** Imagen del QR bancario estático de la sede; `null` si no lo cargaron. */
  bankQrFileId: string | null;
}

/** `GET /billing/me/charges/:chargeId/payment-context`. */
export interface PaymentContextView {
  chargeId: string;
  amountMinor: number;
  currency: string;
  status: ChargePaymentStatus;
  patientShare: PatientShareResult;
  site: PaymentSiteView | null;
  proofs: PaymentProofView[];
  latestProof: PaymentProofView | null;
}

/** Una fila de la tabla de pagos del prestador (Q-P3). */
export interface ProviderPaymentRow {
  chargeId: string;
  startAt: string;
  patientProfileId: string;
  patientName: string;
  amountMinor: number;
  currency: string;
  patientAmountMinor: number;
  insurerAmountMinor: number;
  coverageStatus: PatientShareResult['approval']['status'];
  status: ChargePaymentStatus;
  proof: PaymentProofView | null;
  invoiced: boolean;
}

export interface ProviderPaymentTablePage {
  items: ProviderPaymentRow[];
  nextCursor: string | null;
  totals: {
    sessions: number;
    amountMinor: number;
    paidMinor: number;
    pendingMinor: number;
  };
}
