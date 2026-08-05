import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientPortalProxies } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de un proxy de portal delegado a un representante. */
export interface CreatePortalProxyData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a proxy user.
   */
  proxyUserId: string;
  /**
   * Identificador asociado a related person.
   */
  relatedPersonId?: string;
  /**
   * Identificador asociado a scope value set.
   */
  scopeValueSetId: string;
  /**
   * Identificador asociado a legal basis record.
   */
  legalBasisRecordId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_portal_proxies`. */
@Injectable()
export class PatientPortalProxiesRepository {
  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientPortalProxies`.
   */
  create(em: EntityManager, data: CreatePortalProxyData): PatientPortalProxies {
    return em.create(
      PatientPortalProxies,
      {
        patientProfileId: data.patientProfileId,
        proxyUserId: data.proxyUserId,
        relatedPersonId: data.relatedPersonId,
        scopeValueSetId: data.scopeValueSetId,
        legalBasisRecordId: data.legalBasisRecordId,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Revoca el proxy activo previo del mismo representante para el paciente. */
  revokeActiveForProxyUser(
    em: EntityManager,
    patientProfileId: string,
    proxyUserId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId, proxyUserId, statusConceptId: PROF.PROXY_ACTIVE },
      { statusConceptId: PROF.PROXY_REVOKED, validTo: now, updatedAt: now },
    );
  }

  /** Revoca todos los proxies activos de un paciente (defunción). */
  revokeActiveForPatient(
    em: EntityManager,
    patientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId, statusConceptId: PROF.PROXY_ACTIVE },
      { statusConceptId: PROF.PROXY_REVOKED, validTo: now, updatedAt: now },
    );
  }

  /** Reasigna los proxies de un paciente al sobreviviente durante una fusión. */
  reassignPatientProfile(
    em: EntityManager,
    fromPatientProfileId: string,
    toPatientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientPortalProxies,
      { patientProfileId: fromPatientProfileId },
      { patientProfileId: toPatientProfileId, updatedAt: now },
    );
  }
}
