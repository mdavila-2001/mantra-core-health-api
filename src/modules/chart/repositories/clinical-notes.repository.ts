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
  patientProfileId: string;
  encounterId?: string;
  noteTypeConceptId: string;
  lifecycleStatusConceptId: string;
  patientReleaseStatusConceptId?: string;
  confidentialityConceptId?: string;
  actorUserId?: string;
}

/** Datos de alta de una versión inmutable de nota. */
export interface CreateNoteVersionData {
  clinicalNoteId: string;
  versionNumber: number;
  authorProfileId: string;
  statusConceptId: string;
  chiefComplaintText?: string;
  subjectiveText?: string;
  objectiveText?: string;
  assessmentText?: string;
  planText?: string;
  supersedesVersionId?: string;
  amendmentReasonConceptId?: string;
  amendmentReasonText?: string;
  releaseEligibilityConceptId?: string;
  recordedByUserId?: string;
}

/** Datos de una firma sobre una versión de nota. */
export interface CreateSignatureData {
  clinicalNoteVersionId: string;
  signerProfileId: string;
  signatureTypeConceptId: string;
  signedContentHash?: string;
  certificateThumbprint?: string;
  signatureValueEncrypted?: string;
}

/** Datos de un evento de liberación/retención de visibilidad al paciente. */
export interface CreateReleaseEventData {
  clinicalNoteVersionId: string;
  actionConceptId: string;
  patientProfileId?: string;
  resultingVisibilityConceptId: string;
  reasonConceptId?: string;
  policyVersion?: string;
  recordedByUserId?: string;
}

/** Datos de un hallazgo de examen físico. */
export interface CreateExamFindingData {
  clinicalNoteVersionId: string;
  bodySystemConceptId: string;
  findingConceptId?: string;
  isNormal?: boolean;
  findingText?: string;
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
  findHeaderById(em: EntityManager, id: string): Promise<ClinicalNoteHeaders | null> {
    return em.findOne(ClinicalNoteHeaders, { id });
  }

  findVersionById(em: EntityManager, id: string): Promise<ClinicalNoteVersions | null> {
    return em.findOne(ClinicalNoteVersions, { id });
  }

  /** Mayor `version_number` existente para una nota (0 si no hay versiones). */
  async maxVersionNumber(em: EntityManager, clinicalNoteId: string): Promise<number> {
    const rows = await em.find(
      ClinicalNoteVersions,
      { clinicalNoteId },
      { fields: ['versionNumber'], orderBy: { versionNumber: 'desc' }, limit: 1 },
    );
    return rows.length ? rows[0].versionNumber : 0;
  }

  /** Firmas existentes de una versión (para validar cofirma sobre firma primaria). */
  findSignatures(em: EntityManager, versionId: string): Promise<ClinicalNoteSignatures[]> {
    return em.find(ClinicalNoteSignatures, { clinicalNoteVersionId: versionId });
  }

  createHeader(em: EntityManager, data: CreateNoteHeaderData): ClinicalNoteHeaders {
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

  createVersion(em: EntityManager, data: CreateNoteVersionData): ClinicalNoteVersions {
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

  createSignature(em: EntityManager, data: CreateSignatureData): ClinicalNoteSignatures {
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

  createReleaseEvent(em: EntityManager, data: CreateReleaseEventData): NoteReleaseEvents {
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

  createExamFinding(em: EntityManager, data: CreateExamFindingData): PhysicalExamFindings {
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
