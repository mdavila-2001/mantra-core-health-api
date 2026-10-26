import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AUTHZ } from '../../../authz/authz.concepts';
import { CareRelationshipsRepository } from '../../../authz/repositories';
import type { PatientCareRelationshipPort } from '../../application/ports/patient-care-relationship.port';

/**
 * Adapta `authz.care_relationships` al puerto de `insurance`. Habilitan
 * cobrar la relación sin acotar y la acotada a `PAYMENT` o a `TREATMENT` (la
 * forma que nace del propio circuito de atención); una acotada a operaciones o
 * emergencia no lo habilita.
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
      purposeConceptIds: [AUTHZ.PURPOSE_PAYMENT, AUTHZ.PURPOSE_TREATMENT],
    });
  }
}
