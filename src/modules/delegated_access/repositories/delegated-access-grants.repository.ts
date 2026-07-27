import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedAccessGrants } from '../entities';
import { createdBy } from '../../../common';

/** Datos para emitir un grant de acceso delegado. */
export interface CreateGrantData {
  practitionerDelegateAssignmentId: string;
  grantTypeConceptId: string;
  purposeOfUseConceptId: string;
  patientProfileId?: string;
  encounterId?: string;
  resourceTypeConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  approvedByUserId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.delegated_access_grants`. */
@Injectable()
export class DelegatedAccessGrantsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DelegatedAccessGrants | null> {
    return em.findOne(DelegatedAccessGrants, { id });
  }

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
