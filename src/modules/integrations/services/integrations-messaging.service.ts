import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  HttpDispatcherService,
  PreconditionFailedException,
  ResourceNotFoundException,
  deriveWebhookSecret,
  joinUrl,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  ProviderConnectionsRepository,
  ExternalProvidersRepository,
  IntegrationEndpointsRepository,
  OutboundMessagesRepository,
  MessageResponsesRepository,
  MessageRetriesRepository,
  InboundMessagesRepository,
} from '../repositories';
import {
  EnqueueOutboundDto,
  DispatchMessageDto,
  OutboundMessageResponseDto,
  DispatchResultDto,
  RetryResultDto,
  DeadLetterResultDto,
  CorrelateResultDto,
} from '../dto';
import { INTEG } from '../integrations.concepts';

/** Nº máximo de intentos de envío antes de dead-letter. */
const MAX_ATTEMPTS = 5;
/** Backoff base (segundos) para el reintento exponencial. */
const BACKOFF_BASE_SECONDS = 60;

/**
 * Casos de uso de mensajería saliente y correlación de callbacks: encolar
 * (UC-12-05), despachar (UC-12-06), reintentar con backoff (UC-12-07), enviar a
 * dead-letter (UC-12-08) y correlacionar la respuesta asíncrona (UC-12-10).
 */
