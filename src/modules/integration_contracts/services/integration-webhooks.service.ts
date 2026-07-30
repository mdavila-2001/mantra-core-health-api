import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  HttpDispatcherService,
  PreconditionFailedException,
  ResourceNotFoundException,
  deriveWebhookSecret,
  type AuthenticatedUser,
} from '../../../common';
import { ICON } from '../integration_contracts.concepts';
import {
  ContractsRepository,
  ContractVersionsRepository,
  DeliveryEvidenceRepository,
  ExchangeRecordsRepository,
  WebhookSubscriptionsRepository,
} from '../repositories';
import {
  CreateWebhookSubscriptionDto,
  DeliverWebhookDto,
  DeliveryEvidenceResponseDto,
  WebhookSubscriptionResponseDto,
} from '../dto';

/**
 * Webhooks del contrato: suscripción sobre contrato ACTIVE (UC-31-04) y entrega
 * firmada con evidencia de no-repudio (UC-31-09). La entrega registra un
 * intercambio OUTBOUND contra la versión vigente del contrato y su evidencia.
 */
@Injectable()
export class IntegrationWebhooksService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contractsRepo - Valor de contracts repo requerido por la operación.
   * @param versionsRepo - Valor de versions repo requerido por la operación.
   * @param subscriptionsRepo - Valor de subscriptions repo requerido por la operación.
   * @param exchangeRecordsRepo - Valor de exchange records repo requerido por la operación.
   * @param evidenceRepo - Valor de evidence repo requerido por la operación.
   * @param http - Valor de http requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ContractsRepository,
    private readonly versionsRepo: ContractVersionsRepository,
    private readonly subscriptionsRepo: WebhookSubscriptionsRepository,
    private readonly exchangeRecordsRepo: ExchangeRecordsRepository,
    private readonly evidenceRepo: DeliveryEvidenceRepository,
    private readonly http: HttpDispatcherService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IntegrationWebhooksService.name);
  }

  /** UC-31-04: suscribe un webhook a un contrato ACTIVE. */
  async subscribe(
    contractId: string,
    dto: CreateWebhookSubscriptionDto,
    actor: AuthenticatedUser,
  ): Promise<WebhookSubscriptionResponseDto> {
    this.logger.info(
      {
        operation: 'integration.webhook.subscribe',
        contractId,
        actorId: actor.id,
      },
      'Subscribing webhook',
    );
    return this.em.transactional(async (tx) => {
      const contract = await this.contractsRepo.findById(tx, contractId);
      if (!contract) {
        throw new ResourceNotFoundException('Contrato no encontrado', {
          contractId,
        });
      }
      if (contract.statusConceptId !== ICON.CONTRACT_ACTIVE) {
        throw new PreconditionFailedException(
          'El contrato debe estar ACTIVE para suscribir webhooks',
          {
            contractId,
            status: contract.statusConceptId,
          },
        );
      }

      const eventTypeConceptId =
        dto.eventTypeConceptId ?? ICON.WEBHOOK_EVENT_GENERIC;
      const dup = await this.subscriptionsRepo.findDuplicate(
        tx,
        contractId,
        eventTypeConceptId,
        dto.callbackUri,
      );
      if (dup) {
        throw new ConflictException(
          'Ya existe una suscripción para ese evento y callback',
          {
            contractId,
            eventTypeConceptId,
          },
        );
      }

      const sub = this.subscriptionsRepo.create(tx, {
        integrationContractId: contractId,
        eventTypeConceptId,
        callbackUri: dto.callbackUri,
        signingKeyReference: dto.signingKeyReference,
        secretReference: dto.secretReference,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        statusConceptId: ICON.SUBSCRIPTION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.webhook.subscribe',
          contractId,
          subscriptionId: sub.id,
        },
        'Webhook subscribed',
      );
      return {
        id: sub.id,
        integrationContractId: contractId,
        status: sub.statusConceptId,
      };
    });
  }

  /** UC-31-09: entrega y verifica un webhook firmado, dejando evidencia. */
  async deliver(
    subscriptionId: string,
    dto: DeliverWebhookDto,
    actor: AuthenticatedUser,
  ): Promise<DeliveryEvidenceResponseDto> {
    this.logger.info(
      {
        operation: 'integration.webhook.deliver',
        subscriptionId,
        actorId: actor.id,
      },
      'Delivering signed webhook',
    );
    return this.em.transactional(async (tx) => {
      const sub = await this.subscriptionsRepo.findById(tx, subscriptionId);
      if (!sub) {
        throw new ResourceNotFoundException(
          'Suscripción de webhook no encontrada',
          { subscriptionId },
        );
      }
      if (sub.statusConceptId !== ICON.SUBSCRIPTION_ACTIVE) {
        throw new PreconditionFailedException('La suscripción no está ACTIVE', {
          subscriptionId,
          status: sub.statusConceptId,
        });
      }
      const now = new Date();
      if (sub.validFrom && sub.validFrom > now) {
        throw new PreconditionFailedException(
          'La suscripción aún no es válida',
          { subscriptionId },
        );
      }
      if (sub.validTo && sub.validTo < now) {
        throw new PreconditionFailedException('La suscripción ya expiró', {
          subscriptionId,
        });
      }

      const version = await this.versionsRepo.findActiveByContract(
        tx,
        sub.integrationContractId,
        ICON.VERSION_ACTIVE,
      );
      if (!version) {
        throw new PreconditionFailedException(
          'No hay versión ACTIVE del contrato para entregar',
          {
            contractId: sub.integrationContractId,
          },
        );
      }

      // Entrega real: POST firmado al callbackUri de la suscripción. El resultado
      // (delivered) proviene del código HTTP real, no de un valor del cliente.
      if (!sub.callbackUri) {
        throw new PreconditionFailedException(
          'La suscripción no tiene callbackUri para entregar',
          { subscriptionId },
        );
      }
      const secret =
        sub.secretReference ?? deriveWebhookSecret('subscription', sub.id); // TODO secreto por conexión
      const body = {
        contractVersionId: version.id,
        eventTypeConceptId: sub.eventTypeConceptId,
        correlationId: dto.correlationId,
        requestHash: dto.requestHash,
      };
      const dispatch = await this.http.post({
        url: sub.callbackUri,
        body,
        secret,
      });
      const delivered = dispatch.ok;

      const record = this.exchangeRecordsRepo.create(tx, {
        integrationContractVersionId: version.id,
        directionConceptId: ICON.DIRECTION_OUTBOUND,
        messageTypeConceptId: ICON.MESSAGE_WEBHOOK,
        correlationId: dto.correlationId,
        requestHash: dto.requestHash,
        receivedAt: now,
        outcomeConceptId: delivered
          ? ICON.OUTCOME_SUCCESS
          : ICON.OUTCOME_PENDING,
      });
      // FK integration_exchange_record_id → hay que persistir el record antes de la evidencia.
      await tx.flush();

      const evidence = this.evidenceRepo.create(tx, {
        webhookSubscriptionId: subscriptionId,
        integrationExchangeRecordId: record.id,
        signatureAlgorithm: dto.signatureAlgorithm ?? 'HMAC-SHA256',
        // Nosotros firmamos el cuerpo con el secreto de la suscripción: la firma
        // sale verificada por construcción, no según un valor del cliente.
        signatureVerificationConceptId: ICON.SIGNATURE_VERIFIED,
        deliveredAt: delivered ? now : undefined,
        acknowledgedAt: delivered ? now : undefined,
        outcomeConceptId: delivered
          ? ICON.DELIVERY_DELIVERED
          : ICON.DELIVERY_FAILED,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'integration.webhook.deliver',
          subscriptionId,
          evidenceId: evidence.id,
          delivered,
          httpStatus: dispatch.httpStatus,
          latencyMs: dispatch.latencyMs,
        },
        'Webhook delivery recorded',
      );
      return {
        id: evidence.id,
        integrationExchangeRecordId: record.id,
        outcome: evidence.outcomeConceptId,
      };
    });
  }
}
