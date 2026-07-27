import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { ICON } from '../integration_contracts.concepts';
import {
  ContractsRepository,
  ContractVersionsRepository,
  ExchangeAttemptsRepository,
  ExchangeRecordsRepository,
  IdempotencyRecordsRepository,
  SyncCursorsRepository,
} from '../repositories';
import {
  AdvanceCursorDto,
  ExchangeAttemptResponseDto,
  ExchangeRecordResponseDto,
  ExecuteExchangeDto,
  RecordAttemptDto,
  RetryExchangeDto,
  SyncCursorResponseDto,
} from '../dto';

/**
 * Ejecución gobernada de intercambios: inbound idempotente (UC-31-05), registro de
 * intentos outbound (UC-31-06), reintento de fallos (UC-31-07) y avance monótono
 * del cursor de sincronización (UC-31-08).
 *
 * Las FK son columnas uuid, por lo que el servicio hace `flush` del padre antes de
 * crear los hijos dependientes dentro de la misma transacción.
 */
@Injectable()
export class IntegrationExchangesService {
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ContractsRepository,
    private readonly versionsRepo: ContractVersionsRepository,
    private readonly recordsRepo: ExchangeRecordsRepository,
    private readonly attemptsRepo: ExchangeAttemptsRepository,
    private readonly idempotencyRepo: IdempotencyRecordsRepository,
    private readonly cursorsRepo: SyncCursorsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationExchangesService.name);
  }

  /** UC-31-05: ejecuta un intercambio inbound idempotente (replay si la clave existe). */
  async executeExchange(
    contractId: string,
    idempotencyKey: string | undefined,
    dto: ExecuteExchangeDto,
    actor: AuthenticatedUser,
  ): Promise<ExchangeRecordResponseDto> {
    const key = idempotencyKey ?? dto.idempotencyKey;
    this.logger.info(
      {
        operation: 'integration.exchange.execute',
        contractId,
        actorId: actor.id,
      },
      'Executing idempotent inbound exchange',
    );
    if (!key) {
      throw new PreconditionFailedException(
        'Falta la clave de idempotencia (idempotency-key)',
        {
          contractId,
        },
      );
    }
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      // UC-31-05 include UC-31-10: se resuelve la versión ACTIVE vigente.
      const version = await this.versionsRepo.findActiveByContract(
        tx,
        contractId,
        ICON.VERSION_ACTIVE,
      );
      if (!version) {
        throw new PreconditionFailedException(
          'No hay versión ACTIVE del contrato',
          { contractId },
        );
      }

      const existing = await this.idempotencyRepo.findByKey(
        tx,
        contractId,
        key,
      );
      if (existing) {
        // request_hash detecta mismatch de payload bajo la misma clave.
        if (
          dto.requestHash &&
          existing.requestHash &&
          dto.requestHash !== existing.requestHash
        ) {
          throw new ConflictException(
            'La clave de idempotencia se reusó con un payload distinto',
            {
              contractId,
              idempotencyKey: key,
            },
          );
        }
        this.logger.info(
          {
            operation: 'integration.exchange.execute',
            contractId,
            replay: true,
          },
          'Idempotent replay: returning existing exchange',
        );
        return {
          id: existing.firstExchangeRecordId ?? existing.id,
          integrationContractVersionId: version.id,
          outcome: existing.statusConceptId,
          replayed: true,
          responseReference: existing.responseReference,
        };
      }

      const now = new Date();
      const idem = this.idempotencyRepo.create(tx, {
        integrationContractId: contractId,
        idempotencyKey: key,
        operationConceptId: ICON.OPERATION_EXCHANGE,
        requestHash: dto.requestHash,
        statusConceptId: ICON.IDEMPOTENCY_PENDING,
      });
      await tx.flush();

      const record = this.recordsRepo.create(tx, {
        integrationContractVersionId: version.id,
        directionConceptId: ICON.DIRECTION_INBOUND,
        messageTypeConceptId: dto.messageTypeConceptId ?? ICON.MESSAGE_GENERIC,
        businessIdentifier: dto.businessIdentifier,
        idempotencyKey: key,
        correlationId: dto.correlationId,
        subjectTypeConceptId: dto.subjectTypeConceptId,
        subjectEntityId: dto.subjectEntityId,
        requestHash: dto.requestHash,
        payloadFileId: dto.payloadFileId,
        receivedAt: now,
        outcomeConceptId: ICON.OUTCOME_PENDING,
      });
      await tx.flush();

      idem.firstExchangeRecordId = record.id;

      this.attemptsRepo.create(tx, {
        integrationExchangeRecordId: record.id,
        attemptNumber: 1,
        startedAt: now,
        outcomeConceptId: ICON.ATTEMPT_IN_PROGRESS,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.exchange.execute',
          contractId,
          recordId: record.id,
        },
        'Inbound exchange received',
      );
      return {
        id: record.id,
        integrationContractVersionId: version.id,
        outcome: record.outcomeConceptId,
        replayed: false,
      };
    });
  }

  /** UC-31-06: registra un intento outbound y cierra el registro según su resultado. */
  async recordAttempt(
    contractId: string,
    recordId: string,
    dto: RecordAttemptDto,
    actor: AuthenticatedUser,
  ): Promise<ExchangeAttemptResponseDto> {
    this.logger.info(
      {
        operation: 'integration.exchange.attempt',
        contractId,
        recordId,
        actorId: actor.id,
      },
      'Recording exchange attempt',
    );
    return this.em.transactional(async (tx) => {
      const record = await this.recordsRepo.findById(tx, recordId);
      if (!record) {
        throw new ResourceNotFoundException(
          'Registro de intercambio no encontrado',
          { recordId },
        );
      }

      const now = new Date();
      const success = dto.outcome === 'SUCCESS';
      const nextNumber =
        (await this.attemptsRepo.maxAttemptNumber(tx, recordId)) + 1;

      const attempt = this.attemptsRepo.create(tx, {
        integrationExchangeRecordId: recordId,
        attemptNumber: nextNumber,
        endpointId: dto.endpointId,
        startedAt: now,
        completedAt: now,
        httpStatus: dto.httpStatus,
        providerErrorCode: dto.providerErrorCode,
        retryDecisionConceptId: success
          ? undefined
          : this.mapRetryDecision(dto.retryDecision),
        traceId: dto.traceId,
        outcomeConceptId: success ? ICON.ATTEMPT_SUCCESS : ICON.ATTEMPT_FAILED,
      });

      record.responseHash = dto.responseHash;
      record.completedAt = success ? now : undefined;
      record.outcomeConceptId = success
        ? ICON.OUTCOME_SUCCESS
        : ICON.OUTCOME_FAILED;

      if (success) {
        await this.completeIdempotency(
          tx,
          record.integrationContractVersionId,
          record,
          dto.responseReference,
        );
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.exchange.attempt',
          recordId,
          attemptId: attempt.id,
          success,
        },
        'Exchange attempt recorded',
      );
      return {
        id: attempt.id,
        integrationExchangeRecordId: recordId,
        attemptNumber: nextNumber,
        outcome: attempt.outcomeConceptId,
        recordOutcome: record.outcomeConceptId,
      };
    });
  }

  /** UC-31-07: reintenta un intercambio fallido (nuevo intento con backoff). */
  async retry(
    recordId: string,
    dto: RetryExchangeDto,
    actor: AuthenticatedUser,
  ): Promise<ExchangeAttemptResponseDto> {
    this.logger.info(
      { operation: 'integration.exchange.retry', recordId, actorId: actor.id },
      'Retrying failed exchange',
    );
    return this.em.transactional(async (tx) => {
      const record = await this.recordsRepo.findById(tx, recordId);
      if (!record) {
        throw new ResourceNotFoundException(
          'Registro de intercambio no encontrado',
          { recordId },
        );
      }

      const last = await this.attemptsRepo.lastAttempt(tx, recordId);
      if (!last || last.outcomeConceptId !== ICON.ATTEMPT_FAILED) {
        throw new PreconditionFailedException(
          'Solo se reintenta un intercambio con último intento FAILED',
          {
            recordId,
          },
        );
      }
      if (last.retryDecisionConceptId === ICON.RETRY_PERMANENT) {
        throw new PreconditionFailedException(
          'El último intento marcó fallo permanente (no reintentable)',
          {
            recordId,
          },
        );
      }

      const now = new Date();
      const success = (dto.outcome ?? 'SUCCESS') === 'SUCCESS';
      const nextNumber = last.attemptNumber + 1;

      const attempt = this.attemptsRepo.create(tx, {
        integrationExchangeRecordId: recordId,
        attemptNumber: nextNumber,
        startedAt: now,
        completedAt: now,
        httpStatus: dto.httpStatus,
        traceId: dto.traceId,
        retryDecisionConceptId: success ? undefined : ICON.RETRY_RETRYABLE,
        outcomeConceptId: success ? ICON.ATTEMPT_SUCCESS : ICON.ATTEMPT_FAILED,
      });

      record.completedAt = success ? now : undefined;
      record.outcomeConceptId = success
        ? ICON.OUTCOME_SUCCESS
        : ICON.OUTCOME_FAILED;

      if (success) {
        await this.completeIdempotency(
          tx,
          record.integrationContractVersionId,
          record,
          undefined,
        );
      }
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.exchange.retry',
          recordId,
          attemptId: attempt.id,
          success,
        },
        'Exchange retried',
      );
      return {
        id: attempt.id,
        integrationExchangeRecordId: recordId,
        attemptNumber: nextNumber,
        outcome: attempt.outcomeConceptId,
        recordOutcome: record.outcomeConceptId,
      };
    });
  }

  /** UC-31-08: avanza (o crea) el cursor de sincronización de forma monótona. */
  async advanceCursor(
    contractId: string,
    scope: string,
    dto: AdvanceCursorDto,
    actor: AuthenticatedUser,
  ): Promise<SyncCursorResponseDto> {
    this.logger.info(
      {
        operation: 'integration.cursor.advance',
        contractId,
        scope,
        actorId: actor.id,
      },
      'Advancing sync cursor',
    );
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }

      const watermarkAt = dto.watermarkAt
        ? new Date(dto.watermarkAt)
        : undefined;
      let cursor = await this.cursorsRepo.findByScope(tx, contractId, scope);
      let created = false;

      if (!cursor) {
        cursor = this.cursorsRepo.create(tx, {
          integrationContractId: contractId,
          cursorScope: scope,
          cursorValue: dto.cursorValue,
          watermarkAt,
          lastSuccessfulExchangeId: dto.lastSuccessfulExchangeId,
          statusConceptId: ICON.CURSOR_ACTIVE,
        });
        created = true;
      } else {
        // Monotonía: rechaza un cursor_value regresivo o igual.
        if (dto.cursorValue <= cursor.cursorValue) {
          throw new PreconditionFailedException(
            'El cursor solo puede avanzar hacia adelante',
            {
              contractId,
              scope,
              current: cursor.cursorValue,
            },
          );
        }
        cursor.cursorValue = dto.cursorValue;
        cursor.watermarkAt = watermarkAt;
        cursor.lastSuccessfulExchangeId = dto.lastSuccessfulExchangeId;
        cursor.updatedAt = new Date();
      }
      await tx.flush();

      this.logger.info(
        { operation: 'integration.cursor.advance', contractId, scope, created },
        'Sync cursor advanced',
      );
      return {
        id: cursor.id,
        cursorScope: scope,
        cursorValue: cursor.cursorValue,
        created,
      };
    });
  }

  private mapRetryDecision(decision?: 'RETRYABLE' | 'PERMANENT'): string {
    return decision === 'PERMANENT'
      ? ICON.RETRY_PERMANENT
      : ICON.RETRY_RETRYABLE;
  }

  /** Cierra la idempotencia asociada al registro (status COMPLETED, response_reference). */
  private async completeIdempotency(
    tx: EntityManager,
    _versionId: string,
    record: {
      id: string;
      idempotencyKey?: string;
      integrationContractVersionId: string;
    },
    responseReference?: string,
  ): Promise<void> {
    if (!record.idempotencyKey) return;
    const version = await this.versionsRepo.findById(
      tx,
      record.integrationContractVersionId,
    );
    if (!version) return;
    const idem = await this.idempotencyRepo.findByKey(
      tx,
      version.integrationContractId,
      record.idempotencyKey,
    );
    if (!idem) return;
    idem.statusConceptId = ICON.IDEMPOTENCY_COMPLETED;
    idem.responseReference = responseReference ?? record.id;
  }
}
