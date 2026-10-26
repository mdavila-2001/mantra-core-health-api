import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Pregunta a `authz` si el paciente tiene una relación asistencial vigente con
 * la organización que cobra (carril 16, REQ-16-035). `insurance` sólo conoce la
 * pregunta; qué cuenta como relación vigente lo decide `authz`.
 */
export interface PatientCareRelationshipPort {
  /**
   * @param em - Contexto de persistencia o transacción activa.
   * @param query.patientProfileId - Paciente de la cobertura.
   * @param query.tenantId - Organización que cobra.
   * @param query.at - Instante contra el que se mide la vigencia.
   * @returns `true` si hay una relación asistencial vigente, sin acotar o acotada al pago o al tratamiento.
   */
  hasCareRelationshipForPayment(
    em: EntityManager,
    query: { patientProfileId: string; tenantId: string; at: Date },
  ): Promise<boolean>;
}

export const PATIENT_CARE_RELATIONSHIP_PORT = Symbol(
  'INSURANCE_PATIENT_CARE_RELATIONSHIP_PORT',
);
