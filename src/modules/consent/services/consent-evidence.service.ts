import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { type AuthenticatedUser } from '../../../common';
import { ConsentEvidenceRepository } from '../repositories';
import { CONS } from '../consent.concepts';
import {
  ConsentEvidenceResponseDto,
  CreateConsentEvidenceDto,
  type EvidenceSubjectType,
} from '../dto';

/** Mapa del tipo de sujeto (DTO) al concepto de `subject_type_concept_id`. */
const SUBJECT_TYPE_CONCEPT: Record<EvidenceSubjectType, string> = {
  CONSENT: CONS.SUBJECT_CONSENT,
  HIPAA: CONS.SUBJECT_HIPAA,
  OBJECTION: CONS.SUBJECT_OBJECTION,
  RESTRICTION: CONS.SUBJECT_RESTRICTION,
  TREATMENT: CONS.SUBJECT_TREATMENT,
};

/**
 * UC-07-10: registra evidencia inmutable de consentimiento (append-only). La
 * tabla es IMMUTABLE: solo INSERT, sin `row_version` ni UPDATE. La integridad se
 * apoya en `evidence_hash`/`policy_snapshot_hash`. Este flujo se invoca de forma
 * directa (personal de admisión) o vía include desde UC-07-01/04/08.
 */
@Injectable()
export class ConsentEvidenceService {
  constructor(
    private readonly em: EntityManager,
    private readonly evidenceRepo: ConsentEvidenceRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConsentEvidenceService.name);
  }

  /** UC-07-10: inserta la fila de evidencia. */
  async record(
    dto: CreateConsentEvidenceDto,
    actor: AuthenticatedUser,
  ): Promise<ConsentEvidenceResponseDto> {
    this.logger.info(
      { operation: 'consent.evidence.record', subjectType: dto.subjectType, subjectId: dto.subjectId },
      'Recording consent evidence',
    );
    return this.em.transactional(async (tx) => {
      const evidence = this.evidenceRepo.create(tx, {
        subjectTypeConceptId: SUBJECT_TYPE_CONCEPT[dto.subjectType],
        subjectId: dto.subjectId,
        evidenceTypeConceptId: dto.evidenceTypeConceptId ?? CONS.EVIDENCE_TYPE_SIGNATURE,
        documentFileId: dto.documentFileId,
        signatureId: dto.signatureId,
        capturedChannelConceptId: dto.capturedChannelConceptId ?? CONS.CHANNEL_IN_PERSON,
        policySnapshotHash: dto.policySnapshotHash,
        evidenceHash: dto.evidenceHash,
        recordedByUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'consent.evidence.record', evidenceId: evidence.id },
        'Consent evidence recorded',
      );
      return {
        id: evidence.id,
        subjectId: evidence.subjectId,
        recordedAt: evidence.recordedAt,
      };
    });
  }
}
