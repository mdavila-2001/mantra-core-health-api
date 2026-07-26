import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientIdentityLinks } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un vínculo de identidad externa (MPI) de un paciente. */
export interface CreateIdentityLinkData {
  patientProfileId: string;
  sourceTenantId: string;
  sourcePatientIdentifier: string;
  sourceSystemUri?: string;
  linkTypeConceptId: string;
  confidenceScore: string;
  verificationStatusConceptId: string;
  verifiedByUserId?: string;
  verifiedAt?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_identity_links`. */
@Injectable()
export class PatientIdentityLinksRepository {
  /** Vínculo por identidad externa (uq_patient_identity_source) para el upsert. */
  findBySource(
    em: EntityManager,
    sourceTenantId: string,
    sourceSystemUri: string | undefined,
    sourcePatientIdentifier: string,
  ): Promise<PatientIdentityLinks | null> {
    return em.findOne(PatientIdentityLinks, {
      sourceTenantId,
      sourceSystemUri: sourceSystemUri ?? null,
      sourcePatientIdentifier,
    });
  }

  create(em: EntityManager, data: CreateIdentityLinkData): PatientIdentityLinks {
    return em.create(
      PatientIdentityLinks,
      {
        patientProfileId: data.patientProfileId,
        sourceTenantId: data.sourceTenantId,
        sourcePatientIdentifier: data.sourcePatientIdentifier,
        sourceSystemUri: data.sourceSystemUri,
        linkTypeConceptId: data.linkTypeConceptId,
        confidenceScore: data.confidenceScore,
        verificationStatusConceptId: data.verificationStatusConceptId,
        verifiedByUserId: data.verifiedByUserId,
        verifiedAt: data.verifiedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Reasigna los vínculos de un paciente al sobreviviente durante una fusión. */
  reassignPatientProfile(
    em: EntityManager,
    fromPatientProfileId: string,
    toPatientProfileId: string,
    now: Date,
  ): Promise<number> {
    return em.nativeUpdate(
      PatientIdentityLinks,
      { patientProfileId: fromPatientProfileId },
      { patientProfileId: toPatientProfileId, updatedAt: now },
    );
  }
}