@Injectable()
export class IntegrationsMessagingService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param connectionsRepo - Valor de connections repo requerido por la operación.
   * @param providersRepo - Valor de providers repo requerido por la operación.
   * @param endpointsRepo - Valor de endpoints repo requerido por la operación.
   * @param outboundRepo - Valor de outbound repo requerido por la operación.
   * @param responsesRepo - Valor de responses repo requerido por la operación.
   * @param retriesRepo - Valor de retries repo requerido por la operación.
   * @param inboundRepo - Valor de inbound repo requerido por la operación.
   * @param http - Valor de http requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly connectionsRepo: ProviderConnectionsRepository,
    private readonly providersRepo: ExternalProvidersRepository,
    private readonly endpointsRepo: IntegrationEndpointsRepository,
    private readonly outboundRepo: OutboundMessagesRepository,
    private readonly responsesRepo: MessageResponsesRepository,
    private readonly retriesRepo: MessageRetriesRepository,
    private readonly inboundRepo: InboundMessagesRepository,
    private readonly http: HttpDispatcherService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationsMessagingService.name);
  }

  /** UC-12-05: encola un mensaje saliente de forma idempotente. */
  async enqueueOutbound(
    dto: EnqueueOutboundDto,
    actor: AuthenticatedUser,
  ): Promise<OutboundMessageResponseDto> {
    this.logger.info(
      {
        operation: 'integrations.message.enqueue',
        connectionId: dto.connectionId,
      },
      'Enqueuing outbound message',
    );
    return this.em.transactional(async (tx) => {
      const connection = await this.connectionsRepo.findById(
        tx,
        dto.connectionId,
      );
      if (!connection) {
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionId: dto.connectionId,
        });
      }
      if (connection.stateConceptId !== INTEG.CONN_ACTIVE) {
        throw new PreconditionFailedException('La conexión no está activa', {
          connectionId: dto.connectionId,
        });
      }

      // Idempotencia del productor: la misma clave devuelve la fila existente.
      const existing = await this.outboundRepo.findByIdempotencyKey(
        tx,
        dto.idempotencyKey,
      );
      if (existing) {
        this.logger.info(
          {
            operation: 'integrations.message.enqueue',
            messageId: existing.id,
            idempotent: true,
          },
          'Returning existing outbound message (idempotent)',
        );
        return {
          id: existing.id,
          status: existing.statusConceptId,
          correlationId: existing.correlationId,
          idempotent: true,
        };
      }

      const correlationId = dto.correlationId ?? dto.idempotencyKey;
      const message = this.outboundRepo.create(tx, {
        connectionId: dto.connectionId,
        correlationId,
        requestPayloadJson: dto.requestPayloadJson,
        statusConceptId: INTEG.MSG_QUEUED,
        payloadVersion: 1,
        idempotencyKey: dto.idempotencyKey,
        endpointId: dto.endpointId,
        headersJson: dto.headersJson,
        scheduledAt: new Date(),
        sourceResourceType: dto.sourceResourceType,
        sourceResourceId: dto.sourceResourceId,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: message.id,
        status: message.statusConceptId,
        correlationId,
        idempotent: false,
      };
    });
  }

  /** UC-12-06: despacha un mensaje QUEUED y registra su respuesta. */
  async dispatch(
    messageId: string,
    dto: DispatchMessageDto,
    actor: AuthenticatedUser,
  ): Promise<DispatchResultDto> {
    this.logger.info(
      { operation: 'integrations.message.dispatch', messageId },
      'Dispatching message',
    );
    return this.em.transactional(async (tx) => {
      const message = await this.outboundRepo.findById(tx, messageId);
      if (!message)
        throw new ResourceNotFoundException('Mensaje no encontrado', {
          messageId,
        });
      if (message.statusConceptId !== INTEG.MSG_QUEUED) {
        throw new PreconditionFailedException('El mensaje no está en cola', {
          messageId,
        });
      }

      // Resuelve el destino real: base_url del proveedor + path del endpoint.
      const connection = await this.connectionsRepo.findById(
        tx,
        message.connectionId,
      );
      if (!connection) {
        throw new ResourceNotFoundException('Conexión no encontrada', {
          connectionId: message.connectionId,
        });
      }
      const provider = await this.providersRepo.findById(
        tx,
        connection.providerId,
      );
      if (!provider?.baseUrl) {
        throw new PreconditionFailedException(
          'El proveedor no tiene base_url configurada para el despacho',
          { connectionId: connection.id, providerId: connection.providerId },
        );
      }
      let path: string | undefined;
      let endpointTimeoutMs: number | undefined;
      if (message.endpointId) {
        const endpoint = await this.endpointsRepo.findById(
          tx,
          message.endpointId,
        );
        path = endpoint?.path;
        endpointTimeoutMs = endpoint?.timeoutMs;
      }
      const url = joinUrl(provider.baseUrl, path);

      // Firma el cuerpo con el secreto de la conexión (guarda anti-SSRF dentro).
      const secret = deriveWebhookSecret('connection', connection.id); // TODO secreto por conexión
      const outcome = await this.http.post({
        url,
        body: message.requestPayloadJson,
        secret,
        headers: message.headersJson as Record<string, string> | undefined,
        timeoutMs: endpointTimeoutMs ?? undefined,
      });

      const isSuccess = outcome.ok;
      const now = new Date();
      message.statusConceptId = isSuccess ? INTEG.MSG_SENT : INTEG.MSG_FAILED;
      message.sentAt = now;
      touch(message, actor.id);

      const response = this.responsesRepo.create(tx, {
        outboundMessageId: message.id,
        responsePayloadJson:
          outcome.responseBody ??
          (isSuccess ? { ok: true } : { error: outcome.errorText }),
        httpStatus: outcome.httpStatus,
        latencyMs: outcome.latencyMs,
        isSuccess,
        receivedAt: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'integrations.message.dispatch',
          messageId,
          isSuccess,
          httpStatus: outcome.httpStatus,
          latencyMs: outcome.latencyMs,
        },
        isSuccess ? 'Message sent' : 'Message failed',
      );
      return {
        id: message.id,
        status: message.statusConceptId,
        isSuccess,
        responseId: response.id,
      };
    });
  }

  /** UC-12-07: programa un reintento con backoff exponencial. */
  async retry(
    messageId: string,
    actor: AuthenticatedUser,
  ): Promise<RetryResultDto> {
    this.logger.info(
      { operation: 'integrations.message.retry', messageId },
      'Scheduling retry',
    );
    return this.em.transactional(async (tx) => {
      const message = await this.outboundRepo.findById(tx, messageId);
      if (!message)
        throw new ResourceNotFoundException('Mensaje no encontrado', {
          messageId,
        });
      if (message.statusConceptId !== INTEG.MSG_FAILED) {
        throw new PreconditionFailedException(
          'El mensaje no está en estado fallido',
          { messageId },
        );
      }

      const attemptNumber =
        (await this.retriesRepo.maxAttempt(tx, messageId)) + 1;
      if (attemptNumber > MAX_ATTEMPTS) {
        throw new PreconditionFailedException(
          'Se agotaron los reintentos (usar dead-letter)',
          {
            messageId,
            attemptNumber,
          },
        );
      }

      const now = new Date();
      const backoffMs = BACKOFF_BASE_SECONDS * 1000 * 2 ** (attemptNumber - 1);
      const nextRetryAt = new Date(now.getTime() + backoffMs);

      this.retriesRepo.create(tx, {
        outboundMessageId: messageId,
        attemptNumber,
        statusConceptId: INTEG.RETRY_SCHEDULED,
        payloadVersion: message.payloadVersion,
        requestSnapshotJson: message.requestPayloadJson,
        attemptedAt: now,
        nextRetryAt,
        actorUserId: actor.id,
      });

      message.statusConceptId = INTEG.MSG_QUEUED;
      message.scheduledAt = nextRetryAt;
      touch(message, actor.id);
      await tx.flush();

      return {
        messageId,
        attemptNumber,
        status: message.statusConceptId,
        nextRetryAt,
      };
    });
  }

  /** UC-12-08: envía a dead-letter tras agotar reintentos (idempotente). */
  async deadLetter(
    messageId: string,
    actor: AuthenticatedUser,
  ): Promise<DeadLetterResultDto> {
    this.logger.info(
      { operation: 'integrations.message.deadLetter', messageId },
      'Dead-lettering message',
    );
    return this.em.transactional(async (tx) => {
      const message = await this.outboundRepo.findById(tx, messageId);
      if (!message)
        throw new ResourceNotFoundException('Mensaje no encontrado', {
          messageId,
        });

      // Transición terminal idempotente.
      if (message.statusConceptId === INTEG.MSG_DEAD_LETTER) {
        return {
          messageId,
          status: message.statusConceptId,
          alreadyDeadLettered: true,
        };
      }
      if (message.statusConceptId !== INTEG.MSG_FAILED) {
        throw new PreconditionFailedException(
          'El mensaje no está en estado fallido',
          { messageId },
        );
      }

      const attemptNumber =
        (await this.retriesRepo.maxAttempt(tx, messageId)) + 1;
      message.statusConceptId = INTEG.MSG_DEAD_LETTER;
      touch(message, actor.id);

      this.retriesRepo.create(tx, {
        outboundMessageId: messageId,
        attemptNumber,
        statusConceptId: INTEG.RETRY_EXHAUSTED,
        payloadVersion: message.payloadVersion,
        errorText: 'max retries exhausted',
        requestSnapshotJson: message.requestPayloadJson,
        attemptedAt: new Date(),
        nextRetryAt: undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.warn(
        { operation: 'integrations.message.deadLetter', messageId },
        'Message dead-lettered',
      );
      return {
        messageId,
        status: message.statusConceptId,
        alreadyDeadLettered: false,
      };
    });
  }

  /** UC-12-10: correlaciona un mensaje entrante RECEIVED con su saliente. */
  async correlate(
    inboundMessageId: string,
    actor: AuthenticatedUser,
  ): Promise<CorrelateResultDto> {
    this.logger.info(
      { operation: 'integrations.message.correlate', inboundMessageId },
      'Correlating inbound callback',
    );
    return this.em.transactional(async (tx) => {
      const inbound = await this.inboundRepo.findById(tx, inboundMessageId);
      if (!inbound) {
        throw new ResourceNotFoundException('Mensaje entrante no encontrado', {
          inboundMessageId,
        });
      }
      if (inbound.statusConceptId !== INTEG.INBOUND_RECEIVED) {
        throw new PreconditionFailedException(
          'El mensaje entrante no está en estado recibido',
          {
            inboundMessageId,
          },
        );
      }
      if (!inbound.correlationId) {
        throw new PreconditionFailedException(
          'El mensaje entrante no tiene correlación',
          {
            inboundMessageId,
          },
        );
      }

      const outbound = await this.outboundRepo.findByCorrelationId(
        tx,
        inbound.correlationId,
      );
      if (!outbound) {
        throw new ResourceNotFoundException(
          'No hay mensaje saliente correlacionado',
          {
            correlationId: inbound.correlationId,
          },
        );
      }

      outbound.statusConceptId = INTEG.MSG_ACKNOWLEDGED;
      touch(outbound, actor.id);

      this.responsesRepo.create(tx, {
        outboundMessageId: outbound.id,
        responsePayloadJson: inbound.payloadJson,
        httpStatus: 200,
        isSuccess: true,
        receivedAt: new Date(),
        actorUserId: actor.id,
      });

      inbound.statusConceptId = INTEG.INBOUND_PROCESSED;
      touch(inbound, actor.id);
      await tx.flush();

      return {
        inboundMessageId: inbound.id,
        outboundMessageId: outbound.id,
        status: inbound.statusConceptId,
      };
    });
  }
}
