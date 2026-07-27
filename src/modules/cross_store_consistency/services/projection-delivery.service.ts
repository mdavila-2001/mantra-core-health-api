import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import { ProjectionRepository } from '../repositories';
import {
  RegisterProjectionDto,
  ProjectionDefinitionResponseDto,
  ProcessDeliveryDto,
  DeliveryResponseDto,
  SendToDeadLetterDto,
  DeadLetterResponseDto,
  ReplayDeadLetterDto,
  ReplayResponseDto,
} from '../dto';

const DEFAULT_CONCURRENCY_LIMIT = 1;

/**
 * Proyección de eventos a los stores secundarios (UC-62-01 … 04).
 *
 * La regla que lo sostiene todo: **la entrega es *at-least-once*, así que el
 * consumidor tiene que ser idempotente**. La clave de idempotencia por suscripción
 * es lo que hace que un evento entregado tres veces se aplique una.
 */
@Injectable()
export class ProjectionDeliveryService {
  constructor(
    private readonly em: EntityManager,
    private readonly projectionRepo: ProjectionRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectionDeliveryService.name);
  }

  /**
   * UC-62-01: registrar la definición con sus suscripciones y su SLO.
   *
   * Las tres cosas van juntas porque una definición sin suscripciones no proyecta
   * nada, y sin SLO no hay cada cuánto reconciliarla — el binding quedaría
   * declarado pero nadie sabría cuándo comprobar que funciona.
   */
  async registerProjection(
    dto: RegisterProjectionDto,
    actor: AuthenticatedUser,
  ): Promise<ProjectionDefinitionResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.projectionRepo.findDefinitionByVersion(
        tx,
        dto.code,
        dto.projectionVersion,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe esa versión de la definición de proyección.',
          {
            code: dto.code,
            projectionVersion: dto.projectionVersion,
          },
        );
      }

      // Un store secundario proyectando sobre sí mismo no es una proyección: es un
      // bucle, y el canónico dejaría de ser el único origen.
      if (dto.sourceDatasetId === dto.targetDatasetId) {
        throw new PreconditionFailedException(
          'El dataset de origen y el de destino no pueden ser el mismo.',
          { datasetId: dto.sourceDatasetId },
        );
      }

      const definition = this.projectionRepo.createDefinition(tx, {
        code: dto.code,
        sourceDatasetId: dto.sourceDatasetId,
        targetDatasetId: dto.targetDatasetId,
        projectionVersion: dto.projectionVersion,
        deliverySemantics: dto.deliverySemantics ?? 'AT_LEAST_ONCE',
        transformationRef: dto.transformationRef,
        state: 'ACTIVE',
      });

      const subscriptionIds: string[] = [];
      const seen = new Set<string>();
      for (const subscription of dto.subscriptions) {
        const key = `${subscription.sourceEventType}|${subscription.consumerCode}`;
        if (seen.has(key)) {
          throw new ConflictException(
            'Dos suscripciones comparten el mismo tipo de evento y consumidor.',
            {
              sourceEventType: subscription.sourceEventType,
              consumerCode: subscription.consumerCode,
            },
          );
        }
        seen.add(key);

        const created = this.projectionRepo.createSubscription(tx, {
          projectionDefinitionId: definition.id,
          sourceEventType: subscription.sourceEventType,
          consumerCode: subscription.consumerCode,
          targetBackendCode: subscription.targetBackendCode,
          concurrencyLimit:
            subscription.concurrencyLimit ?? DEFAULT_CONCURRENCY_LIMIT,
          retryPolicyJson: subscription.retryPolicyJson,
          deadLetterEnabled: subscription.deadLetterEnabled !== false,
          state: 'ACTIVE',
        });
        subscriptionIds.push(created.id);
      }

      let sloId: string | undefined;
      if (dto.slo) {
        const backendCode = dto.subscriptions[0].targetBackendCode;
        const existing = await this.projectionRepo.findSloForUpdate(
          tx,
          dto.targetDatasetId,
          backendCode,
        );
        if (existing) {
          existing.maxProjectionLagSeconds = dto.slo.maxProjectionLagSeconds;
          // Sin valor nuevo se conserva el anterior: la entidad no los declara
          // opcionales, y vaciarlos apagaría un umbral que sigue vigente.
          if (dto.slo.maxDriftRate)
            existing.maxDriftRate = dto.slo.maxDriftRate;
          existing.reconciliationIntervalMinutes =
            dto.slo.reconciliationIntervalMinutes;
          if (dto.slo.alertPolicyCode)
            existing.alertPolicyCode = dto.slo.alertPolicyCode;
          existing.state = 'ACTIVE';
          sloId = existing.id;
        } else {
          const created = this.projectionRepo.createSlo(tx, {
            datasetId: dto.targetDatasetId,
            targetBackendCode: backendCode,
            maxProjectionLagSeconds: dto.slo.maxProjectionLagSeconds,
            maxDriftRate: dto.slo.maxDriftRate,
            reconciliationIntervalMinutes:
              dto.slo.reconciliationIntervalMinutes,
            alertPolicyCode: dto.slo.alertPolicyCode,
            state: 'ACTIVE',
          });
          sloId = created.id;
        }
      }

      this.logger.info(
        {
          operation: 'xstore.projection.register',
          definitionId: definition.id,
          subscriptions: subscriptionIds.length,
        },
        'Definición de proyección registrada',
      );

      return {
        id: definition.id,
        code: definition.code,
        projectionVersion: definition.projectionVersion,
        state: definition.state,
        subscriptionIds,
        sloId,
      };
    });
  }

  /**
   * UC-62-02 + UC-62-03: registrar el intento de entrega y avanzar el checkpoint.
   *
   * El orden es el que define el caso de uso y no es negociable: **el checkpoint
   * sólo avanza cuando la escritura en el destino está confirmada durable**. Al
   * revés, un fallo tras avanzar dejaría el evento sin proyectar y el checkpoint
   * diciendo que sí — y ese evento no se volvería a leer nunca.
   *
   * La clave de idempotencia se deriva de `(evento, hash del payload)`: si el
   * mismo evento llega con el mismo contenido, es la misma escritura.
   *
   * El checkpoint es **monótono**. Un evento que llega tarde se aplica —porque el
   * destino es idempotente— pero no retrocede la posición: eso haría releer todo
   * lo que ya se procesó.
   */
  async processDelivery(
    dto: ProcessDeliveryDto,
    actor: AuthenticatedUser,
  ): Promise<DeliveryResponseDto> {
    return this.em.transactional(async (tx) => {
      const subscription = await this.projectionRepo.findSubscriptionById(
        tx,
        dto.projectionSubscriptionId,
      );
      if (!subscription) {
        throw new ResourceNotFoundException(
          'Suscripción de proyección no encontrada.',
          {
            projectionSubscriptionId: dto.projectionSubscriptionId,
          },
        );
      }
      if (subscription.state !== 'ACTIVE') {
        throw new PreconditionFailedException(
          'La suscripción no está activa.',
          {
            projectionSubscriptionId: subscription.id,
            state: subscription.state,
          },
        );
      }

      const idempotencyKey = this.deriveIdempotencyKey(
        dto.outboxEventId,
        dto.payloadHash,
      );

      const previous = await this.projectionRepo.findAttemptByIdempotencyKey(
        tx,
        subscription.id,
        idempotencyKey,
      );
      if (previous && previous.status === 'SUCCEEDED') {
        return {
          id: previous.id,
          attemptNumber: previous.attemptNumber,
          status: previous.status,
          duplicate: true,
          checkpointAdvanced: false,
        };
      }

      const attemptNumber =
        (await this.projectionRepo.countAttempts(
          tx,
          subscription.id,
          dto.outboxEventId,
        )) + 1;

      const failed = dto.durableWriteConfirmed === false;
      const attempt = this.projectionRepo.createAttempt(tx, {
        projectionSubscriptionId: subscription.id,
        outboxEventId: dto.outboxEventId,
        tenantId: dto.tenantId,
        attemptNumber,
        // Un reintento conserva la clave: el destino tiene que reconocerlo como la
        // misma escritura, no como una nueva.
        idempotencyKey: previous ? previous.idempotencyKey : idempotencyKey,
        payloadHash: dto.payloadHash,
        status: failed ? 'FAILED' : 'SUCCEEDED',
        startedAt: new Date(),
      });
      attempt.completedAt = new Date();
      if (failed) attempt.errorCode = dto.errorCode;

      // El heartbeat dice que el consumidor sigue vivo; sin él no habría forma de
      // distinguir "no llegan eventos" de "el consumidor está caído".
      await this.touchConsumer(tx, subscription.consumerCode);

      if (failed) {
        this.logger.warn(
          {
            operation: 'xstore.delivery.failed',
            attemptId: attempt.id,
            attemptNumber,
            errorCode: dto.errorCode,
          },
          'Entrega de proyección fallida',
        );

        return {
          id: attempt.id,
          attemptNumber,
          status: attempt.status,
          duplicate: false,
          checkpointAdvanced: false,
        };
      }

      const checkpointAdvanced = await this.advanceCheckpoint(
        tx,
        subscription.id,
        dto,
      );

      this.logger.info(
        {
          operation: 'xstore.delivery.process',
          attemptId: attempt.id,
          attemptNumber,
          checkpointAdvanced,
        },
        'Entrega de proyección aplicada',
      );

      return {
        id: attempt.id,
        attemptNumber,
        status: attempt.status,
        duplicate: false,
        checkpointAdvanced,
        sourcePosition: dto.sourcePosition,
      };
    });
  }

  /**
   * UC-62-04 (envío): mandar el intento fallido a la cola muerta.
   *
   * El payload se preserva en el almacén de objetos, no aquí: es lo que permite
   * reprocesarlo después sin haber tenido que guardar el cuerpo del evento en una
   * tabla de control.
   */
  async sendToDeadLetter(
    dto: SendToDeadLetterDto,
    actor: AuthenticatedUser,
  ): Promise<DeadLetterResponseDto> {
    return this.em.transactional(async (tx) => {
      const attempt = await this.projectionRepo.findAttemptForUpdate(
        tx,
        dto.projectionDeliveryAttemptId,
      );
      if (!attempt) {
        throw new ResourceNotFoundException(
          'Intento de entrega no encontrado.',
          {
            projectionDeliveryAttemptId: dto.projectionDeliveryAttemptId,
          },
        );
      }

      const subscription = await this.projectionRepo.findSubscriptionById(
        tx,
        attempt.projectionSubscriptionId,
      );
      if (!subscription?.deadLetterEnabled) {
        throw new PreconditionFailedException(
          'La suscripción no tiene cola muerta habilitada.',
          { projectionSubscriptionId: attempt.projectionSubscriptionId },
        );
      }

      const duplicate = await this.projectionRepo.findDeadLetterByAttempt(
        tx,
        attempt.id,
      );
      if (duplicate) {
        return { id: duplicate.id, state: duplicate.state, duplicate: true };
      }

      attempt.status = 'FAILED';
      attempt.errorCode = dto.reasonCode;
      attempt.completedAt = new Date();

      const deadLetter = this.projectionRepo.createDeadLetter(tx, {
        projectionDeliveryAttemptId: attempt.id,
        tenantId: attempt.tenantId,
        reasonCode: dto.reasonCode,
        payloadObjectId: dto.payloadObjectId,
        state: 'OPEN',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: attempt.tenantId,
        eventType: 'ProjectionDeadLettered',
        aggregateType: 'cross_store_consistency.projection_dead_letters',
        aggregateId: deadLetter.id,
        payloadJson: {
          projectionSubscriptionId: attempt.projectionSubscriptionId,
          outboxEventId: attempt.outboxEventId,
          reasonCode: dto.reasonCode,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'xstore.dead-letter.send',
          deadLetterId: deadLetter.id,
          reasonCode: dto.reasonCode,
        },
        'Entrega enviada a la cola muerta',
      );

      return { id: deadLetter.id, state: deadLetter.state, duplicate: false };
    });
  }

  /**
   * UC-62-04 (reproceso): crear un intento nuevo desde la cola muerta.
   *
   * **Conserva la clave de idempotencia del intento original.** Es lo que
   * distingue reprocesar de volver a proyectar: si el destino ya llegó a aplicar
   * la escritura antes de fallar en otra parte, el reproceso no la duplica.
   */
  async replayDeadLetter(
    deadLetterId: string,
    dto: ReplayDeadLetterDto,
    actor: AuthenticatedUser,
  ): Promise<ReplayResponseDto> {
    return this.em.transactional(async (tx) => {
      const deadLetter = await this.projectionRepo.findDeadLetterForUpdate(
        tx,
        deadLetterId,
      );
      if (!deadLetter) {
        throw new ResourceNotFoundException(
          'Entrada de cola muerta no encontrada.',
          {
            deadLetterId,
          },
        );
      }
      if (deadLetter.state !== 'OPEN') {
        throw new ConflictException(
          'La entrada de cola muerta ya no está abierta.',
          {
            deadLetterId,
            state: deadLetter.state,
          },
        );
      }

      const original = await this.projectionRepo.findAttemptForUpdate(
        tx,
        deadLetter.projectionDeliveryAttemptId,
      );
      if (!original) {
        throw new ResourceNotFoundException('Intento original no encontrado.', {
          projectionDeliveryAttemptId: deadLetter.projectionDeliveryAttemptId,
        });
      }

      const attemptNumber =
        (await this.projectionRepo.countAttempts(
          tx,
          original.projectionSubscriptionId,
          original.outboxEventId,
        )) + 1;

      const attempt = this.projectionRepo.createAttempt(tx, {
        projectionSubscriptionId: original.projectionSubscriptionId,
        outboxEventId: original.outboxEventId,
        tenantId: original.tenantId,
        attemptNumber,
        idempotencyKey: original.idempotencyKey,
        payloadHash: dto.payloadHash ?? original.payloadHash,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });

      deadLetter.state = 'REPLAYED';
      deadLetter.resolvedAt = new Date();

      this.logger.info(
        {
          operation: 'xstore.dead-letter.replay',
          deadLetterId,
          attemptId: attempt.id,
        },
        'Entrega reprocesada desde la cola muerta',
      );

      return {
        attemptId: attempt.id,
        attemptNumber,
        idempotencyKey: original.idempotencyKey,
        deadLetterState: deadLetter.state,
      };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  /**
   * Avanza el checkpoint sólo si la posición entrante es mayor. Devuelve si lo
   * movió, que es lo que el worker necesita para saber si puede confirmar el lote.
   */
  private async advanceCheckpoint(
    tx: EntityManager,
    projectionSubscriptionId: string,
    dto: ProcessDeliveryDto,
  ): Promise<boolean> {
    const existing = await this.projectionRepo.findCheckpointForUpdate(
      tx,
      projectionSubscriptionId,
      dto.tenantId,
      dto.partitionKey,
    );

    if (!existing) {
      this.projectionRepo.createCheckpoint(tx, {
        projectionSubscriptionId,
        tenantId: dto.tenantId,
        partitionKey: dto.partitionKey,
        sourcePosition: dto.sourcePosition,
        sourceEventId: dto.outboxEventId,
        targetVersion: dto.targetVersion,
      });
      return true;
    }

    if (BigInt(dto.sourcePosition) <= BigInt(existing.sourcePosition))
      return false;

    existing.sourcePosition = dto.sourcePosition;
    existing.sourceEventId = dto.outboxEventId;
    if (dto.targetVersion) existing.targetVersion = dto.targetVersion;
    existing.checkpointedAt = new Date();
    return true;
  }

  private async touchConsumer(
    tx: EntityManager,
    consumerCode: string,
  ): Promise<void> {
    const consumer = await this.projectionRepo.findConsumerByCodeForUpdate(
      tx,
      consumerCode,
    );
    if (consumer) {
      consumer.heartbeatAt = new Date();
      consumer.state = 'ACTIVE';
      return;
    }
    this.projectionRepo.createConsumer(tx, {
      code: consumerCode,
      state: 'ACTIVE',
    });
  }

  /**
   * Clave estable de la entrega. Se deriva del evento y del contenido: el mismo
   * evento con el mismo payload es la misma escritura, y el consumidor lo
   * reconoce sin que nadie tenga que acordarse de mandar una clave.
   */
  private deriveIdempotencyKey(
    outboxEventId: string,
    payloadHash: string,
  ): string {
    return createHash('sha256')
      .update(outboxEventId)
      .update(payloadHash)
      .digest('hex');
  }
}
