import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareRelationships } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para establecer una relación asistencial. */
export interface CreateCareRelationshipData {
  tenantId: string;
  patientProfileId: string;
  practitionerProfileId: string;
  relationshipTypeConceptId: string;
  purposeConceptId?: string;
  validFrom: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `authz.care_relationships`. */
@Injectable()
export class CareRelationshipsRepository {
  findById(em: EntityManager, id: string): Promise<CareRelationships | null> {
    return em.findOne(CareRelationships, { id });
  }

  /** Relación asistencial ACTIVA concreta (paciente, practicante), evita duplicados. */
  findActive(
    em: EntityManager,
    patientProfileId: string,
    practitionerProfileId: string,
  ): Promise<CareRelationships | null> {
    return em.findOne(CareRelationships, {
      patientProfileId,
      practitionerProfileId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Relaciones ACTIVAS de un practicante sobre un paciente (para el PDP). */
  findActiveForPractitionerPatient(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<CareRelationships[]> {
    return em.find(CareRelationships, {
      practitionerProfileId,
      patientProfileId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Todas las relaciones de un paciente (scoping por tenant). */
  findByPatient(
    em: EntityManager,
    tenantId: string,
    patientProfileId: string,
  ): Promise<CareRelationships[]> {
    return em.find(
      CareRelationships,
      { tenantId, patientProfileId },
      { orderBy: { validFrom: 'DESC' } },
    );
  }

  create(
    em: EntityManager,
    data: CreateCareRelationshipData,
  ): CareRelationships {
    return em.create(
      CareRelationships,
      {
        tenantId: data.tenantId,
        patientProfileId: data.patientProfileId,
        practitionerProfileId: data.practitionerProfileId,
        relationshipTypeConceptId: data.relationshipTypeConceptId,
        purposeConceptId: data.purposeConceptId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        establishedByUserId: data.actorUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
