import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DelegatedAccessAuditLog,
  InsuranceDecisionAccessLog,
  IdentityVerificationAccessLog,
  PharmacyInventoryAccessLog,
} from '../entities';

/** Acceso delegado / de tercero (UC-10-12, canal DELEGATED). */
export interface RecordDelegatedAccessData {
  delegateUserId: string;
  delegatingPractitionerProfileId: string;
  actionConceptId: string;
  outcomeConceptId: string;
  delegatedAssignmentId?: string;
  patientProfileId?: string;
  resourceTypeConceptId?: string;
  resourceId?: string;
}

/** Acceso de aseguradora (UC-10-12, canal INSURANCE). */
export interface RecordInsuranceAccessData {
  insuranceCarrierId: string;
  actorUserId: string;
  patientProfileId: string;
  actionConceptId: string;
  purposeOfUseConceptId: string;
  outcomeConceptId: string;
  claimId?: string;
  authorizationRequestId?: string;
}

/** Acceso de verificación de identidad (UC-10-12, canal IDENTITY). */
export interface RecordIdentityAccessData {
  verificationCaseId: string;
  actorUserId: string;
  actionConceptId: string;
  purposeOfUseConceptId: string;
  outcomeConceptId: string;
  evidenceTypeConceptId?: string;
  dataDisclosedValueSetId?: string;
}

/** Acceso a inventario de farmacia (UC-10-12, canal PHARMACY). */
export interface RecordPharmacyAccessData {
  pharmacyId: string;
  actorUserId: string;
  actionConceptId: string;
  targetTypeConceptId?: string;
  targetId?: string;
  purposeOfUseConceptId?: string;
  outcomeConceptId?: string;
  correlationId?: string;
}

/**
 * Acceso a los cuatro logs de acceso de tercero gobernado (WORM append-only,
 * particionados por `occurred_at`). Cada método encola su fila sin flush; el
 * servicio decide el canal según el DTO.
 */
@Injectable()
export class ThirdPartyAccessRepository {
  recordDelegated(
    em: EntityManager,
    data: RecordDelegatedAccessData,
  ): DelegatedAccessAuditLog {
    return em.create(
      DelegatedAccessAuditLog,
      {
        delegateUserId: data.delegateUserId,
        delegatingPractitionerProfileId: data.delegatingPractitionerProfileId,
        delegatedAssignmentId: data.delegatedAssignmentId,
        patientProfileId: data.patientProfileId,
        resourceTypeConceptId: data.resourceTypeConceptId,
        resourceId: data.resourceId,
        actionConceptId: data.actionConceptId,
        outcomeConceptId: data.outcomeConceptId,
        occurredAt: new Date(),
      },
      { partial: true },
    );
  }

  recordInsurance(
    em: EntityManager,
    data: RecordInsuranceAccessData,
  ): InsuranceDecisionAccessLog {
    return em.create(
      InsuranceDecisionAccessLog,
      {
        insuranceCarrierId: data.insuranceCarrierId,
        actorUserId: data.actorUserId,
        patientProfileId: data.patientProfileId,
        claimId: data.claimId,
        authorizationRequestId: data.authorizationRequestId,
        actionConceptId: data.actionConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        outcomeConceptId: data.outcomeConceptId,
        occurredAt: new Date(),
      },
      { partial: true },
    );
  }

  recordIdentity(
    em: EntityManager,
    data: RecordIdentityAccessData,
  ): IdentityVerificationAccessLog {
    return em.create(
      IdentityVerificationAccessLog,
      {
        verificationCaseId: data.verificationCaseId,
        actorUserId: data.actorUserId,
        actionConceptId: data.actionConceptId,
        evidenceTypeConceptId: data.evidenceTypeConceptId,
        dataDisclosedValueSetId: data.dataDisclosedValueSetId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        outcomeConceptId: data.outcomeConceptId,
        occurredAt: new Date(),
      },
      { partial: true },
    );
  }

  recordPharmacy(
    em: EntityManager,
    data: RecordPharmacyAccessData,
  ): PharmacyInventoryAccessLog {
    return em.create(
      PharmacyInventoryAccessLog,
      {
        pharmacyId: data.pharmacyId,
        actorUserId: data.actorUserId,
        actionConceptId: data.actionConceptId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        outcomeConceptId: data.outcomeConceptId,
        occurredAt: new Date(),
        correlationId: data.correlationId,
      },
      { partial: true },
    );
  }
}
