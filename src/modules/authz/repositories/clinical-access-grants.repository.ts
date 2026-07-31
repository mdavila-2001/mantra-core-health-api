import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalAccessGrants } from '../entities';
import { CONCEPTS, createdBy, touch } from '../../../common';

/** Datos de un acceso clínico con propósito de uso. */
export interface CreateClinicalAccessGrantData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a granted user.
   */
  grantedUserId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a consent.
   */
  consentId?: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Identificador asociado a access level concept.
   */
  accessLevelConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `authz.clinical_access_grants`. */
@Injectable()
export class ClinicalAccessGrantsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ClinicalAccessGrants | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ClinicalAccessGrants | null> {
    return em.findOne(ClinicalAccessGrants, { id });
  }

  /** Grant activo concreto (paciente, usuario) si existe (evita duplicados). */
  findActive(
    em: EntityManager,
    patientProfileId: string,
    grantedUserId: string,
  ): Promise<ClinicalAccessGrants | null> {
    return em.findOne(ClinicalAccessGrants, {
      patientProfileId,
      grantedUserId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Grants activos de un usuario sobre un paciente (para el PDP). */
  findActiveForUserPatient(
    em: EntityManager,
    grantedUserId: string,
    patientProfileId: string,
  ): Promise<ClinicalAccessGrants[]> {
    return em.find(ClinicalAccessGrants, {
      grantedUserId,
      patientProfileId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Grants ACTIVOS que se apoyan en un consentimiento concreto (C-20). */
  findActiveByConsent(
    em: EntityManager,
    consentId: string,
  ): Promise<ClinicalAccessGrants[]> {
    return em.find(ClinicalAccessGrants, {
      consentId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * C-20: revoca (soft-state) todos los accesos clínicos ACTIVOS que se apoyaban
   * en un consentimiento retirado. La revocación del consentimiento debe propagar
   * a los grants: el PDP dejará de concederlos. No borra nada (append-only);
   * marca REVOKED y cierra la ventana. Devuelve cuántos revocó.
   */
  async revokeForConsent(
    em: EntityManager,
    consentId: string,
    actorUserId: string,
    now: Date,
  ): Promise<number> {
    const grants = await this.findActiveByConsent(em, consentId);
    for (const grant of grants) {
      grant.stateConceptId = CONCEPTS.STATE_REVOKED;
      grant.validTo = now;
      touch(grant, actorUserId);
    }
    return grants.length;
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ClinicalAccessGrants`.
   */
  create(
    em: EntityManager,
    data: CreateClinicalAccessGrantData,
  ): ClinicalAccessGrants {
    return em.create(
      ClinicalAccessGrants,
      {
        patientProfileId: data.patientProfileId,
        grantedUserId: data.grantedUserId,
        tenantId: data.tenantId,
        branchId: data.branchId,
        encounterId: data.encounterId,
        consentId: data.consentId,
        reasonConceptId: data.reasonConceptId,
        accessLevelConceptId: data.accessLevelConceptId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
