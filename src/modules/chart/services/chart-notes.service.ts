import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalNotesRepository } from '../repositories';
import { CHART } from '../chart.concepts';
import {
  AddVersionDto,
  AmendNoteDto,
  CosignVersionDto,
  CreateNoteDto,
  ExamFindingsDto,
  ExamFindingsResultDto,
  NoteVersionResponseDto,
  ReleaseResultDto,
  ReleaseVersionDto,
  SignVersionDto,
  WithholdVersionDto,
} from '../dto';
import type { ClinicalNoteVersions } from '../entities';

/**
 * Casos de uso de la nota clínica versionada (UC-15-01..08).
 *
 * Reglas del agregado: las versiones son inmutables una vez firmadas; el texto se
 * versiona por append (nueva fila `clinical_note_versions`), nunca por UPDATE de
 * una versión firmada. La cabecera lleva `row_version` optimista y apunta a la
 * versión vigente. El servicio posee la unidad de trabajo (`em.transactional`) y
 * hace `flush` del padre antes de crear hijos (las FK son columnas uuid planas).
 */
@Injectable()
export class ChartNotesService {
  constructor(
    private readonly em: EntityManager,
    private readonly notesRepo: ClinicalNotesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChartNotesService.name);
  }

  /** Hash de contenido congelable de una versión (detecta manipulación posterior). */
  private contentHash(v: ClinicalNoteVersions): string {
    const payload = JSON.stringify({
      c: v.chiefComplaintText ?? null,
      s: v.subjectiveText ?? null,
      o: v.objectiveText ?? null,
      a: v.assessmentText ?? null,
      p: v.planText ?? null,
    });
    return createHash('sha256').update(payload).digest('hex');
  }

  /** UC-15-01: crea la cabecera y su versión 1 en estado borrador. */
  async createNote(
    dto: CreateNoteDto,
    actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    this.logger.info(
      { operation: 'chart.note.create', actorId: actor.id },
      'Creating clinical note',
    );
    return this.em.transactional(async (tx) => {
      const header = this.notesRepo.createHeader(tx, {
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        noteTypeConceptId: dto.noteTypeConceptId ?? CHART.NOTE_TYPE_PROGRESS,
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        patientReleaseStatusConceptId: CHART.RELEASE_NOT_RELEASED,
        confidentialityConceptId: dto.confidentialityConceptId,
        actorUserId: actor.id,
      });
      // FK planas: persistir la cabecera antes de crear la versión que la referencia.
      await tx.flush();

      const version = this.notesRepo.createVersion(tx, {
        clinicalNoteId: header.id,
        versionNumber: 1,
        authorProfileId: dto.authorProfileId,
        statusConceptId: CHART.VERSION_DRAFT,
        chiefComplaintText: dto.chiefComplaintText,
        subjectiveText: dto.subjectiveText,
        objectiveText: dto.objectiveText,
        assessmentText: dto.assessmentText,
        planText: dto.planText,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      header.currentVersionId = version.id;
      touch(header, actor.id);

      this.logger.info(
        {
          operation: 'chart.note.create',
          noteId: header.id,
          versionId: version.id,
        },
        'Clinical note drafted',
      );
      return this.toVersionResponse(
        header.id,
        version,
        header.lifecycleStatusConceptId,
      );
    });
  }

  /** UC-15-02: agrega una nueva versión inmutable a una nota aún en borrador. */
  async addVersion(
    noteId: string,
    dto: AddVersionDto,
    actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    this.logger.info(
      { operation: 'chart.note.addVersion', noteId },
      'Adding note version',
    );
    return this.em.transactional(async (tx) => {
      const header = await this.notesRepo.findHeaderById(tx, noteId);
      if (!header)
        throw new ResourceNotFoundException('Nota clínica no encontrada', {
          noteId,
        });
      if (header.lifecycleStatusConceptId !== CHART.NOTE_LIFECYCLE_DRAFT) {
        throw new PreconditionFailedException(
          'La nota ya no está en borrador; use una enmienda (UC-15-05)',
          { noteId },
        );
      }

      const n = await this.notesRepo.maxVersionNumber(tx, noteId);
      const version = this.notesRepo.createVersion(tx, {
        clinicalNoteId: noteId,
        versionNumber: n + 1,
        authorProfileId: dto.authorProfileId,
        statusConceptId: CHART.VERSION_DRAFT,
        chiefComplaintText: dto.chiefComplaintText,
        subjectiveText: dto.subjectiveText,
        objectiveText: dto.objectiveText,
        assessmentText: dto.assessmentText,
        planText: dto.planText,
        supersedesVersionId: header.currentVersionId,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      header.currentVersionId = version.id;
      touch(header, actor.id);
      return this.toVersionResponse(
        noteId,
        version,
        header.lifecycleStatusConceptId,
      );
    });
  }

  /** UC-15-03: firma la versión (autor) y sella su contenido; la fila queda inmutable. */
  async signVersion(
    noteId: string,
    versionId: string,
    dto: SignVersionDto,
    actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    this.logger.info(
      { operation: 'chart.note.sign', noteId, versionId },
      'Signing note version',
    );
    return this.em.transactional(async (tx) => {
      const { header, version } = await this.loadNoteAndVersion(
        tx,
        noteId,
        versionId,
      );
      if (version.statusConceptId !== CHART.VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión no está en borrador',
          { versionId },
        );
      }

      const hash = this.contentHash(version);
      this.notesRepo.createSignature(tx, {
        clinicalNoteVersionId: versionId,
        signerProfileId: dto.signerProfileId,
        signatureTypeConceptId: CHART.SIGNATURE_AUTHOR,
        signedContentHash: hash,
        certificateThumbprint: dto.certificateThumbprint,
        signatureValueEncrypted: dto.signatureValueEncrypted,
      });

      version.statusConceptId = CHART.VERSION_SIGNED;
      version.signedByProfileId = dto.signerProfileId;
      version.signedAt = new Date();
      version.contentHash = hash;
      version.releaseEligibilityConceptId = CHART.ELIGIBILITY_ELIGIBLE;

      header.lifecycleStatusConceptId = CHART.NOTE_LIFECYCLE_SIGNED;
      touch(header, actor.id);
      return this.toVersionResponse(
        noteId,
        version,
        header.lifecycleStatusConceptId,
      );
    });
  }

  /** UC-15-04: cofirma la versión firmada (supervisor) y la deja elegible para liberación. */
  async cosignVersion(
    noteId: string,
    versionId: string,
    dto: CosignVersionDto,
    actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    this.logger.info(
      { operation: 'chart.note.cosign', noteId, versionId },
      'Cosigning note version',
    );
    return this.em.transactional(async (tx) => {
      const { header, version } = await this.loadNoteAndVersion(
        tx,
        noteId,
        versionId,
      );
      if (version.statusConceptId !== CHART.VERSION_SIGNED) {
        throw new PreconditionFailedException(
          'La versión no está firmada (SIGNED)',
          { versionId },
        );
      }

      const signatures = await this.notesRepo.findSignatures(tx, versionId);
      const hasAuthor = signatures.some(
        (s) => s.signatureTypeConceptId === CHART.SIGNATURE_AUTHOR,
      );
      if (!hasAuthor) {
        throw new PreconditionFailedException(
          'Falta la firma primaria del autor',
          { versionId },
        );
      }
      const alreadyCosigned = signatures.some(
        (s) =>
          s.signatureTypeConceptId === CHART.SIGNATURE_COSIGN &&
          s.signerProfileId === dto.signerProfileId,
      );
      if (alreadyCosigned) {
        throw new ConflictException('El cofirmante ya firmó esta versión', {
          versionId,
          signerProfileId: dto.signerProfileId,
        });
      }

      this.notesRepo.createSignature(tx, {
        clinicalNoteVersionId: versionId,
        signerProfileId: dto.signerProfileId,
        signatureTypeConceptId: CHART.SIGNATURE_COSIGN,
        signedContentHash: version.contentHash,
        certificateThumbprint: dto.certificateThumbprint,
        signatureValueEncrypted: dto.signatureValueEncrypted,
      });

      version.statusConceptId = CHART.VERSION_COSIGNED;
      version.releaseEligibilityConceptId = CHART.ELIGIBILITY_ELIGIBLE;
      touch(header, actor.id);
      return this.toVersionResponse(
        noteId,
        version,
        header.lifecycleStatusConceptId,
      );
    });
  }

  /** UC-15-05: enmienda una nota firmada creando una versión que supersede a la firmada. */
  async amendNote(
    noteId: string,
    dto: AmendNoteDto,
    actor: AuthenticatedUser,
  ): Promise<NoteVersionResponseDto> {
    this.logger.info(
      { operation: 'chart.note.amend', noteId },
      'Amending clinical note',
    );
    return this.em.transactional(async (tx) => {
      const header = await this.notesRepo.findHeaderById(tx, noteId);
      if (!header)
        throw new ResourceNotFoundException('Nota clínica no encontrada', {
          noteId,
        });
      if (header.lifecycleStatusConceptId === CHART.NOTE_LIFECYCLE_DRAFT) {
        throw new PreconditionFailedException(
          'La nota no está firmada; edítela como borrador (UC-15-02)',
          { noteId },
        );
      }

      const n = await this.notesRepo.maxVersionNumber(tx, noteId);
      const version = this.notesRepo.createVersion(tx, {
        clinicalNoteId: noteId,
        versionNumber: n + 1,
        authorProfileId: dto.authorProfileId,
        statusConceptId: CHART.VERSION_DRAFT,
        subjectiveText: dto.subjectiveText,
        objectiveText: dto.objectiveText,
        assessmentText: dto.assessmentText,
        planText: dto.planText,
        supersedesVersionId: header.currentVersionId,
        amendmentReasonConceptId:
          dto.amendmentReasonConceptId ?? CHART.AMENDMENT_REASON_CORRECTION,
        amendmentReasonText: dto.amendmentReasonText,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      header.currentVersionId = version.id;
      header.lifecycleStatusConceptId = CHART.NOTE_LIFECYCLE_AMENDED;
      touch(header, actor.id);
      return this.toVersionResponse(
        noteId,
        version,
        header.lifecycleStatusConceptId,
      );
    });
  }

  /** UC-15-06: libera una versión firmada al paciente (registra el evento y la visibilidad). */
  async releaseVersion(
    versionId: string,
    dto: ReleaseVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ReleaseResultDto> {
    this.logger.info(
      { operation: 'chart.note.release', versionId },
      'Releasing note version',
    );
    return this.em.transactional(async (tx) => {
      const version = await this.notesRepo.findVersionById(tx, versionId);
      if (!version)
        throw new ResourceNotFoundException('Versión de nota no encontrada', {
          versionId,
        });
      const signed =
        version.statusConceptId === CHART.VERSION_SIGNED ||
        version.statusConceptId === CHART.VERSION_COSIGNED;
      if (!signed) {
        throw new PreconditionFailedException('La versión no está firmada', {
          versionId,
        });
      }
      if (version.releaseEligibilityConceptId !== CHART.ELIGIBILITY_ELIGIBLE) {
        throw new PreconditionFailedException(
          'La versión no es elegible para liberación',
          {
            versionId,
          },
        );
      }

      const header = await this.notesRepo.findHeaderById(
        tx,
        version.clinicalNoteId,
      );
      if (!header)
        throw new ResourceNotFoundException('Nota clínica no encontrada', {
          versionId,
        });

      const event = this.notesRepo.createReleaseEvent(tx, {
        clinicalNoteVersionId: versionId,
        actionConceptId: CHART.RELEASE_ACTION_RELEASE,
        patientProfileId: header.patientProfileId,
        resultingVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
        policyVersion: dto.policyVersion,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      header.currentReleasedVersionId = versionId;
      header.patientReleaseStatusConceptId = CHART.RELEASE_RELEASED;
      touch(header, actor.id);
      return {
        versionId,
        releaseEventId: event.id,
        patientReleaseStatusConceptId: header.patientReleaseStatusConceptId,
      };
    });
  }

  /** UC-15-07: retiene una versión del paciente por motivo legal/clínico. */
  async withholdVersion(
    versionId: string,
    dto: WithholdVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ReleaseResultDto> {
    this.logger.info(
      { operation: 'chart.note.withhold', versionId },
      'Withholding note version',
    );
    return this.em.transactional(async (tx) => {
      const version = await this.notesRepo.findVersionById(tx, versionId);
      if (!version)
        throw new ResourceNotFoundException('Versión de nota no encontrada', {
          versionId,
        });
      const header = await this.notesRepo.findHeaderById(
        tx,
        version.clinicalNoteId,
      );
      if (!header)
        throw new ResourceNotFoundException('Nota clínica no encontrada', {
          versionId,
        });

      const event = this.notesRepo.createReleaseEvent(tx, {
        clinicalNoteVersionId: versionId,
        actionConceptId: CHART.RELEASE_ACTION_WITHHOLD,
        patientProfileId: header.patientProfileId,
        resultingVisibilityConceptId: CHART.VISIBILITY_PROVIDER_ONLY,
        reasonConceptId: dto.reasonConceptId ?? CHART.WITHHOLD_REASON_LEGAL,
        policyVersion: dto.policyVersion,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      header.patientReleaseStatusConceptId = CHART.RELEASE_WITHHELD;
      if (header.currentReleasedVersionId === versionId) {
        header.currentReleasedVersionId = undefined;
      }
      touch(header, actor.id);
      return {
        versionId,
        releaseEventId: event.id,
        patientReleaseStatusConceptId: header.patientReleaseStatusConceptId,
      };
    });
  }

  /** UC-15-08: registra hallazgos de examen físico sobre una versión aún en borrador. */
  async recordExamFindings(
    versionId: string,
    dto: ExamFindingsDto,
    actor: AuthenticatedUser,
  ): Promise<ExamFindingsResultDto> {
    this.logger.info(
      {
        operation: 'chart.note.examFindings',
        versionId,
        count: dto.findings.length,
      },
      'Recording exam findings',
    );
    return this.em.transactional(async (tx) => {
      const version = await this.notesRepo.findVersionById(tx, versionId);
      if (!version)
        throw new ResourceNotFoundException('Versión de nota no encontrada', {
          versionId,
        });
      if (version.statusConceptId !== CHART.VERSION_DRAFT) {
        throw new PreconditionFailedException(
          'La versión ya está firmada; los hallazgos quedan sellados',
          { versionId },
        );
      }

      for (const f of dto.findings) {
        this.notesRepo.createExamFinding(tx, {
          clinicalNoteVersionId: versionId,
          bodySystemConceptId:
            f.bodySystemConceptId ?? CHART.EXAM_BODY_SYSTEM_GENERAL,
          findingConceptId: f.findingConceptId,
          isNormal: f.isNormal,
          findingText: f.findingText,
          actorUserId: actor.id,
        });
      }

      if (dto.objectiveText !== undefined) {
        version.objectiveText = dto.objectiveText;
      }
      return { versionId, recordedFindings: dto.findings.length };
    });
  }

  /** Carga versión y cabecera comprobando que la versión pertenece a la nota. */
  private async loadNoteAndVersion(
    tx: EntityManager,
    noteId: string,
    versionId: string,
  ) {
    const version = await this.notesRepo.findVersionById(tx, versionId);
    if (!version || version.clinicalNoteId !== noteId) {
      throw new ResourceNotFoundException('Versión de nota no encontrada', {
        noteId,
        versionId,
      });
    }
    const header = await this.notesRepo.findHeaderById(tx, noteId);
    if (!header)
      throw new ResourceNotFoundException('Nota clínica no encontrada', {
        noteId,
      });
    return { header, version };
  }

  private toVersionResponse(
    noteId: string,
    version: ClinicalNoteVersions,
    lifecycleStatusConceptId: string,
  ): NoteVersionResponseDto {
    return {
      noteId,
      versionId: version.id,
      versionNumber: version.versionNumber,
      lifecycleStatusConceptId,
      versionStatusConceptId: version.statusConceptId,
    };
  }
}
