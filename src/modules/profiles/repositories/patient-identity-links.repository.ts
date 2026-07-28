import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientIdentityLinks } from '../entities';
import { createdBy } from '../../../common';

/** Datos de un vínculo de identidad externa (MPI) de un paciente. */
export interface CreateIdentityLinkData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a source tenant.
   */
  sourceTenantId: string;
  /**
   * Valor de source patient identifier mantenido por la instancia.
   */
  sourcePatientIdentifier: string;
  /**
   * Valor de source system uri mantenido por la instancia.
   */
  sourceSystemUri?: string;
  /**
   * Identificador asociado a link type concept.
   */
  linkTypeConceptId: string;
  /**
   * Valor de confidence score mantenido por la instancia.
   */
  confidenceScore: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a verified by user.
   */
  verifiedByUserId?: string;
  /**
   * Valor de verified at mantenido por la instancia.
   */
  verifiedAt?: Date;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientIdentityLinks`.
   */
  create(
    em: EntityManager,
    data: CreateIdentityLinkData,
  ): PatientIdentityLinks {
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
