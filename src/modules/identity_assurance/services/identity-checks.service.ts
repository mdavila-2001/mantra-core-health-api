import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityChecksRepository,
  IdentityVerificationAttemptsRepository,
  IdentityCheckResultsRepository,
} from '../repositories';
import {
  RecordAttemptDto,
  RecordResultDto,
  AttemptResponseDto,
  CheckResultResponseDto,
  type AttemptOutcome,
} from '../dto';
import { IdentityChecks } from '../entities';

const ATTEMPT_OUTCOME_CONCEPT: Record<AttemptOutcome, string> = {
  SUCCESS: IDA.ATTEMPT_SUCCESS,
  PENDING: IDA.ATTEMPT_PENDING,
  FAILED: IDA.ATTEMPT_FAILED,
};

/**
 * Casos de uso sobre `identity_checks`: ejecutar un intento idempotente contra
 * la autoridad externa (UC-27-05) y registrar el resultado inmutable con
 * supersede (UC-27-06). Un intento API exitoso NO se trata como identidad
 * verificada: el veredicto lo aporta el resultado.
 */
@Injectable()
export class IdentityChecksService {
  constructor(
    private readonly em: EntityManager,
    private readonly checksRepo: IdentityChecksRepository,
    private readonly attemptsRepo: IdentityVerificationAttemptsRepository,
    private readonly resultsRepo: IdentityCheckResultsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityChecksService.name);
  }

  /** UC-27-05: registra un intento contra la autoridad externa (idempotente). */
  async recordAttempt(
    checkId: string,
    dto: RecordAttemptDto,
    actor: AuthenticatedUser,
  ): Promise<AttemptResponseDto> {
    this.logger.info({ operation: 'ida.check.attempt', actorId: actor.id, checkId }, 'Recording attempt');
    return this.em.transactional(async (tx) => {
      const check = await this.loadCheck(tx, checkId);

      const outcome: AttemptOutcome = dto.outcome ?? 'SUCCESS';
      const now = new Date();
      const attemptNumber = (await this.attemptsRepo.countByCase(tx, check.identityVerificationCaseId)) + 1;
      const attempt = this.attemptsRepo.create(tx, {
        identityVerificationCaseId: check.identityVerificationCaseId,
        identityAuthorityEndpointId: dto.identityAuthorityEndpointId,
        attemptNumber,
        requestMessageId: dto.requestMessageId,
        responseMessageId: dto.responseMessageId,
        idempotencyKey: dto.idempotencyKey ?? `ida-attempt-${check.id}-${attemptNumber}`,
        startedAt: now,
        completedAt: outcome === 'PENDING' ? undefined : now,
        outcomeConceptId: ATTEMPT_OUTCOME_CONCEPT[outcome],
        technicalErrorCode: dto.technicalErrorCode,
        retryEligible: dto.retryEligible,
      });

      check.statusConceptId = outcome === 'FAILED' ? IDA.CHECK_FAILED : IDA.CHECK_IN_PROGRESS;
      touch(check, actor.id);
      await tx.flush();
      return {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        outcome: attempt.outcomeConceptId,
        checkStatus: check.statusConceptId,
      };
    });
  }

  /** UC-27-06: registra un resultado inmutable (append + supersede). */
  async recordResult(
    checkId: string,
    dto: RecordResultDto,
    actor: AuthenticatedUser,
  ): Promise<CheckResultResponseDto> {
    this.logger.info({ operation: 'ida.check.result', actorId: actor.id, checkId }, 'Recording result');
    return this.em.transactional(async (tx) => {
      const check = await this.loadCheck(tx, checkId);
      const hasCompleted = await this.attemptsRepo.existsCompletedForCase(
        tx,
        check.identityVerificationCaseId,
      );
      if (!hasCompleted) {
        throw new PreconditionFailedException('No existe un intento completado para registrar resultado', {
          checkId,
        });
      }

      const previous = await this.resultsRepo.findLatestByCheck(tx, check.id);
      const resultVersion = (await this.resultsRepo.countByCheck(tx, check.id)) + 1;
      const resultConceptId = dto.result === 'MATCH' ? IDA.RESULT_MATCH : IDA.RESULT_NO_MATCH;
      const result = this.resultsRepo.create(tx, {
        identityCheckId: check.id,
        resultVersion,
        resultConceptId,
        matchScore: dto.matchScore,
        discrepancyCodesJson: dto.discrepancyCodes,
        sourceResponseHash: dto.sourceResponseHash,
        supersedesResultId: previous?.id,
        checkedByActorTypeConceptId: IDA.ACTOR_TYPE_SYSTEM,
        checkedByActorId: actor.id,
      });

      check.statusConceptId = dto.result === 'MATCH' ? IDA.CHECK_COMPLETED : IDA.CHECK_FAILED;
      touch(check, actor.id);
      await tx.flush();
      return {
        id: result.id,
        resultVersion: result.resultVersion,
        result: result.resultConceptId,
        checkStatus: check.statusConceptId,
      };
    });
  }

  private async loadCheck(tx: EntityManager, checkId: string): Promise<IdentityChecks> {
    const check = await this.checksRepo.findById(tx, checkId);
    if (!check) throw new ResourceNotFoundException('Check de identidad no encontrado', { checkId });
    return check;
  }
}
