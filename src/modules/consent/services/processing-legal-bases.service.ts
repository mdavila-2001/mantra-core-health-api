import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { SEED, touch, type AuthenticatedUser } from '../../../common';
import { ProcessingLegalBasesRepository } from '../repositories';
import { CONS } from '../consent.concepts';
import {
  CreateProcessingLegalBasisDto,
  ProcessingLegalBasisResponseDto,
} from '../dto';

/**
 * UC-07-06: establece/versiona la base legal de procesamiento. Inserta la versión
 * nueva como activa y cierra la vigente (valid_to=now, estado -> superseded) en la
 * misma transacción, respetando el periodo de vigencia sin solapamiento.
 */
@Injectable()
export class ProcessingLegalBasesService {
  constructor(
    private readonly em: EntityManager,
    private readonly legalBasesRepo: ProcessingLegalBasesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcessingLegalBasesService.name);
  }

  /** UC-07-06: crea una versión nueva y supersede la anterior. */
  async version(
    dto: CreateProcessingLegalBasisDto,
    actor: AuthenticatedUser,
  ): Promise<ProcessingLegalBasisResponseDto> {
    this.logger.info(
      {
        operation: 'consent.legal-basis.version',
        processingPurposeId: dto.processingPurposeId,
      },
      'Versioning processing legal basis',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const tenantId = dto.tenantId ?? SEED.tenantId;
      const jurisdictionConceptId =
        dto.jurisdictionConceptId ?? CONS.JURISDICTION_PE;

      const current = await this.legalBasesRepo.findCurrentVersion(
        tx,
        tenantId,
        dto.processingPurposeId,
        jurisdictionConceptId,
        CONS.LEGAL_BASIS_ACTIVE,
      );
      let supersededId: string | null = null;
      if (current) {
        current.validTo = now;
        current.statusConceptId = CONS.LEGAL_BASIS_SUPERSEDED;
        touch(current, actor.id);
        supersededId = current.id;
      }

      const basis = this.legalBasesRepo.create(tx, {
        tenantId,
        processingPurposeId: dto.processingPurposeId,
        jurisdictionConceptId,
        generalLegalBasisConceptId:
          dto.generalLegalBasisConceptId ?? CONS.LEGAL_BASIS_CONSENT,
        specialCategoryConditionConceptId:
          dto.specialCategoryConditionConceptId,
        policyVersion: dto.policyVersion,
        legalReferenceUri: dto.legalReferenceUri,
        validFrom: now,
        statusConceptId: CONS.LEGAL_BASIS_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'consent.legal-basis.version',
          basisId: basis.id,
          supersededId,
        },
        'Processing legal basis versioned',
      );
      return {
        id: basis.id,
        processingPurposeId: basis.processingPurposeId,
        status: basis.statusConceptId,
        supersededId,
        createdAt: basis.createdAt,
      };
    });
  }
}
