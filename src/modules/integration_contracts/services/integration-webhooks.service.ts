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
  constructor(
    private readonly em: EntityManager,
    private readonly contractsRepo: ContractsRepository,
    private readonly versionsRepo: ContractVersionsRepository,
    private readonly subscriptionsRepo: WebhookSubscriptionsRepository,
    private readonly exchangeRecordsRepo: ExchangeRecordsRepository,
    private readonly evidenceRepo: DeliveryEvidenceRepository,
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

      const delivered = (dto.outcome ?? 'DELIVERED') === 'DELIVERED';
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
        signatureAlgorithm: dto.signatureAlgorithm,
        signatureVerificationConceptId:
          dto.signatureVerified === false
            ? ICON.SIGNATURE_FAILED
            : ICON.SIGNATURE_VERIFIED,
        deliveredAt: delivered ? now : undefined,
        acknowledgedAt: dto.acknowledged ? now : undefined,
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
