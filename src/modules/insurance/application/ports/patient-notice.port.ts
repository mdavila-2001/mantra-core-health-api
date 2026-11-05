/** Aviso in-app dirigido a un paciente por un cobro de su seguro. */
export interface PatientNoticeInput {
  /** Perfil del paciente: el adaptador resuelve su cuenta de usuario. */
  readonly patientProfileId: string;
  readonly subject: string;
  readonly bodyText: string;
  /** A dónde lleva el aviso al abrirlo: el reclamo al que pertenece el cobro. */
  readonly destination: {
    readonly type: 'INSURANCE_CLAIM';
    readonly id: string;
  };
  /** Evita avisos repetidos del mismo hecho. */
  readonly debounceKey: string;
  readonly tenantId?: string;
  /** Desglose para quien abre el aviso; ids e importes, nunca texto clínico. */
  readonly payloadJson?: Record<string, unknown>;
  readonly actorUserId: string;
}

/**
 * Aviso al paciente (carril 16, REQ-16-032).
 *
 * **No lanza nunca**: una factura que ya se guardó no puede deshacerse porque
 * el aviso falló. Si el paciente no tiene cuenta activa, el aviso se omite.
 * Se invoca después de confirmar la transacción del caso de uso.
 */
export interface PatientNoticePort {
  notifyPatient(input: PatientNoticeInput): Promise<void>;
}

export const PATIENT_NOTICE_PORT = Symbol('INSURANCE_PATIENT_NOTICE_PORT');
