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
  /**
   * Identificador asociado a delegate user.
   */
  delegateUserId: string;
  /**
   * Identificador asociado a delegating practitioner profile.
   */
  delegatingPractitionerProfileId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a delegated assignment.
   */
  delegatedAssignmentId?: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId?: string;
  /**
   * Identificador asociado a resource.
   */
  resourceId?: string;
}

/** Acceso de aseguradora (UC-10-12, canal INSURANCE). */
export interface RecordInsuranceAccessData {
  /**
   * Identificador asociado a insurance carrier.
   */
  insuranceCarrierId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a claim.
   */
  claimId?: string;
  /**
   * Identificador asociado a authorization request.
   */
  authorizationRequestId?: string;
}

/** Acceso de verificación de identidad (UC-10-12, canal IDENTITY). */
export interface RecordIdentityAccessData {
  /**
   * Identificador asociado a verification case.
   */
  verificationCaseId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Identificador asociado a evidence type concept.
   */
  evidenceTypeConceptId?: string;
  /**
   * Identificador asociado a data disclosed value set.
   */
  dataDisclosedValueSetId?: string;
}

/** Acceso a inventario de farmacia (UC-10-12, canal PHARMACY). */
export interface RecordPharmacyAccessData {
  /**
   * Identificador asociado a pharmacy.
   */
  pharmacyId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId?: string;
  /**
   * Identificador asociado a target.
   */
  targetId?: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId?: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId?: string;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
}

/**
 * Acceso a los cuatro logs de acceso de tercero gobernado (WORM append-only,
 * particionados por `occurred_at`). Cada método encola su fila sin flush; el
 * servicio decide el canal según el DTO.
 */
@Injectable()
export class ThirdPartyAccessRepository {
  /**
   * Ejecuta la operación record delegated.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record delegated conforme al contrato `DelegatedAccessAuditLog`.
   */
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

  /**
   * Ejecuta la operación record insurance.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record insurance conforme al contrato `InsuranceDecisionAccessLog`.
   */
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

  /**
   * Ejecuta la operación record identity.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record identity conforme al contrato `IdentityVerificationAccessLog`.
   */
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

  /**
   * Ejecuta la operación record pharmacy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de record pharmacy conforme al contrato `PharmacyInventoryAccessLog`.
   */
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
