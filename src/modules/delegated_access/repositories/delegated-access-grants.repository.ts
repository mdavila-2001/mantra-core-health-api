import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedAccessGrants } from '../entities';
import { createdBy } from '../../../common';

/** Datos para emitir un grant de acceso delegado. */
export interface CreateGrantData {
  /**
   * Identificador asociado a practitioner delegate assignment.
   */
  practitionerDelegateAssignmentId: string;
  /**
   * Identificador asociado a grant type concept.
   */
  grantTypeConceptId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a approved by user.
   */
  approvedByUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.delegated_access_grants`. */
@Injectable()
export class DelegatedAccessGrantsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DelegatedAccessGrants | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DelegatedAccessGrants | null> {
    return em.findOne(DelegatedAccessGrants, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DelegatedAccessGrants`.
   */
  create(em: EntityManager, data: CreateGrantData): DelegatedAccessGrants {
    return em.create(
      DelegatedAccessGrants,
      {
        practitionerDelegateAssignmentId: data.practitionerDelegateAssignmentId,
        grantTypeConceptId: data.grantTypeConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        approvedByUserId: data.approvedByUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Grant ACTIVO que empareja propósito + alcance (evaluación de actor efectivo). */
  findActiveMatch(
    em: EntityManager,
    activeStatusConceptId: string,
    practitionerDelegateAssignmentId: string,
    purposeOfUseConceptId: string,
    patientProfileId?: string,
    encounterId?: string,
    resourceTypeConceptId?: string,
  ): Promise<DelegatedAccessGrants | null> {
    const where: Record<string, unknown> = {
      statusConceptId: activeStatusConceptId,
      practitionerDelegateAssignmentId,
      purposeOfUseConceptId,
    };
    if (patientProfileId !== undefined)
      where.patientProfileId = patientProfileId;
    if (encounterId !== undefined) where.encounterId = encounterId;
    if (resourceTypeConceptId !== undefined)
      where.resourceTypeConceptId = resourceTypeConceptId;
    return em.findOne(DelegatedAccessGrants, where);
  }

  /** Revoca en bloque los grants ACTIVOS de una delegación (cascada al revocar). */
  revokeActiveByAssignment(
    em: EntityManager,
    practitionerDelegateAssignmentId: string,
    activeStatusConceptId: string,
    revokedStatusConceptId: string,
    now: Date,
    actorUserId?: string,
  ): Promise<number> {
    return em.nativeUpdate(
      DelegatedAccessGrants,
      {
        practitionerDelegateAssignmentId,
        statusConceptId: activeStatusConceptId,
      },
      {
        statusConceptId: revokedStatusConceptId,
        validTo: now,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    );
  }

  /** Grants ACTIVOS ya vencidos (barrido de expiración). */
  findOverdueActive(
    em: EntityManager,
    now: Date,
    activeStatusConceptId: string,
  ): Promise<DelegatedAccessGrants[]> {
    return em.find(DelegatedAccessGrants, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lt: now },
    });
  }
}
