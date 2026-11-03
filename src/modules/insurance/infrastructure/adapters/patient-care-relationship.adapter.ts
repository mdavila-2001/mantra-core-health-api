import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AUTHZ } from '../../../authz/authz.concepts';
import { CareRelationshipsRepository } from '../../../authz/repositories';
import type { PatientCareRelationshipPort } from '../../application/ports/patient-care-relationship.port';

/**
 * Adapta `authz.care_relationships` al puerto de `insurance`. Cobrar es un acto
 * con propósito `PAYMENT`: una relación acotada a otro propósito (tratamiento,
 * operaciones, emergencia) no lo habilita, igual que en el PDP.
 */
@Injectable()
export class PatientCareRelationshipAdapter implements PatientCareRelationshipPort {
  constructor(private readonly relationships: CareRelationshipsRepository) {}

  hasCareRelationshipForPayment(
    em: EntityManager,
    query: { patientProfileId: string; tenantId: string; at: Date },
  ): Promise<boolean> {
    return this.relationships.hasActiveInTenantAt(em, {
      ...query,
      purposeConceptId: AUTHZ.PURPOSE_PAYMENT,
    });
  }
}
