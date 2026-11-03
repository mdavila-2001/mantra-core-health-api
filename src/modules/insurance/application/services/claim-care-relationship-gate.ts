import { Inject, Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../../common';
import {
  PATIENT_CARE_RELATIONSHIP_PORT,
  type PatientCareRelationshipPort,
} from '../ports/patient-care-relationship.port';

/**
 * Puerta de pertenencia del cobro con seguro (carril 16, REQ-16-035): el
 * paciente de la cobertura tiene que tener una relación asistencial vigente con
 * la organización que cobra.
 *
 * El modelo no guarda el tenant del paciente y aseguradora y prestador son
 * organizaciones distintas, así que sin esta puerta cualquier cuenta de cobro
 * podría cobrar a la aseguradora por un paciente que nunca atendió. El único
 * vínculo paciente-organización es `authz.care_relationships`, y desde
 * AUTHZ-M01 sólo nace sobre pacientes con huella en la organización o por
 * solicitud que el propio paciente acepta.
 *
 * La falta de relación responde igual que una cobertura inexistente (404, mismo
 * mensaje, sin `details`): quien cobra no puede usar el cobro para descubrir qué
 * coberturas ajenas existen. Por eso la puerta corre **antes** de cualquier
 * comprobación que hable de la cobertura (aseguradora, plan).
 */
@Injectable()
export class ClaimCareRelationshipGate {
  constructor(
    @Inject(PATIENT_CARE_RELATIONSHIP_PORT)
    private readonly relationships: PatientCareRelationshipPort,
  ) {}

  /**
   * @param em - Contexto de persistencia o transacción activa.
   * @param coverage - Cobertura ya leída; el paciente sale de ella, nunca del cuerpo.
   * @param tenantId - Organización activa, que es la que cobra.
   * @param at - Instante del servicio contra el que se mide la vigencia.
   * @throws ResourceNotFoundException 404 uniforme si no hay relación vigente.
   */
  async assertCareRelationship(
    em: EntityManager,
    coverage: { patientProfileId: string },
    tenantId: string,
    at: Date,
  ): Promise<void> {
    const related = await this.relationships.hasCareRelationshipForPayment(em, {
      patientProfileId: coverage.patientProfileId,
      tenantId,
      at,
    });
    if (!related) throw coverageNotFound();
  }
}

/** El 404 de una cobertura que no existe o que no es de esta organización. */
export function coverageNotFound(): ResourceNotFoundException {
  return new ResourceNotFoundException('Cobertura no encontrada');
}
