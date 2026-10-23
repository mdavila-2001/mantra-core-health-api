import { Injectable } from '@nestjs/common';

/**
 * C-02 · «Parte del paciente según el seguro». Lo produce `insurance` (carril
 * del paciente); `billing` sólo lo CONSUME para mostrar cuánto paga el
 * paciente y cuánto el seguro.
 *
 * Mientras `insurance` no publique su implementación, el módulo registra el
 * doble declarado {@link NoCoveragePatientShare}: siempre `NO_COVERAGE`, el
 * paciente paga el total. Es un doble, no el colaborador real (regla 65): lo
 * que se verifica contra él queda registrado como pendiente de integración.
 */
export const PATIENT_SHARE_PORT = Symbol('PATIENT_SHARE_PORT');

export type PatientShareContext =
  'CONSULTATION' | 'PHARMACY_ORDER' | 'DIAGNOSTIC_ORDER';

export type PatientShareApprovalStatus =
  | 'COVERED_BY_CONTRACT'
  | 'NEEDS_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'NO_COVERAGE';

export interface PatientShareInput {
  patientProfileId: string;
  serviceConceptId: string | null;
  amountMinor: number;
  currency: string;
  context: PatientShareContext;
  itemRef?: string;
}

export interface PatientShareResult {
  coveragePercent: number;
  patientAmountMinor: number;
  insurerAmountMinor: number;
  approval: {
    status: PatientShareApprovalStatus;
    priorAuthorizationRequestId?: string;
    reason?: string;
  };
}

export interface PatientSharePort {
  compute(input: PatientShareInput): Promise<PatientShareResult>;
}

/** Doble declarado de C-02: sin cobertura, el paciente paga el total. */
@Injectable()
export class NoCoveragePatientShare implements PatientSharePort {
  async compute(input: PatientShareInput): Promise<PatientShareResult> {
    return {
      coveragePercent: 0,
      patientAmountMinor: input.amountMinor,
      insurerAmountMinor: 0,
      approval: {
        status: 'NO_COVERAGE',
        reason:
          'C-02 pendiente: hasta que insurance publique PatientSharePort, el paciente paga el total',
      },
    };
  }
}
