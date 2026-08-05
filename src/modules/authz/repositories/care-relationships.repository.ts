import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareRelationships } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos para establecer una relación asistencial. */
export interface CreateCareRelationshipData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a practitioner profile.
   */
  practitionerProfileId: string;
  /**
   * Identificador asociado a relationship type concept.
   */
  relationshipTypeConceptId: string;
  /**
   * Identificador asociado a purpose concept.
   */
  purposeConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.care_relationships`. */
@Injectable()
export class CareRelationshipsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareRelationships | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareRelationships`.
   */
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
