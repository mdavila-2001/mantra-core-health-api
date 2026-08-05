import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ClinicalNoteHeaders,
  ClinicalNoteVersions,
  ClinicalNoteSignatures,
  NoteReleaseEvents,
  PhysicalExamFindings,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de alta de una cabecera de nota clínica. */
export interface CreateNoteHeaderData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a note type concept.
   */
  noteTypeConceptId: string;
  /**
   * Identificador asociado a lifecycle status concept.
   */
  lifecycleStatusConceptId: string;
  /**
   * Identificador asociado a patient release status concept.
   */
  patientReleaseStatusConceptId?: string;
  /**
   * Identificador asociado a confidentiality concept.
   */
  confidentialityConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de alta de una versión inmutable de nota. */
export interface CreateNoteVersionData {
  /**
   * Identificador asociado a clinical note.
   */
  clinicalNoteId: string;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  chiefComplaintText?: string;
  /**
   * Valor de subjective text mantenido por la instancia.
   */
  subjectiveText?: string;
  /**
   * Valor de objective text mantenido por la instancia.
   */
  objectiveText?: string;
  /**
   * Valor de assessment text mantenido por la instancia.
   */
  assessmentText?: string;
  /**
   * Valor de plan text mantenido por la instancia.
   */
  planText?: string;
  /**
   * Identificador asociado a supersedes version.
   */
  supersedesVersionId?: string;
  /**
   * Identificador asociado a amendment reason concept.
   */
  amendmentReasonConceptId?: string;
  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  amendmentReasonText?: string;
  /**
   * Identificador asociado a release eligibility concept.
   */
  releaseEligibilityConceptId?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Datos de una firma sobre una versión de nota. */
export interface CreateSignatureData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a signer profile.
   */
  signerProfileId: string;
  /**
   * Identificador asociado a signature type concept.
   */
  signatureTypeConceptId: string;
  /**
   * Valor de signed content hash mantenido por la instancia.
   */
  signedContentHash?: string;
  /**
   * Valor de certificate thumbprint mantenido por la instancia.
   */
  certificateThumbprint?: string;
  /**
   * Valor de signature value encrypted mantenido por la instancia.
   */
  signatureValueEncrypted?: string;
}

/** Datos de un evento de liberación/retención de visibilidad al paciente. */
export interface CreateReleaseEventData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a resulting visibility concept.
   */
  resultingVisibilityConceptId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Datos de un hallazgo de examen físico. */
export interface CreateExamFindingData {
  /**
   * Identificador asociado a clinical note version.
   */
  clinicalNoteVersionId: string;
  /**
   * Identificador asociado a body system concept.
   */
  bodySystemConceptId: string;
  /**
   * Identificador asociado a finding concept.
   */
  findingConceptId?: string;
  /**
   * Valor de is normal mantenido por la instancia.
   */
  isNormal?: boolean;
  /**
   * Valor de finding text mantenido por la instancia.
   */
  findingText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos del agregado "nota clínica versionada": cabecera, versiones
 * inmutables, firmas, eventos de liberación y hallazgos de examen físico.
 *
 * Los métodos reciben el `EntityManager` activo para que el servicio controle la
 * unidad de trabajo y la transacción; las FK son columnas uuid planas, así que el
 * servicio hace `flush` entre padre e hijo.
 */
@Injectable()
export class ClinicalNotesRepository {
  /**
   * Obtiene find header by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find header by id conforme al contrato `Promise<ClinicalNoteHeaders | null>`.
   */
  findHeaderById(
    em: EntityManager,
    id: string,
  ): Promise<ClinicalNoteHeaders | null> {
    return em.findOne(ClinicalNoteHeaders, { id });
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<ClinicalNoteVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<ClinicalNoteVersions | null> {
    return em.findOne(ClinicalNoteVersions, { id });
  }

  /** Mayor `version_number` existente para una nota (0 si no hay versiones). */
  async maxVersionNumber(
    em: EntityManager,
    clinicalNoteId: string,
  ): Promise<number> {
    const rows = await em.find(
      ClinicalNoteVersions,
      { clinicalNoteId },
      {
        fields: ['versionNumber'],
        orderBy: { versionNumber: 'desc' },
        limit: 1,
      },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /** Firmas existentes de una versión (para validar cofirma sobre firma primaria). */
  findSignatures(
    em: EntityManager,
    versionId: string,
  ): Promise<ClinicalNoteSignatures[]> {
    return em.find(ClinicalNoteSignatures, {
      clinicalNoteVersionId: versionId,
    });
  }

  /**
   * Crea create header.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create header conforme al contrato `ClinicalNoteHeaders`.
   */
  createHeader(
    em: EntityManager,
    data: CreateNoteHeaderData,
  ): ClinicalNoteHeaders {
    return em.create(
      ClinicalNoteHeaders,
      {
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        noteTypeConceptId: data.noteTypeConceptId,
        lifecycleStatusConceptId: data.lifecycleStatusConceptId,
        patientReleaseStatusConceptId: data.patientReleaseStatusConceptId,
        confidentialityConceptId: data.confidentialityConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `ClinicalNoteVersions`.
   */
  createVersion(
    em: EntityManager,
    data: CreateNoteVersionData,
  ): ClinicalNoteVersions {
    return em.create(
      ClinicalNoteVersions,
      {
        clinicalNoteId: data.clinicalNoteId,
        versionNumber: data.versionNumber,
        authorProfileId: data.authorProfileId,
        statusConceptId: data.statusConceptId,
        chiefComplaintText: data.chiefComplaintText,
        subjectiveText: data.subjectiveText,
        objectiveText: data.objectiveText,
        assessmentText: data.assessmentText,
        planText: data.planText,
        supersedesVersionId: data.supersedesVersionId,
        amendmentReasonConceptId: data.amendmentReasonConceptId,
        amendmentReasonText: data.amendmentReasonText,
        releaseEligibilityConceptId: data.releaseEligibilityConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create signature.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create signature conforme al contrato `ClinicalNoteSignatures`.
   */
  createSignature(
    em: EntityManager,
    data: CreateSignatureData,
  ): ClinicalNoteSignatures {
    return em.create(
      ClinicalNoteSignatures,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        signerProfileId: data.signerProfileId,
        signatureTypeConceptId: data.signatureTypeConceptId,
        signedContentHash: data.signedContentHash,
        certificateThumbprint: data.certificateThumbprint,
        signatureValueEncrypted: data.signatureValueEncrypted,
        signedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create release event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create release event conforme al contrato `NoteReleaseEvents`.
   */
  createReleaseEvent(
    em: EntityManager,
    data: CreateReleaseEventData,
  ): NoteReleaseEvents {
    return em.create(
      NoteReleaseEvents,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        actionConceptId: data.actionConceptId,
        patientProfileId: data.patientProfileId,
        resultingVisibilityConceptId: data.resultingVisibilityConceptId,
        reasonConceptId: data.reasonConceptId,
        policyVersion: data.policyVersion,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Crea create exam finding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create exam finding conforme al contrato `PhysicalExamFindings`.
   */
  createExamFinding(
    em: EntityManager,
    data: CreateExamFindingData,
  ): PhysicalExamFindings {
    return em.create(
      PhysicalExamFindings,
      {
        clinicalNoteVersionId: data.clinicalNoteVersionId,
        bodySystemConceptId: data.bodySystemConceptId,
        findingConceptId: data.findingConceptId,
        isNormal: data.isNormal,
        findingText: data.findingText,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
