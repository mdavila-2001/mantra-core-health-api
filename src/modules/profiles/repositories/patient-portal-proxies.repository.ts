import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientPortalProxies } from '../entities';
import { createdBy } from '../../../common';
import { PROF } from '../profiles.concepts';

/** Datos de un proxy de portal delegado a un representante. */
export interface CreatePortalProxyData {
  patientProfileId: string;
  proxyUserId: string;
  relatedPersonId?: string;
  scopeValueSetId: string;
  legalBasisRecordId: string;
  statusConceptId: string;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_portal_proxies`. */
@Injectable()
export class PatientPortalProxiesRepository {
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
